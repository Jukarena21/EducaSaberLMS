'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompetencies } from '@/hooks/useCompetencies';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LessonData, LessonFormData } from '@/types/lesson';
import { ACADEMIC_YEARS, academicGradeToYear } from '@/lib/academicGrades';
import { RichTextEditor } from './RichTextEditor';
import { LessonContentViewer } from './LessonContentViewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Video, 
  FileText, 
  Settings, 
  Eye,
  Save,
  X,
  Clock,
  Tag,
  Award,
  BookMarked,
  ArrowRight
} from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';

interface LessonFormProps {
  lesson?: LessonData;
  onSubmit: (data: LessonFormData, id?: string) => Promise<void>;
  onCancel: () => void;
}

export function LessonForm({ lesson, onSubmit, onCancel }: LessonFormProps) {
  const { toast } = useToast();
  const { competencies } = useCompetencies();
  const isEditing = !!lesson;
  const [lessonTypeSelected, setLessonTypeSelected] = useState(!!lesson);
  
  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    description: '',
    estimatedTimeMinutes: 30,
    videoUrl: '',
    videoDescription: '',
    theoryContent: '',
    competencyId: null,
    isIcfesLesson: false,
    year: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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
    // variantes antiguas (para compatibilidad)
    'Matemáticas',
    'Ciencias Naturales',
    'Ciencias Sociales y Ciudadanas',
    'matematicas',
    'ciencias_naturales',
    'ciencias_sociales',
  ];

  // Obtener la competencia actual de la lección (si está editando)
  const currentLessonCompetency = useMemo(() => {
    if (lesson?.competencyId) {
      return competencies.find(c => c.id === lesson.competencyId);
    }
    return null;
  }, [lesson, competencies]);

  // Filtrar competencias según el tipo de lección
  const availableCompetencies = useMemo(() => {
    let filtered: typeof competencies = [];
    
    if (formData.isIcfesLesson) {
      // Si es ICFES, solo mostrar competencias ICFES
      filtered = competencies.filter(c => 
        icfesCompetencyNames.includes(c.name) || 
        icfesCompetencyNames.includes(c.displayName || '')
      );
    } else {
      // Si no es ICFES (General), solo mostrar competencias NO ICFES
      filtered = competencies.filter(c => 
        !icfesCompetencyNames.includes(c.name) && 
        !icfesCompetencyNames.includes(c.displayName || '')
      );
    }
    
    // Si estamos editando y la competencia actual no está en la lista filtrada, agregarla al inicio
    if (currentLessonCompetency && !filtered.some(c => c.id === currentLessonCompetency.id)) {
      filtered = [currentLessonCompetency, ...filtered];
    }
    
    return filtered;
  }, [competencies, formData.isIcfesLesson, currentLessonCompetency]);

  // Cargar datos de la lección si se está editando
  useEffect(() => {
    if (lesson) {
      // Convertir academicGrade a year si existe
      let year: number | undefined = undefined;
      if (lesson.academicGrade) {
        year = academicGradeToYear(lesson.academicGrade) || undefined;
      }
      
      // Determinar si es ICFES basado en academicGrade o modules
      const isIcfes = !!lesson.academicGrade || lesson.isIcfesCourse || false;
      
      // Asegurarse de que competencyId sea una cadena o null
      const competencyId = lesson.competencyId || lesson.modules?.[0]?.competency?.id || null;
      
      // Verificar que la competencia existe en la lista
      const competencyExists = competencyId ? competencies.some(c => c.id === competencyId) : false;
      
      console.log('📝 [LessonForm] Cargando lección para edición:', {
        lessonId: lesson.id,
        competencyId: competencyId,
        competencyExists: competencyExists,
        isIcfesLesson: isIcfes,
        availableCompetencies: competencies.length
      });
      
      if (competencyId && !competencyExists) {
        console.warn('⚠️ [LessonForm] La competencia de la lección no está en la lista de competencias disponibles');
      }
      
      setFormData({
        title: lesson.title || '',
        description: lesson.description || '',
        estimatedTimeMinutes: lesson.estimatedTimeMinutes || 30,
        videoUrl: lesson.videoUrl || '',
        videoDescription: lesson.videoDescription || '',
        theoryContent: lesson.theoryContent || '',
        competencyId: competencyId,
        isIcfesLesson: isIcfes,
        year: year,
      });
      setLessonTypeSelected(true);
    } else {
      setLessonTypeSelected(false);
    }
  }, [lesson, competencies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que si es ICFES, tenga año escolar y competencia
    if (formData.isIcfesLesson) {
      if (!formData.year) {
        toast({
          title: 'Error de validación',
          description: 'El año escolar es requerido para lecciones ICFES',
          variant: 'destructive',
        });
        return;
      }
      if (!formData.competencyId) {
        toast({
          title: 'Error de validación',
          description: 'La competencia es requerida',
          variant: 'destructive',
        });
        return;
      }
    } else {
      // Para lecciones generales, validar que tenga competencia
      if (!formData.competencyId) {
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
      await onSubmit(formData, lesson?.id);
      toast({
        title: lesson ? 'Lección actualizada' : 'Lección creada',
        description: lesson 
          ? 'La lección se ha actualizado correctamente.'
          : 'La lección se ha creado correctamente.',
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

  const handleInputChange = (field: keyof LessonFormData, value: string | number | null | undefined | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLessonTypeSelect = (isIcfes: boolean) => {
    setFormData(prev => ({
      ...prev,
      isIcfesLesson: isIcfes,
      competencyId: null, // Limpiar competencia al cambiar tipo
      year: undefined, // Limpiar año al cambiar tipo
    }));
    setLessonTypeSelected(true);
  };

  const handleBackToTypeSelection = () => {
    setLessonTypeSelected(false);
    setFormData(prev => ({
      ...prev,
      isIcfesLesson: false,
      competencyId: null,
      year: undefined,
    }));
  };

  // Tipos de lección disponibles
  const lessonTypes = [
    { 
      value: true, 
      label: 'Lección ICFES', 
      icon: Award, 
      color: 'blue',
      description: 'Lección orientada a la preparación para el examen ICFES. Requiere año escolar y competencia ICFES.'
    },
    { 
      value: false, 
      label: 'Lección General', 
      icon: BookMarked, 
      color: 'green',
      description: 'Lección general para cualquier tipo de contenido educativo. Solo requiere competencia NO ICFES.'
    },
  ];

  // Pantalla de selección de tipo de lección (solo para creación, no para edición)
  if (!isEditing && !lessonTypeSelected) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Selecciona el tipo de lección</CardTitle>
          <CardDescription className="text-center">
            Elige el tipo de lección que deseas crear
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {lessonTypes.map((type) => {
              const IconComponent = type.icon
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
                green: 'bg-green-100 text-green-600 group-hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400',
              }
              
              return (
                <button
                  key={type.value ? 'icfes' : 'general'}
                  onClick={() => handleLessonTypeSelect(type.value)}
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
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {isEditing ? 'Editar Lección' : `Crear ${formData.isIcfesLesson ? 'Lección ICFES' : 'Lección General'}`}
              </CardTitle>
              <CardDescription className="mt-1">
                {isEditing 
                  ? 'Modifica los datos de la lección'
                  : 'Completa la información para crear una nueva lección'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {formData.isIcfesLesson ? 'ICFES' : 'General'}
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onCancel}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Información Básica
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Video
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Contenido Teórico
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Resumen
            </TabsTrigger>
          </TabsList>

          {/* Información Básica */}
          <TabsContent value="basic" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información General</CardTitle>
                <CardDescription>
                  Datos básicos de la lección
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ej: Operaciones con polinomios"
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe brevemente el contenido de la lección"
                    rows={4}
                    required
                    className="resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimatedTimeMinutes" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Tiempo estimado (minutos) *
                    </Label>
                    <Input
                      id="estimatedTimeMinutes"
                      type="number"
                      min="1"
                      value={formData.estimatedTimeMinutes}
                      onChange={(e) => handleInputChange('estimatedTimeMinutes', parseInt(e.target.value) || 30)}
                      placeholder="30"
                      required
                    />
                  </div>
                </div>

                {/* Año escolar - Solo mostrar si es lección ICFES */}
                {formData.isIcfesLesson && (
                  <div className="space-y-2">
                    <Label htmlFor="year">Año escolar *</Label>
                    <Select
                      value={formData.year?.toString() || 'none'}
                      disabled={isEditing}
                      onValueChange={(value) => {
                        if (!isEditing) {
                          handleInputChange('year', value === 'none' ? undefined : parseInt(value));
                        }
                      }}
                    >
                      <SelectTrigger disabled={isEditing}>
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
                  <Label htmlFor="competencyId" className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Competencia *
                  </Label>
                  <Select
                    value={formData.competencyId && formData.competencyId !== null ? formData.competencyId : 'none'}
                    disabled={isEditing}
                    onValueChange={(value) => {
                      if (!isEditing) {
                        handleInputChange('competencyId', value === 'none' ? null : value);
                      }
                    }}
                  >
                    <SelectTrigger disabled={isEditing}>
                      <SelectValue placeholder="Seleccionar competencia">
                        {formData.competencyId && currentLessonCompetency
                          ? (currentLessonCompetency.displayName || currentLessonCompetency.name)
                          : formData.competencyId && availableCompetencies.find(c => c.id === formData.competencyId)
                          ? (availableCompetencies.find(c => c.id === formData.competencyId)?.displayName || availableCompetencies.find(c => c.id === formData.competencyId)?.name)
                          : 'Seleccionar competencia'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {!isEditing && <SelectItem value="none">Selecciona una competencia</SelectItem>}
                      {availableCompetencies.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.displayName || c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {formData.isIcfesLesson 
                      ? 'Solo se muestran competencias ICFES. Usada para filtrar lecciones en módulos y preguntas.'
                      : 'Solo se muestran competencias NO ICFES. Usada para filtrar lecciones en módulos y preguntas.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Video */}
          <TabsContent value="video" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Contenido de Video
                </CardTitle>
                <CardDescription>
                  Agrega un video complementario para la lección (opcional)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">URL del Video</Label>
                  <Input
                    id="videoUrl"
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Soporta YouTube, Vimeo y otros servicios de video
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoDescription">Descripción del Video</Label>
                  <Textarea
                    id="videoDescription"
                    value={formData.videoDescription}
                    onChange={(e) => handleInputChange('videoDescription', e.target.value)}
                    placeholder="Describe el contenido del video y su relación con la lección"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contenido Teórico */}
          <TabsContent value="content" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Contenido Teórico
                    </CardTitle>
                    <CardDescription>
                      Escribe el contenido teórico de la lección usando el editor enriquecido
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMode(prev => !prev)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {previewMode ? 'Editar' : 'Vista Previa'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {previewMode ? (
                  <div className="border rounded-lg p-6 bg-white min-h-[400px]">
                    <LessonContentViewer content={formData.theoryContent || '<p>Sin contenido</p>'} />
                  </div>
                ) : (
                  <RichTextEditor
                    content={formData.theoryContent}
                    onChange={(value) => handleInputChange('theoryContent', value)}
                    placeholder="Escribe el contenido teórico de la lección. Puedes usar formato, imágenes, listas y más..."
                    className="min-h-[400px]"
                  />
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  * Campo requerido. Usa el editor para formatear texto, agregar imágenes y crear contenido enriquecido.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resumen */}
          <TabsContent value="summary" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Resumen de la Lección
                </CardTitle>
                <CardDescription>
                  Revisa la información ingresada antes de guardar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Información General
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Título:</span>
                      <span className="font-medium">{formData.title || 'No definido'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tiempo estimado:</span>
                      <span className="font-medium">{formData.estimatedTimeMinutes} minutos</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium">{formData.isIcfesLesson ? 'ICFES' : 'General'}</span>
                    </div>
                    {formData.isIcfesLesson && formData.year && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Año escolar:</span>
                        <span className="font-medium">{formData.year}° Grado</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Competencia:</span>
                      <span className="font-medium">{availableCompetencies.find((c: any) => c.id === formData.competencyId)?.displayName || availableCompetencies.find((c: any) => c.id === formData.competencyId)?.name || 'Sin asignar'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Contenido Multimedia
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Video:</span>
                      <span className={`font-medium ${formData.videoUrl ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {formData.videoUrl ? 'Configurado' : 'No configurado'}
                      </span>
                    </div>
                    {formData.videoDescription && (
                      <div className="mt-2 pt-2 border-t">
                        <span className="text-muted-foreground text-xs">Descripción del video:</span>
                        <p className="text-xs mt-1">{formData.videoDescription}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Contenido Teórico
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estado:</span>
                      <span className={`font-medium ${formData.theoryContent ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {formData.theoryContent ? `${formData.theoryContent.length} caracteres` : 'Vacío'}
                      </span>
                    </div>
                    {formData.theoryContent && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Vista previa:</p>
                        <div className="text-xs prose prose-sm max-w-none line-clamp-3">
                          <LessonContentViewer content={formData.theoryContent.substring(0, 200) + '...'} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Botones de acción */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPreviewOpen(true)}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Vista Previa Completa
          </Button>
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
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar Lección' : 'Crear Lección')}
          </Button>
        </div>
      </form>

      {/* Dialog de Vista Previa Completa */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Vista Previa de la Lección</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden flex-1">
            <div className="lg:col-span-2 space-y-4 overflow-y-auto">
              <div>
                <h2 className="text-2xl font-bold">{formData.title || 'Título de la lección'}</h2>
                <p className="text-muted-foreground">{formData.description || 'Descripción de la lección'}</p>
                <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formData.estimatedTimeMinutes} minutos
                </div>
              </div>

              <Tabs defaultValue="theory" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="video">Video</TabsTrigger>
                  <TabsTrigger value="theory">Teoría</TabsTrigger>
                  <TabsTrigger value="exercises">Ejercicios</TabsTrigger>
                </TabsList>
                <TabsContent value="video" className="p-4 border rounded-lg bg-white min-h-[200px]">
                  {formData.videoUrl ? (
                    <div className="aspect-video w-full bg-black/5 flex items-center justify-center text-sm text-muted-foreground rounded-lg">
                      Vista previa del video (URL: {formData.videoUrl})
                    </div>
                  ) : (
                    <div className="text-muted-foreground">Sin video configurado</div>
                  )}
                  {formData.videoDescription && (
                    <p className="mt-2 text-sm text-muted-foreground">{formData.videoDescription}</p>
                  )}
                </TabsContent>
                <TabsContent value="theory" className="p-4 border rounded-lg bg-white">
                  <LessonContentViewer content={formData.theoryContent || '<p>Sin contenido</p>'} />
                </TabsContent>
                <TabsContent value="exercises" className="p-4 border rounded-lg bg-white min-h-[200px]">
                  <div className="text-muted-foreground text-sm">Sin ejercicios configurados</div>
                </TabsContent>
              </Tabs>
            </div>
            <div className="space-y-4 overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Progreso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mt-2 text-sm text-muted-foreground mb-3">Simulación (solo vista previa)</div>
                  <div className="h-2 bg-muted rounded">
                    <div className="h-2 bg-primary rounded" style={{ width: '75%' }} />
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <li>✓ Video visto</li>
                    <li>✓ Teoría leída</li>
                    <li>○ Ejercicios completados</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
