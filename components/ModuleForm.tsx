'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ModuleData, ModuleFormData } from '@/types/module';
import { useLessons } from '@/hooks/useLessons';
import { useCompetencies } from '@/hooks/useCompetencies';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ModuleFormProps {
  module?: ModuleData;
  onSubmit: (data: ModuleFormData) => Promise<void>;
  onCancel: () => void;
}

// Componente para elementos arrastrables
function SortableLessonItem({ 
  lessonId, 
  orderIndex, 
  lesson, 
  onRemove 
}: { 
  lessonId: string; 
  orderIndex: number; 
  lesson: any; 
  onRemove: (lessonId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: lessonId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border cursor-move hover:bg-muted/50"
    >
      <div className="flex items-center space-x-3">
        <div className="text-sm text-muted-foreground">⋮⋮</div>
        <div>
          <div className="font-medium">{lesson.title}</div>
          <div className="text-sm text-muted-foreground">
            {lesson.estimatedTimeMinutes} min
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="text-sm text-primary font-medium">
          Orden: {orderIndex}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(lessonId)}
          className="text-destructive hover:text-destructive"
        >
          ×
        </Button>
      </div>
    </div>
  );
}

export function ModuleForm({ module, onSubmit, onCancel }: ModuleFormProps) {
  const { toast } = useToast();
  const { lessons, loading: lessonsLoading, fetchLessons } = useLessons();
  const { competencies } = useCompetencies();
  
  const [formData, setFormData] = useState<ModuleFormData>({
    title: '',
    description: '',
    estimatedTime: 120,
    competencyId: 'none',
    selectedLessons: [],
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('title');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Cargar lecciones al montar el componente
  useEffect(() => {
    fetchLessons();
  }, []); // Solo se ejecuta una vez al montar

  // Cargar datos del módulo si se está editando
  useEffect(() => {
    if (module) {
      setFormData({
        title: module.title,
        description: module.description,
        estimatedTime: module.estimatedTime,
        competencyId: module.competencyId || 'none',
        selectedLessons: module.lessons?.map(lesson => ({
          lessonId: lesson.id,
          orderIndex: lesson.orderIndex
        })) || [],
      });
    }
  }, [module]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convertir "none" a string vacío para el servidor
      const submitData = {
        ...formData,
        competencyId: formData.competencyId === "none" ? "" : formData.competencyId
      };
      
      await onSubmit(submitData);
      toast({
        title: module ? 'Módulo actualizado' : 'Módulo creado',
        description: module 
          ? 'El módulo se ha actualizado correctamente.'
          : 'El módulo se ha creado correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Omit<ModuleFormData, 'selectedLessons'>, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLessonToggle = (lessonId: string, checked: boolean) => {
    if (checked) {
      // Agregar lección al final de la lista
      const newOrderIndex = formData.selectedLessons.length + 1;
      setFormData(prev => ({
        ...prev,
        selectedLessons: [...prev.selectedLessons, { lessonId, orderIndex: newOrderIndex }]
      }));
    } else {
      // Remover lección y reordenar
      setFormData(prev => {
        const filtered = prev.selectedLessons.filter(lesson => lesson.lessonId !== lessonId);
        return {
          ...prev,
          selectedLessons: filtered.map((lesson, index) => ({
            ...lesson,
            orderIndex: index + 1
          }))
        };
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setFormData(prev => {
        const oldIndex = prev.selectedLessons.findIndex(lesson => lesson.lessonId === active.id);
        const newIndex = prev.selectedLessons.findIndex(lesson => lesson.lessonId === over?.id);

        const reorderedLessons = arrayMove(prev.selectedLessons, oldIndex, newIndex);
        
        // Reordenar con nuevos índices
        return {
          ...prev,
          selectedLessons: reorderedLessons.map((lesson, index) => ({
            ...lesson,
            orderIndex: index + 1
          }))
        };
      });
    }
  };

  const handleRemoveLesson = (lessonId: string) => {
    setFormData(prev => {
      const filtered = prev.selectedLessons.filter(lesson => lesson.lessonId !== lessonId);
      return {
        ...prev,
        selectedLessons: filtered.map((lesson, index) => ({
          ...lesson,
          orderIndex: index + 1
        }))
      };
    });
  };

  const isLessonSelected = (lessonId: string) => {
    return formData.selectedLessons.some(lesson => lesson.lessonId === lessonId);
  };

  const getLessonOrder = (lessonId: string) => {
    const lesson = formData.selectedLessons.find(l => l.lessonId === lessonId);
    return lesson ? lesson.orderIndex : 0;
  };

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearchTerm = !searchTerm || 
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTimeFilter = timeFilter === 'all' || 
      (lesson.estimatedTimeMinutes < 30 && timeFilter === 'short') ||
      (lesson.estimatedTimeMinutes >= 30 && lesson.estimatedTimeMinutes < 60 && timeFilter === 'medium') ||
      (lesson.estimatedTimeMinutes >= 60 && timeFilter === 'long');

    const matchesCompetency = formData.competencyId === 'none' || !formData.competencyId 
      ? true 
      : (lesson.competencyId === formData.competencyId || lesson.modules.some((m:any) => m.competency?.id === formData.competencyId));
    
    return matchesSearchTerm && matchesTimeFilter && matchesCompetency;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'time':
        return (a.estimatedTimeMinutes || 0) - (b.estimatedTimeMinutes || 0);
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{module ? 'Editar Módulo' : 'Crear Nuevo Módulo'}</CardTitle>
        <CardDescription>
          {module 
            ? 'Modifica los datos del módulo y gestiona sus lecciones'
            : 'Completa la información y selecciona las lecciones para el módulo'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna izquierda - Información básica */}
            <div className="space-y-6">
              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ej: Álgebra y funciones"
                  required
                />
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe brevemente el contenido del módulo"
                  rows={4}
                  required
                />
              </div>

              {/* Tiempo estimado */}
              <div className="space-y-2">
                <Label htmlFor="estimatedTime">Tiempo estimado (minutos) *</Label>
                <Input
                  id="estimatedTime"
                  type="number"
                  min="1"
                  value={formData.estimatedTime}
                  onChange={(e) => handleInputChange('estimatedTime', parseInt(e.target.value))}
                  placeholder="120"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Tiempo total estimado para completar todas las lecciones del módulo
                </p>
              </div>

              {/* Competencia */}
              <div className="space-y-2">
                <Label htmlFor="competencyId">Competencia</Label>
                <Select
                  value={formData.competencyId}
                  onValueChange={(value) => handleInputChange('competencyId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar competencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin competencia</SelectItem>
                    {competencies.map((competency) => (
                      <SelectItem key={competency.id} value={competency.id}>
                        {competency.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Competencia ICFES a la que pertenece este módulo
                </p>
              </div>

              {/* Información adicional */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Información del módulo</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Los módulos son creados por Profesores Administradores</p>
                  <p>• Los Administradores de Colegio pueden seleccionar módulos para sus cursos</p>
                  <p>• El orden de las lecciones se puede ajustar arrastrando y soltando</p>
                  <p>• No se puede eliminar un módulo que esté siendo usado en cursos</p>
                </div>
              </div>
            </div>

            {/* Columna derecha - Selección de lecciones */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Lecciones del módulo ({formData.selectedLessons.length})</Label>
                <p className="text-sm text-muted-foreground">
                  Selecciona las lecciones que conformarán este módulo
                </p>
              </div>

              {/* Filtros de búsqueda */}
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Buscar lecciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Tiempo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="short">0-30 min</SelectItem>
                      <SelectItem value="medium">30-60 min</SelectItem>
                      <SelectItem value="long">60+ min</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Por título</SelectItem>
                      <SelectItem value="time">Por tiempo</SelectItem>
                      <SelectItem value="date">Por fecha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  {searchTerm && (
                    <div className="text-sm text-muted-foreground">
                      Buscando: "{searchTerm}" • {filteredLessons.length} lecciones encontradas
                    </div>
                  )}
                  {(searchTerm !== '' || timeFilter !== 'all' || sortBy !== 'title') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setTimeFilter('all');
                        setSortBy('title');
                      }}
                      className="text-xs"
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              </div>

              {lessonsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Cargando lecciones...</p>
                </div>
              ) : (
                <>
                  {/* Lista de lecciones disponibles */}
                  <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
                    {filteredLessons.map((lesson) => (
                      <div key={lesson.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
                        <Checkbox
                          id={`lesson-${lesson.id}`}
                          checked={isLessonSelected(lesson.id)}
                          onCheckedChange={(checked) => handleLessonToggle(lesson.id, checked as boolean)}
                        />
                        <Label htmlFor={`lesson-${lesson.id}`} className="flex-1 cursor-pointer">
                          <div className="font-medium">{lesson.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {lesson.description.substring(0, 60)}...
                          </div>
                        </Label>
                        {isLessonSelected(lesson.id) && (
                          <div className="text-sm text-primary font-medium">
                            Orden: {getLessonOrder(lesson.id)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Lecciones seleccionadas con orden */}
                  {formData.selectedLessons.length > 0 && (
                    <div className="space-y-2">
                      <Label>Orden de las lecciones</Label>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={formData.selectedLessons.map(l => l.lessonId)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {formData.selectedLessons.map((selectedLesson) => {
                              const lesson = lessons.find(l => l.id === selectedLesson.lessonId);
                              if (!lesson) return null;
                              
                              return (
                                <SortableLessonItem
                                  key={selectedLesson.lessonId}
                                  lessonId={selectedLesson.lessonId}
                                  orderIndex={selectedLesson.orderIndex}
                                  lesson={lesson}
                                  onRemove={handleRemoveLesson}
                                />
                              );
                            })}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || lessonsLoading}
            >
              {loading ? 'Guardando...' : (module ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 