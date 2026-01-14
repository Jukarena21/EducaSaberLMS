'use client';

import { useEffect, useState } from 'react';
import { X, Bell, CheckCircle, AlertCircle, Info, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NotificationData, NotificationType } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationToastProps {
  notification: NotificationData;
  onClose: () => void;
  onAction?: () => void;
}

const notificationIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  exam_available: Bell,
  exam_reminder: AlertCircle,
  exam_scheduled: Bell,
  exam_closed: AlertCircle,
  exam_failed: AlertCircle,
  exam_missed: AlertCircle,
  lesson_completed: CheckCircle,
  achievement_unlocked: Award,
  course_enrolled: Info,
  exam_result: CheckCircle,
  system: Info,
  admin_broadcast: Bell,
};

const notificationColors: Record<NotificationType, string> = {
  exam_available: 'border-blue-500 bg-blue-50',
  exam_reminder: 'border-yellow-500 bg-yellow-50',
  exam_scheduled: 'border-cyan-500 bg-cyan-50',
  exam_closed: 'border-red-500 bg-red-50',
  exam_failed: 'border-red-500 bg-red-50',
  exam_missed: 'border-orange-500 bg-orange-50',
  lesson_completed: 'border-green-500 bg-green-50',
  achievement_unlocked: 'border-purple-500 bg-purple-50',
  course_enrolled: 'border-indigo-500 bg-indigo-50',
  exam_result: 'border-green-500 bg-green-50',
  system: 'border-gray-500 bg-gray-50',
  admin_broadcast: 'border-purple-500 bg-purple-50',
};

export function NotificationToast({ notification, onClose, onAction }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const IconComponent = notificationIcons[notification.type as NotificationType];

  useEffect(() => {
    // Animación de entrada
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-cerrar después de 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Esperar a que termine la animación
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    onClose();
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <Card className={`w-80 border-l-4 ${notificationColors[notification.type as NotificationType]}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <IconComponent className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-gray-900 mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {notification.message}
              </p>
              <p className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(notification.createdAt), { 
                  addSuffix: true, 
                  locale: es 
                })}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-6 w-6 p-0 hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </Button>
              {notification.actionUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAction}
                  className="h-6 px-2 text-xs"
                >
                  Ver
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface NotificationToastContainerProps {
  notifications: NotificationData[];
  onClose: (id: string) => void;
  onAction?: (notification: NotificationData) => void;
}

export function NotificationToastContainer({ 
  notifications, 
  onClose, 
  onAction 
}: NotificationToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => onClose(notification.id)}
          onAction={() => onAction?.(notification)}
        />
      ))}
    </div>
  );
}
