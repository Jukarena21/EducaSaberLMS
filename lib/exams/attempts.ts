/** Intentos de un examen: cuántos ya hizo el alumno y cuál es el último. */

export function completedAttemptCount(
  results: Array<{ completedAt: Date | null }>
): number {
  return results.filter((r) => r.completedAt !== null).length
}

export function canStartNewAttempt(
  results: Array<{ completedAt: Date | null }>,
  maxAttempts: number | null | undefined
): boolean {
  const allowed = Math.max(1, maxAttempts ?? 1)
  return completedAttemptCount(results) < allowed
}

/**
 * De varios intentos del mismo alumno y examen, se queda el más reciente
 * ya entregado. Sirve para promedios e informes.
 */
export function latestCompletedByUserExam<
  T extends { userId: string; examId: string; completedAt: Date | string | null }
>(results: T[]): T[] {
  const map = new Map<string, T>()
  for (const result of results) {
    if (!result.completedAt) continue
    const key = `${result.userId}:${result.examId}`
    const prev = map.get(key)
    if (!prev || !prev.completedAt) {
      map.set(key, result)
      continue
    }
    const prevTime = new Date(prev.completedAt).getTime()
    const nextTime = new Date(result.completedAt).getTime()
    if (nextTime >= prevTime) map.set(key, result)
  }
  return Array.from(map.values())
}

/** Un solo alumno: el último entregado de cada examen. */
export function latestCompletedByExam<
  T extends { examId: string; completedAt: Date | string | null }
>(results: T[]): T[] {
  return latestCompletedByUserExam(
    results.map((r) => ({ ...r, userId: '_' }))
  )
}
