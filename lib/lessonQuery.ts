import type { Prisma } from '@prisma/client'

/**
 * Construye el `where` para listar lecciones combinando filtros sin sobrescribir condiciones
 * (antes moduleLessons se pisaba entre sí).
 */
export type LessonListFilterInput = {
  search?: string
  moduleId?: string
  competencyId?: string
  /** `true` = ICFES, `false` = personalizado (no enlazada a curso ICFES vía módulos) */
  isIcfesCourse?: boolean
  role: string
  schoolId?: string | null
}

export function buildLessonListWhere(input: LessonListFilterInput): Prisma.LessonWhereInput {
  const and: Prisma.LessonWhereInput[] = []

  if (input.search?.trim()) {
    const s = input.search.trim()
    and.push({
      OR: [
        { title: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
      ],
    })
  }

  if (input.role === 'school_admin' && input.schoolId) {
    and.push({
      moduleLessons: {
        some: {
          module: {
            courseModules: {
              some: {
                course: {
                  OR: [
                    { courseSchools: { some: { schoolId: input.schoolId } } },
                    { courseSchools: { none: {} } },
                  ],
                },
              },
            },
          },
        },
      },
    })
  }

  if (input.moduleId) {
    and.push({
      moduleLessons: { some: { moduleId: input.moduleId } },
    })
  }

  if (input.competencyId) {
    and.push({
      OR: [
        { competencyId: input.competencyId },
        {
          moduleLessons: {
            some: {
              module: {
                courseModules: {
                  some: { course: { competencyId: input.competencyId } },
                },
              },
            },
          },
        },
      ],
    })
  }

  if (input.isIcfesCourse === true) {
    // En curso ICFES vía módulo, o lección “huérfana” con área asignada
    and.push({
      OR: [
        {
          moduleLessons: {
            some: {
              module: {
                courseModules: {
                  some: { course: { isIcfesCourse: true } },
                },
              },
            },
          },
        },
        {
          AND: [{ moduleLessons: { none: {} } }, { competencyId: { not: null } }],
        },
      ],
    })
  } else if (input.isIcfesCourse === false) {
    // No vinculada a ningún curso ICFES por módulos (incluye lecciones sin módulos)
    and.push({
      NOT: {
        moduleLessons: {
          some: {
            module: {
              courseModules: {
                some: { course: { isIcfesCourse: true } },
              },
            },
          },
        },
      },
    })
  }

  if (and.length === 0) return {}
  if (and.length === 1) return and[0] as Prisma.LessonWhereInput
  return { AND: and }
}
