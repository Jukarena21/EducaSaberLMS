import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/notificationService'
import { AchievementService } from '@/lib/achievementService'

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

    // Verificar que el intento pertenece al usuario y está en progreso
    const attempt = await prisma.examAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
        status: 'in_progress'
      },
      include: {
        exam: true,
        examAnswers: {
          include: {
            question: {
              include: {
                questionOptions: true
              }
            }
          }
        }
      }
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Intento de examen no encontrado' }, { status: 404 })
    }

    const now = new Date()
    const timeElapsed = now.getTime() - attempt.startedAt.getTime()
    const timeLimitMs = (attempt.timeLimitMinutes || 60) * 60 * 1000

    // Calcular puntaje
    let correctAnswers = 0
    let totalQuestions = attempt.examAnswers.length

    for (const answer of attempt.examAnswers) {
      if (answer.question.type === 'multiple_choice' && answer.selectedOptionId) {
        const selectedOption = answer.question.questionOptions.find(
          opt => opt.id === answer.selectedOptionId
        )
        if (selectedOption?.isCorrect) {
          correctAnswers++
        }
      } else if (answer.question.type === 'true_false' && answer.selectedOptionId) {
        const selectedOption = answer.question.questionOptions.find(
          opt => opt.id === answer.selectedOptionId
        )
        if (selectedOption?.isCorrect) {
          correctAnswers++
        }
      } else if (answer.question.type === 'essay') {
        // Para ensayos, asumimos que si hay texto, es una respuesta válida
        if (answer.answerText && answer.answerText.trim().length > 0) {
          correctAnswers++
        }
      }
    }

    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
    const passed = score >= (attempt.exam.passingScore || 70)

    // Actualizar el intento como completado
    await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'completed',
        completedAt: now,
        score,
        timeSpentMinutes: Math.round(timeElapsed / (60 * 1000))
      }
    })

    // Crear resultado del examen
    const result = await prisma.examResult.create({
      data: {
        userId,
        examId: attempt.examId,
        score,
        passed,
        timeSpentMinutes: Math.round(timeElapsed / (60 * 1000)),
        totalQuestions,
        correctAnswers,
        completedAt: now
      }
    })

    // Crear notificación de resultado del examen
    try {
      await NotificationService.createExamResultNotification(
        userId,
        attempt.exam.title,
        correctAnswers,
        totalQuestions,
        result.id
      );
    } catch (notificationError) {
      console.error('Error creating exam result notification:', notificationError);
      // No fallar el envío por error en notificación
    }

    // Verificar logros relacionados con exámenes
    try {
      await AchievementService.checkAndUnlockAchievements(
        userId, 
        'exam_completed',
        { 
          examId: attempt.examId,
          examTitle: attempt.exam.title,
          score: score,
          passed: passed,
          correctAnswers: correctAnswers,
          totalQuestions: totalQuestions
        }
      );
    } catch (achievementError) {
      console.error('Error checking achievements:', achievementError);
      // No fallar el envío por error en logros
    }

    return NextResponse.json({
      resultId: result.id,
      score,
      passed,
      correctAnswers,
      totalQuestions,
      timeSpentMinutes: Math.round(timeElapsed / (60 * 1000)),
      completedAt: now
    })

  } catch (error) {
    console.error('Error submitting exam:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
