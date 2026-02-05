import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Esquema de validación para crear un simulacro manual
const manualSimulacroSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  timeLimitMinutes: z.number().min(1, 'El tiempo límite debe ser mayor a 0'),
  passingScore: z.number().min(0).max(100).default(70),
  openDate: z.string().optional(),
  closeDate: z.string().optional(),
  isPredefined: z.boolean().default(false),
  isPublished: z.boolean().default(false),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo teacher_admin puede ver todos los simulacros manuales
    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const isPredefined = searchParams.get('isPredefined')
    const isPublished = searchParams.get('isPublished')
    const createdById = searchParams.get('createdById')
    const openDateFrom = searchParams.get('openDateFrom')
    const openDateTo = searchParams.get('openDateTo')
    const closeDateFrom = searchParams.get('closeDateFrom')
    const closeDateTo = searchParams.get('closeDateTo')

    // Construir filtros
    const where: any = {
      isManualSimulacro: true, // Solo simulacros manuales
      isIcfesExam: true,       // Solo simulacros tipo Saber/ICFES
    }
    
    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive'
      }
    }
    
    if (isPredefined !== null) {
      where.isPredefined = isPredefined === 'true'
    }
    
    if (isPublished !== null) {
      where.isPublished = isPublished === 'true'
    }
    
    if (createdById) {
      where.createdById = createdById
    }
    
    if (openDateFrom || openDateTo) {
      where.openDate = {}
      if (openDateFrom) {
        where.openDate.gte = new Date(openDateFrom)
      }
      if (openDateTo) {
        where.openDate.lte = new Date(openDateTo)
      }
    }
    
    if (closeDateFrom || closeDateTo) {
      where.closeDate = {}
      if (closeDateFrom) {
        where.closeDate.gte = new Date(closeDateFrom)
      }
      if (closeDateTo) {
        where.closeDate.lte = new Date(closeDateTo)
      }
    }

    const exams = await prisma.exam.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        examQuestions: {
          orderBy: {
            orderIndex: 'asc'
          },
          select: {
            id: true,
            examId: true,
            questionText: true,
            questionImage: true,
            questionType: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
            optionAImage: true,
            optionBImage: true,
            optionCImage: true,
            optionDImage: true,
            correctOption: true,
            explanation: true,
            explanationImage: true,
            difficultyLevel: true,
            points: true,
            orderIndex: true,
            timeLimit: true,
            lessonId: true,
            lessonUrl: true,
            tema: true,
            subtema: true,
            componente: true,
            competencyId: true,
            competency: {
              select: {
                id: true,
                name: true,
                displayName: true
              }
            },
            createdAt: true,
            updatedAt: true,
          }
        },
        examSchools: {
          include: {
            school: {
              select: {
                id: true,
                name: true,
                daneCode: true
              }
            }
          }
        },
        examAssignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            examResults: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Agregar competencia como null a todas las preguntas (temporal hasta que se ejecute la migración)
    const examsWithCompetencia = exams.map(exam => ({
      ...exam,
      examQuestions: exam.examQuestions.map((q: any) => ({
        ...q,
        competencia: null // Temporal hasta que se ejecute la migración
      }))
    }))

    return NextResponse.json(examsWithCompetencia)
  } catch (error) {
    console.error('Error fetching manual simulacros:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = manualSimulacroSchema.parse(body)

    // Crear el simulacro manual
    const exam = await prisma.exam.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        examType: 'simulacro_completo',
        timeLimitMinutes: validatedData.timeLimitMinutes,
        passingScore: validatedData.passingScore,
        difficultyLevel: 'variable', // Los simulacros manuales pueden tener dificultad variable
        isAdaptive: false,
        isPublished: validatedData.isPublished,
        isIcfesExam: true, // Los simulacros manuales son ICFES
        isManualSimulacro: true, // Flag principal
        isPredefined: validatedData.isPredefined,
        createdById: session.user.id,
        openDate: validatedData.openDate ? new Date(validatedData.openDate) : null,
        closeDate: validatedData.closeDate ? new Date(validatedData.closeDate) : null,
        questionsPerModule: 0, // No aplica para simulacros manuales
        totalQuestions: 0, // Se actualizará cuando se agreguen preguntas
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        examQuestions: true,
        examSchools: true,
        examAssignments: true
      }
    })

    return NextResponse.json(exam, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating manual simulacro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

