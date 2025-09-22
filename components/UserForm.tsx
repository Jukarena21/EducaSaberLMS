"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { useSession } from 'next-auth/react'
import { X, Save, UserPlus } from 'lucide-react'

interface UserFormData {
  email: string
  password?: string
  firstName: string
  lastName: string
  role: string
  schoolId?: string
  dateOfBirth?: string
  gender?: string
  documentType?: string
  documentNumber?: string
  address?: string
  neighborhood?: string
  city?: string
  socioeconomicStratum?: number
  housingType?: string
  schoolEntryYear?: number
  academicAverage?: number
  areasOfDifficulty?: string[]
  areasOfStrength?: string[]
  repetitionHistory?: boolean
  schoolSchedule?: string
  disabilities?: string[]
  specialEducationalNeeds?: string
  medicalConditions?: string
  homeTechnologyAccess?: boolean
  homeInternetAccess?: boolean
  contactPhone?: string
}

interface UserFormProps {
  user?: UserFormData | null
  schools: Array<{ id: string; name: string }>
  onSubmit: (data: UserFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const competencyAreas = [
  'Lectura Crítica',
  'Matemáticas',
  'Ciencias Naturales',
  'Ciencias Sociales',
  'Inglés'
]

const disabilityTypes = [
  'Visual',
  'Auditiva',
  'Motora',
  'Cognitiva',
  'Psicosocial',
  'Múltiple'
]

export default function UserForm({ user, schools, onSubmit, onCancel, loading = false }: UserFormProps) {
  const { data: session } = useSession()
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'student',
    schoolId: '',
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
  })

