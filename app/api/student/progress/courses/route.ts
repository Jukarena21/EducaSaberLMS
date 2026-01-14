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
        isActive: true
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
            moduleLessons: {
              include: {
                module: {
                  include: {
                    competency: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Obtener progreso de contenido del estudiante (usando studentLessonProgress)
    const contentProgress = await prisma.studentLessonProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          include: {
            moduleLessons: {
              include: {
                module: {
                  include: {
                    competency: true
                  }
                }
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
        .reduce((acc, cp) => acc + (cp.totalTimeMinutes || 0), 0)

      // Calcular progreso por módulo
      const modulesProgress = course.courseModules.map(cm => {
        const moduleLessons = cm.module.moduleLessons
        const completedModuleLessons = lessonProgress.filter(lp => 
          moduleLessons.some(ml => ml.lessonId === lp.lessonId) && lp.status === 'completed'
        ).length
        
        const moduleTimeMinutes = contentProgress
          .filter(cp => moduleLessons.some(ml => ml.lessonId === cp.lessonId))
          .reduce((acc, cp) => acc + (cp.totalTimeMinutes || 0), 0)

        const moduleProgressPercentage = moduleLessons.length > 0 
          ? Math.round((completedModuleLessons / moduleLessons.length) * 100) 
          : 0

        return {
          id: cm.module.id,
          title: cm.module.title,
          description: cm.module.description,
          orderIndex: cm.module.orderIndex,
          totalLessons: moduleLessons.length,
          completedLessons: completedModuleLessons,
          progressPercentage: moduleProgressPercentage,
          timeSpentMinutes: moduleTimeMinutes,
          estimatedTimeMinutes: cm.module.estimatedTimeMinutes || 0,
          isCompleted: moduleProgressPercentage === 100
        }
      })

      const progressPercentage = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100) 
        : 0

      // Calcular métricas adicionales
      const completedModules = modulesProgress.filter(m => m.isCompleted).length
      const moduleCompletionRate = totalModules > 0 
        ? Math.round((completedModules / totalModules) * 100) 
        : 0
      
      const averageTimePerLesson = completedLessons > 0
        ? Math.round(totalTimeMinutes / completedLessons)
        : 0

      // Encontrar próxima lección pendiente
      let nextLesson = null
      for (const cm of course.courseModules.sort((a, b) => a.module.orderIndex - b.module.orderIndex)) {
        for (const ml of cm.module.moduleLessons.sort((a, b) => a.orderIndex - b.orderIndex)) {
          const lessonProg = lessonProgress.find(lp => lp.lessonId === ml.lessonId)
          if (!lessonProg || lessonProg.status !== 'completed') {
            nextLesson = {
              id: ml.lesson.id,
              title: ml.lesson.title,
              moduleTitle: cm.module.title,
              orderIndex: ml.orderIndex
            }
            break
          }
        }
        if (nextLesson) break
      }

      // Calcular días desde última actividad
      const lastActivityDate = enrollment.lastActivityAt || enrollment.enrolledAt
      const daysSinceLastActivity = lastActivityDate
        ? Math.floor((new Date().getTime() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
        : null

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        competency: course.competency?.name || 'General',
        academicGrade: course.academicGrade,
        totalModules,
        completedModules,
        moduleCompletionRate,
        totalLessons,
        completedLessons,
        progressPercentage,
        timeSpentMinutes: totalTimeMinutes,
        averageTimePerLesson,
        estimatedTimeMinutes: course.estimatedTimeMinutes || 0,
        modules: modulesProgress.sort((a, b) => a.orderIndex - b.orderIndex),
        enrolledAt: enrollment.enrolledAt,
        lastActivityAt: enrollment.lastActivityAt,
        daysSinceLastActivity,
        nextLesson
      }
    })

    return NextResponse.json(coursesProgress)

  } catch (error) {
    console.error('Error fetching course progress:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
