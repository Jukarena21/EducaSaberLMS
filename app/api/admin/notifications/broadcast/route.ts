import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const broadcastNotificationSchema = z.object({
  type: z.enum(['exam_available', 'exam_reminder', 'system']),
  title: z.string().min(1),
  message: z.string().min(1),
  targetUsers: z.enum(['all_students', 'specific_grade', 'specific_school']),
  targetValue: z.string().optional(), // grade or school ID
  actionUrl: z.string().optional(),
  scheduledAt: z.string().transform(val => val ? new Date(val) : undefined).optional(),
  expiresAt: z.string().transform(val => val ? new Date(val) : undefined).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !['teacher_admin', 'school_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = broadcastNotificationSchema.parse(body);

    // Determinar usuarios objetivo
    let targetUserIds: string[] = [];

    if (data.targetUsers === 'all_students') {
      const students = await prisma.user.findMany({
        where: { role: 'student' },
        select: { id: true }
      });
      targetUserIds = students.map(s => s.id);
    } else if (data.targetUsers === 'specific_grade' && data.targetValue) {
      const students = await prisma.user.findMany({
        where: { 
          role: 'student',
          academicGrade: data.targetValue
        },
        select: { id: true }
      });
      targetUserIds = students.map(s => s.id);
    } else if (data.targetUsers === 'specific_school' && data.targetValue) {
      const students = await prisma.user.findMany({
        where: { 
          role: 'student',
          schoolId: data.targetValue
        },
        select: { id: true }
      });
      targetUserIds = students.map(s => s.id);
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ 
        error: 'No se encontraron usuarios objetivo' 
      }, { status: 400 });
    }

    // Crear notificaciones en lote
    const notifications = targetUserIds.map(userId => ({
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      scheduledAt: data.scheduledAt,
      expiresAt: data.expiresAt,
      metadata: {
        broadcast: true,
        createdBy: session.user.id,
        targetUsers: data.targetUsers,
        targetValue: data.targetValue,
      },
    }));

    const result = await prisma.notification.createMany({
      data: notifications,
    });

    return NextResponse.json({
      success: true,
      notificationsCreated: result.count,
      targetUsers: targetUserIds.length,
    });
  } catch (error) {
    console.error('Error broadcasting notifications:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
