'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useModules } from '@/hooks/useModules';
import { ModuleForm } from './ModuleForm';
import { ModuleLessonManagement } from './ModuleLessonManagement';
import { ModuleData, ModuleFormData, ModuleFilters } from '@/types/module';
import { formatDate } from '@/lib/utils';
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
  List
} from 'lucide-react';

interface ModuleManagementProps {
  userRole: string;
  onModuleCreated?: () => void;
}

export function ModuleManagement({ userRole, onModuleCreated }: ModuleManagementProps) {
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
  } = useModules();

  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
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
    
    applyFilters(newFilters);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    clearFilters();
  };

  const handleEdit = (module: ModuleData) => {
    setEditingModule(module);
  };

  const handleCancelEdit = () => {
    setEditingModule(null);
  };

  if (showForm) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => setShowForm(false)}
          className="mb-4"
        >
          ← Volver a la lista
        </Button>
        <ModuleForm
          onSubmit={handleCreateModule}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  if (editingModule) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={handleCancelEdit}
          className="mb-4"
        >
          ← Volver a la lista
        </Button>
        <ModuleForm
          module={editingModule}
          onSubmit={handleUpdateModule}
          onCancel={handleCancelEdit}
        />
      </div>
    );
  }

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar módulos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex items-end space-x-2">
              <Button onClick={handleSearch} className="flex-1">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de módulos */}
      <Card>
        <CardHeader>
          <CardTitle>Módulos ({modules.length})</CardTitle>
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
            <div className="space-y-4">
              {modules.map((module) => (
                <Card key={module.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{module.title}</h3>
                          <Badge variant="secondary">
                            Orden: {module.orderIndex}
                          </Badge>
                          {module.courses && module.courses.length > 0 && (
                            <Badge variant="outline" className="text-orange-600">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              En uso
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-muted-foreground mb-3">
                          {module.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {module.estimatedTime} min
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {module.lessons?.length || 0} lecciones
                          </div>
                          {module.createdBy && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {module.createdBy.name}
                            </div>
                          )}
                          {module.courses && module.courses.length > 0 && (
                            <div className="flex items-center gap-1">
                              <GraduationCap className="w-4 h-4" />
                              {module.courses.length} cursos
                            </div>
                          )}
                        </div>

                        {/* Lecciones del módulo */}
                        {module.lessons && module.lessons.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium mb-1">Lecciones:</p>
                            <div className="flex flex-wrap gap-1">
                              {module.lessons.slice(0, 3).map((lesson) => (
                                <Badge key={lesson.id} variant="outline" className="text-xs">
                                  {lesson.title}
                                </Badge>
                              ))}
                              {module.lessons.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{module.lessons.length - 3} más
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Cursos que usan este módulo */}
                        {module.courses && module.courses.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium mb-1">Usado en cursos:</p>
                            <div className="flex flex-wrap gap-1">
                              {module.courses.slice(0, 3).map((course) => (
                                <Badge key={course.id} variant="outline" className="text-xs">
                                  {course.title}
                                  {course.school && ` (${course.school.name})`}
                                </Badge>
                              ))}
                              {module.courses.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{module.courses.length - 3} más
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Creado: {formatDate(module.createdAt)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
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
                          onClick={() => handleEdit(module)}
                          disabled={!canEdit}
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
                            className="text-destructive hover:text-destructive"
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
    </div>
  );
} 