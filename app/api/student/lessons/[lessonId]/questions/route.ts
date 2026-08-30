import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { seededShuffle } from '@/lib/questions/shuffle'

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
                        userId
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
      } as any,
      orderBy: { orderIndex: 'asc' }
    })

    // El orden se baraja por estudiante, pero de forma determinista: si cambiara
    // en cada carga, al volver a la lección las respuestas guardadas aparecerían
    // en preguntas distintas de las que el estudiante vio.
    const shuffledQuestions = seededShuffle(questions, `${userId}:${lessonId}`)

    return NextResponse.json(shuffledQuestions)

  } catch (error) {
    console.error('Error fetching lesson questions:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
