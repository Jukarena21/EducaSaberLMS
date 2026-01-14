import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/rbac'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos
    const gate = await requireRole(['teacher_admin', 'school_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const courseId = searchParams.get('courseId')
    const competencyId = searchParams.get('competencyId')
    const schoolId = searchParams.get('schoolId')
    const isIcfesExamParam = searchParams.get('isIcfesExam')

    // Construir filtros para exámenes
    const examWhere: any = {}
    if (courseId) examWhere.courseId = courseId
    if (competencyId) examWhere.competencyId = competencyId
    if (search) {
      examWhere.title = { contains: search, mode: 'insensitive' }
    }
    // Filtro por tipo ICFES vs Personalizado
    if (isIcfesExamParam !== null && isIcfesExamParam !== undefined) {
      const isIcfesExam = isIcfesExamParam === 'true' || isIcfesExamParam === '1'
      examWhere.isIcfesExam = isIcfesExam
    }

    // Construir filtros para resultados
    const resultWhere: any = {
      score: { gt: 0 },
      completedAt: { not: null }
    }

    // Si es school_admin, solo puede ver exámenes de su colegio
    if (session.user.role === 'school_admin') {
      if (!session.user.schoolId) {
        return NextResponse.json({ error: 'Usuario sin colegio asignado' }, { status: 400 })
      }
      resultWhere.user = {
        schoolId: session.user.schoolId
      }
    } else if (schoolId && schoolId !== 'all') {
      // Teacher admin puede filtrar por colegio específico
      resultWhere.user = {
        schoolId: schoolId
      }
    }

    // Obtener todos los resultados completados con sus exámenes
    const examResults = await prisma.examResult.findMany({
      where: resultWhere,
      include: {
        exam: {
          include: {
            examSchools: true,
            examAssignments: true,
            course: {
              select: {
                id: true,
                title: true,
                academicGrade: true
              }
            },
            competency: {
              select: {
                id: true,
                name: true,
                displayName: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            school: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    // Agrupar por examen
    const examsMap = new Map<string, {
      exam: any
      students: Array<{
        resultId: string
        user: any
        score: number
        isPassed: boolean
        completedAt: string
        correctAnswers: number
        incorrectAnswers: number
        timeTakenMinutes: number
      }>
      totalStudents: number
    }>()

    examResults.forEach(result => {
      // Aplicar filtros de examen si existen
      if (Object.keys(examWhere).length > 0) {
        if (examWhere.courseId && result.exam.courseId !== examWhere.courseId) return
        if (examWhere.competencyId && result.exam.competencyId !== examWhere.competencyId) return
        if (examWhere.title && !result.exam.title.toLowerCase().includes(search.toLowerCase())) return
      }

      const examId = result.examId
      if (!examsMap.has(examId)) {
        examsMap.set(examId, {
          exam: {
            id: result.exam.id,
            title: result.exam.title,
            description: result.exam.description,
            examType: result.exam.examType,
            academicGrade: (result.exam as any).academicGrade,
            course: result.exam.course ? {
              ...result.exam.course,
              academicGrade: (result.exam.course as any).academicGrade
            } : null,
            competency: result.exam.competency,
            isManualSimulacro: (result.exam as any).isManualSimulacro ?? false,
            isPublished: (result.exam as any).isPublished ?? false,
            isIcfesExam: (result.exam as any).isIcfesExam ?? false,
            passingScore: (result.exam as any).passingScore ?? 70,
            timeLimitMinutes: (result.exam as any).timeLimitMinutes ?? null,
            totalQuestions: (result.exam as any).totalQuestions ?? result.exam.examQuestions?.length ?? 0
          },
          students: [],
          totalStudents: 0
        })
      }

      const examData = examsMap.get(examId)!
      examData.students.push({
        resultId: result.id,
        user: result.user,
        score: result.score,
        isPassed: result.isPassed ?? false,
        completedAt: result.completedAt?.toISOString() || '',
        correctAnswers: result.correctAnswers,
        incorrectAnswers: result.incorrectAnswers,
        timeTakenMinutes: result.timeTakenMinutes ?? 0
      })
      examData.totalStudents = examData.students.length
    })

    // Convertir a array y ordenar por fecha más reciente
    const exams = Array.from(examsMap.values()).sort((a, b) => {
      const aLatest = a.students[0]?.completedAt || ''
      const bLatest = b.students[0]?.completedAt || ''
      return bLatest.localeCompare(aLatest)
    })

    return NextResponse.json({
      exams,
      total: exams.length
    })

  } catch (error) {
    console.error('Error fetching grouped exams:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

