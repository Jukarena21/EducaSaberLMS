import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const gate = await requireRole(['teacher_admin','school_admin'])
    if (!gate.allowed) return NextResponse.json({ error: gate.error }, { status: gate.status })

    // Restricciones de rol
    if (!gate.session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    if (gate.session.user.role === 'school_admin' && !gate.session.user.schoolId) {
      return NextResponse.json({ error: 'Usuario sin colegio asignado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    // Para school_admin, forzar el filtro por su schoolId
    const schoolId = gate.session.user.role === 'school_admin' 
      ? gate.session.user.schoolId 
      : (searchParams.get('schoolId') || undefined)
    const courseId = searchParams.get('courseId') || undefined

    // Rango de fechas (por defecto últimos 30 días)
    const to = toParam ? new Date(toParam) : new Date()
    const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Construir filtros
    const whereCourse: any = {}
    if (schoolId) {
      whereCourse.courseSchools = {
        some: {
          schoolId: schoolId
        }
      }
    }
    if (courseId) whereCourse.id = courseId

    // Métricas de engagement
    const [
      totalLessonsCompleted,
      totalStudyTime,
      averageSessionDuration,
      activeUsers,
      courseCompletions,
      lessonProgress
    ] = await Promise.all([
      // Lecciones completadas
      prisma.studentLessonProgress.count({
        where: {
          status: 'completed',
          updatedAt: { gte: from, lte: to },
          lesson: {
            moduleLessons: {
              some: {
                module: {
                  courseModules: {
                    some: {
                      course: whereCourse
                    }
                  }
                }
              }
            }
          }
        }
      }),
      
      // Tiempo total de estudio (en minutos)
      prisma.studentLessonProgress.aggregate({
        where: {
          updatedAt: { gte: from, lte: to },
          lesson: {
            moduleLessons: {
              some: {
                module: {
                  courseModules: {
                    some: {
                      course: whereCourse
                    }
                  }
                }
              }
            }
          }
        },
        _sum: {
          totalTimeMinutes: true
        }
      }),
      
      // Duración promedio de sesión
      prisma.examResult.aggregate({
        where: {
          createdAt: { gte: from, lte: to },
          exam: {
            course: whereCourse
          }
        },
        _avg: {
          timeTakenMinutes: true
        }
      }),
      
      // Usuarios activos (que han completado al menos una lección o examen)
      prisma.user.count({
        where: {
          role: 'student',
          OR: [
            {
              studentLessonProgress: {
                some: {
                  status: 'completed',
                  updatedAt: { gte: from, lte: to }
                }
              }
            },
            {
              examResults: {
                some: {
                  createdAt: { gte: from, lte: to }
                }
              }
            }
          ]
        }
      }),
      
      // Cursos completados
      prisma.courseEnrollment.count({
        where: {
          completedAt: { not: null },
          updatedAt: { gte: from, lte: to },
          course: whereCourse
        }
      }),
      
      // Progreso por lección (usar el período from/to en lugar de hardcoded 7 días)
      prisma.studentLessonProgress.findMany({
        where: {
          updatedAt: { gte: from, lte: to },
          lesson: {
            moduleLessons: {
              some: {
                module: {
                  courseModules: {
                    some: {
                      course: whereCourse
                    }
                  }
                }
              }
            }
          }
        },
        select: {
          status: true,
          updatedAt: true
        }
      })
    ])

    // Calcular métricas derivadas
    const totalStudyTimeHours = Math.round((totalStudyTime._sum.totalTimeMinutes || 0) / 60 * 10) / 10
    const averageSessionDurationMinutes = Math.round((averageSessionDuration._avg.timeTakenMinutes || 0) * 10) / 10
    
    // Progreso promedio de lecciones
    const averageProgress = lessonProgress.length > 0 
      ? lessonProgress.reduce((sum, lp) => sum + (lp.status === 'completed' ? 100 : 0), 0) / lessonProgress.length
      : 0

    // Tasa de finalización de lecciones
    const completionRate = lessonProgress.length > 0
      ? (lessonProgress.filter(lp => lp.status === 'completed').length / lessonProgress.length) * 100
      : 0

    return NextResponse.json({
      totalLessonsCompleted,
      totalStudyTimeHours,
      averageSessionDurationMinutes,
      activeUsers,
      courseCompletions,
      averageProgress: Math.round(averageProgress * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      range: { from: from.toISOString(), to: to.toISOString() }
    })
  } catch (error) {
    console.error('Error fetching engagement metrics:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
