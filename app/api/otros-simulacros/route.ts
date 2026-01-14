import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Simulacros manuales NO ICFES (otros)
const otherSimulacroSchema = z.object({
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

    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const isPredefined = searchParams.get('isPredefined')
    const isPublished = searchParams.get('isPublished')

    const where: any = {
      isManualSimulacro: true,
      isIcfesExam: false,
    }

    if (search) {
      where.title = { contains: search, mode: 'insensitive' }
    }
    if (isPredefined !== null) where.isPredefined = isPredefined === 'true'
    if (isPublished !== null) where.isPublished = isPublished === 'true'

    const exams = await prisma.exam.findMany({
      where,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        examQuestions: {
          orderBy: { orderIndex: 'asc' },
          // No incluimos competency porque en "otros" no se usa
        },
        examSchools: true,
        examAssignments: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(exams)
  } catch (error) {
    console.error('Error fetching otros simulacros:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
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
    const validatedData = otherSimulacroSchema.parse(body)

    const exam = await prisma.exam.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        examType: 'simulacro_completo',
        timeLimitMinutes: validatedData.timeLimitMinutes,
        passingScore: validatedData.passingScore,
        difficultyLevel: 'variable',
        isAdaptive: false,
        isPublished: validatedData.isPublished,
        isIcfesExam: false, // clave: otros simulacros
        isManualSimulacro: true,
        isPredefined: validatedData.isPredefined,
        createdById: session.user.id,
        openDate: validatedData.openDate ? new Date(validatedData.openDate) : null,
        closeDate: validatedData.closeDate ? new Date(validatedData.closeDate) : null,
        questionsPerModule: 0,
        totalQuestions: 0,
      },
    })

    return NextResponse.json(exam, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error creating otros simulacro:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

