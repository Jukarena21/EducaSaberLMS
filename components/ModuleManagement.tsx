'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useModules } from '@/hooks/useModules';
import { ModuleForm } from './ModuleForm';
import { ModuleLessonManagement } from './ModuleLessonManagement';
import { ModuleData, ModuleFormData, ModuleFilters } from '@/types/module';
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
  User,
  GraduationCap,
  AlertTriangle,
  List,
  Video
} from 'lucide-react';

interface ModuleManagementProps {
  userRole: string;
  competencies?: Array<{ id: string; name: string; displayName?: string }>;
  teachers?: Array<{ id: string; firstName: string; lastName: string }>;
  onModuleCreated?: () => void;
}

export function ModuleManagement({ userRole, competencies = [], teachers = [], onModuleCreated }: ModuleManagementProps) {
  const { toast } = useToast();
  const {
    modules,
    loading,
    error,
    filters,
    createModule,
    updateModule,
    deleteModule,
    applyFilters,
    clearFilters,
    pagination,
    goToPage,
  } = useModules();

  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleData | null>(null);
  const [previewModule, setPreviewModule] = useState<ModuleData | null>(null);
  const [previewLessons, setPreviewLessons] = useState<Array<{
    id: string;
    title: string;
    description?: string;
    estimatedTimeMinutes?: number;
    videoUrl?: string | null;
    orderIndex: number;
  }>>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompetency, setSelectedCompetency] = useState('none');
  const [selectedCreator, setSelectedCreator] = useState('none');
  const [selectedModuleType, setSelectedModuleType] = useState('all');
  const [managingLessonsFor, setManagingLessonsFor] = useState<ModuleData | null>(null);

  const canCreate = userRole === 'teacher_admin';
  const canEdit = userRole === 'teacher_admin';
  const canDelete = userRole === 'teacher_admin';

  const handleCreateModule = async (data: ModuleFormData) => {
    const result = await createModule(data);
    if (result) {
      setShowForm(false);
      // Notificar al componente padre que se creó un módulo
      if (onModuleCreated) {
        onModuleCreated();
      }
    }
  };

  const handleUpdateModule = async (data: ModuleFormData) => {
    if (editingModule) {
      const result = await updateModule(editingModule.id, data);
      if (result) {
        setEditingModule(null);
      }
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este módulo? Esta acción no se puede deshacer.')) {
      const success = await deleteModule(moduleId);
      if (success) {
        toast({
          title: 'Módulo eliminado',
          description: 'El módulo se ha eliminado correctamente.',
        });
      }
    }
  };

  const handleSearch = () => {
    const newFilters: ModuleFilters = {};
    if (searchTerm) newFilters.search = searchTerm;
    if (selectedCompetency && selectedCompetency !== 'none') newFilters.competencyId = selectedCompetency;
    if (selectedCreator && selectedCreator !== 'none') newFilters.createdById = selectedCreator;
    if (selectedModuleType && selectedModuleType !== 'all') {
      newFilters.isIcfesModule = selectedModuleType === 'icfes';
    }
    
    applyFilters(newFilters);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCompetency('none');
    setSelectedCreator('none');
    setSelectedModuleType('all');
    clearFilters();
  };

  const handleEdit = (module: ModuleData) => {
    setEditingModule(module);
  };

  const handlePreview = async (module: ModuleData) => {
    setPreviewModule(module);
    setPreviewLoading(true);
    setPreviewLessons([]);
    
    try {
      const response = await fetch(`/api/modules/${module.id}/lessons`);
      if (response.ok) {
        const lessons = await response.json();
        setPreviewLessons(lessons);
      }
    } catch (error) {
      console.error('Error loading preview lessons:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingModule(null);
  };

  const handleClosePreview = () => {
    setPreviewModule(null);
  };

  const totalModules = pagination.total || 0;
  const startIndex = totalModules === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endIndex = totalModules === 0 ? 0 : Math.min(pagination.page * pagination.limit, totalModules);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Módulos</h2>
          <p className="text-muted-foreground">
            Administra los módulos del sistema
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Módulo
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar módulos..."
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
                  {competencies.map((competency) => (
                    <SelectItem key={competency.id} value={competency.id}>
                      {competency.displayName || competency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por creador */}
            {userRole === 'teacher_admin' && teachers.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="creator">Creador</Label>
                <Select
                  value={selectedCreator}
                  onValueChange={setSelectedCreator}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los creadores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Todos los creadores</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Filtro por tipo de módulo */}
            <div className="space-y-2">
              <Label htmlFor="moduleType">Tipo de Módulo</Label>
              <Select
                value={selectedModuleType}
                onValueChange={setSelectedModuleType}
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
        </CardContent>
      </Card>

      {/* Lista de módulos */}
      <Card>
        <CardHeader>
          <CardTitle>Módulos ({totalModules})</CardTitle>
          <CardDescription>
            Lista de todos los módulos del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando módulos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">{error}</p>
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron módulos</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Competencia</TableHead>
                    <TableHead>Año Escolar</TableHead>
                    <TableHead>Tiempo</TableHead>
                    <TableHead>Lecciones</TableHead>
                    <TableHead>Creador</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell className="max-w-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium line-clamp-2">
                              {module.title}
                            </p>
                            <Badge variant="secondary" className="flex-shrink-0">
                              Orden: {module.orderIndex}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {module.description}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">
                          {module.competency?.displayName || module.competency?.name || 'Sin competencia'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        {module.academicGrade ? (
                          <Badge variant="secondary">
                            {getAcademicGradeDisplayName(module.academicGrade)}
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
                          <span>{module.estimatedTime} min</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                          <span>{module.lessons?.length || 0}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {module.createdBy ? (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{module.createdBy.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {module.courses && module.courses.length > 0 ? (
                          <Badge variant="outline" className="text-orange-600 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-4 h-4" />
                            En uso ({module.courses.length})
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Disponible
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(module.createdAt)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setManagingLessonsFor(module)}
                            title="Gestionar lecciones"
                          >
                            <List className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(module)}
                            title="Vista previa del módulo"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(module)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteModule(module.id)}
                              className="text-red-600 hover:text-red-700"
                              disabled={module.courses && module.courses.length > 0}
                              title={module.courses && module.courses.length > 0 ? 
                                'No se puede eliminar un módulo que está siendo usado en cursos' : 
                                'Eliminar módulo'
                              }
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
              {totalModules > 0 && pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {startIndex} a {endIndex} de {totalModules} módulos
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(pagination.page - 1)}
                      disabled={pagination.page === 1 || loading}
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
                      disabled={pagination.page === pagination.pages || loading}
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

      {/* Modal para gestionar lecciones del módulo */}
      {managingLessonsFor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <ModuleLessonManagement
              module={managingLessonsFor}
              userRole={userRole}
              onClose={() => setManagingLessonsFor(null)}
            />
          </div>
        </div>
      )}

      {/* Modal de vista previa del módulo */}
      {previewModule && (
        <Dialog open={!!previewModule} onOpenChange={handleClosePreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vista Previa del Módulo</DialogTitle>
              <CardDescription>Resumen del módulo y sus lecciones</CardDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Información principal */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{previewModule.title}</h3>
                <p className="text-muted-foreground">{previewModule.description}</p>
              </div>

              {/* Grid de información */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Competencia</p>
                        <p className="font-medium text-sm">
                          {previewModule.competency?.displayName || previewModule.competency?.name || 'Sin competencia'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tiempo Estimado</p>
                        <p className="font-medium text-sm">{previewModule.estimatedTime} min</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Lecciones</p>
                        <p className="font-medium text-sm">{previewModule.lessons?.length || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Creador</p>
                        <p className="font-medium text-sm">{previewModule.createdBy?.name || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Año escolar si es ICFES */}
              {previewModule.isIcfesModule && previewModule.academicGrade && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {getAcademicGradeDisplayName(previewModule.academicGrade)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Módulo ICFES</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lista de lecciones */}
              {previewLoading ? (
                <Card>
                  <CardContent className="pt-6 pb-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Cargando lecciones...</p>
                  </CardContent>
                </Card>
              ) : previewLessons.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Lecciones del Módulo</Label>
                    <Badge variant="outline">{previewLessons.length} lección{previewLessons.length !== 1 ? 'es' : ''}</Badge>
                  </div>
                  <div className="space-y-2">
                    {previewLessons
                      .slice()
                      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                      .map((lesson, index) => (
                        <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {lesson.orderIndex ?? index + 1}
                                  </Badge>
                                  <h4 className="font-medium">{lesson.title}</h4>
                                </div>
                                {lesson.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {lesson.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  {lesson.estimatedTimeMinutes && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {lesson.estimatedTimeMinutes} min
                                    </span>
                                  )}
                                  {lesson.videoUrl && (
                                    <span className="flex items-center gap-1">
                                      <Video className="h-3 w-3" />
                                      Video
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 pb-6 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Este módulo aún no tiene lecciones asignadas</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Formulario de creación/edición */}
      <Dialog 
        open={showForm || !!editingModule} 
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditingModule(null);
          }
        }}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingModule ? 'Editar Módulo' : 'Crear Nuevo Módulo'}
            </DialogTitle>
          </DialogHeader>
          
          <ModuleForm
            module={editingModule || undefined}
            onSubmit={editingModule ? handleUpdateModule : handleCreateModule}
            onCancel={() => {
              setShowForm(false);
              setEditingModule(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 