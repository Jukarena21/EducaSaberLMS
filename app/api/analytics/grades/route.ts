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
    if (!gate.session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
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

    // Rango de fechas (por defecto últimos 365 días para incluir más datos)
    const to = toParam ? new Date(toParam) : new Date()
    const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)

    // Cache simple por 10 minutos
    const cacheKey = buildCacheKey(pathname, searchParams)
    const cached = await prisma.reportCache.findUnique({ where: { cacheKey } }).catch(() => null)
    if (cached && new Date(cached.expiresAt).getTime() > Date.now()) {
      const cachedData = JSON.parse(cached.reportData)
      console.log(`[analytics/grades] Returning cached data, series count: ${cachedData.series?.length || 0}`)
      return NextResponse.json(cachedData)
    }

    // Construir filtros para ExamResult/Exam
    // Usar completedAt si existe, sino startedAt para el rango de fechas
    const whereExamResult: any = {
      OR: [
        { completedAt: { gte: from, lte: to } },
        { startedAt: { gte: from, lte: to } }
      ]
    }

    // Filtros por Exam/Course/Competency/School - aplicarlos en el where del exam
    const whereExam: any = {}
    if (competencyId) whereExam.competencyId = competencyId
    if (courseId) whereExam.courseId = courseId

    // academicGrade se obtiene desde Course
    // schoolId se filtra a través de courseSchools (relación muchos a muchos)
    const whereCourse: any = {}
    if (academicGrade) whereCourse.academicGrade = academicGrade
    if (schoolId) {
      whereCourse.courseSchools = {
        some: {
          schoolId: schoolId
        }
      }
    }

    // Filtrado por edad via relación User
    const whereUser: any = {}
    if (minAge !== undefined || maxAge !== undefined) {
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

    // Consultas - incluir todas las relaciones necesarias sin filtros en el include
    // Los filtros se aplicarán después en el código
    const examResults = await prisma.examResult.findMany({
      where: whereExamResult,
      include: {
        user: {
          select: { id: true, dateOfBirth: true, schoolId: true },
          ...(Object.keys(whereUser).length > 0 ? { where: whereUser } : {})
        },
        exam: {
          include: {
            course: {
              include: {
                courseSchools: {
                  select: { schoolId: true }
                }
              }
            },
            competency: true
          }
        },
      },
    })

    // Filtrado post-join para aplicar todos los filtros que no se pueden hacer en Prisma
    const filteredResults = examResults.filter(er => {
      // Verificar que tenga exam y relaciones necesarias
      if (!er.exam || !er.exam.course || !er.exam.competency) return false
      
      // Filtros de exam
      if (competencyId && er.exam.competencyId !== competencyId) return false
      if (courseId && er.exam.courseId !== courseId) return false
      
      // Filtros de course - schoolId viene de courseSchools (relación muchos a muchos)
      if (schoolId) {
        const courseSchoolIds = er.exam.course.courseSchools?.map(cs => cs.schoolId) || []
        if (!courseSchoolIds.includes(schoolId)) return false
      }
      if (academicGrade && er.exam.course.academicGrade !== academicGrade) return false
      
      // Filtros de user (edad ya se aplicó en el where si estaba definido)
      if (Object.keys(whereUser).length > 0 && !er.user) return false
      
      return true
    })

    // KPIs calculados sobre filteredResults para respetar filtros aplicados
    // Para activeStudents, usar la misma definición que engagement: estudiantes con lecciones completadas O exámenes
    const whereCourseForLessons: any = {}
    if (academicGrade) whereCourseForLessons.academicGrade = academicGrade
    if (schoolId) {
      whereCourseForLessons.courseSchools = {
        some: { schoolId: schoolId }
      }
    }
    
    // Contar estudiantes activos: aquellos con lecciones completadas O exámenes (en el período y con filtros)
    // Primero obtener estudiantes con exámenes (ya filtrados)
    const studentsWithExamsSet = new Set(filteredResults.map(r => r.userId))
    
    // Luego obtener estudiantes con lecciones completadas (aplicando los mismos filtros)
    const studentsWithLessons = await prisma.user.findMany({
      where: {
        role: 'student',
        studentLessonProgress: {
          some: {
            status: 'completed',
            updatedAt: { gte: from, lte: to },
            lesson: {
              moduleLessons: {
                some: {
                  module: {
                    courseModules: {
                      some: {
                        course: Object.keys(whereCourseForLessons).length > 0 ? whereCourseForLessons : undefined
                      }
                    }
                  }
                }
              }
            }
          }
        },
        // Aplicar filtros de edad si existen
        ...(Object.keys(whereUser).length > 0 ? whereUser : {})
      },
      select: { id: true, schoolId: true }
    })
    
    // Combinar ambos conjuntos para obtener todos los estudiantes activos
    const allActiveStudentIds = new Set(studentsWithExamsSet)
    studentsWithLessons.forEach(u => allActiveStudentIds.add(u.id))
    const activeStudents = allActiveStudentIds.size
    
    const attempts = filteredResults.length
    const avgScore = filteredResults.length > 0
      ? Number((filteredResults.reduce((sum, r) => sum + r.score, 0) / filteredResults.length).toFixed(1))
      : 0
    
    // Instituciones: si hay filtro de schoolId, mostrar 1; si no, contar solo colegios (type = 'school') con actividad
    let institutions: number
    if (schoolId) {
      // Verificar que el schoolId sea un colegio (type = 'school')
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { type: true }
      })
      institutions = school?.type === 'school' ? 1 : 0
    } else {
      const schoolIds = new Set<string>()
      // Escuelas de estudiantes con exámenes
      filteredResults.forEach(r => {
        const courseSchoolIds = r.exam?.course?.courseSchools?.map(cs => cs.schoolId) || []
        const sid = r.user?.schoolId || courseSchoolIds[0]
        if (sid) schoolIds.add(sid)
      })
      // Escuelas de estudiantes con lecciones (ya tenemos schoolId en el select)
      studentsWithLessons.forEach(u => {
        if (u.schoolId) schoolIds.add(u.schoolId)
      })
      
      // Filtrar solo colegios (type = 'school')
      if (schoolIds.size > 0) {
        const validSchools = await prisma.school.findMany({
          where: {
            id: { in: Array.from(schoolIds) },
            type: 'school' // Solo colegios
          },
          select: { id: true }
        })
        institutions = validSchools.length
      } else {
        institutions = 0
      }
    }

    // Serie mensual por competencia (promedio)
    const byMonth = new Map<string, { [competency: string]: { sum: number; count: number } }>()
    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    
    // Debug: verificar cuántos resultados tenemos
    console.log(`[analytics/grades] filteredResults count: ${filteredResults.length}`)
    
    filteredResults.forEach(r => {
      // Usar completedAt si existe, sino startedAt
      const dateToUse = r.completedAt || r.startedAt
      const key = monthKey(new Date(dateToUse))
      const comp = r.exam?.competency?.displayName || 'General'
      if (!byMonth.has(key)) byMonth.set(key, {})
      const bucket = byMonth.get(key)!
      if (!bucket[comp]) bucket[comp] = { sum: 0, count: 0 }
      bucket[comp].sum += r.score
      bucket[comp].count += 1
    })
    
    // Calcular valores agregados por período (promedio general, tasa de aprobación, intentos)
    const series = Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, comps]) => {
        const row: any = { period }
        
        // Calcular promedio general del período (promedio de todos los promedios por competencia)
        let totalSum = 0
        let totalCount = 0
        Object.entries(comps).forEach(([name, agg]) => {
          const avg = agg.sum / Math.max(agg.count, 1)
          row[name] = Number(avg.toFixed(1))
          totalSum += agg.sum
          totalCount += agg.count
        })
        
        // Promedio general del período
        row.avgScore = totalCount > 0 ? Number((totalSum / totalCount).toFixed(1)) : 0
        
        // Calcular tasa de aprobación (resultados >= 70) y total de intentos
        const periodResults = filteredResults.filter(r => {
          const dateToUse = r.completedAt || r.startedAt
          return monthKey(new Date(dateToUse)) === period
        })
        const passedResults = periodResults.filter(r => r.score >= 70)
        row.passRate = periodResults.length > 0 
          ? Number(((passedResults.length / periodResults.length) * 100).toFixed(1))
          : 0
        row.attempts = periodResults.length
        
        return row
      })
    
    // Debug: verificar qué se está generando
    console.log(`[analytics/grades] series count: ${series.length}`, series.length > 0 ? series[0] : 'empty')

    // Distribución de calificaciones (buckets)
    const buckets = [
      { label: '0-40', min: 0, max: 40 },
      { label: '41-60', min: 41, max: 60 },
      { label: '61-80', min: 61, max: 80 },
      { label: '81-100', min: 81, max: 100 },
    ]
    const distribution = buckets.map(b => ({ rango: b.label, estudiantes: filteredResults.filter(r => r.score >= b.min && r.score <= b.max).length }))

    // Ranking por institución (promedio)
    // Solo incluir colegios (type = 'school'), no empresas u otros tipos
    // Priorizar user.schoolId sobre course.courseSchools[0] para mayor precisión
    const bySchool = new Map<string, { sum: number; count: number }>()
    
    // Primero obtener información de las escuelas para filtrar por tipo
    const schoolIdsInResults = new Set<string>()
    filteredResults.forEach(r => {
      const userSchoolId = r.user?.schoolId
      const courseSchoolIds = r.exam?.course?.courseSchools?.map(cs => cs.schoolId) || []
      const sid = userSchoolId || courseSchoolIds[0]
      if (sid) schoolIdsInResults.add(sid)
    })
    
    // Obtener solo escuelas (type = 'school')
    const schools = await prisma.school.findMany({
      where: {
        id: { in: Array.from(schoolIdsInResults) },
        type: 'school' // Solo colegios, no empresas u otros tipos
      },
      select: { id: true }
    })
    const validSchoolIds = new Set(schools.map(s => s.id))
    
    // Agregar solo resultados de colegios válidos
    filteredResults.forEach(r => {
      const userSchoolId = r.user?.schoolId
      const courseSchoolIds = r.exam?.course?.courseSchools?.map(cs => cs.schoolId) || []
      const sid = userSchoolId || courseSchoolIds[0]
      if (!sid || !validSchoolIds.has(sid)) return
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
      // Usar completedAt si existe, sino startedAt
      const dateToUse = r.completedAt || r.startedAt
      const h = new Date(dateToUse).getHours()
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
    
    // Debug: verificar payload antes de guardar en cache
    console.log(`[analytics/grades] Payload - series: ${series.length}, distribution: ${distribution.length}, ranking: ${ranking.length}, hourly: ${hourly.length}`)

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


