'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { QuestionFormData, QuestionFormProps } from '@/types/question';
import { ImageUpload } from './ImageUpload';
import { QuestionPreview } from './QuestionPreview';
import { 
  Save, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Clock,
  Image as ImageIcon,
  FileText,
  CheckCircle
} from 'lucide-react';

export function QuestionFormNew({ 
  question, 
  competencies, 
  lessons, 
  onSubmit, 
  onCancel, 
  loading = false 
}: QuestionFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<QuestionFormData>({
    lessonId: '',
    questionText: '',
    questionImage: '',
    questionType: 'multiple_choice',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    optionAImage: '',
    optionBImage: '',
    optionCImage: '',
    optionDImage: '',
    correctOption: 'A',
    explanation: '',
    explanationImage: '',
    orderIndex: 1, // Se generará automáticamente en el backend
    difficultyLevel: 'medio',
    timeLimit: undefined,
  });

  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<'exam' | 'lesson' | 'admin'>('admin');

  const isEditing = !!question;

  useEffect(() => {
    if (question) {
      setFormData(question);
    }
  }, [question]);

  // Actualizar formulario cuando cambie el tipo de pregunta
  useEffect(() => {
    // Si cambias el tipo de pregunta, ajustar las opciones según el tipo
    if (formData.questionType === 'true_false') {
      // Para verdadero/falso, solo necesitamos 2 opciones
      setFormData(prev => ({
        ...prev,
        optionC: '',
        optionD: '',
        correctOption: prev.correctOption === 'C' || prev.correctOption === 'D' ? 'A' : prev.correctOption
      }));
    } else if (formData.questionType === 'essay') {
      // Para ensayo, no necesitamos opciones múltiples
      setFormData(prev => ({
        ...prev,
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctOption: 'A'
      }));
    } else if (formData.questionType === 'fill_blank') {
      // Para completar, ajustar las opciones
      setFormData(prev => ({
        ...prev,
        optionA: prev.optionA || 'Respuesta correcta',
        optionB: prev.optionB || 'Alternativa 1',
        optionC: prev.optionC || 'Alternativa 2',
        optionD: prev.optionD || 'Alternativa 3'
      }));
    }
  }, [formData.questionType]);

  const handleInputChange = (field: keyof QuestionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.lessonId) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar una lección',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.questionText.trim()) {
      toast({
        title: 'Error',
        description: 'El enunciado de la pregunta es requerido',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.optionA.trim() || !formData.optionB.trim() || 
        !formData.optionC.trim() || !formData.optionD.trim()) {
      toast({
        title: 'Error',
        description: 'Todas las opciones de respuesta son requeridas',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting question:', error);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'facil': return 'bg-green-100 text-green-700';
      case 'medio': return 'bg-yellow-100 text-yellow-700';
      case 'dificil': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'Opción Múltiple';
      case 'true_false': return 'Verdadero/Falso';
      case 'fill_blank': return 'Completar';
      case 'matching': return 'Emparejar';
      case 'essay': return 'Ensayo';
      default: return type;
    }
  };

  // Filtrar lecciones por competencia seleccionada en settings (si QuestionForm recibe competencies y planeas filtrar a futuro)
  const filteredLessons = lessons;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {isEditing ? 'Editar Pregunta' : 'Crear Nueva Pregunta'}
              </CardTitle>
              <CardDescription>
                {isEditing 
                  ? 'Modifica los datos de la pregunta' 
                  : 'Completa la información para crear una nueva pregunta'
                }
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={getDifficultyColor(formData.difficultyLevel)}>
                {formData.difficultyLevel}
              </Badge>
              <Badge variant="outline">
                {getQuestionTypeLabel(formData.questionType)}
              </Badge>
              {formData.timeLimit && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formData.timeLimit}s
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="form" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="form" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Formulario
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Vista Previa
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Configuración
              </TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="space-y-6 mt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Selección de lección */}
                <div className="space-y-2">
                  <Label htmlFor="lessonId">Lección</Label>
                  <Select 
                    value={formData.lessonId || 'none'} 
                    onValueChange={(value) => handleInputChange('lessonId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una lección (o Sin asignar)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {filteredLessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          {lesson.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Enunciado de la pregunta */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="questionText">Enunciado de la pregunta *</Label>
                    <Textarea
                      id="questionText"
                      value={formData.questionText}
                      onChange={(e) => handleInputChange('questionText', e.target.value)}
                      placeholder="Escribe el enunciado de la pregunta..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <ImageUpload
                    value={formData.questionImage}
                    onChange={(url) => handleInputChange('questionImage', url)}
                    placeholder="Subir imagen para el enunciado (opcional)"
                    className="max-w-md"
                  />
                </div>

                {/* Opciones de respuesta */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    {formData.questionType === 'essay' ? 'Criterios de evaluación (opcional)' : 'Opciones de respuesta *'}
                  </Label>
                  
                  {formData.questionType === 'essay' ? (
                    <div className="space-y-3 p-4 border rounded-lg bg-blue-50">
                      <p className="text-sm text-blue-700">
                        Para preguntas de ensayo, los estudiantes escribirán su respuesta libremente. 
                        Puedes agregar criterios de evaluación en la explicación.
                      </p>
                    </div>
                  ) : (
                    <>
                      {['A', 'B', 'C', 'D'].map((option) => {
                        // Para verdadero/falso, solo mostrar opciones A y B
                        if (formData.questionType === 'true_false' && (option === 'C' || option === 'D')) {
                          return null;
                        }
                        
                        return (
                          <div key={option} className="space-y-3 p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <Label className="font-medium">
                                {formData.questionType === 'true_false' 
                                  ? (option === 'A' ? 'Verdadero' : 'Falso')
                                  : `Opción ${option}`
                                }
                              </Label>
                              <RadioGroup
                                value={formData.correctOption}
                                onValueChange={(value) => handleInputChange('correctOption', value)}
                                className="flex items-center space-x-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value={option} id={`correct-${option}`} />
                                  <Label htmlFor={`correct-${option}`} className="text-sm">
                                    Correcta
                                  </Label>
                                </div>
                              </RadioGroup>
                            </div>
                            
                            <div className="space-y-2">
                              <Textarea
                                value={formData[`option${option}` as keyof QuestionFormData] as string}
                                onChange={(e) => handleInputChange(`option${option}` as keyof QuestionFormData, e.target.value)}
                                placeholder={
                                  formData.questionType === 'true_false'
                                    ? (option === 'A' ? 'Verdadero' : 'Falso')
                                    : formData.questionType === 'fill_blank'
                                    ? (option === 'A' ? 'Respuesta correcta' : `Alternativa ${option}`)
                                    : `Texto de la opción ${option}...`
                                }
                                rows={2}
                                className="resize-none"
                              />
                              
                              <ImageUpload
                                value={formData[`option${option}Image` as keyof QuestionFormData] as string}
                                onChange={(url) => handleInputChange(`option${option}Image` as keyof QuestionFormData, url)}
                                placeholder={`Imagen para opción ${option} (opcional)`}
                                className="max-w-sm"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                {/* Explicación */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="explanation">Explicación (opcional)</Label>
                    <Textarea
                      id="explanation"
                      value={formData.explanation}
                      onChange={(e) => handleInputChange('explanation', e.target.value)}
                      placeholder="Explica por qué esta es la respuesta correcta..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <ImageUpload
                    value={formData.explanationImage}
                    onChange={(url) => handleInputChange('explanationImage', url)}
                    placeholder="Imagen para la explicación (opcional)"
                    className="max-w-md"
                  />
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
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Vista Previa</h3>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Modo:</Label>
                  <Select value={previewMode} onValueChange={(value: any) => setPreviewMode(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="exam">Examen</SelectItem>
                      <SelectItem value="lesson">Lección</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.questionText ? (
                <QuestionPreview
                  question={formData as any}
                  mode={previewMode}
                  showCorrectAnswer={previewMode === 'admin'}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Completa el enunciado de la pregunta para ver la vista previa</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Configuración básica */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Configuración Básica</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="questionType">Tipo de pregunta</Label>
                      <Select 
                        value={formData.questionType} 
                        onValueChange={(value: any) => handleInputChange('questionType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Opción Múltiple</SelectItem>
                          <SelectItem value="true_false">Verdadero/Falso</SelectItem>
                          <SelectItem value="fill_blank">Completar</SelectItem>
                          <SelectItem value="matching">Emparejar</SelectItem>
                          <SelectItem value="essay">Ensayo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="difficultyLevel">Nivel de dificultad</Label>
                      <Select 
                        value={formData.difficultyLevel} 
                        onValueChange={(value: any) => handleInputChange('difficultyLevel', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="facil">Fácil</SelectItem>
                          <SelectItem value="medio">Medio</SelectItem>
                          <SelectItem value="dificil">Difícil</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                  </CardContent>
                </Card>

                {/* Configuración avanzada */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Configuración Avanzada</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="timeLimit">Tiempo límite (segundos)</Label>
                      <Input
                        id="timeLimit"
                        type="number"
                        min="1"
                        value={formData.timeLimit || ''}
                        onChange={(e) => handleInputChange('timeLimit', e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="Sin límite"
                      />
                      <p className="text-xs text-muted-foreground">
                        Deja vacío para sin límite de tiempo
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Información de la pregunta</Label>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>• Lección: {lessons.find(l => l.id === formData.lessonId)?.title || 'No seleccionada'}</p>
                        <p>• Competencia: {competencies.find(c => c.id === lessons.find(l => l.id === formData.lessonId)?.competencyId)?.name || 'No disponible'}</p>
                        <p>• Tipo: {getQuestionTypeLabel(formData.questionType)}</p>
                        <p>• Respuesta correcta: {formData.correctOption}</p>
                        {formData.timeLimit && <p>• Tiempo límite: {formData.timeLimit} segundos</p>}
                        <p className="text-blue-600 font-medium">• Las preguntas se seleccionan aleatoriamente para exámenes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
