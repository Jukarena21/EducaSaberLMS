import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { lessonId } = await params
    const userId = session.user.id

    // Verificar que el estudiante tiene acceso a esta lección
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        moduleLessons: {
          some: {
            module: {
              courseModules: {
                some: {
                  course: {
                    courseEnrollments: {
                      some: {
                        userId,
                        isActive: true
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

    if (!lesson) {
      return NextResponse.json({ error: 'Lección no encontrada o sin acceso' }, { status: 404 })
    }

    // Obtener las preguntas de la lección (excluyendo ensayos y respetando usage)
    const questions = await prisma.lessonQuestion.findMany({
      where: {
        lessonId,
        // Solo preguntas pensadas para lecciones o para ambos contextos
        usage: {
          in: ['lesson', 'both']
        },
        questionType: {
          not: 'essay' // Excluir preguntas de ensayo
        }
      } as any
    })

    // Log para debugging
    console.log(`[Questions API] Lección ${lessonId}: ${questions.length} preguntas encontradas`)
    const typeCounts = questions.reduce((acc, q) => {
      acc[q.questionType] = (acc[q.questionType] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    console.log(`[Questions API] Tipos de preguntas:`, typeCounts)

    // Aleatorizar el orden de las preguntas usando Fisher-Yates shuffle
    const shuffledQuestions = [...questions]
    for (let i = shuffledQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]]
    }

    console.log(`[Questions API] Preguntas aleatorizadas. Primeras 5 tipos:`, shuffledQuestions.slice(0, 5).map(q => q.questionType))

    return NextResponse.json(shuffledQuestions)

  } catch (error) {
    console.error('Error fetching lesson questions:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
