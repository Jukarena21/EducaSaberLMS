import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getFeedbackStatusMessage,
  isExamFeedbackReleased,
} from '@/lib/examFeedbackPolicy'
import { buildQuestionAreaNumberMaps } from '@/lib/examAnswerValidation'
import {
  buildExamAttemptBreakdown,
  getAreaRadarComparison,
} from '@/lib/examPerformanceAnalytics'
import { decodeMaybeEscapedHtml, normalizeImageUrl } from '@/lib/htmlContent'
import { resolveAreaDisplayName } from '@/lib/icfesAreas'

export const dynamic = 'force-dynamic'

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
        user: {
          select: { schoolId: true },
        },
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
                              include: { course: true },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              orderBy: { orderIndex: 'asc' },
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
      area: {
        id: result.exam.competency?.id,
        name: result.exam.competency?.name,
        displayName: resolveAreaDisplayName(result.exam.competency),
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

    const defaultAreaLabel = resolveAreaDisplayName(result.exam.competency, 'General')

    const areaNumberMaps = buildQuestionAreaNumberMaps(
      result.exam.examQuestions.map((q) => ({
        id: q.id,
        areaKey: q.competencyId || q.competency?.name || result.exam.competency?.name || 'general',
        areaLabel: resolveAreaDisplayName(q.competency || result.exam.competency, defaultAreaLabel),
      }))
    )

    const attemptBreakdown = buildExamAttemptBreakdown(
      result.exam.examQuestions.map((q) => ({
        id: q.id,
        competencyId: q.competencyId || result.exam.competencyId,
        competencia: q.competencia,
        componente: q.componente,
        tema: q.tema,
        subtema: q.subtema,
        competency: q.competency || result.exam.competency,
      })),
      result.examQuestionAnswers.map((a) => ({
        questionId: a.questionId,
        isCorrect: a.isCorrect || false,
      })),
      defaultAreaLabel
    )

    const radarComparison = await getAreaRadarComparison(
      userId,
      result.user.schoolId,
      attemptBreakdown
    )

    const weakTopics = [...attemptBreakdown.byTema, ...attemptBreakdown.bySubtema]
      .filter((item) => item.total >= 2 && item.percent < 60)
      .sort((a, b) => a.percent - b.percent)
      .slice(0, 5)

    const questions = result.exam.examQuestions.map((examQuestion) => {
      const studentAnswer = result.examQuestionAnswers.find(
        (answer) => answer.questionId === examQuestion.id
      )

      const lesson = examQuestion.lesson
      const moduleLesson = lesson?.moduleLessons?.[0]
      const courseModule = moduleLesson?.module?.courseModules?.[0]
      const course = courseModule?.course

      const numbering = areaNumberMaps.get(examQuestion.id)

      return {
        id: examQuestion.id,
        text: decodeMaybeEscapedHtml(examQuestion.questionText),
        questionImage: normalizeImageUrl(examQuestion.questionImage),
        optionA: decodeMaybeEscapedHtml(examQuestion.optionA),
        optionB: decodeMaybeEscapedHtml(examQuestion.optionB),
        optionC: decodeMaybeEscapedHtml(examQuestion.optionC),
        optionD: decodeMaybeEscapedHtml(examQuestion.optionD),
        optionAImage: normalizeImageUrl(examQuestion.optionAImage),
        optionBImage: normalizeImageUrl(examQuestion.optionBImage),
        optionCImage: normalizeImageUrl(examQuestion.optionCImage),
        optionDImage: normalizeImageUrl(examQuestion.optionDImage),
        userAnswer:
          studentAnswer?.selectedOption || studentAnswer?.answerText || 'No respondida',
        correctAnswer: examQuestion.correctOption,
        isCorrect: studentAnswer?.isCorrect || false,
        explanation: decodeMaybeEscapedHtml(examQuestion.explanation) || 'Sin explicación disponible',
        explanationImage: normalizeImageUrl(examQuestion.explanationImage),
        areaLabel: numbering?.areaLabel || defaultAreaLabel,
        displayNumberInArea: numbering?.numberInArea ?? examQuestion.orderIndex,
        competencia: examQuestion.competencia || null,
        componente: examQuestion.componente || null,
        tema: examQuestion.tema || null,
        subtema: examQuestion.subtema || null,
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
      analytics: {
        attemptBreakdown,
        radarComparison,
        weakTopics,
      },
      questions,
    })
  } catch (error) {
    console.error('Error fetching exam result:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
