import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { examId } = await request.json()
    if (!examId) {
      return NextResponse.json({ error: 'ID de examen requerido' }, { status: 400 })
    }

    const userId = session.user.id

    // Verificar que el examen existe y está disponible
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        examQuestions: {
          include: {
            question: {
              include: {
                questionOptions: true,
                lesson: {
                  include: {
                    modules: {
                      include: {
                        competency: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!exam) {
      return NextResponse.json({ error: 'Examen no encontrado' }, { status: 404 })
    }

    // Verificar que el examen está publicado y en rango de fechas
    const now = new Date()
    if (!exam.isPublished) {
      return NextResponse.json({ error: 'Examen no disponible' }, { status: 400 })
    }

    if (exam.openDate && exam.openDate > now) {
      return NextResponse.json({ error: 'Examen aún no está abierto' }, { status: 400 })
    }

    if (exam.closeDate && exam.closeDate < now) {
      return NextResponse.json({ error: 'Examen ya cerró' }, { status: 400 })
    }

    // Verificar si ya existe un intento en progreso
    const existingAttempt = await prisma.examAttempt.findFirst({
      where: {
        userId,
        examId,
        status: 'in_progress'
      }
    })

    if (existingAttempt) {
      return NextResponse.json({ 
        error: 'Ya tienes un intento en progreso',
        attemptId: existingAttempt.id
      }, { status: 400 })
    }

    // Crear nuevo intento de examen
    const attempt = await prisma.examAttempt.create({
      data: {
        userId,
        examId,
        status: 'in_progress',
        startedAt: new Date(),
        timeLimitMinutes: exam.timeLimitMinutes || 60
      }
    })

    // Preparar preguntas para el examen (sin respuestas correctas)
    const questions = exam.examQuestions.map(eq => ({
      id: eq.question.id,
      text: eq.question.text,
      type: eq.question.type,
      difficultyLevel: eq.question.difficultyLevel,
      imageUrl: eq.question.imageUrl,
      options: eq.question.questionOptions.map(opt => ({
        id: opt.id,
        text: opt.text,
        isCorrect: false // No enviar la respuesta correcta
      })),
      competency: eq.question.lesson?.modules?.[0]?.competency?.name || 'Sin competencia'
    }))

    return NextResponse.json({
      attemptId: attempt.id,
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        timeLimitMinutes: exam.timeLimitMinutes,
        totalQuestions: questions.length
      },
      questions,
      startedAt: attempt.startedAt
    })

  } catch (error) {
    console.error('Error starting exam:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
