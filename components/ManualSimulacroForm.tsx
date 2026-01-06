"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Save, X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ManualSimulacroFormData, ManualSimulacroData } from '@/types/manual-simulacro'
import { useToast } from '@/hooks/use-toast'

interface ManualSimulacroFormProps {
  simulacro?: ManualSimulacroData
  onSubmit: (data: ManualSimulacroFormData) => void
  onCancel: () => void
  loading?: boolean
}

export function ManualSimulacroForm({ 
  simulacro, 
  onSubmit, 
  onCancel, 
  loading = false 
}: ManualSimulacroFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<ManualSimulacroFormData>({
    title: '',
    description: '',
    timeLimitMinutes: 120,
    passingScore: 70,
    openDate: '',
    closeDate: '',
    isPredefined: false,
    isPublished: false,
  })

  const [openDate, setOpenDate] = useState<Date>()
  const [closeDate, setCloseDate] = useState<Date>()
  const [openTime, setOpenTime] = useState('09:00')
  const [closeTime, setCloseTime] = useState('17:00')

  useEffect(() => {
    if (simulacro) {
      setFormData({
        title: simulacro.title,
        description: simulacro.description || '',
        timeLimitMinutes: simulacro.timeLimitMinutes || 120,
        passingScore: simulacro.passingScore,
        openDate: simulacro.openDate || '',
        closeDate: simulacro.closeDate || '',
        isPredefined: simulacro.isPredefined || false,
        isPublished: simulacro.isPublished || false,
      })

      if (simulacro.openDate) {
        const date = new Date(simulacro.openDate)
        setOpenDate(date)
        setOpenTime(format(date, 'HH:mm'))
      }
      if (simulacro.closeDate) {
        const date = new Date(simulacro.closeDate)
        setCloseDate(date)
        setCloseTime(format(date, 'HH:mm'))
      }
    }
  }, [simulacro])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "El título es requerido",
        variant: "destructive"
      })
      return
    }

    if (formData.timeLimitMinutes <= 0) {
      toast({
        title: "Error",
        description: "El tiempo límite debe ser mayor a 0",
        variant: "destructive"
      })
      return
    }

    // Combinar fecha y hora
    let openDateStr = ''
    let closeDateStr = ''

    if (openDate) {
      const [hours, minutes] = openTime.split(':')
      const dateTime = new Date(openDate)
      dateTime.setHours(parseInt(hours), parseInt(minutes))
      openDateStr = dateTime.toISOString()
    }

    if (closeDate) {
      const [hours, minutes] = closeTime.split(':')
      const dateTime = new Date(closeDate)
      dateTime.setHours(parseInt(hours), parseInt(minutes))
      closeDateStr = dateTime.toISOString()
    }

    onSubmit({
      ...formData,
      openDate: openDateStr || undefined,
      closeDate: closeDateStr || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="Ej: Simulacro ICFES - Matemáticas 2026"
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descripción del simulacro..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="timeLimitMinutes">Tiempo Límite (minutos) *</Label>
          <Input
            id="timeLimitMinutes"
            type="number"
            min="1"
            value={formData.timeLimitMinutes}
            onChange={(e) => setFormData({ ...formData, timeLimitMinutes: parseInt(e.target.value) || 0 })}
            required
          />
        </div>

        <div>
          <Label htmlFor="passingScore">Puntaje de Aprobación (%) *</Label>
          <Input
            id="passingScore"
            type="number"
            min="0"
            max="100"
            value={formData.passingScore}
            onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) || 0 })}
            required
          />
        </div>

        <div>
          <Label>Fecha de Apertura</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {openDate ? format(openDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={openDate}
                  onSelect={setOpenDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Input
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="w-32"
            />
          </div>
        </div>

        <div>
          <Label>Fecha de Cierre</Label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {closeDate ? format(closeDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={closeDate}
                  onSelect={setCloseDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Input
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="w-32"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isPredefined"
            checked={formData.isPredefined}
            onCheckedChange={(checked) => setFormData({ ...formData, isPredefined: checked })}
          />
          <Label htmlFor="isPredefined" className="cursor-pointer">
            Es un simulacro predefinido de EducaSaber
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isPublished"
            checked={formData.isPublished}
            onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
          />
          <Label htmlFor="isPublished" className="cursor-pointer">
            Publicar simulacro
          </Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  )
}

