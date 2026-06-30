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
  getCompetencyRadarComparison,
} from '@/lib/examPerformanceAnalytics'

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

    const defaultAreaLabel = result.exam.competency?.displayName || 'General'

    const attemptBreakdown = buildExamAttemptBreakdown(
      result.exam.examQuestions.map((q) => ({
        id: q.id,
        tema: q.tema,
        subtema: q.subtema,
        competency: q.competency,
      })),
      result.examQuestionAnswers.map((a) => ({
        questionId: a.questionId,
        isCorrect: a.isCorrect || false,
      })),
      defaultAreaLabel
    )

    const radarComparison = await getCompetencyRadarComparison(userId, result.user.schoolId)

    const weakTopics = [...attemptBreakdown.byTema, ...attemptBreakdown.bySubtema]
      .filter((item) => item.total >= 2 && item.percent < 60)
      .sort((a, b) => a.percent - b.percent)
      .slice(0, 5)

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
        areaLabels: Array.from(
          new Set(
            result.exam.examQuestions.map(
              (q) =>
                areaNumberMaps.get(q.id)?.areaLabel ||
                q.competency?.displayName ||
                defaultAreaLabel
            )
          )
        ).sort(),
      },
    })
  } catch (error) {
    console.error('Error fetching exam result:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
