import { prisma } from '@/lib/prisma'

export type ScoreByCompetency = {
  id: string
  score: number
}

export type CompetencyRadarData = {
  competencies: Array<{ id: string; displayName: string }>
  studentScores: ScoreByCompetency[]
  schoolScores: ScoreByCompetency[]
  platformScores: ScoreByCompetency[]
  attemptScores: ScoreByCompetency[]
}

export type BreakdownItem = {
  id?: string
  label: string
  total: number
  correct: number
  incorrect: number
  percent: number
}

export type ExamAttemptAnalytics = {
  byCompetency: BreakdownItem[]
  byTema: BreakdownItem[]
  bySubtema: BreakdownItem[]
}

type ExamQuestionRow = {
  id: string
  competencyId?: string | null
  tema?: string | null
  subtema?: string | null
  competency?: { displayName?: string | null; name?: string | null } | null
}

type AnswerRow = {
  questionId: string
  isCorrect: boolean
}

function clampScore(score: number): number {
  return Math.min(Math.max(Math.round(score), 0), 100)
}

function averageScoresByCompetency(
  examResults: Array<{ score: number; exam: { competencyId: string | null } }>,
  competencyIds: string[]
): ScoreByCompetency[] {
  return competencyIds.map((compId) => {
    const exams = examResults.filter((r) => r.exam.competencyId === compId)
    const avgScore =
      exams.length > 0
        ? exams.reduce((sum, e) => sum + e.score, 0) / exams.length
        : 0
    return { id: compId, score: clampScore(avgScore) }
  })
}

function aggregateBreakdown(
  questions: ExamQuestionRow[],
  answers: AnswerRow[],
  getLabel: (question: ExamQuestionRow) => string | null | undefined,
  getId?: (question: ExamQuestionRow) => string | null | undefined,
  fallbackLabel = 'Sin clasificar'
): BreakdownItem[] {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.isCorrect]))
  const groups = new Map<
    string,
    { id?: string; total: number; correct: number }
  >()

  for (const question of questions) {
    const label = getLabel(question)?.trim() || fallbackLabel
    const groupId = getId?.(question) || undefined
    const key = groupId ? `${groupId}::${label}` : label
    const current = groups.get(key) || { id: groupId, total: 0, correct: 0 }
    current.total += 1
    if (answerMap.get(question.id)) current.correct += 1
    groups.set(key, current)
  }

  return Array.from(groups.entries())
    .map(([key, stats]) => ({
      id: stats.id,
      label: key.includes('::') ? key.split('::').slice(1).join('::') : key,
      total: stats.total,
      correct: stats.correct,
      incorrect: stats.total - stats.correct,
      percent:
        stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'))
}

export function buildExamAttemptBreakdown(
  questions: ExamQuestionRow[],
  answers: AnswerRow[],
  defaultCompetencyLabel = 'General'
): ExamAttemptAnalytics {
  return {
    byCompetency: aggregateBreakdown(
      questions,
      answers,
      (q) =>
        q.competency?.displayName ||
        q.competency?.name ||
        defaultCompetencyLabel,
      (q) => q.competencyId || undefined
    ),
    byTema: aggregateBreakdown(questions, answers, (q) => q.tema),
    bySubtema: aggregateBreakdown(questions, answers, (q) => q.subtema),
  }
}

export async function getCompetencyRadarComparison(
  userId: string,
  schoolId: string | null | undefined,
  attemptBreakdown?: ExamAttemptAnalytics
): Promise<CompetencyRadarData> {
  const competencies = await prisma.area.findMany({
    where: { name: { not: 'otros' } },
    orderBy: { name: 'asc' },
  })

  const competencyIds = competencies.map((c) => c.id)

  const [studentExamResults, schoolExamResults, platformExamResults] =
    await Promise.all([
      prisma.examResult.findMany({
        where: { userId, completedAt: { not: null } },
        select: { score: true, exam: { select: { competencyId: true } } },
      }),
      schoolId
        ? prisma.examResult.findMany({
            where: {
              user: { schoolId },
              completedAt: { not: null },
            },
            select: { score: true, exam: { select: { competencyId: true } } },
          })
        : Promise.resolve([]),
      prisma.examResult.findMany({
        where: { completedAt: { not: null } },
        select: { score: true, exam: { select: { competencyId: true } } },
        take: 10000,
      }),
    ])

  const attemptScores: ScoreByCompetency[] = competencyIds.map((compId) => {
    const item = attemptBreakdown?.byCompetency.find((entry) => entry.id === compId)
    return { id: compId, score: item?.percent ?? 0 }
  })

  return {
    competencies: competencies.map((c) => ({
      id: c.id,
      displayName: c.displayName || c.name,
    })),
    studentScores: averageScoresByCompetency(studentExamResults, competencyIds),
    schoolScores: averageScoresByCompetency(schoolExamResults, competencyIds),
    platformScores: averageScoresByCompetency(
      platformExamResults,
      competencyIds
    ),
    attemptScores,
  }
}
