import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const broadcastNotificationSchema = z.object({
  type: z.enum(['exam_available', 'exam_reminder', 'system', 'admin_broadcast']),
  title: z.string().min(1),
  message: z.string().min(1),
  targetUsers: z.enum(['all_students', 'specific_grade', 'my_school']),
  targetValue: z.string().optional(), // grade if targetUsers is specific_grade
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
    const schoolId = session.user.schoolId;

    if (data.targetUsers === 'all_students') {
      // Para school_admin, solo estudiantes de su colegio
      // Para teacher_admin, todos los estudiantes
      const whereClause: any = { role: 'student' };
      if (session.user.role === 'school_admin' && schoolId) {
        whereClause.schoolId = schoolId;
      }
      
      const students = await prisma.user.findMany({
        where: whereClause,
        select: { id: true }
      });
      targetUserIds = students.map(s => s.id);
    } else if (data.targetUsers === 'specific_grade' && data.targetValue) {
      // Obtener estudiantes con el grado académico especificado desde sus cursos inscritos
      const enrollments = await prisma.courseEnrollment.findMany({
        where: {
          isActive: true,
          course: {
            academicGrade: data.targetValue
          },
          user: {
            role: 'student',
            ...(session.user.role === 'school_admin' && schoolId ? { schoolId } : {})
          }
        },
        select: {
          userId: true
        },
        distinct: ['userId']
      });
      
      targetUserIds = enrollments.map(e => e.userId);
    } else if (data.targetUsers === 'my_school') {
      // Solo estudiantes del colegio del admin
      if (!schoolId) {
        return NextResponse.json({ 
          error: 'No se pudo determinar el colegio' 
        }, { status: 400 });
      }
      
      const students = await prisma.user.findMany({
        where: { 
          role: 'student',
          schoolId: schoolId
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

    // Calcular fecha de expiración (15 días por defecto si no se especifica)
    const defaultExpiresAt = data.expiresAt || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    // Crear notificaciones en lote
    const notifications = targetUserIds.map(userId => ({
      userId,
      type: data.type === 'admin_broadcast' ? 'admin_broadcast' : data.type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      scheduledAt: data.scheduledAt,
      expiresAt: defaultExpiresAt,
      metadata: JSON.stringify({
        broadcast: true,
        createdBy: session.user.id,
        targetUsers: data.targetUsers,
        targetValue: data.targetValue,
      }),
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
