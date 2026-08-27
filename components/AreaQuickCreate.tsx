"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X, Check, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export interface AreaQuickCreateProps {
  /**
   * Se invoca con el área recién creada. El contenedor decide si la selecciona,
   * recarga su listado o ambas cosas.
   */
  onCreated: (area: { id: string; name: string; displayName: string }) => void
  /** Oculta el control por completo (por ejemplo, en contextos Saber). */
  disabled?: boolean
  label?: string
}

/**
 * Crea áreas de uso general sin salir del formulario actual.
 *
 * Las áreas de Saber son fijas y no se crean desde aquí: la API rechaza
 * cualquier nombre que pertenezca a esa taxonomía.
 */
export function AreaQuickCreate({
  onCreated,
  disabled = false,
  label = 'Crear área nueva',
}: AreaQuickCreateProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  if (disabled) return null

  const reset = () => {
    setOpen(false)
    setName('')
  }

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast({
        title: 'Error',
        description: 'El nombre del área es requerido',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/competencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed.toLowerCase().replace(/\s+/g, '_'),
          displayName: trimmed,
          description: `Área: ${trimmed}`,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el área')
      }

      onCreated(data)
      reset()
      toast({
        title: 'Área creada',
        description: `El área "${data.displayName}" se creó correctamente.`,
      })
    } catch (error) {
      toast({
        title: 'No se pudo crear el área',
        description: error instanceof Error ? error.message : 'Error al crear el área',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="mt-2"
      >
        <Plus className="h-4 w-4 mr-1" />
        {label}
      </Button>
    )
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ej: Cultura Laboral"
        disabled={saving}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleCreate()
          }
          if (e.key === 'Escape') reset()
        }}
      />
      <Button type="button" size="sm" onClick={handleCreate} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={saving}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
