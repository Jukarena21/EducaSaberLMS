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
import { ModuleData } from '@/types/module';
import { RichTextEditor } from './RichTextEditor';
import { LessonContentViewer } from './LessonContentViewer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LessonFormProps {
  lesson?: LessonData;
  onSubmit: (data: LessonFormData, id?: string) => Promise<void>;
  onCancel: () => void;
}

export function LessonForm({ lesson, onSubmit, onCancel }: LessonFormProps) {
  const { toast } = useToast();
  const { competencies } = useCompetencies();
  const [formData, setFormData] = useState<LessonFormData>({
    title: '',
    description: '',
    estimatedTimeMinutes: 30,
    videoUrl: '',
    videoDescription: '',
    theoryContent: '',
    competencyId: null,
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Cargar datos de la lección si se está editando
  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title,
        description: lesson.description,
        estimatedTimeMinutes: lesson.estimatedTimeMinutes,
        videoUrl: lesson.videoUrl || '',
        videoDescription: lesson.videoDescription || '',
        theoryContent: lesson.theoryContent,
        competencyId: lesson.competencyId || lesson.modules[0]?.competency?.id || null,
      });
    }
  }, [lesson]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Enviando datos del formulario:', formData);
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

  const handleInputChange = (field: keyof LessonFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{lesson ? 'Editar Lección' : 'Crear Nueva Lección'}</CardTitle>
        <CardDescription>
          {lesson 
            ? 'Modifica los datos de la lección'
            : 'Completa la información para crear una nueva lección'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Ej: Operaciones con polinomios"
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
              placeholder="Describe brevemente el contenido de la lección"
              rows={3}
              required
            />
          </div>

          {/* Tiempo estimado */}
          <div className="space-y-2">
            <Label htmlFor="estimatedTimeMinutes">Tiempo estimado (minutos) *</Label>
            <Input
              id="estimatedTimeMinutes"
              type="number"
              min="1"
              value={formData.estimatedTimeMinutes}
              onChange={(e) => handleInputChange('estimatedTimeMinutes', parseInt(e.target.value))}
              placeholder="30"
              required
            />
          </div>

          {/* URL del video */}
          <div className="space-y-2">
            <Label htmlFor="videoUrl">URL del video</Label>
            <Input
              id="videoUrl"
              type="url"
              value={formData.videoUrl}
              onChange={(e) => handleInputChange('videoUrl', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          {/* Descripción del video */}
          <div className="space-y-2">
            <Label htmlFor="videoDescription">Descripción del video</Label>
            <Textarea
              id="videoDescription"
              value={formData.videoDescription}
              onChange={(e) => handleInputChange('videoDescription', e.target.value)}
              placeholder="Describe el contenido del video"
              rows={2}
            />
          </div>

          {/* Contenido teórico */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="theoryContent">Contenido teórico *</Label>
              <div className="flex items-center gap-2 text-sm">
                <span className={previewMode ? 'text-muted-foreground' : 'font-medium'}>Editar</span>
                <button
                  type="button"
                  onClick={() => setPreviewMode(prev => !prev)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted transition-colors"
                  aria-label="Cambiar vista"
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform ${previewMode ? 'translate-x-5' : 'translate-x-1'}`}
                  />
                </button>
                <span className={previewMode ? 'font-medium' : 'text-muted-foreground'}>Previsualizar</span>
              </div>
            </div>

            {previewMode ? (
              <div className="border rounded-lg p-4 bg-white">
                <LessonContentViewer content={formData.theoryContent} />
              </div>
            ) : (
              <RichTextEditor
                content={formData.theoryContent}
                onChange={(value) => handleInputChange('theoryContent', value)}
                placeholder="Escribe el contenido teórico de la lección..."
              />
            )}
          </div>

          {/* Competencia */}
          <div className="space-y-2">
            <Label htmlFor="competencyId">Competencia</Label>
            <Select
              value={formData.competencyId || 'none'}
              onValueChange={(value) => handleInputChange('competencyId', value === 'none' ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar competencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin competencia</SelectItem>
                {competencies.map((c:any) => (
                  <SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Usada para filtrar lecciones en módulos y preguntas.</p>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPreviewOpen(true)}
              disabled={loading}
            >
              Vista previa
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
            >
              {loading ? 'Guardando...' : (lesson ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </CardContent>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col top-4 translate-y-0">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Vista previa de la lección</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden flex-1">
            <div className="lg:col-span-2 space-y-4 overflow-y-auto">
              <div>
                <h2 className="text-2xl font-bold">{formData.title || 'Título de la lección'}</h2>
                <p className="text-muted-foreground">{formData.description || 'Descripción de la lección'}</p>
                <div className="mt-2 text-sm text-muted-foreground">{formData.estimatedTimeMinutes} minutos</div>
              </div>

              <Tabs defaultValue="theory" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="video">Video</TabsTrigger>
                  <TabsTrigger value="theory">Teoría</TabsTrigger>
                  <TabsTrigger value="exercises">Ejercicios</TabsTrigger>
                </TabsList>
                <TabsContent value="video" className="p-4 border rounded-lg bg-white min-h-[200px]">
                  {formData.videoUrl ? (
                    <div className="aspect-video w-full bg-black/5 flex items-center justify-center text-sm text-muted-foreground">
                      Vista previa del video (URL: {formData.videoUrl})
                    </div>
                  ) : (
                    <div className="text-muted-foreground">Sin video</div>
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
              <div className="border rounded-lg p-4">
                <h4 className="font-medium">Progreso de la Lección</h4>
                <div className="mt-2 text-sm text-muted-foreground">Simulación (solo vista previa)</div>
                <div className="mt-3 h-2 bg-muted rounded">
                  <div className="h-2 bg-primary rounded" style={{ width: '75%' }} />
                </div>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <li>✓ Video visto</li>
                  <li>✓ Teoría leída</li>
                  <li>○ Ejercicios completados</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium">Navegación</h4>
                <div className="mt-2 flex flex-col gap-2">
                  <Button variant="outline" size="sm">Volver al Curso</Button>
                  <Button variant="outline" size="sm">Lección Anterior</Button>
                  <Button variant="outline" size="sm">Siguiente Lección</Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 