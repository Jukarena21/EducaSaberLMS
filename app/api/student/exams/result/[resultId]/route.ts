import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { resultId } = await params
    const userId = session.user.id

    console.log('Fetching result for:', resultId, 'user:', userId)
    
    // Obtener el resultado del examen con preguntas y respuestas
    const result = await prisma.examResult.findFirst({
      where: {
        id: resultId,
        userId
      },
      include: {
        exam: {
          include: {
            competency: true,
            examQuestions: {
              include: {
                lesson: {
                  include: {
                    moduleLessons: {
                      include: {
                        module: {
                          include: {
                            courseModules: {
                              include: {
                                course: true
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              orderBy: {
                orderIndex: 'asc'
              }
            }
          }
        },
        examQuestionAnswers: {
          select: {
            questionId: true,
            selectedOption: true,
            isCorrect: true
          }
        }
      }
    })

    console.log('Found result:', result)

    if (!result) {
      return NextResponse.json({ error: 'Resultado no encontrado' }, { status: 404 })
    }

    // Procesar preguntas con respuestas del estudiante
    const questions = result.exam.examQuestions.map(examQuestion => {
      const studentAnswer = result.examQuestionAnswers.find(
        answer => answer.questionId === examQuestion.id
      )
      
      // Obtener información de la lección relacionada
      const lesson = examQuestion.lesson
      const moduleLesson = lesson?.moduleLessons?.[0]
      const courseModule = moduleLesson?.module?.courseModules?.[0]
      const course = courseModule?.course
      
      return {
        id: examQuestion.id,
        text: examQuestion.questionText,
        questionImage: examQuestion.questionImage,
        optionA: examQuestion.optionA,
        optionB: examQuestion.optionB,
        optionC: examQuestion.optionC,
        optionD: examQuestion.optionD,
        optionAImage: examQuestion.optionAImage,
        optionBImage: examQuestion.optionBImage,
        optionCImage: examQuestion.optionCImage,
        optionDImage: examQuestion.optionDImage,
        userAnswer: studentAnswer?.selectedOption || 'No respondida',
        correctAnswer: examQuestion.correctOption,
        isCorrect: studentAnswer?.isCorrect || false,
        explanation: examQuestion.explanation || 'Sin explicación disponible',
        explanationImage: examQuestion.explanationImage,
        lesson: lesson ? {
          id: lesson.id,
          title: lesson.title,
          courseId: course?.id,
          courseTitle: course?.title
        } : null
      }
    })

    return NextResponse.json({
      id: result.id,
      score: result.score,
      correctAnswers: result.correctAnswers,
      incorrectAnswers: result.incorrectAnswers,
      totalQuestions: result.totalQuestions,
      isPassed: result.isPassed,
      timeTakenMinutes: result.timeTakenMinutes,
      completedAt: result.completedAt,
      exam: {
        id: result.exam.id,
        title: result.exam.title,
        description: result.exam.description,
        competency: {
          id: result.exam.competency?.id,
          name: result.exam.competency?.name,
          displayName: result.exam.competency?.displayName
        }
      },
      questions: questions
    })

  } catch (error) {
    console.error('Error fetching exam result:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}