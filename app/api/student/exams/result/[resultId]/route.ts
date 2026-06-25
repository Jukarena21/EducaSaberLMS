import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getFeedbackStatusMessage,
  isExamFeedbackReleased,
} from '@/lib/examFeedbackPolicy'
import { buildQuestionAreaNumberMaps } from '@/lib/examAnswerValidation'

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

    const result = await prisma.examResult.findFirst({
      where: {
        id: resultId,
        userId,
      },
      include: {
        exam: {
          include: {
            competency: true,
            examQuestions: {
              include: {
                competency: true,
                lesson: {
                  include: {
                    moduleLessons: {
                      include: {
                        module: {
                          include: {
                            courseModules: {
                              include: {
                                course: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              orderBy: {
                orderIndex: 'asc',
              },
            },
          },
        },
        examQuestionAnswers: {
          select: {
            questionId: true,
            selectedOption: true,
            answerText: true,
            isCorrect: true,
          },
        },
      },
    })

    if (!result) {
      return NextResponse.json({ error: 'Resultado no encontrado' }, { status: 404 })
    }

    const feedbackReleased = isExamFeedbackReleased(result.exam)
    const feedbackMessage = getFeedbackStatusMessage(feedbackReleased, result.exam.closeDate)

    const examPayload = {
      id: result.exam.id,
      title: result.exam.title,
      description: result.exam.description,
      closeDate: result.exam.closeDate,
      competency: {
        id: result.exam.competency?.id,
        name: result.exam.competency?.name,
        displayName: result.exam.competency?.displayName,
      },
    }

    // Antes del cierre: no exponer puntajes ni preguntas (evita filtración entre estudiantes)
    if (!feedbackReleased) {
      return NextResponse.json({
        id: result.id,
        completedAt: result.completedAt,
        feedbackReleased: false,
        feedbackMessage,
        reportAvailable: false,
        exam: examPayload,
      })
    }

    const areaNumberMaps = buildQuestionAreaNumberMaps(
      result.exam.examQuestions.map((q) => ({
        id: q.id,
        areaKey: q.competencyId || q.competency?.name || result.exam.competency?.name || 'general',
        areaLabel:
          q.competency?.displayName ||
          result.exam.competency?.displayName ||
          'General',
      }))
    )

    const questions = result.exam.examQuestions.map((examQuestion) => {
      const studentAnswer = result.examQuestionAnswers.find(
        (answer) => answer.questionId === examQuestion.id
      )

      const lesson = examQuestion.lesson
      const moduleLesson = lesson?.moduleLessons?.[0]
      const courseModule = moduleLesson?.module?.courseModules?.[0]
      const course = courseModule?.course

      const numbering = areaNumberMaps.get(examQuestion.id)
      const isCorrect = studentAnswer?.isCorrect || false

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
        userAnswer: studentAnswer?.selectedOption || studentAnswer?.answerText || 'No respondida',
        correctAnswer: examQuestion.correctOption,
        isCorrect,
        explanation: examQuestion.explanation || 'Sin explicación disponible',
        explanationImage: examQuestion.explanationImage,
        areaLabel: numbering?.areaLabel || 'General',
        displayNumberInArea: numbering?.numberInArea ?? examQuestion.orderIndex,
        tema: examQuestion.tema || null,
        subtema: examQuestion.subtema || null,
        componente: examQuestion.componente || null,
        lesson: lesson
          ? {
              id: lesson.id,
              title: lesson.title,
              courseId: course?.id,
              courseTitle: course?.title,
            }
          : null,
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
      feedbackReleased: true,
      feedbackMessage,
      reportAvailable: true,
      exam: examPayload,
      questions,
    })
  } catch (error) {
    console.error('Error fetching exam result:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
