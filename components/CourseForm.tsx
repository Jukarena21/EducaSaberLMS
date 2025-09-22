'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { CourseData, CourseFormData } from '@/types/course';
import { ModuleData } from '@/types/module';
import { CompetencyData } from '@/types/competency';
import { SchoolData } from '@/types/school';
import { X, BookOpen, Clock, User } from 'lucide-react';

interface CourseFormProps {
  course?: CourseData;
  modules: ModuleData[];
  competencies: CompetencyData[];
  schools: SchoolData[];
  userRole: string;
  userSchoolId?: string;
  onSubmit: (data: CourseFormData) => Promise<void>;
  onCancel: () => void;
}

export function CourseForm({ 
  course, 
  modules, 
  competencies, 
  schools, 
  userRole, 
  userSchoolId,
  onSubmit, 
  onCancel 
}: CourseFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    year: 6,
    competencyId: '',
    schoolId: '',
    moduleIds: [],
  });
  const [loading, setLoading] = useState(false);

  // Cargar datos del curso si se está editando
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        description: course.description,
        year: course.year,
        competencyId: course.competencyId,
        schoolId: course.schoolId,
        moduleIds: course.modules?.map(m => m.id) || [],
      });
    } else if (userRole === 'school_admin' && userSchoolId) {
      // Para admin de colegio, pre-seleccionar su colegio
      setFormData(prev => ({
        ...prev,
        schoolId: userSchoolId,
      }));
    }
  }, [course, userRole, userSchoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
      toast({
        title: course ? 'Curso actualizado' : 'Curso creado',
        description: course 
          ? 'El curso se ha actualizado correctamente.'
          : 'El curso se ha creado correctamente.',
      });
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

  const handleInputChange = (field: keyof CourseFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleModuleToggle = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      moduleIds: prev.moduleIds.includes(moduleId)
        ? prev.moduleIds.filter(id => id !== moduleId)
        : [...prev.moduleIds, moduleId],
    }));
  };

  const removeModule = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      moduleIds: prev.moduleIds.filter(id => id !== moduleId),
    }));
  };

  // Filtrar módulos disponibles (solo los creados por Profesor Admin)
  // Para school_admin, mostrar todos los módulos disponibles
  // Para teacher_admin, mostrar todos los módulos (pueden usar cualquier módulo)
  const availableModules = modules;

  // Obtener módulos seleccionados
  const selectedModules = availableModules.filter(module => 
    formData.moduleIds.includes(module.id)
  );

  // Filtrar colegios según el rol
  const availableSchools = userRole === 'teacher_admin' 
    ? schools 
    : schools.filter(school => school.id === userSchoolId);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{course ? 'Editar Curso' : 'Crear Nuevo Curso'}</CardTitle>
        <CardDescription>
          {course 
            ? 'Modifica los datos del curso'
            : 'Completa la información para crear un nuevo curso'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ej: Matemáticas 6to Grado"
                required
              />
            </div>

            {/* Año escolar */}
            <div className="space-y-2">
              <Label htmlFor="year">Año escolar *</Label>
              <Select
                value={formData.year.toString()}
                onValueChange={(value) => handleInputChange('year', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el año" />
                </SelectTrigger>
                <SelectContent>
                  {[6, 7, 8, 9, 10, 11].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}° Grado
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Competencia */}
            <div className="space-y-2">
              <Label htmlFor="competencyId">Competencia *</Label>
              <Select
                value={formData.competencyId || 'none'}
                onValueChange={(value) => handleInputChange('competencyId', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una competencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecciona una competencia</SelectItem>
                  {competencies.map((competency) => (
                    <SelectItem key={competency.id} value={competency.id}>
                      {competency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Colegio */}
            <div className="space-y-2">
              <Label htmlFor="schoolId">Colegio *</Label>
              <Select
                value={formData.schoolId || 'none'}
                onValueChange={(value) => handleInputChange('schoolId', value === 'none' ? '' : value)}
                disabled={userRole === 'school_admin'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un colegio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecciona un colegio</SelectItem>
                  {availableSchools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {userRole === 'school_admin' && (
                <p className="text-sm text-muted-foreground">
                  Solo puedes crear cursos para tu colegio
                </p>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe el contenido y objetivos del curso"
              rows={3}
              required
            />
          </div>

          {/* Selección de módulos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Módulos del curso *</Label>
              <Badge variant="secondary">
                {formData.moduleIds.length} seleccionados
              </Badge>
            </div>
            
            {formData.moduleIds.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Módulos seleccionados:</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedModules.map((module) => (
                    <Badge key={module.id} variant="outline" className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {module.title}
                      <button
                        type="button"
                        onClick={() => removeModule(module.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Módulos disponibles:</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                {availableModules.length === 0 ? (
                  <p className="text-muted-foreground col-span-2 text-center py-4">
                    No hay módulos disponibles. Los Profesores Administradores deben crear módulos primero.
                  </p>
                ) : (
                  availableModules.map((module) => (
                    <div
                      key={module.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                        formData.moduleIds.includes(module.id)
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={formData.moduleIds.includes(module.id)}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            moduleIds: checked
                              ? [...prev.moduleIds, module.id]
                              : prev.moduleIds.filter(id => id !== module.id),
                          }));
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">{module.title}</h4>
                          <Badge variant="secondary" className="text-xs">
                            Orden en este curso: se definirá
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {module.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {module.estimatedTime} min
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {module.lessons?.length || 0} lecciones
                          </div>
                          {module.createdBy && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {module.createdBy.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Información del curso</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Solo puede haber 1 curso por año/competencia por colegio</p>
              <p>• Los módulos son creados por Profesores Administradores</p>
              <p>• Los Administradores de Colegio solo pueden crear cursos para su institución</p>
              <p>• Los Profesores Administradores pueden crear cursos para cualquier colegio</p>
            </div>
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
              disabled={loading || formData.moduleIds.length === 0}
            >
              {loading ? 'Guardando...' : (course ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 