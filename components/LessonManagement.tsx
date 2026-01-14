'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useCompetencies } from '@/hooks/useCompetencies';
import { useLessons } from '@/hooks/useLessons';
import { LessonForm } from './LessonForm';
import { LessonContentViewer } from './LessonContentViewer';
import { LessonData, LessonFormData, LessonFilters } from '@/types/lesson';
import { ModuleData } from '@/types/module';
import { formatDate } from '@/lib/utils';
import { getAcademicGradeDisplayName } from '@/lib/academicGrades';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Clock,
  BookOpen,
  Video
} from 'lucide-react';

interface LessonManagementProps {
  userRole: string;
}

export function LessonManagement({ userRole }: LessonManagementProps) {
  const { toast } = useToast();
  const { competencies } = useCompetencies();
  const {
    lessons,
    loading,
    error,
    filters,
    createLesson,
    updateLesson,
    deleteLesson,
    applyFilters,
    clearFilters,
  } = useLessons();

  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonData | null>(null);
  const [previewLesson, setPreviewLesson] = useState<LessonData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompetency, setSelectedCompetency] = useState('none');
  const [selectedLessonType, setSelectedLessonType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const lessonsPerPage = 6;

  const canCreate = userRole === 'teacher_admin';
  const canEdit = userRole === 'teacher_admin';
  const canDelete = userRole === 'teacher_admin';

  const unassignedCount = lessons.filter(l => !l.competencyId && !(l.modules?.[0]?.competency?.id)).length;

  const [bulkComp, setBulkComp] = useState<string>('none');
  const assignBulk = async () => {
    const targetId = bulkComp === 'none' ? null : bulkComp;
    const toUpdate = lessons.filter(l => !l.competencyId && !(l.modules?.[0]?.competency?.id));
    for (const l of toUpdate) {
      await updateLesson(l.id, { title: l.title, description: l.description, estimatedTimeMinutes: l.estimatedTimeMinutes, videoUrl: l.videoUrl, videoDescription: l.videoDescription, theoryContent: l.theoryContent, competencyId: targetId });
    }
    toast({ title: 'Competencias asignadas', description: `Actualizadas ${toUpdate.length} lecciones.` })
  }

  const handleCreateLesson = async (data: LessonFormData, id?: string) => {
    const result = await createLesson(data);
    if (result) {
      setShowForm(false);
    }
  };

  const handleUpdateLesson = async (data: LessonFormData, id?: string) => {
    if (editingLesson && id) {
      const result = await updateLesson(id, data);
      if (result) {
        setEditingLesson(null);
      }
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    // Buscar la lección para verificar si está en uso
    const lesson = lessons.find(l => l.id === lessonId);
    const isInUse = lesson && lesson.modules.length > 0;
    
    if (isInUse) {
      const moduleNames = lesson.modules.map(m => m.moduleTitle).join(', ');
      toast({
        title: 'No se puede eliminar',
        description: `Esta lección está siendo usada en ${lesson.modules.length} módulo(s): ${moduleNames}. Primero debes removerla de los módulos.`,
        variant: 'destructive',
      });
      return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar esta lección?')) {
      const success = await deleteLesson(lessonId);
      if (success) {
        toast({
          title: 'Lección eliminada',
          description: 'La lección se ha eliminado correctamente.',
        });
      } else {
        // El error ya se maneja en deleteLesson, pero podemos mostrar un mensaje más específico
        toast({
          title: 'Error al eliminar',
          description: 'No se pudo eliminar la lección. Puede que esté siendo usada en algún módulo, examen o clase en vivo.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSearch = () => {
    const newFilters: LessonFilters = {};
    if (searchTerm) newFilters.search = searchTerm;
    if (selectedCompetency && selectedCompetency !== 'none') newFilters.competencyId = selectedCompetency;
    if (selectedLessonType && selectedLessonType !== 'all') {
      newFilters.isIcfesCourse = selectedLessonType === 'icfes';
    }
    
    setCurrentPage(1);
    applyFilters(newFilters);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCompetency('none');
    setSelectedLessonType('all');
    setCurrentPage(1);
    clearFilters();
  };

  const handleEdit = (lesson: LessonData) => {
    setEditingLesson(lesson);
  };

  const handlePreview = (lesson: LessonData) => {
    setPreviewLesson(lesson);
  };

  const handleCancelEdit = () => {
    setEditingLesson(null);
  };

  const handleClosePreview = () => {
    setPreviewLesson(null);
  };

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil((lessons.length || 0) / lessonsPerPage) || 1);
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [lessons, currentPage]);

  const totalLessons = lessons.length;
  const startIndex = (currentPage - 1) * lessonsPerPage;
  const paginatedLessons = lessons.slice(startIndex, startIndex + lessonsPerPage);
  const totalPages = Math.max(1, Math.ceil(totalLessons / lessonsPerPage) || 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Lecciones</h2>
          <p className="text-muted-foreground">
            Administra las lecciones del sistema
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Lección
          </Button>
        )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar lecciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por competencia */}
            <div className="space-y-2">
              <Label htmlFor="competency">Competencia</Label>
              <Select
                value={selectedCompetency}
                onValueChange={setSelectedCompetency}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las competencias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todas las competencias</SelectItem>
                  {competencies.map((c:any) => (
                    <SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por tipo de lección */}
            <div className="space-y-2">
              <Label htmlFor="lessonType">Tipo de Lección</Label>
              <Select
                value={selectedLessonType}
                onValueChange={setSelectedLessonType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="icfes">ICFES</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Aplicar filtros
            </Button>
          </div>

          {/* Sección de asignación en lote */}
          {canEdit && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-sm text-muted-foreground">
                  Lecciones sin competencia: <strong className="text-foreground">{unassignedCount}</strong>
                </div>
                <Select value={bulkComp} onValueChange={setBulkComp}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Asignar competencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin competencia</SelectItem>
                    {competencies.map((c:any) => (
                      <SelectItem key={c.id} value={c.id}>{c.displayName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={assignBulk} disabled={unassignedCount === 0} variant="outline">
                  Asignar en lote
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de lecciones */}
      <Card>
        <CardHeader>
          <CardTitle>Lecciones ({totalLessons})</CardTitle>
          <CardDescription>
            Lista de todas las lecciones del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando lecciones...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">{error}</p>
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron lecciones</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lección</TableHead>
                    <TableHead>Competencia</TableHead>
                    <TableHead>Año Escolar</TableHead>
                    <TableHead>Tiempo</TableHead>
                    <TableHead>Multimedia</TableHead>
                    <TableHead>Módulos</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLessons.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-medium line-clamp-2">
                            {lesson.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {lesson.description}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">
                          {lesson.modules[0]?.competency?.name || 'Sin competencia'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        {lesson.academicGrade ? (
                          <Badge variant="secondary">
                            {getAcademicGradeDisplayName(lesson.academicGrade)}
                          </Badge>
                        ) : lesson.year ? (
                          <Badge variant="secondary">
                            {lesson.year}° Grado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            N/A
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{lesson.estimatedTimeMinutes} min</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {lesson.videoUrl ? (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <Video className="w-4 h-4" />
                            Sí
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            No
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {lesson.modules.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                              En uso ({lesson.modules.length})
                            </Badge>
                            <span 
                              className="text-xs text-muted-foreground cursor-help" 
                              title={`Usada en: ${lesson.modules.map(m => m.moduleTitle).join(', ')}`}
                            >
                              ℹ️
                            </span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Sin uso
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(lesson.createdAt)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(lesson)}
                            title="Vista previa de la lección"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(lesson)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLesson(lesson.id)}
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
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {totalLessons === 0 ? 0 : startIndex + 1} a {Math.min(startIndex + lessonsPerPage, totalLessons)} de {totalLessons} lecciones
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

      {/* Modal de vista previa de la lección */}
      {previewLesson && (
        <Dialog open={!!previewLesson} onOpenChange={handleClosePreview}>
          <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Vista Previa de la Lección</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden flex-1">
              <div className="lg:col-span-2 space-y-4 overflow-y-auto">
                <div>
                  <h2 className="text-2xl font-bold">{previewLesson.title}</h2>
                  <p className="text-muted-foreground">{previewLesson.description}</p>
                  <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {previewLesson.estimatedTimeMinutes} minutos
                  </div>
                </div>

                <Tabs defaultValue="theory" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="video">Video</TabsTrigger>
                    <TabsTrigger value="theory">Teoría</TabsTrigger>
                    <TabsTrigger value="exercises">Ejercicios</TabsTrigger>
                  </TabsList>
                  <TabsContent value="video" className="p-4 border rounded-lg bg-white min-h-[200px]">
                    {previewLesson.videoUrl ? (
                      <div className="aspect-video w-full bg-black/5 flex items-center justify-center text-sm text-muted-foreground rounded-lg">
                        Vista previa del video (URL: {previewLesson.videoUrl})
                      </div>
                    ) : (
                      <div className="text-muted-foreground">Sin video configurado</div>
                    )}
                    {previewLesson.videoDescription && (
                      <p className="mt-2 text-sm text-muted-foreground">{previewLesson.videoDescription}</p>
                    )}
                  </TabsContent>
                  <TabsContent value="theory" className="p-4 border rounded-lg bg-white">
                    <LessonContentViewer content={previewLesson.theoryContent || '<p>Sin contenido</p>'} />
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
      )}

      {/* Formulario de creación/edición */}
      <Dialog 
        open={showForm || !!editingLesson} 
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditingLesson(null);
          }
        }}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? 'Editar Lección' : 'Crear Nueva Lección'}
            </DialogTitle>
          </DialogHeader>
          
          <LessonForm
            lesson={editingLesson || undefined}
            onSubmit={editingLesson ? handleUpdateLesson : handleCreateLesson}
            onCancel={() => {
              setShowForm(false);
              setEditingLesson(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 