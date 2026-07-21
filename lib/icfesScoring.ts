import { ICFES_AREA_SLUGS } from '@/lib/icfesAreas'

/** Ponderación Saber 11: Inglés ×1, demás áreas ×3 */
export const ICFES_AREA_WEIGHTS: Record<string, number> = {
  ingles: 1,
  lectura_critica: 3,
  razonamiento_cuantitativo: 3,
  competencias_ciudadanas: 3,
  comunicacion_escrita: 3,
}

export type AreaScoreInput = {
  areaSlug: string
  score: number // 0-100
}

/**
 * Puntaje global ICFES (0–500) a partir de puntajes por área (0–100).
 * Usa ponderación oficial; solo incluye áreas presentes en el examen.
 *
 * Fórmula equivalente: (Σ puntaje×peso) / Σ pesos × 5
 * (Para las 5 áreas completas: (Σ×peso)/13×5)
 */
export function calculateIcfesGlobalScore(areaScores: AreaScoreInput[]): number | null {
  const present = areaScores.filter((a) => a.score >= 0 && ICFES_AREA_WEIGHTS[a.areaSlug])
  if (present.length === 0) return null

  let weightedSum = 0
  let weightTotal = 0
  for (const { areaSlug, score } of present) {
    const w = ICFES_AREA_WEIGHTS[areaSlug] ?? 3
    weightedSum += clamp100(score) * w
    weightTotal += w
  }
  if (weightTotal === 0) return null
  return Math.round((weightedSum / weightTotal) * 5)
}

export function clamp100(score: number): number {
  return Math.min(Math.max(Math.round(score), 0), 100)
}

export function isIcfesAreaSlug(slug: string): boolean {
  return ICFES_AREA_SLUGS.includes(slug.toLowerCase())
}
