import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import {
  examResultWhere,
  lessonProgressWhere,
  lessonStudyTimeWhere,
  resolveAnalyticsFilters,
  studentWhere,
} from '@/lib/analytics/filters'
import { lessonStudySecondsByUser } from '@/lib/studyTime'
import { completedLessonStatusFilter, isLessonCompletedStatus } from '@/lib/progress/lessonProgress'

export async function GET(request: NextRequest) {
  try {
    const gate = await requireRole(['teacher_admin','school_admin'])
    if (!gate.allowed) return NextResponse.json({ error: gate.error }, { status: gate.status })

    if (!gate.session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (gate.session.user.role === 'school_admin' && !gate.session.user.schoolId) {
      return NextResponse.json({ error: 'Usuario sin colegio asignado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filters = resolveAnalyticsFilters(searchParams, gate.session.user)

    const [lessonProgress, examTime, examStudents, lessonSecondsByUser, examMinutesByUser] = await Promise.all([
      prisma.studentLessonProgress.findMany({
        where: lessonProgressWhere(filters),
        select: { userId: true, lessonId: true, status: true, progressPercentage: true, updatedAt: true },
      }),
      prisma.examResult.aggregate({
        where: examResultWhere(filters),
        _sum: { timeTakenMinutes: true },
        _avg: { timeTakenMinutes: true },
      }),
      prisma.examResult.findMany({
        where: examResultWhere(filters),
        select: { userId: true },
        distinct: ['userId'],
      }),
      lessonStudySecondsByUser(lessonStudyTimeWhere(filters)),
      prisma.examResult.groupBy({
        by: ['userId'],
        where: examResultWhere(filters),
        _sum: { timeTakenMinutes: true },
      }),
    ])

    // Tiempo de estudio = lecciones + exámenes, en minutos por estudiante
    const studyMinutesByUser = new Map<string, number>()
    lessonSecondsByUser.forEach((seconds, userId) => {
      studyMinutesByUser.set(userId, seconds / 60)
    })
    examMinutesByUser.forEach((row) => {
      const minutes = row._sum.timeTakenMinutes || 0
      studyMinutesByUser.set(row.userId, (studyMinutesByUser.get(row.userId) || 0) + minutes)
    })
    const lessonStudyMinutes = Array.from(lessonSecondsByUser.values()).reduce((a, b) => a + b, 0) / 60
    const totalStudyMinutes = Array.from(studyMinutesByUser.values()).reduce((a, b) => a + b, 0)
    const studentsWithStudyTime = Array.from(studyMinutesByUser.values()).filter((m) => m > 0).length

    const completedProgress = lessonProgress.filter((lp) => isLessonCompletedStatus(lp.status))
    const totalLessonsCompleted = completedProgress.length

    // Estudiantes activos: misma definición que la tarjeta principal
    const activeUserIds = new Set(examStudents.map((r) => r.userId))
    completedProgress.forEach((lp) => activeUserIds.add(lp.userId))

    // Avance real registrado en cada lección trabajada dentro del período
    const averageProgress = lessonProgress.length > 0
      ? lessonProgress.reduce((sum, lp) => sum + (lp.progressPercentage || 0), 0) / lessonProgress.length
      : 0
    const completionRate = lessonProgress.length > 0
      ? (completedProgress.length / lessonProgress.length) * 100
      : 0

    const courseCompletions = await countCourseCompletions(filters, completedProgress)

    return NextResponse.json({
      totalLessonsCompleted,
      examTimeHours: Math.round(((examTime._sum.timeTakenMinutes || 0) / 60) * 10) / 10,
      averageExamDurationMinutes: Math.round((examTime._avg.timeTakenMinutes || 0) * 10) / 10,
      lessonStudyHours: Math.round((lessonStudyMinutes / 60) * 10) / 10,
      totalStudyHours: Math.round((totalStudyMinutes / 60) * 10) / 10,
      averageStudyMinutesPerStudent:
        studentsWithStudyTime > 0 ? Math.round(totalStudyMinutes / studentsWithStudyTime) : 0,
      activeUsers: activeUserIds.size,
      courseCompletions,
      averageProgress: Math.round(averageProgress * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      range: { from: filters.from.toISOString(), to: filters.to.toISOString() }
    })
  } catch (error) {
    console.error('Error fetching engagement metrics:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/**
 * Un curso cuenta como completado cuando el estudiante terminó todas sus
 * lecciones publicadas, y se le atribuye al período si la última de ellas se
 * terminó dentro de él. La inscripción no sirve: su fecha de finalización no
 * se registra en ningún flujo.
 */
async function countCourseCompletions(
  filters: ReturnType<typeof resolveAnalyticsFilters>,
  completedInPeriod: Array<{ userId: string; lessonId: string }>
): Promise<number> {
  const candidateUserIds = Array.from(new Set(completedInPeriod.map((lp) => lp.userId)))
  if (candidateUserIds.length === 0) return 0

  const enrollments = await prisma.courseEnrollment.findMany({
    where: {
      userId: { in: candidateUserIds },
      user: studentWhere(filters),
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
    },
    select: {
      userId: true,
      course: {
        select: {
          courseModules: {
            select: {
              module: {
                select: {
                  moduleLessons: { select: { lessonId: true, lesson: { select: { isPublished: true } } } },
                },
              },
            },
          },
        },
      },
    },
  })

  const allCompleted = await prisma.studentLessonProgress.findMany({
    where: { userId: { in: candidateUserIds }, status: completedLessonStatusFilter },
    select: { userId: true, lessonId: true },
  })
  const completedByUser = new Map<string, Set<string>>()
  allCompleted.forEach((lp) => {
    if (!completedByUser.has(lp.userId)) completedByUser.set(lp.userId, new Set())
    completedByUser.get(lp.userId)!.add(lp.lessonId)
  })

  const completedInPeriodByUser = new Map<string, Set<string>>()
  completedInPeriod.forEach((lp) => {
    if (!completedInPeriodByUser.has(lp.userId)) completedInPeriodByUser.set(lp.userId, new Set())
    completedInPeriodByUser.get(lp.userId)!.add(lp.lessonId)
  })

  let completions = 0
  enrollments.forEach((enrollment) => {
    const lessonIds = new Set<string>()
    enrollment.course.courseModules.forEach((cm) =>
      cm.module.moduleLessons.forEach((ml) => {
        if (ml.lesson.isPublished) lessonIds.add(ml.lessonId)
      })
    )
    if (lessonIds.size === 0) return

    const done = completedByUser.get(enrollment.userId) || new Set<string>()
    const doneInPeriod = completedInPeriodByUser.get(enrollment.userId) || new Set<string>()
    const ids = Array.from(lessonIds)
    const finished = ids.every((id) => done.has(id))
    const finishedInPeriod = ids.some((id) => doneInPeriod.has(id))
    if (finished && finishedInPeriod) completions += 1
  })

  return completions
}
