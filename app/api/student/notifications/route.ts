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

    const where: any = {
      userId: session.user.id,
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

    // Obtener estadísticas
    const stats = await prisma.notification.groupBy({
      by: ['type', 'isRead'],
      where: { userId: session.user.id },
      _count: true,
    });

    const notificationStats = {
      total: await prisma.notification.count({ where: { userId: session.user.id } }),
      unread: await prisma.notification.count({ 
        where: { userId: session.user.id, isRead: false } 
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
  type: z.enum(['exam_available', 'exam_reminder', 'lesson_completed', 'achievement_unlocked', 'course_enrolled', 'exam_result', 'system']),
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

    const notification = await prisma.notification.create({
      data: {
        userId: session.user.id,
        ...data,
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
