'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ModuleLessonData, LessonData } from '@/types/lesson';
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
  Video,
  X,
  Check
} from 'lucide-react';

interface ModuleLessonManagementProps {
  module: ModuleData;
  userRole: string;
  onClose: () => void;
}

export function ModuleLessonManagement({ module, userRole, onClose }: ModuleLessonManagementProps) {
  const { toast } = useToast();
  const [moduleLessons, setModuleLessons] = useState<ModuleLessonData[]>([]);
  const [availableLessons, setAvailableLessons] = useState<LessonData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [selectedOrderIndex, setSelectedOrderIndex] = useState(1);

  const canModify = userRole === 'teacher_admin';

  // Cargar lecciones del módulo
  const fetchModuleLessons = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/modules/${module.id}/lessons`);
      if (response.ok) {
        const data = await response.json();
        setModuleLessons(data);
      } else {
        throw new Error('Error al cargar lecciones del módulo');
      }
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

  // Cargar lecciones disponibles para agregar
  const fetchAvailableLessons = async () => {
    try {
      const response = await fetch('/api/lessons');
      if (response.ok) {
        const allLessons: LessonData[] = await response.json();
        // Filtrar lecciones que no están ya en este módulo
        const moduleLessonIds = moduleLessons.map(ml => ml.id);
        const available = allLessons.filter(lesson => !moduleLessonIds.includes(lesson.id));
        setAvailableLessons(available);
      }
    } catch (error) {
      console.error('Error fetching available lessons:', error);
    }
  };

  useEffect(() => {
    fetchModuleLessons();
  }, [module.id]);

  useEffect(() => {
    if (showAddLesson) {
      fetchAvailableLessons();
    }
  }, [showAddLesson, moduleLessons]);

  const handleAddLesson = async () => {
    if (!selectedLessonId) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar una lección',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/modules/${module.id}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId: selectedLessonId,
          orderIndex: selectedOrderIndex,
        }),
      });

      if (response.ok) {
        const newLesson = await response.json();
        setModuleLessons(prev => [...prev, newLesson]);
        setShowAddLesson(false);
        setSelectedLessonId('');
        setSelectedOrderIndex(1);
        toast({
          title: 'Lección agregada',
          description: 'La lección se ha agregado al módulo correctamente.',
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error al agregar lección');
      }
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

  const handleRemoveLesson = async (lessonId: string) => {
    if (!confirm('¿Estás seguro de que quieres remover esta lección del módulo?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/modules/${module.id}/lessons?lessonId=${lessonId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setModuleLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
        toast({
          title: 'Lección removida',
          description: 'La lección se ha removido del módulo correctamente.',
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error al remover lección');
      }
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

  const filteredLessons = moduleLessons.filter(lesson =>
    lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lesson.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Lecciones del Módulo: {module.title}</h3>
          <p className="text-sm text-gray-600">
            {moduleLessons.length} lección{moduleLessons.length !== 1 ? 'es' : ''} en este módulo
          </p>
        </div>
        <div className="flex space-x-2">
          {canModify && (
            <Button onClick={() => setShowAddLesson(true)} className="bg-[#73A2D3]">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Lección
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
        </div>
      </div>

      {/* Modal para agregar lección */}
      {showAddLesson && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle>Agregar Lección al Módulo</CardTitle>
            <CardDescription>
              Selecciona una lección existente para agregar a este módulo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-select">Lección</Label>
              <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una lección" />
                </SelectTrigger>
                <SelectContent>
                  {availableLessons.map(lesson => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-index">Orden en el módulo</Label>
              <Input
                id="order-index"
                type="number"
                min="1"
                value={selectedOrderIndex}
                onChange={(e) => setSelectedOrderIndex(parseInt(e.target.value) || 1)}
                placeholder="1"
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleAddLesson} disabled={loading || !selectedLessonId}>
                <Check className="h-4 w-4 mr-2" />
                Agregar
              </Button>
              <Button variant="outline" onClick={() => setShowAddLesson(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar lecciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Lista de lecciones */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Cargando lecciones...</div>
        </div>
      ) : filteredLessons.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron lecciones' : 'No hay lecciones en este módulo'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda'
                : canModify 
                  ? 'Agrega lecciones para comenzar'
                  : 'Este módulo aún no tiene lecciones asignadas'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLessons.map((lesson) => (
            <Card key={lesson.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        Orden: {lesson.orderIndex}
                      </Badge>
                      {lesson.isPublished ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Publicada
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Borrador
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{lesson.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{lesson.estimatedTimeMinutes} min</span>
                      </span>
                      {lesson.videoUrl && (
                        <span className="flex items-center space-x-1">
                          <Video className="h-3 w-3" />
                          <span>Video</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <BookOpen className="h-3 w-3" />
                        <span>Teoría</span>
                      </span>
                    </div>
                  </div>
                  {canModify && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveLesson(lesson.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
