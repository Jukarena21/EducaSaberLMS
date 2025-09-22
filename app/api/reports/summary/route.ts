import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // Restricciones de rol
    if (session.user.role === 'school_admin' && !session.user.schoolId) {
      return NextResponse.json({ error: 'Usuario sin colegio asignado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : new Date(Date.now() - 365*24*60*60*1000)
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : new Date()
    // Para school_admin, forzar el filtro por su schoolId
    const schoolId = session.user.role === 'school_admin' 
      ? session.user.schoolId 
      : (searchParams.get('schoolId') || undefined)
    const courseId = searchParams.get('courseId') || undefined
    const competencyId = searchParams.get('competencyId') || undefined
    const academicGrade = searchParams.get('academicGrade') || undefined

    const whereER: any = { createdAt: { gte: from, lte: to } }
    const whereExam: any = {}
    const whereCourse: any = {}
    if (competencyId) whereExam.competencyId = competencyId
    if (courseId) whereExam.id = courseId // not ideal, but allows direct exam selection if needed
    if (academicGrade) whereCourse.academicGrade = academicGrade
    if (schoolId) whereCourse.schoolId = schoolId

    const results = await prisma.examResult.findMany({
      where: whereER,
      include: {
        exam: { include: { competency: true, course: { where: Object.keys(whereCourse).length ? whereCourse : undefined, select: { id: true, title: true, schoolId: true, academicGrade: true } } } },
        user: { select: { id: true } }
      }
    })

    const filtered = results.filter(r => {
      if (competencyId && r.exam?.competencyId !== competencyId) return false
      if (courseId && r.exam?.courseId !== courseId) return false
      if (academicGrade && r.exam?.course?.academicGrade !== academicGrade) return false
      if (schoolId && r.exam?.course?.schoolId !== schoolId) return false
      return true
    })

    // Aggregates by school/course/competency
    type Agg = { sum: number; count: number; pass: number }
    const passThreshold = 70
    const byKey = new Map<string, Agg>()
    const keyOf = (r: typeof filtered[number]) => `${r.exam?.course?.schoolId||'NA'}|${r.exam?.course?.id||'NA'}|${r.exam?.competency?.id||'NA'}`
    filtered.forEach(r => {
      const k = keyOf(r)
      if (!byKey.has(k)) byKey.set(k, { sum: 0, count: 0, pass: 0 })
      const a = byKey.get(k)!
      a.sum += r.score
      a.count += 1
      if (r.score >= passThreshold) a.pass += 1
    })
    const rows = Array.from(byKey.entries()).map(([k, a]) => {
      const [sId, cId, compId] = k.split('|')
      return {
        schoolId: sId,
        courseId: cId,
        competencyId: compId,
        attempts: a.count,
        avgScore: a.count ? Number((a.sum / a.count).toFixed(1)) : 0,
        passRate: a.count ? Number(((a.pass / a.count) * 100).toFixed(1)) : 0,
      }
    })

    // Monthly series (overall)
    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const seriesMap = new Map<string, Agg>()
    filtered.forEach(r => {
      const k = monthKey(new Date(r.createdAt))
      if (!seriesMap.has(k)) seriesMap.set(k, { sum: 0, count: 0, pass: 0 })
      const a = seriesMap.get(k)!
      a.sum += r.score
      a.count += 1
      if (r.score >= passThreshold) a.pass += 1
    })
    const series = Array.from(seriesMap.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([period, a]) => ({
      period,
      avgScore: a.count ? Number((a.sum/a.count).toFixed(1)) : 0,
      attempts: a.count,
      passRate: a.count ? Number(((a.pass/a.count)*100).toFixed(1)) : 0,
    }))

    // Distribution buckets
    const buckets = [ {min:0,max:59,label:'0-59'}, {min:60,max:69,label:'60-69'}, {min:70,max:79,label:'70-79'}, {min:80,max:100,label:'80-100'} ]
    const distribution = buckets.map(b=>({ rango:b.label, estudiantes: filtered.filter(r=>r.score>=b.min && r.score<=b.max).length }))

    return NextResponse.json({ rows, series, distribution, range: { from: from.toISOString(), to: to.toISOString() } })
  } catch (e) {
    console.error('reports/summary', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}


