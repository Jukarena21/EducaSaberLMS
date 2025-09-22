import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { resultId } = await params
    const userId = session.user.id

    // Obtener el resultado del examen con respuestas detalladas
    const result = await prisma.examResult.findFirst({
      where: {
        id: resultId,
        userId
      },
      include: {
        exam: {
          include: {
            competency: true,
            course: true,
            examQuestions: {
              include: {
                lesson: {
                  include: {
                    competency: true
                  }
                }
              },
              orderBy: {
                orderIndex: 'asc'
              }
            }
          }
        },
        examQuestionAnswers: {
          include: {
            question: {
              include: {
                lesson: {
                  include: {
                    competency: true
                  }
                }
              }
            }
          },
          orderBy: {
            question: {
              orderIndex: 'asc'
            }
          }
        }
      }
    })

    if (!result) {
      return NextResponse.json({ error: 'Resultado no encontrado' }, { status: 404 })
    }

    // Obtener desglose por competencia si es posible
    let competencyBreakdown = null
    try {
      const competencyStats = await prisma.$queryRaw`
        SELECT 
          c.name as competency,
          COUNT(eq.id) as total,
          SUM(CASE WHEN ea.selectedOptionId = qo.id AND qo.isCorrect = 1 THEN 1 ELSE 0 END) as correct
        FROM ExamResult er
        JOIN Exam e ON er.examId = e.id
        JOIN ExamQuestion eq ON e.id = eq.examId
        JOIN Question q ON eq.questionId = q.id
        JOIN Lesson l ON q.lessonId = l.id
        JOIN ModuleLesson ml ON l.id = ml.lessonId
        JOIN Module m ON ml.moduleId = m.id
        JOIN Competency c ON m.competencyId = c.id
        LEFT JOIN ExamAnswer ea ON er.id = ea.attemptId AND q.id = ea.questionId
        LEFT JOIN QuestionOption qo ON ea.selectedOptionId = qo.id
        WHERE er.id = ${resultId}
        GROUP BY c.id, c.name
        HAVING total > 0
      ` as Array<{ competency: string; total: number; correct: number }>

      competencyBreakdown = competencyStats.map(stat => ({
        competency: stat.competency,
        total: Number(stat.total),
        correct: Number(stat.correct),
        percentage: Math.round((Number(stat.correct) / Number(stat.total)) * 100)
      }))
    } catch (error) {
      console.error('Error calculating competency breakdown:', error)
      // Si hay error, simplemente no incluir el desglose
    }

    // Preparar respuestas detalladas con retroalimentación
    const detailedAnswers = result.examQuestionAnswers.map(answer => {
      const question = result.exam.examQuestions.find(q => q.id === answer.questionId)
      if (!question) return null

      return {
        id: answer.id,
        questionId: answer.questionId,
        questionText: question.questionText,
        questionImage: question.questionImage,
        questionType: question.questionType,
        options: {
          A: question.optionA,
          B: question.optionB,
          C: question.optionC,
          D: question.optionD,
          AImage: question.optionAImage,
          BImage: question.optionBImage,
          CImage: question.optionCImage,
          DImage: question.optionDImage,
        },
        correctOption: question.correctOption,
        explanation: question.explanation,
        explanationImage: question.explanationImage,
        selectedOption: answer.selectedOption,
        isCorrect: answer.isCorrect,
        timeSpentSeconds: answer.timeSpentSeconds,
        difficultyLevel: question.difficultyLevel,
        competency: question.lesson?.competency?.displayName || 'General',
        lessonTitle: question.lesson?.title || 'Sin lección asociada',
        lessonUrl: question.lessonUrl
      }
    }).filter(Boolean)

    return NextResponse.json({
      id: result.id,
      score: result.score,
      passed: result.passed,
      correctAnswers: result.correctAnswers,
      totalQuestions: result.totalQuestions,
      timeSpentMinutes: result.timeSpentMinutes,
      completedAt: result.completedAt,
      exam: {
        id: result.exam.id,
        title: result.exam.title,
        description: result.exam.description,
        examType: result.exam.examType,
        passingScore: result.exam.passingScore,
        timeLimitMinutes: result.exam.timeLimitMinutes,
        competency: result.exam.competency?.name || 'General',
        course: result.exam.course?.title || 'General'
      },
      competencyBreakdown,
      detailedAnswers
    })

  } catch (error) {
    console.error('Error fetching exam result:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
