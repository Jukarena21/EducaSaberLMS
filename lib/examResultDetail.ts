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
import { calculateIcfesGlobalScore } from '@/lib/icfesScoring'
import {
  resolvePerformanceLevelForExam,
  resolvePerformanceLevelFromDefaults,
} from '@/lib/performanceLevels'

export type ExamResultDetailOptions = {
  /** Restringe la búsqueda al dueño del resultado. Se omite en vistas de administración. */
  userId?: string
  /**
   * Permite ver el detalle completo aunque el examen todavía no haya liberado
   * retroalimentación. Solo para roles administrativos.
   */
  bypassFeedbackGate?: boolean
}

export type ExamResultDetail =
  | { status: 'not_found' }
  | { status: 'locked'; payload: Record<string, unknown> }
  | { status: 'released'; payload: Record<string, unknown> }

export async function buildExamResultDetail(
  resultId: string,
  options: ExamResultDetailOptions = {}
): Promise<ExamResultDetail> {
  const { userId, bypassFeedbackGate = false } = options

  const result = await prisma.examResult.findFirst({
    where: {
      id: resultId,
      ...(userId ? { userId } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          schoolId: true,
          school: { select: { id: true, name: true } },
        },
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
          timeSpentSeconds: true,
        },
      },
    },
  })

  if (!result) {
    return { status: 'not_found' }
  }

  const feedbackReleased = isExamFeedbackReleased(result.exam)
  const feedbackMessage = getFeedbackStatusMessage(feedbackReleased, result.exam.closeDate)

  const student = {
    id: result.user.id,
    firstName: result.user.firstName,
    lastName: result.user.lastName,
    email: result.user.email,
    schoolName: result.user.school?.name ?? null,
  }

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

  // Antes del cierre solo se entregan conteos agregados del propio intento.
  // Nunca el puntaje ni las preguntas, para no filtrar contenido entre estudiantes.
  if (!feedbackReleased && !bypassFeedbackGate) {
    const answered = result.examQuestionAnswers.filter(
      (a) => Boolean(a.selectedOption) || Boolean(a.answerText)
    ).length

    return {
      status: 'locked',
      payload: {
        id: result.id,
        completedAt: result.completedAt,
        feedbackReleased: false,
        feedbackMessage,
        reportAvailable: false,
        exam: examPayload,
        student,
        submissionSummary: {
          totalQuestions: result.totalQuestions,
          correctAnswers: result.correctAnswers,
          incorrectAnswers: result.incorrectAnswers,
          answeredQuestions: answered,
          unansweredQuestions: Math.max(0, result.totalQuestions - answered),
          timeTakenMinutes: result.timeTakenMinutes,
          startedAt: result.startedAt,
        },
      },
    }
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
    result.userId,
    result.user.schoolId,
    attemptBreakdown,
    { activeAreaIdsOnly: true }
  )

  const icfesGlobalScore = calculateIcfesGlobalScore(
    attemptBreakdown.areaHierarchy.map((area) => ({
      areaSlug: area.areaSlug,
      score: area.percent,
    }))
  )

  const weakTopics = [...attemptBreakdown.byTema, ...attemptBreakdown.bySubtema]
    .filter((item) => item.total >= 2 && item.percent < 60)
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 5)

  const performanceLevelsByArea = await Promise.all(
    attemptBreakdown.byArea.map(async (item) => {
      const areaSlug =
        result.exam.examQuestions.find(
          (q) => resolveAreaDisplayName(q.competency || result.exam.competency) === item.label
        )?.competency?.name ||
        result.exam.competency?.name ||
        'general'
      const level =
        (await resolvePerformanceLevelForExam(item.percent, areaSlug, {
          id: result.exam.id,
          performanceLevelProfileId: result.exam.performanceLevelProfileId,
          academicGrade: result.exam.academicGrade,
        })) || resolvePerformanceLevelFromDefaults(item.percent, areaSlug)
      return {
        areaLabel: item.label,
        percent: item.percent,
        sharePercent: item.sharePercent,
        level,
      }
    })
  )

  // Temas débiles agrupados por área
  const weakByAreaMap = new Map<string, typeof attemptBreakdown.byTema>()
  for (const q of result.exam.examQuestions) {
    const areaLabel = resolveAreaDisplayName(
      q.competency || result.exam.competency,
      defaultAreaLabel
    )
    const temaItem = attemptBreakdown.byTema.find((t) => t.label === q.tema)
    const subtemaItem = attemptBreakdown.bySubtema.find((t) => t.label === q.subtema)
    for (const item of [temaItem, subtemaItem].filter(Boolean)) {
      if (!item || item.total < 2 || item.percent >= 60) continue
      if (!weakByAreaMap.has(areaLabel)) weakByAreaMap.set(areaLabel, [])
      const list = weakByAreaMap.get(areaLabel)!
      if (!list.find((x) => x.label === item.label)) list.push(item)
    }
  }
  const weakTopicsByArea = Array.from(weakByAreaMap.entries()).map(([areaLabel, topics]) => ({
    areaLabel,
    topics: topics.sort((a, b) => a.percent - b.percent),
  }))

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
      userAnswer: studentAnswer?.selectedOption || studentAnswer?.answerText || 'No respondida',
      correctAnswer: examQuestion.correctOption,
      isCorrect: studentAnswer?.isCorrect || false,
      timeSpentSeconds: studentAnswer?.timeSpentSeconds ?? null,
      explanation:
        decodeMaybeEscapedHtml(examQuestion.explanation) || 'Sin explicación disponible',
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

  return {
    status: 'released',
    payload: {
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
      // El admin puede abrir el detalle antes del cierre; se marca para avisarlo en pantalla
      releasedToStudent: feedbackReleased,
      exam: examPayload,
      student,
      analytics: {
        attemptBreakdown,
        radarComparison,
        icfesGlobalScore,
        weakTopics,
        performanceLevelsByArea,
        weakTopicsByArea,
      },
      questions,
    },
  }
}
