'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { LiveClassData, LiveClassFormData } from '@/types/liveClass';
import { SchoolData } from '@/types/school';
import { ACADEMIC_YEARS, ACADEMIC_GRADES, getAcademicGradeDisplayName } from '@/lib/academicGrades';
import { 
  Video, 
  Calendar,
  Clock,
  Link as LinkIcon,
  BookOpen,
  GraduationCap,
  Award,
  Building2,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';

type SimpleCompetency = {
  id: string;
  name: string;
  displayName?: string;
};

type SimpleModule = {
  id: string;
  title: string;
  competencyId?: string;
  academicGrade?: string;
};

type SimpleLesson = {
  id: string;
  title: string;
  moduleId?: string;
  competencyId?: string;
  academicGrade?: string;
};

interface LiveClassFormProps {
  liveClass?: LiveClassData;
  competencies: SimpleCompetency[];
  modules: SimpleModule[];
  lessons: SimpleLesson[];
  schools: (SchoolData & { id: string })[];
  userRole: string;
  userSchoolId?: string;
  onSubmit: (data: LiveClassFormData) => Promise<void>;
  onCancel: () => void;
}

const PROVIDER_OPTIONS = [
  { value: 'zoom', label: 'Zoom' },
  { value: 'meet', label: 'Google Meet' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'webex', label: 'Cisco Webex' },
  { value: 'other', label: 'Otro' },
];

export function LiveClassForm({
  liveClass,
  competencies: initialCompetencies,
  modules: initialModules,
  lessons: initialLessons,
  schools,
  userRole,
  userSchoolId,
  onSubmit,
  onCancel,
}: LiveClassFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<LiveClassFormData & { academicGrade?: string }>({
    title: '',
    description: '',
    meetingUrl: '',
    provider: undefined,
    startDateTime: '',
    endDateTime: '',
    academicGrade: '',
    competencyId: '',
    moduleId: '',
    lessonId: '',
    schoolId: userRole === 'school_admin' ? userSchoolId || '' : '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const isEditing = !!liveClass;

  // Estados para datos filtrados
  const [filteredCompetencies, setFilteredCompetencies] = useState<SimpleCompetency[]>([]);
  const [filteredModules, setFilteredModules] = useState<SimpleModule[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<SimpleLesson[]>([]);

  // Cargar datos de la clase si se está editando
  useEffect(() => {
    if (liveClass) {
      const startDate = new Date(liveClass.startDateTime);
      const endDate = liveClass.endDateTime ? new Date(liveClass.endDateTime) : null;
      
      const formatDateTime = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        title: liveClass.title,
        description: liveClass.description || '',
        meetingUrl: liveClass.meetingUrl,
        provider: liveClass.provider,
        startDateTime: formatDateTime(startDate),
        endDateTime: endDate ? formatDateTime(endDate) : '',
        academicGrade: liveClass.academicGrade || '',
        competencyId: liveClass.competencyId || '',
        moduleId: liveClass.moduleId || '',
        lessonId: liveClass.lessonId || '',
        schoolId: liveClass.schoolId || (userRole === 'school_admin' ? userSchoolId || '' : ''),
      });
    }
  }, [liveClass, userRole, userSchoolId]);

  // Cargar competencias filtradas por colegio y año escolar
  useEffect(() => {
    const loadFilteredData = async () => {
      if (!formData.schoolId || !formData.academicGrade) {
        setFilteredCompetencies([]);
        setFilteredModules([]);
        setFilteredLessons([]);
        return;
      }

      setLoadingData(true);
      try {
        // Cargar cursos del colegio y año escolar
        const coursesResponse = await fetch(`/api/courses?schoolId=${formData.schoolId}`);
        if (!coursesResponse.ok) throw new Error('Error al cargar cursos');
        
        const courses = await coursesResponse.json();
        
        // Filtrar cursos por año escolar
        const coursesForGrade = courses.filter((course: any) => 
          course.academicGrade === formData.academicGrade
        );

        // Extraer competencias únicas de los cursos
        const competenciesMap = new Map<string, SimpleCompetency>();
        coursesForGrade.forEach((course: any) => {
          if (course.competency && !competenciesMap.has(course.competency.id)) {
            competenciesMap.set(course.competency.id, {
              id: course.competency.id,
              name: course.competency.name,
              displayName: course.competency.displayName
            });
          }
        });
        
        setFilteredCompetencies(Array.from(competenciesMap.values()));

        // Si hay una competencia seleccionada, cargar módulos
        if (formData.competencyId) {
          const modulesResponse = await fetch(`/api/modules?competencyId=${formData.competencyId}`);
          if (modulesResponse.ok) {
            const allModules = await modulesResponse.json();
            const modulesForGrade = allModules.filter((module: any) => 
              (!module.academicGrade || module.academicGrade === formData.academicGrade) &&
              module.competencyId === formData.competencyId
            );
            setFilteredModules(modulesForGrade);
          }
        } else {
          setFilteredModules([]);
        }

        // Si hay un módulo seleccionado, cargar lecciones
        if (formData.moduleId) {
          const params = new URLSearchParams();
          params.append('moduleId', formData.moduleId);
          if (formData.competencyId) {
            params.append('competencyId', formData.competencyId);
          }
          
          const lessonsResponse = await fetch(`/api/lessons?${params.toString()}`);
          if (lessonsResponse.ok) {
            const allLessons = await lessonsResponse.json();
            // Filtrar lecciones por año escolar
            const lessonsForGrade = allLessons.filter((lesson: any) => {
              // Verificar que la lección pertenezca al módulo seleccionado
              const belongsToModule = lesson.modules?.some((m: any) => m.moduleId === formData.moduleId);
              // Verificar año escolar si está definido
              const gradeMatches = !lesson.academicGrade || lesson.academicGrade === formData.academicGrade;
              return belongsToModule && gradeMatches;
            });
            setFilteredLessons(lessonsForGrade.map((l: any) => ({
              id: l.id,
              title: l.title,
              moduleId: formData.moduleId,
              competencyId: l.competencyId || formData.competencyId,
              academicGrade: l.academicGrade
            })));
          }
        } else {
          setFilteredLessons([]);
        }
      } catch (error) {
        console.error('Error loading filtered data:', error);
        toast({
          title: 'Error',
          description: 'Error al cargar los datos filtrados',
          variant: 'destructive',
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadFilteredData();
  }, [formData.schoolId, formData.academicGrade, formData.competencyId, formData.moduleId, toast]);

  // Estados de habilitación progresiva
  const schoolSelected = !!formData.schoolId;
  const academicGradeSelected = !!formData.academicGrade;
  const canSubmit = schoolSelected && academicGradeSelected && !!formData.startDateTime && !!formData.title && !!formData.meetingUrl;

  // Filtrar colegios según el rol
  const availableSchools = useMemo(() => {
    if (userRole === 'school_admin') {
      return schools.filter(school => school.id === userSchoolId);
    }
    return schools;
  }, [schools, userRole, userSchoolId]);

  const handleInputChange = (field: keyof LiveClassFormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Si cambia el colegio, limpiar todo lo demás excepto si está editando
      if (field === 'schoolId' && !isEditing) {
        return {
          ...newData,
          academicGrade: '',
          competencyId: '',
          moduleId: '',
          lessonId: '',
        };
      }
      
      // Si cambia el año escolar, limpiar competencia, módulo y lección
      if (field === 'academicGrade') {
        return {
          ...newData,
          competencyId: '',
          moduleId: '',
          lessonId: '',
        };
      }
      
      // Si cambia la competencia, limpiar módulo y lección
      if (field === 'competencyId') {
        return {
          ...newData,
          moduleId: '',
          lessonId: '',
        };
      }
      
      // Si cambia el módulo, limpiar lección
      if (field === 'moduleId') {
        return {
          ...newData,
          lessonId: '',
        };
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.schoolId) {
      toast({
        title: 'Error',
        description: 'El colegio es requerido',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.academicGrade) {
      toast({
        title: 'Error',
        description: 'El año escolar es requerido',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'El título es requerido',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.meetingUrl.trim()) {
      toast({
        title: 'Error',
        description: 'El enlace de la reunión es requerido',
        variant: 'destructive',
      });
      return;
    }

    try {
      new URL(formData.meetingUrl);
    } catch {
      toast({
        title: 'Error',
        description: 'El enlace de la reunión debe ser una URL válida',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.startDateTime) {
      toast({
        title: 'Error',
        description: 'La fecha y hora de inicio es requerida',
        variant: 'destructive',
      });
      return;
    }

    const startDate = new Date(formData.startDateTime);
    if (startDate < new Date()) {
      toast({
        title: 'Error',
        description: 'La fecha y hora de inicio debe ser futura',
        variant: 'destructive',
      });
      return;
    }

    if (formData.endDateTime) {
      const endDate = new Date(formData.endDateTime);
      if (endDate <= startDate) {
        toast({
          title: 'Error',
          description: 'La fecha y hora de fin debe ser posterior a la de inicio',
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);
    try {
      const submitData: LiveClassFormData = {
        ...formData,
        startDateTime: new Date(formData.startDateTime).toISOString(),
        endDateTime: formData.endDateTime ? new Date(formData.endDateTime).toISOString() : undefined,
        academicGrade: formData.academicGrade || undefined,
        competencyId: formData.competencyId || undefined,
        moduleId: formData.moduleId || undefined,
        lessonId: formData.lessonId || undefined,
        schoolId: formData.schoolId || undefined,
      };

      await onSubmit(submitData);
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al guardar la clase',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            {isEditing ? 'Editar Clase en Vivo' : 'Nueva Clase en Vivo'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica la información de la clase en vivo'
              : 'Completa el formulario paso a paso para crear una nueva clase en vivo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PARTE 1: SELECCIÓN DE CONTENIDO (A QUIÉN VA LA REUNIÓN) */}
          <div className="space-y-4 border-b pb-6">
            <h3 className="text-lg font-semibold text-muted-foreground">
              Parte 1: Seleccionar Contenido (A quién va la reunión)
            </h3>

            {/* Paso 1: Colegio (Obligatorio) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full ${schoolSelected ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {schoolSelected ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                </div>
                <Label htmlFor="school" className="text-base font-medium">
                  Colegio *
                </Label>
              </div>
              <Select
                value={formData.schoolId || 'none'}
                onValueChange={(value) => handleInputChange('schoolId', value === 'none' ? '' : value)}
                disabled={userRole === 'school_admin'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un colegio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Seleccionar colegio</SelectItem>
                  {availableSchools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Paso 2: Año Escolar (Obligatorio) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full ${academicGradeSelected ? 'bg-green-500 text-white' : schoolSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {academicGradeSelected ? <CheckCircle2 className="w-4 h-4" /> : '2'}
                </div>
                <Label htmlFor="academicGrade" className="text-base font-medium">
                  Año Escolar *
                </Label>
              </div>
              <Select
                value={formData.academicGrade || 'none'}
                onValueChange={(value) => handleInputChange('academicGrade', value === 'none' ? '' : value)}
                disabled={!schoolSelected}
              >
                <SelectTrigger>
                  <SelectValue placeholder={schoolSelected ? "Selecciona el año escolar" : "Primero selecciona un colegio"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Seleccionar año escolar</SelectItem>
                  {ACADEMIC_YEARS.map((year) => (
                    <SelectItem key={year} value={ACADEMIC_GRADES[year]}>
                      {getAcademicGradeDisplayName(ACADEMIC_GRADES[year])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Paso 3: Competencia (Opcional) */}
            {academicGradeSelected && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600">
                    3
                  </div>
                  <Label htmlFor="competency" className="text-base font-medium">
                    Competencia (Opcional)
                  </Label>
                  {loadingData && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
                <Select
                  value={formData.competencyId || 'none'}
                  onValueChange={(value) => handleInputChange('competencyId', value === 'none' ? '' : value)}
                  disabled={!academicGradeSelected || loadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? "Cargando competencias..." : filteredCompetencies.length === 0 ? "No hay competencias disponibles" : "Seleccionar competencia (opcional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin competencia</SelectItem>
                    {filteredCompetencies.map((competency) => (
                      <SelectItem key={competency.id} value={competency.id}>
                        {competency.displayName || competency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filteredCompetencies.length === 0 && academicGradeSelected && !loadingData && (
                  <p className="text-xs text-muted-foreground">
                    No hay competencias disponibles para este colegio y año escolar
                  </p>
                )}
              </div>
            )}

            {/* Paso 4: Módulo (Opcional) */}
            {formData.competencyId && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600">
                    4
                  </div>
                  <Label htmlFor="module" className="text-base font-medium">
                    Módulo (Opcional)
                  </Label>
                  {loadingData && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
                <Select
                  value={formData.moduleId || 'none'}
                  onValueChange={(value) => handleInputChange('moduleId', value === 'none' ? '' : value)}
                  disabled={!formData.competencyId || loadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? "Cargando módulos..." : filteredModules.length === 0 ? "No hay módulos disponibles" : "Seleccionar módulo (opcional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin módulo</SelectItem>
                    {filteredModules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filteredModules.length === 0 && formData.competencyId && !loadingData && (
                  <p className="text-xs text-muted-foreground">
                    No hay módulos disponibles para esta competencia y año escolar
                  </p>
                )}
              </div>
            )}

            {/* Paso 5: Lección (Opcional) */}
            {formData.moduleId && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600">
                    5
                  </div>
                  <Label htmlFor="lesson" className="text-base font-medium">
                    Lección (Opcional)
                  </Label>
                  {loadingData && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
                <Select
                  value={formData.lessonId || 'none'}
                  onValueChange={(value) => handleInputChange('lessonId', value === 'none' ? '' : value)}
                  disabled={!formData.moduleId || loadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingData ? "Cargando lecciones..." : filteredLessons.length === 0 ? "No hay lecciones disponibles" : "Seleccionar lección (opcional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin lección</SelectItem>
                    {filteredLessons.map((lesson) => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filteredLessons.length === 0 && formData.moduleId && !loadingData && (
                  <p className="text-xs text-muted-foreground">
                    No hay lecciones disponibles para este módulo y año escolar
                  </p>
                )}
              </div>
            )}
          </div>

          {/* PARTE 2: INFORMACIÓN DE LA REUNIÓN */}
          {academicGradeSelected && (
            <div className="space-y-4 border-b pb-6">
              <h3 className="text-lg font-semibold text-muted-foreground">
                Parte 2: Información de la Reunión
              </h3>

              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ej: Clase de Matemáticas - Álgebra"
                  required
                />
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descripción opcional de la clase..."
                  rows={3}
                />
              </div>

              {/* Enlace de la Reunión */}
              <div className="space-y-2">
                <Label htmlFor="meetingUrl">Enlace de la Reunión *</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="meetingUrl"
                    type="url"
                    value={formData.meetingUrl}
                    onChange={(e) => handleInputChange('meetingUrl', e.target.value)}
                    placeholder="https://zoom.us/j/123456789 o https://meet.google.com/xxx-yyyy-zzz"
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Puede ser un enlace de Zoom, Google Meet, Microsoft Teams, Webex, etc.
                </p>
              </div>

              {/* Proveedor */}
              <div className="space-y-2">
                <Label htmlFor="provider">Proveedor (Opcional)</Label>
                <Select
                  value={formData.provider || 'none'}
                  onValueChange={(value) => handleInputChange('provider', value === 'none' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin especificar</SelectItem>
                    {PROVIDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDateTime">Fecha y Hora de Inicio *</Label>
                  <Input
                    id="startDateTime"
                    type="datetime-local"
                    value={formData.startDateTime}
                    onChange={(e) => handleInputChange('startDateTime', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDateTime">Fecha y Hora de Fin (Opcional)</Label>
                  <Input
                    id="endDateTime"
                    type="datetime-local"
                    value={formData.endDateTime}
                    onChange={(e) => handleInputChange('endDateTime', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!canSubmit || loading}
              className={canSubmit ? '' : 'opacity-50 cursor-not-allowed'}
            >
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')} Clase
            </Button>
          </div>

          {/* Indicador de progreso */}
          {!isEditing && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Progreso:</p>
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`flex items-center gap-1 ${schoolSelected ? 'text-green-600' : 'text-gray-400'}`}>
                  {schoolSelected ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>Colegio</span>
                </div>
                <span>→</span>
                <div className={`flex items-center gap-1 ${academicGradeSelected ? 'text-green-600' : 'text-gray-400'}`}>
                  {academicGradeSelected ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>Año Escolar</span>
                </div>
                <span>→</span>
                <div className={`flex items-center gap-1 ${formData.startDateTime ? 'text-green-600' : 'text-gray-400'}`}>
                  {formData.startDateTime ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>Fecha/Hora</span>
                </div>
                <span>→</span>
                <div className={`flex items-center gap-1 ${canSubmit ? 'text-green-600' : 'text-gray-400'}`}>
                  {canSubmit ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>Listo para crear</span>
                </div>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
