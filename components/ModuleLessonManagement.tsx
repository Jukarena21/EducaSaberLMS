'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ModuleLessonData, LessonData } from '@/types/lesson';
import { ModuleData } from '@/types/module';
import { formatDate } from '@/lib/utils';
import { 
  Search, 
  Clock,
  BookOpen,
  Video,
  X
} from 'lucide-react';

interface ModuleLessonManagementProps {
  module: ModuleData;
  userRole: string;
  onClose: () => void;
}

export function ModuleLessonManagement({ module, userRole, onClose }: ModuleLessonManagementProps) {
  const { toast } = useToast();
  const [moduleLessons, setModuleLessons] = useState<ModuleLessonData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  useEffect(() => {
    fetchModuleLessons();
  }, [module.id]);

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
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
        </div>
      </div>

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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
