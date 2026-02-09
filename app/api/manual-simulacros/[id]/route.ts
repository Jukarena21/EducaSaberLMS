import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const manualSimulacroSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  timeLimitMinutes: z.number().min(1).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  openDate: z.string().optional(),
  closeDate: z.string().optional(),
  isPredefined: z.boolean().optional(),
  isPublished: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const exam = await prisma.exam.findUnique({
      where: { id },
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
            competencia: true,
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
                email: true,
                schoolId: true
              }
            },
            assignedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: {
            examResults: true
          }
        }
      }
    })

    if (!exam) {
      return NextResponse.json({ error: 'Simulacro no encontrado' }, { status: 404 })
    }

    if (!exam.isManualSimulacro) {
      return NextResponse.json(
        { error: 'Este no es un simulacro manual' },
        { status: 400 }
      )
    }

    // Verificar permisos
    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    return NextResponse.json(exam)
  } catch (error) {
    console.error('Error fetching manual simulacro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = manualSimulacroSchema.parse(body)

    // Verificar que existe y es un simulacro manual
    const existingExam = await prisma.exam.findUnique({
      where: { id }
    })

    if (!existingExam) {
      return NextResponse.json({ error: 'Simulacro no encontrado' }, { status: 404 })
    }

    if (!existingExam.isManualSimulacro) {
      return NextResponse.json(
        { error: 'Este no es un simulacro manual' },
        { status: 400 }
      )
    }

    // Preparar datos para actualizar
    const updateData: any = {}
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.timeLimitMinutes !== undefined) updateData.timeLimitMinutes = validatedData.timeLimitMinutes
    if (validatedData.passingScore !== undefined) updateData.passingScore = validatedData.passingScore
    if (validatedData.isPredefined !== undefined) updateData.isPredefined = validatedData.isPredefined
    if (validatedData.isPublished !== undefined) updateData.isPublished = validatedData.isPublished
    if (validatedData.openDate !== undefined) {
      updateData.openDate = validatedData.openDate ? new Date(validatedData.openDate) : null
    }
    if (validatedData.closeDate !== undefined) {
      updateData.closeDate = validatedData.closeDate ? new Date(validatedData.closeDate) : null
    }

    const updatedExam = await prisma.exam.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        examQuestions: {
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
            competencia: true,
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
          },
          orderBy: {
            orderIndex: 'asc'
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
        }
      }
    })

    return NextResponse.json(updatedExam)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating manual simulacro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { id } = await params

    // Verificar que existe y es un simulacro manual
    const existingExam = await prisma.exam.findUnique({
      where: { id }
    })

    if (!existingExam) {
      return NextResponse.json({ error: 'Simulacro no encontrado' }, { status: 404 })
    }

    if (!existingExam.isManualSimulacro) {
      return NextResponse.json(
        { error: 'Este no es un simulacro manual' },
        { status: 400 }
      )
    }

    // Eliminar el simulacro (las relaciones se eliminan en cascada)
    await prisma.exam.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Simulacro eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting manual simulacro:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

