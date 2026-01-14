'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useCourses } from '@/hooks/useCourses'
import { ACADEMIC_YEARS } from '@/lib/academicGrades';
import { useModules } from '@/hooks/useModules';
import { CourseForm } from './CourseForm';
import { CourseData, CourseFormData, CourseFilters } from '@/types/course';
import { SchoolData } from '@/types/school';
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
  GraduationCap,
  Building,
  Users,
  Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type SimpleCompetency = {
  id: string;
  name: string;
  displayName?: string;
};

interface CourseManagementProps {
  competencies: SimpleCompetency[];
  schools: SchoolData[];
  userRole: string;
  userSchoolId?: string;
}

export function CourseManagement({ 
  competencies, 
  schools, 
  userRole, 
  userSchoolId 
}: CourseManagementProps) {
  const { toast } = useToast();
  const router = useRouter();
  const {
    courses,
    loading: coursesLoading,
    error: coursesError,
    filters,
    createCourse,
    updateCourse,
    deleteCourse,
    getCourse,
    applyFilters,
    clearFilters,
  } = useCourses();
  
  const {
    modules,
    loading: modulesLoading,
    error: modulesError,
  } = useModules(true); // forCourseCreation = true

  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseData | null>(null);
  const [previewCourse, setPreviewCourse] = useState<CourseData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showModules, setShowModules] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('none');
  const [selectedCompetency, setSelectedCompetency] = useState('none');
  const [selectedYear, setSelectedYear] = useState('none');
  const [selectedCourseType, setSelectedCourseType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 5;

  const canCreate = userRole === 'teacher_admin'; // Solo teacher_admin puede crear cursos
  const canEdit = userRole === 'teacher_admin'; // Solo teacher_admin puede editar cursos
  const canDelete = userRole === 'teacher_admin'; // Solo teacher_admin puede eliminar cursos
  const canView = true; // Ambos pueden ver cursos

  // Filtrar colegios según el rol
  const availableSchools = userRole === 'teacher_admin' 
    ? schools 
    : schools.filter(school => school.id === userSchoolId);
  const schoolsWithId = availableSchools.filter((school): school is SchoolData & { id: string } => Boolean(school.id));

  const handleCreateCourse = async (data: CourseFormData) => {
    const result = await createCourse(data);
    if (result) {
      setShowForm(false);
      toast({
        title: 'Curso creado',
        description: 'Puedes previsualizarlo con el botón de ojo en la lista.',
      });
    }
  };

  const handleUpdateCourse = async (data: CourseFormData) => {
    if (editingCourse) {
      const result = await updateCourse(editingCourse.id, data);
      if (result) {
        setEditingCourse(null);
      }
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este curso? Esta acción no se puede deshacer.')) {
      const success = await deleteCourse(courseId);
      if (success) {
        toast({
          title: 'Curso eliminado',
          description: 'El curso se ha eliminado correctamente.',
        });
      }
    }
  };

  const handlePreviewCourse = async (course: CourseData) => {
    setPreviewLoading(true);
    setShowModules(true);
    try {
      const fullCourse = await getCourse(course.id);
      setPreviewCourse(fullCourse || course);
      setIsPreviewOpen(true);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la vista previa del curso',
        variant: 'destructive',
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSearch = () => {
    const newFilters: CourseFilters = {};
    if (searchTerm) newFilters.search = searchTerm;
    if (selectedSchool && selectedSchool !== 'none') newFilters.schoolId = selectedSchool;
    if (selectedCompetency && selectedCompetency !== 'none') newFilters.competencyId = selectedCompetency;
    if (selectedYear && selectedYear !== 'none') newFilters.year = parseInt(selectedYear);
    if (selectedCourseType && selectedCourseType !== 'all') {
      newFilters.isIcfesCourse = selectedCourseType === 'icfes';
    }
    
    setCurrentPage(1);
    applyFilters(newFilters);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedSchool('none');
    setSelectedCompetency('none');
    setSelectedYear('none');
    setSelectedCourseType('all');
    setCurrentPage(1);
    clearFilters();
  };

  const handleEdit = async (course: CourseData) => {
    try {
      const fullCourse = await getCourse(course.id);
      setEditingCourse(fullCourse || course);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar los datos del curso',
        variant: 'destructive',
      });
      // Usar el curso de la lista como fallback
      setEditingCourse(course);
    }
  };

  const handleCancelEdit = () => {
    setEditingCourse(null);
  };

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(((courses || []).length || 0) / coursesPerPage) || 1);
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [courses, currentPage]);

  const totalCourses = (courses || []).length;
  const startIndex = (currentPage - 1) * coursesPerPage;
  const paginatedCourses = (courses || []).slice(startIndex, startIndex + coursesPerPage);
  const totalPages = Math.max(1, Math.ceil((courses || []).length / coursesPerPage) || 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Cursos</h2>
          <p className="text-muted-foreground">
            Administra los cursos del sistema
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Curso
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Búsqueda */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar cursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por colegio */}
            <div className="space-y-2">
              <Label htmlFor="school">Colegio</Label>
              <Select
                value={selectedSchool}
                onValueChange={setSelectedSchool}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los colegios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos los colegios</SelectItem>
                  {schoolsWithId.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                      {competency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por año */}
            <div className="space-y-2">
              <Label htmlFor="year">Año</Label>
              <Select
                value={selectedYear}
                onValueChange={setSelectedYear}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los años" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos los años</SelectItem>
                  {ACADEMIC_YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}° Grado
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por tipo de curso */}
            <div className="space-y-2">
              <Label htmlFor="courseType">Tipo de Curso</Label>
              <Select
                value={selectedCourseType}
                onValueChange={setSelectedCourseType}
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

      {/* Lista de cursos */}
      <Card>
        <CardHeader>
          <CardTitle>Cursos ({totalCourses})</CardTitle>
          <CardDescription>
            Lista de todos los cursos del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
                     {coursesLoading || modulesLoading ? (
             <div className="text-center py-8">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
               <p className="mt-2 text-muted-foreground">Cargando cursos...</p>
             </div>
           ) : coursesError || modulesError ? (
             <div className="text-center py-8">
               <p className="text-destructive">{coursesError || modulesError}</p>
             </div>
          ) : (courses || []).length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron cursos</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Grado</TableHead>
                    <TableHead>Competencia</TableHead>
                    <TableHead>Colegio(s)</TableHead>
                    <TableHead>Módulos</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-medium line-clamp-2">
                            {course.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {course.description}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {course.year ? (
                          <Badge variant="secondary">
                            {course.year}° Grado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            N/A
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline">
                          {course.competency?.displayName || course.competency?.name || 'N/A'}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        {course.schools && course.schools.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {course.schools.slice(0, 2).map((school) => (
                              <Badge key={school.id} variant="outline" className="text-xs">
                                {school.name}
                                {school.type && school.type !== 'school' && (
                                  <span className="ml-1">
                                    ({school.type === 'company' ? 'Empresa' : 
                                      school.type === 'government_entity' ? 'Gob.' : 
                                      'Otro'})
                                  </span>
                                )}
                              </Badge>
                            ))}
                            {course.schools.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{course.schools.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            General
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                          <span>{course.modules?.length || 0}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {course.isIcfesCourse ? (
                          <Badge variant="destructive">
                            ICFES
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Regular
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(course.createdAt)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreviewCourse(course)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(course)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCourse(course.id)}
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
                    Mostrando {totalCourses === 0 ? 0 : startIndex + 1} a {Math.min(startIndex + coursesPerPage, totalCourses)} de {totalCourses} cursos
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
      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vista previa del curso</DialogTitle>
            <DialogDescription>Resumen del curso y sus módulos</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {previewLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Cargando vista previa...</p>
              </div>
            ) : previewCourse ? (
              <>
                {/* Información principal */}
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{previewCourse.title}</h3>
                  <p className="text-muted-foreground">{previewCourse.description}</p>
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
                            {previewCourse.competency?.displayName || previewCourse.competency?.name || 'Sin competencia'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Año / Grado</p>
                          <p className="font-medium text-sm">
                            {previewCourse.year ? `Grado ${previewCourse.year}` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Módulos</p>
                          <p className="font-medium text-sm">{previewCourse.modules?.length || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Creado</p>
                          <p className="font-medium text-sm">{formatDate(previewCourse.createdAt as any)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Colegios asociados */}
                {previewCourse.schools && previewCourse.schools.length > 0 && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="h-5 w-5 text-muted-foreground" />
                        <Label className="text-base font-semibold">Colegios asociados</Label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {previewCourse.schools.map((school) => (
                          <Badge key={school.id} variant="outline">
                            {school.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Lista de módulos */}
                {previewCourse.modules && previewCourse.modules.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Módulos del curso</Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{previewCourse.modules.length} módulo{previewCourse.modules.length !== 1 ? 's' : ''}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowModules(prev => !prev)}
                        >
                          {showModules ? 'Ocultar' : 'Ver módulos'}
                        </Button>
                      </div>
                    </div>
                    {showModules && (
                      <div className="space-y-2">
                        {previewCourse.modules
                          .slice()
                          .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                          .map((module) => (
                            <Card key={module.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="pt-4">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {module.orderIndex ?? 0}
                                  </Badge>
                                  <h4 className="font-medium">{module.title}</h4>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6 pb-6 text-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Este curso aún no tiene módulos asignados</p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Formulario de creación/edición */}
      <Dialog 
        open={showForm || !!editingCourse} 
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditingCourse(null);
          }
        }}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? 'Editar Curso' : 'Crear Nuevo Curso'}
            </DialogTitle>
            <DialogDescription>
              {editingCourse 
                ? 'Modifica los datos del curso' 
                : 'Completa la información para crear un nuevo curso'
              }
            </DialogDescription>
          </DialogHeader>
          
          <CourseForm
            course={editingCourse || undefined}
            modules={modules}
            competencies={competencies}
            schools={availableSchools}
            userRole={userRole}
            userSchoolId={userSchoolId}
            onSubmit={editingCourse ? handleUpdateCourse : handleCreateCourse}
            onCancel={() => {
              setShowForm(false);
              setEditingCourse(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 