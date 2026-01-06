'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LiveClassCard } from './LiveClassCard';
import { LiveClassData } from '@/types/liveClass';
import { formatDate } from '@/lib/utils';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Video,
  Filter,
  List,
  Grid
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const PROVIDER_ICONS: Record<string, { name: string; color: string }> = {
  zoom: { name: 'Zoom', color: 'bg-blue-500' },
  meet: { name: 'Google Meet', color: 'bg-green-500' },
  teams: { name: 'Microsoft Teams', color: 'bg-purple-500' },
  webex: { name: 'Cisco Webex', color: 'bg-orange-500' },
  other: { name: 'Otro', color: 'bg-gray-500' },
};

export function LiveClassCalendar() {
  const [liveClasses, setLiveClasses] = useState<LiveClassData[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');
  const [selectedCompetency, setSelectedCompetency] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<LiveClassData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Obtener mes actual
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Cargar clases en vivo
  const fetchLiveClasses = async () => {
    setLoading(true);
    try {
      // Calcular rango de fechas para el mes actual
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      
      const params = new URLSearchParams({
        startDateFrom: startOfMonth.toISOString(),
        startDateTo: endOfMonth.toISOString(),
      });

      if (selectedCompetency !== 'all') {
        params.append('competencyId', selectedCompetency);
      }

      const response = await fetch(`/api/live-classes?${params.toString()}`);
      if (!response.ok) throw new Error('Error al cargar clases');
      
      const data = await response.json();
      setLiveClasses(data);
    } catch (error) {
      console.error('Error fetching live classes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveClasses();
  }, [currentDate, selectedCompetency]);

  // Navegación de meses
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Obtener días del mes
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Días del mes anterior para completar la primera semana
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false,
        classes: []
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      const classesForDay = liveClasses.filter(cls => {
        const classDate = new Date(cls.startDateTime);
        return classDate.toDateString() === dayDate.toDateString();
      });

      days.push({
        date: dayDate,
        isCurrentMonth: true,
        classes: classesForDay
      });
    }

    // Días del mes siguiente para completar la última semana
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        classes: []
      });
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Obtener competencias únicas para el filtro
  const competencies = Array.from(
    new Set(liveClasses.map(cls => cls.competency?.id).filter(Boolean))
  ).map(id => {
    const cls = liveClasses.find(c => c.competency?.id === id);
    return cls?.competency;
  }).filter(Boolean) as Array<{ id: string; name: string; displayName?: string }>;

  // Clases próximas (próximas 7 días)
  const upcomingClasses = liveClasses
    .filter(cls => {
      const classDate = new Date(cls.startDateTime);
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return classDate >= now && classDate <= weekFromNow;
    })
    .sort((a, b) => 
      new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );

  const handleClassClick = (liveClass: LiveClassData) => {
    setSelectedClass(liveClass);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Clases en Vivo</h2>
          <p className="text-muted-foreground">
            Consulta las clases virtuales programadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedCompetency} onValueChange={setSelectedCompetency}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por competencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las competencias</SelectItem>
              {competencies.map((comp) => (
                <SelectItem key={comp.id} value={comp.id}>
                  {comp.displayName || comp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === 'month' ? 'list' : 'month')}
            title={viewMode === 'month' ? 'Vista de lista' : 'Vista de calendario'}
          >
            {viewMode === 'month' ? <List className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {viewMode === 'month' ? (
        <>
          {/* Controles de navegación del calendario */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {monthNames[currentMonth]} {currentYear}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Hoy
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToNextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando clases...</p>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {/* Días de la semana */}
                  {dayNames.map((day) => (
                    <div key={day} className="p-2 text-center font-semibold text-sm text-muted-foreground">
                      {day}
                    </div>
                  ))}

                  {/* Días del mes */}
                  {days.map((day, index) => {
                    const isToday = day.date.toDateString() === new Date().toDateString();
                    const hasClasses = day.classes.length > 0;

                    return (
                      <div
                        key={index}
                        className={`
                          min-h-[80px] p-1 border rounded-md
                          ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                          ${isToday ? 'border-blue-500 border-2' : 'border-gray-200'}
                          ${hasClasses ? 'cursor-pointer hover:bg-blue-50' : ''}
                        `}
                        onClick={() => hasClasses && day.classes[0] && handleClassClick(day.classes[0])}
                      >
                        <div className={`
                          text-sm font-medium mb-1
                          ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                          ${isToday ? 'text-blue-600 font-bold' : ''}
                        `}>
                          {day.date.getDate()}
                        </div>
                        {hasClasses && (
                          <div className="space-y-1">
                            {day.classes.slice(0, 2).map((cls) => {
                              const providerInfo = cls.provider ? PROVIDER_ICONS[cls.provider] : null;
                              return (
                                <div
                                  key={cls.id}
                                  className="text-xs p-1 rounded bg-blue-100 text-blue-800 truncate"
                                  title={cls.title}
                                >
                                  {new Date(cls.startDateTime).toLocaleTimeString('es-CO', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })} - {cls.title}
                                </div>
                              );
                            })}
                            {day.classes.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{day.classes.length - 2} más
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clases próximas */}
          {upcomingClasses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Próximas Clases (7 días)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingClasses.map((liveClass) => (
                    <LiveClassCard
                      key={liveClass.id}
                      liveClass={liveClass}
                      onClick={() => handleClassClick(liveClass)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* Vista de lista */
        <Card>
          <CardHeader>
            <CardTitle>Clases Programadas</CardTitle>
            <CardDescription>
              Lista de todas las clases en vivo programadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Cargando clases...</p>
              </div>
            ) : liveClasses.length === 0 ? (
              <div className="text-center py-8">
                <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay clases programadas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {liveClasses
                  .sort((a, b) => 
                    new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
                  )
                  .map((liveClass) => (
                    <LiveClassCard
                      key={liveClass.id}
                      liveClass={liveClass}
                      onClick={() => handleClassClick(liveClass)}
                    />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de detalles */}
      {selectedClass && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedClass.title}</DialogTitle>
              <DialogDescription>
                Detalles de la clase en vivo
              </DialogDescription>
            </DialogHeader>
            <LiveClassCard
              liveClass={selectedClass}
              showFullDetails={true}
              onClick={() => window.open(selectedClass.meetingUrl, '_blank')}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

