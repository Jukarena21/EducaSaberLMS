/**
 * Filtros compartidos por las rutas de la pestaña de Analytics.
 *
 * Todas las métricas se calculan sobre los mismos criterios para que las
 * tarjetas, gráficas e informes de la pestaña cuenten lo mismo:
 * - el colegio, el género, el estrato, la edad y el año escolar son los del
 *   estudiante, no los del curso al que pertenece el examen;
 * - solo cuentan los exámenes terminados (un intento en curso tiene puntaje 0);
 * - la ventana de tiempo es la del período elegido en la pantalla.
 */

import type { Prisma } from '@prisma/client'
import { colombiaDay } from '@/lib/studyTime'
import { academicGradeAliases } from '@/lib/academicGrades'

export type AnalyticsFilters = {
  from: Date
  to: Date
  schoolId?: string
  courseId?: string
  academicGrade?: string
  competencyId?: string
  minAge?: number
  maxAge?: number
  gender?: string
  socioeconomicStratum?: number
}

type SessionUser = { role?: string | null; schoolId?: string | null }

const PERIOD_DAYS: Record<string, number> = {
  '1m': 30,
  '3m': 90,
  '6m': 182,
  '1y': 365,
}

export const DEFAULT_ANALYTICS_PERIOD = '6m'

function optionalString(value: string | null): string | undefined {
  if (!value || value === 'all') return undefined
  return value
}

function optionalInt(value: string | null): number | undefined {
  if (!value) return undefined
  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function resolveAnalyticsFilters(
  searchParams: URLSearchParams,
  user: SessionUser
): AnalyticsFilters {
  const now = new Date()
  const toParam = searchParams.get('to')
  const fromParam = searchParams.get('from')
  const period = searchParams.get('period') || DEFAULT_ANALYTICS_PERIOD
  const days = PERIOD_DAYS[period] ?? PERIOD_DAYS[DEFAULT_ANALYTICS_PERIOD]

  const to = toParam ? new Date(toParam) : now
  const from = fromParam ? new Date(fromParam) : new Date(to.getTime() - days * 24 * 60 * 60 * 1000)

  return {
    from,
    to,
    // Un admin de colegio solo ve su colegio, envíe lo que envíe
    schoolId:
      user.role === 'school_admin'
        ? user.schoolId || undefined
        : optionalString(searchParams.get('schoolId')),
    courseId: optionalString(searchParams.get('courseId')),
    academicGrade: optionalString(searchParams.get('academicGrade')),
    competencyId: optionalString(searchParams.get('competencyId')),
    minAge: optionalInt(searchParams.get('minAge')),
    maxAge: optionalInt(searchParams.get('maxAge')),
    gender: optionalString(searchParams.get('gender')),
    socioeconomicStratum: optionalInt(searchParams.get('socioeconomicStratum')),
  }
}

/** Clave estable para cachear: se arma con los filtros ya resueltos, no con la URL. */
export function analyticsCacheKey(scope: string, filters: AnalyticsFilters): string {
  const day = (d: Date) => d.toISOString().slice(0, 13)
  return `analytics:v2:${scope}:${JSON.stringify({
    ...filters,
    from: day(filters.from),
    to: day(filters.to),
  })}`
}

export function studentWhere(filters: AnalyticsFilters): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = { role: 'student' }

  if (filters.schoolId) where.schoolId = filters.schoolId
  if (filters.gender) where.gender = { equals: filters.gender, mode: 'insensitive' }
  if (filters.socioeconomicStratum !== undefined) {
    where.socioeconomicStratum = filters.socioeconomicStratum
  }

  if (filters.minAge !== undefined || filters.maxAge !== undefined) {
    const now = new Date()
    const birth: Prisma.DateTimeNullableFilter = {}
    if (filters.minAge !== undefined) {
      const latest = new Date(now)
      latest.setFullYear(latest.getFullYear() - filters.minAge)
      birth.lte = latest
    }
    if (filters.maxAge !== undefined) {
      const earliest = new Date(now)
      earliest.setFullYear(earliest.getFullYear() - filters.maxAge - 1)
      birth.gt = earliest
    }
    where.dateOfBirth = birth
  }

  return where
}

/**
 * Resultados de examen terminados dentro del período. El año escolar es el
 * del estudiante; si el estudiante no lo tiene registrado se usa el del examen
 * o el de su curso.
 */
