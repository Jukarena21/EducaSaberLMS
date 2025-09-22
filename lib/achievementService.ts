import { prisma } from './prisma';
import { NotificationService } from './notificationService';

interface AchievementCriteria {
  type: string;
  value: number;
}

export class AchievementService {
  /**
   * Verifica y desbloquea logros automáticamente
   */
  static async checkAndUnlockAchievements(userId: string, triggerType: string, triggerData?: any) {
    try {
      // Obtener todos los logros activos
      const achievements = await prisma.achievement.findMany({
        where: { isActive: true }
      });

      // Obtener logros ya desbloqueados por el usuario
      const unlockedAchievements = await prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true }
      });

      const unlockedIds = new Set(unlockedAchievements.map(ua => ua.achievementId));

      // Verificar cada logro
      for (const achievement of achievements) {
        // Saltar si ya está desbloqueado
        if (unlockedIds.has(achievement.id)) {
          continue;
        }

        // Verificar si cumple los criterios
        const isUnlocked = await this.checkAchievementCriteria(
          userId, 
          achievement, 
          triggerType, 
          triggerData
        );

        if (isUnlocked) {
          await this.unlockAchievement(userId, achievement);
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }

  /**
   * Verifica si un logro específico cumple sus criterios
   */
  private static async checkAchievementCriteria(
    userId: string, 
    achievement: any, 
    triggerType: string, 
    triggerData?: any
  ): Promise<boolean> {
    try {
      const criteria: AchievementCriteria = JSON.parse(achievement.criteria);
      
      switch (criteria.type) {
        case 'lessons_completed':
          return await this.checkLessonsCompleted(userId, criteria.value);
        
        case 'exams_taken':
          return await this.checkExamsTaken(userId, criteria.value);
        
        case 'exams_passed':
          return await this.checkExamsPassed(userId, criteria.value);
        
        case 'exam_score':
          return await this.checkExamScore(userId, criteria.value, triggerData);
        
        case 'daily_study_time':
          return await this.checkDailyStudyTime(userId, criteria.value, triggerData);
        
        case 'total_study_time':
          return await this.checkTotalStudyTime(userId, criteria.value);
        
        case 'streak_days':
          return await this.checkStreakDays(userId, criteria.value);
        
        case 'course_completed':
          return await this.checkCourseCompleted(userId, criteria.value);
        
        case 'perfect_exam':
          return await this.checkPerfectExam(userId, criteria.value, triggerData);
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking achievement criteria:', error);
      return false;
    }
  }

  /**
   * Desbloquea un logro y envía notificación
   */
  private static async unlockAchievement(userId: string, achievement: any) {
    try {
      // Crear registro de logro desbloqueado
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id
        }
      });

      // Actualizar estadísticas del usuario
      await this.updateUserStats(userId, achievement.points);

      // Enviar notificación
      await NotificationService.createNotification({
        userId,
        type: 'achievement_unlocked',
        title: '¡Logro Desbloqueado!',
        message: `Has desbloqueado el logro "${achievement.name}": ${achievement.description}`,
        metadata: JSON.stringify({
          achievementId: achievement.id,
          achievementName: achievement.name,
          points: achievement.points
        }),
        actionUrl: '/estudiante?tab=gamificacion'
      });

      console.log(`Achievement unlocked: ${achievement.name} for user ${userId}`);
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  }

  /**
   * Actualiza las estadísticas del usuario
   */
  private static async updateUserStats(userId: string, points: number) {
    try {
      const userStats = await prisma.userStats.findUnique({
        where: { userId }
      });

      if (userStats) {
        await prisma.userStats.update({
          where: { userId },
          data: {
            totalPoints: userStats.totalPoints + points,
            totalAchievements: userStats.totalAchievements + 1
          }
        });
      }
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  // Métodos de verificación específicos
  private static async checkLessonsCompleted(userId: string, targetValue: number): Promise<boolean> {
    const count = await prisma.studentLessonProgress.count({
      where: {
        userId,
        status: 'completado'
      }
    });
    return count >= targetValue;
  }

  private static async checkExamsTaken(userId: string, targetValue: number): Promise<boolean> {
    const count = await prisma.examResult.count({
      where: { userId }
    });
    return count >= targetValue;
  }

  private static async checkExamsPassed(userId: string, targetValue: number): Promise<boolean> {
    const count = await prisma.examResult.count({
      where: {
        userId,
        isPassed: true
      }
    });
    return count >= targetValue;
  }

  private static async checkExamScore(userId: string, targetValue: number, triggerData?: any): Promise<boolean> {
    if (triggerData?.score) {
      return triggerData.score >= targetValue;
    }
    return false;
  }

  private static async checkDailyStudyTime(userId: string, targetValue: number, triggerData?: any): Promise<boolean> {
    if (triggerData?.date) {
      const startOfDay = new Date(triggerData.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(triggerData.date);
      endOfDay.setHours(23, 59, 59, 999);

      const totalTime = await prisma.studentLessonProgress.aggregate({
        where: {
          userId,
          completedAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        _sum: {
          totalTimeMinutes: true
        }
      });

      return (totalTime._sum.totalTimeMinutes || 0) >= targetValue;
    }
    return false;
  }

  private static async checkTotalStudyTime(userId: string, targetValue: number): Promise<boolean> {
    const totalTime = await prisma.studentLessonProgress.aggregate({
      where: { userId },
      _sum: {
        totalTimeMinutes: true
      }
    });
    return (totalTime._sum.totalTimeMinutes || 0) >= targetValue;
  }

  private static async checkStreakDays(userId: string, targetValue: number): Promise<boolean> {
    // Implementación simplificada - en una implementación real se calcularía la racha real
    const recentActivity = await prisma.studentLessonProgress.findFirst({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true }
    });

    if (!recentActivity?.completedAt) return false;

    const today = new Date();
    const lastActivity = new Date(recentActivity.completedAt);
    const diffTime = today.getTime() - lastActivity.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= 1; // Simplificado para demo
  }

  private static async checkCourseCompleted(userId: string, targetValue: number): Promise<boolean> {
    const count = await prisma.courseEnrollment.count({
      where: {
        userId,
        completedAt: { not: null }
      }
    });
    return count >= targetValue;
  }

  private static async checkPerfectExam(userId: string, targetValue: number, triggerData?: any): Promise<boolean> {
    if (triggerData?.score) {
      return triggerData.score >= targetValue;
    }
    return false;
  }
}
