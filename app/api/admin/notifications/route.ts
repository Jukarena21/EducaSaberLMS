import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createNotificationSchema = z.object({
  type: z.enum(['exam_available', 'exam_reminder', 'exam_scheduled', 'exam_closed', 'exam_failed', 'exam_missed', 'lesson_completed', 'achievement_unlocked', 'course_enrolled', 'exam_result', 'system', 'admin_broadcast', 'exam_published', 'student_missed_exam', 'performance_alert'] as const).optional().default('system'),
  title: z.string().min(1),
  message: z.string().min(1),
  metadata: z.record(z.any()).optional(),
  actionUrl: z.string().optional(),
  scheduledAt: z.string().transform(val => val ? new Date(val) : undefined).optional(),
  expiresAt: z.string().transform(val => val ? new Date(val) : undefined).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !['teacher_admin', 'school_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isRead = searchParams.get('isRead');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      userId: session.user.id,
    };

    if (type) {
      where.type = type;
    }

    if (isRead !== null) {
      where.isRead = isRead === 'true';
    }

    // Solo mostrar notificaciones no expiradas
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } }
    ];

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          ...where,
          isRead: false,
        },
      }),
    ]);

    // Transformar notificaciones
    const transformedNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      readAt: notification.readAt,
      actionUrl: notification.actionUrl,
      metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
      createdAt: notification.createdAt.toISOString(),
      expiresAt: notification.expiresAt?.toISOString(),
    }));

    return NextResponse.json({
      notifications: transformedNotifications,
      stats: {
        total,
        unread: unreadCount,
      },
    });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !['teacher_admin', 'school_admin'].includes(session.user.role)) {
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
    console.error('Error creating admin notification:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

