import { NotificationFormData, NotificationType } from '@/types/notification';

export class NotificationService {
  static async createNotification(data: NotificationFormData): Promise<void> {
    try {
      const response = await fetch('/api/student/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al crear notificación');
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  static async createExamAvailableNotification(
    userId: string,
    examTitle: string,
    examId: string
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: 'exam_available',
      title: 'Nuevo Examen Disponible',
      message: `El examen "${examTitle}" está ahora disponible para presentar.`,
      actionUrl: `/estudiante/examen/${examId}`,
      metadata: { examId, examTitle },
    });
  }

  static async createExamReminderNotification(
    userId: string,
    examTitle: string,
    examId: string,
    hoursUntilExam: number
  ): Promise<void> {
    const timeText = hoursUntilExam === 1 ? '1 hora' : `${hoursUntilExam} horas`;
    
    await this.createNotification({
      userId,
      type: 'exam_reminder',
      title: 'Recordatorio de Examen',
      message: `El examen "${examTitle}" está programado en ${timeText}.`,
      actionUrl: `/estudiante/examen/${examId}`,
      metadata: { examId, examTitle, hoursUntilExam },
    });
  }

  static async createLessonCompletedNotification(
    userId: string,
    lessonTitle: string,
    lessonId: string
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: 'lesson_completed',
      title: 'Lección Completada',
      message: `¡Felicitaciones! Has completado la lección "${lessonTitle}".`,
      actionUrl: `/leccion/${lessonId}`,
      metadata: { lessonId, lessonTitle },
    });
  }

  static async createAchievementUnlockedNotification(
    userId: string,
    achievementTitle: string,
    achievementDescription: string
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: 'achievement_unlocked',
      title: '¡Logro Desbloqueado!',
      message: `Has desbloqueado el logro "${achievementTitle}": ${achievementDescription}`,
      actionUrl: '/estudiante',
      metadata: { achievementTitle, achievementDescription },
    });
  }

  static async createCourseEnrolledNotification(
    userId: string,
    courseTitle: string,
    courseId: string
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: 'course_enrolled',
      title: 'Curso Inscrito',
      message: `Te has inscrito exitosamente al curso "${courseTitle}". ¡Comienza a aprender!`,
      actionUrl: `/estudiante/cursos/${courseId}`,
      metadata: { courseId, courseTitle },
    });
  }

  static async createExamResultNotification(
    userId: string,
    examTitle: string,
    score: number,
    totalQuestions: number,
    examId: string
  ): Promise<void> {
    const percentage = Math.round((score / totalQuestions) * 100);
    const passed = percentage >= 70;
    
    await this.createNotification({
      userId,
      type: 'exam_result',
      title: 'Resultado de Examen',
      message: `Examen "${examTitle}" completado: ${score}/${totalQuestions} (${percentage}%) - ${
        passed ? '¡Aprobado!' : 'Reprobado'
      }`,
      actionUrl: `/estudiante/examen/resultado/${examId}`,
      metadata: { examId, examTitle, score, totalQuestions, percentage, passed },
    });
  }

  static async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    actionUrl?: string
  ): Promise<void> {
    await this.createNotification({
      userId,
      type: 'system',
      title,
      message,
      actionUrl,
    });
  }

  // Método para programar notificaciones futuras
  static async scheduleNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    scheduledAt: Date,
    metadata?: Record<string, any>,
    actionUrl?: string
  ): Promise<void> {
    await this.createNotification({
      userId,
      type,
      title,
      message,
      scheduledAt,
      metadata,
      actionUrl,
    });
  }

  // Método para crear notificaciones con expiración
  static async createExpiringNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    expiresAt: Date,
    metadata?: Record<string, any>,
    actionUrl?: string
  ): Promise<void> {
    await this.createNotification({
      userId,
      type,
      title,
      message,
      expiresAt,
      metadata,
      actionUrl,
    });
  }
}
