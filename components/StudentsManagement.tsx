'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useUsers } from '@/hooks/useUsers';
import { useSchools } from '@/hooks/useSchools';
import { useCourses } from '@/hooks/useCourses';
import { StudentForm } from './StudentForm';
import { useSession } from 'next-auth/react';
import { UserFilters } from '@/types/user';
import { formatDate } from '@/lib/utils';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Users,
  GraduationCap,
  Building,
  Calendar,
  Mail,
  Phone,
  User as UserIcon,
  Activity,
  BookOpen,
  Award,
  BookCheck,
  BookX,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export function StudentsManagement() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const { users, loading: usersLoading, error: usersError, fetchUsers, pagination } = useUsers();
  const { schools, loading: schoolsLoading } = useSchools();
  const { courses, loading: coursesLoading } = useCourses();
  
  const [filters, setFilters] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  // Estados para selección múltiple y asignación de cursos
  // IMPORTANTE: Las selecciones persisten al cambiar de página
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [courseDialogMode, setCourseDialogMode] = useState<'enroll' | 'unenroll'>('enroll');
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBulkSchoolDialog, setShowBulkSchoolDialog] = useState(false);
  const [showBulkGradeDialog, setShowBulkGradeDialog] = useState(false);
  const [selectedBulkSchoolId, setSelectedBulkSchoolId] = useState<string>('');
  const [selectedBulkGrade, setSelectedBulkGrade] = useState<string>('');

  // Cargar usuarios al montar el componente y cuando cambien los filtros/página
  // NOTA: Solo recargar del API cuando cambie schoolId a un valor específico (no 'none' ni 'all')
  // Si es 'none' o 'all', el filtrado se hace en el frontend sin recargar
  const effectiveSchoolId = session?.user?.role === 'school_admin' && session?.user?.schoolId 
    ? session.user.schoolId 
    : (filters.schoolId && filters.schoolId !== 'none' && filters.schoolId !== 'all' ? filters.schoolId : undefined);

  useEffect(() => {
    if (session?.user) {
      const loadUsers = async () => {
        const apiFilters: any = {
          page: currentPage,
          limit: 10, // 10 estudiantes por página
          role: 'student', // Filtrar solo estudiantes en el backend
          schoolId: effectiveSchoolId,
          search: searchTerm || undefined,
        };
        
        await fetchUsers(apiFilters);
      };
      
      loadUsers();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }
  }, [session?.user?.role, session?.user?.schoolId, currentPage, searchTerm, effectiveSchoolId]);

  // Resetear a página 1 cuando cambian los filtros de búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters.schoolId]);

  // Filtrar usuarios por rol de estudiante (ya viene filtrado del backend, pero por si acaso)
  const students = users?.filter(user => {
    // Solo mostrar estudiantes
    if (user.role !== 'student') return false;
    
    // Si es school_admin, solo mostrar estudiantes de su colegio
    if (session?.user?.role === 'school_admin' && session?.user?.schoolId) {
      return user.schoolId === session.user.schoolId;
    }
    
    return true;
  }) || [];

  // Aplicar filtros adicionales (academicGrade, status, schoolId)
  const filteredStudents = students.filter(student => {
    // Filtro por grado
    if (filters.academicGrade) {
      if (filters.academicGrade === 'none') {
        // Sin grado asignado
        if ((student as any).academicGrade) {
          return false;
        }
      } else {
        // Grado específico
        if ((student as any).academicGrade !== filters.academicGrade) {
          return false;
        }
      }
    }
    
    // Filtro por institución (solo si no es school_admin, porque ellos ya están filtrados)
    if (filters.schoolId && session?.user?.role !== 'school_admin') {
      if (filters.schoolId === 'none') {
        // Sin institución asignada
        if (student.schoolId) {
          return false;
        }
      } else {
        // Institución específica
        if (student.schoolId !== filters.schoolId) {
          return false;
        }
      }
    }
    
    if (filters.status && (student as any).status !== filters.status) {
      return false;
    }
    
    return true;
  });

  // Calcular total de estudiantes seleccionados (de todas las páginas)
  const totalSelectedCount = selectedStudentIds.size;

  const handleUserCreated = async () => {
    setShowAddUser(false);
    setCurrentPage(1); // Volver a la primera página
    const apiFilters: any = {
      page: 1,
      limit: 10,
      role: 'student',
      schoolId: session?.user?.role === 'school_admin' && session?.user?.schoolId 
        ? session.user.schoolId 
        : (filters.schoolId || ''),
      search: searchTerm || undefined,
    };
    await fetchUsers(apiFilters);
    toast({
      title: "Estudiante creado",
      description: "El estudiante ha sido creado exitosamente.",
    });
  };

  const handleUserUpdated = async () => {
    setEditingUser(null);
    const apiFilters: any = {
      page: currentPage,
      limit: 10,
      role: 'student',
      schoolId: session?.user?.role === 'school_admin' && session?.user?.schoolId 
        ? session.user.schoolId 
        : (filters.schoolId || ''),
      search: searchTerm || undefined,
    };
    await fetchUsers(apiFilters);
    toast({
      title: "Estudiante actualizado",
      description: "El estudiante ha sido actualizado exitosamente.",
    });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este estudiante?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el estudiante');
      }

      const apiFilters: any = {
        page: currentPage,
        limit: 10,
        role: 'student',
        schoolId: session?.user?.role === 'school_admin' && session?.user?.schoolId 
          ? session.user.schoolId 
          : (filters.schoolId || ''),
        search: searchTerm || undefined,
      };
      await fetchUsers(apiFilters);
      toast({
        title: "Estudiante eliminado",
        description: "El estudiante ha sido eliminado exitosamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el estudiante.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspendido</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Desconocido</Badge>;
    }
  };

  const getGradeBadge = (grade?: string) => {
    if (!grade) return <Badge className="bg-gray-100 text-gray-800">Sin grado</Badge>;
    const normalized = grade.toString();
    const gradeColors: { [key: string]: string } = {
      '6': 'bg-blue-100 text-blue-800',
      '7': 'bg-indigo-100 text-indigo-800',
      '8': 'bg-purple-100 text-purple-800',
      '9': 'bg-pink-100 text-pink-800',
      '10': 'bg-red-100 text-red-800',
      '11': 'bg-orange-100 text-orange-800',
      'sexto': 'bg-blue-100 text-blue-800',
      'septimo': 'bg-indigo-100 text-indigo-800',
      'octavo': 'bg-purple-100 text-purple-800',
      'noveno': 'bg-pink-100 text-pink-800',
      'decimo': 'bg-red-100 text-red-800',
      'once': 'bg-orange-100 text-orange-800',
    };
    
    return (
      <Badge className={gradeColors[normalized] || 'bg-gray-100 text-gray-800'}>
        Grado {normalized}
      </Badge>
    );
  };

  // Funciones para selección múltiple
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const selectAllStudents = () => {
    // Agregar todos los estudiantes de la página actual a la selección
    const newSelection = new Set(selectedStudentIds);
    filteredStudents.forEach(student => {
      newSelection.add(student.id);
    });
    setSelectedStudentIds(newSelection);
  };

  // Seleccionar todos los estudiantes que cumplan con los filtros aplicados (de todas las páginas)
  const selectAllFilteredStudents = async () => {
    try {
      setIsProcessing(true);
      
      // Construir parámetros de URL correctamente
      const params = new URLSearchParams({
        role: 'student',
        limit: '10000',
        page: '1',
      });

      // Solo agregar schoolId si no es 'none' ni 'all' y no es school_admin
      if (session?.user?.role === 'school_admin' && session?.user?.schoolId) {
        params.append('schoolId', session.user.schoolId);
      } else if (filters.schoolId && filters.schoolId !== 'none' && filters.schoolId !== 'all') {
        params.append('schoolId', filters.schoolId);
      }

      // Agregar búsqueda si existe
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      // Hacer llamada al API para obtener todos los estudiantes que cumplan los filtros
      const response = await fetch(`/api/users?${params.toString()}`);
      
      if (!response.ok) {
        let errorMessage = 'Error al obtener estudiantes';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Si no se puede parsear el error, usar el mensaje por defecto
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      // Verificar que la respuesta tenga la estructura esperada
      if (!data || !Array.isArray(data.users)) {
        console.error('Respuesta del API inesperada:', data);
        throw new Error('Formato de respuesta del servidor inválido');
      }
      
      const allFilteredStudents = data.users || [];
      
      // Aplicar filtros adicionales en el frontend (academicGrade, status, schoolId='none')
      const finalFiltered = allFilteredStudents.filter((student: any) => {
        // Filtro por grado
        if (filters.academicGrade) {
          if (filters.academicGrade === 'none') {
            if (student.academicGrade) return false;
          } else {
            if (student.academicGrade !== filters.academicGrade) return false;
          }
        }
        
        // Filtro por institución (solo si no es school_admin)
        if (session?.user?.role !== 'school_admin') {
          if (filters.schoolId === 'none') {
            // Sin institución asignada
            if (student.schoolId) return false;
          } else if (filters.schoolId && filters.schoolId !== 'all') {
            // Institución específica
            if (student.schoolId !== filters.schoolId) return false;
          }
        }
        
        // Filtro por estado
        if (filters.status && student.status !== filters.status) {
          return false;
        }
        
        return true;
      });
      
      // Seleccionar todos los IDs
      const allIds = new Set(finalFiltered.map((s: any) => s.id));
      setSelectedStudentIds(allIds);
      
      toast({
        title: "Selección completada",
        description: `${allIds.size} estudiante${allIds.size !== 1 ? 's' : ''} seleccionado${allIds.size !== 1 ? 's' : ''}`,
      });
    } catch (error: any) {
      console.error('Error al seleccionar todos:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron seleccionar todos los estudiantes. Por favor, intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const deselectAllStudents = () => {
    // Remover solo los estudiantes de la página actual
    const newSelection = new Set(selectedStudentIds);
    filteredStudents.forEach(student => {
      newSelection.delete(student.id);
    });
    setSelectedStudentIds(newSelection);
  };

  // Verificar si todos los estudiantes de la página actual están seleccionados
  const currentPageStudentIds = new Set(filteredStudents.map(s => s.id));
  const allCurrentPageSelected = filteredStudents.length > 0 && 
    filteredStudents.every(student => selectedStudentIds.has(student.id));
  const someCurrentPageSelected = filteredStudents.some(student => selectedStudentIds.has(student.id)) && 
    !allCurrentPageSelected;

  // Funciones para asignación de cursos
  const handleOpenCourseDialog = (mode: 'enroll' | 'unenroll') => {
    if (selectedStudentIds.size === 0) {
      toast({
        title: "No hay estudiantes seleccionados",
        description: "Por favor selecciona al menos un estudiante.",
        variant: "destructive",
      });
      return;
    }
    setCourseDialogMode(mode);
    setSelectedCourseIds(new Set());
    setShowCourseDialog(true);
  };

  const handleBulkEnroll = async () => {
    if (selectedStudentIds.size === 0 || selectedCourseIds.size === 0) {
      toast({
        title: "Datos incompletos",
        description: "Por favor selecciona estudiantes y cursos.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/students/bulk-enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: Array.from(selectedStudentIds),
          courseIds: Array.from(selectedCourseIds),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al asignar cursos');
      }

      toast({
        title: "Cursos asignados",
        description: data.message || `Se asignaron ${data.enrollments} inscripciones exitosamente.`,
      });

      setShowCourseDialog(false);
      setSelectedStudentIds(new Set());
      setSelectedCourseIds(new Set());
      const apiFilters: any = {
        page: currentPage,
        limit: 10,
        role: 'student',
        schoolId: session?.user?.role === 'school_admin' && session?.user?.schoolId 
          ? session.user.schoolId 
          : (filters.schoolId || ''),
        search: searchTerm || undefined,
      };
      await fetchUsers(apiFilters);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron asignar los cursos.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkUnenroll = async () => {
    if (selectedStudentIds.size === 0 || selectedCourseIds.size === 0) {
      toast({
        title: "Datos incompletos",
        description: "Por favor selecciona estudiantes y cursos.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/students/bulk-unenroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: Array.from(selectedStudentIds),
          courseIds: Array.from(selectedCourseIds),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al desasignar cursos');
      }

      toast({
        title: "Cursos desasignados",
        description: data.message || `Se desasignaron ${data.unenrollments} inscripciones exitosamente.`,
      });

      setShowCourseDialog(false);
      setSelectedStudentIds(new Set());
      setSelectedCourseIds(new Set());
      const apiFilters: any = {
        page: currentPage,
        limit: 10,
        role: 'student',
        schoolId: session?.user?.role === 'school_admin' && session?.user?.schoolId 
          ? session.user.schoolId 
          : (filters.schoolId || ''),
        search: searchTerm || undefined,
      };
      await fetchUsers(apiFilters);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron desasignar los cursos.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const selectAllCourses = () => {
    setSelectedCourseIds(new Set(courses.map(c => c.id)));
  };

  const deselectAllCourses = () => {
    setSelectedCourseIds(new Set());
  };

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#73A2D3] mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando estudiantes...</p>
        </div>
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Error al cargar los estudiantes: {usersError}</p>
        <Button 
          onClick={async () => {
            const apiFilters: any = {
              page: 1,
              limit: 100,
              role: '',
              schoolId: session?.user?.role === 'school_admin' && session?.user?.schoolId 
                ? session.user.schoolId 
                : '',
            };
            await fetchUsers(apiFilters);
          }} 
          className="mt-4"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestión de Estudiantes</h3>
          <p className="text-sm text-gray-600">
            {session?.user?.role === 'teacher_admin' 
              ? 'Administra los estudiantes de todas las instituciones'
              : 'Consulta y supervisa los estudiantes de tu institución'
            }
          </p>
        </div>
        {session?.user?.role === 'teacher_admin' && (
          <Button 
            className="bg-[#73A2D3]"
            onClick={() => setShowAddUser(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Estudiante
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#73A2D3]">
                  {pagination?.total || students.length}
                </div>
                <div className="text-sm text-gray-600">Total Estudiantes</div>
              </div>
              <Users className="h-8 w-8 text-[#73A2D3]" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#C00102]">
                  {students.filter(s => (s as any).status === 'active' || !(s as any).status).length}
                </div>
                <div className="text-sm text-gray-600">Activos</div>
              </div>
              <Activity className="h-8 w-8 text-[#C00102]" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#73A2D3]">
                  {new Set(students.map(s => (s as any).academicGrade).filter(Boolean)).size}
                </div>
                <div className="text-sm text-gray-600">Grados</div>
              </div>
              <GraduationCap className="h-8 w-8 text-[#73A2D3]" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#C00102]">
                  {new Set(students.map(s => s.schoolId)).size}
                </div>
                <div className="text-sm text-gray-600">Instituciones</div>
              </div>
              <Building className="h-8 w-8 text-[#C00102]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nombre, apellido o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Institución</Label>
              <Select 
                value={filters.schoolId || 'all'} 
                onValueChange={(value) => setFilters({...filters, schoolId: value === 'all' ? undefined : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="none">Sin institución</SelectItem>
                  {schools.map(school => (
                    <SelectItem key={school.id} value={school.id || ''}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Grado</Label>
              <Select 
                value={filters.academicGrade || 'all'} 
                onValueChange={(value) => setFilters({...filters, academicGrade: value === 'all' ? undefined : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="none">Sin grado</SelectItem>
                  <SelectItem value="6">Grado 6</SelectItem>
                  <SelectItem value="7">Grado 7</SelectItem>
                  <SelectItem value="8">Grado 8</SelectItem>
                  <SelectItem value="9">Grado 9</SelectItem>
                  <SelectItem value="10">Grado 10</SelectItem>
                  <SelectItem value="11">Grado 11</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Estado</Label>
              <Select 
                value={filters.status || 'all'} 
                onValueChange={(value) => setFilters({...filters, status: value === 'all' ? undefined : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilters({});
                  setSearchTerm('');
                }}
                className="flex-1"
              >
                Limpiar Filtros
              </Button>
              {(session?.user?.role === 'teacher_admin' || session?.user?.role === 'school_admin') && (
                <Button 
                  variant="default" 
                  onClick={selectAllFilteredStudents}
                  className="bg-blue-600 hover:bg-blue-700 flex-1"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Cargando...' : 'Seleccionar Todos'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {totalSelectedCount > 0 && (session?.user?.role === 'teacher_admin' || session?.user?.role === 'school_admin') && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-900">
                  {totalSelectedCount} estudiante{totalSelectedCount !== 1 ? 's' : ''} seleccionado{totalSelectedCount !== 1 ? 's' : ''} 
                  {totalSelectedCount > filteredStudents.length && (
                    <span className="text-blue-600 ml-1">
                      (incluyendo de otras páginas)
                    </span>
                  )}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedStudentIds(new Set())}
                >
                  Deseleccionar todos
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {session?.user?.role === 'teacher_admin' && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleBulkAssignSchool}
                      className="bg-purple-600 hover:bg-purple-700"
                      disabled={isProcessing}
                    >
                      <Building className="h-4 w-4 mr-2" />
                      Asignar Institución
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleBulkAssignGrade}
                      className="bg-indigo-600 hover:bg-indigo-700"
                      disabled={isProcessing}
                    >
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Asignar Grado
                    </Button>
                  </>
                )}
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleOpenCourseDialog('enroll')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <BookCheck className="h-4 w-4 mr-2" />
                  Asignar Cursos
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleOpenCourseDialog('unenroll')}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <BookX className="h-4 w-4 mr-2" />
                  Desasignar Cursos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Estudiantes {pagination ? `(${pagination.total} total)` : `(${filteredStudents.length})`}
              </CardTitle>
              <CardDescription>
                {session?.user?.role === 'teacher_admin' 
                  ? 'Lista de todos los estudiantes registrados en el sistema'
                  : 'Lista de estudiantes de tu institución (solo consulta)'
                }
              </CardDescription>
            </div>
            {(session?.user?.role === 'teacher_admin' || session?.user?.role === 'school_admin') && filteredStudents.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={allCurrentPageSelected ? deselectAllStudents : selectAllStudents}
                >
                  {allCurrentPageSelected ? (
                    <>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Deseleccionar página
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Seleccionar página
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {(session?.user?.role === 'teacher_admin' || session?.user?.role === 'school_admin') && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allCurrentPageSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            selectAllStudents();
                          } else {
                            deselectAllStudents();
                          }
                        }}
                      />
                    </TableHead>
                  )}
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Institución</TableHead>
                  <TableHead>Grado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    {(session?.user?.role === 'teacher_admin' || session?.user?.role === 'school_admin') && (
                      <TableCell>
                        <Checkbox
                          checked={selectedStudentIds.has(student.id)}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-[#73A2D3] flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {student.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {schools.find(s => s.id === student.schoolId)?.name || 'Sin asignar'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getGradeBadge((student as any).academicGrade || 'N/A')}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge((student as any).status || 'active')}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span>{student.email}</span>
                        </div>
                        {(student as any).contactPhone && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{(student as any).contactPhone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>{formatDate(student.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(student)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {session?.user?.role === 'teacher_admin' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                console.log('🔧 Editando estudiante:', student);
                                setEditingUser(student);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(student.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredStudents.length === 0 && !usersLoading && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron estudiantes</p>
            </div>
          )}

          {/* Paginación */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                {pagination.total} estudiantes
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || usersLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={usersLoading}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                  disabled={currentPage === pagination.pages || usersLoading}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Estudiante</DialogTitle>
              <DialogDescription>
                Información completa del estudiante
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nombre Completo</Label>
                  <p className="text-sm">{selectedUser.firstName} {selectedUser.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email</Label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Teléfono</Label>
                  <p className="text-sm">{(selectedUser as any).contactPhone || 'No registrado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tipo de Documento</Label>
                  <p className="text-sm">{(selectedUser as any).documentType || 'No registrado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Número de Documento</Label>
                  <p className="text-sm">{(selectedUser as any).documentNumber || 'No registrado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Grado</Label>
                  <p className="text-sm">Grado {(selectedUser as any).academicGrade || 'No asignado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Institución</Label>
                  <p className="text-sm">
                    {schools.find(s => s.id === selectedUser.schoolId)?.name || 'Sin asignar'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Estado</Label>
                  <div className="mt-1">
                    {getStatusBadge((selectedUser as any).status || 'active')}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Fecha de Registro</Label>
                  <p className="text-sm">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Última Actualización</Label>
                  <p className="text-sm">{formatDate(selectedUser.updatedAt)}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Student Form Modal - Only for Teacher Admins */}
      {session?.user?.role === 'teacher_admin' && showAddUser && (
        <StudentForm 
          onSubmit={async (data) => {
            // Crear estudiante con colegio asignado automáticamente
            const response = await fetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                ...data, 
                role: 'student',
                schoolId: session?.user?.schoolId // Asignar automáticamente el colegio del admin
              })
            });
            
            if (response.ok) {
              handleUserCreated();
            } else {
              throw new Error('Error al crear el estudiante');
            }
          }}
          onCancel={() => setShowAddUser(false)}
        />
      )}

      {/* Edit Student Form Modal - Only for Teacher Admins */}
      {session?.user?.role === 'teacher_admin' && editingUser && (
        <>
          {console.log('🔧 Renderizando modal de edición para:', editingUser)}
          <StudentForm 
            student={editingUser}
          onSubmit={async (data) => {
            // Actualizar estudiante (mantener el colegio asignado)
            const response = await fetch(`/api/users/${editingUser.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...data,
                schoolId: session?.user?.schoolId // Mantener el colegio del admin
              })
            });
            
            if (response.ok) {
              handleUserUpdated();
            } else {
              throw new Error('Error al actualizar el estudiante');
            }
          }}
          onCancel={() => setEditingUser(null)}
        />
        </>
      )}

      {/* Course Assignment Dialog */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {courseDialogMode === 'enroll' ? 'Asignar Cursos' : 'Desasignar Cursos'}
            </DialogTitle>
            <DialogDescription>
              {courseDialogMode === 'enroll' 
                ? `Selecciona los cursos que deseas asignar a ${selectedStudentIds.size} estudiante${selectedStudentIds.size !== 1 ? 's' : ''} seleccionado${selectedStudentIds.size !== 1 ? 's' : ''}.`
                : `Selecciona los cursos que deseas desasignar de ${selectedStudentIds.size} estudiante${selectedStudentIds.size !== 1 ? 's' : ''} seleccionado${selectedStudentIds.size !== 1 ? 's' : ''}.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Course Selection Controls */}
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm text-gray-600">
                {selectedCourseIds.size} curso{selectedCourseIds.size !== 1 ? 's' : ''} seleccionado{selectedCourseIds.size !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllCourses}
                >
                  Seleccionar todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={deselectAllCourses}
                >
                  Deseleccionar todos
                </Button>
              </div>
            </div>

            {/* Courses List */}
            <ScrollArea className="h-[400px] border rounded-md p-4">
              {coursesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#73A2D3] mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando cursos...</p>
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay cursos disponibles
                </div>
              ) : (
                <div className="space-y-2">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleCourseSelection(course.id)}
                    >
                      <Checkbox
                        checked={selectedCourseIds.has(course.id)}
                        onCheckedChange={() => toggleCourseSelection(course.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{course.title}</div>
                        <div className="text-sm text-gray-500">
                          {course.competency?.displayName || 'Sin competencia'}
                          {(course as any).academicGrade && ` • ${(course as any).academicGrade}`}
                        </div>
                      </div>
                      <Badge variant={course.isIcfesCourse ? 'default' : 'secondary'}>
                        {course.isIcfesCourse ? 'ICFES' : 'General'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCourseDialog(false);
                  setSelectedCourseIds(new Set());
                }}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button
                onClick={courseDialogMode === 'enroll' ? handleBulkEnroll : handleBulkUnenroll}
                disabled={isProcessing || selectedCourseIds.size === 0}
                className={courseDialogMode === 'enroll' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    {courseDialogMode === 'enroll' ? (
                      <>
                        <BookCheck className="h-4 w-4 mr-2" />
                        Asignar Cursos
                      </>
                    ) : (
                      <>
                        <BookX className="h-4 w-4 mr-2" />
                        Desasignar Cursos
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign School Dialog */}
      {showBulkSchoolDialog && (
        <Dialog open={showBulkSchoolDialog} onOpenChange={setShowBulkSchoolDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar Institución</DialogTitle>
              <DialogDescription>
                Asignar institución a {totalSelectedCount} estudiante{totalSelectedCount !== 1 ? 's' : ''} seleccionado{totalSelectedCount !== 1 ? 's' : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Institución</Label>
                <Select value={selectedBulkSchoolId} onValueChange={setSelectedBulkSchoolId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar institución" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin institución</SelectItem>
                    {schools.map(school => (
                      <SelectItem key={school.id} value={school.id || ''}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowBulkSchoolDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmBulkAssignSchool} disabled={isProcessing || !selectedBulkSchoolId}>
                  {isProcessing ? 'Actualizando...' : 'Confirmar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Assign Grade Dialog */}
      {showBulkGradeDialog && (
        <Dialog open={showBulkGradeDialog} onOpenChange={setShowBulkGradeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar Grado</DialogTitle>
              <DialogDescription>
                Asignar grado a {totalSelectedCount} estudiante{totalSelectedCount !== 1 ? 's' : ''} seleccionado{totalSelectedCount !== 1 ? 's' : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Grado</Label>
                <Select value={selectedBulkGrade} onValueChange={setSelectedBulkGrade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar grado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin grado</SelectItem>
                    <SelectItem value="6">Grado 6</SelectItem>
                    <SelectItem value="7">Grado 7</SelectItem>
                    <SelectItem value="8">Grado 8</SelectItem>
                    <SelectItem value="9">Grado 9</SelectItem>
                    <SelectItem value="10">Grado 10</SelectItem>
                    <SelectItem value="11">Grado 11</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowBulkGradeDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmBulkAssignGrade} disabled={isProcessing || !selectedBulkGrade}>
                  {isProcessing ? 'Actualizando...' : 'Confirmar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
