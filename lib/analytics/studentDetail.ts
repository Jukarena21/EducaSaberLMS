/**
 * Métricas de estudiantes para Analytics: el detalle de un estudiante (vista y
 * reporte masivo en PDF) y el avance por curso que usa también la lista.
 */

import { prisma } from '@/lib/prisma'
import { colombiaMonthKey, resultPassed } from '@/lib/analytics/filters'
import { summarizeStudent } from '@/lib/analytics/studentStatus'
import { COMPLETED_LESSON_STATUS_VALUES } from '@/lib/progress/lessonProgress'

const round1 = (value: number) => Math.round(value * 10) / 10

export const COMPLETED_LESSON_STATUSES = [...COMPLETED_LESSON_STATUS_VALUES]

export type EnrollmentWithLessons = {
  userId: string
  enrolledAt: Date
  course: {
    id: string
    title: string
    academicGrade: string | null
    competency: { name: string; displayName: string | null } | null
    courseModules: Array<{
      module: { moduleLessons: Array<{ lessonId: string; lesson: { isPublished: boolean } }> }
    }>
  }
}

export const enrollmentSelect = {
  userId: true,
  enrolledAt: true,
  course: {
    select: {
      id: true,
      title: true,
      academicGrade: true,
      competency: { select: { name: true, displayName: true } },
      courseModules: {
        select: {
          module: {
            select: {
              moduleLessons: {
                select: { lessonId: true, lesson: { select: { isPublished: true } } },
              },
            },
          },
        },
      },
    },
  },
} as const

/** Avance de un curso = lecciones publicadas terminadas / lecciones publicadas. */
export function courseProgress(enrollment: EnrollmentWithLessons, completedLessons: Set<string>) {
  const lessonIds = new Set<string>()
  enrollment.course.courseModules.forEach((cm) =>
    cm.module.moduleLessons.forEach((ml) => {
      if (ml.lesson.isPublished) lessonIds.add(ml.lessonId)
    })
  )
  const total = lessonIds.size
  const done = Array.from(lessonIds).filter((id) => completedLessons.has(id)).length
  return {
    totalLessons: total,
    completedLessons: done,
    progressPercentage: total > 0 ? round1((done / total) * 100) : 0,
  }
}

export function latestDate(...dates: Array<Date | null | undefined>): Date | null {
  const valid = dates.filter((d): d is Date => d instanceof Date)
  if (valid.length === 0) return null
  return new Date(Math.max(...valid.map((d) => d.getTime())))
}

export type StudentDetailResult =
  | { status: 'ok'; data: Awaited<ReturnType<typeof computeDetail>> }
  | { status: 'not_found' | 'forbidden' | 'not_student' }

/** Detalle de un estudiante con todo su historial, no solo el período. */
export async function buildStudentDetail(
  studentId: string,
  restrictToSchoolId?: string | null
): Promise<StudentDetailResult> {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, schoolId: true, academicGrade: true },
  })

  if (!student) return { status: 'not_found' }
  if (restrictToSchoolId && student.schoolId !== restrictToSchoolId) return { status: 'forbidden' }
  if (student.role !== 'student') return { status: 'not_student' }

  return { status: 'ok', data: await computeDetail(student) }
}

