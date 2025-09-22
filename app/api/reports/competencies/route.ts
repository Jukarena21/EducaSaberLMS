import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : new Date(Date.now() - 365*24*60*60*1000)
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : new Date()
    const schoolId = searchParams.get('schoolId') || undefined
    const courseId = searchParams.get('courseId') || undefined
    const competencyId = searchParams.get('competencyId') || undefined
    const academicGrade = searchParams.get('academicGrade') || undefined

    const whereER: any = { createdAt: { gte: from, lte: to } }
    const whereCourse: any = {}
    if (schoolId) whereCourse.schoolId = schoolId
    if (academicGrade) whereCourse.academicGrade = academicGrade

    const results = await prisma.examResult.findMany({
      where: whereER,
      include: {
        exam: { select: { id: true, competencyId: true, difficultyLevel: true, courseId: true }, include: { competency: true, course: { where: Object.keys(whereCourse).length ? whereCourse : undefined, select: { id: true } } } },
      }
    })

    const filtered = results.filter(r => {
      if (courseId && r.exam?.courseId !== courseId) return false
      if (competencyId && r.exam?.competencyId !== competencyId) return false
      if (schoolId && r.exam?.course?.id !== courseId && whereCourse.schoolId) {
        // course filter handled above, school filter via course relation
      }
      return true
    })

    const passThreshold = 70
    type Agg = { sum: number; count: number; pass: number }
    const byCompDiff = new Map<string, Agg>()
    const keyOf = (cId?: string|null, diff?: string|null) => `${cId||'NA'}|${diff||'intermedio'}`

    filtered.forEach(r => {
      const k = keyOf(r.exam?.competencyId, r.exam?.difficultyLevel)
      if (!byCompDiff.has(k)) byCompDiff.set(k, { sum: 0, count: 0, pass: 0 })
      const a = byCompDiff.get(k)!
      a.sum += r.score
      a.count += 1
      if (r.score >= passThreshold) a.pass += 1
    })

    const rows = Array.from(byCompDiff.entries()).map(([k, a]) => {
      const [compId, diff] = k.split('|')
      return {
        competencyId: compId,
        difficultyLevel: diff,
        attempts: a.count,
        avgScore: a.count ? Number((a.sum/a.count).toFixed(1)) : 0,
        passRate: a.count ? Number(((a.pass/a.count)*100).toFixed(1)) : 0,
      }
    })

    return NextResponse.json({ rows })
  } catch (e) {
    console.error('reports/competencies', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}


