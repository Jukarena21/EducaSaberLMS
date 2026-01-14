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
    const userId = session.user.id
    const { questionId, selectedOptionId, answerText } = await request.json()
    
    // answerText puede ser string (para fill_blank, essay) o JSON string (para matching)
    let processedAnswerText = answerText
    if (answerText && typeof answerText === 'object') {
      processedAnswerText = JSON.stringify(answerText)
    }

    // Verificar que el resultado de examen existe y pertenece al usuario
    const result = await prisma.examResult.findFirst({
      where: {
        id: attemptId,
        userId
      }
    })

    if (!result) {
      return NextResponse.json({ error: 'Resultado de examen no encontrado' }, { status: 404 })
    }

    // Buscar o crear la respuesta
    const existingAnswer = await prisma.examQuestionAnswer.findFirst({
      where: {
        examResultId: attemptId,
        questionId
      }
    })

    if (existingAnswer) {
      // Actualizar respuesta existente
      await prisma.examQuestionAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          selectedOption: selectedOptionId || null,
          answerText: processedAnswerText || null,
          isCorrect: false, // Se calculará al final
          timeSpentSeconds: 0 // Se puede calcular si es necesario
        }
      })
    } else {
      // Crear nueva respuesta
      await prisma.examQuestionAnswer.create({
        data: {
          examResultId: attemptId,
          questionId,
          selectedOption: selectedOptionId || null,
          answerText: processedAnswerText || null,
          isCorrect: false, // Se calculará al final
          timeSpentSeconds: 0,
          userId
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error saving answer:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}