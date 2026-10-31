import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * Qué exámenes “normales” (no simulacro manual) puede ver o iniciar un
 * estudiante.
 *
 * - Con curso: solo si está inscrito.
 * - Sin curso: si está asignado a su colegio o a él; si nadie lo asignó,
 *   se trata como diagnóstico de plataforma y sigue visible.
 * Los simulacros manuales no entran aquí: se resuelven por ExamAssignment /
 * ExamSchool en cada ruta.
 */
export function regularExamVisibilityWhere(
  userId: string,
  schoolId: string | null,
  enrolledCourseIds: string[]
): Prisma.ExamWhereInput {
  const assignedOrGlobal: Prisma.ExamWhereInput[] = [
    { examAssignments: { some: { userId, isActive: true } } },
    {
      AND: [
        { examSchools: { none: {} } },
        { examAssignments: { none: {} } },
      ],
    },
  ]
  if (schoolId) {
    assignedOrGlobal.unshift({
      examSchools: { some: { schoolId, isActive: true } },
    })
  }

  const or: Prisma.ExamWhereInput[] = [
    { courseId: null, OR: assignedOrGlobal },
  ]
  if (enrolledCourseIds.length > 0) {
    or.unshift({ courseId: { in: enrolledCourseIds } })
  }

  return {
    isPublished: true,
    isManualSimulacro: false,
    OR: or,
  }
}

export async function studentEnrolledCourseIds(userId: string): Promise<string[]> {
  const rows = await prisma.courseEnrollment.findMany({
    where: { userId },
    select: { courseId: true },
  })
  return rows.map((r) => r.courseId)
}

/** Comprueba si el estudiante puede iniciar un examen que ya no es simulacro manual. */
export async function studentCanStartRegularExam(
  userId: string,
  schoolId: string | null,
  exam: { id: string; courseId: string | null }
): Promise<boolean> {
  if (exam.courseId) {
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: { userId, courseId: exam.courseId },
      select: { id: true },
    })
    return !!enrollment
  }

  const [schoolLinks, userLinks] = await Promise.all([
    prisma.examSchool.count({ where: { examId: exam.id, isActive: true } }),
    prisma.examAssignment.count({ where: { examId: exam.id, isActive: true } }),
  ])

  if (schoolLinks === 0 && userLinks === 0) return true

  const [schoolOk, userOk] = await Promise.all([
    schoolId
      ? prisma.examSchool.findFirst({
          where: { examId: exam.id, schoolId, isActive: true },
          select: { id: true },
        })
      : Promise.resolve(null),
    prisma.examAssignment.findFirst({
      where: { examId: exam.id, userId, isActive: true },
      select: { id: true },
    }),
  ])

  return !!(schoolOk || userOk)
}
