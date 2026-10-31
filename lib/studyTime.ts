/**
 * Tiempo de estudio del estudiante.
 *
 * - Lecciones: el navegador reporta segundos activos (pestaña visible y con
 *   actividad reciente) y se acumulan por día y sección en `LessonStudyTime`.
 *   El total por lección se copia a `StudentLessonProgress.totalTimeMinutes`,
 *   que es lo que ya leen los informes de progreso.
 * - Exámenes: el tiempo activo es la suma de `timeSpentSeconds` por pregunta.
 *
 * Si la migración de `LessonStudyTime` aún no se aplicó, el registro se omite
 * sin error y las consultas devuelven 0.
 */

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const STUDY_SECTIONS = ['video', 'theory', 'exercises'] as const
export type StudySection = (typeof STUDY_SECTIONS)[number]

/** El cliente reporta cada minuto; un reporte mayor indica datos inflados. */
export const MAX_SECONDS_PER_REPORT = 300

const COLOMBIA_OFFSET_MS = 5 * 60 * 60 * 1000

/** Fecha (sin hora) del día en Colombia, como la guarda una columna DATE. */
export function colombiaDay(date: Date): Date {
  const local = new Date(date.getTime() - COLOMBIA_OFFSET_MS)
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()))
}

function isMissingTableError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2021' || error.code === 'P2022')
  )
}

export function isStudySection(value: unknown): value is StudySection {
  return typeof value === 'string' && (STUDY_SECTIONS as readonly string[]).includes(value)
}

export async function recordLessonStudyTime(
  userId: string,
  lessonId: string,
  entries: Array<{ section: StudySection; seconds: number }>,
  now = new Date()
): Promise<{ stored: boolean }> {
  const valid = entries
    .map((e) => ({
      section: e.section,
      seconds: Math.min(MAX_SECONDS_PER_REPORT, Math.max(0, Math.round(e.seconds))),
    }))
    .filter((e) => e.seconds > 0)
  if (valid.length === 0) return { stored: true }

  const day = colombiaDay(now)

  try {
    for (const entry of valid) {
      await prisma.lessonStudyTime.upsert({
        where: {
          userId_lessonId_section_day: { userId, lessonId, section: entry.section, day },
        },
        create: { userId, lessonId, section: entry.section, day, seconds: entry.seconds },
        update: { seconds: { increment: entry.seconds } },
      })
    }

    const total = await prisma.lessonStudyTime.aggregate({
      where: { userId, lessonId },
      _sum: { seconds: true },
    })
    await prisma.studentLessonProgress.updateMany({
      where: { userId, lessonId },
      data: { totalTimeMinutes: Math.round((total._sum.seconds ?? 0) / 60) },
    })
    return { stored: true }
  } catch (error) {
    if (isMissingTableError(error)) return { stored: false }
    throw error
  }
}

/** Segundos de estudio en lecciones que cumplen el filtro. 0 si no hay tabla. */
export async function sumLessonStudySeconds(
  where: Prisma.LessonStudyTimeWhereInput
): Promise<number> {
  try {
    const total = await prisma.lessonStudyTime.aggregate({ where, _sum: { seconds: true } })
    return total._sum.seconds ?? 0
  } catch (error) {
    if (isMissingTableError(error)) return 0
    throw error
  }
}

/** Segundos de estudio en lecciones agrupados por estudiante. */
export async function lessonStudySecondsByUser(
  where: Prisma.LessonStudyTimeWhereInput
): Promise<Map<string, number>> {
  try {
    const rows = await prisma.lessonStudyTime.groupBy({
      by: ['userId'],
      where,
      _sum: { seconds: true },
    })
    return new Map(rows.map((r) => [r.userId, r._sum.seconds ?? 0]))
  } catch (error) {
    if (isMissingTableError(error)) return new Map()
    throw error
  }
}

/** Minutos activos de un examen a partir del tiempo por pregunta. */
export function activeExamMinutes(answerSeconds: Array<number | null | undefined>): number | null {
  const seconds = answerSeconds.reduce<number>((sum, s) => sum + (s ?? 0), 0)
  if (seconds <= 0) return null
  return Math.max(1, Math.round(seconds / 60))
}
