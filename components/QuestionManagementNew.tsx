'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { QuestionData, QuestionFormData, QuestionFilters } from '@/types/question';
import { useQuestions } from '@/hooks/useQuestions';
import { useLessons } from '@/hooks/useLessons';
import { QuestionFormNew } from './QuestionFormNew';
import { QuestionPreview } from './QuestionPreview';
import { getAcademicGradeDisplayName } from '@/lib/academicGrades';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Upload,
  RefreshCw,
  Clock,
  Image as ImageIcon,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface QuestionManagementNewProps {
  competencies: Array<{
    id: string;
    name: string;
    displayName: string;
  }>;
  userRole?: string;
}

export function QuestionManagementNew({ competencies, userRole }: QuestionManagementNewProps) {
  const { toast } = useToast();
  const { 
    questions, 
    loading, 
    error, 
    pagination,
    filters,
    pendingFilters,
    setPendingFilters,
    applyFilters,
    clearFilters,
    goToPage,
    createQuestion, 
    updateQuestion, 
    deleteQuestion, 
    refreshQuestions 
  } = useQuestions();
  const { lessons } = useLessons();

  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionData | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<QuestionData | null>(null);
  const [previewMode, setPreviewMode] = useState<'exam' | 'lesson' | 'admin'>('admin');
  const [questionTypeSelected, setQuestionTypeSelected] = useState(false);
  const [selectedQuestionType, setSelectedQuestionType] = useState<'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'essay'>('multiple_choice');

  // Restricciones de permisos por rol
  const canCreate = userRole === 'teacher_admin';
  const canEdit = userRole === 'teacher_admin';
  const canDelete = userRole === 'teacher_admin';

  // Client-side filtering for hasImages (not supported by backend yet)
  const filteredQuestions = questions.filter(question => {
    if (filters.hasImages === 'yes' && !question.questionImage && !question.optionAImage && !question.optionBImage && !question.optionCImage && !question.optionDImage && !question.explanationImage) {
      return false;
    }
    
    if (filters.hasImages === 'no' && (question.questionImage || question.optionAImage || question.optionBImage || question.optionCImage || question.optionDImage || question.explanationImage)) {
      return false;
    }
    
    return true;
  });

  const handleCreateQuestion = async (data: QuestionFormData) => {
    const result = await createQuestion(data);
    if (result) {
      setShowForm(false);
      toast({
        title: 'Éxito',
        description: 'Pregunta creada correctamente',
      });
    }
  };

  const handleUpdateQuestion = async (data: QuestionFormData) => {
    if (!editingQuestion) return;
    
    const result = await updateQuestion(editingQuestion.id!, data);
    if (result) {
      setEditingQuestion(null);
      toast({
        title: 'Éxito',
        description: 'Pregunta actualizada correctamente',
      });
    }
  };

  const handleDeleteQuestion = async (question: QuestionData) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la pregunta "${question.questionText.substring(0, 50)}..."?`)) {
      return;
    }

    const success = await deleteQuestion(question.id!);
    if (success) {
      toast({
        title: 'Éxito',
        description: 'Pregunta eliminada correctamente',
      });
      // El hook ya refresca automáticamente después de eliminar
    } else {
      toast({
        title: 'Error',
        description: error || 'No se pudo eliminar la pregunta',
        variant: 'destructive',
      });
    }
  };

  const handleEditQuestion = (question: QuestionData) => {
    setEditingQuestion(question);
  };

  const handlePreviewQuestion = (question: QuestionData, mode: 'exam' | 'lesson' | 'admin' = 'admin') => {
    setPreviewQuestion(question);
    setPreviewMode(mode);
  };

  const handlePendingFilterChange = (field: keyof QuestionFilters, value: string | 'all' | 'yes' | 'no' | boolean | undefined) => {
    const updated = { ...pendingFilters, [field]: value };
    setPendingFilters(updated);
  };

  const handleApplyFilters = () => {
    applyFilters(pendingFilters);
  };

  const handleClearFilters = () => {
    const defaultFilters: QuestionFilters = {
      search: '',
      competencyId: 'all',
      lessonId: 'all',
      difficultyLevel: 'all',
      questionType: 'all',
      hasImages: 'all',
      isIcfesCourse: undefined,
    };
    setPendingFilters(defaultFilters);
    clearFilters();
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'facil': return 'bg-green-100 text-green-700 border-green-200';
      case 'medio': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'dificil': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
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

  const hasImages = (question: QuestionData) => {
    return !!(question.questionImage || question.optionAImage || question.optionBImage || 
              question.optionCImage || question.optionDImage || question.explanationImage);
  };

  // Filtrar lecciones por competencia seleccionada
  const filteredLessons = lessons.filter(lesson => 
    pendingFilters.competencyId === 'all' || lesson.modules.some(module => module.competency?.id === pendingFilters.competencyId)
  );

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Error al cargar preguntas</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={() => refreshQuestions({ skipCache: true })} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Preguntas</h2>
          <p className="text-muted-foreground">
            {userRole === 'school_admin' 
              ? `Consulta las preguntas disponibles para crear exámenes${pagination ? ` (${pagination.total} total)` : ''}`
              : `Administra las preguntas del sistema${pagination ? ` (${pagination.total} total)` : ''}`
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
            <Button
              onClick={() => refreshQuestions({ skipCache: true })}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          
          {canCreate && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Pregunta
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Enunciado..."
                  value={pendingFilters.search}
                  onChange={(e) => handlePendingFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="competency">Competencia</Label>
              <Select 
                value={pendingFilters.competencyId} 
                onValueChange={(value) => handlePendingFilterChange('competencyId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las competencias</SelectItem>
                  {competencies.map((competency) => (
                    <SelectItem key={competency.id} value={competency.id}>
                      {competency.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson">Lección</Label>
              <Select 
                value={pendingFilters.lessonId} 
                onValueChange={(value) => handlePendingFilterChange('lessonId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las lecciones</SelectItem>
                  {filteredLessons.map((lesson) => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Dificultad</Label>
              <Select 
                value={pendingFilters.difficultyLevel} 
                onValueChange={(value) => handlePendingFilterChange('difficultyLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="facil">Fácil</SelectItem>
                  <SelectItem value="medio">Medio</SelectItem>
                  <SelectItem value="dificil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select 
                value={pendingFilters.questionType} 
                onValueChange={(value) => handlePendingFilterChange('questionType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="multiple_choice">Opción Múltiple</SelectItem>
                  <SelectItem value="true_false">Verdadero/Falso</SelectItem>
                  <SelectItem value="fill_blank">Completar</SelectItem>
                  <SelectItem value="matching">Emparejar</SelectItem>
                  <SelectItem value="essay">Ensayo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">Imágenes</Label>
              <Select 
                value={pendingFilters.hasImages} 
                onValueChange={(value) => handlePendingFilterChange('hasImages', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="yes">Con imágenes</SelectItem>
                  <SelectItem value="no">Sin imágenes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionType">Tipo de Curso</Label>
              <Select 
                value={pendingFilters.isIcfesCourse === undefined ? 'all' : (pendingFilters.isIcfesCourse ? 'icfes' : 'personalizado')}
                onValueChange={(value) => {
                  const isIcfesCourse = value === 'all' ? undefined : (value === 'icfes')
                  handlePendingFilterChange('isIcfesCourse', isIcfesCourse as any)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="icfes">ICFES</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-4 gap-2">
            <Button variant="outline" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
            <Button onClick={handleApplyFilters}>
              <Search className="w-4 h-4 mr-2" />
              Aplicar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de preguntas */}
      <Card>
        <CardHeader>
          <CardTitle>Preguntas</CardTitle>
          <CardDescription>
            {pagination ? `${pagination.total} preguntas encontradas` : 'Cargando...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Cargando preguntas...
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay preguntas</h3>
              <p className="text-muted-foreground mb-4">
                {pagination && pagination.total === 0
                  ? 'Crea tu primera pregunta para comenzar'
                  : 'No se encontraron preguntas con los filtros aplicados'
                }
              </p>
              {pagination && pagination.total === 0 && canCreate && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Pregunta
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pregunta</TableHead>
                    <TableHead>Lección</TableHead>
                    <TableHead>Competencia</TableHead>
                    <TableHead>Año Escolar</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Dificultad</TableHead>
                    <TableHead>Multimedia</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-medium line-clamp-2">
                            {question.questionText}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>#{question.orderIndex}</span>
                            {question.timeLimit && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {question.timeLimit}s
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{question.lesson?.title || 'Sin lección'}</p>
                          <p className="text-xs text-muted-foreground">
                            {question.lesson?.modules[0]?.moduleTitle || 'Sin módulo'}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">
                          {question.lesson?.modules[0]?.competency?.name || 'N/A'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        {question.lesson?.academicGrade ? (
                          <Badge variant="secondary">
                            {getAcademicGradeDisplayName(question.lesson.academicGrade)}
                          </Badge>
                        ) : question.lesson?.year ? (
                          <Badge variant="secondary">
                            {question.lesson.year}° Grado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            N/A
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="secondary">
                          {getQuestionTypeLabel(question.questionType)}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={getDifficultyColor(question.difficultyLevel)}>
                          {question.difficultyLevel}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {hasImages(question) ? (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              Sí
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              No
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreviewQuestion(question, 'admin')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Vista Previa de Pregunta</DialogTitle>
                                <DialogDescription>
                                  Modo: {previewMode === 'admin' ? 'Administrador' : previewMode === 'exam' ? 'Examen' : 'Lección'}
                                </DialogDescription>
                              </DialogHeader>
                              {previewQuestion && (
                                <QuestionPreview
                                  question={previewQuestion}
                                  mode={previewMode}
                                  showCorrectAnswer={previewMode === 'admin'}
                                />
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditQuestion(question)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteQuestion(question)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} preguntas
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Anterior
                    </Button>
                    
                    <span className="text-sm">
                      Página {pagination.page} de {pagination.pages}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Formulario de creación/edición */}
      <Dialog 
        open={showForm || !!editingQuestion} 
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditingQuestion(null);
            setQuestionTypeSelected(false);
            setSelectedQuestionType('multiple_choice');
          }
        }}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Editar Pregunta' : 'Crear Nueva Pregunta'}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion 
                ? 'Modifica los datos de la pregunta' 
                : 'Completa la información para crear una nueva pregunta'
              }
            </DialogDescription>
          </DialogHeader>
          
          <QuestionFormNew
            question={editingQuestion ? {
              ...editingQuestion,
              usage: editingQuestion.usage || 'lesson'
            } as QuestionFormData : null}
            competencies={competencies}
            lessons={lessons.map((l: any) => ({
              id: l.id,
              title: l.title,
              competencyId: l.competencyId || '',
              isIcfesCourse: l.isIcfesCourse || false,
              academicGrade: l.academicGrade,
              year: l.year
            }))}
            onSubmit={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
            onCancel={() => {
              setShowForm(false);
              setEditingQuestion(null);
              setQuestionTypeSelected(false);
              setSelectedQuestionType('multiple_choice');
            }}
            loading={loading}
            onTypeSelected={() => {
              // Cuando se selecciona un tipo, simplemente actualizar el estado
              setQuestionTypeSelected(true);
            }}
            onQuestionTypeChange={(type) => {
              setSelectedQuestionType(type);
            }}
            questionTypeSelected={questionTypeSelected}
            setQuestionTypeSelected={setQuestionTypeSelected}
            initialQuestionType={editingQuestion ? undefined : selectedQuestionType}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