export function examResultWhere(filters: AnalyticsFilters): Prisma.ExamResultWhereInput {
  const examWhere: Prisma.ExamWhereInput = {}
  if (filters.competencyId) examWhere.competencyId = filters.competencyId
  if (filters.courseId) examWhere.courseId = filters.courseId

  const where: Prisma.ExamResultWhereInput = {
    completedAt: { gte: filters.from, lte: filters.to },
    user: studentWhere(filters),
  }
  if (Object.keys(examWhere).length > 0) where.exam = examWhere

  if (filters.academicGrade) {
    const grades = academicGradeAliases(filters.academicGrade)
    if (grades.length > 0) {
      where.AND = [
        {
          OR: [
            { user: { academicGrade: { in: grades } } },
            {
              user: { academicGrade: null },
              exam: { OR: [{ academicGrade: { in: grades } }, { course: { academicGrade: { in: grades } } }] },
            },
          ],
        },
      ]
    }
  }

  return where
}

/** Progreso de lecciones con los mismos criterios de estudiante, curso y área. */
export function lessonProgressWhere(
  filters: AnalyticsFilters
): Prisma.StudentLessonProgressWhereInput {
  const where: Prisma.StudentLessonProgressWhereInput = {
    updatedAt: { gte: filters.from, lte: filters.to },
    user: studentWhere(filters),
  }

  const lessonWhere: Prisma.LessonWhereInput = {}
  if (filters.competencyId) lessonWhere.competencyId = filters.competencyId
  if (filters.courseId) {
    lessonWhere.moduleLessons = {
      some: { module: { courseModules: { some: { courseId: filters.courseId } } } },
    }
  }
  if (Object.keys(lessonWhere).length > 0) where.lesson = lessonWhere

  if (filters.academicGrade) {
    const grades = academicGradeAliases(filters.academicGrade)
    if (grades.length > 0) {
      where.AND = [
        {
          OR: [
            { user: { academicGrade: { in: grades } } },
            {
              user: { academicGrade: null },
              lesson: {
                moduleLessons: {
                  some: {
                    module: { courseModules: { some: { course: { academicGrade: { in: grades } } } } },
                  },
                },
              },
            },
          ],
        },
      ]
    }
  }

  return where
}

/** Tiempo de estudio en lecciones dentro del período, con los mismos filtros. */
export function lessonStudyTimeWhere(
  filters: AnalyticsFilters
): Prisma.LessonStudyTimeWhereInput {
  const where: Prisma.LessonStudyTimeWhereInput = {
    day: { gte: colombiaDay(filters.from), lte: colombiaDay(filters.to) },
    user: studentWhere(filters),
  }

  const lessonWhere: Prisma.LessonWhereInput = {}
  if (filters.competencyId) lessonWhere.competencyId = filters.competencyId
  if (filters.courseId) {
    lessonWhere.moduleLessons = {
      some: { module: { courseModules: { some: { courseId: filters.courseId } } } },
    }
  }
  if (Object.keys(lessonWhere).length > 0) where.lesson = lessonWhere

  if (filters.academicGrade) {
    const grades = academicGradeAliases(filters.academicGrade)
    if (grades.length > 0) {
      where.AND = [
        {
          OR: [
            { user: { academicGrade: { in: grades } } },
            {
              user: { academicGrade: null },
              lesson: {
                moduleLessons: {
                  some: {
                    module: { courseModules: { some: { course: { academicGrade: { in: grades } } } } },
                  },
                },
              },
            },
          ],
        },
      ]
    }
  }

  return where
}

/** Colombia no tiene horario de verano: siempre UTC-5. El servidor corre en UTC. */
const COLOMBIA_OFFSET_MS = 5 * 60 * 60 * 1000

export function colombiaHour(date: Date): number {
  return new Date(date.getTime() - COLOMBIA_OFFSET_MS).getUTCHours()
}

export function colombiaMonthKey(date: Date): string {
  const local = new Date(date.getTime() - COLOMBIA_OFFSET_MS)
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, '0')}`
}

/** Aprobado según la nota mínima del propio examen, no un 70 fijo. */
export function resultPassed(result: {
  score: number
  isPassed?: boolean | null
  exam?: { passingScore?: number | null } | null
}): boolean {
  if (typeof result.isPassed === 'boolean') return result.isPassed
  return result.score >= (result.exam?.passingScore ?? 70)
}
