import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const notificationFiltersSchema = z.object({
  type: z.string().optional(),
  isRead: z.string().transform(val => val === 'true').optional(),
  limit: z.string().transform(val => parseInt(val)).optional(),
  offset: z.string().transform(val => parseInt(val)).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isRead = searchParams.get('isRead');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const now = new Date();
    const where: any = {
      userId: session.user.id,
      // Excluir notificaciones expiradas
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } }
      ],
    };

    if (type) {
      where.type = type;
    }

    if (isRead !== null) {
      where.isRead = isRead === 'true';
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit) : 50,
      skip: offset ? parseInt(offset) : 0,
    });

    // Obtener estadísticas (excluyendo expiradas)
    const statsWhere = {
      userId: session.user.id,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } }
      ]
    };
    
    const stats = await prisma.notification.groupBy({
      by: ['type', 'isRead'],
      where: statsWhere,
      _count: true,
    });

    const notificationStats = {
      total: await prisma.notification.count({ where: statsWhere }),
      unread: await prisma.notification.count({ 
        where: { 
          ...statsWhere,
          isRead: false 
        } 
      }),
      byType: stats.reduce((acc, stat) => {
        if (!acc[stat.type as any]) {
          acc[stat.type as any] = { total: 0, unread: 0 };
        }
        acc[stat.type as any].total += stat._count;
        if (!stat.isRead) {
          acc[stat.type as any].unread += stat._count;
        }
        return acc;
      }, {} as Record<string, { total: number; unread: number }>),
    };

    return NextResponse.json({
      notifications,
      stats: notificationStats,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

const createNotificationSchema = z.object({
  type: z.enum(['exam_available', 'exam_reminder', 'exam_scheduled', 'exam_closed', 'exam_failed', 'exam_missed', 'lesson_completed', 'achievement_unlocked', 'course_enrolled', 'exam_result', 'system', 'admin_broadcast', 'live_class_scheduled']).optional().default('system'),
  title: z.string().min(1),
  message: z.string().min(1),
  metadata: z.record(z.any()).optional(),
  actionUrl: z.string().optional(),
  scheduledAt: z.string().transform(val => val ? new Date(val) : undefined).optional(),
  expiresAt: z.string().transform(val => val ? new Date(val) : undefined).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = createNotificationSchema.parse(body);

    // Calcular fecha de expiración por defecto (15 días) si no se especifica
    const defaultExpiresAt = data.expiresAt || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    const notification = await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: data.type || 'system',
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        scheduledAt: data.scheduledAt,
        expiresAt: defaultExpiresAt,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
