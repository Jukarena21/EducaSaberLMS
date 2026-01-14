import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/student/modules/[moduleId]/quizzes
 * Obtiene los quices disponibles para un módulo específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { moduleId } = await params
    const userId = session.user.id

    // Verificar que el estudiante tiene acceso al módulo
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        courseModules: {
          some: {
            course: {
              courseEnrollments: {
                some: {
                  userId,
                  isActive: true
                }
              }
            }
          }
        }
      },
      include: {
        courseModules: {
          include: {
            course: {
              include: {
                competency: true
              }
            }
          }
        },
        moduleLessons: {
          include: {
            lesson: true
          }
        }
      }
    })

    if (!module) {
      return NextResponse.json({ error: 'Módulo no encontrado o sin acceso' }, { status: 404 })
    }

    // Verificar el progreso del módulo
    const moduleProgress = await prisma.studentModuleProgress.findFirst({
      where: {
        userId,
        moduleId
      }
    })

    const totalLessons = module.moduleLessons.length
    const completedLessons = moduleProgress?.completedLessonsCount || 0
    const isModuleCompleted = totalLessons > 0 && completedLessons === totalLessons

    // Buscar quices (exámenes tipo por_modulo) para este módulo
    const course = module.courseModules[0]?.course
    const allQuizzes = await prisma.exam.findMany({
      where: {
        examType: 'por_modulo',
        courseId: course?.id,
        isPublished: true
      },
      include: {
        examQuestions: true,
        examResults: {
          where: { userId },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Filtrar quices que incluyen este módulo (includedModules es JSON string)
    const quizzes = allQuizzes.filter(quiz => {
      if (!quiz.includedModules) return false
      try {
        const modules = JSON.parse(quiz.includedModules)
        return Array.isArray(modules) && modules.includes(moduleId)
      } catch {
        // Si no es JSON válido, verificar si contiene el moduleId como string
        return quiz.includedModules.includes(moduleId)
      }
    })

    // Formatear quices con información de disponibilidad
    const formattedQuizzes = quizzes.map(quiz => {
      const lastResult = quiz.examResults[0]
      
      let status: 'locked' | 'available' | 'in_progress' | 'completed' = 'locked'
      let canTake = false
      
      if (isModuleCompleted) {
        if (!lastResult) {
          status = 'available'
          canTake = true
        } else if (lastResult.completedAt === null) {
          status = 'in_progress'
          canTake = true
        } else {
          status = 'completed'
          // Permitir reintentos si el score es 0 (reactivado)
          canTake = lastResult.score === 0
        }
      }

      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        totalQuestions: quiz.examQuestions.length,
        timeLimitMinutes: quiz.timeLimitMinutes,
        passingScore: quiz.passingScore,
        isModuleCompleted,
        moduleProgress: {
          completedLessons,
          totalLessons,
          progressPercentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
        },
        lastAttempt: lastResult ? {
          resultId: lastResult.id,
          score: lastResult.score,
          passed: lastResult.isPassed || false,
          completedAt: lastResult.completedAt ? lastResult.completedAt.toISOString() : null,
          startedAt: lastResult.startedAt ? lastResult.startedAt.toISOString() : null
        } : null,
        status,
        canTake
      }
    })

    return NextResponse.json({
      module: {
        id: module.id,
        title: module.title,
        description: module.description
      },
      quizzes: formattedQuizzes,
      isModuleCompleted
    })

  } catch (error) {
    console.error('Error fetching module quizzes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/**
 * POST /api/student/modules/[moduleId]/quizzes
 * Genera automáticamente un quiz para un módulo cuando se completa al 100%
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { moduleId } = await params
    const userId = session.user.id

    // Verificar que el módulo está completado
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        courseModules: {
          some: {
            course: {
              courseEnrollments: {
                some: {
                  userId,
                  isActive: true
                }
              }
            }
          }
        }
      },
      include: {
        courseModules: {
          include: {
            course: {
              include: {
                competency: true
              }
            }
          }
        },
        moduleLessons: {
          include: {
            lesson: {
              include: {
                lessonQuestions: true
              }
            }
          }
        }
      }
    })

    if (!module) {
      return NextResponse.json({ error: 'Módulo no encontrado o sin acceso' }, { status: 404 })
    }

    const moduleProgress = await prisma.studentModuleProgress.findFirst({
      where: {
        userId,
        moduleId
      }
    })

    const totalLessons = module.moduleLessons.length
    const completedLessons = moduleProgress?.completedLessonsCount || 0
    const isModuleCompleted = totalLessons > 0 && completedLessons === totalLessons

    if (!isModuleCompleted) {
      return NextResponse.json({ 
        error: 'El módulo debe estar completado al 100% para generar el quiz',
        progress: {
          completedLessons,
          totalLessons,
          progressPercentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
        }
      }, { status: 400 })
    }

    const course = module.courseModules[0]?.course
    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    // Verificar si ya existe un quiz para este módulo
    const allQuizzes = await prisma.exam.findMany({
      where: {
        examType: 'por_modulo',
        courseId: course.id
      }
    })

    const existingQuiz = allQuizzes.find(quiz => {
      if (!quiz.includedModules) return false
      try {
        const modules = JSON.parse(quiz.includedModules)
        return Array.isArray(modules) && modules.includes(moduleId)
      } catch {
        return quiz.includedModules.includes(moduleId)
      }
    })

    if (existingQuiz) {
      return NextResponse.json({
        success: true,
        quiz: {
          id: existingQuiz.id,
          title: existingQuiz.title,
          message: 'Ya existe un quiz para este módulo'
        }
      })
    }

    // Generar quiz automático
    // Obtener todas las preguntas del módulo (de las lecciones)
    const allQuestions: any[] = []
    for (const moduleLesson of module.moduleLessons) {
      const questions = await prisma.lessonQuestion.findMany({
        where: {
          lessonId: moduleLesson.lesson.id
        }
      })
      
      // Filtrar preguntas que pueden usarse en exámenes
      const examQuestions = questions.filter(q => {
        const usage = (q as any).usage || 'lesson'
        return usage === 'exam' || usage === 'both'
      })
      
      allQuestions.push(...examQuestions)
    }

    if (allQuestions.length === 0) {
      return NextResponse.json({ 
        error: 'No hay preguntas disponibles en este módulo para generar el quiz' 
      }, { status: 400 })
    }

    // Seleccionar preguntas aleatorias (máximo 10 o todas si hay menos)
    const questionsPerModule = Math.min(10, allQuestions.length)
    const shuffled = allQuestions.sort(() => 0.5 - Math.random())
    const selectedQuestions = shuffled.slice(0, questionsPerModule)

    // Crear el examen (quiz)
    const quiz = await prisma.exam.create({
      data: {
        title: `Quiz: ${module.title}`,
        description: `Quiz automático del módulo "${module.title}". Evalúa tu conocimiento sobre los temas aprendidos.`,
        examType: 'por_modulo',
        courseId: course.id,
        competencyId: course.competencyId || undefined,
        academicGrade: course.academicGrade || undefined,
        timeLimitMinutes: 15, // 15 minutos para quices
        passingScore: 70,
        difficultyLevel: 'intermedio',
        isAdaptive: false,
        isPublished: true,
        isIcfesExam: false,
        includedModules: JSON.stringify([moduleId]),
        questionsPerModule: questionsPerModule,
        totalQuestions: questionsPerModule,
        createdById: userId // O usar un admin por defecto
      }
    })

    // Crear las preguntas del examen
    for (let i = 0; i < selectedQuestions.length; i++) {
      const question = selectedQuestions[i]
      await prisma.examQuestion.create({
        data: {
          examId: quiz.id,
          questionText: question.questionText,
          questionImage: question.questionImage || null,
          questionType: question.questionType || 'multiple_choice',
          optionA: question.optionA,
          optionB: question.optionB,
          optionC: question.optionC,
          optionD: question.optionD,
          optionAImage: question.optionAImage || null,
          optionBImage: question.optionBImage || null,
          optionCImage: question.optionCImage || null,
          optionDImage: question.optionDImage || null,
          correctOption: question.correctOption,
          explanation: question.explanation || null,
          explanationImage: question.explanationImage || null,
          orderIndex: i + 1,
          difficultyLevel: question.difficultyLevel || 'intermedio',
          timeLimit: question.timeLimit || null,
          lessonId: question.lessonId || null,
          lessonUrl: question.lessonId ? `/estudiante/cursos/${course.id}/leccion/${question.lessonId}` : null
        }
      })
    }

    return NextResponse.json({
      success: true,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        totalQuestions: quiz.totalQuestions,
        timeLimitMinutes: quiz.timeLimitMinutes
      },
      message: 'Quiz generado exitosamente'
    })

  } catch (error) {
    console.error('Error generating module quiz:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

