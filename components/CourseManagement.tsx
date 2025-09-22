'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCourses } from '@/hooks/useCourses';
import { useModules } from '@/hooks/useModules';
import { CourseForm } from './CourseForm';
import { CourseData, CourseFormData, CourseFilters } from '@/types/course';
import { CompetencyData } from '@/types/competency';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CourseManagementProps {
  competencies: CompetencyData[];
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
                const [searchTerm, setSearchTerm] = useState('');
              const [selectedSchool, setSelectedSchool] = useState('none');
              const [selectedCompetency, setSelectedCompetency] = useState('none');
              const [selectedYear, setSelectedYear] = useState('none');

  const canCreate = userRole === 'teacher_admin' || userRole === 'school_admin';
  const canEdit = userRole === 'teacher_admin' || userRole === 'school_admin';
  const canDelete = userRole === 'teacher_admin' || userRole === 'school_admin';

  // Filtrar colegios según el rol
  const availableSchools = userRole === 'teacher_admin' 
    ? schools 
    : schools.filter(school => school.id === userSchoolId);

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

  const handlePreviewCourse = (course: CourseData) => {
    setPreviewCourse(course);
    setIsPreviewOpen(true);
  };

                const handleSearch = () => {
                const newFilters: CourseFilters = {};
                if (searchTerm) newFilters.search = searchTerm;
                if (selectedSchool && selectedSchool !== 'none') newFilters.schoolId = selectedSchool;
                if (selectedCompetency && selectedCompetency !== 'none') newFilters.competencyId = selectedCompetency;
                if (selectedYear && selectedYear !== 'none') newFilters.year = parseInt(selectedYear);
                
                applyFilters(newFilters);
              };

                const handleClearFilters = () => {
                setSearchTerm('');
                setSelectedSchool('none');
                setSelectedCompetency('none');
                setSelectedYear('none');
                clearFilters();
              };

  const handleEdit = (course: CourseData) => {
    setEditingCourse(course);
  };

  const handleCancelEdit = () => {
    setEditingCourse(null);
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
        <CourseForm
          modules={modules}
          competencies={competencies}
          schools={availableSchools}
          userRole={userRole}
          userSchoolId={userSchoolId}
          onSubmit={handleCreateCourse}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  if (editingCourse) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={handleCancelEdit}
          className="mb-4"
        >
          ← Volver a la lista
        </Button>
        <CourseForm
          course={editingCourse}
          modules={modules}
          competencies={competencies}
          schools={availableSchools}
          userRole={userRole}
          userSchoolId={userSchoolId}
          onSubmit={handleUpdateCourse}
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Búsqueda */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                              {availableSchools.map((school) => (
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
                              {[6, 7, 8, 9, 10, 11].map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}° Grado
                                </SelectItem>
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
        </CardContent>
      </Card>

      {/* Lista de cursos */}
      <Card>
        <CardHeader>
          <CardTitle>Cursos ({courses.length})</CardTitle>
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
          ) : courses.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron cursos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{course.title}</h3>
                          <Badge variant="secondary">
                            {course.year}° Grado
                          </Badge>
                          {course.competency && (
                            <Badge variant="outline">
                              {course.competency.name}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-muted-foreground mb-3">
                          {course.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          {course.school && (
                            <div className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              {course.school.name}
                            </div>
                          )}
                          {course.modules && (
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {course.modules.length} módulos
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Creado: {formatDate(course.createdAt)}
                          </div>
                        </div>

                        {/* Módulos del curso */}
                        {course.modules && course.modules.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium mb-1">Módulos:</p>
                            <div className="flex flex-wrap gap-1">
                              {course.modules.slice(0, 3).map((module) => (
                                <Badge key={module.id} variant="outline" className="text-xs">
                                  {module.title}
                                  {module.createdBy && ` (${module.createdBy.name})`}
                                </Badge>
                              ))}
                              {course.modules.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{course.modules.length - 3} más
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Actualizado: {formatDate(course.updatedAt)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
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
      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-6xl w-[95vw] h-[85vh] p-0 overflow-hidden">
          <div className="flex h-full flex-col">
            <DialogHeader className="p-3 border-b">
              <DialogTitle>Vista previa del curso</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0">
              {previewCourse && (
                <iframe
                  title="preview-curso"
                  src={`/curso/${previewCourse.competency?.name || 'curso'}/modulos?courseId=${previewCourse.id}&origin=admin`}
                  className="w-full h-full border-0"
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 