import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import {
  colombiaMonthKey,
  examResultWhere,
  resolveAnalyticsFilters,
  resultPassed,
} from '@/lib/analytics/filters'

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

    const results = await prisma.examResult.findMany({
      where: examResultWhere(filters),
      select: {
        score: true,
        isPassed: true,
        completedAt: true,
        user: { select: { school: { select: { id: true, name: true } } } },
        exam: {
          select: {
            passingScore: true,
            course: { select: { id: true, title: true } },
            competency: { select: { id: true, displayName: true, name: true } },
          },
        },
      },
    })

    // Agregado por colegio del estudiante, curso del examen y área
    type Agg = {
      schoolId: string | null
      schoolName: string
      courseId: string | null
      courseName: string
      competencyId: string | null
      competencyName: string
      sum: number
      count: number
      pass: number
    }
    const byKey = new Map<string, Agg>()
    results.forEach((r) => {
      const school = r.user?.school
      const course = r.exam?.course
      const competency = r.exam?.competency
      const key = `${school?.id || '-'}|${course?.id || '-'}|${competency?.id || '-'}`
      if (!byKey.has(key)) {
        byKey.set(key, {
          schoolId: school?.id || null,
          schoolName: school?.name || 'Sin colegio',
          courseId: course?.id || null,
          courseName: course?.title || 'Sin curso',
          competencyId: competency?.id || null,
          competencyName: competency?.displayName || competency?.name || 'General',
          sum: 0,
          count: 0,
          pass: 0,
        })
      }
      const agg = byKey.get(key)!
      agg.sum += r.score
      agg.count += 1
      if (resultPassed(r)) agg.pass += 1
    })

    const rows = Array.from(byKey.values())
      .map(({ sum, count, pass, ...rest }) => ({
        ...rest,
        attempts: count,
        avgScore: Number((sum / count).toFixed(1)),
        passRate: Number(((pass / count) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.attempts - a.attempts)

    const seriesMap = new Map<string, { sum: number; count: number; pass: number }>()
    results.forEach((r) => {
      const key = colombiaMonthKey(r.completedAt!)
      const agg = seriesMap.get(key) || { sum: 0, count: 0, pass: 0 }
      agg.sum += r.score
      agg.count += 1
      if (resultPassed(r)) agg.pass += 1
      seriesMap.set(key, agg)
    })
    const series = Array.from(seriesMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, a]) => ({
        period,
        avgScore: Number((a.sum / a.count).toFixed(1)),
        attempts: a.count,
        passRate: Number(((a.pass / a.count) * 100).toFixed(1)),
      }))

    return NextResponse.json({
      rows,
      series,
      range: { from: filters.from.toISOString(), to: filters.to.toISOString() },
    })
  } catch (e) {
    console.error('reports/summary', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
