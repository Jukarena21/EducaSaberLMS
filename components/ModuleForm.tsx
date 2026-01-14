'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ModuleData, ModuleFormData } from '@/types/module';
import { useLessons } from '@/hooks/useLessons';
import { useCompetencies } from '@/hooks/useCompetencies';
import { Award, BookMarked, ArrowRight } from 'lucide-react';
import { useMemo } from 'react';
import { ACADEMIC_YEARS, yearToAcademicGrade, academicGradeToYear } from '@/lib/academicGrades';
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
  
  const isEditing = !!module;
  const [moduleTypeSelected, setModuleTypeSelected] = useState(!!module);
  
  const [formData, setFormData] = useState<ModuleFormData>({
    title: '',
    description: '',
    estimatedTime: 120,
    competencyId: 'none',
    isIcfesModule: false,
    year: undefined,
    selectedLessons: [],
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('title');
  const [activeTab, setActiveTab] = useState<'info' | 'lessons'>('info');
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [lastFetchedCompetency, setLastFetchedCompetency] = useState<string | undefined>(undefined);

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

  useEffect(() => {
    const competencyFilter = formData.competencyId && formData.competencyId !== 'none'
      ? formData.competencyId
      : undefined;
    if (competencyFilter !== lastFetchedCompetency) {
      fetchLessons(competencyFilter ? { competencyId: competencyFilter } : {}, { skipCache: false });
      setLastFetchedCompetency(competencyFilter);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.competencyId, lastFetchedCompetency]);

  // Competencias ICFES (nombres exactos)
  const icfesCompetencyNames = [
    'Lectura Crítica',
    'Razonamiento Cuantitativo',
    'Competencias Ciudadanas',
    'Comunicación Escrita',
    'Inglés',
    // slugs / nombres internos
    'lectura_critica',
    'razonamiento_cuantitativo',
    'competencias_ciudadanas',
    'comunicacion_escrita',
    'ingles',
    // variantes antiguas
    'Matemáticas',
    'Ciencias Naturales',
    'Ciencias Sociales y Ciudadanas',
    'matematicas',
    'ciencias_naturales',
    'ciencias_sociales',
  ];

  // Filtrar competencias según el tipo de módulo
  const availableCompetencies = useMemo(() => {
    if (formData.isIcfesModule) {
      // Si es ICFES, solo mostrar competencias ICFES
      return competencies.filter(c => 
        icfesCompetencyNames.includes(c.name) || 
        icfesCompetencyNames.includes(c.displayName || '')
      );
    }
    // Si no es ICFES (General), solo mostrar competencias NO ICFES
    return competencies.filter(c => 
      !icfesCompetencyNames.includes(c.name) && 
      !icfesCompetencyNames.includes(c.displayName || '')
    );
  }, [competencies, formData.isIcfesModule]);

  // Cargar datos del módulo si se está editando
  useEffect(() => {
    if (module) {
      // Convertir academicGrade a year si existe
      let year: number | undefined = undefined;
      if (module.academicGrade) {
        year = academicGradeToYear(module.academicGrade) || undefined;
      }
      
      setFormData({
        title: module.title,
        description: module.description,
        estimatedTime: module.estimatedTime,
        competencyId: module.competency?.id || module.competencyId || 'none',
        isIcfesModule: module.isIcfesModule ?? false,
        year: year,
        selectedLessons: module.lessons?.map(lesson => ({
          lessonId: lesson.id,
          orderIndex: lesson.orderIndex
        })) || [],
      });
      setModuleTypeSelected(true);
    } else {
      setModuleTypeSelected(false);
    }
  }, [module]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que si es ICFES, tenga año escolar y competencia
    if (formData.isIcfesModule) {
      if (!formData.year) {
        toast({
          title: 'Error de validación',
          description: 'El año escolar es requerido para módulos ICFES',
          variant: 'destructive',
        });
        return;
      }
      if (!formData.competencyId || formData.competencyId === 'none') {
        toast({
          title: 'Error de validación',
          description: 'La competencia es requerida',
          variant: 'destructive',
        });
        return;
      }
    } else {
      // Para módulos generales, validar que tenga competencia
      if (!formData.competencyId || formData.competencyId === 'none') {
        toast({
          title: 'Error de validación',
          description: 'La competencia es requerida',
          variant: 'destructive',
        });
        return;
      }
    }
    
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

  const handleInputChange = (field: keyof Omit<ModuleFormData, 'selectedLessons'>, value: string | number | undefined) => {
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
    const searchValue = searchTerm.toLowerCase();
    const matchesSearchTerm = !searchTerm || 
      lesson.title.toLowerCase().includes(searchValue) ||
      (lesson.description?.toLowerCase().includes(searchValue) ?? false);
    
    const matchesTimeFilter = timeFilter === 'all' || 
      (lesson.estimatedTimeMinutes < 30 && timeFilter === 'short') ||
      (lesson.estimatedTimeMinutes >= 30 && lesson.estimatedTimeMinutes < 60 && timeFilter === 'medium') ||
      (lesson.estimatedTimeMinutes >= 60 && timeFilter === 'long');

    // Filtrar por competencia (debe coincidir con la competencia seleccionada)
    const matchesCompetency = formData.competencyId === 'none' || !formData.competencyId 
      ? true 
      : (lesson.competencyId === formData.competencyId || lesson.modules.some((m:any) => m.competency?.id === formData.competencyId));
    
    // Filtrar por año escolar si es ICFES y hay año seleccionado
    let matchesYear = true;
    if (formData.isIcfesModule && formData.year) {
      const expectedAcademicGrade = yearToAcademicGrade(formData.year);
      // Verificar si la lección tiene el mismo academicGrade
      matchesYear = lesson.academicGrade === expectedAcademicGrade || !lesson.academicGrade;
    }
    
    const matchesAssignment = !showUnassignedOnly || (lesson.modules?.length ?? 0) === 0;
    
    return matchesSearchTerm && matchesTimeFilter && matchesCompetency && matchesYear && matchesAssignment;
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

  const selectedLessonsDetailed = formData.selectedLessons.map(selected => {
    const lesson = lessons.find(l => l.id === selected.lessonId);
    return {
      ...selected,
      estimatedTime: lesson?.estimatedTimeMinutes || 0
    };
  });

  const totalSelectedLessons = selectedLessonsDetailed.length;
  const totalSelectedTime = selectedLessonsDetailed.reduce((acc, lesson) => acc + lesson.estimatedTime, 0);
  const averageSelectedTime = totalSelectedLessons > 0 ? Math.round(totalSelectedTime / totalSelectedLessons) : 0;
  const availableLessonsCount = filteredLessons.length;
  const unassignedLessonsCount = lessons.filter(lesson => (lesson.modules?.length ?? 0) === 0).length;

  const handleModuleTypeSelect = (isIcfes: boolean) => {
    setFormData(prev => ({
      ...prev,
      isIcfesModule: isIcfes,
      competencyId: 'none', // Limpiar competencia al cambiar tipo
      year: undefined, // Limpiar año al cambiar tipo
      selectedLessons: [], // Limpiar lecciones al cambiar tipo
    }));
    setModuleTypeSelected(true);
  };

  const handleBackToTypeSelection = () => {
    setModuleTypeSelected(false);
    setFormData(prev => ({
      ...prev,
      isIcfesModule: false,
      competencyId: 'none',
      year: undefined,
      selectedLessons: [],
    }));
  };

  // Tipos de módulo disponibles
  const moduleTypes = [
    { 
      value: true, 
      label: 'Módulo ICFES', 
      icon: Award, 
      color: 'blue',
      description: 'Módulo orientado a la preparación para el examen ICFES. Requiere año escolar y competencia ICFES.'
    },
    { 
      value: false, 
      label: 'Módulo General', 
      icon: BookMarked, 
      color: 'green',
      description: 'Módulo general para cualquier tipo de contenido educativo. Solo requiere competencia NO ICFES.'
    },
  ];

  // Pantalla de selección de tipo de módulo (solo para creación, no para edición)
  if (!isEditing && !moduleTypeSelected) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Selecciona el tipo de módulo</CardTitle>
          <CardDescription className="text-center">
            Elige el tipo de módulo que deseas crear
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {moduleTypes.map((type) => {
              const IconComponent = type.icon
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
                green: 'bg-green-100 text-green-600 group-hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400',
              }
              
              return (
                <button
                  key={type.value ? 'icfes' : 'general'}
                  onClick={() => handleModuleTypeSelect(type.value)}
                  className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer text-left group h-full flex flex-col"
                >
                  <div className="flex flex-col items-center space-y-4 flex-1">
                    <div className={`p-4 rounded-full transition-colors ${colorClasses[type.color as keyof typeof colorClasses]}`}>
                      <IconComponent className="h-10 w-10" />
                    </div>
                    <div className="text-center space-y-2 flex-1">
                      <h3 className="font-semibold text-lg">{type.label}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {type.description}
                      </p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors mt-2" />
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{module ? 'Editar Módulo' : `Crear ${formData.isIcfesModule ? 'Módulo ICFES' : 'Módulo General'}`}</CardTitle>
            <CardDescription>
              {module 
                ? 'Modifica los datos del módulo y gestiona sus lecciones'
                : 'Completa la información y selecciona las lecciones para el módulo'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {formData.isIcfesModule ? 'ICFES' : 'General'}
            </Badge>
            {!isEditing && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToTypeSelection}
                className="text-xs"
              >
                Cambiar Tipo
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Lecciones seleccionadas</p>
              <p className="text-2xl font-semibold mt-1">{totalSelectedLessons}</p>
              <p className="text-xs text-muted-foreground mt-2">Puedes arrastrar para reordenar en la pestaña "Lecciones"</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Tiempo acumulado</p>
              <p className="text-2xl font-semibold mt-1">{totalSelectedTime} min</p>
              <p className="text-xs text-muted-foreground mt-2">{averageSelectedTime || 0} min promedio por lección</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm text-muted-foreground">Lecciones disponibles</p>
              <p className="text-2xl font-semibold mt-1">{availableLessonsCount}</p>
              <p className="text-xs text-muted-foreground mt-2">{unassignedLessonsCount} sin asignar a ningún módulo</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'info' | 'lessons')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Información básica</TabsTrigger>
              <TabsTrigger value="lessons">Lecciones</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    Tiempo total estimado para completar todas las lecciones del módulo.
                  </p>
                </div>
              </div>

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

              {/* Año escolar - Solo mostrar si es módulo ICFES */}
              {formData.isIcfesModule && (
                <div className="space-y-2">
                  <Label htmlFor="year">Año escolar *</Label>
                  <Select
                    value={formData.year?.toString() || 'none'}
                    onValueChange={(value) => handleInputChange('year', value === 'none' ? undefined : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el año" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Selecciona el año</SelectItem>
                      {ACADEMIC_YEARS.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}° Grado
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="competencyId">Competencia *</Label>
                <Select
                  value={formData.competencyId || 'none'}
                  onValueChange={(value) => handleInputChange('competencyId', value)}
                  disabled={isEditing} // En edición no se cambia competencia
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar competencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecciona una competencia</SelectItem>
                    {availableCompetencies.map((competency) => (
                      <SelectItem key={competency.id} value={competency.id}>
                        {competency.displayName || competency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {formData.isIcfesModule 
                    ? 'Solo se muestran competencias ICFES. Usamos esta información para filtrar lecciones relacionadas y generar reportes ICFES.'
                    : 'Solo se muestran competencias NO ICFES. Usamos esta información para filtrar lecciones relacionadas.'}
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Recordatorios</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Los módulos son creados por Profesores Administradores.</p>
                  <p>• Puedes reutilizar lecciones en varios módulos si lo necesitas.</p>
                  <p>• El orden de las lecciones se define arrastrando en la pestaña "Lecciones".</p>
                  <p>• No se puede eliminar un módulo que esté en uso por cursos activos.</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lessons" className="pt-6 space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col lg:flex-row gap-3">
                  <Input
                    placeholder="Buscar lecciones..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="lg:w-40">
                      <SelectValue placeholder="Tiempo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tiempos</SelectItem>
                      <SelectItem value="short">0-30 min</SelectItem>
                      <SelectItem value="medium">30-60 min</SelectItem>
                      <SelectItem value="long">60+ min</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="lg:w-40">
                      <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Por título</SelectItem>
                      <SelectItem value="time">Por tiempo</SelectItem>
                      <SelectItem value="date">Por fecha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="unassigned-toggle"
                      checked={showUnassignedOnly}
                      onCheckedChange={setShowUnassignedOnly}
                    />
                    <Label htmlFor="unassigned-toggle" className="text-sm cursor-pointer">
                      Mostrar solo lecciones sin módulo
                    </Label>
                  </div>
                  {(searchTerm !== '' || timeFilter !== 'all' || sortBy !== 'title' || showUnassignedOnly) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setTimeFilter('all');
                        setSortBy('title');
                        setShowUnassignedOnly(false);
                      }}
                      className="text-xs"
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {lessonsLoading
                    ? 'Buscando lecciones...'
                    : `${availableLessonsCount} lecciones disponibles para esta combinación de filtros`}
                </div>
              </div>

              {lessonsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Cargando lecciones...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
                    {filteredLessons.length === 0 ? (
                      <div className="text-center text-sm text-muted-foreground py-6">
                        No encontramos lecciones con los filtros seleccionados.
                      </div>
                    ) : (
                      filteredLessons.map((lesson) => (
                        <div key={lesson.id} className="flex items-start space-x-3 p-3 hover:bg-muted/40 rounded">
                          <Checkbox
                            id={`lesson-${lesson.id}`}
                            checked={isLessonSelected(lesson.id)}
                            onCheckedChange={(checked) => handleLessonToggle(lesson.id, checked as boolean)}
                          />
                          <Label htmlFor={`lesson-${lesson.id}`} className="flex-1 cursor-pointer space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium">{lesson.title}</div>
                              {lesson.modules?.length ? (
                                <Badge variant="outline" className="text-[10px]">
                                  En {lesson.modules.length} módulo(s)
                                </Badge>
                              ) : null}
                            </div>
                            {lesson.description && (
                              <div className="text-sm text-muted-foreground">
                                {lesson.description.length > 80
                                  ? `${lesson.description.slice(0, 80)}...`
                                  : lesson.description}
                              </div>
                            )}
                          </Label>
                          <div className="text-right text-xs text-muted-foreground">
                            <div>{lesson.estimatedTimeMinutes} min</div>
                            {isLessonSelected(lesson.id) && (
                              <div className="text-primary font-medium">
                                Orden {getLessonOrder(lesson.id)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Orden de las lecciones ({totalSelectedLessons})</Label>
                      {totalSelectedLessons > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Arrastra y suelta las tarjetas para reordenar.
                        </p>
                      )}
                    </div>
                    {formData.selectedLessons.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center py-6 border rounded-lg">
                        Aún no has seleccionado lecciones para este módulo.
                      </div>
                    ) : (
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
                    )}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

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