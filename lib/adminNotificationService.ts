import { prisma } from '@/lib/prisma';

/**
 * Servicio para crear notificaciones automáticas para administradores de colegio
 */
export class AdminNotificationService {
  /**
   * Notifica a los school_admin cuando se publica un examen para sus estudiantes
   */
  static async notifyExamPublished(examId: string, examTitle: string, courseId?: string | null, academicGrade?: string | null): Promise<void> {
    try {
      const now = new Date();
      const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 días

      // Obtener todos los school_admin que tienen estudiantes afectados por este examen
      const schoolAdmins: string[] = [];

      if (courseId) {
        // Obtener colegios asociados al curso
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          include: {
            courseSchools: {
              include: {
                school: {
                  include: {
                    users: {
                      where: { role: 'school_admin' },
                      select: { id: true }
                    }
                  }
                }
              }
            }
          }
        });

        if (course) {
          course.courseSchools.forEach(cs => {
            cs.school.users.forEach(admin => {
              if (!schoolAdmins.includes(admin.id)) {
                schoolAdmins.push(admin.id);
              }
            });
          });
        }
      } else if (academicGrade) {
        // Si no hay curso, obtener school_admin de estudiantes con ese grado académico (a través de cursos)
        const coursesWithGrade = await prisma.course.findMany({
          where: { academicGrade: academicGrade },
          select: { id: true }
        });
        
        const courseIds = coursesWithGrade.map(c => c.id);
        const enrollments = await prisma.courseEnrollment.findMany({
          where: {
            courseId: { in: courseIds },
            isActive: true
          },
          include: {
            user: {
              select: {
                schoolId: true
              }
            }
          }
        });

        const schoolIds = [...new Set(enrollments.map(e => e.user.schoolId).filter(Boolean))] as string[];
        
        if (schoolIds.length > 0) {
          const admins = await prisma.user.findMany({
            where: {
              role: 'school_admin',
              schoolId: { in: schoolIds }
            },
            select: { id: true }
          });
          
          schoolAdmins.push(...admins.map(a => a.id));
        }
      }

      // Crear notificaciones para cada school_admin
      if (schoolAdmins.length > 0) {
        const notifications = schoolAdmins.map(adminId => ({
          userId: adminId,
          type: 'exam_published',
          title: 'Nuevo Examen Publicado',
          message: `Se ha publicado el examen "${examTitle}" para tus estudiantes.`,
          actionUrl: `/admin?tab=exams`,
          expiresAt,
          metadata: JSON.stringify({ examId, examTitle, courseId, academicGrade })
        }));

        await prisma.notification.createMany({ data: notifications });
      }
    } catch (error) {
      console.error('Error notifying school admins about exam publication:', error);
    }
  }

  /**
   * Notifica a los school_admin cuando un examen se cierra
   */
  static async notifyExamClosed(examId: string, examTitle: string, courseId?: string | null, academicGrade?: string | null): Promise<void> {
    try {
      const now = new Date();
      const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 días

      const schoolAdmins: string[] = [];

      if (courseId) {
        const course = await prisma.course.findUnique({
          where: { id: courseId },
          include: {
            courseSchools: {
              include: {
                school: {
                  include: {
                    users: {
                      where: { role: 'school_admin' },
                      select: { id: true }
                    }
                  }
                }
              }
            }
          }
        });

        if (course) {
          course.courseSchools.forEach(cs => {
            cs.school.users.forEach(admin => {
              if (!schoolAdmins.includes(admin.id)) {
                schoolAdmins.push(admin.id);
              }
            });
          });
        }
      } else if (academicGrade) {
        // Obtener school_admin de estudiantes con ese grado académico (a través de cursos)
        const coursesWithGrade = await prisma.course.findMany({
          where: { academicGrade: academicGrade },
          select: { id: true }
        });
        
        const courseIds = coursesWithGrade.map(c => c.id);
        const enrollments = await prisma.courseEnrollment.findMany({
          where: {
            courseId: { in: courseIds },
            isActive: true
          },
          include: {
            user: {
              select: {
                schoolId: true
              }
            }
          }
        });

        const schoolIds = [...new Set(enrollments.map(e => e.user.schoolId).filter(Boolean))] as string[];
        
        if (schoolIds.length > 0) {
          const admins = await prisma.user.findMany({
            where: {
              role: 'school_admin',
              schoolId: { in: schoolIds }
            },
            select: { id: true }
          });
          
          schoolAdmins.push(...admins.map(a => a.id));
        }
      }

      if (schoolAdmins.length > 0) {
        const notifications = schoolAdmins.map(adminId => ({
          userId: adminId,
          type: 'exam_closed',
          title: 'Examen Cerrado',
          message: `El examen "${examTitle}" ha sido cerrado. Puedes revisar los resultados de tus estudiantes.`,
          actionUrl: `/admin?tab=results`,
          expiresAt,
          metadata: JSON.stringify({ examId, examTitle, courseId, academicGrade })
        }));

        await prisma.notification.createMany({ data: notifications });
      }
    } catch (error) {
      console.error('Error notifying school admins about exam closure:', error);
    }
  }

  /**
   * Notifica a un school_admin específico cuando hay estudiantes que no presentaron un examen
   */
  static async notifyStudentsMissedExam(
    schoolAdminId: string,
    examId: string,
    examTitle: string,
    missedCount: number
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 días

      await prisma.notification.create({
        data: {
          userId: schoolAdminId,
          type: 'student_missed_exam',
          title: 'Estudiantes No Presentaron Examen',
          message: `${missedCount} estudiante(s) no presentaron el examen "${examTitle}".`,
          actionUrl: `/admin?tab=results`,
          expiresAt,
          metadata: JSON.stringify({ examId, examTitle, missedCount })
        }
      });
    } catch (error) {
      console.error('Error notifying school admin about missed exams:', error);
    }
  }

  /**
   * Notifica a un school_admin sobre alertas de rendimiento bajo
   */
  static async notifyPerformanceAlert(
    schoolAdminId: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 días

      await prisma.notification.create({
        data: {
          userId: schoolAdminId,
          type: 'performance_alert',
          title: 'Alerta de Rendimiento',
          message,
          actionUrl: `/admin?tab=analytics`,
          expiresAt,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      });
    } catch (error) {
      console.error('Error notifying school admin about performance alert:', error);
    }
  }
}

