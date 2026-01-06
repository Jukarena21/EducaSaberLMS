'use client';

import { useState, useEffect } from 'react';
import { Calendar, Video, ExternalLink, Clock, FileText, CheckCircle, BookOpen, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const PROVIDER_ICONS: Record<string, { name: string; color: string }> = {
  zoom: { name: 'Zoom', color: 'bg-blue-500' },
  meet: { name: 'Google Meet', color: 'bg-green-500' },
  teams: { name: 'Microsoft Teams', color: 'bg-purple-500' },
  webex: { name: 'Cisco Webex', color: 'bg-orange-500' },
  other: { name: 'Otro', color: 'bg-gray-500' },
};

type CalendarEvent = {
  id: string;
  type: 'live_class' | 'exam_open' | 'exam_close' | 'exam_submission' | 'module_complete' | 'quiz_available';
  title: string;
  description?: string;
  startDate: string;
  endDate?: string | null;
  meetingUrl?: string;
  provider?: string;
  examId?: string;
  examTitle?: string;
  moduleId?: string;
  moduleTitle?: string;
  userId?: string;
  userName?: string;
  score?: number;
  isPassed?: boolean;
  progressPercentage?: number;
  competency?: { id: string; name: string; displayName?: string };
  module?: { id: string; title: string };
  lesson?: { id: string; title: string };
  school?: { id: string; name: string };
  course?: { id: string; title: string };
  academicGrade?: string;
  examType?: string;
};

const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  live_class: { 
    label: 'Clase en Vivo', 
    icon: Video, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50 border-blue-200' 
  },
  exam_open: { 
    label: 'Inicio de Examen', 
    icon: FileText, 
    color: 'text-green-600', 
    bgColor: 'bg-green-50 border-green-200' 
  },
  exam_close: { 
    label: 'Cierre de Examen', 
    icon: FileText, 
    color: 'text-red-600', 
    bgColor: 'bg-red-50 border-red-200' 
  },
  exam_submission: { 
    label: 'Examen Presentado', 
    icon: CheckCircle, 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-50 border-purple-200' 
  },
  module_complete: { 
    label: 'Módulo Completado', 
    icon: BookOpen, 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-50 border-orange-200' 
  },
  quiz_available: { 
    label: 'Quiz Disponible', 
    icon: FileText, 
    color: 'text-indigo-600', 
    bgColor: 'bg-indigo-50 border-indigo-200' 
  },
};

export function AdminLiveClassCalendar() {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  // Cargar eventos del calendario (próximos 30 días)
  const fetchCalendarEvents = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const params = new URLSearchParams({
        startDate: now.toISOString(),
        endDate: thirtyDaysFromNow.toISOString(),
      });

      const response = await fetch(`/api/calendar/events?${params.toString()}`);
      if (!response.ok) throw new Error('Error al cargar eventos');
      
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar eventos al montar el componente para mostrar el contador
  useEffect(() => {
    fetchCalendarEvents();
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchCalendarEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Recargar cuando se abre el diálogo
  useEffect(() => {
    if (isOpen) {
      fetchCalendarEvents();
    }
  }, [isOpen]);

  // Filtrar eventos según el tipo seleccionado
  const filteredEvents = filterType === 'all' 
    ? events 
    : events.filter(e => e.type === filterType);

  // Eventos próximos (próximos 7 días, solo futuros)
  const upcomingEvents = filteredEvents
    .filter(event => {
      const eventDate = new Date(event.startDate);
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return eventDate >= now && eventDate <= weekFromNow;
    })
    .sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

  // Contar eventos próximos para el badge
  const upcomingCount = events.filter(event => {
    const eventDate = new Date(event.startDate);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventDate >= now && eventDate <= weekFromNow;
  }).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Calendar className="h-4 w-4" />
          {upcomingCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {upcomingCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendario de Eventos
          </DialogTitle>
          <DialogDescription>
            Clases en vivo, exámenes, presentaciones y finalizaciones de módulos
          </DialogDescription>
        </DialogHeader>

        {/* Filtro por tipo de evento */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los eventos</SelectItem>
              <SelectItem value="live_class">Clases en Vivo</SelectItem>
              <SelectItem value="exam_open">Inicio de Exámenes</SelectItem>
              <SelectItem value="exam_close">Cierre de Exámenes</SelectItem>
              <SelectItem value="exam_submission">Exámenes Presentados</SelectItem>
              <SelectItem value="module_complete">Módulos Completados</SelectItem>
              <SelectItem value="quiz_available">Quices Disponibles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando eventos...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay eventos programados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents
                .sort((a, b) => 
                  new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                )
                .map((event) => {
                  const eventDate = new Date(event.startDate);
                  const now = new Date();
                  const isUpcoming = eventDate >= now;
                  const isPast = eventDate < now;
                  const config = EVENT_TYPE_CONFIG[event.type];
                  const Icon = config?.icon || Calendar;
                  const providerInfo = event.provider ? PROVIDER_ICONS[event.provider] : null;

                  return (
                    <div
                      key={event.id}
                      className={`
                        p-4 border rounded-lg transition-colors
                        ${isPast ? 'bg-gray-50 opacity-60' : config?.bgColor || 'bg-white hover:bg-gray-50'}
                        ${isPast ? 'border-gray-200' : config?.bgColor?.replace('bg-', 'border-') || 'border-gray-200'}
                      `}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className={`w-4 h-4 ${config?.color || 'text-gray-600'}`} />
                            <h4 className="font-semibold text-sm truncate">{event.title}</h4>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${config?.color || 'text-gray-600'}`}
                            >
                              {config?.label || event.type}
                            </Badge>
                            {providerInfo && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${providerInfo.color} text-white border-0`}
                              >
                                {providerInfo.name}
                              </Badge>
                            )}
                            {isUpcoming && (
                              <Badge variant="secondary" className="text-xs">
                                Próximo
                              </Badge>
                            )}
                            {isPast && (
                              <Badge variant="outline" className="text-xs">
                                Pasado
                              </Badge>
                            )}
                          </div>
                          
                          {event.description && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {event.description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {formatDate(eventDate)} a las {eventDate.toLocaleTimeString('es-CO', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                            
                            {isUpcoming && (
                              <span className={config?.color || 'text-gray-600'}>
                                {formatDistanceToNow(eventDate, { 
                                  addSuffix: true, 
                                  locale: es 
                                })}
                              </span>
                            )}

                            {event.school && (
                              <span>• {event.school.name}</span>
                            )}

                            {event.competency && (
                              <span>• {event.competency.displayName || event.competency.name}</span>
                            )}

                            {event.module && (
                              <span>• Módulo: {event.module.title}</span>
                            )}

                            {event.course && (
                              <span>• Curso: {event.course.title}</span>
                            )}

                            {event.userName && (
                              <span>• Estudiante: {event.userName}</span>
                            )}

                            {event.score !== undefined && (
                              <span className={event.isPassed ? 'text-green-600' : 'text-red-600'}>
                                • Puntaje: {event.score}% {event.isPassed ? '✓' : '✗'}
                              </span>
                            )}

                            {event.progressPercentage !== undefined && (
                              <span>• Progreso: {event.progressPercentage.toFixed(0)}%</span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {isUpcoming && event.meetingUrl && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => window.open(event.meetingUrl, '_blank')}
                              className="whitespace-nowrap"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Unirse
                            </Button>
                          )}
                          {event.meetingUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(event.meetingUrl!);
                              }}
                              className="whitespace-nowrap"
                            >
                              Copiar enlace
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

