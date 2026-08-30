import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  gradeLessonAnswer,
  parseLessonAnswer,
  serializeLessonAnswer,
} from '@/lib/questions/lessonAnswers'

async function resolveStudent(lessonId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'student') {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  }

  const userId = session.user.id

  const enrollment = await prisma.courseEnrollment.findFirst({
    where: {
      userId,
      course: {
        courseModules: {
          some: {
            module: {
              moduleLessons: {
                some: { lessonId },
              },
            },
          },
        },
      },
    },
  })

  if (!enrollment) {
    return { error: NextResponse.json({ error: 'Sin acceso a esta lección' }, { status: 403 }) }
  }

  return { userId }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params
    const { userId, error } = await resolveStudent(lessonId)
    if (error) return error

    const answers = await prisma.studentLessonAnswer.findMany({
      where: { userId, lessonId },
    })

    return NextResponse.json(
      answers.map((entry) => ({
        questionId: entry.questionId,
        answer: parseLessonAnswer(entry.answer),
        isCorrect: entry.isCorrect,
      }))
    )
  } catch (err) {
    console.error('Error fetching lesson answers:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params
    const { userId, error } = await resolveStudent(lessonId)
    if (error) return error

    const body = await request.json()
    const questionId = typeof body?.questionId === 'string' ? body.questionId : ''
    if (!questionId) {
      return NextResponse.json({ error: 'Falta la pregunta' }, { status: 400 })
    }

    const question = await prisma.lessonQuestion.findFirst({
      where: { id: questionId, lessonId },
    })

    if (!question) {
      return NextResponse.json({ error: 'Pregunta no encontrada en la lección' }, { status: 404 })
    }

    const answer = body?.answer
    const serialized = serializeLessonAnswer(answer)
    const isCorrect = gradeLessonAnswer(question, answer)

    await prisma.studentLessonAnswer.upsert({
      where: { userId_questionId: { userId, questionId } },
      create: { userId, lessonId, questionId, answer: serialized, isCorrect },
      update: { answer: serialized, isCorrect },
    })

    return NextResponse.json({ success: true, isCorrect })
  } catch (err) {
    console.error('Error saving lesson answer:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params
    const { userId, error } = await resolveStudent(lessonId)
    if (error) return error

    await prisma.studentLessonAnswer.deleteMany({ where: { userId, lessonId } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error clearing lesson answers:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