  const isEditing = !!user
  const isSchoolAdmin = session?.user?.role === 'school_admin'

  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        password: '', // Don't populate password when editing
        areasOfDifficulty: user.areasOfDifficulty || [],
        areasOfStrength: user.areasOfStrength || [],
        disabilities: user.disabilities || [],
      })
    }
  }, [user])

  const handleInputChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field: 'areasOfDifficulty' | 'areasOfStrength' | 'disabilities', value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...(prev[field] || []), value]
        : (prev[field] || []).filter(item => item !== value)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Form submitted with data:', formData)
    
    // Validation
    if (!formData.email || !formData.firstName || !formData.lastName || !formData.role) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    if (!isEditing && !formData.password) {
      alert('La contraseña es requerida para nuevos usuarios')
      return
    }

    // Role-specific validation
    if (formData.role === 'school_admin' && !formData.schoolId) {
      alert('Por favor selecciona un colegio para el administrador')
      return
    }
    
    // Students should have a school assigned
    if (formData.role === 'student' && !formData.schoolId) {
      alert('Por favor selecciona un colegio para el estudiante')
      return
    }

    try {
      await onSubmit(formData)
      console.log('Form submission successful')
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const getRoleOptions = () => {
    if (isSchoolAdmin) {
      return [
        { value: 'student', label: 'Estudiante' },
        // School admins can only create students, not other admins
      ]
    }
    return [
      { value: 'student', label: 'Estudiante' },
      { value: 'school_admin', label: 'Administrador de Colegio' },
      { value: 'teacher_admin', label: 'Profesor Administrador' },
    ]
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'student': return 'Estudiante'
      case 'school_admin': return 'Administrador de Colegio'
      case 'teacher_admin': return 'Profesor Administrador'
      default: return role
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {isEditing && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center space-x-2">
                <div className="text-blue-600">ℹ️</div>
                <div className="text-sm text-blue-800">
                  <strong>Modo de edición:</strong> El rol del usuario no se puede cambiar una vez creado.
                </div>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className={`grid w-full ${formData.role === 'student' ? 'grid-cols-4' : formData.role === 'school_admin' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <TabsTrigger value="basic">Información Básica</TabsTrigger>
                {formData.role === 'student' && (
                  <>
                    <TabsTrigger value="personal">Información Personal</TabsTrigger>
                    <TabsTrigger value="academic">Información Académica</TabsTrigger>
                    <TabsTrigger value="special">Condiciones Especiales</TabsTrigger>
                  </>
                )}
                {formData.role === 'school_admin' && (
                  <TabsTrigger value="school">Información del Colegio</TabsTrigger>
                )}
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
                  <div>
                    <Label htmlFor="password">
                      {isEditing ? 'Nueva Contraseña (dejar en blanco para mantener)' : 'Contraseña *'}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required={!isEditing}
                    />
                  </div>
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
                    <Label htmlFor="role">Rol *</Label>
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          value={getRoleDisplayName(formData.role)}
                          disabled
                          className="bg-gray-50"
                        />
                        <div className="text-xs text-gray-500 bg-yellow-50 px-2 py-1 rounded">
                          No se puede cambiar
                        </div>
                      </div>
                    ) : (
                      <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getRoleOptions().map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  {/* Show school field only for students, not for admins */}
                  {formData.role === 'student' && (
                    <div>
                      <Label htmlFor="schoolId">Colegio</Label>
                      <Select value={formData.schoolId || 'none'} onValueChange={(value) => handleInputChange('schoolId', value === 'none' ? '' : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar colegio" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {schools.map(school => (
                            <SelectItem key={school.id} value={school.id}>
                              {school.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Personal Information Tab - Only for Students */}
              {formData.role === 'student' && (
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
                      <Select value={formData.gender || 'none'} onValueChange={(value) => handleInputChange('gender', value === 'none' ? '' : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar género" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Seleccionar género</SelectItem>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="femenino">Femenino</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                          <SelectItem value="prefiero_no_decir">Prefiero no decir</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="documentType">Tipo de Documento</Label>
                      <Select value={formData.documentType || 'none'} onValueChange={(value) => handleInputChange('documentType', value === 'none' ? '' : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Seleccionar tipo</SelectItem>
                          <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                          <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                          <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                          <SelectItem value="PP">Pasaporte</SelectItem>
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
                      <Select value={formData.socioeconomicStratum?.toString() || 'none'} onValueChange={(value) => handleInputChange('socioeconomicStratum', value === 'none' ? undefined : parseInt(value) || undefined)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estrato" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Seleccionar estrato</SelectItem>
                          <SelectItem value="1">Estrato 1</SelectItem>
                          <SelectItem value="2">Estrato 2</SelectItem>
                          <SelectItem value="3">Estrato 3</SelectItem>
                          <SelectItem value="4">Estrato 4</SelectItem>
                          <SelectItem value="5">Estrato 5</SelectItem>
                          <SelectItem value="6">Estrato 6</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="housingType">Tipo de Vivienda</Label>
                      <Select value={formData.housingType || 'none'} onValueChange={(value) => handleInputChange('housingType', value === 'none' ? '' : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Seleccionar tipo</SelectItem>
                          <SelectItem value="propia">Propia</SelectItem>
                          <SelectItem value="arrendada">Arrendada</SelectItem>
                          <SelectItem value="familiar">Familiar</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* Academic Information Tab - Only for Students */}
              {formData.role === 'student' && (
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
                      <Select value={formData.schoolSchedule || 'none'} onValueChange={(value) => handleInputChange('schoolSchedule', value === 'none' ? '' : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar jornada" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Seleccionar jornada</SelectItem>
                          <SelectItem value="diurna">Diurna</SelectItem>
                          <SelectItem value="nocturna">Nocturna</SelectItem>
                          <SelectItem value="fin_de_semana">Fin de Semana</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="repetitionHistory"
                        checked={formData.repetitionHistory}
                        onCheckedChange={(checked) => handleInputChange('repetitionHistory', checked)}
                      />
                      <Label htmlFor="repetitionHistory">Historial de Repitencia</Label>
                    </div>
                  </div>

                  <div>
                    <Label>Áreas de Dificultad</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {competencyAreas.map(area => (
                        <div key={area} className="flex items-center space-x-2">
                          <Checkbox
                            id={`difficulty-${area}`}
                            checked={formData.areasOfDifficulty?.includes(area)}
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
                      {competencyAreas.map(area => (
                        <div key={area} className="flex items-center space-x-2">
                          <Checkbox
                            id={`strength-${area}`}
                            checked={formData.areasOfStrength?.includes(area)}
                            onCheckedChange={(checked) => handleArrayChange('areasOfStrength', area, checked as boolean)}
                          />
                          <Label htmlFor={`strength-${area}`} className="text-sm">{area}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* Special Conditions Tab - Only for Students */}
              {formData.role === 'student' && (
                <TabsContent value="special" className="space-y-4">
                  <div>
                    <Label>Tipos de Discapacidad</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {disabilityTypes.map(disability => (
                        <div key={disability} className="flex items-center space-x-2">
                          <Checkbox
                            id={`disability-${disability}`}
                            checked={formData.disabilities?.includes(disability)}
                            onCheckedChange={(checked) => handleArrayChange('disabilities', disability, checked as boolean)}
                          />
                          <Label htmlFor={`disability-${disability}`} className="text-sm">{disability}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="specialEducationalNeeds">Necesidades Educativas Especiales</Label>
                    <Textarea
                      id="specialEducationalNeeds"
                      value={formData.specialEducationalNeeds}
                      onChange={(e) => handleInputChange('specialEducationalNeeds', e.target.value)}
                      placeholder="Describa las necesidades educativas especiales..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="medicalConditions">Condiciones Médicas</Label>
                    <Textarea
                      id="medicalConditions"
                      value={formData.medicalConditions}
                      onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                      placeholder="Describa las condiciones médicas relevantes..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="homeTechnologyAccess"
                        checked={formData.homeTechnologyAccess}
                        onCheckedChange={(checked) => handleInputChange('homeTechnologyAccess', checked)}
                      />
                      <Label htmlFor="homeTechnologyAccess">Acceso a Tecnología en Casa</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="homeInternetAccess"
                        checked={formData.homeInternetAccess}
                        onCheckedChange={(checked) => handleInputChange('homeInternetAccess', checked)}
                      />
                      <Label htmlFor="homeInternetAccess">Acceso a Internet en Casa</Label>
                    </div>
                  </div>
                </TabsContent>
              )}

              {/* School Information Tab - Only for School Admins */}
              {formData.role === 'school_admin' && (
                <TabsContent value="school" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="schoolId">Colegio Asignado *</Label>
                      <Select value={formData.schoolId || 'none'} onValueChange={(value) => handleInputChange('schoolId', value === 'none' ? '' : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar colegio" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Seleccionar colegio</SelectItem>
                          {schools.map(school => (
                            <SelectItem key={school.id} value={school.id}>
                              {school.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="documentType">Tipo de Documento</Label>
                      <Select value={formData.documentType || 'none'} onValueChange={(value) => handleInputChange('documentType', value === 'none' ? '' : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Seleccionar tipo</SelectItem>
                          <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                          <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                          <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                          <SelectItem value="PP">Pasaporte</SelectItem>
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
                      <Label htmlFor="city">Ciudad</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPhone">Teléfono de Contacto</Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        value={formData.contactPhone || ''}
                        onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                        placeholder="+57 300 123 4567"
                      />
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 