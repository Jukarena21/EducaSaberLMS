import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()

    // Obtener exámenes disponibles para el estudiante
    const availableExams = await prisma.exam.findMany({
      where: {
        isPublished: true,
        OR: [
          { openDate: null },
          { openDate: { lte: now } }
        ],
        OR: [
          { closeDate: null },
          { closeDate: { gte: now } }
        ]
      },
      include: {
        competency: true,
        course: true,
        examQuestions: true,
        examResults: {
          where: { userId },
          orderBy: { completedAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Filtrar exámenes que el estudiante puede tomar
    const exams = availableExams.map(exam => {
      const lastResult = exam.examResults[0]
      const canRetake = !lastResult || exam.allowRetake || false
      
      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        examType: exam.examType,
        competency: exam.competency?.name || 'General',
        course: exam.course?.title || 'General',
        timeLimitMinutes: exam.timeLimitMinutes,
        totalQuestions: exam.examQuestions.length,
        passingScore: exam.passingScore,
        openDate: exam.openDate,
        closeDate: exam.closeDate,
        lastAttempt: lastResult ? {
          score: lastResult.score,
          passed: lastResult.passed,
          completedAt: lastResult.completedAt
        } : null,
        canRetake,
        status: lastResult ? (lastResult.passed ? 'passed' : 'failed') : 'not_attempted'
      }
    })

    return NextResponse.json(exams)

  } catch (error) {
    console.error('Error fetching available exams:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
