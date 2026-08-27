import { resolveAreaDisplayName } from '@/lib/icfesAreas'

export type ReportQuestionSource = {
  id: string
  orderIndex?: number | null
  tema?: string | null
  subtema?: string | null
  componente?: string | null
  competencia?: string | null
  difficultyLevel?: string | null
  competency?: { id?: string | null; name?: string | null; displayName?: string | null } | null
}

export type QuestionReportRow = {
  questionId: string
  /** Número visible de la pregunta dentro del simulacro, empezando en 1 */
  number: number
  area: string
  competencia: string
  componente: string
  tema: string
  subtema: string
  dificultad: string
  correct: number
  total: number
  pct: number
}

export function pct(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0
}

/**
 * Numera las preguntas del simulacro según su orden de presentación.
 * Se usa `orderIndex` cuando existe; si viene nulo o repetido, el desempate
 * es por id para que la numeración sea estable entre PDF, CSV y pantalla.
 */
export function buildQuestionNumberMap(
  questions: ReportQuestionSource[]
): Map<string, number> {
  const sorted = [...questions].sort((a, b) => {
    const ai = a.orderIndex ?? Number.MAX_SAFE_INTEGER
    const bi = b.orderIndex ?? Number.MAX_SAFE_INTEGER
    if (ai !== bi) return ai - bi
    return a.id.localeCompare(b.id)
  })

  const map = new Map<string, number>()
  sorted.forEach((q, index) => map.set(q.id, index + 1))
  return map
}

const EMPTY = '—'

function label(value?: string | null): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : EMPTY
}

/**
 * Agrega aciertos por pregunta a partir de las respuestas de todos los estudiantes.
 * Devuelve una fila por pregunta del examen, incluidas las que nadie respondió.
 */
export function buildQuestionReportRows(
  questions: ReportQuestionSource[],
  answers: Array<{ questionId: string; isCorrect: boolean | null }>
): QuestionReportRow[] {
  const numberMap = buildQuestionNumberMap(questions)
  const tally = new Map<string, { correct: number; total: number }>()

  for (const answer of answers) {
    const entry = tally.get(answer.questionId) ?? { correct: 0, total: 0 }
    entry.total += 1
    if (answer.isCorrect) entry.correct += 1
    tally.set(answer.questionId, entry)
  }

  return questions
    .map((q) => {
      const counts = tally.get(q.id) ?? { correct: 0, total: 0 }
      return {
        questionId: q.id,
        number: numberMap.get(q.id) ?? 0,
        area: q.competency ? resolveAreaDisplayName(q.competency, EMPTY) : EMPTY,
        competencia: label(q.competencia),
        componente: label(q.componente),
        tema: label(q.tema),
        subtema: label(q.subtema),
        dificultad: label(q.difficultyLevel),
        correct: counts.correct,
        total: counts.total,
        pct: pct(counts.correct, counts.total),
      }
    })
    .sort((a, b) => a.number - b.number)
}

/**
 * Agrupa las filas por área para que las tablas del reporte no mezclen
 * competencias de áreas distintas en un mismo bloque.
 */
export function groupRowsByArea(
  rows: QuestionReportRow[]
): Array<{ area: string; rows: QuestionReportRow[]; correct: number; total: number; pct: number }> {
  const groups = new Map<string, QuestionReportRow[]>()

  for (const row of rows) {
    const list = groups.get(row.area) ?? []
    list.push(row)
    groups.set(row.area, list)
  }

  return Array.from(groups.entries())
    .map(([area, areaRows]) => {
      const correct = areaRows.reduce((sum, r) => sum + r.correct, 0)
      const total = areaRows.reduce((sum, r) => sum + r.total, 0)
      return { area, rows: areaRows, correct, total, pct: pct(correct, total) }
    })
    .sort((a, b) => a.area.localeCompare(b.area, 'es'))
}
