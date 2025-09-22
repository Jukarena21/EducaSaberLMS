"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useSession } from 'next-auth/react'
import { X, Save, Building2, Info } from 'lucide-react'
import { SchoolFormData, SchoolFormProps } from '@/types/school'

export default function SchoolForm({ school, onSubmit, onCancel, loading = false }: SchoolFormProps) {
  const { data: session } = useSession()
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
  })

  const isEditing = !!school

  useEffect(() => {
    if (school) {
      setFormData(school)
    }
  }, [school])

  const handleInputChange = (field: keyof SchoolFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('School form submitted with data:', formData)
    
    // Validation
    if (!formData.name || !formData.city || !formData.contactEmail || !formData.contactPhone) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    if (formData.totalStudents < 0 || formData.numberOfCampuses < 1 || formData.yearsOfOperation < 1) {
      alert('Por favor verifica los valores numéricos')
      return
    }

    try {
      await onSubmit(formData)
      console.log('School form submission successful')
    } catch (error) {
      console.error('School form submission error:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isEditing ? 'Editar Colegio' : 'Crear Nuevo Colegio'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre del Colegio *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">Ciudad *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="neighborhood">Barrio *</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Calle 123 # 45-67"
                />
              </div>
              <div>
                <Label htmlFor="institutionType">Tipo de Institución *</Label>
                <Select value={formData.institutionType} onValueChange={(value) => handleInputChange('institutionType', value)}>
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
              <div>
                <Label htmlFor="academicCalendar">Calendario Académico *</Label>
                <Select value={formData.academicCalendar} onValueChange={(value) => handleInputChange('academicCalendar', value)}>
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
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="totalStudents">Total de Estudiantes *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Número total de estudiantes matriculados en la institución</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="totalStudents"
                  type="number"
                  min="0"
                  value={formData.totalStudents}
                  onChange={(e) => handleInputChange('totalStudents', parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="numberOfCampuses">Número de Sedes *</Label>
                <Input
                  id="numberOfCampuses"
                  type="number"
                  min="1"
                  value={formData.numberOfCampuses}
                  onChange={(e) => handleInputChange('numberOfCampuses', parseInt(e.target.value) || 1)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="yearsOfOperation">Años de Operación *</Label>
                <Input
                  id="yearsOfOperation"
                  type="number"
                  min="1"
                  value={formData.yearsOfOperation}
                  onChange={(e) => handleInputChange('yearsOfOperation', parseInt(e.target.value) || 1)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="contactEmail">Email de Contacto *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Teléfono de Contacto *</Label>
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