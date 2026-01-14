'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSession } from 'next-auth/react';
import { X, Save, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StudentFormData {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  contactPhone?: string;
  academicGrade?: string;
  dateOfBirth?: string;
  gender?: string;
  documentType?: string;
  documentNumber?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  socioeconomicStratum?: number;
  housingType?: string;
  schoolEntryYear?: number;
  academicAverage?: number;
  areasOfDifficulty?: string[];
  areasOfStrength?: string[];
  repetitionHistory?: boolean;
  schoolSchedule?: string;
  disabilities?: string[];
  specialEducationalNeeds?: string;
  medicalConditions?: string;
  homeTechnologyAccess?: boolean;
  homeInternetAccess?: boolean;
  contactPhone?: string;
}

interface StudentFormProps {
  student?: any | null;
  onSubmit: (data: StudentFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const competencyAreas = [
  'Lectura Crítica',
  'Matemáticas',
  'Ciencias Naturales',
  'Ciencias Sociales',
  'Inglés'
];

const disabilityTypes = [
  'Visual',
  'Auditiva',
  'Motora',
  'Cognitiva',
  'Psicosocial',
  'Múltiple'
];

export function StudentForm({ student, onSubmit, onCancel, loading = false }: StudentFormProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<StudentFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    contactPhone: '',
    academicGrade: '',
    dateOfBirth: '',
    gender: '',
    documentType: '',
    documentNumber: '',
    address: '',
    neighborhood: '',
    city: '',
    socioeconomicStratum: undefined,
    housingType: '',
    schoolEntryYear: undefined,
    academicAverage: undefined,
    areasOfDifficulty: [],
    areasOfStrength: [],
    repetitionHistory: false,
    schoolSchedule: '',
    disabilities: [],
    specialEducationalNeeds: '',
    medicalConditions: '',
    homeTechnologyAccess: false,
    homeInternetAccess: false,
    contactPhone: '',
  });

  const isEditing = !!student;

  useEffect(() => {
    if (student) {
      setFormData({
        ...student,
        password: '', // Don't populate password when editing
        areasOfDifficulty: student.areasOfDifficulty || [],
        areasOfStrength: student.areasOfStrength || [],
        disabilities: student.disabilities || [],
        contactPhone: student.contactPhone || student.phone || '',
        academicGrade: student.academicGrade ?? '',
        specialEducationalNeeds: student.specialEducationalNeeds ?? '',
        medicalConditions: student.medicalConditions ?? '',
        schoolSchedule: student.schoolSchedule ?? '',
        housingType: student.housingType ?? '',
        address: student.address ?? '',
        neighborhood: student.neighborhood ?? '',
        city: student.city ?? '',
      });
    }
  }, [student]);

  const handleInputChange = (field: keyof StudentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'areasOfDifficulty' | 'areasOfStrength' | 'disabilities', value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...(prev[field] || []), value]
        : (prev[field] || []).filter(item => item !== value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    if (!isEditing && !formData.password) {
      toast({
        title: "Error",
        description: "La contraseña es requerida para nuevos estudiantes",
        variant: "destructive",
      });
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el estudiante",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {isEditing ? 'Editar Estudiante' : 'Crear Nuevo Estudiante'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica la información del estudiante. El colegio se asigna automáticamente según tu institución.'
              : 'Completa el formulario para crear un nuevo estudiante. El colegio se asignará automáticamente según tu institución.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {isEditing && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center space-x-2">
                <div className="text-blue-600">ℹ️</div>
                <div className="text-sm text-blue-800">
                  <strong>Modo de edición:</strong> El colegio se asigna automáticamente según tu institución.
                </div>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Información Básica</TabsTrigger>
                <TabsTrigger value="personal">Información Personal</TabsTrigger>
                <TabsTrigger value="academic">Información Académica</TabsTrigger>
                <TabsTrigger value="special">Condiciones Especiales</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  {!isEditing && (
                    <div>
                      <Label htmlFor="password">Contraseña *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Teléfono</Label>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="academicGrade">Grado Académico</Label>
                    <Select value={formData.academicGrade || ''} onValueChange={(value) => handleInputChange('academicGrade', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar grado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">Grado 6</SelectItem>
                        <SelectItem value="7">Grado 7</SelectItem>
                        <SelectItem value="8">Grado 8</SelectItem>
                        <SelectItem value="9">Grado 9</SelectItem>
                        <SelectItem value="10">Grado 10</SelectItem>
                        <SelectItem value="11">Grado 11</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">Fecha de Nacimiento</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Género</Label>
                    <Select value={formData.gender || ''} onValueChange={(value) => handleInputChange('gender', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar género" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="femenino">Femenino</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="documentType">Tipo de Documento</Label>
                    <Select value={formData.documentType || ''} onValueChange={(value) => handleInputChange('documentType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cc">Cédula de Ciudadanía</SelectItem>
                        <SelectItem value="ti">Tarjeta de Identidad</SelectItem>
                        <SelectItem value="rc">Registro Civil</SelectItem>
                        <SelectItem value="ce">Cédula de Extranjería</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="documentNumber">Número de Documento</Label>
                    <Input
                      id="documentNumber"
                      value={formData.documentNumber}
                      onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="neighborhood">Barrio</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="socioeconomicStratum">Estrato Socioeconómico</Label>
                    <Select value={formData.socioeconomicStratum?.toString() || ''} onValueChange={(value) => handleInputChange('socioeconomicStratum', value ? parseInt(value) : undefined)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estrato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Estrato 1</SelectItem>
                        <SelectItem value="2">Estrato 2</SelectItem>
                        <SelectItem value="3">Estrato 3</SelectItem>
                        <SelectItem value="4">Estrato 4</SelectItem>
                        <SelectItem value="5">Estrato 5</SelectItem>
                        <SelectItem value="6">Estrato 6</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Academic Information Tab */}
              <TabsContent value="academic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="schoolEntryYear">Año de Ingreso al Colegio</Label>
                    <Input
                      id="schoolEntryYear"
                      type="number"
                      min="2000"
                      max="2030"
                      value={formData.schoolEntryYear || ''}
                      onChange={(e) => handleInputChange('schoolEntryYear', parseInt(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="academicAverage">Promedio Académico</Label>
                    <Input
                      id="academicAverage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="5"
                      value={formData.academicAverage || ''}
                      onChange={(e) => handleInputChange('academicAverage', parseFloat(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="schoolSchedule">Jornada Escolar</Label>
                    <Select value={formData.schoolSchedule || ''} onValueChange={(value) => handleInputChange('schoolSchedule', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar jornada" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mañana">Mañana</SelectItem>
                        <SelectItem value="tarde">Tarde</SelectItem>
                        <SelectItem value="noche">Noche</SelectItem>
                        <SelectItem value="completa">Jornada Completa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="repetitionHistory"
                      checked={formData.repetitionHistory || false}
                      onCheckedChange={(checked) => handleInputChange('repetitionHistory', checked)}
                    />
                    <Label htmlFor="repetitionHistory">Historial de Repetición</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Áreas de Dificultad</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {competencyAreas.map((area) => (
                        <div key={area} className="flex items-center space-x-2">
                          <Checkbox
                            id={`difficulty-${area}`}
                            checked={formData.areasOfDifficulty?.includes(area) || false}
                            onCheckedChange={(checked) => handleArrayChange('areasOfDifficulty', area, checked as boolean)}
                          />
                          <Label htmlFor={`difficulty-${area}`} className="text-sm">{area}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Áreas de Fortaleza</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {competencyAreas.map((area) => (
                        <div key={area} className="flex items-center space-x-2">
                          <Checkbox
                            id={`strength-${area}`}
                            checked={formData.areasOfStrength?.includes(area) || false}
                            onCheckedChange={(checked) => handleArrayChange('areasOfStrength', area, checked as boolean)}
                          />
                          <Label htmlFor={`strength-${area}`} className="text-sm">{area}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Special Conditions Tab */}
              <TabsContent value="special" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label>Tipos de Discapacidad</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {disabilityTypes.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`disability-${type}`}
                            checked={formData.disabilities?.includes(type) || false}
                            onCheckedChange={(checked) => handleArrayChange('disabilities', type, checked as boolean)}
                          />
                          <Label htmlFor={`disability-${type}`} className="text-sm">{type}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="specialEducationalNeeds">Necesidades Educativas Especiales</Label>
                    <Input
                      id="specialEducationalNeeds"
                      value={formData.specialEducationalNeeds}
                      onChange={(e) => handleInputChange('specialEducationalNeeds', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="medicalConditions">Condiciones Médicas</Label>
                    <Input
                      id="medicalConditions"
                      value={formData.medicalConditions}
                      onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="homeTechnologyAccess"
                        checked={formData.homeTechnologyAccess || false}
                        onCheckedChange={(checked) => handleInputChange('homeTechnologyAccess', checked)}
                      />
                      <Label htmlFor="homeTechnologyAccess">Acceso a Tecnología en Casa</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="homeInternetAccess"
                        checked={formData.homeInternetAccess || false}
                        onCheckedChange={(checked) => handleInputChange('homeInternetAccess', checked)}
                      />
                      <Label htmlFor="homeInternetAccess">Acceso a Internet en Casa</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex space-x-3 pt-4">
              <Button onClick={onCancel} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-[#73A2D3]" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Actualizar' : 'Crear'} Estudiante
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
