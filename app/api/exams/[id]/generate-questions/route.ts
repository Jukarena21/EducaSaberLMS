import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Obtener el examen
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            courseModules: {
              include: {
                module: {
                  include: {
                    moduleLessons: {
                      include: {
                        lesson: {
                          include: {
                            lessonQuestions: true
                          }
                        }
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

    // Eliminar preguntas existentes del examen
    await prisma.examQuestion.deleteMany({
      where: { examId: id }
    })

    let totalQuestions = 0
    const questionsPerModule = exam.questionsPerModule

    // Obtener módulos incluidos
    const includedModules = exam.includedModules ? JSON.parse(exam.includedModules) : []
    
    if (includedModules.length === 0) {
      return NextResponse.json(
        { error: 'No hay módulos seleccionados para el examen' },
        { status: 400 }
      )
    }

    // Para cada módulo incluido, seleccionar preguntas aleatorias
    for (const moduleId of includedModules) {
      // Encontrar el módulo en el curso
      const courseModule = exam.course?.courseModules.find(cm => cm.moduleId === moduleId)
      
      if (!courseModule) {
        continue
      }

      const module = courseModule.module
      
      // Obtener todas las preguntas de las lecciones del módulo
      const allQuestions = []
      for (const moduleLesson of module.moduleLessons) {
        allQuestions.push(...moduleLesson.lesson.lessonQuestions)
      }

      // Seleccionar preguntas aleatorias
      const shuffled = allQuestions.sort(() => 0.5 - Math.random())
      const selectedQuestions = shuffled.slice(0, questionsPerModule)

      // Crear preguntas del examen
      for (let i = 0; i < selectedQuestions.length; i++) {
        const question = selectedQuestions[i]
        
        await prisma.examQuestion.create({
          data: {
            examId: id,
            questionText: question.questionText,
            questionImage: question.questionImage,
            questionType: question.questionType,
            optionA: question.optionA,
            optionB: question.optionB,
            optionC: question.optionC,
            optionD: question.optionD,
            optionAImage: question.optionAImage,
            optionBImage: question.optionBImage,
            optionCImage: question.optionCImage,
            optionDImage: question.optionDImage,
            correctOption: question.correctOption,
            explanation: question.explanation,
            explanationImage: question.explanationImage,
            difficultyLevel: question.difficultyLevel,
            points: 1,
            orderIndex: totalQuestions + i + 1,
            timeLimit: question.timeLimit,
            lessonId: question.lessonId,
            lessonUrl: `/leccion/${question.lessonId}`
          }
        })
      }

      totalQuestions += selectedQuestions.length
    }

    // Actualizar el total de preguntas del examen
    await prisma.exam.update({
      where: { id },
      data: {
        totalQuestions: totalQuestions
      }
    })

    return NextResponse.json({
      message: 'Preguntas generadas correctamente',
      totalQuestions: totalQuestions
    })
  } catch (error) {
    console.error('Error al generar preguntas del examen:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
