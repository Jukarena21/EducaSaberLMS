import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { attemptId } = await params
    const { questionId, selectedOptionId, answerText } = await request.json()
    const userId = session.user.id

    if (!questionId) {
      return NextResponse.json({ error: 'ID de pregunta requerido' }, { status: 400 })
    }

    // Verificar que el intento pertenece al usuario y está en progreso
    const attempt = await prisma.examAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
        status: 'in_progress'
      }
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Intento de examen no encontrado' }, { status: 404 })
    }

    // Verificar que no se ha excedido el tiempo límite
    const now = new Date()
    const timeElapsed = now.getTime() - attempt.startedAt.getTime()
    const timeLimitMs = (attempt.timeLimitMinutes || 60) * 60 * 1000

    if (timeElapsed > timeLimitMs) {
      return NextResponse.json({ error: 'Tiempo límite excedido' }, { status: 400 })
    }

    // Guardar o actualizar la respuesta
    const existingAnswer = await prisma.examAnswer.findFirst({
      where: {
        attemptId,
        questionId
      }
    })

    if (existingAnswer) {
      // Actualizar respuesta existente
      await prisma.examAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          selectedOptionId: selectedOptionId || null,
          answerText: answerText || null,
          answeredAt: new Date()
        }
      })
    } else {
      // Crear nueva respuesta
      await prisma.examAnswer.create({
        data: {
          attemptId,
          questionId,
          selectedOptionId: selectedOptionId || null,
          answerText: answerText || null,
          answeredAt: new Date()
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error saving answer:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
