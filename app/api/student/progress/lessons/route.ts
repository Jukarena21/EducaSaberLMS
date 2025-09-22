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
    const courseId = searchParams.get('courseId')
    const competencyId = searchParams.get('competencyId')

    // Construir filtros
    let whereClause: any = { userId }
    
    if (courseId) {
      whereClause.lesson = {
        modules: {
          some: {
            courseModules: {
              some: {
                courseId
              }
            }
          }
        }
      }
    }

    if (competencyId) {
      whereClause.lesson = {
        ...whereClause.lesson,
        modules: {
          some: {
            competencyId
          }
        }
      }
    }

    // Obtener progreso de lecciones
    const lessonProgress = await prisma.studentLessonProgress.findMany({
      where: whereClause,
      include: {
        lesson: {
          include: {
            modules: {
              include: {
                competency: true,
                courseModules: {
                  include: {
                    course: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Obtener progreso de contenido
    const contentProgress = await prisma.studentContentProgress.findMany({
      where: { userId },
      include: {
        lesson: true
      }
    })

    // Procesar datos
    const lessonsData = lessonProgress.map(lp => {
      const lesson = lp.lesson
      const module = lesson.modules?.[0]
      const course = module?.courseModules?.[0]?.course
      const competency = module?.competency

      // Obtener tiempo invertido en esta lección
      const timeSpent = contentProgress
        .filter(cp => cp.lessonId === lesson.id)
        .reduce((acc, cp) => acc + (cp.timeSpentMinutes || 0), 0)

      // Obtener progreso por tipo de contenido
      const videoProgress = contentProgress.find(cp => 
        cp.lessonId === lesson.id && cp.contentType === 'video'
      )
      const theoryProgress = contentProgress.find(cp => 
        cp.lessonId === lesson.id && cp.contentType === 'theory'
      )
      const exercisesProgress = contentProgress.find(cp => 
        cp.lessonId === lesson.id && cp.contentType === 'exercises'
      )

      return {
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        estimatedTimeMinutes: lesson.estimatedTimeMinutes,
        timeSpentMinutes: timeSpent,
        status: lp.status,
        progressPercentage: lp.progressPercentage,
        completedAt: lp.completedAt,
        lastAccessedAt: lp.lastAccessedAt,
        course: course ? {
          id: course.id,
          title: course.title,
          academicGrade: course.academicGrade
        } : null,
        competency: competency ? {
          id: competency.id,
          name: competency.name,
          displayName: competency.displayName
        } : null,
        module: module ? {
          id: module.id,
          title: module.title,
          orderIndex: module.orderIndex
        } : null,
        contentProgress: {
          video: {
            completed: videoProgress?.status === 'completed',
            timeSpent: videoProgress?.timeSpentMinutes || 0,
            lastAccessed: videoProgress?.lastAccessedAt
          },
          theory: {
            completed: theoryProgress?.status === 'completed',
            timeSpent: theoryProgress?.timeSpentMinutes || 0,
            lastAccessed: theoryProgress?.lastAccessedAt
          },
          exercises: {
            completed: exercisesProgress?.status === 'completed',
            timeSpent: exercisesProgress?.timeSpentMinutes || 0,
            lastAccessed: exercisesProgress?.lastAccessedAt
          }
        }
      }
    })

    return NextResponse.json(lessonsData)

  } catch (error) {
    console.error('Error fetching lesson progress:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
