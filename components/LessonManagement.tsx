'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCompetencies } from '@/hooks/useCompetencies';
import { useLessons } from '@/hooks/useLessons';
import { LessonForm } from './LessonForm';
import { LessonData, LessonFormData, LessonFilters } from '@/types/lesson';
import { ModuleData } from '@/types/module';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompetency, setSelectedCompetency] = useState('none');

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
    if (confirm('¿Estás seguro de que quieres eliminar esta lección?')) {
      const success = await deleteLesson(lessonId);
      if (success) {
        toast({
          title: 'Lección eliminada',
          description: 'La lección se ha eliminado correctamente.',
        });
      }
    }
  };

  const handleSearch = () => {
    const newFilters: LessonFilters = {};
    if (searchTerm) newFilters.search = searchTerm;
    if (selectedCompetency && selectedCompetency !== 'none') newFilters.competencyId = selectedCompetency;
    
    applyFilters(newFilters);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCompetency('none');
    clearFilters();
  };

  const handleEdit = (lesson: LessonData) => {
    setEditingLesson(lesson);
  };

  const handleCancelEdit = () => {
    setEditingLesson(null);
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
        <LessonForm
          onSubmit={handleCreateLesson}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  if (editingLesson) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={handleCancelEdit}
          className="mb-4"
        >
          ← Volver a la lista
        </Button>
        <LessonForm
          lesson={editingLesson}
          onSubmit={handleUpdateLesson}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
          {canEdit && (
            <div className="mt-4 p-3 border rounded-md bg-muted/30 flex items-center gap-3">
              <div className="text-sm">Lecciones sin competencia: <strong>{unassignedCount}</strong></div>
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
              <Button onClick={assignBulk} disabled={unassignedCount === 0}>Asignar en lote</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de lecciones */}
      <Card>
        <CardHeader>
          <CardTitle>Lecciones ({lessons.length})</CardTitle>
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
            <div className="space-y-4">
              {lessons.map((lesson) => (
                <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{lesson.title}</h3>
                          <Badge variant="secondary">
                            {lesson.modules.length} módulos
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground mb-3">
                          {lesson.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {lesson.estimatedTimeMinutes} min
                          </div>
                          {lesson.videoUrl && (
                            <div className="flex items-center gap-1">
                              <Video className="w-4 h-4" />
                              Video disponible
                            </div>
                          )}
                          {lesson.modules.length > 0 && (
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {lesson.modules.length} módulo{lesson.modules.length !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Creada: {formatDate(lesson.createdAt)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(lesson)}
                          disabled={!canEdit}
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
                            className="text-destructive hover:text-destructive"
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
    </div>
  );
} 