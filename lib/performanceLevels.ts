import { prisma } from '@/lib/prisma'
import {
  getAllDefaultBands,
  getDefaultBandsForArea,
  type DefaultBand,
} from '@/lib/performanceLevelDefaults'

export type ResolvedPerformanceLevel = {
  label: string
  description: string
  minScore: number
  maxScore: number
}

type BandLike = {
  areaSlug: string
  label: string
  minScore: number
  maxScore: number
  description: string
  sortOrder: number
}

function resolveFromBands(
  score: number,
  areaSlug: string,
  bands: BandLike[]
): ResolvedPerformanceLevel | null {
  const areaBands = bands
    .filter((b) => b.areaSlug === areaSlug)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const match = areaBands.find((b) => score >= b.minScore && score <= b.maxScore)
  if (!match) return null
  return {
    label: match.label,
    description: match.description,
    minScore: match.minScore,
    maxScore: match.maxScore,
  }
}

export function resolvePerformanceLevelFromDefaults(
  score: number,
  areaSlug: string
): ResolvedPerformanceLevel | null {
  return resolveFromBands(score, areaSlug, getDefaultBandsForArea(areaSlug))
}

/**
 * Obtiene el perfil aplicable: examen > año escolar > default global.
 */
export async function loadPerformanceBandsForExam(exam: {
  id: string
  performanceLevelProfileId?: string | null
  academicGrade?: string | null
}): Promise<BandLike[]> {
  if (exam.performanceLevelProfileId) {
    const bands = await prisma.performanceLevelBand.findMany({
      where: { profileId: exam.performanceLevelProfileId },
      orderBy: [{ areaSlug: 'asc' }, { sortOrder: 'asc' }],
    })
    if (bands.length > 0) return bands
  }

  const gradeProfile = exam.academicGrade
    ? await prisma.performanceLevelProfile.findFirst({
        where: { isDefault: true, academicGrade: exam.academicGrade },
        include: { bands: true },
      })
    : null
  if (gradeProfile?.bands.length) return gradeProfile.bands

  const globalProfile = await prisma.performanceLevelProfile.findFirst({
    where: { isDefault: true, academicGrade: null, areaSlug: null },
    include: { bands: true },
  })
  if (globalProfile?.bands.length) return globalProfile.bands

  return getAllDefaultBands()
}

export async function resolvePerformanceLevelForExam(
  score: number,
  areaSlug: string,
  exam: { id: string; performanceLevelProfileId?: string | null; academicGrade?: string | null }
): Promise<ResolvedPerformanceLevel | null> {
  const bands = await loadPerformanceBandsForExam(exam)
  return resolveFromBands(score, areaSlug, bands)
}

/** Resultados válidos para promedios: presentó y obtuvo puntaje > 0 */
export function isCountableExamAttempt(result: {
  completedAt?: Date | string | null
  score?: number | null
}): boolean {
  if (!result.completedAt) return false
  if (result.score == null) return false
  return result.score > 0
}
