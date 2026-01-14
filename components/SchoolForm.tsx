'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { SchoolFormData, SchoolFormProps } from '@/types/school';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Calendar,
  GraduationCap,
  Info,
  X,
  Award,
  BookMarked,
  Briefcase,
  Building,
  ArrowRight
} from 'lucide-react';

export default function SchoolForm({ school, onSubmit, onCancel, loading = false }: SchoolFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    city: '',
    neighborhood: '',
    address: '',
    institutionType: 'privada',
    academicCalendar: 'diurno',
    totalStudents: 0,
    numberOfCampuses: 1,
    yearsOfOperation: 1,
    contactEmail: '',
    contactPhone: '',
    type: 'school',
    daneCode: '',
  });

  const isEditing = !!school;
  // Si está editando, ya tiene tipo seleccionado. Si está creando, necesita seleccionar tipo primero
  const [institutionTypeSelected, setInstitutionTypeSelected] = useState(!!school);

  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name || '',
        city: school.city || '',
        neighborhood: school.neighborhood || '',
        address: school.address || '',
        institutionType: school.institutionType || 'privada',
        academicCalendar: school.academicCalendar || 'diurno',
        totalStudents: school.totalStudents || 0,
        numberOfCampuses: school.numberOfCampuses || 1,
        yearsOfOperation: school.yearsOfOperation || 1,
        contactEmail: school.contactEmail || '',
        contactPhone: school.contactPhone || '',
        type: (school as any).type || 'school',
        daneCode: (school as any).daneCode || '',
      });
      setInstitutionTypeSelected(true); // Si está editando, ya tiene tipo
    } else {
      setInstitutionTypeSelected(false); // Si está creando, necesita seleccionar tipo primero
    }
  }, [school]);

  const handleInputChange = (field: keyof SchoolFormData, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Si cambia el tipo de institución, resetear campos específicos
      if (field === 'type') {
        if (value !== 'school') {
          // Si no es colegio, limpiar campos específicos de colegio
          updated.daneCode = '';
          updated.institutionType = 'privada'; // Mantener valor por defecto pero no será usado
          updated.academicCalendar = 'diurno'; // Mantener valor por defecto pero no será usado
        }
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.name || !formData.city || !formData.neighborhood || !formData.contactEmail || !formData.contactPhone) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive',
      });
      return;
    }

    // Validaciones específicas según el tipo
    if (formData.type === 'school') {
      if (!formData.institutionType || !formData.academicCalendar) {
        toast({
          title: 'Campos requeridos',
          description: 'Para colegios, el tipo de institución y calendario académico son requeridos',
          variant: 'destructive',
        });
        return;
      }
    }

    if (formData.totalStudents < 0 || formData.numberOfCampuses < 1 || formData.yearsOfOperation < 1) {
      toast({
        title: 'Valores inválidos',
        description: 'Por favor verifica los valores numéricos',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onSubmit(formData);
      toast({
        title: isEditing ? 'Institución actualizada' : 'Institución creada',
        description: isEditing 
          ? 'La institución se ha actualizado correctamente.'
          : 'La institución se ha creado correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive',
      });
    }
  };

  // Pantalla de selección de tipo de institución (solo para creación, no para edición)
  if (!isEditing && !institutionTypeSelected) {
    const institutionTypes = [
      {
        type: 'school' as const,
        title: 'Colegio',
        description: 'Institución educativa escolar. Permite cursos ICFES y generales. Requiere código DANE (opcional), tipo de institución y calendario académico.',
        icon: GraduationCap,
        color: 'blue' as const,
      },
      {
        type: 'company' as const,
        title: 'Empresa',
        description: 'Empresa privada o corporación. Permite solo cursos generales (no ICFES). No requiere código DANE ni información académica.',
        icon: Briefcase,
        color: 'green' as const,
      },
      {
        type: 'government_entity' as const,
        title: 'Entidad Gubernamental',
        description: 'Institución pública gubernamental. Permite solo cursos generales (no ICFES). No requiere código DANE ni información académica.',
        icon: Building,
        color: 'purple' as const,
      },
      {
        type: 'other' as const,
        title: 'Otro',
        description: 'Otro tipo de institución. Permite solo cursos generales (no ICFES). Campos mínimos requeridos.',
        icon: Info,
        color: 'gray' as const,
      },
    ];

    return (
      <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Selecciona el tipo de institución</DialogTitle>
            <DialogDescription className="text-center">
              Elige el tipo de institución que deseas crear
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {institutionTypes.map((instType) => {
              const IconComponent = instType.icon;
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
                green: 'bg-green-100 text-green-600 group-hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400',
                purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400',
                gray: 'bg-gray-100 text-gray-600 group-hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-400',
              };
              
              return (
                <Card
                  key={instType.type}
                  className="cursor-pointer transition-all hover:shadow-lg group border-2 hover:border-primary"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, type: instType.type }));
                    setInstitutionTypeSelected(true);
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${colorClasses[instType.color]}`}>
                        <IconComponent className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{instType.title}</h3>
                        <p className="text-sm text-muted-foreground">{instType.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {isEditing 
                  ? `Editar ${formData.type === 'school' ? 'Colegio' : formData.type === 'company' ? 'Empresa' : formData.type === 'government_entity' ? 'Entidad Gubernamental' : 'Institución'}`
                  : `Crear ${formData.type === 'school' ? 'Colegio' : formData.type === 'company' ? 'Empresa' : formData.type === 'government_entity' ? 'Entidad Gubernamental' : 'Institución'}`
                }
              </DialogTitle>
              <DialogDescription>
                {isEditing 
                  ? `Modifica la información de la ${formData.type === 'school' ? 'institución educativa' : formData.type === 'company' ? 'empresa' : formData.type === 'government_entity' ? 'entidad gubernamental' : 'institución'}`
                  : `Completa la información para crear una nueva ${formData.type === 'school' ? 'institución educativa' : formData.type === 'company' ? 'empresa' : formData.type === 'government_entity' ? 'entidad gubernamental' : 'institución'}`
                }
              </DialogDescription>
            </div>
            {!isEditing && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setInstitutionTypeSelected(false);
                  setFormData(prev => ({ ...prev, type: 'school' }));
                }}
                className="text-xs"
              >
                Cambiar Tipo
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="mt-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Información básica</TabsTrigger>
              <TabsTrigger value="location">Ubicación</TabsTrigger>
              <TabsTrigger value="contact">Contacto</TabsTrigger>
            </TabsList>

            {/* Pestaña: Información básica */}
            <TabsContent value="basic" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Datos principales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nombre */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="name">Nombre del Colegio / Entidad *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Ej: Colegio San José"
                        required
                      />
                    </div>

                    {/* Código DANE - Solo para colegios */}
                    {formData.type === 'school' && (
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="daneCode">Código DANE</Label>
                        <Input
                          id="daneCode"
                          value={formData.daneCode || ''}
                          onChange={(e) => handleInputChange('daneCode', e.target.value)}
                          placeholder="Ej: 123456789012"
                          maxLength={12}
                        />
                        <p className="text-xs text-muted-foreground">
                          Código único del Ministerio de Educación (opcional pero recomendado)
                        </p>
                      </div>
                    )}

                    {/* Tipo de institución - Solo para colegios */}
                    {formData.type === 'school' && (
                      <div className="space-y-2">
                        <Label htmlFor="institutionType">Tipo de Institución *</Label>
                        <Select
                          value={formData.institutionType}
                          onValueChange={(value) => handleInputChange('institutionType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="publica">Pública</SelectItem>
                            <SelectItem value="privada">Privada</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Calendario académico - Solo para colegios */}
                    {formData.type === 'school' && (
                      <div className="space-y-2">
                        <Label htmlFor="academicCalendar">Calendario Académico *</Label>
                        <Select
                          value={formData.academicCalendar}
                          onValueChange={(value) => handleInputChange('academicCalendar', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="diurno">Diurno</SelectItem>
                            <SelectItem value="nocturno">Nocturno</SelectItem>
                            <SelectItem value="ambos">Ambos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estadísticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total de estudiantes/empleados según el tipo */}
                    <div className="space-y-2">
                      <Label htmlFor="totalStudents" className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {formData.type === 'school' 
                          ? 'Total de Estudiantes *'
                          : formData.type === 'company'
                          ? 'Total de Empleados *'
                          : formData.type === 'government_entity'
                          ? 'Total de Funcionarios *'
                          : 'Total de Personas *'
                        }
                      </Label>
                      <Input
                        id="totalStudents"
                        type="number"
                        min="0"
                        value={formData.totalStudents}
                        onChange={(e) => handleInputChange('totalStudents', parseInt(e.target.value) || 0)}
                        required
                      />
                    </div>

                    {/* Número de sedes */}
                    <div className="space-y-2">
                      <Label htmlFor="numberOfCampuses" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Número de Sedes *
                      </Label>
                      <Input
                        id="numberOfCampuses"
                        type="number"
                        min="1"
                        value={formData.numberOfCampuses}
                        onChange={(e) => handleInputChange('numberOfCampuses', parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>

                    {/* Años de operación */}
                    <div className="space-y-2">
                      <Label htmlFor="yearsOfOperation" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        Años de Operación *
                      </Label>
                      <Input
                        id="yearsOfOperation"
                        type="number"
                        min="1"
                        value={formData.yearsOfOperation}
                        onChange={(e) => handleInputChange('yearsOfOperation', parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pestaña: Ubicación */}
            <TabsContent value="location" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Información de ubicación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ciudad */}
                    <div className="space-y-2">
                      <Label htmlFor="city">Ciudad *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Ej: Bogotá"
                        required
                      />
                    </div>

                    {/* Barrio */}
                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">Barrio *</Label>
                      <Input
                        id="neighborhood"
                        value={formData.neighborhood}
                        onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                        placeholder="Ej: Chapinero"
                        required
                      />
                    </div>

                    {/* Dirección */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Dirección</Label>
                      <Input
                        id="address"
                        value={formData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Ej: Calle 123 # 45-67"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pestaña: Contacto */}
            <TabsContent value="contact" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Información de contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail" className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        Email de Contacto *
                      </Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                        placeholder="contacto@colegio.edu.co"
                        required
                      />
                    </div>

                    {/* Teléfono */}
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        Teléfono de Contacto *
                      </Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                        placeholder="+57 300 123 4567"
                        required
                      />
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
                    {formData.type === 'school' && (
                      <>
                        <li>Los colegios pueden acceder a cursos ICFES y cursos generales</li>
                        <li>El código DANE es opcional pero recomendado para colegios en Colombia</li>
                        <li>El tipo de institución y calendario académico son requeridos para colegios</li>
                      </>
                    )}
                    {(formData.type === 'company' || formData.type === 'government_entity' || formData.type === 'other') && (
                      <>
                        <li>Este tipo de institución solo puede acceder a cursos generales (no ICFES)</li>
                        <li>No se requiere código DANE ni información académica</li>
                      </>
                    )}
                    <li>No puede haber dos instituciones con el mismo nombre en la misma ciudad</li>
                    <li>La información de contacto será utilizada para comunicaciones oficiales</li>
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
              disabled={loading}
            >
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
