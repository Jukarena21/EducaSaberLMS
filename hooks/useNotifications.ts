import { useState, useEffect } from 'react';
import { NotificationData, NotificationFormData, NotificationFilters, NotificationStats } from '@/types/notification';

interface UseNotificationsReturn {
  notifications: NotificationData[];
  stats: NotificationStats | null;
  loading: boolean;
  error: string | null;
  fetchNotifications: (filters?: NotificationFilters) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  createNotification: (data: NotificationFormData) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async (filters?: NotificationFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.isRead !== undefined) params.append('isRead', filters.isRead.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await fetch(`/api/student/notifications?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar notificaciones');
      }

      const data = await response.json();
      setNotifications(data.notifications);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/student/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });

      if (!response.ok) {
        throw new Error('Error al marcar como leída');
      }

      // Actualizar el estado local
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        )
      );

      // Refrescar estadísticas desde el servidor para asegurar precisión
      await fetchNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/student/notifications/mark-all-read', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al marcar todas como leídas');
      }

      // Actualizar el estado local
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          isRead: true,
          readAt: new Date(),
        }))
      );

      // Refrescar estadísticas desde el servidor para asegurar precisión
      await fetchNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/student/notifications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar notificación');
      }

      // Actualizar el estado local
      setNotifications(prev => prev.filter(notification => notification.id !== id));

      // Refrescar estadísticas desde el servidor para asegurar precisión
      await fetchNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const createNotification = async (data: NotificationFormData) => {
    try {
      const response = await fetch('/api/student/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al crear notificación');
      }

      const newNotification = await response.json();
      setNotifications(prev => [newNotification, ...prev]);

      // Actualizar estadísticas
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          total: prev.total + 1,
          unread: prev.unread + 1,
        } : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const refreshNotifications = async () => {
    await fetchNotifications();
  };

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    fetchNotifications();
  }, []);

  return {
    notifications,
    stats,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refreshNotifications,
  };
}
