import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const questionSchema = z.object({
  contextText: z.string().min(1, 'El enunciado es requerido'),
  questionText: z.string().min(1, 'El texto de la pregunta es requerido'),
  questionImage: z.string().optional(),
  questionType: z.enum(['multiple_choice']).default('multiple_choice'), // Solo opción múltiple para simulacros manuales
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1, 'La opción C es requerida para simulacros ICFES'),
  optionD: z.string().min(1, 'La opción D es requerida para simulacros ICFES'),
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
  // Metadatos específicos
  tema: z.string().min(1, 'El tema es requerido'),
  subtema: z.string().min(1, 'El subtema es requerido'),
  componente: z.string().min(1, 'El componente es requerido'),
  competencia: z.string().optional(),
  competencyId: z.string().min(1, 'La competencia es requerida'),
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

    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { id } = await params

    // Verificar que el simulacro existe y es manual
    const exam = await prisma.exam.findUnique({
      where: { id },
      select: { isManualSimulacro: true }
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

    // Consulta usando select explícito para evitar errores si el campo competencia no existe aún
    // Una vez que se ejecute la migración de la BD, se puede cambiar de vuelta a include
    const questions = await prisma.examQuestion.findMany({
      where: { examId: id },
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
      },
      orderBy: {
        orderIndex: 'asc'
      }
    })

    // Agregar competencia como null (el campo se agregará cuando se ejecute la migración)
    const questionsWithCompetencia = questions.map(q => ({
      ...q,
      competencia: null // Temporalmente null hasta que se ejecute la migración
    }))

    return NextResponse.json(questionsWithCompetencia)
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const validatedData = questionSchema.parse(body)

    // Verificar que el simulacro existe y es manual
    const exam = await prisma.exam.findUnique({
      where: { id },
      select: { isManualSimulacro: true, totalQuestions: true }
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

    // Crear la pregunta (siempre opción múltiple para simulacros manuales)
    const question = await prisma.examQuestion.create({
      data: {
        examId: id,
        // Usamos lessonUrl como campo interno para almacenar el enunciado estilo ICFES
        lessonUrl: validatedData.contextText,
        questionText: validatedData.questionText,
        questionImage: validatedData.questionImage || null,
        questionType: 'multiple_choice', // Forzar siempre opción múltiple
        optionA: validatedData.optionA,
        optionB: validatedData.optionB,
        optionC: validatedData.optionC || '',
        optionD: validatedData.optionD || '',
        optionAImage: validatedData.optionAImage || null,
        optionBImage: validatedData.optionBImage || null,
        optionCImage: validatedData.optionCImage || null,
        optionDImage: validatedData.optionDImage || null,
        correctOption: validatedData.correctOption,
        explanation: validatedData.explanation || null,
        explanationImage: validatedData.explanationImage || null,
        difficultyLevel: validatedData.difficultyLevel,
        points: validatedData.points,
        orderIndex: validatedData.orderIndex,
        // Metadatos específicos
        tema: validatedData.tema,
        subtema: validatedData.subtema,
        componente: validatedData.componente,
        competencia: validatedData.competencia || null,
        competencyId: validatedData.competencyId,
      },
      include: {
        competency: {
          select: {
            id: true,
            name: true,
            displayName: true
          }
        }
      }
    })

    // Actualizar el total de preguntas del simulacro
    await prisma.exam.update({
      where: { id },
      data: {
        totalQuestions: (exam.totalQuestions || 0) + 1
      }
    })

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating question:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

