import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
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

    // Obtener el resultado de examen
    const result = await prisma.examResult.findFirst({
      where: {
        id: attemptId,
        userId
      },
      include: {
        exam: {
          include: {
            examQuestions: true
          }
        }
      }
    })

    if (!result) {
      return NextResponse.json({ error: 'Resultado de examen no encontrado' }, { status: 404 })
    }

    if (!result.exam) {
      return NextResponse.json({ error: 'Examen asociado no encontrado' }, { status: 404 })
    }

    if (!result.exam.examQuestions || result.exam.examQuestions.length === 0) {
      return NextResponse.json({ error: 'El examen no tiene preguntas asignadas' }, { status: 400 })
    }

    // Obtener respuestas existentes
    const existingAnswers = await prisma.examQuestionAnswer.findMany({
      where: { examResultId: attemptId },
      select: {
        questionId: true,
        selectedOption: true,
        answerText: true,
        isCorrect: true
      }
    })

    const answersMap = existingAnswers.reduce((acc, answer) => {
      // Para matching, parsear el JSON string si existe
      let parsedAnswer: any = answer.selectedOption || answer.answerText
      if (answer.answerText && answer.answerText.startsWith('{')) {
        try {
          parsedAnswer = JSON.parse(answer.answerText)
        } catch (e) {
          parsedAnswer = answer.answerText
        }
      }
      
      acc[answer.questionId] = {
        optionId: answer.selectedOption,
        text: answer.answerText,
        answer: parsedAnswer,
        isCorrect: answer.isCorrect
      }
      return acc
    }, {} as Record<string, any>)

    // Preparar preguntas para el examen (sin respuestas correctas)
    const questions = result.exam.examQuestions.map(eq => ({
      id: eq.id,
      text: eq.questionText,
      type: eq.questionType,
      difficultyLevel: eq.difficultyLevel,
      imageUrl: eq.questionImage,
      questionImage: eq.questionImage,
      questionType: eq.questionType,
      optionA: eq.optionA,
      optionB: eq.optionB,
      optionC: eq.optionC,
      optionD: eq.optionD,
      optionAImage: eq.optionAImage,
      optionBImage: eq.optionBImage,
      optionCImage: eq.optionCImage,
      optionDImage: eq.optionDImage,
      options: [
        { id: 'A', text: eq.optionA, isCorrect: false },
        { id: 'B', text: eq.optionB, isCorrect: false },
        { id: 'C', text: eq.optionC, isCorrect: false },
        { id: 'D', text: eq.optionD, isCorrect: false }
      ],
      competency: 'General'
    }))

    return NextResponse.json({
      attemptId: result.id,
      exam: {
        id: result.exam.id,
        title: result.exam.title,
        description: result.exam.description,
        timeLimitMinutes: result.exam.timeLimitMinutes,
        totalQuestions: questions.length
      },
      questions,
      startedAt: result.startedAt || result.createdAt,
      existingAnswers: answersMap
    })

  } catch (error) {
    console.error('Error fetching exam attempt:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
