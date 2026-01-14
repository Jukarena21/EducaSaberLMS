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

    // Obtener información del estudiante para comparación con grupo
    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true }
    })

    // Determinar si el estudiante es tipo ICFES (basado en si está inscrito en cursos ICFES)
    const courseEnrollments = await prisma.courseEnrollment.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        course: {
          select: {
            isIcfesCourse: true
          }
        }
      }
    })

    const isIcfesStudent = courseEnrollments.some(enrollment => enrollment.course.isIcfesCourse)

    // Competencias ICFES (nombres exactos)
    const ICFES_COMPETENCY_NAMES = [
      'lectura_critica',
      'razonamiento_cuantitativo',
      'competencias_ciudadanas',
      'comunicacion_escrita',
      'ingles',
      // Aliases para compatibilidad
      'matematicas',
      'ciencias_naturales',
      'ciencias_sociales',
      'sociales_y_ciudadanas'
    ]

    // Obtener competencias según el tipo de estudiante
    let competencies
    if (isIcfesStudent) {
      // Si es estudiante ICFES, solo mostrar competencias ICFES
      competencies = await prisma.competency.findMany({
        where: {
          OR: [
            { name: { in: ICFES_COMPETENCY_NAMES } },
            { displayName: { in: ['Lectura Crítica', 'Razonamiento Cuantitativo', 'Competencias Ciudadanas', 'Comunicación Escrita', 'Inglés', 'Matemáticas', 'Ciencias Naturales', 'Ciencias Sociales y Ciudadanas'] } }
          ],
          name: { not: 'otros' }
        },
        orderBy: { name: 'asc' }
      })
    } else {
      // Si no es ICFES, mostrar todas excepto ICFES y "otros"
      competencies = await prisma.competency.findMany({
        where: {
          AND: [
            { name: { not: 'otros' } },
            { name: { notIn: ICFES_COMPETENCY_NAMES } },
            { displayName: { notIn: ['Lectura Crítica', 'Razonamiento Cuantitativo', 'Competencias Ciudadanas', 'Comunicación Escrita', 'Inglés', 'Matemáticas', 'Ciencias Naturales', 'Ciencias Sociales y Ciudadanas'] } }
          ]
        },
        orderBy: { name: 'asc' }
      })
    }

    // Obtener IDs de competencias para filtrar lecciones y contenido
    const competencyIds = competencies.map(c => c.id)

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

    // Filtrar lecciones que pertenecen a las competencias relevantes
    const filteredLessonProgress = lessonProgress.filter((lp: any) => 
      lp.lesson.moduleLessons?.some((ml: any) => competencyIds.includes(ml.module.competencyId))
    )

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

    // Filtrar contenido que pertenece a las competencias relevantes
    const filteredContentProgress = contentProgress.filter((cp: any) => 
      cp.lesson.moduleLessons?.some((ml: any) => competencyIds.includes(ml.module.competencyId))
    )

    // Obtener resultados de exámenes por competencia
    // Si es estudiante ICFES, filtrar solo exámenes de competencias ICFES
    let examResultsWhere: any = { userId }
    
    if (isIcfesStudent) {
      // Obtener IDs de competencias ICFES para filtrar exámenes
      const icfesCompetencyIds = competencies.map(c => c.id)
      examResultsWhere.exam = {
        competencyId: { in: icfesCompetencyIds }
      }
    } else {
      // Si no es ICFES, excluir exámenes de competencias ICFES
      const icfesCompetencyIds = await prisma.competency.findMany({
        where: {
          OR: [
            { name: { in: ICFES_COMPETENCY_NAMES } },
            { displayName: { in: ['Lectura Crítica', 'Razonamiento Cuantitativo', 'Competencias Ciudadanas', 'Comunicación Escrita', 'Inglés', 'Matemáticas', 'Ciencias Naturales', 'Ciencias Sociales y Ciudadanas'] } }
          ]
        },
        select: { id: true }
      }).then(comps => comps.map(c => c.id))
      
      const icfesIds = await icfesCompetencyIds
      examResultsWhere.exam = {
        competencyId: { notIn: icfesIds }
      }
    }

    const examResults = await prisma.examResult.findMany({
      where: examResultsWhere,
      include: {
        exam: {
          include: {
            competency: true
          }
        }
      }
    })

    // Procesar datos por competencia (async para calcular promedios del grupo)
    const competenciesProgress = await Promise.all(competencies.map(async (competency) => {
      // Lecciones de esta competencia (usar filteredLessonProgress)
      const competencyLessons = filteredLessonProgress.filter((lp: any) => 
        lp.lesson.moduleLessons?.some((ml: any) => ml.module.competencyId === competency.id)
      )

      // Contenido de esta competencia (usar filteredContentProgress)
      const competencyContent = filteredContentProgress.filter((cp: any) => 
        cp.lesson.moduleLessons?.some((ml: any) => ml.module.competencyId === competency.id)
      )

      // Exámenes de esta competencia
      const competencyExams = examResults.filter(er => 
        er.exam.competencyId === competency.id
      )

      // Calcular estadísticas
      const totalLessons = competencyLessons.length
      const completedLessons = competencyLessons.filter((lp: any) => lp.status === 'completed').length
      const inProgressLessons = competencyLessons.filter((lp: any) => lp.status === 'in_progress').length

      const totalTimeMinutes = competencyContent.reduce((acc: number, cp: any) => 
        acc + (cp.totalTimeMinutes || 0), 0
      )

      // Solo considerar exámenes completados para estadísticas
      const completedExams = competencyExams.filter(er => er.completedAt !== null)
      const totalExams = completedExams.length
      const passedExams = completedExams.filter(er => er.isPassed).length
      
      // Calcular promedio de puntajes (0-100%)
      const averageScore = totalExams > 0 
        ? Math.round(completedExams.reduce((acc, er) => {
            const percentage = er.totalQuestions > 0 
              ? (er.score / er.totalQuestions) * 100 
              : 0
            return acc + percentage
          }, 0) / totalExams)
        : 0

      const progressPercentage = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0

      // Calcular promedio del grupo (estudiantes de la misma escuela en la misma competencia)
      let groupAverageScore = 0
      let comparisonStatus: 'above' | 'below' | 'equal' | 'no_data' = 'no_data'
      
      if (student?.schoolId && totalExams > 0) {
        try {
          const groupExamResults = await prisma.examResult.findMany({
            where: {
              exam: {
                competencyId: competency.id
              },
              user: {
                schoolId: student.schoolId,
                role: 'student'
              },
              completedAt: { not: null }
            },
            select: {
              score: true,
              totalQuestions: true
            }
          })

          if (groupExamResults.length > 0) {
            const groupAverage = groupExamResults.reduce((acc, er) => {
              const percentage = er.totalQuestions > 0 
                ? (er.score / er.totalQuestions) * 100 
                : 0
              return acc + percentage
            }, 0) / groupExamResults.length
            
            groupAverageScore = Math.round(groupAverage)
            
            if (averageScore > groupAverageScore) {
              comparisonStatus = 'above'
            } else if (averageScore < groupAverageScore) {
              comparisonStatus = 'below'
            } else {
              comparisonStatus = 'equal'
            }
          }
        } catch (error) {
          console.error('Error calculating group average:', error)
        }
      }

      // Calcular evolución temporal (comparar exámenes recientes vs antiguos)
      let trend: 'improving' | 'declining' | 'stable' | 'no_data' = 'no_data'
      if (completedExams.length >= 2) {
        const sortedExams = [...completedExams].sort((a, b) => 
          new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime()
        )
        
        const recentExams = sortedExams.slice(-Math.min(3, Math.floor(sortedExams.length / 2)))
        const olderExams = sortedExams.slice(0, Math.floor(sortedExams.length / 2))
        
        if (recentExams.length > 0 && olderExams.length > 0) {
          const recentAvg = recentExams.reduce((acc, er) => {
            const percentage = er.totalQuestions > 0 
              ? (er.score / er.totalQuestions) * 100 
              : 0
            return acc + percentage
          }, 0) / recentExams.length
          
          const olderAvg = olderExams.reduce((acc, er) => {
            const percentage = er.totalQuestions > 0 
              ? (er.score / er.totalQuestions) * 100 
              : 0
            return acc + percentage
          }, 0) / olderExams.length
          
          const diff = recentAvg - olderAvg
          if (diff > 5) {
            trend = 'improving'
          } else if (diff < -5) {
            trend = 'declining'
          } else {
            trend = 'stable'
          }
        }
      }

      // Última actividad
      const lastActivity = [
        ...competencyLessons.map((lp: any) => lp.updatedAt),
        ...competencyContent.map((cp: any) => cp.updatedAt),
        ...competencyExams.map(er => er.completedAt)
      ].filter(Boolean).sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0]

      return {
        id: competency.id,
        name: competency.name,
        displayName: competency.displayName,
        description: competency.description,
        color: competency.colorHex,
        icon: competency.iconName,
        totalLessons,
        completedLessons,
        inProgressLessons,
        progressPercentage,
        totalTimeMinutes,
        totalExams,
        passedExams,
        averageScore,
        lastActivityAt: lastActivity,
        groupAverageScore,
        comparisonStatus,
        trend,
        stats: {
          lessonsCompleted: completedLessons,
          lessonsInProgress: inProgressLessons,
          timeSpent: totalTimeMinutes,
          examsTaken: totalExams,
          examsPassed: passedExams,
          averageScore
        }
      }
    }))

    // Ordenar por fortalezas/debilidades (por promedio de puntajes, de mayor a menor)
    const sortedCompetencies = competenciesProgress.sort((a, b) => b.averageScore - a.averageScore)

    return NextResponse.json(sortedCompetencies)

  } catch (error) {
    console.error('Error fetching competency progress:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}