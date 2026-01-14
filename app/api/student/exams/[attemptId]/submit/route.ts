import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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

    // Obtener las respuestas del estudiante
    const answers = await prisma.examQuestionAnswer.findMany({
      where: { examResultId: attemptId }
    })

    // Helper para validar respuestas según el tipo de pregunta
    const checkAnswer = (question: any, userAnswer: any): boolean => {
      if (!question.correctOption) return false

      switch (question.questionType) {
        case 'multiple_choice':
        case 'true_false':
          return userAnswer.selectedOption === question.correctOption
        
        case 'fill_blank':
          const correctAnswer = question.optionA || ''
          const userText = userAnswer.answerText || ''
          return userText.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
        
        case 'matching':
          // Para matching, parsear el JSON string si existe
          let matchingPairs: Record<string, string> = {}
          if (userAnswer.answerText && userAnswer.answerText.startsWith('{')) {
            try {
              matchingPairs = JSON.parse(userAnswer.answerText)
            } catch (e) {
              return false
            }
          } else {
            return false
          }
          
          // Validar cada par
          const pairs = [
            { key: 'A', option: question.optionA },
            { key: 'B', option: question.optionB },
            { key: 'C', option: question.optionC },
            { key: 'D', option: question.optionD }
          ].filter(p => p.option)
          
          for (const pair of pairs) {
            const separators = ['|', '→', '->']
            let separator: string | null = null
            for (const sep of separators) {
              if (pair.option?.includes(sep)) {
                separator = sep
                break
              }
            }
            if (!separator) continue
            
            const [leftElement, correctRight] = pair.option.split(separator).map(s => s.trim())
            const userRight = matchingPairs[leftElement]
            if (!userRight || userRight.toLowerCase().trim() !== correctRight.toLowerCase().trim()) {
              return false
            }
          }
          return true
        
        case 'essay':
          // Los ensayos no tienen respuesta correcta única, se evalúan manualmente
          // Por ahora, se considera "correcto" si hay respuesta
          return !!(userAnswer.answerText && userAnswer.answerText.trim().length > 0)
        
        default:
          return false
      }
    }

    // Calcular puntuación
    let correctAnswers = 0
    let incorrectAnswers = 0

    // Para simulacros manuales: calcular resultados por metadatos
    const isManualSimulacro = result.exam.isManualSimulacro
    const resultsByTema: Record<string, { correct: number; total: number }> = {}
    const resultsBySubtema: Record<string, { correct: number; total: number }> = {}
    const resultsByComponente: Record<string, { correct: number; total: number }> = {}
    const resultsByCompetency: Record<string, { correct: number; total: number }> = {}

    for (const answer of answers) {
      // Buscar la pregunta correspondiente
      const question = result.exam.examQuestions.find(q => q.id === answer.questionId)
      if (question) {
        const isCorrect = checkAnswer(question, answer)
        if (isCorrect) {
          correctAnswers++
          // Actualizar isCorrect en la respuesta
          await prisma.examQuestionAnswer.update({
            where: { id: answer.id },
            data: { isCorrect: true }
          })
        } else {
          incorrectAnswers++
          // Actualizar isCorrect en la respuesta
          await prisma.examQuestionAnswer.update({
            where: { id: answer.id },
            data: { isCorrect: false }
          })
        }

        // Si es simulacro manual, calcular por metadatos
        if (isManualSimulacro) {
          // Por tema
          if (question.tema) {
            if (!resultsByTema[question.tema]) {
              resultsByTema[question.tema] = { correct: 0, total: 0 }
            }
            resultsByTema[question.tema].total++
            if (isCorrect) {
              resultsByTema[question.tema].correct++
            }
          }

          // Por subtema
          if (question.subtema) {
            if (!resultsBySubtema[question.subtema]) {
              resultsBySubtema[question.subtema] = { correct: 0, total: 0 }
            }
            resultsBySubtema[question.subtema].total++
            if (isCorrect) {
              resultsBySubtema[question.subtema].correct++
            }
          }

          // Por componente
          if (question.componente) {
            if (!resultsByComponente[question.componente]) {
              resultsByComponente[question.componente] = { correct: 0, total: 0 }
            }
            resultsByComponente[question.componente].total++
            if (isCorrect) {
              resultsByComponente[question.componente].correct++
            }
          }

          // Por competencia (si tiene competencyId directo o viene del exam)
          const competencyId = question.competencyId || result.exam.competencyId
          if (competencyId) {
            if (!resultsByCompetency[competencyId]) {
              resultsByCompetency[competencyId] = { correct: 0, total: 0 }
            }
            resultsByCompetency[competencyId].total++
            if (isCorrect) {
              resultsByCompetency[competencyId].correct++
            }
          }
        }
      }
    }

    const totalQuestions = result.exam.examQuestions.length
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
    const isPassed = score >= (result.exam.passingScore || 70) // Usar passingScore del examen

    // Calcular tiempo transcurrido (en minutos)
    const elapsedMinutes = Math.floor((Date.now() - result.startedAt.getTime()) / 60000)
    
    // Limitar el tiempo registrado al tiempo límite del examen
    // Si el estudiante sale y vuelve, el tiempo máximo será el tiempo estimado del examen
    const timeLimitMinutes = result.exam.timeLimitMinutes || 60 // Default 60 minutos si no está definido
    const timeTakenMinutes = Math.min(elapsedMinutes, timeLimitMinutes)

    // Preparar datos de actualización
    const updateData: any = {
      score,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      isPassed,
      completedAt: new Date(),
      timeTakenMinutes
    }

    // Si es simulacro manual, agregar resultados por metadatos
    if (isManualSimulacro) {
      // Convertir resultados a JSON strings
      if (Object.keys(resultsByTema).length > 0) {
        updateData.resultsByTema = JSON.stringify(resultsByTema)
      }
      if (Object.keys(resultsBySubtema).length > 0) {
        updateData.resultsBySubtema = JSON.stringify(resultsBySubtema)
      }
      if (Object.keys(resultsByComponente).length > 0) {
        updateData.resultsByComponente = JSON.stringify(resultsByComponente)
      }
      if (Object.keys(resultsByCompetency).length > 0) {
        // Convertir a formato compatible con resultsByCompetency existente
        const competencyResults: Record<string, { correct: number; total: number; percentage: number }> = {}
        Object.keys(resultsByCompetency).forEach(compId => {
          const data = resultsByCompetency[compId]
          competencyResults[compId] = {
            correct: data.correct,
            total: data.total,
            percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
          }
        })
        updateData.resultsByCompetency = JSON.stringify(competencyResults)
      }
    }

    // Actualizar el resultado del examen
    const updatedResult = await prisma.examResult.update({
      where: { id: attemptId },
      data: updateData
    })

    console.log(`[Exam Submit] Examen completado para usuario ${userId}:`, {
      examId: result.examId,
      score,
      isPassed,
      completedAt: updatedResult.completedAt
    })

    // Crear notificación de resultado del examen
    try {
      const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 días
      
      if (!isPassed) {
        // Notificación de examen fallido
        await prisma.notification.create({
          data: {
            userId,
            type: 'exam_failed',
            title: 'Examen No Aprobado',
            message: `El examen "${result.exam.title}" no fue aprobado. Calificación: ${score}% (${correctAnswers}/${totalQuestions}). Puedes intentar nuevamente.`,
            actionUrl: `/estudiante/examen/${result.examId}`,
            expiresAt,
            metadata: JSON.stringify({ examId: result.examId, examTitle: result.exam.title, score, totalQuestions, correctAnswers, percentage: score }),
          }
        })
      } else {
        // Notificación de examen aprobado
        await prisma.notification.create({
          data: {
            userId,
            type: 'exam_result',
            title: '¡Examen Aprobado! 🎉',
            message: `Felicitaciones! Has aprobado el examen "${result.exam.title}" con una calificación de ${score}% (${correctAnswers}/${totalQuestions}).`,
            actionUrl: `/estudiante/examen/${result.examId}`,
            expiresAt,
            metadata: JSON.stringify({ examId: result.examId, examTitle: result.exam.title, score, totalQuestions, correctAnswers, percentage: score }),
          }
        })
      }
    } catch (notifyError) {
      console.error('[Exam Submit] Error creating exam result notification:', notifyError)
    }

    // Verificar logros después de completar el examen
    let unlockedAchievements: string[] = []
    try {
      // Esperar un momento para asegurar que la transacción se haya completado
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Verificar que el examen se guardó correctamente
      const verifyExam = await prisma.examResult.findUnique({
        where: { id: attemptId },
        select: { completedAt: true, score: true }
      })
      console.log(`[Exam Submit] Verificando examen guardado:`, verifyExam)
      
      unlockedAchievements = await AchievementService.checkAndUnlockAllAchievements(userId)
      console.log(`[Exam Submit] Logros desbloqueados:`, unlockedAchievements)
    } catch (error) {
      console.error('[Exam Submit] Error checking achievements:', error)
    }

    return NextResponse.json({
      resultId: updatedResult.id,
      score,
      correctAnswers,
      incorrectAnswers,
      totalQuestions,
      isPassed,
      timeTakenMinutes: updatedResult.timeTakenMinutes,
      unlockedAchievements
    })

  } catch (error) {
    console.error('Error submitting exam:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}