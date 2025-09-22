import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { attemptId } = await params
    const userId = session.user.id

    // Obtener el intento de examen
    const attempt = await prisma.examAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
        status: 'in_progress'
      },
      include: {
        exam: {
          include: {
            examQuestions: {
              include: {
                question: {
                  include: {
                    questionOptions: true,
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
                }
              }
            }
          }
        }
      }
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Intento de examen no encontrado' }, { status: 404 })
    }

    // Verificar que no se ha excedido el tiempo límite
    const now = new Date()
    const timeElapsed = now.getTime() - attempt.startedAt.getTime()
    const timeLimitMs = (attempt.timeLimitMinutes || 60) * 60 * 1000

    if (timeElapsed > timeLimitMs) {
      return NextResponse.json({ error: 'Tiempo límite excedido' }, { status: 400 })
    }

    // Obtener respuestas existentes
    const existingAnswers = await prisma.examAnswer.findMany({
      where: { attemptId },
      select: {
        questionId: true,
        selectedOptionId: true,
        answerText: true
      }
    })

    const answersMap = existingAnswers.reduce((acc, answer) => {
      acc[answer.questionId] = {
        optionId: answer.selectedOptionId,
        text: answer.answerText
      }
      return acc
    }, {} as Record<string, { optionId?: string; text?: string }>)

    // Preparar preguntas para el examen (sin respuestas correctas)
    const questions = attempt.exam.examQuestions.map(eq => ({
      id: eq.question.id,
      text: eq.question.text,
      type: eq.question.type,
      difficultyLevel: eq.question.difficultyLevel,
      imageUrl: eq.question.imageUrl,
      options: eq.question.questionOptions.map(opt => ({
        id: opt.id,
        text: opt.text,
        isCorrect: false // No enviar la respuesta correcta
      })),
      competency: eq.question.lesson?.modules?.[0]?.competency?.name || 'Sin competencia'
    }))

    return NextResponse.json({
      attemptId: attempt.id,
      exam: {
        id: attempt.exam.id,
        title: attempt.exam.title,
        description: attempt.exam.description,
        timeLimitMinutes: attempt.timeLimitMinutes,
        totalQuestions: questions.length
      },
      questions,
      startedAt: attempt.startedAt,
      existingAnswers: answersMap
    })

  } catch (error) {
    console.error('Error fetching exam attempt:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
