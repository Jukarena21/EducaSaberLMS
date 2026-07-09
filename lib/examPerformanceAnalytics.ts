import { prisma } from '@/lib/prisma'
import { ICFES_AREA_SLUGS, resolveAreaDisplayName } from '@/lib/icfesAreas'

export type ScoreByArea = {
  id: string
  score: number
}

/**
 * Comparación por ÁREA ICFES (modelo Area, tabla Competency en BD).
 * Un "área" es la materia: Matemáticas, Lectura Crítica, etc.
 */
export type AreaRadarData = {
  areas: Array<{ id: string; displayName: string }>
  attemptScores: ScoreByArea[]
  studentScores: ScoreByArea[]
  schoolScores: ScoreByArea[]
  platformScores: ScoreByArea[]
}

export type BreakdownItem = {
  id?: string
  label: string
  total: number
  correct: number
  incorrect: number
  percent: number
  /** Porcentaje de la prueba que representa este ítem (preguntas/total) */
  sharePercent: number
}

/**
 * Desglose del intento por cada nivel de clasificación de la pregunta.
 * - byArea: agrupado por Área ICFES (Area / competencyId)
 * - byCompetencia: agrupado por el campo de texto "competencia" de la pregunta
 * - byComponente / byTema / bySubtema: campos de texto de la pregunta
 */
export type ExamAttemptAnalytics = {
  byArea: BreakdownItem[]
  byCompetencia: BreakdownItem[]
  byComponente: BreakdownItem[]
  byTema: BreakdownItem[]
  bySubtema: BreakdownItem[]
}

type ExamQuestionRow = {
  id: string
  competencyId?: string | null
  competencia?: string | null
  componente?: string | null
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

function averageScoresByArea(
  examResults: Array<{ score: number; exam: { competencyId: string | null } }>,
  areaIds: string[]
): ScoreByArea[] {
  return areaIds.map((areaId) => {
    const exams = examResults.filter(
      (r) => r.exam.competencyId === areaId && r.score > 0
    )
    const avgScore =
      exams.length > 0
        ? exams.reduce((sum, e) => sum + e.score, 0) / exams.length
        : 0
    return { id: areaId, score: clampScore(avgScore) }
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
  const totalQuestions = questions.length
  const groups = new Map<
    string,
    { id?: string; label: string; total: number; correct: number }
  >()

  for (const question of questions) {
    const label = getLabel(question)?.trim() || fallbackLabel
    const groupId = getId?.(question) || undefined
    const key = groupId ? `id:${groupId}` : `label:${label}`
    const current = groups.get(key) || { id: groupId, label, total: 0, correct: 0 }
    current.total += 1
    if (answerMap.get(question.id)) current.correct += 1
    groups.set(key, current)
  }

  return Array.from(groups.values())
    .map((stats) => ({
      id: stats.id,
      label: stats.label,
      total: stats.total,
      correct: stats.correct,
      incorrect: stats.total - stats.correct,
      percent:
        stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      sharePercent:
        totalQuestions > 0 ? Math.round((stats.total / totalQuestions) * 100) : 0,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'))
}

export function buildExamAttemptBreakdown(
  questions: ExamQuestionRow[],
  answers: AnswerRow[],
  defaultAreaLabel = 'General'
): ExamAttemptAnalytics {
  return {
    byArea: aggregateBreakdown(
      questions,
      answers,
      (q) =>
        q.competency
          ? resolveAreaDisplayName(
              { id: q.competencyId, name: q.competency.name, displayName: q.competency.displayName },
              defaultAreaLabel
            )
          : defaultAreaLabel,
      (q) => q.competencyId || undefined
    ),
    byCompetencia: aggregateBreakdown(questions, answers, (q) => q.competencia),
    byComponente: aggregateBreakdown(questions, answers, (q) => q.componente),
    byTema: aggregateBreakdown(questions, answers, (q) => q.tema),
    bySubtema: aggregateBreakdown(questions, answers, (q) => q.subtema),
  }
}

/**
 * Comparación por área ICFES: puntaje de este intento vs. promedio histórico
 * del estudiante, del colegio y de la plataforma.
 */
export async function getAreaRadarComparison(
  userId: string,
  schoolId: string | null | undefined,
  attemptBreakdown?: ExamAttemptAnalytics
): Promise<AreaRadarData> {
  const icfesAreas = await prisma.area.findMany({
    where: { name: { in: ICFES_AREA_SLUGS } },
    orderBy: { name: 'asc' },
  })
  // Fallback: si la BD usa otros slugs, no dejar el radar vacío.
  const areas =
    icfesAreas.length > 0
      ? icfesAreas
      : await prisma.area.findMany({
          where: { name: { not: 'otros' } },
          orderBy: { name: 'asc' },
        })

  const areaIds = areas.map((a) => a.id)

  const [studentExamResults, schoolExamResults, platformExamResults] =
    await Promise.all([
      prisma.examResult.findMany({
        where: { userId, completedAt: { not: null }, score: { gt: 0 } },
        select: { score: true, exam: { select: { competencyId: true } } },
      }),
      schoolId
        ? prisma.examResult.findMany({
            where: {
              user: { schoolId },
              completedAt: { not: null },
              score: { gt: 0 },
            },
            select: { score: true, exam: { select: { competencyId: true } } },
          })
        : Promise.resolve([]),
      prisma.examResult.findMany({
        where: { completedAt: { not: null }, score: { gt: 0 } },
        select: { score: true, exam: { select: { competencyId: true } } },
        take: 10000,
      }),
    ])

  const attemptScores: ScoreByArea[] = areaIds.map((areaId) => {
    const item = attemptBreakdown?.byArea.find((entry) => entry.id === areaId)
    return { id: areaId, score: item?.percent ?? 0 }
  })

  return {
    areas: areas.map((a) => ({
      id: a.id,
      displayName: resolveAreaDisplayName(a),
    })),
    attemptScores,
    studentScores: averageScoresByArea(studentExamResults, areaIds),
    schoolScores: averageScoresByArea(schoolExamResults, areaIds),
    platformScores: averageScoresByArea(platformExamResults, areaIds),
  }
}
