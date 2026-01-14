import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const gate = await requireRole(['teacher_admin', 'school_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const schoolId = searchParams.get('schoolId')

    // Verificar que el simulacro existe y es manual
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        examQuestions: {
          include: {
            competency: {
              select: {
                id: true,
                name: true,
                displayName: true
              }
            }
          }
        }
      }
    })

    if (!exam || !exam.isManualSimulacro) {
      return NextResponse.json(
        { error: 'Simulacro no encontrado o no es manual' },
        { status: 404 }
      )
    }

    // Construir filtros para resultados
    const resultWhere: any = {
      examId: id,
      completedAt: { not: null } // Solo resultados completados
    }

    if (studentId) {
      resultWhere.userId = studentId
    }

    if (schoolId) {
      resultWhere.user = {
        schoolId: schoolId
      }
    }

    // Obtener todos los resultados del simulacro
    const results = await prisma.examResult.findMany({
      where: resultWhere,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            schoolId: true
          }
        },
        examQuestionAnswers: {
          include: {
            question: {
              select: {
                id: true,
                tema: true,
                subtema: true,
                componente: true,
                competencyId: true,
                difficultyLevel: true
              }
            }
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    // Calcular estadísticas agregadas
    const totalStudents = results.length
    const totalAttempts = results.length
    const averageScore = totalStudents > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalStudents)
      : 0
    const passRate = totalStudents > 0
      ? Math.round((results.filter(r => r.isPassed).length / totalStudents) * 100)
      : 0

    // Calcular resultados por metadatos (agregados de todos los estudiantes)
    const resultsByCompetency: Record<string, { correct: number; total: number; percentage: number }> = {}
    const resultsByComponente: Record<string, { correct: number; total: number; percentage: number }> = {}
    const resultsByTema: Record<string, { correct: number; total: number; percentage: number }> = {}
    const resultsBySubtema: Record<string, { correct: number; total: number; percentage: number }> = {}
    const resultsByDifficulty: Record<string, { correct: number; total: number; percentage: number }> = {}

    // Procesar cada resultado
    for (const result of results) {
      // Si el resultado ya tiene datos calculados, usarlos
      if (result.resultsByCompetency) {
        try {
          const compData = JSON.parse(result.resultsByCompetency)
          Object.keys(compData).forEach(compId => {
            if (!resultsByCompetency[compId]) {
              resultsByCompetency[compId] = { correct: 0, total: 0, percentage: 0 }
            }
            resultsByCompetency[compId].correct += compData[compId].correct || 0
            resultsByCompetency[compId].total += compData[compId].total || 0
          })
        } catch (e) {
          // Si no se puede parsear, calcular desde las respuestas
        }
      }

      if (result.resultsByComponente) {
        try {
          const compData = JSON.parse(result.resultsByComponente)
          Object.keys(compData).forEach(componente => {
            if (!resultsByComponente[componente]) {
              resultsByComponente[componente] = { correct: 0, total: 0, percentage: 0 }
            }
            resultsByComponente[componente].correct += compData[componente].correct || 0
            resultsByComponente[componente].total += compData[componente].total || 0
          })
        } catch (e) {
          // Si no se puede parsear, calcular desde las respuestas
        }
      }

      if (result.resultsByTema) {
        try {
          const temaData = JSON.parse(result.resultsByTema)
          Object.keys(temaData).forEach(tema => {
            if (!resultsByTema[tema]) {
              resultsByTema[tema] = { correct: 0, total: 0, percentage: 0 }
            }
            resultsByTema[tema].correct += temaData[tema].correct || 0
            resultsByTema[tema].total += temaData[tema].total || 0
          })
        } catch (e) {
          // Si no se puede parsear, calcular desde las respuestas
        }
      }

      if (result.resultsBySubtema) {
        try {
          const subtemaData = JSON.parse(result.resultsBySubtema)
          Object.keys(subtemaData).forEach(subtema => {
            if (!resultsBySubtema[subtema]) {
              resultsBySubtema[subtema] = { correct: 0, total: 0, percentage: 0 }
            }
            resultsBySubtema[subtema].correct += subtemaData[subtema].correct || 0
            resultsBySubtema[subtema].total += subtemaData[subtema].total || 0
          })
        } catch (e) {
          // Si no se puede parsear, calcular desde las respuestas
        }
      }

      // Calcular por dificultad desde las respuestas
      for (const answer of result.examQuestionAnswers) {
        if (answer.question) {
          const difficulty = answer.question.difficultyLevel || 'intermedio'
          if (!resultsByDifficulty[difficulty]) {
            resultsByDifficulty[difficulty] = { correct: 0, total: 0, percentage: 0 }
          }
          resultsByDifficulty[difficulty].total++
          if (answer.isCorrect) {
            resultsByDifficulty[difficulty].correct++
          }
        }
      }
    }

    // Calcular porcentajes finales
    Object.keys(resultsByCompetency).forEach(compId => {
      const data = resultsByCompetency[compId]
      data.percentage = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
    })

    Object.keys(resultsByComponente).forEach(componente => {
      const data = resultsByComponente[componente]
      data.percentage = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
    })

    Object.keys(resultsByTema).forEach(tema => {
      const data = resultsByTema[tema]
      data.percentage = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
    })

    Object.keys(resultsBySubtema).forEach(subtema => {
      const data = resultsBySubtema[subtema]
      data.percentage = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
    })

    Object.keys(resultsByDifficulty).forEach(difficulty => {
      const data = resultsByDifficulty[difficulty]
      data.percentage = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
    })

    // Preparar resultados individuales de estudiantes
    const studentResults = results.map(result => {
      let studentResultsByCompetency: Record<string, any> = {}
      let studentResultsByComponente: Record<string, any> = {}
      let studentResultsByTema: Record<string, any> = {}
      let studentResultsBySubtema: Record<string, any> = {}

      if (result.resultsByCompetency) {
        try {
          studentResultsByCompetency = JSON.parse(result.resultsByCompetency)
        } catch (e) {}
      }

      if (result.resultsByComponente) {
        try {
          studentResultsByComponente = JSON.parse(result.resultsByComponente)
        } catch (e) {}
      }

      if (result.resultsByTema) {
        try {
          studentResultsByTema = JSON.parse(result.resultsByTema)
        } catch (e) {}
      }

      if (result.resultsBySubtema) {
        try {
          studentResultsBySubtema = JSON.parse(result.resultsBySubtema)
        } catch (e) {}
      }

      return {
        userId: result.userId,
        userName: `${result.user.firstName} ${result.user.lastName}`,
        userEmail: result.user.email,
        score: result.score,
        isPassed: result.isPassed || false,
        completedAt: result.completedAt?.toISOString(),
        correctAnswers: result.correctAnswers,
        totalQuestions: result.totalQuestions,
        timeTakenMinutes: result.timeTakenMinutes,
        resultsByCompetency: studentResultsByCompetency,
        resultsByComponente: studentResultsByComponente,
        resultsByTema: studentResultsByTema,
        resultsBySubtema: studentResultsBySubtema
      }
    })

    return NextResponse.json({
      examId: exam.id,
      examTitle: exam.title,
      totalStudents,
      totalAttempts,
      averageScore,
      passRate,
      resultsByCompetency,
      resultsByComponente,
      resultsByTema,
      resultsBySubtema,
      resultsByDifficulty,
      studentResults
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

