import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { upsertExamQuestionAnswer } from '@/lib/examAnswerPersistence'

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
    const { questionId, selectedOptionId, answerText, timeSpentSeconds } =
      await request.json()

    if (!questionId) {
      return NextResponse.json({ error: 'questionId requerido' }, { status: 400 })
    }

    const result = await prisma.examResult.findFirst({
      where: { id: attemptId, userId },
    })

    if (!result) {
      return NextResponse.json({ error: 'Resultado de examen no encontrado' }, { status: 404 })
    }

    if (result.completedAt) {
      return NextResponse.json({ error: 'Este examen ya fue enviado' }, { status: 400 })
    }

    let processedAnswerText = answerText
    if (answerText && typeof answerText === 'object') {
      processedAnswerText = JSON.stringify(answerText)
    }

    if (!selectedOptionId && !processedAnswerText) {
      return NextResponse.json({ error: 'Respuesta vacía' }, { status: 400 })
    }

    await upsertExamQuestionAnswer(attemptId, userId, {
      questionId,
      selectedOptionId: selectedOptionId || undefined,
      answerText: processedAnswerText || undefined,
      timeSpentSeconds:
        typeof timeSpentSeconds === 'number' ? timeSpentSeconds : undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving answer:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
