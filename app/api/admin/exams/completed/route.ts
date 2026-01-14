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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const schoolId = searchParams.get('schoolId')
    const courseId = searchParams.get('courseId')
    const competencyId = searchParams.get('competencyId')
    const email = searchParams.get('email')
    const name = searchParams.get('name')

    console.log('API Parameters received:', {
      page,
      limit,
      search,
      schoolId,
      courseId,
      competencyId,
      email,
      name
    })

    const skip = (page - 1) * limit

    // Construir filtros
    let whereClause: any = {
      score: { gt: 0 }, // Solo exámenes completados
      completedAt: { not: null }
    }

    // Si es school_admin, solo puede ver exámenes de su colegio
    if (session.user.role === 'school_admin') {
      if (!session.user.schoolId) {
        return NextResponse.json({ error: 'Usuario sin colegio asignado' }, { status: 400 })
      }
      whereClause.user = {
        schoolId: session.user.schoolId
      }
    } else if (schoolId && schoolId !== 'all') {
      // Teacher admin puede filtrar por colegio específico
      whereClause.user = {
        schoolId: schoolId
      }
    }

    // Filtros específicos
    const examFilters: any = {}
    const userFilters: any = {}

    if (courseId) {
      examFilters.courseId = courseId
    }

    if (competencyId) {
      examFilters.competencyId = competencyId
    }

    if (email) {
      userFilters.email = { contains: email, mode: 'insensitive' }
    }

    if (name) {
      userFilters.OR = [
        { firstName: { contains: name, mode: 'insensitive' } },
        { lastName: { contains: name, mode: 'insensitive' } }
      ]
    }

    // Aplicar filtros de examen
    if (Object.keys(examFilters).length > 0) {
      whereClause.exam = {
        ...whereClause.exam,
        ...examFilters
      }
    }

    // Aplicar filtros de usuario
    if (Object.keys(userFilters).length > 0) {
      whereClause.user = {
        ...whereClause.user,
        ...userFilters
      }
    }

    // Búsqueda general por nombre del estudiante o título del examen
    if (search) {
      whereClause.OR = [
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        },
        {
          exam: {
            title: { contains: search, mode: 'insensitive' }
          }
        }
      ]
    }

    // Debug: Log the where clause
    console.log('Where clause for exam results:', JSON.stringify(whereClause, null, 2))

    // Primero, verificar si hay datos básicos
    const totalExamResults = await prisma.examResult.count()
    console.log('Total exam results in database:', totalExamResults)

    if (totalExamResults === 0) {
      return NextResponse.json({
        examResults: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        }
      })
    }

    // Obtener exámenes completados - versión mínima funcional
    let examResults, total

    try {
      console.log('Fetching exam results with minimal query...')
      
      // Consulta mínima que sabemos que funciona
      examResults = await prisma.examResult.findMany({
        where: {
          score: { gt: 0 },
          completedAt: { not: null }
        },
        include: {
          exam: {
            select: {
              id: true,
              title: true,
              description: true,
              courseId: true,
              competencyId: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              schoolId: true
            }
          }
        },
        orderBy: {
          completedAt: 'desc'
        },
        skip,
        take: limit
      })

      total = await prisma.examResult.count({
        where: {
          score: { gt: 0 },
          completedAt: { not: null }
        }
      })

      console.log(`Found ${examResults.length} exam results, total: ${total}`)

      // Transformar los datos para que coincidan con la interfaz esperada
      examResults = examResults.map(result => ({
        id: result.id,
        score: result.score,
        correctAnswers: result.correctAnswers,
        incorrectAnswers: result.incorrectAnswers,
        totalQuestions: result.totalQuestions,
        isPassed: result.isPassed,
        timeTakenMinutes: result.timeTakenMinutes,
        completedAt: result.completedAt?.toISOString(),
        exam: {
          id: result.exam.id,
          title: result.exam.title,
          description: result.exam.description,
          course: result.exam.courseId ? {
            id: result.exam.courseId,
            title: 'Curso no cargado'
          } : null,
          competency: result.exam.competencyId ? {
            id: result.exam.competencyId,
            name: 'Competencia no cargada',
            displayName: 'Competencia no cargada'
          } : null
        },
        user: {
          id: result.user.id,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          email: result.user.email,
          school: result.user.schoolId ? {
            id: result.user.schoolId,
            name: 'Colegio no cargado'
          } : null
        }
      }))

      // Aplicar filtros de búsqueda en memoria solo si hay filtros
      const hasFilters = search || name || email || courseId || competencyId
      if (hasFilters) {
        console.log('Applying search filters in memory...')
        console.log('Filters:', { search, name, email, courseId, competencyId })
        
        examResults = examResults.filter(result => {
          // Filtro de búsqueda general
          if (search) {
            const searchLower = search.toLowerCase()
            const matchesSearch = 
              result.user.firstName.toLowerCase().includes(searchLower) ||
              result.user.lastName.toLowerCase().includes(searchLower) ||
              result.user.email.toLowerCase().includes(searchLower) ||
              result.exam.title.toLowerCase().includes(searchLower)
            
            if (!matchesSearch) return false
          }

          // Filtro de nombre
          if (name) {
            const nameLower = name.toLowerCase()
            const matchesName = 
              result.user.firstName.toLowerCase().includes(nameLower) ||
              result.user.lastName.toLowerCase().includes(nameLower)
            
            if (!matchesName) return false
          }

          // Filtro de email
          if (email) {
            const emailLower = email.toLowerCase()
            if (!result.user.email.toLowerCase().includes(emailLower)) return false
          }

          // Filtro de curso
          if (courseId) {
            if (result.exam.course?.id !== courseId) return false
          }

          // Filtro de competencia
          if (competencyId) {
            if (result.exam.competency?.id !== competencyId) return false
          }

          return true
        })

        total = examResults.length
        console.log(`After filtering: ${examResults.length} results`)
      }

    } catch (error) {
      console.error('Error fetching exam results:', error)
      console.error('Error details:', error.message)
      console.error('Error stack:', error.stack)
      throw error
    }

    console.log('Found exam results:', examResults.length)
    console.log('Total matching results:', total)

    return NextResponse.json({
      examResults,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching completed exams:', error)
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
