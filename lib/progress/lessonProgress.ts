/**
 * Reglas compartidas del progreso de lecciones.
 *
 * En la base conviven estados en español ("completado", "no_iniciado") por el
 * valor por defecto del esquema y en inglés ("completed", "not_started")
 * escritos por las APIs. Distintas pantallas comprobaban solo una de las dos
 * variantes, así que una misma lección contaba como terminada en una vista y
 * como pendiente en otra. Estos helpers son la única forma admitida de
 * interpretar el estado.
 */

/** Proporción mínima de aciertos en los ejercicios para dar la lección por vista. */
export const LESSON_PASSING_ACCURACY = 0.8

const COMPLETED_STATUSES = new Set(['completed', 'completado'])
const IN_PROGRESS_STATUSES = new Set(['in_progress', 'en_progreso'])

export function isLessonCompletedStatus(status?: string | null): boolean {
  return COMPLETED_STATUSES.has((status || '').trim().toLowerCase())
}

export function isLessonInProgressStatus(status?: string | null): boolean {
  return IN_PROGRESS_STATUSES.has((status || '').trim().toLowerCase())
}

/** Cuenta cuántos registros de progreso corresponden a lecciones terminadas. */
export function countCompletedLessons(
  progressRecords: Array<{ status?: string | null }>
): number {
  return progressRecords.filter((record) => isLessonCompletedStatus(record.status)).length
}

/** Porcentaje entero de avance, tolerante a denominadores en cero. */
export function toProgressPercentage(completed: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((completed / total) * 100)
}
