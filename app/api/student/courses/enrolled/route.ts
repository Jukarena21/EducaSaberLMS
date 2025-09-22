import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'

    // Obtener cursos inscritos
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { 
        userId,
        status: status as any
      },
      include: {
        course: {
          include: {
            competency: true,
            courseModules: {
              include: {
                module: {
                  include: {
                    moduleLessons: {
                      include: {
                        lesson: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    })

    // Obtener progreso de lecciones
    const lessonProgress = await prisma.studentLessonProgress.findMany({
      where: { userId },
      include: {
        lesson: true
      }
    })

    // Procesar datos de cursos inscritos
    const enrolledCourses = enrollments.map(enrollment => {
      const course = enrollment.course
      
      const totalLessons = course.courseModules.reduce((acc, cm) => 
        acc + cm.module.moduleLessons.length, 0
      )
      
      const totalModules = course.courseModules.length
      
      // Calcular lecciones completadas
      const completedLessons = lessonProgress.filter(lp => 
        course.courseModules.some(cm => 
          cm.module.moduleLessons.some(ml => ml.lessonId === lp.lessonId)
        ) && lp.status === 'completed'
      ).length

      // Calcular tiempo total invertido
      const contentProgress = lessonProgress.filter(lp => 
        course.courseModules.some(cm => 
          cm.module.moduleLessons.some(ml => ml.lessonId === lp.lessonId)
        )
      )

      const totalTimeMinutes = contentProgress.reduce((acc, lp) => 
        acc + (lp.timeSpentMinutes || 0), 0
      )

      const progressPercentage = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100) 
        : 0

      // Calcular progreso por módulo
      const modulesProgress = course.courseModules.map(cm => {
        const moduleLessons = cm.module.moduleLessons
        const completedModuleLessons = lessonProgress.filter(lp => 
          moduleLessons.some(ml => ml.lessonId === lp.lessonId) && lp.status === 'completed'
        ).length
        
        const moduleTimeMinutes = contentProgress
          .filter(lp => moduleLessons.some(ml => ml.lessonId === lp.lessonId))
          .reduce((acc, lp) => acc + (lp.timeSpentMinutes || 0), 0)

        return {
          id: cm.module.id,
          title: cm.module.title,
          description: cm.module.description,
          orderIndex: cm.module.orderIndex,
          totalLessons: moduleLessons.length,
          completedLessons,
          progressPercentage: moduleLessons.length > 0 
            ? Math.round((completedModuleLessons / moduleLessons.length) * 100) 
            : 0,
          timeSpentMinutes: moduleTimeMinutes,
          estimatedTimeMinutes: cm.module.estimatedTimeMinutes || 0
        }
      })

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        competency: course.competency?.name || 'General',
        competencyDisplayName: course.competency?.displayName || 'General',
        academicGrade: course.academicGrade,
        totalModules,
        totalLessons,
        completedLessons,
        progressPercentage,
        timeSpentMinutes: totalTimeMinutes,
        estimatedTimeMinutes: course.estimatedTimeMinutes || 0,
        modules: modulesProgress.sort((a, b) => a.orderIndex - b.orderIndex),
        enrollment: {
          id: enrollment.id,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          lastActivityAt: enrollment.lastActivityAt
        }
      }
    })

    return NextResponse.json(enrolledCourses)

  } catch (error) {
    console.error('Error fetching enrolled courses:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
