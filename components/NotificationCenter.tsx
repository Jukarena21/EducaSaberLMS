'use client';

import { useState } from 'react';
import { Bell, X, Check, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationData, NotificationType } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const notificationTypeLabels: Record<NotificationType | 'exam_published' | 'student_missed_exam' | 'performance_alert', string> = {
  exam_available: 'Examen Disponible',
  exam_reminder: 'Recordatorio de Examen',
  exam_scheduled: 'Examen Programado',
  exam_closed: 'Examen Cerrado',
  exam_failed: 'Examen No Aprobado',
  exam_missed: 'Examen No Presentado',
  lesson_completed: 'Lección Completada',
  achievement_unlocked: 'Logro Desbloqueado',
  course_enrolled: 'Curso Inscrito',
  exam_result: 'Resultado de Examen',
  system: 'Sistema',
  admin_broadcast: 'Anuncio',
  exam_published: 'Examen Publicado',
  student_missed_exam: 'Estudiante No Presentó',
  performance_alert: 'Alerta de Rendimiento',
};

const notificationTypeColors: Record<NotificationType | 'exam_published' | 'student_missed_exam' | 'performance_alert', string> = {
  exam_available: 'bg-blue-100 text-blue-800',
  exam_reminder: 'bg-yellow-100 text-yellow-800',
  exam_scheduled: 'bg-cyan-100 text-cyan-800',
  exam_closed: 'bg-red-100 text-red-800',
  exam_failed: 'bg-red-100 text-red-800',
  exam_missed: 'bg-orange-100 text-orange-800',
  lesson_completed: 'bg-green-100 text-green-800',
  achievement_unlocked: 'bg-purple-100 text-purple-800',
  course_enrolled: 'bg-indigo-100 text-indigo-800',
  exam_result: 'bg-green-100 text-green-800',
  system: 'bg-gray-100 text-gray-800',
  admin_broadcast: 'bg-purple-100 text-purple-800',
  exam_published: 'bg-green-100 text-green-800',
  student_missed_exam: 'bg-orange-100 text-orange-800',
  performance_alert: 'bg-yellow-100 text-yellow-800',
};

interface NotificationItemProps {
  notification: NotificationData;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="secondary" 
                className={notificationTypeColors[notification.type as NotificationType]}
              >
                {notificationTypeLabels[notification.type as NotificationType]}
              </Badge>
              {!notification.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>
            <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
            <p className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(notification.createdAt), { 
                addSuffix: true, 
                locale: es 
              })}
            </p>
          </div>
          <div className="flex gap-1 ml-2">
            {!notification.isRead && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
                className="h-8 w-8 p-0"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const { 
    notifications, 
    stats, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    fetchNotifications,
    refreshNotifications
  } = useNotifications();

  // Refrescar notificaciones y marcar todas como leídas cuando se abre el diálogo
  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Refrescar notificaciones primero
      await refreshNotifications();
      // Marcar todas como leídas automáticamente al abrir
      // Esto asegura que el contador se actualice inmediatamente
      await markAllAsRead();
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    return notification.type === filter;
  });

  const handleFilterChange = (value: string) => {
    setFilter(value);
    fetchNotifications(
      value === 'all' ? {} : 
      value === 'unread' ? { isRead: false } : 
      { type: value as NotificationType }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {stats && stats.unread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {stats.unread}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Centro de Notificaciones</span>
            {stats && stats.unread > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Marcar todas como leídas
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={filter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="unread">No leídas</SelectItem>
                {Object.entries(notificationTypeLabels).map(([type, label]) => (
                  <SelectItem key={type} value={type}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estadísticas */}
          {stats && (
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
                  <div className="text-xs text-gray-500">No leídas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.total > 0 ? Math.round(((stats.total - stats.unread) / stats.total) * 100) : 0}%
                  </div>
                  <div className="text-xs text-gray-500">Leídas</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Lista de notificaciones */}
          <ScrollArea className="h-96">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Cargando notificaciones...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500">
                  {filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No tienes notificaciones'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}