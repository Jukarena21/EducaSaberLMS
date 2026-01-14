import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const otherSimulacroUpdateSchema = z.object({
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
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) return NextResponse.json({ error: gate.error }, { status: gate.status })

    const { id } = await params

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        examQuestions: { orderBy: { orderIndex: 'asc' } },
        examSchools: true,
        examAssignments: true,
      },
    })

    if (!exam || !exam.isManualSimulacro || exam.isIcfesExam) {
      return NextResponse.json({ error: 'Simulacro no encontrado' }, { status: 404 })
    }

    return NextResponse.json(exam)
  } catch (error) {
    console.error('Error fetching otros simulacro:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) return NextResponse.json({ error: gate.error }, { status: gate.status })

    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const validated = otherSimulacroUpdateSchema.parse(body)

    const existing = await prisma.exam.findUnique({ where: { id } })
    if (!existing || !existing.isManualSimulacro || existing.isIcfesExam) {
      return NextResponse.json({ error: 'Simulacro no encontrado' }, { status: 404 })
    }

    const data: any = {}
    if (validated.title !== undefined) data.title = validated.title
    if (validated.description !== undefined) data.description = validated.description
    if (validated.timeLimitMinutes !== undefined) data.timeLimitMinutes = validated.timeLimitMinutes
    if (validated.passingScore !== undefined) data.passingScore = validated.passingScore
    if (validated.isPredefined !== undefined) data.isPredefined = validated.isPredefined
    if (validated.isPublished !== undefined) data.isPublished = validated.isPublished
    if (validated.openDate !== undefined) data.openDate = validated.openDate ? new Date(validated.openDate) : null
    if (validated.closeDate !== undefined) data.closeDate = validated.closeDate ? new Date(validated.closeDate) : null

    const updated = await prisma.exam.update({
      where: { id },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error updating otros simulacro:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) return NextResponse.json({ error: gate.error }, { status: gate.status })

    const { id } = await params

    const existing = await prisma.exam.findUnique({ where: { id } })
    if (!existing || !existing.isManualSimulacro || existing.isIcfesExam) {
      return NextResponse.json({ error: 'Simulacro no encontrado' }, { status: 404 })
    }

    await prisma.exam.delete({ where: { id } })
    return NextResponse.json({ message: 'Simulacro eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting otros simulacro:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

