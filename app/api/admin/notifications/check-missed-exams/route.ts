import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Endpoint para verificar y crear notificaciones de exámenes no presentados
 * Se puede llamar manualmente o desde un cron job
 */
export async function POST(request: NextRequest) {
  try {
    const gate = await requireRole(['teacher_admin', 'school_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const session = await getServerSession(authOptions)
    const schoolId = session?.user?.schoolId
    const now = new Date()
    const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 días
    
    // Construir filtro de exámenes según el rol
    const examWhere: any = {
      isPublished: true,
      closeDate: {
        lte: now, // Ya cerraron
        gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // En los últimos 7 días
      }
    }
    
    // Si es school_admin, filtrar exámenes por cursos de su colegio
    if (session?.user?.role === 'school_admin' && schoolId) {
      const schoolCourses = await prisma.course.findMany({
        where: {
          courseSchools: {
            some: { schoolId }
          }
        },
        select: { id: true }
      })
      const courseIds = schoolCourses.map(c => c.id)
      examWhere.courseId = { in: courseIds.length > 0 ? courseIds : [''] } // Si no hay cursos, no traerá nada
    }
    
    // Buscar exámenes que cerraron pero no fueron completados por algunos estudiantes
    const closedExams = await prisma.exam.findMany({
      where: examWhere,
      include: {
        course: {
          include: {
            courseEnrollments: {
              where: { isActive: true },
              select: { userId: true }
            }
          }
        }
      }
    })

    let notificationsCreated = 0
    const notificationsToCreate: any[] = []

    for (const exam of closedExams) {
      // Obtener estudiantes que deberían haber tomado el examen
      let targetUserIds: string[] = []

      if (exam.courseId && exam.course?.courseEnrollments) {
        targetUserIds = exam.course.courseEnrollments.map(e => e.userId)
      } else if (exam.academicGrade) {
        // Obtener estudiantes con el grado académico del examen desde sus cursos inscritos
        const enrollments = await prisma.courseEnrollment.findMany({
          where: {
            isActive: true,
            course: {
              academicGrade: exam.academicGrade
            },
            user: {
              role: 'student',
              ...(session?.user?.role === 'school_admin' && schoolId ? { schoolId } : {})
            }
          },
          select: {
            userId: true
          },
          distinct: ['userId']
        })
        targetUserIds = enrollments.map(e => e.userId)
      }

      if (targetUserIds.length === 0) continue

      // Verificar qué estudiantes completaron el examen
      const completedResults = await prisma.examResult.findMany({
        where: {
          examId: exam.id,
          completedAt: { not: null }
        },
        select: { userId: true }
      })

      const completedUserIds = new Set(completedResults.map(r => r.userId))
      
      // Obtener estudiantes que no completaron el examen
      const missedUserIds = targetUserIds.filter(id => !completedUserIds.has(id))
      
      // Si es school_admin, notificarle sobre estudiantes que no presentaron
      if (session?.user?.role === 'school_admin' && session.user.schoolId && missedUserIds.length > 0) {
        try {
          const { AdminNotificationService } = await import('@/lib/adminNotificationService');
          await AdminNotificationService.notifyStudentsMissedExam(
            session.user.id,
            exam.id,
            exam.title,
            missedUserIds.length
          );
        } catch (notifyErr) {
          console.error('Error notifying school admin about missed exams:', notifyErr);
        }
      }
      
      // Crear notificaciones para estudiantes que no completaron el examen
      for (const userId of targetUserIds) {
        if (!completedUserIds.has(userId)) {
          // Verificar si ya existe una notificación de este tipo
          const existingNotification = await prisma.notification.findFirst({
            where: {
              userId,
              type: 'exam_missed',
              metadata: {
                contains: exam.id
              }
            }
          })

          if (!existingNotification) {
            notificationsToCreate.push({
              userId,
              type: 'exam_missed',
              title: 'Examen No Presentado',
              message: `No presentaste el examen "${exam.title}" antes de la fecha de cierre (${exam.closeDate?.toLocaleDateString('es-ES')}).`,
              actionUrl: `/estudiante/examen/${exam.id}`,
              expiresAt,
              metadata: JSON.stringify({ 
                examId: exam.id, 
                examTitle: exam.title, 
                closeDate: exam.closeDate?.toISOString() 
              }),
            })
          }
        }
      }
    }

    // Crear notificaciones en lote si hay alguna
    if (notificationsToCreate.length > 0) {
      const result = await prisma.notification.createMany({
        data: notificationsToCreate
      })
      notificationsCreated = result.count
    }

    return NextResponse.json({
      success: true,
      notificationsCreated,
      examsChecked: closedExams.length,
      message: `Se crearon ${notificationsCreated} notificaciones de exámenes no presentados`
    })
  } catch (error) {
    console.error('Error checking missed exams:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

