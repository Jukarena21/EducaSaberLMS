'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ICFES_AREA_SLUGS, resolveAreaDisplayName } from '@/lib/icfesAreas'

type Band = {
  id?: string
  areaSlug: string
  label: string
  minScore: number
  maxScore: number
  description: string
  sortOrder: number
}

type Profile = {
  id: string
  name: string
  description?: string | null
  isDefault: boolean
  academicGrade?: string | null
  areaSlug?: string | null
  bands: Band[]
  _count?: { exams: number }
}

const AREA_LABELS: Record<string, string> = Object.fromEntries(
  ICFES_AREA_SLUGS.map((slug) => [slug, resolveAreaDisplayName({ name: slug })])
)

export function PerformanceLevelManagement() {
  const { toast } = useToast()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('Tabla ICFES personalizada')
  const [newDescription, setNewDescription] = useState('')
  const [newIsDefault, setNewIsDefault] = useState(false)
  const [newGrade, setNewGrade] = useState<string>('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/performance-levels')
      if (!res.ok) throw new Error('Error al cargar perfiles')
      const data = await res.json()
      setProfiles(data.profiles || [])
    } catch (e) {
      toast({ title: 'Error', description: 'No se pudieron cargar las tablas de niveles', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/admin/performance-levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          description: newDescription || null,
          isDefault: newIsDefault,
          academicGrade: newGrade || null,
          cloneFromDefault: true,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear')
      }
      toast({ title: 'Perfil creado', description: 'Tabla de niveles creada desde la plantilla ICFES por defecto.' })
      setNewName('Tabla ICFES personalizada')
      setNewDescription('')
      await load()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este perfil de niveles?')) return
    try {
      const res = await fetch(`/api/admin/performance-levels/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al eliminar')
      }
      toast({ title: 'Eliminado' })
      await load()
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tablas de niveles de desempeño (ICFES)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Define rangos de puntaje (Insuficiente, Satisfactorio, B1, etc.) y sus comentarios por área.
            Hay una plantilla por defecto en código; crea perfiles aquí para personalizar por año escolar o por examen.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre del perfil</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div>
              <Label>Año escolar (opcional)</Label>
              <Select value={newGrade || 'all'} onValueChange={(v) => setNewGrade(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los grados</SelectItem>
                  {['sexto', 'septimo', 'octavo', 'noveno', 'decimo', 'once'].map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Descripción</Label>
              <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={newIsDefault} onCheckedChange={setNewIsDefault} id="isDefault" />
              <Label htmlFor="isDefault">Marcar como perfil por defecto (para este grado)</Label>
            </div>
          </div>
          <Button onClick={handleCreate} disabled={creating}>
            <Plus className="h-4 w-4 mr-2" />
            {creating ? 'Creando...' : 'Crear desde plantilla ICFES'}
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Perfiles existentes</h3>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Actualizar
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : profiles.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            No hay perfiles en base de datos. El sistema usa la plantilla ICFES incorporada en el código.
            Crea un perfil para personalizar rangos y comentarios.
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {profiles.map((profile) => (
            <AccordionItem key={profile.id} value={profile.id} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-wrap items-center gap-2 text-left">
                  <span className="font-medium">{profile.name}</span>
                  {profile.isDefault && <Badge>Por defecto</Badge>}
                  {profile.academicGrade && <Badge variant="outline">{profile.academicGrade}</Badge>}
                  <Badge variant="secondary">{profile.bands.length} bandas</Badge>
                  {profile._count?.exams ? (
                    <Badge variant="outline">{profile._count.exams} examen(es)</Badge>
                  ) : null}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 pb-4">
                {profile.description && (
                  <p className="text-sm text-muted-foreground">{profile.description}</p>
                )}
                {ICFES_AREA_SLUGS.map((slug) => {
                  const areaBands = profile.bands.filter((b) => b.areaSlug === slug)
                  if (areaBands.length === 0) return null
                  return (
                    <div key={slug} className="border rounded p-3">
                      <p className="font-medium text-sm mb-2">{AREA_LABELS[slug] || slug}</p>
                      <div className="space-y-2">
                        {areaBands.map((b) => (
                          <div key={`${b.label}-${b.minScore}`} className="text-xs border-l-2 border-blue-300 pl-2">
                            <span className="font-semibold">{b.label}</span>
                            {' '}({b.minScore}–{b.maxScore}%)
                            <p className="text-muted-foreground mt-0.5 line-clamp-2">{b.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(profile.id)}
                  disabled={profile.isDefault && (profile._count?.exams ?? 0) > 0}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar perfil
                </Button>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}
