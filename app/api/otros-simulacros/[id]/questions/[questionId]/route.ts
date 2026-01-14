import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const questionSchema = z.object({
  contextText: z.string().optional(),
  questionText: z.string().min(1).optional(),
  questionImage: z.string().optional(),
  optionA: z.string().min(1).optional(),
  optionB: z.string().min(1).optional(),
  optionC: z.string().min(1).optional(),
  optionD: z.string().min(1).optional(),
  optionAImage: z.string().optional(),
  optionBImage: z.string().optional(),
  optionCImage: z.string().optional(),
  optionDImage: z.string().optional(),
  correctOption: z.string().optional(),
  explanation: z.string().optional(),
  explanationImage: z.string().optional(),
  difficultyLevel: z.enum(['facil', 'intermedio', 'dificil', 'variable']).optional(),
  points: z.number().min(1).optional(),
  orderIndex: z.number().min(0).optional(),
  area: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) return NextResponse.json({ error: gate.error }, { status: gate.status })

    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id, questionId } = await params
    const body = await request.json()
    const validated = questionSchema.parse(body)

    const exam = await prisma.exam.findUnique({
      where: { id },
      select: { isManualSimulacro: true, isIcfesExam: true }
    })
    if (!exam || !exam.isManualSimulacro || exam.isIcfesExam) {
      return NextResponse.json({ error: 'Simulacro no encontrado' }, { status: 404 })
    }

    const existing = await prisma.examQuestion.findFirst({ where: { id: questionId, examId: id } })
    if (!existing) return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 })

    const updateData: any = {}
    Object.keys(validated).forEach((key) => {
      const val = (validated as any)[key]
      if (val === undefined) return
      if (key === 'contextText') updateData.lessonUrl = val
      else if (key === 'area') updateData.componente = val
      else updateData[key] = val
    })

    // Forzar siempre opción múltiple
    updateData.questionType = 'multiple_choice'

    // Manejar imágenes vacías como null
    if (updateData.questionImage === '') updateData.questionImage = null
    if (updateData.optionAImage === '') updateData.optionAImage = null
    if (updateData.optionBImage === '') updateData.optionBImage = null
    if (updateData.optionCImage === '') updateData.optionCImage = null
    if (updateData.optionDImage === '') updateData.optionDImage = null
    if (updateData.explanationImage === '') updateData.explanationImage = null

    const updated = await prisma.examQuestion.update({
      where: { id: questionId },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error updating otros question:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) return NextResponse.json({ error: gate.error }, { status: gate.status })

    const { id, questionId } = await params

    const exam = await prisma.exam.findUnique({
      where: { id },
      select: { isManualSimulacro: true, isIcfesExam: true, totalQuestions: true }
    })
    if (!exam || !exam.isManualSimulacro || exam.isIcfesExam) {
      return NextResponse.json({ error: 'Simulacro no encontrado' }, { status: 404 })
    }

    const existing = await prisma.examQuestion.findFirst({ where: { id: questionId, examId: id } })
    if (!existing) return NextResponse.json({ error: 'Pregunta no encontrada' }, { status: 404 })

    await prisma.examQuestion.delete({ where: { id: questionId } })
    await prisma.exam.update({
      where: { id },
      data: { totalQuestions: Math.max(0, (exam.totalQuestions || 0) - 1) }
    })

    return NextResponse.json({ message: 'Pregunta eliminada correctamente' })
  } catch (error) {
    console.error('Error deleting otros question:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