async function computeDetail(student: {
  id: string
  firstName: string
  lastName: string
  email: string
  academicGrade: string | null
}) {
  const studentId = student.id
  const [examResults, lessonProgress, enrollments] = await Promise.all([
    prisma.examResult.findMany({
      where: { userId: studentId, completedAt: { not: null } },
      select: {
        id: true,
        examId: true,
        score: true,
        isPassed: true,
        completedAt: true,
        totalQuestions: true,
        correctAnswers: true,
        timeTakenMinutes: true,
        exam: {
          select: {
            title: true,
            passingScore: true,
            competency: { select: { id: true, name: true, displayName: true } },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    }),
    prisma.studentLessonProgress.findMany({
      where: { userId: studentId },
      select: { lessonId: true, status: true, totalTimeMinutes: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.courseEnrollment.findMany({
      where: { userId: studentId, isActive: true },
      select: enrollmentSelect,
      orderBy: { enrolledAt: 'desc' },
    }),
  ])

  const lastActivity = latestDate(examResults[0]?.completedAt, lessonProgress[0]?.updatedAt)
  const summary = summarizeStudent(examResults, lastActivity)

  const completedLessons = new Set(
    lessonProgress.filter((lp) => COMPLETED_LESSON_STATUSES.includes(lp.status)).map((lp) => lp.lessonId)
  )
  const lessonMinutes = new Map(lessonProgress.map((lp) => [lp.lessonId, lp.totalTimeMinutes || 0]))
  const coursesDetail = enrollments.map((enrollment) => {
    const progress = courseProgress(enrollment, completedLessons)
    const courseLessonIds = new Set(
      enrollment.course.courseModules.flatMap((cm) => cm.module.moduleLessons.map((ml) => ml.lessonId))
    )
    const courseMinutes = Array.from(courseLessonIds).reduce((sum, id) => sum + (lessonMinutes.get(id) || 0), 0)
    return {
      courseId: enrollment.course.id,
      courseTitle: enrollment.course.title,
      competencyName:
        enrollment.course.competency?.displayName || enrollment.course.competency?.name || 'Sin competencia',
      enrollmentDate: enrollment.enrolledAt.toISOString(),
      progressPercentage: progress.progressPercentage,
      completedLessons: progress.completedLessons,
      totalLessons: progress.totalLessons,
      timeSpentHours: round1(courseMinutes / 60),
      isActive: true,
    }
  })

  const competencyMap = new Map<string, { name: string; scores: number[]; passed: number }>()
  examResults.forEach((er) => {
    const competency = er.exam?.competency
    if (!competency) return
    if (!competencyMap.has(competency.id)) {
      competencyMap.set(competency.id, { name: competency.displayName || competency.name, scores: [], passed: 0 })
    }
    const entry = competencyMap.get(competency.id)!
    entry.scores.push(er.score)
    if (resultPassed(er)) entry.passed += 1
  })
  const competencyPerformance = Array.from(competencyMap.entries()).map(([competencyId, data]) => ({
    competencyId,
    competencyName: data.name,
    averageScore: round1(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
    examsCount: data.scores.length,
    passRate: round1((data.passed / data.scores.length) * 100),
  }))

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const monthlyMap = new Map<string, number[]>()
  examResults.forEach((er) => {
    if (!er.completedAt || er.completedAt < sixMonthsAgo) return
    const key = colombiaMonthKey(er.completedAt)
    if (!monthlyMap.has(key)) monthlyMap.set(key, [])
    monthlyMap.get(key)!.push(er.score)
  })
  const monthlyEvolution = Array.from(monthlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, scores]) => ({
      month,
      averageScore: round1(scores.reduce((a, b) => a + b, 0) / scores.length),
      examsCount: scores.length,
    }))

  const examHistory = examResults.map((er) => ({
    id: er.id,
    examId: er.examId,
    examTitle: er.exam?.title || 'Examen sin título',
    competencyName: er.exam?.competency?.displayName || er.exam?.competency?.name || 'Sin competencia',
    score: er.score,
    isPassed: resultPassed(er),
    completedAt: er.completedAt!.toISOString(),
    totalQuestions: er.totalQuestions || 0,
    correctAnswers: er.correctAnswers || 0,
  }))

  const lessonStudyMinutes = lessonProgress.reduce((sum, lp) => sum + (lp.totalTimeMinutes || 0), 0)
  const examStudyMinutes = examResults.reduce((sum, er) => sum + (er.timeTakenMinutes || 0), 0)
  const totalStudyTimeMinutes = lessonStudyMinutes + examStudyMinutes

  return {
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`.trim(),
    studentEmail: student.email,
    academicGrade: student.academicGrade || enrollments[0]?.course.academicGrade || null,

    ...summary,
    lastExamDate: examResults[0]?.completedAt?.toISOString() ?? null,
    lastActivity: lastActivity?.toISOString() ?? null,

    totalStudyTimeHours: round1(totalStudyTimeMinutes / 60),
    lessonStudyTimeHours: round1(lessonStudyMinutes / 60),
    examStudyTimeHours: round1(examStudyMinutes / 60),
    averageCourseProgress: coursesDetail.length > 0
      ? round1(coursesDetail.reduce((sum, c) => sum + c.progressPercentage, 0) / coursesDetail.length)
      : 0,
    completedCourses: coursesDetail.filter((c) => c.totalLessons > 0 && c.progressPercentage >= 100).length,
    activeCourses: coursesDetail.length,

    competencyPerformance,
    monthlyEvolution,
    examHistory,
    coursesDetail,
  }
}
