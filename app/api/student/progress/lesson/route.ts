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

    // Actualizar o crear progreso de lección
    const lessonProgress = await prisma.studentLessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      },
      update: {
        status: status || 'in_progress',
        progressPercentage: progressPercentage || 0,
        lastAccessedAt: new Date(),
        ...(status === 'completed' && { completedAt: new Date() })
      },
      create: {
        userId,
        lessonId,
        status: status || 'in_progress',
        progressPercentage: progressPercentage || 0,
        lastAccessedAt: new Date(),
        ...(status === 'completed' && { completedAt: new Date() })
      }
    })

    // Si se especifica tipo de contenido, actualizar progreso de contenido
    if (contentType) {
      await prisma.studentContentProgress.upsert({
        where: {
          userId_lessonId_contentType: {
            userId,
            lessonId,
            contentType
          }
        },
        update: {
          status: status || 'in_progress',
          timeSpentMinutes: timeSpentMinutes || 0,
          lastAccessedAt: new Date(),
          ...(status === 'completed' && { completedAt: new Date() })
        },
        create: {
          userId,
          lessonId,
          contentType,
          status: status || 'in_progress',
          timeSpentMinutes: timeSpentMinutes || 0,
          lastAccessedAt: new Date(),
          ...(status === 'completed' && { completedAt: new Date() })
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
        await AchievementService.checkAndUnlockAchievements(
          userId, 
          'lesson_completed',
          { 
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            date: new Date()
          }
        );
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