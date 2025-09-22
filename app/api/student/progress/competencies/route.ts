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

    // Obtener todas las competencias
    const competencies = await prisma.competency.findMany({
      orderBy: { orderIndex: 'asc' }
    })

    // Obtener progreso de lecciones del estudiante
    const lessonProgress = await prisma.studentLessonProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          include: {
            modules: {
              include: {
                competency: true
              }
            }
          }
        }
      }
    })

    // Obtener progreso de contenido del estudiante
    const contentProgress = await prisma.studentContentProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          include: {
            modules: {
              include: {
                competency: true
              }
            }
          }
        }
      }
    })

    // Obtener resultados de exámenes por competencia
    const examResults = await prisma.examResult.findMany({
      where: { userId },
      include: {
        exam: {
          include: {
            competency: true
          }
        }
      }
    })

    // Procesar datos por competencia
    const competenciesProgress = competencies.map(competency => {
      // Lecciones de esta competencia
      const competencyLessons = lessonProgress.filter(lp => 
        lp.lesson.modules?.some(m => m.competencyId === competency.id)
      )

      // Contenido de esta competencia
      const competencyContent = contentProgress.filter(cp => 
        cp.lesson.modules?.some(m => m.competencyId === competency.id)
      )

      // Exámenes de esta competencia
      const competencyExams = examResults.filter(er => 
        er.exam.competencyId === competency.id
      )

      // Calcular estadísticas
      const totalLessons = competencyLessons.length
      const completedLessons = competencyLessons.filter(lp => lp.status === 'completed').length
      const inProgressLessons = competencyLessons.filter(lp => lp.status === 'in_progress').length

      const totalTimeMinutes = competencyContent.reduce((acc, cp) => 
        acc + (cp.timeSpentMinutes || 0), 0
      )

      const totalExams = competencyExams.length
      const passedExams = competencyExams.filter(er => er.passed).length
      const averageScore = totalExams > 0 
        ? Math.round(competencyExams.reduce((acc, er) => acc + er.score, 0) / totalExams)
        : 0

      const progressPercentage = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0

      // Última actividad
      const lastActivity = [
        ...competencyLessons.map(lp => lp.lastAccessedAt),
        ...competencyContent.map(cp => cp.lastAccessedAt),
        ...competencyExams.map(er => er.completedAt)
      ].filter(Boolean).sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0]

      return {
        id: competency.id,
        name: competency.name,
        displayName: competency.displayName,
        description: competency.description,
        color: competency.color,
        icon: competency.icon,
        totalLessons,
        completedLessons,
        inProgressLessons,
        progressPercentage,
        totalTimeMinutes,
        totalExams,
        passedExams,
        averageScore,
        lastActivityAt: lastActivity,
        stats: {
          lessonsCompleted: completedLessons,
          lessonsInProgress: inProgressLessons,
          timeSpent: totalTimeMinutes,
          examsTaken: totalExams,
          examsPassed: passedExams,
          averageScore
        }
      }
    })

    return NextResponse.json(competenciesProgress)

  } catch (error) {
    console.error('Error fetching competency progress:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}