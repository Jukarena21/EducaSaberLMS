export interface NotificationData {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: Date;
  metadata?: Record<string, any>;
  actionUrl?: string;
  scheduledAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationFormData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
  scheduledAt?: Date;
  expiresAt?: Date;
}

export type NotificationType = 
  | 'exam_available'
  | 'exam_reminder'
  | 'lesson_completed'
  | 'achievement_unlocked'
  | 'course_enrolled'
  | 'exam_result'
  | 'system';

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}

export interface NotificationFilters {
  type?: NotificationType;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}
