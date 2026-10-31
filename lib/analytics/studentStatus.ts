/**
 * Estado académico de un estudiante para la pestaña de Analytics.
 *
 * "Requiere atención" es un juicio académico: necesita al menos
 * MIN_EXAMS_FOR_ATTENTION exámenes terminados para no marcar a quien apenas
 * empieza. La inactividad se informa aparte porque es un tema de seguimiento,
 * no de rendimiento.
 */

import { resultPassed } from '@/lib/analytics/filters'

export const MIN_EXAMS_FOR_ATTENTION = 2
export const ATTENTION_AVERAGE_BELOW = 60
export const ATTENTION_PASS_RATE_BELOW = 50
export const INACTIVE_AFTER_DAYS = 30

export type StudentStatus = 'excelente' | 'bueno' | 'mejorable' | 'requiere_atencion' | 'sin_datos'

type CompletedResult = {
  score: number
  isPassed?: boolean | null
  exam?: { passingScore?: number | null } | null
}

export type StudentAcademicSummary = {
  totalExams: number
  averageScore: number
  passRate: number
  status: StudentStatus
  riskFactors: string[]
  inactiveDays: number | null
  isInactive: boolean
}

const round1 = (value: number) => Math.round(value * 10) / 10

export function summarizeStudent(
  results: CompletedResult[],
  lastActivity: Date | null,
  now: Date = new Date()
): StudentAcademicSummary {
  const totalExams = results.length
  const averageScore = totalExams > 0
    ? round1(results.reduce((sum, r) => sum + (r.score || 0), 0) / totalExams)
    : 0
  const passRate = totalExams > 0
    ? round1((results.filter(resultPassed).length / totalExams) * 100)
    : 0

  const riskFactors: string[] = []
  const enoughExams = totalExams >= MIN_EXAMS_FOR_ATTENTION
  if (enoughExams && averageScore < ATTENTION_AVERAGE_BELOW) {
    riskFactors.push(`Promedio por debajo de ${ATTENTION_AVERAGE_BELOW}%`)
  }
  if (enoughExams && passRate < ATTENTION_PASS_RATE_BELOW) {
    riskFactors.push(`Aprueba menos del ${ATTENTION_PASS_RATE_BELOW}% de sus exámenes`)
  }

  let status: StudentStatus
  if (totalExams === 0) status = 'sin_datos'
  else if (riskFactors.length > 0) status = 'requiere_atencion'
  else if (averageScore >= 80) status = 'excelente'
  else if (averageScore >= 70) status = 'bueno'
  else status = 'mejorable'

  const inactiveDays = lastActivity
    ? Math.floor((now.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000))
    : null

  return {
    totalExams,
    averageScore,
    passRate,
    status,
    riskFactors,
    inactiveDays,
    isInactive: inactiveDays === null || inactiveDays > INACTIVE_AFTER_DAYS,
  }
}
