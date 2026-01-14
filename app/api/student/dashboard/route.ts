import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Calcula el puntaje ICFES basado en respuestas individuales a preguntas
 * Solo considera exámenes completos (simulacro_completo) y de diagnóstico
 */
async function calculateIcfesScoreFromQuestions(userId: string): Promise<number> {
  try {
    // 1. Cargar todas las respuestas de exámenes ICFES (simulacro_completo y diagnostico)
    // IMPORTANTE: Solo considerar exámenes marcados como ICFES (isIcfesExam = true)
    // Los cursos personalizados para empresas NO deben usar este cálculo
    const allAnswers = await prisma.examQuestionAnswer.findMany({
      where: { 
        userId,
        examResult: {
          exam: {
            examType: {
              in: ['simulacro_completo', 'diagnostico']
            },
            isIcfesExam: true // SOLO exámenes ICFES
          }
        }
      },
      include: {
        question: {
          include: {
            exam: {
              include: {
                competency: true,
                course: {
                  include: {
                    competency: true
                  }
                }
              }
            },
            lesson: {
              include: {
                competency: true
              }
            }
          }
        },
        examResult: {
          include: {
            exam: {
              select: {
                id: true,
                examType: true
              }
            }
          }
        }
      }
    }) as any[]
    
    if (allAnswers.length === 0) {
      return 0
    }
    
    // 2. Pesos por competencia (ICFES real)
    // Mapeo de nombres de competencias a pesos ICFES
    // Nota: ICFES tiene 5 competencias principales, pero el sistema puede tener más
    const competencyWeights: Record<string, number> = {
      // Competencias ICFES principales (5 competencias)
      'razonamiento_cuantitativo': 0.25, // Matemáticas/Razonamiento Cuantitativo
      'matematicas': 0.25, // Alias para compatibilidad
      'lectura_critica': 0.25,
      'ciencias_naturales': 0.20,
      'competencias_ciudadanas': 0.15, // Sociales y Ciudadanas
      'sociales_y_ciudadanas': 0.15, // Alias para compatibilidad
      'sociales': 0.15, // Alias alternativo
      'ingles': 0.15,
      // Comunicación Escrita no está en el ICFES tradicional, pero puede estar en el sistema
      'comunicacion_escrita': 0.0 // No se incluye en cálculo ICFES estándar
    }
    
    // 3. Pesos por dificultad
    const difficultyWeights: Record<string, number> = {
      'facil': 0.7,
      'intermedio': 1.0,
      'dificil': 1.5
    }
    
    // 4. Calcular recencia
    const now = new Date()
    const getRecencyFactor = (completedAt: Date | null): number => {
      if (!completedAt) return 1.0
      const daysDiff = (now.getTime() - new Date(completedAt).getTime()) / (1000 * 60 * 60 * 24)
      if (daysDiff <= 30) return 1.0
      if (daysDiff <= 60) return 0.9
      if (daysDiff <= 90) return 0.8
      if (daysDiff <= 120) return 0.7
      if (daysDiff <= 180) return 0.6
      if (daysDiff <= 365) return 0.5
      return 0.3
    }
    
    // 5. Factor de tiempo
    const getTimeFactor = (timeSpentSeconds: number | null): number => {
      if (!timeSpentSeconds) return 1.0
      if (timeSpentSeconds < 5) return 0.8
      if (timeSpentSeconds < 30) return 1.0
      return 1.1
    }
    
    // 6. Agrupar por competencia
    const competencyScores: Record<string, { 
      obtained: number
      maxPossible: number
      competencyName: string
    }> = {}
    
    for (const answer of allAnswers) {
      // Obtener competencia desde la lección (prioridad) o desde el examen/curso
      let competencyId: string | null = null
      let competencyName: string | null = null
      
      // Prioridad 1: Competencia desde la lección (más precisa para simulacros completos)
      if (answer.question?.lesson?.competencyId && answer.question?.lesson?.competency) {
        competencyId = answer.question.lesson.competencyId
        competencyName = answer.question.lesson.competency.name.toLowerCase().replace(/\s+/g, '_')
      }
      // Prioridad 2: Competencia directa del examen
      else if (answer.question?.exam?.competencyId && answer.question?.exam?.competency) {
        competencyId = answer.question.exam.competencyId
        competencyName = answer.question.exam.competency.name.toLowerCase().replace(/\s+/g, '_')
      }
      // Prioridad 3: Competencia desde el curso del examen
      else if (answer.question?.exam?.course?.competencyId && answer.question?.exam?.course?.competency) {
        competencyId = answer.question.exam.course.competencyId
        competencyName = answer.question.exam.course.competency.name.toLowerCase().replace(/\s+/g, '_')
      }
      
      // Si no se pudo obtener competencia, saltar esta respuesta
      if (!competencyId || !competencyName) continue
      
      const isCorrect = answer.isCorrect === true
      
      const baseScore = isCorrect ? 1 : 0
      const difficultyWeight = difficultyWeights[answer.question.difficultyLevel] || 1.0
      const timeFactor = getTimeFactor(answer.timeSpentSeconds)
      const recencyFactor = getRecencyFactor(answer.examResult.completedAt)
      
      const questionScore = baseScore * difficultyWeight * timeFactor * recencyFactor
      const maxQuestionScore = difficultyWeight * timeFactor * recencyFactor
      
      if (!competencyScores[competencyId]) {
        competencyScores[competencyId] = {
          obtained: 0,
          maxPossible: 0,
          competencyName
        }
      }
      competencyScores[competencyId].obtained += questionScore
      competencyScores[competencyId].maxPossible += maxQuestionScore
    }
    
    // 7. Calcular score ponderado por competencia
    let weightedSum = 0
    let totalWeight = 0
    
    for (const [competencyId, scores] of Object.entries(competencyScores)) {
      if (scores.maxPossible === 0) continue
      
      const competencyPercentage = (scores.obtained / scores.maxPossible) * 100
      const weight = competencyWeights[scores.competencyName] || 0.20
      
      weightedSum += competencyPercentage * weight
      totalWeight += weight
    }
    
    if (totalWeight === 0) return 0
    
    // 8. Normalizar y convertir a escala ICFES (0-500)
    const normalizedScore = weightedSum / totalWeight
    return Math.max(0, Math.min(500, Math.round(normalizedScore * 5)))
  } catch (error) {
    console.error('Error calculating ICFES score from questions:', error)
    return 0
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const userId = session.user.id

    // Obtener datos reales del estudiante
    const [
      enrolledCourses,
      examResults,
      lessonProgress,
      upcomingExams,
      recentActivity
    ] = await Promise.all([
      // Cursos inscritos
      prisma.courseEnrollment.findMany({
        where: { userId, isActive: true },
        include: { course: { include: { competency: true } } }
      }),
      
      // Resultados de exámenes (solo completados para KPIs)
      prisma.examResult.findMany({
        where: { 
          userId,
          completedAt: { not: null } // Solo exámenes completados
        },
        include: { exam: { include: { competency: true } } },
        orderBy: { completedAt: 'desc' }
      }),
      
      // Progreso de lecciones
      prisma.studentLessonProgress.findMany({
        where: { userId },
        include: { lesson: true }
      }),
      
      // Exámenes próximos disponibles (no completados, pero pueden estar en progreso)
      // Incluye exámenes normales y simulacros manuales asignados
      (async () => {
        const now = new Date()
        
        // Obtener información del estudiante
        const student = await prisma.user.findUnique({
          where: { id: userId },
          select: { schoolId: true }
        })

        // Exámenes normales
        const normalExams = await prisma.exam.findMany({
          where: {
            isPublished: true,
            isManualSimulacro: false,
            openDate: { lte: now },
            closeDate: { gte: now },
            examResults: {
              none: { 
                userId,
                completedAt: { not: null }
              }
            }
          },
          include: { 
            competency: true,
            examResults: {
              where: { userId },
              select: { id: true, completedAt: true }
            }
          },
          orderBy: { openDate: 'asc' },
          take: 5
        })

        // Simulacros manuales asignados directamente
        const directAssignments = await prisma.examAssignment.findMany({
          where: {
            userId,
            isActive: true,
            exam: {
              isManualSimulacro: true,
              isPublished: true
            }
          },
          include: {
            exam: {
              include: {
                competency: true,
                examResults: {
                  where: { userId },
                  select: { id: true, completedAt: true }
                }
              }
            }
          }
        })

        // Simulacros manuales asignados por colegio
        const schoolAssignments = student?.schoolId ? await prisma.examSchool.findMany({
          where: {
            schoolId: student.schoolId,
            isActive: true,
            exam: {
              isManualSimulacro: true,
              isPublished: true
            }
          },
          include: {
            exam: {
              include: {
                competency: true,
                examResults: {
                  where: { userId },
                  select: { id: true, completedAt: true }
                }
              }
            }
          }
        }) : []

        // Filtrar simulacros manuales por fechas de asignación y que no estén completados
        const manualSimulacros = [
          ...directAssignments.map(a => a.exam),
          ...schoolAssignments.map(s => s.exam)
        ]
          .filter((exam, index, self) => 
            index === self.findIndex(e => e.id === exam.id) // Eliminar duplicados
          )
          .filter(exam => {
            // Verificar fechas de asignación
            const assignment = directAssignments.find(a => a.examId === exam.id) || 
                              schoolAssignments.find(s => s.examId === exam.id)
            const openDate = assignment?.openDate || exam.openDate
            const closeDate = assignment?.closeDate || exam.closeDate
            
            if (openDate && openDate > now) return false
            if (closeDate && closeDate < now) return false
            
            // Verificar que no esté completado
            const hasCompleted = exam.examResults.some(r => r.completedAt !== null)
            return !hasCompleted
          })
          .slice(0, 5)

        return [...normalExams, ...manualSimulacros].slice(0, 5)
      })(),
      
      // Actividad reciente (últimos resultados de exámenes completados y lecciones)
      Promise.all([
        // Exámenes completados
        prisma.examResult.findMany({
          where: { 
            userId,
            completedAt: { not: null }
          },
          include: { exam: { include: { competency: true } } },
          orderBy: { completedAt: 'desc' },
          take: 3
        }),
        // Lecciones completadas recientemente
        prisma.studentLessonProgress.findMany({
          where: { 
            userId,
            status: 'completed'
          },
          include: { 
            lesson: {
              include: {
                competency: true
              }
            }
          },
          orderBy: { completedAt: 'desc' },
          take: 2
        })
      ])
    ])

    // Calcular KPIs
    const activeCourses = enrolledCourses.length
    // examResults ya está filtrado para solo incluir completados
    const examCompleted = examResults.length
    const studyTimeMinutes = lessonProgress.reduce((total, progress) => 
      total + (progress.totalTimeMinutes || 0), 0
    )
    // Calcular promedio de puntajes (0-100%) solo de exámenes completados
    const averageScore = examResults.length > 0 
      ? examResults.reduce((sum, result) => {
          // Calcular porcentaje: (score / totalQuestions) * 100
          const percentage = result.totalQuestions > 0 
            ? (result.score / result.totalQuestions) * 100 
            : 0
          return sum + percentage
        }, 0) / examResults.length
      : 0
    
    // Calcular puntaje ICFES (0-500)
    const icfesScore = await calculateIcfesScoreFromQuestions(userId)

    // Procesar actividad reciente
    const [recentExams, recentLessons] = Array.isArray(recentActivity) && recentActivity.length === 2 
      ? recentActivity 
      : [[], []]
    
    const activityItems = [
      ...recentExams.map((result: any) => ({
        type: 'exam_completed',
        title: result.exam.title,
        score: result.score,
        competency: result.exam.competency?.displayName || 'General',
        createdAt: result.completedAt,
        examType: result.exam.examType
      })),
      ...recentLessons.map((progress: any) => ({
        type: 'lesson_completed',
        title: progress.lesson.title,
        competency: progress.lesson.competency?.displayName || 'General',
        createdAt: progress.completedAt || progress.updatedAt
      }))
    ].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return dateB - dateA
    }).slice(0, 5)

    return NextResponse.json({
      kpis: {
        activeCourses,
        examCompleted,
        studyTimeMinutes,
        averageScore: Number(averageScore.toFixed(1)), // Promedio de puntajes (0-100%)
        icfesScore, // Puntaje ICFES (0-500)
      },
      upcomingExams: upcomingExams.map(exam => {
        const inProgress = exam.examResults && exam.examResults.length > 0 && exam.examResults[0].completedAt === null
        return {
          id: exam.id,
          title: exam.title,
          startAt: exam.openDate,
          durationMinutes: exam.timeLimitMinutes || 0,
          competency: exam.competency?.displayName || 'General',
          examType: exam.examType,
          inProgress
        }
      }),
      recentActivity: activityItems,
    })
  } catch (e) {
    console.error('GET /api/student/dashboard', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}


