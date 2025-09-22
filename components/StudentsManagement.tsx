'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useUsers } from '@/hooks/useUsers';
import { useSchools } from '@/hooks/useSchools';
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
  Award
} from 'lucide-react';

export function StudentsManagement() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const { users, loading: usersLoading, error: usersError, refetch: refetchUsers } = useUsers();
  const { schools, loading: schoolsLoading } = useSchools();
  
  const [filters, setFilters] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Filtrar usuarios por rol de estudiante
  const students = users?.filter(user => user.role === 'student') || [];

  // Aplicar filtros
  const filteredStudents = students.filter(student => {
    if (searchTerm && !student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !student.email?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (filters.schoolId && student.schoolId !== filters.schoolId) {
      return false;
    }
    
    if (filters.academicGrade && student.academicGrade !== filters.academicGrade) {
      return false;
    }
    
    if (filters.status && student.status !== filters.status) {
      return false;
    }
    
    return true;
  });

  const handleUserCreated = () => {
    setShowAddUser(false);
    refetchUsers();
    toast({
      title: "Estudiante creado",
      description: "El estudiante ha sido creado exitosamente.",
    });
  };

  const handleUserUpdated = () => {
    setEditingUser(null);
    refetchUsers();
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

      refetchUsers();
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

  const getStatusBadge = (status: string) => {
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

  const getGradeBadge = (grade: string) => {
    const gradeColors: { [key: string]: string } = {
      '6': 'bg-blue-100 text-blue-800',
      '7': 'bg-indigo-100 text-indigo-800',
      '8': 'bg-purple-100 text-purple-800',
      '9': 'bg-pink-100 text-pink-800',
      '10': 'bg-red-100 text-red-800',
      '11': 'bg-orange-100 text-orange-800',
    };
    
    return (
      <Badge className={gradeColors[grade] || 'bg-gray-100 text-gray-800'}>
        Grado {grade}
      </Badge>
    );
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
        <Button onClick={refetchUsers} className="mt-4">
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
                <div className="text-2xl font-bold text-[#73A2D3]">{students.length}</div>
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
                  {students.filter(s => s.status === 'active').length}
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
                  {new Set(students.map(s => s.academicGrade)).size}
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
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilters({});
                  setSearchTerm('');
                }}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Estudiantes ({filteredStudents.length})</CardTitle>
          <CardDescription>
            {session?.user?.role === 'teacher_admin' 
              ? 'Lista de todos los estudiantes registrados en el sistema'
              : 'Lista de estudiantes de tu institución (solo consulta)'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                      {getGradeBadge(student.academicGrade || 'N/A')}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(student.status || 'active')}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span>{student.email}</span>
                        </div>
                        {student.phone && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{student.phone}</span>
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
                              onClick={() => setEditingUser(student)}
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
          
          {filteredStudents.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron estudiantes</p>
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
                  <p className="text-sm">{selectedUser.phone || 'No registrado'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Grado</Label>
                  <p className="text-sm">Grado {selectedUser.academicGrade || 'No asignado'}</p>
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
                    {getStatusBadge(selectedUser.status || 'active')}
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
      )}
    </div>
  );
}
