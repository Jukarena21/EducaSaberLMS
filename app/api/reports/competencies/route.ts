import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { examResultWhere, resolveAnalyticsFilters, resultPassed } from '@/lib/analytics/filters'
import { latestCompletedByUserExam } from '@/lib/exams/attempts'

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

    const allResults = await prisma.examResult.findMany({
      where: examResultWhere(filters),
      select: {
        userId: true,
        examId: true,
        score: true,
        isPassed: true,
        completedAt: true,
        exam: {
          select: {
            passingScore: true,
            difficultyLevel: true,
            competency: { select: { id: true, displayName: true, name: true } },
          },
        },
      },
    })
    const results = latestCompletedByUserExam(allResults)

    type Agg = {
      competencyId: string | null
      competencyName: string
      difficultyLevel: string
      sum: number
      count: number
      pass: number
    }
    const byCompDiff = new Map<string, Agg>()
    results.forEach((r) => {
      const competency = r.exam?.competency
      const difficulty = r.exam?.difficultyLevel || 'intermedio'
      const key = `${competency?.id || '-'}|${difficulty}`
      if (!byCompDiff.has(key)) {
        byCompDiff.set(key, {
          competencyId: competency?.id || null,
          competencyName: competency?.displayName || competency?.name || 'General',
          difficultyLevel: difficulty,
          sum: 0,
          count: 0,
          pass: 0,
        })
      }
      const agg = byCompDiff.get(key)!
      agg.sum += r.score
      agg.count += 1
      if (resultPassed(r)) agg.pass += 1
    })

    const rows = Array.from(byCompDiff.values())
      .map(({ sum, count, pass, ...rest }) => ({
        ...rest,
        attempts: count,
        avgScore: Number((sum / count).toFixed(1)),
        passRate: Number(((pass / count) * 100).toFixed(1)),
      }))
      .sort((a, b) => a.competencyName.localeCompare(b.competencyName))

    return NextResponse.json({ rows })
  } catch (e) {
    console.error('reports/competencies', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
