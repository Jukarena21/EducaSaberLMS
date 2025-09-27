import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function buildCacheKey(path: string, params: URLSearchParams): string {
  const entries = Array.from(params.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  const serialized = entries.map(([k, v]) => `${k}=${v}`).join('&')
  return `${path}?${serialized}`
}

const TEN_MINUTES_MS = 10 * 60 * 1000

export async function GET(request: NextRequest) {
  try {
    const gate = await requireRole(['teacher_admin','school_admin'])
    if (!gate.allowed) return NextResponse.json({ error: gate.error }, { status: gate.status })

    // Restricciones de rol
    if (gate.session.user.role === 'school_admin' && !gate.session.user.schoolId) {
      return NextResponse.json({ error: 'Usuario sin colegio asignado' }, { status: 403 })
    }

    const { searchParams, pathname } = new URL(request.url)

    // Filtros
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    // Para school_admin, forzar el filtro por su schoolId
    const schoolId = gate.session.user.role === 'school_admin' 
      ? gate.session.user.schoolId 
      : (searchParams.get('schoolId') || undefined)
    const courseId = searchParams.get('courseId') || undefined
    const academicGrade = searchParams.get('academicGrade') || undefined
    const competencyId = searchParams.get('competencyId') || undefined
    const minAge = searchParams.get('minAge') ? parseInt(searchParams.get('minAge') as string, 10) : undefined
    const maxAge = searchParams.get('maxAge') ? parseInt(searchParams.get('maxAge') as string, 10) : undefined

    // Rango de fechas (por defecto últimos 90 días)
    const to = toParam ? new Date(toParam) : new Date()
    const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    // Cache simple por 10 minutos
    const cacheKey = buildCacheKey(pathname, searchParams)
    const cached = await prisma.reportCache.findUnique({ where: { cacheKey } }).catch(() => null)
    if (cached && new Date(cached.expiresAt).getTime() > Date.now()) {
      return NextResponse.json(JSON.parse(cached.reportData))
    }

    // Construir filtros para ExamResult/Exam
    const whereExamResult: any = {
      createdAt: { gte: from, lte: to },
    }

    // Filtrado por edad via relación User
    const whereUser: any = {}
    if (minAge !== undefined || maxAge !== undefined) {
      // Edad = floor((now - dateOfBirth)/365d). Aproximación por fecha de nacimiento.
      const now = new Date()
      if (minAge !== undefined) {
        const maxBirthDate = new Date(now)
        maxBirthDate.setFullYear(maxBirthDate.getFullYear() - minAge)
        whereUser.dateOfBirth = { lte: maxBirthDate }
      }
      if (maxAge !== undefined) {
        const minBirthDate = new Date(now)
        minBirthDate.setFullYear(minBirthDate.getFullYear() - maxAge - 1)
        whereUser.dateOfBirth = { ...(whereUser.dateOfBirth || {}), gte: minBirthDate }
      }
    }

    // Filtros por Exam/Course/Competency/School
    const whereExam: any = {}
    if (competencyId) whereExam.competencyId = competencyId
    if (courseId) whereExam.courseId = courseId

    // academicGrade y schoolId se obtienen desde Course
    const whereCourse: any = {}
    if (academicGrade) whereCourse.academicGrade = academicGrade
    if (schoolId) whereCourse.schoolId = schoolId

    // Consultas
    const examResults = await prisma.examResult.findMany({
      where: whereExamResult,
      include: {
        user: { where: Object.keys(whereUser).length ? whereUser : undefined, select: { id: true, dateOfBirth: true, schoolId: true } },
        exam: {
          where: Object.keys(whereExam).length ? whereExam : undefined,
          include: { course: { where: Object.keys(whereCourse).length ? whereCourse : undefined, select: { id: true, schoolId: true, academicGrade: true } }, competency: true },
        },
      },
    })

    // Filtrado post-join por si algún where quedó vacío y Prisma no aplicó relación
    const filteredResults = examResults.filter(er => {
      if (schoolId && er.exam?.course?.schoolId !== schoolId) return false
      if (academicGrade && er.exam?.course?.academicGrade !== academicGrade) return false
      if (courseId && er.exam?.course?.id !== courseId) return false
      if (competencyId && er.exam?.competency?.id !== competencyId) return false
      return true
    })

    // KPIs (totales, NO afectados por filtros)
    const [attemptsTotal, avgAgg, distinctUsers, institutions] = await Promise.all([
      prisma.examResult.count(),
      prisma.examResult.aggregate({ _avg: { score: true } }),
      prisma.examResult.findMany({ select: { userId: true }, distinct: ['userId'] }),
      prisma.school.count(),
    ])
    const activeStudents = distinctUsers.length
    const attempts = attemptsTotal
    const avgScore = Number((avgAgg._avg.score || 0).toFixed(1))

    // Serie mensual por competencia (promedio)
    const byMonth = new Map<string, { [competency: string]: { sum: number; count: number } }>()
    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    filteredResults.forEach(r => {
      const key = monthKey(new Date(r.createdAt))
      const comp = r.exam?.competency?.displayName || 'General'
      if (!byMonth.has(key)) byMonth.set(key, {})
      const bucket = byMonth.get(key)!
      if (!bucket[comp]) bucket[comp] = { sum: 0, count: 0 }
      bucket[comp].sum += r.score
      bucket[comp].count += 1
    })
    const series = Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, comps]) => {
        const row: any = { period }
        Object.entries(comps).forEach(([name, agg]) => {
          row[name] = Number((agg.sum / Math.max(agg.count, 1)).toFixed(1))
        })
        return row
      })

    // Distribución de calificaciones (buckets)
    const buckets = [
      { label: '0-40', min: 0, max: 40 },
      { label: '41-60', min: 41, max: 60 },
      { label: '61-80', min: 61, max: 80 },
      { label: '81-100', min: 81, max: 100 },
    ]
    const distribution = buckets.map(b => ({ rango: b.label, estudiantes: filteredResults.filter(r => r.score >= b.min && r.score <= b.max).length }))

    // Ranking por institución (promedio)
    const bySchool = new Map<string, { sum: number; count: number }>()
    filteredResults.forEach(r => {
      const sid = r.exam?.course?.schoolId || (r.user as any)?.schoolId
      if (!sid) return
      if (!bySchool.has(sid)) bySchool.set(sid, { sum: 0, count: 0 })
      const agg = bySchool.get(sid)!
      agg.sum += r.score
      agg.count += 1
    })
    const ranking = Array.from(bySchool.entries()).map(([schoolId, agg]) => ({
      schoolId,
      avgScore: Number((agg.sum / Math.max(agg.count, 1)).toFixed(1)),
      attempts: agg.count,
    })).sort((a, b) => b.avgScore - a.avgScore).slice(0, 10)

    // Actividad por hora (0-23) sobre los resultados filtrados
    const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }))
    filteredResults.forEach(r => {
      const h = new Date(r.createdAt).getHours()
      hourly[h].count += 1
    })

    const payload = {
      kpis: { activeStudents, examAttempts: attempts, averageScore: avgScore, institutions },
      series,
      distribution,
      ranking,
      range: { from: from.toISOString(), to: to.toISOString() },
      hourly,
    }

    // Guardar en cache (10 min)
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


