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
import { LiveClassForm } from './LiveClassForm';
import { LiveClassData, LiveClassFormData } from '@/types/liveClass';
import { SchoolData } from '@/types/school';
import { formatDate } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Video,
  Calendar,
  Clock,
  ExternalLink,
  Users,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type SimpleCompetency = {
  id: string;
  name: string;
  displayName?: string;
};

type SimpleModule = {
  id: string;
  title: string;
};

type SimpleLesson = {
  id: string;
  title: string;
};

interface LiveClassManagementProps {
  competencies: SimpleCompetency[];
  modules: SimpleModule[];
  lessons: SimpleLesson[];
  schools: SchoolData[];
  userRole: string;
  userSchoolId?: string;
}

const PROVIDER_ICONS: Record<string, { name: string; color: string }> = {
  zoom: { name: 'Zoom', color: 'bg-blue-500' },
  meet: { name: 'Google Meet', color: 'bg-green-500' },
  teams: { name: 'Microsoft Teams', color: 'bg-purple-500' },
  webex: { name: 'Cisco Webex', color: 'bg-orange-500' },
  other: { name: 'Otro', color: 'bg-gray-500' },
};

export function LiveClassManagement({ 
  competencies, 
  modules,
  lessons,
  schools, 
  userRole, 
  userSchoolId 
}: LiveClassManagementProps) {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [liveClasses, setLiveClasses] = useState<LiveClassData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<LiveClassData | null>(null);
  const [selectedClass, setSelectedClass] = useState<LiveClassData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('none');
  const [selectedCompetency, setSelectedCompetency] = useState('none');
  const [selectedModule, setSelectedModule] = useState('none');
  const [selectedProvider, setSelectedProvider] = useState('none');
  const [startDateFrom, setStartDateFrom] = useState('');
  const [startDateTo, setStartDateTo] = useState('');

  const canCreate = userRole === 'teacher_admin';
  const canEdit = userRole === 'teacher_admin';
  const canDelete = userRole === 'teacher_admin';

  // Filtrar colegios según el rol
  const availableSchools = userRole === 'teacher_admin' 
    ? schools 
    : schools.filter(school => school.id === userSchoolId);
  const schoolsWithId = availableSchools.filter((school): school is SchoolData & { id: string } => Boolean(school.id));

  // Cargar clases en vivo
  const fetchLiveClasses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedSchool && selectedSchool !== 'none') params.append('schoolId', selectedSchool);
      if (selectedCompetency && selectedCompetency !== 'none') params.append('competencyId', selectedCompetency);
      if (selectedModule && selectedModule !== 'none') params.append('moduleId', selectedModule);
      if (selectedProvider && selectedProvider !== 'none') params.append('provider', selectedProvider);
      if (startDateFrom) params.append('startDateFrom', startDateFrom);
      if (startDateTo) params.append('startDateTo', startDateTo);

      const response = await fetch(`/api/live-classes?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setLiveClasses(data);
    } catch (error: any) {
      console.error('Error fetching live classes:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron cargar las clases en vivo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  const handleCreateClass = async (data: LiveClassFormData) => {
    try {
      const response = await fetch('/api/live-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear clase');
      }

      toast({
        title: 'Clase creada',
        description: 'La clase en vivo ha sido creada exitosamente y las notificaciones han sido enviadas.',
      });
      
      setShowForm(false);
      fetchLiveClasses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateClass = async (data: LiveClassFormData) => {
    if (!editingClass) return;

    try {
      const response = await fetch(`/api/live-classes/${editingClass.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar clase');
      }

      toast({
        title: 'Clase actualizada',
        description: 'La clase en vivo ha sido actualizada exitosamente.',
      });
      
      setEditingClass(null);
      fetchLiveClasses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta clase en vivo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/live-classes/${classId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar clase');
      }

      toast({
        title: 'Clase eliminada',
        description: 'La clase en vivo ha sido eliminada exitosamente.',
      });
      
      fetchLiveClasses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (liveClass: LiveClassData) => {
    setSelectedClass(liveClass);
    setIsDetailsOpen(true);
  };

  const handleApplyFilters = () => {
    fetchLiveClasses();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedSchool('none');
    setSelectedCompetency('none');
    setSelectedModule('none');
    setSelectedProvider('none');
    setStartDateFrom('');
    setStartDateTo('');
    fetchLiveClasses();
  };

  const filteredClasses = liveClasses.filter(cls => {
    const now = new Date();
    const startDate = new Date(cls.startDateTime);
    return startDate >= now; // Solo mostrar clases futuras
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Clases en Vivo</h2>
          <p className="text-muted-foreground">
            Administra las clases virtuales programadas
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Clase
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar clases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por colegio */}
            {userRole === 'teacher_admin' && (
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
            )}

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
                      {competency.displayName || competency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por proveedor */}
            <div className="space-y-2">
              <Label htmlFor="provider">Proveedor</Label>
              <Select
                value={selectedProvider}
                onValueChange={setSelectedProvider}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los proveedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos los proveedores</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="meet">Google Meet</SelectItem>
                  <SelectItem value="teams">Microsoft Teams</SelectItem>
                  <SelectItem value="webex">Cisco Webex</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por fecha desde */}
            <div className="space-y-2">
              <Label htmlFor="startDateFrom">Fecha desde</Label>
              <Input
                id="startDateFrom"
                type="datetime-local"
                value={startDateFrom}
                onChange={(e) => setStartDateFrom(e.target.value)}
              />
            </div>

            {/* Filtro por fecha hasta */}
            <div className="space-y-2">
              <Label htmlFor="startDateTo">Fecha hasta</Label>
              <Input
                id="startDateTo"
                type="datetime-local"
                value={startDateTo}
                onChange={(e) => setStartDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
            <Button onClick={handleApplyFilters}>
              <Search className="w-4 h-4 mr-2" />
              Aplicar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de clases */}
      <Card>
        <CardHeader>
          <CardTitle>Clases Programadas ({filteredClasses.length})</CardTitle>
          <CardDescription>
            Lista de todas las clases en vivo programadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Cargando clases...</p>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-8">
              <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron clases en vivo</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Competencia</TableHead>
                  <TableHead>Módulo/Lección</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Colegio</TableHead>
                  <TableHead>Invitados</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((liveClass) => {
                  const startDate = new Date(liveClass.startDateTime);
                  const endDate = liveClass.endDateTime ? new Date(liveClass.endDateTime) : null;
                  const providerInfo = liveClass.provider ? PROVIDER_ICONS[liveClass.provider] : null;

                  return (
                    <TableRow key={liveClass.id}>
                      <TableCell className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-medium line-clamp-2">
                            {liveClass.title}
                          </p>
                          {liveClass.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {liveClass.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{formatDate(startDate)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>
                              {startDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                              {endDate && ` - ${endDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {liveClass.competency ? (
                          <Badge variant="outline" style={{ 
                            borderColor: liveClass.competency.colorHex || undefined 
                          }}>
                            {liveClass.competency.displayName || liveClass.competency.name}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            N/A
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          {liveClass.module && (
                            <div className="flex items-center gap-1 text-xs">
                              <BookOpen className="w-3 h-3" />
                              <span className="line-clamp-1">{liveClass.module.title}</span>
                            </div>
                          )}
                          {liveClass.lesson && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <GraduationCap className="w-3 h-3" />
                              <span className="line-clamp-1">{liveClass.lesson.title}</span>
                            </div>
                          )}
                          {!liveClass.module && !liveClass.lesson && (
                            <span className="text-xs text-muted-foreground">N/A</span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {providerInfo ? (
                          <Badge className={providerInfo.color}>
                            {providerInfo.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Sin especificar</Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {liveClass.school ? (
                          <Badge variant="outline" className="text-xs">
                            {liveClass.school.name}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            General
                          </Badge>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{liveClass.invitations?.length || 0}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(liveClass)}
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingClass(liveClass)}
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClass(liveClass.id)}
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Formulario de creación/edición */}
      {(showForm || editingClass) && (
        <LiveClassForm
          liveClass={editingClass || undefined}
          competencies={competencies}
          modules={modules}
          lessons={lessons}
          schools={schoolsWithId}
          userRole={userRole}
          userSchoolId={userSchoolId}
          onSubmit={editingClass ? handleUpdateClass : handleCreateClass}
          onCancel={() => {
            setShowForm(false);
            setEditingClass(null);
          }}
        />
      )}

      {/* Dialog de detalles */}
      {selectedClass && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedClass.title}</DialogTitle>
              <DialogDescription>
                Detalles de la clase en vivo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedClass.description && (
                <div>
                  <Label className="text-sm font-medium">Descripción</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedClass.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Fecha y Hora</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(new Date(selectedClass.startDateTime))} a las{' '}
                    {new Date(selectedClass.startDateTime).toLocaleTimeString('es-CO', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                    {selectedClass.endDateTime && (
                      <> - {new Date(selectedClass.endDateTime).toLocaleTimeString('es-CO', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</>
                    )}
                  </p>
                </div>
                
                {selectedClass.provider && (
                  <div>
                    <Label className="text-sm font-medium">Proveedor</Label>
                    <div className="mt-1">
                      {PROVIDER_ICONS[selectedClass.provider] ? (
                        <Badge className={PROVIDER_ICONS[selectedClass.provider].color}>
                          {PROVIDER_ICONS[selectedClass.provider].name}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{selectedClass.provider}</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Enlace de la Reunión</Label>
                <div className="mt-1">
                  <a
                    href={selectedClass.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {selectedClass.meetingUrl}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {(selectedClass.competency || selectedClass.module || selectedClass.lesson) && (
                <div>
                  <Label className="text-sm font-medium">Contenido Relacionado</Label>
                  <div className="mt-1 space-y-1">
                    {selectedClass.competency && (
                      <Badge variant="outline" style={{ 
                        borderColor: selectedClass.competency.colorHex || undefined 
                      }}>
                        {selectedClass.competency.displayName || selectedClass.competency.name}
                      </Badge>
                    )}
                    {selectedClass.module && (
                      <div className="text-sm text-muted-foreground">
                        <BookOpen className="w-3 h-3 inline mr-1" />
                        Módulo: {selectedClass.module.title}
                      </div>
                    )}
                    {selectedClass.lesson && (
                      <div className="text-sm text-muted-foreground">
                        <GraduationCap className="w-3 h-3 inline mr-1" />
                        Lección: {selectedClass.lesson.title}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedClass.school && (
                <div>
                  <Label className="text-sm font-medium">Colegio</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedClass.school.name}</p>
                </div>
              )}

              {selectedClass.invitations && selectedClass.invitations.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Invitados ({selectedClass.invitations.length})</Label>
                  <div className="mt-1 max-h-32 overflow-y-auto">
                    <div className="space-y-1">
                      {selectedClass.invitations.map((invitation) => (
                        <div key={invitation.id} className="text-sm text-muted-foreground">
                          {invitation.user.firstName} {invitation.user.lastName} ({invitation.user.role})
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

