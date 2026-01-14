'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { CourseData, CourseFormData } from '@/types/course';
import { ModuleData } from '@/types/module';
// Competency type definition
type CompetencyData = {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  colorHex?: string;
};
import { SchoolData } from '@/types/school';
import { ACADEMIC_YEARS } from '@/lib/academicGrades';
import { 
  BookOpen, 
  Clock, 
  User, 
  X, 
  Search, 
  Building2, 
  GraduationCap,
  Filter,
  Info,
  Award,
  BookMarked,
  ArrowRight
} from 'lucide-react';

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
    isIcfesCourse: false,
    schoolIds: [],
    moduleIds: [],
  });
  const [loading, setLoading] = useState(false);
  const isEditing = !!course;
  // Si está editando, ya tiene tipo seleccionado. Si está creando, necesita seleccionar tipo primero
  const [courseTypeSelected, setCourseTypeSelected] = useState(!!course);
  
  // Estados para crear nueva competencia
  const [showNewCompetencyInput, setShowNewCompetencyInput] = useState(false);
  const [newCompetencyName, setNewCompetencyName] = useState('');
  const [creatingCompetency, setCreatingCompetency] = useState(false);
  
  // Estados para búsqueda y filtros de módulos
  const [moduleSearch, setModuleSearch] = useState('');
  const [moduleCompetencyFilter, setModuleCompetencyFilter] = useState<string>('all');
  const [moduleCreatorFilter, setModuleCreatorFilter] = useState<string>('all');
  const [moduleTimeFilter, setModuleTimeFilter] = useState<string>('all');
  const [moduleSortBy, setModuleSortBy] = useState<string>('title');
  const [showOnlyAvailableModules, setShowOnlyAvailableModules] = useState(false);

  // Estados para búsqueda y filtros de colegios
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schoolTypeFilter, setSchoolTypeFilter] = useState<string>('all');
  const [schoolSortBy, setSchoolSortBy] = useState<string>('name');

  // Cargar datos del curso si se está editando
  useEffect(() => {
    if (course) {
      // Asegurarse de que competencyId sea una cadena, incluso si es undefined
      const competencyId = course.competencyId || '';
      
      // Verificar que la competencia existe en la lista
      const competencyExists = competencies.some(c => c.id === competencyId);
      
      console.log('📝 [CourseForm] Cargando curso para edición:', {
        courseId: course.id,
        competencyId: competencyId,
        competencyExists: competencyExists,
        isIcfesCourse: course.isIcfesCourse,
        availableCompetencies: competencies.length,
        allCompetencies: competencies.map(c => ({ id: c.id, name: c.displayName || c.name }))
      });
      
      if (competencyId && !competencyExists) {
        console.warn('⚠️ [CourseForm] La competencia del curso no está en la lista de competencias disponibles');
      }
      
      setFormData({
        title: course.title || '',
        description: course.description || '',
        year: course.year || 6,
        competencyId: competencyId,
        isIcfesCourse: course.isIcfesCourse ?? false,
        schoolIds: course.schoolIds || course.schools?.map(s => s.id) || course.courseSchools?.map(cs => cs.school.id) || [],
        moduleIds: course.modules?.map(m => m.id) || [],
      });
      setCourseTypeSelected(true); // Si está editando, ya tiene tipo
    } else {
      setCourseTypeSelected(false); // Si está creando, necesita seleccionar tipo primero
      if (userRole === 'school_admin' && userSchoolId) {
        // Para admin de colegio, pre-seleccionar su colegio
        setFormData(prev => ({
          ...prev,
          schoolIds: [userSchoolId],
        }));
      }
    }
  }, [course, userRole, userSchoolId, competencies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que si es ICFES, tenga año escolar
    if (formData.isIcfesCourse && !formData.year) {
      toast({
        title: 'Error de validación',
        description: 'El año escolar es requerido para cursos ICFES',
        variant: 'destructive',
      });
      return;
    }
    
    // Validar que la competencia esté seleccionada
    if (!formData.competencyId || formData.competencyId === '') {
      toast({
        title: 'Error de validación',
        description: 'Debes seleccionar una competencia',
        variant: 'destructive',
      });
      return;
    }
    
    // Log para debugging
    console.log('📤 [CourseForm] Enviando formulario:', {
      competencyId: formData.competencyId,
      isIcfesCourse: formData.isIcfesCourse,
      moduleIds: formData.moduleIds?.length || 0,
      schoolIds: formData.schoolIds?.length || 0
    });
    
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

  const handleInputChange = (field: keyof CourseFormData, value: string | number | string[] | boolean) => {
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

  // Filtrar colegios según el rol
  const availableSchools = useMemo(() => {
    return userRole === 'teacher_admin' 
      ? schools 
      : schools.filter(school => school.id === userSchoolId);
  }, [userRole, schools, userSchoolId]);

  // Competencias ICFES (nombres exactos)
  const icfesCompetencyNames = [
    'Lectura Crítica',
    'Razonamiento Cuantitativo',
    'Competencias Ciudadanas',
    'Comunicación Escrita',
    'Inglés',
    // slugs / nombres internos
    'lectura_critica',
    'razonamiento_cuantitativo',
    'competencias_ciudadanas',
    'comunicacion_escrita',
    'ingles',
    // variantes antiguas (para compatibilidad)
    'Matemáticas',
    'Ciencias Naturales',
    'Ciencias Sociales y Ciudadanas',
    'matematicas',
    'ciencias_naturales',
    'ciencias_sociales',
  ];

  // Obtener la competencia actual del curso (si está editando)
  const currentCourseCompetency = useMemo(() => {
    if (course?.competencyId) {
      return competencies.find(c => c.id === course.competencyId);
    }
    return null;
  }, [course, competencies]);

  // Filtrar competencias según el tipo de curso
  const availableCompetencies = useMemo(() => {
    let filtered: typeof competencies = [];
    
    if (formData.isIcfesCourse) {
      // Si es ICFES, solo mostrar competencias ICFES (excluir "otros" y otras no ICFES)
      filtered = competencies.filter(c => 
        icfesCompetencyNames.includes(c.name) || 
        icfesCompetencyNames.includes(c.displayName || '')
      );
    } else {
      // Si no es ICFES (General), solo mostrar competencias NO ICFES (excluir competencias ICFES)
      filtered = competencies.filter(c => 
        !icfesCompetencyNames.includes(c.name) && 
        !icfesCompetencyNames.includes(c.displayName || '')
      );
    }
    
    // Si estamos editando y la competencia actual no está en la lista filtrada, agregarla al inicio
    if (currentCourseCompetency && !filtered.some(c => c.id === currentCourseCompetency.id)) {
      filtered = [currentCourseCompetency, ...filtered];
    }
    
    return filtered;
  }, [competencies, formData.isIcfesCourse, currentCourseCompetency]);

  // Filtrar módulos disponibles según el tipo de curso y competencia seleccionada
  const availableModules = useMemo(() => {
    let filtered = modules;
    
    // Primero filtrar por tipo de curso
    if (formData.isIcfesCourse) {
      // Si es ICFES, solo mostrar módulos de competencias ICFES
      filtered = filtered.filter(module => {
        const moduleCompetency = competencies.find(c => c.id === module.competencyId);
        return moduleCompetency && (
          icfesCompetencyNames.includes(moduleCompetency.name) || 
          icfesCompetencyNames.includes(moduleCompetency.displayName || '')
        );
      });
    } else {
      // Si no es ICFES, solo mostrar módulos de competencias NO ICFES
      filtered = filtered.filter(module => {
        const moduleCompetency = competencies.find(c => c.id === module.competencyId);
        return moduleCompetency && (
          !icfesCompetencyNames.includes(moduleCompetency.name) && 
          !icfesCompetencyNames.includes(moduleCompetency.displayName || '')
        );
      });
    }
    
    // Luego filtrar por competencia seleccionada (si hay una seleccionada)
    if (formData.competencyId) {
      filtered = filtered.filter(module => module.competencyId === formData.competencyId);
    }
    
    // Incluir módulos ya seleccionados aunque no pasen los filtros (para edición)
    const selectedModuleIds = formData.moduleIds || [];
    const selectedModulesNotInFilter = modules.filter(module => 
      selectedModuleIds.includes(module.id) && !filtered.some(f => f.id === module.id)
    );
    
    return [...filtered, ...selectedModulesNotInFilter];
  }, [modules, competencies, formData.isIcfesCourse, formData.competencyId, formData.moduleIds]);

  // Módulos seleccionados
  const selectedModules = useMemo(() => {
    return availableModules.filter(module => 
      formData.moduleIds.includes(module.id)
    );
  }, [availableModules, formData.moduleIds]);

  // Calcular tiempo total estimado
  const totalEstimatedTime = useMemo(() => {
    return selectedModules.reduce((total, module) => {
      return total + (module.estimatedTime || 0);
    }, 0);
  }, [selectedModules]);

  // Calcular total de lecciones
  const totalLessons = useMemo(() => {
    return selectedModules.reduce((total, module) => {
      return total + (module.lessons?.length || 0);
    }, 0);
  }, [selectedModules]);

  // Obtener lista única de creadores de módulos
  const moduleCreators = useMemo(() => {
    const creators = new Map<string, string>();
    availableModules.forEach(module => {
      if (module.createdBy) {
        creators.set(module.createdBy.id, module.createdBy.name);
      }
    });
    return Array.from(creators.entries()).map(([id, name]) => ({ id, name }));
  }, [availableModules]);

  // Filtrar módulos por búsqueda y filtros
  const filteredModules = useMemo(() => {
    let filtered = [...availableModules];

    // Filtro de búsqueda
    if (moduleSearch.trim()) {
      const searchLower = moduleSearch.toLowerCase();
      filtered = filtered.filter(module =>
        module.title.toLowerCase().includes(searchLower) ||
        module.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por competencia (solo si no hay competencia seleccionada en el formulario)
    if (!formData.competencyId && moduleCompetencyFilter !== 'all') {
      filtered = filtered.filter(module => 
        module.competencyId === moduleCompetencyFilter
      );
    }

    // Filtro por creador
    if (moduleCreatorFilter !== 'all') {
      filtered = filtered.filter(module => 
        module.createdBy?.id === moduleCreatorFilter
      );
    }

    // Filtro por tiempo estimado
    if (moduleTimeFilter !== 'all') {
      filtered = filtered.filter(module => {
        const time = module.estimatedTime || 0;
        switch (moduleTimeFilter) {
          case 'short': return time <= 30;
          case 'medium': return time > 30 && time <= 60;
          case 'long': return time > 60;
          default: return true;
        }
      });
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (moduleSortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'time':
          return (b.estimatedTime || 0) - (a.estimatedTime || 0);
        case 'lessons':
          return (b.lessons?.length || 0) - (a.lessons?.length || 0);
        case 'created':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [availableModules, moduleSearch, moduleCompetencyFilter, moduleCreatorFilter, moduleTimeFilter, moduleSortBy]);

  // Filtrar colegios por búsqueda y filtros
  const filteredSchools = useMemo(() => {
    let filtered = [...availableSchools];

    // Filtro de búsqueda
    if (schoolSearch.trim()) {
      const searchLower = schoolSearch.toLowerCase();
      filtered = filtered.filter(school =>
        school.name.toLowerCase().includes(searchLower) ||
        school.type?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por tipo
    if (schoolTypeFilter !== 'all') {
      filtered = filtered.filter(school => school.type === schoolTypeFilter);
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (schoolSortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return (a.type || '').localeCompare(b.type || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [availableSchools, schoolSearch, schoolTypeFilter, schoolSortBy]);

  // Obtener competencia seleccionada
  const selectedCompetency = useMemo(() => {
    return availableCompetencies.find(c => c.id === formData.competencyId);
  }, [availableCompetencies, formData.competencyId]);

  const handleCourseTypeSelect = (isIcfes: boolean) => {
    setFormData(prev => ({
      ...prev,
      isIcfesCourse: isIcfes,
      competencyId: '', // Limpiar competencia al cambiar tipo
      moduleIds: [], // Limpiar módulos al cambiar tipo
    }));
    setCourseTypeSelected(true);
  };

  const handleBackToTypeSelection = () => {
    setCourseTypeSelected(false);
    setFormData(prev => ({
      ...prev,
      isIcfesCourse: false,
      competencyId: '',
      moduleIds: [],
    }));
  };

  const handleCreateNewCompetency = async () => {
    if (!newCompetencyName.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre de la competencia es requerido',
        variant: 'destructive',
      });
      return;
    }

    setCreatingCompetency(true);
    try {
      const response = await fetch('/api/competencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCompetencyName.trim().toLowerCase().replace(/\s+/g, '_'),
          displayName: newCompetencyName.trim(),
          description: `Competencia: ${newCompetencyName.trim()}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear la competencia');
      }

      const newCompetency = await response.json();
      
      // Actualizar el formData con la nueva competencia
      handleInputChange('competencyId', newCompetency.id);
      
      // Cerrar el input y limpiar
      setShowNewCompetencyInput(false);
      setNewCompetencyName('');
      
      toast({
        title: 'Competencia creada',
        description: `La competencia "${newCompetency.displayName}" se ha creado exitosamente.`,
      });
      
      // Recargar la página para obtener las competencias actualizadas
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear la competencia',
        variant: 'destructive',
      });
    } finally {
      setCreatingCompetency(false);
    }
  };

  // Tipos de curso disponibles
  const courseTypes = [
    { 
      value: true, 
      label: 'Curso ICFES', 
      icon: Award, 
      color: 'blue',
      description: 'Curso orientado a la preparación para el examen ICFES. Solo permite preguntas de opción múltiple y excluye la competencia "otros".'
    },
    { 
      value: false, 
      label: 'Curso General', 
      icon: BookMarked, 
      color: 'green',
      description: 'Curso general para cualquier tipo de contenido educativo. Permite todos los tipos de preguntas y todas las competencias.'
    },
  ];

  // Pantalla de selección de tipo de curso (solo para creación, no para edición)
  if (!isEditing && !courseTypeSelected) {
    return (
      <Card className="w-full max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Selecciona el tipo de curso</CardTitle>
          <CardDescription className="text-center">
            Elige el tipo de curso que deseas crear
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {courseTypes.map((type) => {
              const IconComponent = type.icon
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
                green: 'bg-green-100 text-green-600 group-hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400',
              }
              
              return (
                <button
                  key={type.value ? 'icfes' : 'general'}
                  onClick={() => handleCourseTypeSelect(type.value)}
                  className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer text-left group h-full flex flex-col"
                >
                  <div className="flex flex-col items-center space-y-4 flex-1">
                    <div className={`p-4 rounded-full transition-colors ${colorClasses[type.color as keyof typeof colorClasses]}`}>
                      <IconComponent className="h-10 w-10" />
                    </div>
                    <div className="text-center space-y-2 flex-1">
                      <h3 className="font-semibold text-lg">{type.label}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {type.description}
                      </p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors mt-2" />
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{course ? 'Editar Curso' : `Crear ${formData.isIcfesCourse ? 'Curso ICFES' : 'Curso General'}`}</CardTitle>
            <CardDescription>
              {course 
                ? 'Modifica los datos del curso'
                : 'Completa la información para crear un nuevo curso'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {formData.isIcfesCourse ? 'ICFES' : 'General'}
            </Badge>
            {!isEditing && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToTypeSelection}
                className="text-xs"
              >
                Cambiar Tipo
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Módulos seleccionados</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {formData.moduleIds.length}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tiempo estimado</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                    {totalEstimatedTime} min
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de lecciones</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {totalLessons}
                  </p>
                </div>
                <GraduationCap className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Información básica</TabsTrigger>
              <TabsTrigger value="schools">Asignación</TabsTrigger>
              <TabsTrigger value="modules">Módulos</TabsTrigger>
            </TabsList>

            {/* Pestaña: Información básica */}
            <TabsContent value="basic" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Datos del curso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Título */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="title">Título del curso *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Ej: Matemáticas 6to Grado"
                        required
                      />
                    </div>

                    {/* Año escolar - Solo mostrar si es curso ICFES */}
                    {formData.isIcfesCourse && (
                      <div className="space-y-2">
                        <Label htmlFor="year">Año escolar *</Label>
                        <Select
                          value={formData.year ? formData.year.toString() : ''}
                          disabled={isEditing}
                          onValueChange={(value) => {
                            if (!isEditing) {
                              handleInputChange('year', parseInt(value));
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona el año" />
                          </SelectTrigger>
                          <SelectContent>
                            {ACADEMIC_YEARS.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}° Grado
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Competencia */}
                    <div className="space-y-2">
                      <Label htmlFor="competencyId">Competencia *</Label>
                      {!showNewCompetencyInput ? (
                        <>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Select
                                value={formData.competencyId && formData.competencyId !== '' ? formData.competencyId : 'none'}
                                disabled={isEditing}
                                onValueChange={(value) => {
                                  if (!isEditing) {
                                    console.log('🔄 [CourseForm] Cambiando competencia:', { value, current: formData.competencyId });
                                    if (value === 'new') {
                                      setShowNewCompetencyInput(true);
                                    } else {
                                      const newCompetencyId = value === 'none' ? '' : value;
                                      handleInputChange('competencyId', newCompetencyId);
                                      console.log('✅ [CourseForm] Competencia actualizada:', newCompetencyId);
                                    }
                                  }
                                }}
                              >
                              <SelectTrigger disabled={isEditing}>
                                <SelectValue placeholder="Selecciona una competencia">
                                  {formData.competencyId && currentCourseCompetency
                                    ? (currentCourseCompetency.displayName || currentCourseCompetency.name)
                                    : formData.competencyId && availableCompetencies.find(c => c.id === formData.competencyId)
                                    ? (availableCompetencies.find(c => c.id === formData.competencyId)?.displayName || availableCompetencies.find(c => c.id === formData.competencyId)?.name)
                                    : 'Selecciona una competencia'}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {!isEditing && <SelectItem value="none">Selecciona una competencia</SelectItem>}
                                {availableCompetencies.map((competency) => (
                                  <SelectItem key={competency.id} value={competency.id}>
                                    {competency.displayName || competency.name}
                                  </SelectItem>
                                ))}
                                {!formData.isIcfesCourse && (
                                  <SelectItem value="new">+ Crear nueva competencia</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            </div>
                          </div>
                          {selectedCompetency && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {selectedCompetency.description || 'Sin descripción'}
                            </p>
                          )}
                          {formData.isIcfesCourse && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Solo se muestran competencias ICFES
                            </p>
                          )}
                          {!formData.isIcfesCourse && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              Solo se muestran competencias NO ICFES. Puedes crear una nueva competencia si no encuentras la que necesitas.
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Nombre de la nueva competencia"
                              value={newCompetencyName}
                              onChange={(e) => setNewCompetencyName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCreateNewCompetency();
                                }
                                if (e.key === 'Escape') {
                                  setShowNewCompetencyInput(false);
                                  setNewCompetencyName('');
                                }
                              }}
                            />
                            <Button
                              type="button"
                              onClick={handleCreateNewCompetency}
                              disabled={creatingCompetency || !newCompetencyName.trim()}
                            >
                              {creatingCompetency ? 'Creando...' : 'Crear'}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowNewCompetencyInput(false);
                                setNewCompetencyName('');
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Presiona Enter para crear o Esc para cancelar
                          </p>
                        </div>
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
                      placeholder="Describe el contenido y objetivos del curso..."
                      rows={4}
                      required
                    />
                  </div>

                  {/* Configuración ICFES - Solo mostrar si está editando */}
                  {isEditing && (
                    <div className="space-y-2">
                      <Label htmlFor="icfes-toggle">Configuración ICFES</Label>
                      <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/30">
                        <div className="space-y-1 pr-4">
                          <p className="font-medium text-sm">Curso orientado a ICFES</p>
                          <p className="text-xs text-muted-foreground">
                            Si está activo, las lecciones y exámenes asociados a este curso solo permitirán preguntas de opción múltiple.
                          </p>
                        </div>
                        <Switch
                          id="icfes-toggle"
                          checked={formData.isIcfesCourse}
                          disabled={isEditing}
                          onCheckedChange={(checked) => {
                            // Solo permitir cambiar si no está editando
                            if (!isEditing) {
                              handleInputChange('isIcfesCourse', checked);
                              // Limpiar competencia y módulos al cambiar tipo solo si no hay competencia seleccionada
                              if (checked && !formData.competencyId) {
                                handleInputChange('competencyId', '');
                                handleInputChange('moduleIds', []);
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {!isEditing && (
                    <div className="space-y-2">
                      <Label>Tipo de Curso</Label>
                      <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/30">
                        <div className="space-y-1 pr-4">
                          <p className="font-medium text-sm">
                            {formData.isIcfesCourse ? 'Curso ICFES' : 'Curso General'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formData.isIcfesCourse 
                              ? 'Este curso está orientado a la preparación ICFES. Solo permite preguntas de opción múltiple y excluye la competencia "otros".'
                              : 'Este curso permite todos los tipos de preguntas y todas las competencias.'}
                          </p>
                        </div>
                        <Badge variant={formData.isIcfesCourse ? 'default' : 'secondary'}>
                          {formData.isIcfesCourse ? 'ICFES' : 'General'}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pestaña: Asignación */}
            <TabsContent value="schools" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Colegios / Entidades</CardTitle>
                  <CardDescription>
                    Selecciona los colegios o entidades para este curso. Deja vacío para crear un curso general (disponible para todos).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Búsqueda */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar colegio o entidad..."
                      value={schoolSearch}
                      onChange={(e) => setSchoolSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Filtros avanzados */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Filtro por tipo */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Tipo de entidad</Label>
                      <Select
                        value={schoolTypeFilter}
                        onValueChange={setSchoolTypeFilter}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los tipos</SelectItem>
                          <SelectItem value="school">Colegio</SelectItem>
                          <SelectItem value="company">Empresa</SelectItem>
                          <SelectItem value="government_entity">Entidad Gubernamental</SelectItem>
                          <SelectItem value="other">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Ordenar por */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Ordenar por</Label>
                      <Select
                        value={schoolSortBy}
                        onValueChange={setSchoolSortBy}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Nombre (A-Z)</SelectItem>
                          <SelectItem value="type">Tipo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Botón para limpiar filtros */}
                  {(schoolSearch || schoolTypeFilter !== 'all') && (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSchoolSearch('');
                          setSchoolTypeFilter('all');
                        }}
                        className="text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Limpiar filtros
                      </Button>
                    </div>
                  )}

                  {/* Contador */}
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-sm">
                      {formData.schoolIds?.length || 0} seleccionados
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {filteredSchools.length} {filteredSchools.length === 1 ? 'resultado' : 'resultados'}
                    </Badge>
                    {formData.schoolIds?.length === 0 && (
                      <Badge variant="outline" className="text-xs">
                        Curso general (sin asignar)
                      </Badge>
                    )}
                  </div>

                  {/* Lista de colegios */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto border rounded-lg p-4">
                    {filteredSchools.length === 0 ? (
                      <p className="text-muted-foreground col-span-2 text-center py-8">
                        {schoolSearch ? 'No se encontraron colegios con ese criterio.' : 'No hay colegios disponibles.'}
                      </p>
                    ) : (
                      filteredSchools.map((school) => {
                        const schoolId = school.id || '';
                        const isSelected = formData.schoolIds?.includes(schoolId) || false;
                        return (
                          <div
                            key={school.id}
                            className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                              isSelected
                                ? 'bg-primary/10 border-primary'
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                setFormData(prev => ({
                                  ...prev,
                                  schoolIds: checked
                                    ? [...(prev.schoolIds || []), schoolId].filter((id): id is string => Boolean(id))
                                    : (prev.schoolIds || []).filter(id => id !== schoolId),
                                }));
                              }}
                              disabled={userRole === 'school_admin' && schoolId !== userSchoolId}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <h4 className="font-medium text-sm truncate">{school.name}</h4>
                                {school.type && (
                                  <Badge variant="outline" className="text-xs">
                                    {school.type === 'school' ? 'Colegio' : 
                                     school.type === 'company' ? 'Empresa' :
                                     school.type === 'government_entity' ? 'Entidad Gubernamental' :
                                     'Otro'}
                                  </Badge>
                                )}
                              </div>
                              {userRole === 'school_admin' && school.id === userSchoolId && (
                                <p className="text-xs text-muted-foreground">
                                  Tu colegio (requerido)
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {userRole === 'school_admin' && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          Solo puedes asignar cursos a tu colegio. El curso se asignará automáticamente a tu institución.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pestaña: Módulos */}
            <TabsContent value="modules" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Módulos del curso</CardTitle>
                  <CardDescription>
                    Selecciona los módulos que formarán parte de este curso. Puedes buscar y filtrar para encontrar los módulos adecuados.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Módulos seleccionados */}
                  {formData.moduleIds.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Módulos seleccionados ({formData.moduleIds.length})</Label>
                      <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border">
                        {selectedModules.map((module) => (
                          <Badge key={module.id} variant="outline" className="flex items-center gap-1 text-sm py-1.5 px-3">
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

                  {/* Búsqueda y filtros */}
                  <div className="space-y-3">
                    {/* Búsqueda */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Buscar módulos por título o descripción..."
                        value={moduleSearch}
                        onChange={(e) => setModuleSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Filtros avanzados */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Filtro por competencia - Solo mostrar si no hay competencia seleccionada */}
                      {!formData.competencyId && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Competencia</Label>
                          <Select
                            value={moduleCompetencyFilter}
                            onValueChange={setModuleCompetencyFilter}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas las competencias</SelectItem>
                              {availableCompetencies.map((competency) => (
                                <SelectItem key={competency.id} value={competency.id}>
                                  {competency.displayName || competency.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {formData.competencyId && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Competencia</Label>
                          <div className="h-9 flex items-center px-3 bg-muted rounded-md text-sm">
                            {selectedCompetency?.displayName || selectedCompetency?.name || 'Competencia seleccionada'}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Solo se muestran módulos de la competencia seleccionada
                          </p>
                        </div>
                      )}

                      {/* Filtro por creador */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Creador</Label>
                        <Select
                          value={moduleCreatorFilter}
                          onValueChange={setModuleCreatorFilter}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los creadores</SelectItem>
                            {moduleCreators.map((creator) => (
                              <SelectItem key={creator.id} value={creator.id}>
                                {creator.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filtro por tiempo */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Duración</Label>
                        <Select
                          value={moduleTimeFilter}
                          onValueChange={setModuleTimeFilter}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Todas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todas las duraciones</SelectItem>
                            <SelectItem value="short">Corto (≤30 min)</SelectItem>
                            <SelectItem value="medium">Medio (31-60 min)</SelectItem>
                            <SelectItem value="long">Largo (&gt;60 min)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Ordenar por */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Ordenar por</Label>
                        <Select
                          value={moduleSortBy}
                          onValueChange={setModuleSortBy}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="title">Título (A-Z)</SelectItem>
                            <SelectItem value="time">Tiempo (mayor a menor)</SelectItem>
                            <SelectItem value="lessons">Lecciones (mayor a menor)</SelectItem>
                            <SelectItem value="created">Más recientes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Botón para limpiar filtros */}
                    {(moduleSearch || moduleCompetencyFilter !== 'all' || moduleCreatorFilter !== 'all' || moduleTimeFilter !== 'all') && (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setModuleSearch('');
                            setModuleCompetencyFilter('all');
                            setModuleCreatorFilter('all');
                            setModuleTimeFilter('all');
                          }}
                          className="text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Limpiar filtros
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Contador de resultados */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Módulos disponibles
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {filteredModules.length} {filteredModules.length === 1 ? 'resultado' : 'resultados'}
                    </Badge>
                  </div>

                  {/* Lista de módulos disponibles */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto border rounded-lg p-4">
                      {filteredModules.length === 0 ? (
                        <p className="text-muted-foreground col-span-2 text-center py-8">
                          {moduleSearch 
                            ? 'No se encontraron módulos con ese criterio.' 
                            : 'No hay módulos disponibles. Los Profesores Administradores deben crear módulos primero.'}
                        </p>
                      ) : (
                        filteredModules.map((module) => (
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
                                handleModuleToggle(module.id);
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm truncate">{module.title}</h4>
                              </div>
                              {module.description && (
                                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                  {module.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {module.estimatedTime || 0} min
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Recordatorios */}
          <Card className="bg-muted/50 border-muted">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Recordatorios importantes:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Puedes asignar un curso a múltiples colegios/entidades o dejarlo general (sin asignar)</li>
                    <li>Solo puede haber 1 curso por año/competencia por colegio</li>
                    <li>Los módulos son creados por Profesores Administradores</li>
                    <li>Los Administradores de Colegio solo pueden asignar cursos a su institución</li>
                    <li>Los Profesores Administradores pueden asignar cursos a cualquier colegio/entidad</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
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
