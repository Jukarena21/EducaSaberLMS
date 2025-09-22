"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, Eye, Edit, Trash2, Play, Calendar, Clock, Users, Target, Megaphone } from 'lucide-react'
import { useExams } from '@/hooks/useExams'
import { useCompetencies } from '@/hooks/useCompetencies'
import { useCourses } from '@/hooks/useCourses'
import { ExamData, ExamFilters } from '@/types/exam'
import { ExamForm } from '@/components/ExamForm'
import { ExamPreview } from '@/components/ExamPreview'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ExamManagementProps {
  competencies: any[]
}

export function ExamManagement({ competencies }: ExamManagementProps) {
  const [filters, setFilters] = useState<ExamFilters>({})
  const [showForm, setShowForm] = useState(false)
  const [editingExam, setEditingExam] = useState<ExamData | null>(null)
  const [viewingExam, setViewingExam] = useState<ExamData | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const { exams, loading, error, createExam, updateExam, deleteExam, generateExamQuestions } = useExams(filters)
  const { courses } = useCourses()

  const handleCreateExam = async (examData: any) => {
    const result = await createExam(examData)
    if (result) {
      setShowForm(false)
    }
  }

  const handleUpdateExam = async (examData: any) => {
    if (editingExam) {
      const result = await updateExam(editingExam.id, examData)
      if (result) {
        setEditingExam(null)
      }
    }
  }

  const handleDeleteExam = async (examId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este examen?')) {
      await deleteExam(examId)
    }
  }

  const handleGenerateQuestions = async (examId: string) => {
    if (confirm('¿Generar preguntas para este examen? Esto reemplazará las preguntas existentes.')) {
      await generateExamQuestions(examId)
    }
  }

  const handleNotifyStudents = async (exam: ExamData) => {
    if (!exam.isPublished) {
      alert('El examen debe estar publicado para notificar a los estudiantes.')
      return
    }
    const now = new Date()
    const openDate = exam.openDate ? new Date(exam.openDate) : null
    if (openDate && now < openDate) {
      const proceed = confirm('El examen aún no está abierto. ¿Deseas programar la notificación igualmente?')
      if (!proceed) return
    }

    try {
      const targetUsers = exam.courseId
        ? 'specific_school' // usaremos fallback por curso con endpoint general
        : exam.academicGrade
          ? 'specific_grade'
          : 'all_students'

      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'exam_available',
          title: 'Nuevo Examen Disponible',
          message: `El examen "${exam.title}" está disponible para presentar.`,
          targetUsers,
          targetValue: exam.academicGrade || undefined,
          actionUrl: `/estudiante/examen/${exam.id}`,
        })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'No se pudo enviar la notificación')
      }

      alert('Notificaciones enviadas a los estudiantes objetivo.')
    } catch (e: any) {
      console.error(e)
      alert(e.message || 'Error enviando notificaciones')
    }
  }

  const handleFilterChange = (field: keyof ExamFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value === 'all' ? undefined : value
    }))
    setCurrentPage(1)
  }

  const getExamTypeLabel = (type: string) => {
    const types = {
      'simulacro_completo': 'Simulacro Completo',
      'por_competencia': 'Por Competencia',
      'por_modulo': 'Por Módulo',
      'personalizado': 'Personalizado',
      'diagnostico': 'Diagnóstico'
    }
    return types[type as keyof typeof types] || type
  }

  const getDifficultyColor = (level: string) => {
    const colors = {
      'facil': 'bg-green-100 text-green-800',
      'intermedio': 'bg-yellow-100 text-yellow-800',
      'dificil': 'bg-red-100 text-red-800',
      'variable': 'bg-purple-100 text-purple-800'
    }
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getDifficultyLabel = (level: string) => {
    const labels = {
      'facil': 'Fácil',
      'intermedio': 'Intermedio',
      'dificil': 'Difícil',
      'variable': 'Variable'
    }
    return labels[level as keyof typeof labels] || level
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No definida'
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es })
  }

  const getStatusBadge = (exam: ExamData) => {
    const now = new Date()
    const openDate = exam.openDate ? new Date(exam.openDate) : null
    const closeDate = exam.closeDate ? new Date(exam.closeDate) : null

    if (!exam.isPublished) {
      return <Badge variant="secondary">Borrador</Badge>
    }

    if (openDate && now < openDate) {
      return <Badge variant="outline">Programado</Badge>
    }

    if (closeDate && now > closeDate) {
      return <Badge variant="destructive">Cerrado</Badge>
    }

    if (openDate && now >= openDate) {
      return <Badge variant="default">Abierto</Badge>
    }

    return <Badge variant="default">Activo</Badge>
  }

  // Paginación
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedExams = exams.slice(startIndex, endIndex)
  const totalPages = Math.ceil(exams.length / itemsPerPage)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando exámenes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Exámenes</h2>
          <p className="text-gray-600">Crea y administra exámenes para tus estudiantes</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Examen
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por título..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="examType">Tipo de Examen</Label>
              <Select
                value={filters.examType || 'all'}
                onValueChange={(value) => handleFilterChange('examType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="simulacro_completo">Simulacro Completo</SelectItem>
                  <SelectItem value="por_competencia">Por Competencia</SelectItem>
                  <SelectItem value="por_modulo">Por Módulo</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                  <SelectItem value="diagnostico">Diagnóstico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="competencyId">Competencia</Label>
              <Select
                value={filters.competencyId || 'all'}
                onValueChange={(value) => handleFilterChange('competencyId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las competencias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las competencias</SelectItem>
                  {competencies.map((competency) => (
                    <SelectItem key={competency.id} value={competency.id}>
                      {competency.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isPublished">Estado</Label>
              <Select
                value={filters.isPublished?.toString() || 'all'}
                onValueChange={(value) => handleFilterChange('isPublished', value === 'true' ? 'true' : value === 'false' ? 'false' : 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="true">Publicados</SelectItem>
                  <SelectItem value="false">Borradores</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de exámenes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Exámenes ({exams.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedExams.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No se encontraron exámenes</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Competencia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fechas</TableHead>
                    <TableHead>Preguntas</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedExams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{exam.title}</p>
                          {exam.description && (
                            <p className="text-sm text-gray-600 truncate max-w-xs">
                              {exam.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getExamTypeLabel(exam.examType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {exam.competency?.displayName || exam.course?.competency.displayName || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(exam)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Abre: {formatDate(exam.openDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Cierra: {formatDate(exam.closeDate)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            <span>{exam.totalQuestions || 0} preguntas</span>
                          </div>
                          {exam.timeLimitMinutes && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{exam.timeLimitMinutes} min</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewingExam(exam)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Vista Previa del Examen</DialogTitle>
                              </DialogHeader>
                              {viewingExam && (
                                <ExamPreview exam={viewingExam} mode="admin" />
                              )}
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingExam(exam)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {exam.totalQuestions === 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleGenerateQuestions(exam.id)}
                              title="Generar preguntas"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNotifyStudents(exam)}
                            title="Notificar a estudiantes"
                          >
                            <Megaphone className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExam(exam.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulario de creación/edición */}
      {(showForm || editingExam) && (
        <Dialog open={showForm || !!editingExam} onOpenChange={() => {
          setShowForm(false)
          setEditingExam(null)
        }}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExam ? 'Editar Examen' : 'Crear Nuevo Examen'}
              </DialogTitle>
              <DialogDescription>
                {editingExam 
                  ? 'Modifica la configuración del examen existente'
                  : 'Configura un nuevo examen con preguntas, fechas y criterios de evaluación'
                }
              </DialogDescription>
            </DialogHeader>
            <ExamForm
              exam={editingExam || undefined}
              onSubmit={editingExam ? handleUpdateExam : handleCreateExam}
              onCancel={() => {
                setShowForm(false)
                setEditingExam(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
