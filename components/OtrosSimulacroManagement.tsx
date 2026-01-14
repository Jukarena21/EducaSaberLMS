"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, FileText, Users, Clock, CheckCircle, XCircle, Filter, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ManualSimulacroForm } from "@/components/ManualSimulacroForm"
import { OtrosSimulacroQuestionEditor } from "@/components/OtrosSimulacroQuestionEditor"
import { SimulacroAssignment } from "@/components/SimulacroAssignment"
import { ManualSimulacroData, ManualSimulacroFilters } from "@/types/manual-simulacro"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function OtrosSimulacroManagement() {
  const { toast } = useToast()

  const [simulacros, setSimulacros] = useState<ManualSimulacroData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<ManualSimulacroFilters>({})
  const [showForm, setShowForm] = useState(false)
  const [editingSimulacro, setEditingSimulacro] = useState<ManualSimulacroData | null>(null)
  const [selectedSimulacro, setSelectedSimulacro] = useState<ManualSimulacroData | null>(null)
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false)
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false)
  const [isPredefinedFilter, setIsPredefinedFilter] = useState<string>("all")
  const [isPublishedFilter, setIsPublishedFilter] = useState<string>("all")

  useEffect(() => {
    fetchSimulacros()
  }, [filters])

  const fetchSimulacros = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.isPredefined !== undefined) params.append('isPredefined', filters.isPredefined.toString())
      if (filters.isPublished !== undefined) params.append('isPublished', filters.isPublished.toString())

      const response = await fetch(`/api/otros-simulacros?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setSimulacros(data)
      } else {
        toast({ title: "Error", description: "No se pudieron cargar los simulacros", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error fetching otros simulacros:", error)
      toast({ title: "Error", description: "Error al cargar los simulacros", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm || undefined })
  }

  const handleFilterChange = () => {
    setFilters({
      ...filters,
      isPredefined: isPredefinedFilter === "all" ? undefined : isPredefinedFilter === "true",
      isPublished: isPublishedFilter === "all" ? undefined : isPublishedFilter === "true"
    })
  }

  const handleCreateSimulacro = async (data: any) => {
    try {
      const response = await fetch('/api/otros-simulacros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        const created = await response.json()
        toast({ title: "Éxito", description: "Simulacro creado correctamente" })
        setShowForm(false)
        setSelectedSimulacro(created)
        setShowQuestionsDialog(true)
        fetchSimulacros()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error || "Error al crear el simulacro", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Error al crear el simulacro", variant: "destructive" })
    }
  }

  const handleUpdateSimulacro = async (id: string, data: any) => {
    try {
      const response = await fetch(`/api/otros-simulacros/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        toast({ title: "Éxito", description: "Simulacro actualizado correctamente" })
        setShowForm(false)
        setEditingSimulacro(null)
        fetchSimulacros()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error || "Error al actualizar el simulacro", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Error al actualizar el simulacro", variant: "destructive" })
    }
  }

  const handleDeleteSimulacro = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este simulacro?")) return
    try {
      const response = await fetch(`/api/otros-simulacros/${id}`, { method: 'DELETE' })
      if (response.ok) {
        toast({ title: "Éxito", description: "Simulacro eliminado correctamente" })
        fetchSimulacros()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error || "Error al eliminar el simulacro", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Error al eliminar el simulacro", variant: "destructive" })
    }
  }

  const handleTogglePublish = async (simulacro: ManualSimulacroData) => {
    const newStatus = !simulacro.isPublished
    try {
      const response = await fetch(`/api/otros-simulacros/${simulacro.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: newStatus })
      })

      if (response.ok) {
        toast({ title: "Éxito", description: newStatus ? "Simulacro publicado" : "Simulacro despublicado" })
        fetchSimulacros()
      } else {
        const error = await response.json().catch(() => ({}))
        toast({ title: "Error", description: (error as any).error || "No se pudo actualizar el estado", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "Error al actualizar el estado", variant: "destructive" })
    }
  }

  const handleEdit = (simulacro: ManualSimulacroData) => {
    setEditingSimulacro(simulacro)
    setShowForm(true)
  }

  const handleManageQuestions = (simulacro: ManualSimulacroData) => {
    setSelectedSimulacro(simulacro)
    setShowQuestionsDialog(true)
  }

  const handleManageAssignments = (simulacro: ManualSimulacroData) => {
    setSelectedSimulacro(simulacro)
    setShowAssignmentDialog(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Otros simulacros</CardTitle>
              <CardDescription>
                Simulacros manuales que NO son tipo Saber/ICFES. El Área de las preguntas es texto libre.
              </CardDescription>
            </div>
            <Button onClick={() => { setEditingSimulacro(null); setShowForm(true) }}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Simulacro
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="search-otros">Buscar</Label>
                <div className="flex gap-2">
                  <Input
                    id="search-otros"
                    placeholder="Buscar por título..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isPredefined-otros">Tipo</Label>
                <Select value={isPredefinedFilter} onValueChange={setIsPredefinedFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Predefinidos</SelectItem>
                    <SelectItem value="false">Personalizados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isPublished-otros">Estado</Label>
                <Select value={isPublishedFilter} onValueChange={setIsPublishedFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Publicados</SelectItem>
                    <SelectItem value="false">Borradores</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleFilterChange} variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Aplicar
                </Button>
              </div>
              <div className="flex items-end">
                <Button onClick={fetchSimulacros} variant="outline">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : simulacros.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay simulacros creados</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Preguntas</TableHead>
                  <TableHead>Tiempo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulacros.map((simulacro) => (
                  <TableRow key={simulacro.id}>
                    <TableCell className="font-medium">{simulacro.title}</TableCell>
                    <TableCell>{simulacro.totalQuestions || 0}</TableCell>
                    <TableCell>
                      {simulacro.timeLimitMinutes ? (
                        <div className="flex items-center gap-1"><Clock className="h-4 w-4" />{simulacro.timeLimitMinutes} min</div>
                      ) : "Sin límite"}
                    </TableCell>
                    <TableCell>
                      {simulacro.isPublished ? (
                        <Badge variant="default" className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" />Publicado</Badge>
                      ) : (
                        <Badge variant="secondary"><XCircle className="mr-1 h-3 w-3" />Borrador</Badge>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(simulacro.createdAt), "dd/MM/yyyy", { locale: es })}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleTogglePublish(simulacro)}>
                          {simulacro.isPublished ? "Despublicar" : "Publicar"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleManageQuestions(simulacro)} title="Gestionar preguntas">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleManageAssignments(simulacro)} title="Asignar a colegios/estudiantes">
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(simulacro)} title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteSimulacro(simulacro.id)} title="Eliminar">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSimulacro ? "Editar Simulacro" : "Nuevo Simulacro"}</DialogTitle>
            <DialogDescription>
              Crea un simulacro manual (no tipo Saber). Luego agregarás preguntas y asignaciones.
            </DialogDescription>
          </DialogHeader>
          <ManualSimulacroForm
            simulacro={editingSimulacro || undefined}
            onSubmit={editingSimulacro ? (data) => handleUpdateSimulacro(editingSimulacro.id, data) : handleCreateSimulacro}
            onCancel={() => { setShowForm(false); setEditingSimulacro(null) }}
          />
        </DialogContent>
      </Dialog>

      {selectedSimulacro && (
        <Dialog open={showQuestionsDialog} onOpenChange={setShowQuestionsDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gestionar Preguntas</DialogTitle>
              <DialogDescription>
                Agrega, edita o elimina preguntas del simulacro "{selectedSimulacro.title}"
              </DialogDescription>
            </DialogHeader>
            <OtrosSimulacroQuestionEditor
              simulacroId={selectedSimulacro.id}
              onClose={() => {
                setShowQuestionsDialog(false)
                setSelectedSimulacro(null)
                fetchSimulacros()
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {selectedSimulacro && (
        <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Asignar Simulacro</DialogTitle>
              <DialogDescription>
                Asigna el simulacro "{selectedSimulacro.title}" a colegios o estudiantes
              </DialogDescription>
            </DialogHeader>
            <SimulacroAssignment
              simulacroId={selectedSimulacro.id}
              onClose={() => {
                setShowAssignmentDialog(false)
                setSelectedSimulacro(null)
                fetchSimulacros()
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

