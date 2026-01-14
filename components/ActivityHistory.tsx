'use client';

import { useState } from 'react';
import { Calendar, BookOpen, Award, Clock, TrendingUp, TrendingDown, Minus, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useActivityHistory } from '@/hooks/useActivityHistory';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

const activityTypeIcons = {
  lesson_completed: BookOpen,
  exam_completed: Award,
  course_enrolled: Calendar,
};

const activityTypeColors = {
  lesson_completed: 'bg-green-100 text-green-800',
  exam_completed: 'bg-blue-100 text-blue-800',
  course_enrolled: 'bg-purple-100 text-purple-800',
};

const trendIcons = {
  improving: TrendingUp,
  declining: TrendingDown,
  stable: Minus,
};

const trendColors = {
  improving: 'text-green-600',
  declining: 'text-red-600',
  stable: 'text-gray-600',
};

interface ActivityItemProps {
  activity: any;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const IconComponent = activityTypeIcons[activity.type as keyof typeof activityTypeIcons];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <IconComponent className="h-5 w-5 text-gray-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge 
                variant="secondary" 
                className={activityTypeColors[activity.type as keyof typeof activityTypeColors]}
              >
                {activity.type === 'lesson_completed' && 'Lección'}
                {activity.type === 'exam_completed' && 'Examen'}
                {activity.type === 'course_enrolled' && 'Curso'}
              </Badge>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(activity.date), { 
                  addSuffix: true, 
                  locale: es 
                })}
              </span>
            </div>
            <h4 className="font-semibold text-sm mb-1">{activity.title}</h4>
            <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
            {activity.metadata.competency && (
              <Badge variant="outline" className="text-xs">
                {activity.metadata.competency}
              </Badge>
            )}
          </div>
          {activity.actionUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.href = activity.actionUrl}
              className="flex-shrink-0"
            >
              Ver
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PerformanceCardProps {
  metric: any;
}

function PerformanceCard({ metric }: PerformanceCardProps) {
  const TrendIcon = trendIcons[metric.trend];
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>{metric.competencyName}</span>
          <div className="flex items-center gap-1">
            <TrendIcon className={`h-4 w-4 ${trendColors[metric.trend]}`} />
            <span className={`text-xs ${trendColors[metric.trend]}`}>
              {metric.trend === 'improving' && 'Mejorando'}
              {metric.trend === 'declining' && 'Bajando'}
              {metric.trend === 'stable' && 'Estable'}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Promedio de Puntajes</p>
            <p className="text-xs text-gray-400">En exámenes (0-100%)</p>
            <p className="text-lg font-semibold">{metric.averageScore}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Exámenes</p>
            <p className="text-lg font-semibold">{metric.examCount}</p>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Tasa de aprobación</span>
            <span>{metric.passRate}%</span>
          </div>
          <Progress value={metric.passRate} className="h-2" />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Progreso lecciones</span>
            <span>{metric.lessonProgress.averageProgress}%</span>
          </div>
          <Progress value={metric.lessonProgress.averageProgress} className="h-2" />
        </div>

        <div className="text-xs text-gray-500">
          <p>Lecciones: {metric.lessonProgress.completedLessons}/{metric.lessonProgress.totalLessons}</p>
          <p>Tiempo: {Math.round(metric.lessonProgress.totalTime / 60)}h</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ActivityHistory() {
  const [activeTab, setActiveTab] = useState('history');
  const [activityFilter, setActivityFilter] = useState('all');
  const [performancePeriod, setPerformancePeriod] = useState('30');
  
  const {
    activities,
    stats,
    performance,
    overallStats,
    loading,
    error,
    fetchActivityHistory,
    fetchPerformance,
  } = useActivityHistory();

  const handleActivityFilterChange = (value: string) => {
    setActivityFilter(value);
    fetchActivityHistory({ type: value === 'all' ? undefined : value });
  };

  const handlePerformancePeriodChange = (value: string) => {
    setPerformancePeriod(value);
    fetchPerformance({ period: parseInt(value) });
  };

  if (loading && !activities.length) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Cargando historial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-500">{error}</p>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Historial de Actividad</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          {/* Filtros y estadísticas */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={activityFilter} onValueChange={handleActivityFilterChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las actividades</SelectItem>
                  <SelectItem value="lessons">Solo lecciones</SelectItem>
                  <SelectItem value="exams">Solo exámenes</SelectItem>
                  <SelectItem value="courses">Solo cursos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Estadísticas generales */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalActivities}</div>
                  <div className="text-xs text-gray-500">Total Actividades</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.lessonsCompleted}</div>
                  <div className="text-xs text-gray-500">Lecciones</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.examsCompleted}</div>
                  <div className="text-xs text-gray-500">Exámenes</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{Math.round(stats.totalStudyTime / 60)}h</div>
                  <div className="text-xs text-gray-500">Tiempo Estudio</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Lista de actividades */}
          <ScrollArea className="h-96">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500">No hay actividades registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Filtros */}
          <div className="flex items-center gap-2">
            <Select value={performancePeriod} onValueChange={handlePerformancePeriodChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 90 días</SelectItem>
                <SelectItem value="365">Último año</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estadísticas generales de rendimiento */}
          {overallStats && (
            <TooltipProvider delayDuration={200}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="cursor-help">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{overallStats.totalExams}</div>
                        <div className="text-xs text-gray-500">Exámenes Presentados</div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
                    Cantidad total de exámenes que has presentado en el periodo seleccionado.{" "}
                    Incluye todos los intentos completados.
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="cursor-help">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{overallStats.averageScore}</div>
                        <div className="text-xs text-gray-500">Promedio de Puntajes</div>
                        <div className="text-xs text-gray-400">En exámenes (0-100%)</div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
                    Promedio de tus puntajes en exámenes dentro del periodo seleccionado.{" "}
                    Cada examen se expresa en porcentaje según tus respuestas correctas.
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="cursor-help">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{overallStats.totalLessonsCompleted}</div>
                        <div className="text-xs text-gray-500">Lecciones Completadas</div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
                    Número de lecciones que terminaste en el periodo seleccionado.{" "}
                    Solo se cuentan las que quedaron marcadas como completadas.
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="cursor-help">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">{Math.round(overallStats.totalStudyTime / 60)}h</div>
                        <div className="text-xs text-gray-500">Tiempo Total</div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
                    Tiempo total que dedicaste al estudio en la plataforma durante el periodo seleccionado.{" "}
                    Se calcula sumando los minutos registrados por lección.
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          )}

          {/* Rendimiento por competencia */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performance.map((metric) => (
              <PerformanceCard key={metric.competencyName} metric={metric} />
            ))}
          </div>

          {performance.length === 0 && (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">No hay datos de rendimiento disponibles</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
