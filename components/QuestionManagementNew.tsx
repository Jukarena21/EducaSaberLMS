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
  const { questions, loading, error, createQuestion, updateQuestion, deleteQuestion, refreshQuestions } = useQuestions();
  const { lessons } = useLessons();

  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionData | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<QuestionData | null>(null);
  const [previewMode, setPreviewMode] = useState<'exam' | 'lesson' | 'admin'>('admin');
  
  const [filters, setFilters] = useState<QuestionFilters>({
    search: '',
    competencyId: 'all',
    lessonId: 'all',
    difficultyLevel: 'all',
    questionType: 'all',
    hasImages: 'all',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Restricciones de permisos por rol
  const canCreate = userRole === 'teacher_admin';
  const canEdit = userRole === 'teacher_admin';
  const canDelete = userRole === 'teacher_admin';

  // Filtrar preguntas
  const filteredQuestions = questions.filter(question => {
    if (filters.search && !question.questionText.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    if (filters.competencyId && filters.competencyId !== 'all') {
      const hasCompetency = question.lesson.modules.some(module => 
        module.competency?.id === filters.competencyId
      );
      if (!hasCompetency) return false;
    }
    
    if (filters.lessonId && filters.lessonId !== 'all' && question.lessonId !== filters.lessonId) {
      return false;
    }
    
    if (filters.difficultyLevel && filters.difficultyLevel !== 'all' && question.difficultyLevel !== filters.difficultyLevel) {
      return false;
    }
    
    if (filters.questionType && filters.questionType !== 'all' && question.questionType !== filters.questionType) {
      return false;
    }
    
    if (filters.hasImages === 'yes' && !question.questionImage && !question.optionAImage && !question.optionBImage && !question.optionCImage && !question.optionDImage && !question.explanationImage) {
      return false;
    }
    
    if (filters.hasImages === 'no' && (question.questionImage || question.optionAImage || question.optionBImage || question.optionCImage || question.optionDImage || question.explanationImage)) {
      return false;
    }
    
    return true;
  });

  // Paginación
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + itemsPerPage);

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
    
    const result = await updateQuestion(editingQuestion.id, data);
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

    const success = await deleteQuestion(question.id);
    if (success) {
      toast({
        title: 'Éxito',
        description: 'Pregunta eliminada correctamente',
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

  const clearFilters = () => {
    setFilters({
      search: '',
      competencyId: 'all',
      lessonId: 'all',
      difficultyLevel: 'all',
      questionType: 'all',
      hasImages: 'all',
    });
    setCurrentPage(1);
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
    filters.competencyId === 'all' || lesson.modules.some(module => module.competency?.id === filters.competencyId)
  );

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Error al cargar preguntas</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={refreshQuestions} variant="outline">
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
              ? `Consulta las preguntas disponibles para crear exámenes (${filteredQuestions.length} de ${questions.length})`
              : `Administra las preguntas del sistema (${filteredQuestions.length} de ${questions.length})`
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={refreshQuestions}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Enunciado..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="competency">Competencia</Label>
              <Select 
                value={filters.competencyId} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, competencyId: value }))}
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
                value={filters.lessonId} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, lessonId: value }))}
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
                value={filters.difficultyLevel} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, difficultyLevel: value }))}
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
                value={filters.questionType} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, questionType: value }))}
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
                value={filters.hasImages} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, hasImages: value }))}
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
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de preguntas */}
      <Card>
        <CardHeader>
          <CardTitle>Preguntas</CardTitle>
          <CardDescription>
            {filteredQuestions.length} preguntas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Cargando preguntas...
            </div>
          ) : paginatedQuestions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay preguntas</h3>
              <p className="text-muted-foreground mb-4">
                {filteredQuestions.length === 0 && questions.length > 0 
                  ? 'No se encontraron preguntas con los filtros aplicados'
                  : 'Crea tu primera pregunta para comenzar'
                }
              </p>
              {questions.length === 0 && canCreate && (
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Dificultad</TableHead>
                    <TableHead>Multimedia</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedQuestions.map((question) => (
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
                          <p className="font-medium">{question.lesson.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {question.lesson.modules[0]?.moduleTitle || 'Sin módulo'}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">
                          {question.lesson.modules[0]?.competency?.name || 'N/A'}
                        </Badge>
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
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredQuestions.length)} de {filteredQuestions.length} preguntas
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    
                    <span className="text-sm">
                      Página {currentPage} de {totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
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
      <Dialog open={showForm || !!editingQuestion} onOpenChange={(open) => {
        if (!open) {
          setShowForm(false);
          setEditingQuestion(null);
        }
      }}>
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
            question={editingQuestion}
            competencies={competencies}
            lessons={lessons}
            onSubmit={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
            onCancel={() => {
              setShowForm(false);
              setEditingQuestion(null);
            }}
            loading={loading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
