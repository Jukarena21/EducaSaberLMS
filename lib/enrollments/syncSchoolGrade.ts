import { prisma } from '@/lib/prisma'
import {
  academicGradeAliases,
  academicGradesEqual,
  normalizeAcademicGrade,
} from '@/lib/academicGrades'

export async function findPublishedCourseIdsForSchoolGrade(
  schoolId: string,
  academicGrade: string
): Promise<string[]> {
  const aliases = academicGradeAliases(academicGrade)
  if (!schoolId || aliases.length === 0) return []

  const courses = await prisma.course.findMany({
    where: {
      isPublished: true,
      academicGrade: { in: aliases },
      courseSchools: { some: { schoolId } },
    },
    select: { id: true },
  })
  return courses.map((course) => course.id)
}

async function enrollInCourses(userId: string, courseIds: string[]) {
  for (const courseId of courseIds) {
    await prisma.courseEnrollment.upsert({
      where: {
        userId_courseId: { userId, courseId },
      },
      update: { isActive: true },
      create: {
        userId,
        courseId,
        isActive: true,
        enrolledAt: new Date(),
      },
    })
  }
}

async function deactivateOtherGradedEnrollments(userId: string, keepCourseIds: string[]) {
  await prisma.courseEnrollment.updateMany({
    where: {
      userId,
      isActive: true,
      course: { academicGrade: { not: null } },
      ...(keepCourseIds.length > 0 ? { courseId: { notIn: keepCourseIds } } : {}),
    },
    data: { isActive: false },
  })
}

/**
 * Inscribe al alumno en los cursos publicados de su colegio y grado.
 * Si cambian colegio o grado, desactiva los cursos con grado que ya no le tocan.
 * Los cursos sin grado (asignados a mano) no se tocan.
 */
export async function syncStudentSchoolGradeEnrollments(options: {
  userId: string
  schoolId?: string | null
  academicGrade?: string | null
  previousSchoolId?: string | null
  previousGrade?: string | null
  courseIds?: string[]
}): Promise<number> {
  const schoolId = options.schoolId || null
  const grade = normalizeAcademicGrade(options.academicGrade)
  const previousSchoolId = options.previousSchoolId ?? undefined
  const previousGrade = normalizeAcademicGrade(options.previousGrade ?? null)
  const isCreate = previousSchoolId === undefined && options.previousGrade === undefined

  const schoolChanged = Boolean(
    previousSchoolId && schoolId && previousSchoolId !== schoolId
  )
  const gradeChanged = Boolean(
    previousGrade && grade && !academicGradesEqual(previousGrade, grade)
  )
  const firstAssignment = Boolean((!previousGrade && grade) || (!previousSchoolId && schoolId))

  if (!isCreate && !schoolChanged && !gradeChanged && !firstAssignment) {
    return 0
  }

  if (!schoolId || !grade) return 0

  const courseIds =
    options.courseIds ?? (await findPublishedCourseIdsForSchoolGrade(schoolId, grade))

  if (!isCreate && (schoolChanged || gradeChanged || firstAssignment)) {
    await deactivateOtherGradedEnrollments(options.userId, courseIds)
  }

  if (courseIds.length === 0) return 0
  await enrollInCourses(options.userId, courseIds)
  return courseIds.length
}
