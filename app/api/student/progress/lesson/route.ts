import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NotificationService } from '@/lib/notificationService'
import { AchievementService } from '@/lib/achievementService'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const { lessonId, status, progressPercentage, contentType, timeSpentMinutes } = await request.json()

    if (!lessonId) {
      return NextResponse.json({ error: 'ID de lección requerido' }, { status: 400 })
    }

    // Verificar que la lección existe
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 })
    }

    // Actualizar o crear progreso de lección (sin tiempo aún)
    const existingLessonProgress = await prisma.studentLessonProgress.findFirst({
      where: { userId, lessonId }
    })

    const lessonProgress = existingLessonProgress
      ? await prisma.studentLessonProgress.update({
          where: { id: existingLessonProgress.id },
          data: {
            status: status || existingLessonProgress.status || 'in_progress',
            progressPercentage: progressPercentage ?? existingLessonProgress.progressPercentage,
            ...(status === 'completed' && { completedAt: new Date() })
          }
        })
      : await prisma.studentLessonProgress.create({
          data: {
            userId,
            lessonId,
            status: status || 'in_progress',
            progressPercentage: progressPercentage || 0,
            ...(status === 'completed' && { completedAt: new Date() })
          }
        })

    // Si se especifica tipo de contenido, actualizar progreso de contenido y acumular tiempo
    if (contentType) {
      const incoming = Math.max(0, Math.floor(timeSpentMinutes || 0))

      // Obtener progreso previo para acumular
      const existingContent = await prisma.studentContentProgress.findFirst({
        where: { userId, lessonId, contentType }
      })

      const existingMinutes = existingContent?.timeSpentMinutes || 0
      // Si el cliente envía acumulado (total), tomamos el mayor; si envía delta, sumamos
      const newTimeSpent =
        incoming >= existingMinutes
          ? incoming
          : existingMinutes + incoming

      if (existingContent) {
        await prisma.studentContentProgress.update({
          where: { id: existingContent.id },
          data: {
            isCompleted: status === 'completed' ? true : existingContent.isCompleted,
            timeSpentMinutes: newTimeSpent,
            ...(status === 'completed' && { completedAt: new Date() })
          }
        })
      } else {
        await prisma.studentContentProgress.create({
          data: {
            userId,
            lessonId,
            contentType,
            isCompleted: status === 'completed',
            timeSpentMinutes: newTimeSpent,
            ...(status === 'completed' && { completedAt: new Date() })
          }
        })
      }

      // Recalcular tiempo total de la lección (suma de contenidos)
      const totalLessonTime = await prisma.studentContentProgress.aggregate({
        where: { userId, lessonId },
        _sum: { timeSpentMinutes: true }
      })

      await prisma.studentLessonProgress.updateMany({
        where: { userId, lessonId },
        data: {
          totalTimeMinutes: totalLessonTime._sum.timeSpentMinutes || 0
        }
      })
    }

    // Crear notificación si la lección se completó
    if (status === 'completed') {
      try {
        await NotificationService.createLessonCompletedNotification(
          userId,
          lesson.title,
          lesson.id
        );
      } catch (notificationError) {
        console.error('Error creating lesson completion notification:', notificationError);
        // No fallar el progreso por error en notificación
      }

      // Verificar logros relacionados con lecciones
      try {
        await AchievementService.checkAndUnlockAllAchievements(userId);
      } catch (achievementError) {
        console.error('Error checking achievements:', achievementError);
        // No fallar el progreso por error en logros
      }
    }

    return NextResponse.json({ 
      success: true, 
      progress: lessonProgress 
    })

  } catch (error) {
    console.error('Error updating lesson progress:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}