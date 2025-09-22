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

    // Obtener cursos en los que está inscrito el estudiante
    const courseEnrollments = await prisma.courseEnrollment.findMany({
      where: { 
        userId,
        status: 'active'
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
      }
    })

    // Obtener progreso de lecciones del estudiante
    const lessonProgress = await prisma.studentLessonProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          include: {
            modules: {
              include: {
                competency: true
              }
            }
          }
        }
      }
    })

    // Obtener progreso de contenido del estudiante
    const contentProgress = await prisma.studentContentProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          include: {
            modules: {
              include: {
                competency: true
              }
            }
          }
        }
      }
    })

    // Procesar datos para cada curso
    const coursesProgress = courseEnrollments.map(enrollment => {
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
      const totalTimeMinutes = contentProgress
        .filter(cp => 
          course.courseModules.some(cm => 
            cm.module.moduleLessons.some(ml => ml.lessonId === cp.lessonId)
          )
        )
        .reduce((acc, cp) => acc + (cp.timeSpentMinutes || 0), 0)

      // Calcular progreso por módulo
      const modulesProgress = course.courseModules.map(cm => {
        const moduleLessons = cm.module.moduleLessons
        const completedModuleLessons = lessonProgress.filter(lp => 
          moduleLessons.some(ml => ml.lessonId === lp.lessonId) && lp.status === 'completed'
        ).length
        
        const moduleTimeMinutes = contentProgress
          .filter(cp => moduleLessons.some(ml => ml.lessonId === cp.lessonId))
          .reduce((acc, cp) => acc + (cp.timeSpentMinutes || 0), 0)

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

      const progressPercentage = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100) 
        : 0

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        competency: course.competency?.name || 'General',
        academicGrade: course.academicGrade,
        totalModules,
        totalLessons,
        completedLessons,
        progressPercentage,
        timeSpentMinutes: totalTimeMinutes,
        estimatedTimeMinutes: course.estimatedTimeMinutes || 0,
        modules: modulesProgress.sort((a, b) => a.orderIndex - b.orderIndex),
        enrolledAt: enrollment.enrolledAt,
        lastActivityAt: enrollment.lastActivityAt
      }
    })

    return NextResponse.json(coursesProgress)

  } catch (error) {
    console.error('Error fetching course progress:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
