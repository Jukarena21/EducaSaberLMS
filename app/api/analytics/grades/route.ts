import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import {
  analyticsCacheKey,
  colombiaHour,
  colombiaMonthKey,
  examResultWhere,
  lessonProgressWhere,
  resolveAnalyticsFilters,
  resultPassed,
} from '@/lib/analytics/filters'
import { latestCompletedByUserExam } from '@/lib/exams/attempts'

const TEN_MINUTES_MS = 10 * 60 * 1000

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

    const cacheKey = analyticsCacheKey('grades', filters)
    const cached = await prisma.reportCache.findUnique({ where: { cacheKey } }).catch(() => null)
    if (cached && new Date(cached.expiresAt).getTime() > Date.now()) {
      return NextResponse.json(JSON.parse(cached.reportData))
    }

    const allResults = await prisma.examResult.findMany({
      where: examResultWhere(filters),
      select: {
        userId: true,
        examId: true,
        score: true,
        isPassed: true,
        completedAt: true,
        user: { select: { schoolId: true } },
        exam: {
          select: {
            passingScore: true,
            competency: { select: { displayName: true, name: true } },
          },
        },
      },
    })
    const results = latestCompletedByUserExam(allResults)

    const studentsWithLessons = await prisma.studentLessonProgress.findMany({
      where: { ...lessonProgressWhere(filters), status: 'completed' },
      select: { userId: true, user: { select: { schoolId: true } } },
      distinct: ['userId'],
    })

    // Estudiantes activos: presentaron un examen o completaron una lección en el período
    const activeStudentIds = new Set(results.map((r) => r.userId))
    studentsWithLessons.forEach((p) => activeStudentIds.add(p.userId))
    const activeStudents = activeStudentIds.size

    const attempts = results.length
    const avgScore = attempts > 0
      ? Number((results.reduce((sum, r) => sum + r.score, 0) / attempts).toFixed(1))
      : 0

    // Instituciones: colegios (no empresas) de los estudiantes con actividad
    const activeSchoolIds = new Set<string>()
    results.forEach((r) => r.user?.schoolId && activeSchoolIds.add(r.user.schoolId))
    studentsWithLessons.forEach((p) => p.user?.schoolId && activeSchoolIds.add(p.user.schoolId))
    const validSchools = activeSchoolIds.size > 0
      ? await prisma.school.findMany({
          where: { id: { in: Array.from(activeSchoolIds) }, type: 'school' },
          select: { id: true },
        })
      : []
    const validSchoolIds = new Set(validSchools.map((s) => s.id))
    const institutions = validSchoolIds.size

    // Serie mensual: promedio por área, promedio general, aprobación e intentos
    type MonthAgg = { sum: number; count: number; passed: number; byArea: Map<string, { sum: number; count: number }> }
    const byMonth = new Map<string, MonthAgg>()
    results.forEach((r) => {
      const key = colombiaMonthKey(r.completedAt!)
      const area = r.exam?.competency?.displayName || r.exam?.competency?.name || 'General'
      if (!byMonth.has(key)) byMonth.set(key, { sum: 0, count: 0, passed: 0, byArea: new Map() })
      const month = byMonth.get(key)!
      month.sum += r.score
      month.count += 1
      if (resultPassed(r)) month.passed += 1
      const areaAgg = month.byArea.get(area) || { sum: 0, count: 0 }
      areaAgg.sum += r.score
      areaAgg.count += 1
      month.byArea.set(area, areaAgg)
    })

    const series = Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, month]) => {
        const row: Record<string, number | string> = { period }
        month.byArea.forEach((agg, area) => {
          row[area] = Number((agg.sum / agg.count).toFixed(1))
        })
        row.avgScore = Number((month.sum / month.count).toFixed(1))
        row.passRate = Number(((month.passed / month.count) * 100).toFixed(1))
        row.attempts = month.count
        return row
      })

    // Distribución de calificaciones. Los límites superiores son exclusivos para
    // que ningún puntaje quede fuera de un rango
    const buckets = [
      { label: '0-40', min: 0, max: 41 },
      { label: '41-60', min: 41, max: 61 },
      { label: '61-80', min: 61, max: 81 },
      { label: '81-100', min: 81, max: Infinity },
    ]
    const distribution = buckets.map((b) => ({
      rango: b.label,
      estudiantes: results.filter((r) => r.score >= b.min && r.score < b.max).length,
    }))

    // Ranking por colegio del estudiante
    const bySchool = new Map<string, { sum: number; count: number }>()
    results.forEach((r) => {
      const sid = r.user?.schoolId
      if (!sid || !validSchoolIds.has(sid)) return
      const agg = bySchool.get(sid) || { sum: 0, count: 0 }
      agg.sum += r.score
      agg.count += 1
      bySchool.set(sid, agg)
    })
    const ranking = Array.from(bySchool.entries())
      .map(([schoolId, agg]) => ({
        schoolId,
        avgScore: Number((agg.sum / agg.count).toFixed(1)),
        attempts: agg.count,
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10)

    // Exámenes terminados por hora del día, en hora de Colombia
    const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }))
    results.forEach((r) => {
      hourly[colombiaHour(r.completedAt!)].count += 1
    })

    const payload = {
      kpis: { activeStudents, examAttempts: attempts, averageScore: avgScore, institutions },
      series,
      distribution,
      ranking,
      range: { from: filters.from.toISOString(), to: filters.to.toISOString() },
      hourly,
    }

    try {
      const expiresAt = new Date(Date.now() + TEN_MINUTES_MS)
      await prisma.reportCache.upsert({
        where: { cacheKey },
        update: { reportData: JSON.stringify(payload), expiresAt },
        create: { cacheKey, reportData: JSON.stringify(payload), expiresAt },
      })
    } catch {}

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Error en analytics/grades:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
