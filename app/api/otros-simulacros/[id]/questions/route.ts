import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Preguntas para "otros simulacros":
// - "Área" es texto libre y se guarda en `componente`
const questionSchema = z.object({
  contextText: z.string().min(1, 'El enunciado es requerido'),
  questionText: z.string().min(1, 'El texto de la pregunta es requerido'),
  questionImage: z.string().optional(),
  questionType: z.enum(['multiple_choice']).default('multiple_choice'),
  // Área libre
  area: z.string().min(1, 'El área es requerida'),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  optionAImage: z.string().optional(),
  optionBImage: z.string().optional(),
  optionCImage: z.string().optional(),
  optionDImage: z.string().optional(),
  correctOption: z.string().min(1),
  explanation: z.string().optional(),
  explanationImage: z.string().optional(),
  difficultyLevel: z.enum(['facil', 'intermedio', 'dificil', 'variable']),
  points: z.number().min(1).default(1),
  orderIndex: z.number().min(0),
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
      select: { isManualSimulacro: true, isIcfesExam: true }
    })
    if (!exam || !exam.isManualSimulacro || exam.isIcfesExam) {
      return NextResponse.json({ error: 'Simulacro no encontrado' }, { status: 404 })
    }

    const questions = await prisma.examQuestion.findMany({
      where: { examId: id },
      orderBy: { orderIndex: 'asc' },
    })

    return NextResponse.json(questions)
  } catch (error) {
    console.error('Error fetching otros questions:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(
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
    const validated = questionSchema.parse(body)

    const exam = await prisma.exam.findUnique({
      where: { id },
      select: { isManualSimulacro: true, isIcfesExam: true, totalQuestions: true }
    })
    if (!exam || !exam.isManualSimulacro || exam.isIcfesExam) {
      return NextResponse.json({ error: 'Simulacro no encontrado' }, { status: 404 })
    }

    const question = await prisma.examQuestion.create({
      data: {
        examId: id,
        lessonUrl: validated.contextText,
        questionText: validated.questionText,
        questionImage: validated.questionImage || null,
        questionType: 'multiple_choice',
        // Guardar Área libre aquí
        componente: validated.area,
        optionA: validated.optionA,
        optionB: validated.optionB,
        optionC: validated.optionC,
        optionD: validated.optionD,
        optionAImage: validated.optionAImage || null,
        optionBImage: validated.optionBImage || null,
        optionCImage: validated.optionCImage || null,
        optionDImage: validated.optionDImage || null,
        correctOption: validated.correctOption,
        explanation: validated.explanation || null,
        explanationImage: validated.explanationImage || null,
        difficultyLevel: validated.difficultyLevel,
        points: validated.points,
        orderIndex: validated.orderIndex,
        // sin competencyId / tema / subtema
      }
    })

    await prisma.exam.update({
      where: { id },
      data: { totalQuestions: (exam.totalQuestions || 0) + 1 }
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
    }
    console.error('Error creating otros question:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

