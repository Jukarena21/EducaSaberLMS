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

    // Obtener todos los logros disponibles
    const allAchievements = await prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: { points: 'asc' }
    });

    // Obtener logros desbloqueados por el usuario
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true
      }
    });

    // Crear mapa de logros desbloqueados
    const unlockedAchievementIds = new Set(
      userAchievements.map(ua => ua.achievementId)
    );

    // Combinar logros con estado de desbloqueo
    const achievementsWithStatus = allAchievements.map(achievement => {
      const userAchievement = userAchievements.find(
        ua => ua.achievementId === achievement.id
      );

      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        iconName: achievement.iconName,
        category: achievement.category,
        points: achievement.points,
        isUnlocked: unlockedAchievementIds.has(achievement.id),
        unlockedAt: userAchievement?.unlockedAt || null
      };
    });

    return NextResponse.json(achievementsWithStatus);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
