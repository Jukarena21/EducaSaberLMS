import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import {
  colombiaMonthKey,
  examResultWhere,
  resolveAnalyticsFilters,
  resultPassed,
  studentWhere,
  type AnalyticsFilters,
} from '@/lib/analytics/filters'
import { summarizeStudent } from '@/lib/analytics/studentStatus'

export const dynamic = 'force-dynamic'

const round1 = (value: number) => Math.round(value * 10) / 10
const COMPLETED_LESSON_STATUSES = ['completed', 'completado']

type EnrollmentWithLessons = {
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

const enrollmentSelect = {
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
function courseProgress(enrollment: EnrollmentWithLessons, completedLessons: Set<string>) {
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

function latest(...dates: Array<Date | null | undefined>): Date | null {
  const valid = dates.filter((d): d is Date => d instanceof Date)
  if (valid.length === 0) return null
  return new Date(Math.max(...valid.map((d) => d.getTime())))
}

export async function GET(request: NextRequest) {
  try {
    const gate = await requireRole(['teacher_admin', 'school_admin'])
    if (!gate.allowed || !gate.session) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const user = gate.session.user
    if (user.role === 'school_admin' && !user.schoolId) {
      return NextResponse.json({ error: 'Usuario sin colegio asignado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (studentId) {
      return await getStudentMetrics(studentId, user.role === 'school_admin' ? user.schoolId : undefined)
    }

    const filters = resolveAnalyticsFilters(searchParams, user)
    return await getAllStudentsMetrics(filters)
  } catch (error) {
    console.error('Error fetching student metrics:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/** Detalle de un estudiante: todo su historial, no solo el período. */
async function getStudentMetrics(studentId: string, restrictToSchoolId?: string | null) {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, schoolId: true, academicGrade: true },
  })

  if (!student) {
    return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
  }
  if (restrictToSchoolId && student.schoolId !== restrictToSchoolId) {
    return NextResponse.json({ error: 'No autorizado para ver este estudiante' }, { status: 403 })
  }
  if (student.role !== 'student') {
    return NextResponse.json({ error: 'El usuario no es un estudiante' }, { status: 400 })
  }

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

  const lastActivity = latest(examResults[0]?.completedAt, lessonProgress[0]?.updatedAt)
  const summary = summarizeStudent(examResults, lastActivity)

  const completedLessons = new Set(
    lessonProgress.filter((lp) => COMPLETED_LESSON_STATUSES.includes(lp.status)).map((lp) => lp.lessonId)
  )
  const coursesDetail = enrollments.map((enrollment) => {
    const progress = courseProgress(enrollment, completedLessons)
    return {
      courseId: enrollment.course.id,
      courseTitle: enrollment.course.title,
      competencyName:
        enrollment.course.competency?.displayName || enrollment.course.competency?.name || 'Sin competencia',
      enrollmentDate: enrollment.enrolledAt.toISOString(),
      progressPercentage: progress.progressPercentage,
      completedLessons: progress.completedLessons,
      totalLessons: progress.totalLessons,
      timeSpentHours: 0,
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

  const totalStudyTimeMinutes = lessonProgress.reduce((sum, lp) => sum + (lp.totalTimeMinutes || 0), 0)

  return NextResponse.json({
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`.trim(),
    studentEmail: student.email,
    academicGrade: student.academicGrade || enrollments[0]?.course.academicGrade || null,

    ...summary,
    lastExamDate: examResults[0]?.completedAt?.toISOString() ?? null,
    lastActivity: lastActivity?.toISOString() ?? null,

    totalStudyTimeHours: round1(totalStudyTimeMinutes / 60),
    averageCourseProgress: coursesDetail.length > 0
      ? round1(coursesDetail.reduce((sum, c) => sum + c.progressPercentage, 0) / coursesDetail.length)
      : 0,
    completedCourses: coursesDetail.filter((c) => c.totalLessons > 0 && c.progressPercentage >= 100).length,
    activeCourses: coursesDetail.length,

    competencyPerformance,
    monthlyEvolution,
    examHistory,
    coursesDetail,
  })
}

/**
 * Lista de estudiantes con sus métricas del período. El año escolar lo filtra
 * la pantalla con el grado que se muestra en cada fila.
 */
async function getAllStudentsMetrics(filters: AnalyticsFilters) {
  const listFilters: AnalyticsFilters = { ...filters, academicGrade: undefined }
  const userWhere = studentWhere(listFilters)

  const [students, examResults, lastExams, lastLessons, enrollments, completedLessons] = await Promise.all([
    prisma.user.findMany({
      where: userWhere,
      select: { id: true, firstName: true, lastName: true, email: true, academicGrade: true },
      orderBy: { email: 'asc' },
    }),
    prisma.examResult.findMany({
      where: examResultWhere(listFilters),
      select: { userId: true, score: true, isPassed: true, exam: { select: { passingScore: true } } },
    }),
    prisma.examResult.groupBy({
      by: ['userId'],
      where: { completedAt: { not: null }, user: userWhere },
      _max: { completedAt: true },
    }),
    prisma.studentLessonProgress.groupBy({
      by: ['userId'],
      where: { user: userWhere },
      _max: { updatedAt: true },
    }),
    prisma.courseEnrollment.findMany({
      where: { isActive: true, user: userWhere },
      select: enrollmentSelect,
      orderBy: { enrolledAt: 'desc' },
    }),
    prisma.studentLessonProgress.findMany({
      where: { status: { in: COMPLETED_LESSON_STATUSES }, user: userWhere },
      select: { userId: true, lessonId: true },
    }),
  ])

  const resultsByUser = new Map<string, typeof examResults>()
  examResults.forEach((r) => {
    if (!resultsByUser.has(r.userId)) resultsByUser.set(r.userId, [])
    resultsByUser.get(r.userId)!.push(r)
  })
  const lastExamByUser = new Map(lastExams.map((r) => [r.userId, r._max.completedAt]))
  const lastLessonByUser = new Map(lastLessons.map((r) => [r.userId, r._max.updatedAt]))
  const enrollmentsByUser = new Map<string, EnrollmentWithLessons[]>()
  enrollments.forEach((e) => {
    if (!enrollmentsByUser.has(e.userId)) enrollmentsByUser.set(e.userId, [])
    enrollmentsByUser.get(e.userId)!.push(e)
  })
  const completedByUser = new Map<string, Set<string>>()
  completedLessons.forEach((lp) => {
    if (!completedByUser.has(lp.userId)) completedByUser.set(lp.userId, new Set())
    completedByUser.get(lp.userId)!.add(lp.lessonId)
  })

  const now = new Date()
  const rows = students.map((student) => {
    const lastActivity = latest(lastExamByUser.get(student.id), lastLessonByUser.get(student.id))
    const summary = summarizeStudent(resultsByUser.get(student.id) || [], lastActivity, now)
    const studentEnrollments = enrollmentsByUser.get(student.id) || []
    const done = completedByUser.get(student.id) || new Set<string>()
    const progresses = studentEnrollments.map((e) => courseProgress(e, done))

    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`.trim() || 'Sin nombre',
      studentEmail: student.email || 'Sin email',
      academicGrade: student.academicGrade || studentEnrollments[0]?.course.academicGrade || null,
      ...summary,
      lastActivity: lastActivity?.toISOString() ?? null,
      averageCourseProgress: progresses.length > 0
        ? round1(progresses.reduce((sum, p) => sum + p.progressPercentage, 0) / progresses.length)
        : 0,
      completedCourses: progresses.filter((p) => p.totalLessons > 0 && p.progressPercentage >= 100).length,
      activeCourses: studentEnrollments.length,
    }
  })

  return NextResponse.json({
    students: rows,
    total: rows.length,
    range: { from: filters.from.toISOString(), to: filters.to.toISOString() },
  })
}
