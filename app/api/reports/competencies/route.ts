import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const gate = await requireRole(['teacher_admin','school_admin'])
    if (!gate.allowed) return NextResponse.json({ error: gate.error }, { status: gate.status })

    if (!gate.session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : new Date(Date.now() - 365*24*60*60*1000)
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : new Date()
    // Para school_admin, forzar el filtro por su schoolId
    const schoolId = gate.session.user.role === 'school_admin' 
      ? gate.session.user.schoolId 
      : (searchParams.get('schoolId') || undefined)
    const courseId = searchParams.get('courseId') || undefined
    const competencyId = searchParams.get('competencyId') || undefined
    const academicGrade = searchParams.get('academicGrade') || undefined

    // Construir filtros directamente en Prisma para mejor performance
    const whereExam: any = {}
    if (competencyId) whereExam.competencyId = competencyId
    if (courseId) whereExam.courseId = courseId
    
    const whereCourse: any = {}
    if (academicGrade) whereCourse.academicGrade = academicGrade
    if (schoolId) {
      whereCourse.courseSchools = {
        some: { schoolId: schoolId }
      }
    }
    
    const whereER: any = { 
      createdAt: { gte: from, lte: to },
      exam: {
        ...(Object.keys(whereExam).length > 0 ? whereExam : {}),
        ...(Object.keys(whereCourse).length > 0 ? {
          course: whereCourse
        } : {})
      }
    }

    const results = await prisma.examResult.findMany({
      where: whereER,
      include: {
        exam: { 
          include: { 
            competency: true,
            course: {
              include: {
                courseSchools: {
                  select: { schoolId: true }
                }
              }
            }
          } 
        },
      }
    })

    // Filtrado adicional solo para casos edge que no se pueden hacer en Prisma
    const filtered = results.filter(r => {
      // Verificar que tenga exam y relaciones necesarias
      if (!r.exam || !r.exam.competency) return false
      
      // Filtros de exam (ya aplicados en where, pero verificamos por seguridad)
      if (competencyId && r.exam.competencyId !== competencyId) return false
      if (courseId && r.exam.courseId !== courseId) return false
      
      // Filtro de schoolId (verificar courseSchools)
      if (schoolId && r.exam.course) {
        const courseSchoolIds = r.exam.course.courseSchools?.map(cs => cs.schoolId) || []
        if (!courseSchoolIds.includes(schoolId)) return false
      }
      
      // Filtro de academicGrade (ya aplicado en where, pero verificamos)
      if (academicGrade && r.exam.course?.academicGrade !== academicGrade) return false
      
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


