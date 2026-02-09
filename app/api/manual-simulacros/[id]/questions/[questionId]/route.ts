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
  questionType: z.enum(['multiple_choice']).optional(), // Solo opción múltiple para simulacros manuales
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
  tema: z.string().optional(),
  subtema: z.string().optional(),
  componente: z.string().optional(),
  competencia: z.string().optional(),
  competencyId: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
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

    const { id, questionId } = await params
    const body = await request.json()
    const validatedData = questionSchema.parse(body)

    // Verificar que el simulacro existe y es manual
    const exam = await prisma.exam.findUnique({
      where: { id },
      select: { isManualSimulacro: true }
    })

    if (!exam || !exam.isManualSimulacro) {
      return NextResponse.json(
        { error: 'Simulacro no encontrado o no es manual' },
        { status: 404 }
      )
    }

    // Verificar que la pregunta existe y pertenece al simulacro
    const existingQuestion = await prisma.examQuestion.findFirst({
      where: {
        id: questionId,
        examId: id
      }
    })

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      )
    }

    // Actualizar la pregunta (siempre opción múltiple para simulacros manuales)
    const updateData: any = {}
    Object.keys(validatedData).forEach(key => {
      if (validatedData[key as keyof typeof validatedData] !== undefined) {
        if (key === 'contextText') {
          // Guardar el enunciado en lessonUrl (campo interno no usado en otros flujos)
          updateData.lessonUrl = validatedData.contextText
        } else if (key === 'competencia') {
          // Guardar competencia (texto libre) - permitir valores vacíos para poder limpiar el campo
          updateData.competencia = validatedData.competencia !== undefined ? validatedData.competencia : null
        } else {
          updateData[key] = validatedData[key as keyof typeof validatedData]
        }
      }
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

    const updatedQuestion = await prisma.examQuestion.update({
      where: { id: questionId },
      data: updateData,
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
    })

    return NextResponse.json(updatedQuestion)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating question:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  try {
    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { id, questionId } = await params

    // Verificar que el simulacro existe y es manual
    const exam = await prisma.exam.findUnique({
      where: { id },
      select: { isManualSimulacro: true, totalQuestions: true }
    })

    if (!exam || !exam.isManualSimulacro) {
      return NextResponse.json(
        { error: 'Simulacro no encontrado o no es manual' },
        { status: 404 }
      )
    }

    // Verificar que la pregunta existe
    const existingQuestion = await prisma.examQuestion.findFirst({
      where: {
        id: questionId,
        examId: id
      }
    })

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar la pregunta
    await prisma.examQuestion.delete({
      where: { id: questionId }
    })

    // Actualizar el total de preguntas
    await prisma.exam.update({
      where: { id },
      data: {
        totalQuestions: Math.max(0, (exam.totalQuestions || 0) - 1)
      }
    })

    return NextResponse.json({ message: 'Pregunta eliminada correctamente' })
  } catch (error) {
    console.error('Error deleting question:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

