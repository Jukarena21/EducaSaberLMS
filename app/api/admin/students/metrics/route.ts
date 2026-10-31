import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import {
  examResultWhere,
  resolveAnalyticsFilters,
  studentWhere,
  type AnalyticsFilters,
} from '@/lib/analytics/filters'
import { summarizeStudent } from '@/lib/analytics/studentStatus'
import {
  buildStudentDetail,
  COMPLETED_LESSON_STATUSES,
  courseProgress,
  enrollmentSelect,
  latestDate as latest,
  type EnrollmentWithLessons,
} from '@/lib/analytics/studentDetail'

export const dynamic = 'force-dynamic'

const round1 = (value: number) => Math.round(value * 10) / 10

const DETAIL_ERRORS = {
  not_found: { error: 'Estudiante no encontrado', status: 404 },
  forbidden: { error: 'No autorizado para ver este estudiante', status: 403 },
  not_student: { error: 'El usuario no es un estudiante', status: 400 },
} as const

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
      const detail = await buildStudentDetail(studentId, user.role === 'school_admin' ? user.schoolId : undefined)
      if (detail.status !== 'ok') {
        const { error, status } = DETAIL_ERRORS[detail.status]
        return NextResponse.json({ error }, { status })
      }
      return NextResponse.json(detail.data)
    }

    const filters = resolveAnalyticsFilters(searchParams, user)
    return await getAllStudentsMetrics(filters)
  } catch (error) {
    console.error('Error fetching student metrics:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
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
