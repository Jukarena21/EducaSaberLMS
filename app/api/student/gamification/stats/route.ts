import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;

    // Obtener o crear estadísticas del usuario
    let userStats = await prisma.userStats.findUnique({
      where: { userId }
    });

    if (!userStats) {
      // Crear estadísticas iniciales
      userStats = await prisma.userStats.create({
        data: {
          userId,
          totalPoints: 0,
          level: 1,
          currentLevelPoints: 0,
          pointsToNextLevel: 100,
          totalLessonsCompleted: 0,
          totalExamsTaken: 0,
          totalExamsPassed: 0,
          totalStudyTimeMinutes: 0,
          currentStreakDays: 0,
          longestStreakDays: 0,
          averageExamScore: 0,
          bestExamScore: 0,
          totalAchievements: 0
        }
      });
    }

    // Calcular estadísticas actuales
    const lessonsCompleted = await prisma.studentLessonProgress.count({
      where: {
        userId,
        status: 'completed'
      }
    });

    // Solo considerar exámenes completados para estadísticas
    const examResults = await prisma.examResult.findMany({
      where: { 
        userId,
        completedAt: { not: null } // Solo exámenes completados
      },
      select: {
        score: true,
        isPassed: true,
        completedAt: true
      }
    });

    const totalExamsTaken = examResults.length;
    const totalExamsPassed = examResults.filter(r => r.isPassed).length;
    const averageExamScore = examResults.length > 0 
      ? examResults.reduce((sum, r) => sum + r.score, 0) / examResults.length 
      : 0;
    const bestExamScore = examResults.length > 0 
      ? Math.max(...examResults.map(r => r.score)) 
      : 0;

    const totalStudyTime = await prisma.studentLessonProgress.aggregate({
      where: { userId },
      _sum: {
        totalTimeMinutes: true
      }
    });

    const totalAchievements = await prisma.userAchievement.count({
      where: { userId }
    });

    // Calcular racha actual (días consecutivos con actividad)
    const lastActivity = await prisma.studentLessonProgress.findFirst({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true }
    });

    let currentStreakDays = 0;
    if (lastActivity?.completedAt) {
      const today = new Date();
      const lastActivityDate = new Date(lastActivity.completedAt);
      const diffTime = today.getTime() - lastActivityDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        currentStreakDays = 1; // Simplificado - en una implementación real se calcularía la racha real
      }
    }

    // Actualizar estadísticas
    const updatedStats = await prisma.userStats.update({
      where: { userId },
      data: {
        totalLessonsCompleted: lessonsCompleted,
        totalExamsTaken,
        totalExamsPassed,
        totalStudyTimeMinutes: totalStudyTime._sum.totalTimeMinutes || 0,
        currentStreakDays,
        averageExamScore: Math.round(averageExamScore),
        bestExamScore,
        totalAchievements,
        lastActivityDate: lastActivity?.completedAt || null
      }
    });

    return NextResponse.json(updatedStats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
