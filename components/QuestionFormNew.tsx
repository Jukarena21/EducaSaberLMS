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
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Clock,
  Image as ImageIcon,
  FileText,
  CheckCircle,
  Settings,
  X,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  ListChecks,
  ToggleLeft,
  Type,
  GitBranch,
  PenTool,
  ArrowRight,
  PlusCircle,
  AlertCircle,
  Filter,
  Award,
  BookMarked
} from 'lucide-react';
import { useMemo } from 'react';
import { ACADEMIC_YEARS, yearToAcademicGrade } from '@/lib/academicGrades';

export function QuestionFormNew({ 
  question, 
  competencies, 
  lessons, 
  onSubmit, 
  onCancel, 
  loading = false,
  onTypeSelected,
  questionTypeSelected: externalQuestionTypeSelected,
  setQuestionTypeSelected: setExternalQuestionTypeSelected,
  onQuestionTypeChange,
  initialQuestionType
}: QuestionFormProps) {
  const { toast } = useToast();
  // Función para crear formData inicial según el tipo
  const createInitialFormData = (type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'essay' = 'multiple_choice'): QuestionFormData => {
    const base: QuestionFormData = {
      lessonId: '',
      questionText: '',
      questionImage: '',
      questionType: type,
      usage: 'lesson',
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
      orderIndex: 1,
      difficultyLevel: 'medio',
      timeLimit: undefined,
    };

    if (type === 'true_false') {
      base.optionA = 'Verdadero';
      base.optionB = 'Falso';
      base.optionC = '';
      base.optionD = '';
    } else if (type === 'essay') {
      base.optionA = '';
      base.optionB = '';
      base.optionC = '';
      base.optionD = '';
    }

    return base;
  };

  const [formData, setFormData] = useState<QuestionFormData>(() => 
    createInitialFormData(initialQuestionType || 'multiple_choice')
  );

  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<'exam' | 'lesson' | 'admin'>('admin');
  
  // Usar estado externo si está disponible, sino usar estado local
  const [internalQuestionTypeSelected, setInternalQuestionTypeSelected] = useState(!!question);
  const questionTypeSelected = externalQuestionTypeSelected !== undefined 
    ? externalQuestionTypeSelected 
    : internalQuestionTypeSelected;

  const selectedLesson = lessons.find(lesson => lesson.id === formData.lessonId);
  const questionLessonIsIcfes = (question as any)?.lesson?.modules?.some((module: any) => module.course?.isIcfesCourse);
  const isIcfesLessonContext = Boolean(selectedLesson?.isIcfesCourse || questionLessonIsIcfes);

  const isEditing = !!question;

  // Estados para filtros de lecciones
  const [lessonFilterIcfes, setLessonFilterIcfes] = useState<'all' | 'icfes' | 'general'>('all');
  const [lessonFilterYear, setLessonFilterYear] = useState<string>('all');
  const [lessonFilterCompetency, setLessonFilterCompetency] = useState<string>('all');

  // Competencias ICFES (nombres exactos)
  const icfesCompetencyNames = [
    'Lectura Crítica',
    'Matemáticas',
    'Ciencias Naturales',
    'Ciencias Sociales y Ciudadanas',
    'Inglés',
    'lectura_critica',
    'matematicas',
    'ciencias_naturales',
    'ciencias_sociales',
    'ingles'
  ];

  // Filtrar lecciones según los filtros seleccionados
  const filteredLessons = useMemo(() => {
    let filtered = lessons;

    // Filtrar por tipo ICFES/General
    if (lessonFilterIcfes === 'icfes') {
      filtered = filtered.filter(l => l.isIcfesCourse);
    } else if (lessonFilterIcfes === 'general') {
      filtered = filtered.filter(l => !l.isIcfesCourse);
    }

    // Filtrar por año escolar (solo si es ICFES)
    if (lessonFilterIcfes === 'icfes' && lessonFilterYear !== 'all') {
      const year = parseInt(lessonFilterYear);
      const academicGrade = yearToAcademicGrade(year);
      if (academicGrade) {
        filtered = filtered.filter(l => l.academicGrade === academicGrade);
      }
    }

    // Filtrar por competencia
    if (lessonFilterCompetency !== 'all') {
      filtered = filtered.filter(l => l.competencyId === lessonFilterCompetency);
    }

    return filtered;
  }, [lessons, lessonFilterIcfes, lessonFilterYear, lessonFilterCompetency]);

  // Obtener competencias disponibles según el filtro de tipo
  const availableCompetenciesForFilter = useMemo(() => {
    if (lessonFilterIcfes === 'icfes') {
      return competencies.filter(c => 
        icfesCompetencyNames.includes(c.name) || 
        icfesCompetencyNames.includes(c.displayName || '')
      );
    } else if (lessonFilterIcfes === 'general') {
      return competencies.filter(c => 
        !icfesCompetencyNames.includes(c.name) && 
        !icfesCompetencyNames.includes(c.displayName || '')
      );
    }
    return competencies;
  }, [competencies, lessonFilterIcfes]);

  useEffect(() => {
    if (question) {
      // Si es una pregunta de tipo matching, asegurar que el formato sea correcto
      let processedQuestion = { ...question };
      if (question.questionType === 'matching') {
        // Para matching, si las opciones no tienen el formato "left|right", 
        // intentar parsearlas o dejarlas como están
        ['A', 'B', 'C', 'D'].forEach((opt) => {
          const optionKey = `option${opt}` as keyof QuestionFormData;
          const optionValue = question[optionKey] as string;
          if (optionValue && !optionValue.includes('|') && !optionValue.includes('→') && !optionValue.includes('->')) {
            // Si no tiene separador, asumir que es solo el elemento izquierdo
            processedQuestion = { ...processedQuestion, [optionKey]: `${optionValue}|` };
          }
        });
      }
      setFormData(processedQuestion);
      if (setExternalQuestionTypeSelected) {
        setExternalQuestionTypeSelected(true); // Si está editando, ya tiene tipo seleccionado
      } else {
        setInternalQuestionTypeSelected(true);
      }
    } else {
      if (setExternalQuestionTypeSelected) {
        setExternalQuestionTypeSelected(false); // Si está creando, necesita seleccionar tipo primero
      } else {
        setInternalQuestionTypeSelected(false);
      }
    }
  }, [question, setExternalQuestionTypeSelected]);

  useEffect(() => {
    if (isIcfesLessonContext && formData.questionType !== 'multiple_choice') {
      setFormData(prev => ({ ...prev, questionType: 'multiple_choice' }));
      if (onQuestionTypeChange) {
        onQuestionTypeChange('multiple_choice');
      }
    }
  }, [isIcfesLessonContext, formData.questionType, onQuestionTypeChange]);

  // Asegurar que cuando se selecciona un tipo desde las tarjetas, el formulario se actualice
  useEffect(() => {
    if (questionTypeSelected && !question && formData.questionType) {
      // El tipo ya fue seleccionado y configurado en handleQuestionTypeSelect
      // Este efecto solo asegura que el renderizado sea correcto
      console.log('Question type selected:', formData.questionType);
    }
  }, [questionTypeSelected, question, formData.questionType]);

  // Actualizar formulario cuando cambie el tipo de pregunta
  useEffect(() => {
    // Solo ajustar si realmente es necesario (evitar loops infinitos)
    if (formData.questionType === 'true_false') {
      // Para verdadero/falso, asegurar que solo A y B tengan valores y C/D estén vacíos
      setFormData(prev => {
        if (prev.optionC || prev.optionD || prev.correctOption === 'C' || prev.correctOption === 'D') {
          return {
            ...prev,
            optionA: prev.optionA || 'Verdadero',
            optionB: prev.optionB || 'Falso',
            optionC: '',
            optionD: '',
            correctOption: (prev.correctOption === 'C' || prev.correctOption === 'D') ? 'A' : prev.correctOption
          };
        }
        return prev;
      });
    } else if (formData.questionType === 'essay') {
      // Para ensayo, limpiar todas las opciones si tienen valores
      setFormData(prev => {
        if (prev.optionA || prev.optionB || prev.optionC || prev.optionD) {
          return {
            ...prev,
            optionA: '',
            optionB: '',
            optionC: '',
            optionD: '',
            correctOption: 'A'
          };
        }
        return prev;
      });
    } else if (formData.questionType === 'fill_blank') {
      // Para completar, la opción A es SIEMPRE la respuesta correcta
      setFormData(prev => {
        if (prev.correctOption !== 'A') {
          return {
            ...prev,
            correctOption: 'A'
          };
        }
        return prev;
      });
    } else if (formData.questionType === 'matching') {
      // Para matching, asegurar que hay una opción correcta seleccionada
      setFormData(prev => {
        if (!prev.correctOption) {
          return {
            ...prev,
            correctOption: 'A'
          };
        }
        return prev;
      });
    } else {
      // Opción múltiple - asegurar que hay una opción correcta seleccionada
      setFormData(prev => {
        if (!prev.correctOption) {
          return {
            ...prev,
            correctOption: 'A'
          };
        }
        return prev;
      });
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

    // Para matching, asegurar que el formato sea "left|right" antes de guardar
    let dataToSubmit = { ...formData };
    if (formData.questionType === 'matching') {
      ['A', 'B', 'C', 'D'].forEach((opt) => {
        const optionKey = `option${opt}` as keyof QuestionFormData;
        const optionValue = dataToSubmit[optionKey] as string;
        if (optionValue) {
          // Si tiene separador → o ->, convertirlo a |
          let formatted = optionValue.replace(/→/g, '|').replace(/->/g, '|');
          // Si no tiene separador pero tiene contenido, agregar |
          if (!formatted.includes('|')) {
            formatted = `${formatted}|`;
          }
          dataToSubmit = { ...dataToSubmit, [optionKey]: formatted };
        }
      });
    }

    // Validaciones específicas por tipo de pregunta
    if (formData.questionType === 'essay') {
      // Para ensayo, no se requieren opciones
      // La validación pasa
    } else if (formData.questionType === 'true_false') {
      // Para verdadero/falso, solo se requieren opciones A y B
      if (!formData.optionA.trim() || !formData.optionB.trim()) {
        toast({
          title: 'Error',
          description: 'Las opciones Verdadero y Falso son requeridas',
          variant: 'destructive',
        });
        return;
      }
    } else if (formData.questionType === 'fill_blank') {
      // Para completar, se requieren todas las opciones (A es la correcta, B-D son distractores)
      if (!formData.optionA.trim() || !formData.optionB.trim() || 
          !formData.optionC.trim() || !formData.optionD.trim()) {
        toast({
          title: 'Error',
          description: 'Se requiere la respuesta correcta (A) y al menos 3 alternativas distractoras (B, C, D)',
          variant: 'destructive',
        });
        return;
      }
      // Asegurar que A sea la correcta
      if (formData.correctOption !== 'A') {
        setFormData(prev => ({ ...prev, correctOption: 'A' }));
      }
    } else if (formData.questionType === 'matching') {
      // Para matching, validar que cada par tenga ambos elementos (izquierdo y derecho)
      const pairs = ['A', 'B', 'C', 'D'];
      
      // Función helper para dividir por el separador específico
      const splitBySeparator = (str: string, sep: string): string[] => {
        if (sep === '|') {
          return str.split('|').map(s => s.trim());
        } else if (sep === '→') {
          return str.split('→').map(s => s.trim());
        } else if (sep === '->') {
          return str.split('->').map(s => s.trim());
        }
        return [str, ''];
      };
      
      for (const opt of pairs) {
        const optionValue = formData[`option${opt}` as keyof QuestionFormData] as string || '';
        const separator = optionValue.includes('|') ? '|' : optionValue.includes('→') ? '→' : optionValue.includes('->') ? '->' : null;
        const parts = separator ? splitBySeparator(optionValue, separator) : [optionValue, ''];
        const leftElement = parts[0] || '';
        const rightElement = parts[1] || '';
        
        if (!leftElement.trim() || !rightElement.trim()) {
          toast({
            title: 'Error',
            description: `El par ${opt} debe tener tanto el elemento izquierdo como el derecho completos`,
            variant: 'destructive',
          });
          return;
        }
      }
    } else {
      // Opción múltiple - se requieren todas las opciones
      if (!formData.optionA.trim() || !formData.optionB.trim() || 
          !formData.optionC.trim() || !formData.optionD.trim()) {
        toast({
          title: 'Error',
          description: 'Todas las opciones de respuesta son requeridas',
          variant: 'destructive',
        });
        return;
      }
    }

    if (!formData.correctOption) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar la respuesta correcta',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onSubmit(dataToSubmit);
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

  const getQuestionTypeDescription = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'Pregunta con múltiples opciones de respuesta';
      case 'true_false': return 'Pregunta de verdadero o falso';
      case 'fill_blank': return 'Completar espacios en blanco';
      case 'matching': return 'Emparejar elementos relacionados';
      case 'essay': return 'Pregunta de respuesta abierta o ensayo';
      default: return '';
    }
  };

  const handleQuestionTypeSelect = (type: string) => {
    const questionType = type as 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'essay';
    
    // Reiniciar el formulario con los valores correctos según el tipo seleccionado
    const baseFormData = createInitialFormData(questionType);

    // Actualizar el estado primero
    setFormData(baseFormData);
    
    // Notificar al componente padre sobre el cambio de tipo
    if (onQuestionTypeChange) {
      onQuestionTypeChange(questionType);
    }
    
    // Actualizar el estado de selección de tipo
    if (setExternalQuestionTypeSelected) {
      setExternalQuestionTypeSelected(true);
    } else {
      setInternalQuestionTypeSelected(true);
    }
    
    // Notificar al padre que se seleccionó un tipo (sin setTimeout para evitar doble renderizado)
    if (onTypeSelected) {
      onTypeSelected();
    }
  };

  const handleBackToTypeSelection = () => {
    if (setExternalQuestionTypeSelected) {
      setExternalQuestionTypeSelected(false);
    } else {
      setInternalQuestionTypeSelected(false);
    }
    setFormData(prev => ({ ...prev, questionType: 'multiple_choice' }));
  };

  const questionTypes = [
    { value: 'multiple_choice', label: 'Opción Múltiple', icon: ListChecks, color: 'blue' },
    { value: 'true_false', label: 'Verdadero/Falso', icon: ToggleLeft, color: 'green' },
    { value: 'fill_blank', label: 'Completar', icon: Type, color: 'purple' },
    { value: 'matching', label: 'Emparejar', icon: GitBranch, color: 'orange' },
    { value: 'essay', label: 'Ensayo', icon: PenTool, color: 'pink' },
  ];

  const availableQuestionTypes = isIcfesLessonContext
    ? questionTypes.filter((type) => type.value === 'multiple_choice')
    : questionTypes;

  // Pantalla de selección de tipo de pregunta (solo para creación, no para edición)
  if (!isEditing && !questionTypeSelected) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-semibold mb-2">Selecciona el tipo de pregunta</h3>
          <p className="text-gray-600">Elige el tipo de pregunta que deseas crear:</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableQuestionTypes.map((type) => {
            const IconComponent = type.icon;
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200',
              green: 'bg-green-100 text-green-600 group-hover:bg-green-200',
              purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-200',
              orange: 'bg-orange-100 text-orange-600 group-hover:bg-orange-200',
              pink: 'bg-pink-100 text-pink-600 group-hover:bg-pink-200',
            };
            
            return (
              <button
                key={type.value}
                onClick={() => handleQuestionTypeSelect(type.value)}
                className="p-8 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer text-left group h-full"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className={`p-4 rounded-full transition-colors ${colorClasses[type.color as keyof typeof colorClasses]}`}>
                    <IconComponent className="h-10 w-10" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-xl">{type.label}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {getQuestionTypeDescription(type.value)}
                    </p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors mt-2" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                {isEditing ? 'Editar Pregunta' : 'Crear Nueva Pregunta'}
              </CardTitle>
              <CardDescription className="mt-1">
                {isEditing 
                  ? 'Modifica los datos de la pregunta' 
                  : 'Completa la información para crear una nueva pregunta'
                }
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {!isEditing && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToTypeSelection}
                  className="text-xs"
                  disabled={isIcfesLessonContext}
                >
                  Cambiar Tipo
                </Button>
              )}
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
                {/* Información Básica */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Información Básica
                    </CardTitle>
                    <CardDescription>
                      Asigna la pregunta a una lección y define el enunciado
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Filtros para lecciones */}
                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                      <div className="flex items-center gap-2 mb-3">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-sm font-semibold">Filtros de Lección</Label>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Filtro por tipo ICFES/General */}
                        <div className="space-y-2">
                          <Label htmlFor="filterIcfes" className="text-xs">Tipo de Lección</Label>
                          <Select 
                            value={lessonFilterIcfes} 
                            onValueChange={(value) => {
                              setLessonFilterIcfes(value as 'all' | 'icfes' | 'general');
                              setLessonFilterYear('all'); // Reset año al cambiar tipo
                              setLessonFilterCompetency('all'); // Reset competencia al cambiar tipo
                            }}
                          >
                            <SelectTrigger id="filterIcfes" className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas</SelectItem>
                              <SelectItem value="icfes">
                                <div className="flex items-center gap-2">
                                  <Award className="w-3 h-3" />
                                  ICFES
                                </div>
                              </SelectItem>
                              <SelectItem value="general">
                                <div className="flex items-center gap-2">
                                  <BookMarked className="w-3 h-3" />
                                  General
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Filtro por año escolar (solo si es ICFES) */}
                        {lessonFilterIcfes === 'icfes' && (
                          <div className="space-y-2">
                            <Label htmlFor="filterYear" className="text-xs">Año Escolar</Label>
                            <Select 
                              value={lessonFilterYear} 
                              onValueChange={setLessonFilterYear}
                            >
                              <SelectTrigger id="filterYear" className="h-9">
                                <SelectValue placeholder="Todos los años" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todos los años</SelectItem>
                                {ACADEMIC_YEARS.map((year) => (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}° Grado
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Filtro por competencia */}
                        <div className="space-y-2">
                          <Label htmlFor="filterCompetency" className="text-xs">Competencia</Label>
                          <Select 
                            value={lessonFilterCompetency} 
                            onValueChange={setLessonFilterCompetency}
                          >
                            <SelectTrigger id="filterCompetency" className="h-9">
                              <SelectValue placeholder="Todas las competencias" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas las competencias</SelectItem>
                              {availableCompetenciesForFilter.map((comp) => (
                                <SelectItem key={comp.id} value={comp.id}>
                                  {comp.displayName || comp.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {filteredLessons.length === 0 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                          <AlertCircle className="w-4 h-4 inline mr-2" />
                          No hay lecciones que coincidan con los filtros seleccionados.
                        </div>
                      )}
                    </div>

                    {/* Selector de lección */}
                    <div className="space-y-2">
                      <Label htmlFor="lessonId">Lección *</Label>
                      <Select 
                        value={formData.lessonId || 'none'} 
                        onValueChange={(value) => handleInputChange('lessonId', value === 'none' ? '' : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una lección" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {filteredLessons.map((lesson: any) => {
                            const lessonInfo = [];
                            if (lesson.isIcfesCourse && lesson.year) {
                              lessonInfo.push(`${lesson.year}°`);
                            }
                            if (lesson.competencyId) {
                              const comp = competencies.find((c: any) => c.id === lesson.competencyId);
                              if (comp) {
                                lessonInfo.push(comp.displayName || comp.name);
                              }
                            }
                            const infoSuffix = lessonInfo.length > 0 ? ` (${lessonInfo.join(', ')})` : '';
                            return (
                              <SelectItem key={lesson.id} value={lesson.id}>
                                {lesson.title}{infoSuffix}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {filteredLessons.length > 0 
                          ? `${filteredLessons.length} lección(es) disponible(s) con los filtros seleccionados`
                          : 'Usa los filtros arriba para encontrar lecciones'}
                      </p>
                      {selectedLesson?.isIcfesCourse && (
                        <div className="flex items-center gap-2 text-xs text-orange-600">
                          <AlertCircle className="w-3 h-3" />
                          <span>Esta lección es ICFES. Solo se permiten preguntas de opción múltiple.</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="questionText">Enunciado de la pregunta *</Label>
                      <Textarea
                        id="questionText"
                        value={formData.questionText}
                        onChange={(e) => handleInputChange('questionText', e.target.value)}
                        placeholder={
                          formData.questionType === 'fill_blank'
                            ? 'Ejemplo: "La capital de Colombia es _____.", "El proceso de _____ es fundamental en biología."'
                            : formData.questionType === 'matching'
                            ? 'Ejemplo: "Empareja cada capital con su país correspondiente:", "Relaciona cada concepto con su definición:"'
                            : 'Escribe el enunciado de la pregunta...'
                        }
                        rows={formData.questionType === 'fill_blank' || formData.questionType === 'matching' ? 3 : 4}
                        className="resize-none"
                        required
                      />
                      {formData.questionType === 'fill_blank' && (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="text-xs text-purple-800">
                            <strong>💡 Tip:</strong> Usa guiones bajos (____) o corchetes ([BLANK]) para indicar los espacios en blanco. 
                            Ejemplo: "La fórmula del agua es H___O" o "El proceso de [BLANK] es fundamental."
                          </p>
                        </div>
                      )}
                      {formData.questionType === 'matching' && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-xs text-orange-800">
                            <strong>💡 Tip:</strong> Describe qué elementos deben emparejarse. 
                            Ejemplo: "Empareja cada capital con su país" o "Relaciona cada concepto con su definición".
                          </p>
                        </div>
                      )}
                    </div>

                      <ImageUpload
                        value={formData.questionImage}
                        onChange={(url) => handleInputChange('questionImage', url)}
                        placeholder="Subir imagen para el enunciado (opcional)"
                        className="max-w-xs"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Opciones de Respuesta - Adaptado según el tipo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      {formData.questionType === 'essay' 
                        ? 'Criterios de Evaluación'
                        : formData.questionType === 'matching'
                        ? 'Pares de Elementos'
                        : 'Opciones de Respuesta'
                      }
                    </CardTitle>
                    <CardDescription>
                      {formData.questionType === 'essay' 
                        ? 'Define los criterios que se usarán para evaluar la respuesta del estudiante'
                        : formData.questionType === 'true_false'
                        ? 'Selecciona si la afirmación es Verdadera o Falsa *'
                        : formData.questionType === 'fill_blank'
                        ? 'Define la respuesta correcta y las alternativas distractoras *'
                        : formData.questionType === 'matching'
                        ? 'Crea pares de elementos relacionados (máximo 4 pares) *'
                        : 'Define las opciones de respuesta y marca la correcta *'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {formData.questionType === 'essay' ? (
                      <div className="space-y-3 p-4 border rounded-lg bg-blue-50 border-blue-200">
                        <div className="flex items-start gap-2">
                          <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-blue-900">
                              Pregunta de Respuesta Abierta
                            </p>
                            <p className="text-sm text-blue-700">
                              Los estudiantes escribirán su respuesta libremente. Puedes agregar criterios de evaluación, 
                              puntos clave o ejemplos de respuestas esperadas en la sección de "Explicación" más abajo.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : formData.questionType === 'matching' ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <GitBranch className="w-5 h-5 text-orange-600 mt-0.5" />
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-orange-900">
                                Pregunta de Emparejar
                              </p>
                              <p className="text-sm text-orange-800">
                                <strong>Instrucciones:</strong> Crea pares de elementos relacionados. 
                                Cada par tiene un elemento izquierdo y un elemento derecho que deben emparejarse.
                              </p>
                              <p className="text-xs text-orange-700 italic">
                                Ejemplo: Par A: Izquierdo = "París", Derecho = "Francia"
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {['A', 'B', 'C', 'D'].map((option) => {
                          const isCorrect = formData.correctOption === option;
                          // Para matching, parsear el formato "left|right" o "left → right"
                          const optionValue = formData[`option${option}` as keyof QuestionFormData] as string || '';
                          const separator = optionValue.includes('|') ? '|' : optionValue.includes('→') ? '→' : optionValue.includes('->') ? '->' : null;
                          const [leftElement, rightElement] = separator 
                            ? optionValue.split(separator).map(s => s.trim())
                            : ['', ''];
                          
                          const handleMatchingChange = (side: 'left' | 'right', value: string) => {
                            const currentOption = formData[`option${option}` as keyof QuestionFormData] as string || '';
                            const currentSeparator = currentOption.includes('|') ? '|' : currentOption.includes('→') ? '→' : currentOption.includes('->') ? '->' : '|';
                            
                            // Función helper para dividir por el separador específico
                            const splitBySeparator = (str: string, sep: string): string[] => {
                              if (sep === '|') {
                                return str.split('|').map(s => s.trim());
                              } else if (sep === '→') {
                                return str.split('→').map(s => s.trim());
                              } else if (sep === '->') {
                                return str.split('->').map(s => s.trim());
                              }
                              return [str, ''];
                            };
                            
                            const currentParts = currentOption.includes('|') || currentOption.includes('→') || currentOption.includes('->')
                              ? splitBySeparator(currentOption, currentSeparator)
                              : ['', ''];
                            
                            let newValue = '';
                            if (side === 'left') {
                              newValue = `${value}|${currentParts[1] || ''}`;
                            } else {
                              newValue = `${currentParts[0] || ''}|${value}`;
                            }
                            handleInputChange(`option${option}` as keyof QuestionFormData, newValue);
                          };
                          
                          return (
                            <div 
                              key={option} 
                              className={`space-y-3 p-4 border-2 rounded-lg transition-colors ${
                                isCorrect 
                                  ? 'border-orange-500 bg-orange-50/50' 
                                  : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Label className="font-medium text-sm">
                                    Par {option}
                                  </Label>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Válido
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium">Izquierdo</Label>
                                  <Input
                                    value={leftElement}
                                    onChange={(e) => handleMatchingChange('left', e.target.value)}
                                    placeholder={`Izquierdo ${option}...`}
                                    className="text-sm h-9"
                                    required
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium">Derecho</Label>
                                  <Input
                                    value={rightElement}
                                    onChange={(e) => handleMatchingChange('right', e.target.value)}
                                    placeholder={`Derecho ${option}...`}
                                    className="text-sm h-9"
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    ) : formData.questionType === 'true_false' ? (
                      <div className="space-y-4">
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            <strong>Nota:</strong> Solo necesitas marcar cuál es la respuesta correcta. 
                            Los textos "Verdadero" y "Falso" se mostrarán automáticamente.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {['A', 'B'].map((option) => {
                            const isCorrect = formData.correctOption === option;
                            const optionLabel = option === 'A' ? 'Verdadero' : 'Falso';
                            
                            return (
                              <div 
                                key={option} 
                                className={`space-y-3 p-4 border-2 rounded-lg transition-colors ${
                                  isCorrect 
                                    ? 'border-green-500 bg-green-50/50' 
                                    : 'border-gray-200 bg-white'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <Label className="font-medium text-base">
                                    {optionLabel}
                                  </Label>
                                  <RadioGroup
                                    value={formData.correctOption}
                                    onValueChange={(value) => handleInputChange('correctOption', value)}
                                    className="flex items-center space-x-2"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem value={option} id={`correct-${option}`} />
                                      <Label htmlFor={`correct-${option}`} className="text-xs font-medium cursor-pointer">
                                        {isCorrect ? '✓ Correcta' : 'Marcar'}
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                </div>
                                <div className="text-xs text-muted-foreground italic">
                                  Representa "{optionLabel}" en la pregunta
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : formData.questionType === 'fill_blank' ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Type className="w-5 h-5 text-purple-600 mt-0.5" />
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-purple-900">
                                Pregunta de Completar
                              </p>
                              <p className="text-sm text-purple-800">
                                <strong>Instrucciones:</strong> La opción A debe ser la respuesta correcta que completa el espacio en blanco. 
                                Las opciones B, C, D serán las alternativas distractoras que también podrían completar el espacio.
                              </p>
                              <p className="text-xs text-purple-700 italic">
                                Ejemplo: Si el enunciado es "La capital de Colombia es _____", 
                                la opción A sería "Bogotá" y las otras opciones serían otras ciudades.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {['A', 'B', 'C', 'D'].map((option) => {
                            const isCorrectAnswer = option === 'A';
                            
                            return (
                              <div 
                                key={option} 
                                className={`space-y-3 p-4 border-2 rounded-lg transition-colors ${
                                  isCorrectAnswer
                                    ? 'border-purple-500 bg-purple-50/50' 
                                    : 'border-gray-200 bg-white'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Label className="font-medium text-sm">
                                      {isCorrectAnswer ? '✓ Correcta (A)' : `Distractora ${option}`}
                                    </Label>
                                    {isCorrectAnswer && (
                                      <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-300">
                                        Correcta
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Textarea
                                    value={formData[`option${option}` as keyof QuestionFormData] as string}
                                    onChange={(e) => handleInputChange(`option${option}` as keyof QuestionFormData, e.target.value)}
                                    placeholder={
                                      isCorrectAnswer 
                                        ? 'Respuesta correcta...' 
                                        : `Distractora ${option}...`
                                    }
                                    rows={2}
                                    className="resize-none text-sm"
                                    required
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      // Opción Múltiple (default) - En grilla 2x2
                      <div className="grid grid-cols-2 gap-4">
                        {['A', 'B', 'C', 'D'].map((option) => {
                          const isCorrect = formData.correctOption === option;
                          
                          return (
                            <div 
                              key={option} 
                              className={`space-y-3 p-4 border-2 rounded-lg transition-colors ${
                                isCorrect 
                                  ? 'border-green-500 bg-green-50/50' 
                                  : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <Label className="font-medium text-base">
                                  Opción {option}
                                </Label>
                                <RadioGroup
                                  value={formData.correctOption}
                                  onValueChange={(value) => handleInputChange('correctOption', value)}
                                  className="flex items-center space-x-2"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value={option} id={`correct-${option}`} />
                                    <Label htmlFor={`correct-${option}`} className="text-xs font-medium cursor-pointer">
                                      {isCorrect ? '✓ Correcta' : 'Marcar'}
                                    </Label>
                                  </div>
                                </RadioGroup>
                              </div>
                              
                              <div className="space-y-2">
                                <Textarea
                                  value={formData[`option${option}` as keyof QuestionFormData] as string}
                                  onChange={(e) => handleInputChange(`option${option}` as keyof QuestionFormData, e.target.value)}
                                  placeholder={`Opción ${option}...`}
                                  rows={2}
                                  className="resize-none text-sm"
                                  required
                                />
                                
                                <ImageUpload
                                  value={formData[`option${option}Image` as keyof QuestionFormData] as string}
                                  onChange={(url) => handleInputChange(`option${option}Image` as keyof QuestionFormData, url)}
                                  placeholder={`Imagen ${option} (opc.)`}
                                  className="max-w-full"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Explicación */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {formData.questionType === 'essay' ? 'Criterios de Evaluación' : 'Explicación'}
                    </CardTitle>
                    <CardDescription>
                      {formData.questionType === 'essay'
                        ? 'Define los criterios, puntos clave o ejemplos de respuestas esperadas para evaluar el ensayo'
                        : formData.questionType === 'matching'
                        ? 'Explica cómo se relacionan los elementos o proporciona contexto adicional'
                        : 'Proporciona una explicación de la respuesta correcta (opcional pero recomendado)'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="explanation">
                        {formData.questionType === 'essay' ? 'Criterios y puntos clave' : 'Texto de la explicación'}
                      </Label>
                      <Textarea
                        id="explanation"
                        value={formData.explanation}
                        onChange={(e) => handleInputChange('explanation', e.target.value)}
                        placeholder={
                          formData.questionType === 'essay'
                            ? 'Ejemplo: La respuesta debe incluir: 1) Definición del concepto, 2) Ejemplos prácticos, 3) Relación con otros temas. Puntos: 0-5 según completitud.'
                            : formData.questionType === 'matching'
                            ? 'Explica cómo se relacionan los elementos emparejados o proporciona contexto adicional sobre las conexiones.'
                            : 'Explica por qué esta es la respuesta correcta. Esto ayuda a los estudiantes a entender mejor el concepto.'
                        }
                        rows={formData.questionType === 'essay' ? 6 : 4}
                        className="resize-none"
                      />
                    </div>

                    <ImageUpload
                      value={formData.explanationImage}
                      onChange={(url) => handleInputChange('explanationImage', url)}
                      placeholder={
                        formData.questionType === 'essay'
                          ? 'Imagen de ejemplo o diagrama para la explicación (opcional)'
                          : 'Imagen para la explicación (opcional)'
                      }
                      className="max-w-xs"
                    />
                  </CardContent>
                </Card>

                <Separator />

                {/* Botones */}
                <div className="flex justify-end gap-2 pt-4">
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
                    {loading ? 'Guardando...' : (isEditing ? 'Actualizar Pregunta' : 'Crear Pregunta')}
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
                      <Label htmlFor="usage">Uso de la pregunta</Label>
                      <Select
                        value={formData.usage}
                        onValueChange={(value: any) => handleInputChange('usage', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lesson">Solo lecciones</SelectItem>
                          <SelectItem value="exam">Solo exámenes</SelectItem>
                          <SelectItem value="both">Lecciones y exámenes</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Define dónde puede usarse esta pregunta. Para evitar que un estudiante vea la misma pregunta en
                        prácticas y exámenes, usa <strong>Solo lecciones</strong> o <strong>Solo exámenes</strong>.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="questionType">Tipo de pregunta</Label>
                      <Select 
                        value={formData.questionType} 
                        onValueChange={(value: any) => handleInputChange('questionType', value)}
                        disabled={!isEditing}
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
                      {!isEditing && (
                        <p className="text-xs text-muted-foreground">
                          El tipo se seleccionó desde las tarjetas. Usa el botón "Cambiar Tipo" en el header para cambiarlo.
                        </p>
                      )}
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
