"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useSession } from 'next-auth/react'
import { X, Save, UserPlus, GraduationCap, School, UserCog, ArrowRight } from 'lucide-react'

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
  // Si está editando, ya tiene rol seleccionado. Si está creando, necesita seleccionar rol primero
  const [roleSelected, setRoleSelected] = useState(!!user)

  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
        password: '', // Don't populate password when editing
        areasOfDifficulty: user.areasOfDifficulty || [],
        areasOfStrength: user.areasOfStrength || [],
        disabilities: user.disabilities || [],
      })
      setRoleSelected(true) // Si está editando, ya tiene rol
    } else {
      setRoleSelected(false) // Si está creando, necesita seleccionar rol primero
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
    
    if (formData.role === 'school_admin' && !formData.contactPhone) {
      alert('Por favor ingresa el teléfono de contacto')
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

  const handleRoleSelect = (role: string) => {
    setFormData(prev => ({ ...prev, role }))
    setRoleSelected(true)
  }

  const handleBackToRoleSelection = () => {
    setRoleSelected(false)
    setFormData(prev => ({ ...prev, role: 'student' }))
  }

  // Tipos de rol disponibles
  const roleTypes = [
    { 
      value: 'student', 
      label: 'Estudiante', 
      icon: GraduationCap, 
      color: 'blue',
      description: 'Estudiante de la plataforma con acceso a cursos y exámenes'
    },
    { 
      value: 'school_admin', 
      label: 'Administrador de Colegio', 
      icon: School, 
      color: 'green',
      description: 'Administrador de institución con acceso a analytics y gestión de estudiantes'
    },
    { 
      value: 'teacher_admin', 
      label: 'Profesor Administrador', 
      icon: UserCog, 
      color: 'purple',
      description: 'Profesor con permisos administrativos para crear contenido y gestionar cursos'
    },
  ]

  // Filtrar roles según permisos
  const availableRoleTypes = isSchoolAdmin
    ? roleTypes.filter(r => r.value === 'student')
    : roleTypes

  // Pantalla de selección de rol (solo para creación, no para edición)
  if (!isEditing && !roleSelected) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Selecciona el tipo de usuario</DialogTitle>
            <DialogDescription className="text-center">
              Elige el tipo de usuario que deseas crear
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableRoleTypes.map((type) => {
                const IconComponent = type.icon
                const colorClasses = {
                  blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
                  green: 'bg-green-100 text-green-600 group-hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400',
                  purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400',
                }
                
                return (
                  <button
                    key={type.value}
                    onClick={() => handleRoleSelect(type.value)}
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
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                {isEditing ? 'Editar Usuario' : `Crear ${getRoleDisplayName(formData.role)}`}
              </DialogTitle>
              <DialogDescription>
                {isEditing 
                  ? 'Modifica la información del usuario'
                  : 'Completa la información para crear un nuevo usuario'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {getRoleDisplayName(formData.role)}
              </Badge>
              {!isEditing && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToRoleSelection}
                  className="text-xs"
                >
                  Cambiar Rol
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          {isEditing && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">Modo edición:</span> El rol del usuario no se puede cambiar.
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className={`grid w-full bg-gray-100/50 ${formData.role === 'student' ? 'grid-cols-4' : formData.role === 'school_admin' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <TabsTrigger value="basic" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">Información Básica</TabsTrigger>
                {formData.role === 'student' && (
                  <>
                    <TabsTrigger value="personal" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">Información Personal</TabsTrigger>
                    <TabsTrigger value="academic" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">Información Académica</TabsTrigger>
                    <TabsTrigger value="special" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">Condiciones Especiales</TabsTrigger>
                  </>
                )}
                {formData.role === 'school_admin' && (
                  <TabsTrigger value="school" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">Información del Colegio</TabsTrigger>
                )}
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-6 mt-6">
                {/* Sección: Credenciales de Acceso */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Credenciales de Acceso</CardTitle>
                    <CardDescription>
                      Información de inicio de sesión del usuario
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                        {isEditing ? 'Nueva Contraseña' : 'Contraseña *'}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required={!isEditing}
                        className="mt-1.5"
                        placeholder={isEditing ? 'Dejar en blanco para mantener' : ''}
                      />
                    </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sección: Información Personal Básica */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información Personal</CardTitle>
                    <CardDescription>
                      Datos básicos del usuario
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">Nombre *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">Apellido *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                        className="mt-1.5"
                      />
                    </div>
                    {formData.role === 'student' && (
                      <div className="md:col-span-2">
                        <Label htmlFor="schoolId" className="text-sm font-medium text-gray-700">Colegio</Label>
                        <Select value={formData.schoolId || 'none'} onValueChange={(value) => handleInputChange('schoolId', value === 'none' ? '' : value)}>
                          <SelectTrigger className="mt-1.5">
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
                    {formData.role === 'school_admin' && (
                      <>
                        <div>
                          <Label htmlFor="documentType" className="text-sm font-medium text-gray-700">Tipo de Documento</Label>
                          <Select value={formData.documentType || 'none'} onValueChange={(value) => handleInputChange('documentType', value === 'none' ? '' : value)}>
                            <SelectTrigger className="mt-1.5">
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
                          <Label htmlFor="documentNumber" className="text-sm font-medium text-gray-700">Número de Documento</Label>
                          <Input
                            id="documentNumber"
                            value={formData.documentNumber}
                            onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                            className="mt-1.5"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="contactPhone" className="text-sm font-medium text-gray-700">Teléfono de Contacto *</Label>
                          <Input
                            id="contactPhone"
                            type="tel"
                            value={formData.contactPhone || ''}
                            onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                            placeholder="+57 300 123 4567"
                            required
                            className="mt-1.5"
                          />
                        </div>
                      </>
                    )}
                    </div>
                  </CardContent>
                </Card>

                {/* Sección: Rol (solo si está editando) */}
                {isEditing && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Rol del Usuario</CardTitle>
                      <CardDescription>
                        El rol del usuario no se puede modificar
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div>
                      <Label htmlFor="role" className="text-sm font-medium text-gray-700">Rol</Label>
                      <Input
                        id="role"
                        value={getRoleDisplayName(formData.role)}
                        disabled
                        className="mt-1.5 bg-gray-50"
                      />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Personal Information Tab - Only for Students */}
              {formData.role === 'student' && (
                <TabsContent value="personal" className="space-y-6 mt-6">
                  {/* Sección: Datos Personales */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Datos Personales</CardTitle>
                      <CardDescription>
                        Información personal del estudiante
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">Fecha de Nacimiento</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="gender" className="text-sm font-medium text-gray-700">Género</Label>
                        <Select value={formData.gender || 'none'} onValueChange={(value) => handleInputChange('gender', value === 'none' ? '' : value)}>
                          <SelectTrigger className="mt-1.5">
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
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sección: Documento de Identidad */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Documento de Identidad</CardTitle>
                      <CardDescription>
                        Información del documento de identificación
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="documentType" className="text-sm font-medium text-gray-700">Tipo de Documento</Label>
                        <Select value={formData.documentType || 'none'} onValueChange={(value) => handleInputChange('documentType', value === 'none' ? '' : value)}>
                          <SelectTrigger className="mt-1.5">
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
                        <Label htmlFor="documentNumber" className="text-sm font-medium text-gray-700">Número de Documento</Label>
                        <Input
                          id="documentNumber"
                          value={formData.documentNumber}
                          onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sección: Dirección */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Dirección</CardTitle>
                      <CardDescription>
                        Información de ubicación del estudiante
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="address" className="text-sm font-medium text-gray-700">Dirección</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          className="mt-1.5"
                          placeholder="Calle, número, etc."
                        />
                      </div>
                      <div>
                        <Label htmlFor="neighborhood" className="text-sm font-medium text-gray-700">Barrio</Label>
                        <Input
                          id="neighborhood"
                          value={formData.neighborhood}
                          onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city" className="text-sm font-medium text-gray-700">Ciudad</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sección: Información Socioeconómica */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Información Socioeconómica</CardTitle>
                      <CardDescription>
                        Datos socioeconómicos del estudiante
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="socioeconomicStratum" className="text-sm font-medium text-gray-700">Estrato Socioeconómico</Label>
                        <Select value={formData.socioeconomicStratum?.toString() || 'none'} onValueChange={(value) => handleInputChange('socioeconomicStratum', value === 'none' ? undefined : parseInt(value) || undefined)}>
                          <SelectTrigger className="mt-1.5">
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
                        <Label htmlFor="housingType" className="text-sm font-medium text-gray-700">Tipo de Vivienda</Label>
                        <Select value={formData.housingType || 'none'} onValueChange={(value) => handleInputChange('housingType', value === 'none' ? '' : value)}>
                          <SelectTrigger className="mt-1.5">
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
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* Academic Information Tab - Only for Students */}
              {formData.role === 'student' && (
                <TabsContent value="academic" className="space-y-6 mt-6">
                  {/* Sección: Información del Colegio */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Información del Colegio</CardTitle>
                      <CardDescription>
                        Datos relacionados con la institución educativa
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="schoolEntryYear" className="text-sm font-medium text-gray-700">Año de Ingreso al Colegio</Label>
                        <Input
                          id="schoolEntryYear"
                          type="number"
                          min="2000"
                          max="2030"
                          value={formData.schoolEntryYear || ''}
                          onChange={(e) => handleInputChange('schoolEntryYear', parseInt(e.target.value) || undefined)}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="schoolSchedule" className="text-sm font-medium text-gray-700">Jornada Escolar</Label>
                        <Select value={formData.schoolSchedule || 'none'} onValueChange={(value) => handleInputChange('schoolSchedule', value === 'none' ? '' : value)}>
                          <SelectTrigger className="mt-1.5">
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
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sección: Rendimiento Académico */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Rendimiento Académico</CardTitle>
                      <CardDescription>
                        Información sobre el desempeño académico del estudiante
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="academicAverage" className="text-sm font-medium text-gray-700">Promedio Académico</Label>
                        <Input
                          id="academicAverage"
                          type="number"
                          step="0.01"
                          min="0"
                          max="5"
                          value={formData.academicAverage || ''}
                          onChange={(e) => handleInputChange('academicAverage', parseFloat(e.target.value) || undefined)}
                          className="mt-1.5"
                          placeholder="0.00 - 5.00"
                        />
                      </div>
                      <div className="flex items-center space-x-2 pt-8">
                        <Checkbox
                          id="repetitionHistory"
                          checked={formData.repetitionHistory}
                          onCheckedChange={(checked) => handleInputChange('repetitionHistory', checked)}
                        />
                        <Label htmlFor="repetitionHistory" className="text-sm font-medium text-gray-700">Historial de Repitencia</Label>
                      </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sección: Áreas de Dificultad */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Áreas de Dificultad</CardTitle>
                      <CardDescription>
                        Selecciona las áreas donde el estudiante presenta dificultades
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {competencyAreas.map(area => (
                        <div key={area} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                          <Checkbox
                            id={`difficulty-${area}`}
                            checked={formData.areasOfDifficulty?.includes(area)}
                            onCheckedChange={(checked) => handleArrayChange('areasOfDifficulty', area, checked as boolean)}
                          />
                          <Label htmlFor={`difficulty-${area}`} className="text-sm text-gray-700 cursor-pointer">{area}</Label>
                        </div>
                      ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sección: Áreas de Fortaleza */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Áreas de Fortaleza</CardTitle>
                      <CardDescription>
                        Selecciona las áreas donde el estudiante muestra fortalezas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {competencyAreas.map(area => (
                        <div key={area} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                          <Checkbox
                            id={`strength-${area}`}
                            checked={formData.areasOfStrength?.includes(area)}
                            onCheckedChange={(checked) => handleArrayChange('areasOfStrength', area, checked as boolean)}
                          />
                          <Label htmlFor={`strength-${area}`} className="text-sm text-gray-700 cursor-pointer">{area}</Label>
                        </div>
                      ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* Special Conditions Tab - Only for Students */}
              {formData.role === 'student' && (
                <TabsContent value="special" className="space-y-6 mt-6">
                  {/* Sección: Discapacidades */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Discapacidades</CardTitle>
                      <CardDescription>
                        Selecciona las discapacidades que presenta el estudiante
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {disabilityTypes.map(disability => (
                        <div key={disability} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                          <Checkbox
                            id={`disability-${disability}`}
                            checked={formData.disabilities?.includes(disability)}
                            onCheckedChange={(checked) => handleArrayChange('disabilities', disability, checked as boolean)}
                          />
                          <Label htmlFor={`disability-${disability}`} className="text-sm text-gray-700 cursor-pointer">{disability}</Label>
                        </div>
                      ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sección: Necesidades Educativas Especiales */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Necesidades Educativas Especiales</CardTitle>
                      <CardDescription>
                        Describe las necesidades educativas especiales del estudiante
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div>
                      <Label htmlFor="specialEducationalNeeds" className="text-sm font-medium text-gray-700">Descripción</Label>
                      <Textarea
                        id="specialEducationalNeeds"
                        value={formData.specialEducationalNeeds}
                        onChange={(e) => handleInputChange('specialEducationalNeeds', e.target.value)}
                        placeholder="Describa las necesidades educativas especiales del estudiante..."
                        className="mt-1.5"
                        rows={4}
                      />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sección: Condiciones Médicas */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Condiciones Médicas</CardTitle>
                      <CardDescription>
                        Describe las condiciones médicas relevantes del estudiante
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div>
                      <Label htmlFor="medicalConditions" className="text-sm font-medium text-gray-700">Descripción</Label>
                      <Textarea
                        id="medicalConditions"
                        value={formData.medicalConditions}
                        onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                        placeholder="Describa las condiciones médicas relevantes del estudiante..."
                        className="mt-1.5"
                        rows={4}
                      />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sección: Acceso a Tecnología */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Acceso a Tecnología</CardTitle>
                      <CardDescription>
                        Información sobre el acceso a tecnología del estudiante
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2 p-3 rounded border border-gray-200 hover:bg-gray-50">
                        <Checkbox
                          id="homeTechnologyAccess"
                          checked={formData.homeTechnologyAccess}
                          onCheckedChange={(checked) => handleInputChange('homeTechnologyAccess', checked)}
                        />
                        <Label htmlFor="homeTechnologyAccess" className="text-sm font-medium text-gray-700 cursor-pointer">Acceso a Tecnología en Casa</Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 rounded border border-gray-200 hover:bg-gray-50">
                        <Checkbox
                          id="homeInternetAccess"
                          checked={formData.homeInternetAccess}
                          onCheckedChange={(checked) => handleInputChange('homeInternetAccess', checked)}
                        />
                        <Label htmlFor="homeInternetAccess" className="text-sm font-medium text-gray-700 cursor-pointer">Acceso a Internet en Casa</Label>
                      </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* School Information Tab - Only for School Admins */}
              {formData.role === 'school_admin' && (
                <TabsContent value="school" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Asignación de Colegio</CardTitle>
                      <CardDescription>
                        Asigna el colegio al administrador
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div>
                      <Label htmlFor="schoolId" className="text-sm font-medium text-gray-700">Colegio Asignado *</Label>
                      <Select value={formData.schoolId || 'none'} onValueChange={(value) => handleInputChange('schoolId', value === 'none' ? '' : value)}>
                        <SelectTrigger className="mt-1.5">
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
                      <p className="text-xs text-muted-foreground mt-2">
                        La dirección y ciudad se obtienen automáticamente del colegio seleccionado.
                      </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
              <Button type="button" variant="outline" onClick={onCancel} className="min-w-[100px]">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="min-w-[120px]">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
} 