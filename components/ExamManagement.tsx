"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  RotateCcw, 
  Search, 
  Clock, 
  User, 
  BookOpen, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  Users,
  CheckSquare,
  Square,
  BarChart3,
  Download,
  FileText
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { ExamForm } from "@/components/ExamForm"
import { ExamPreview } from "@/components/ExamPreview"
import { useExams } from "@/hooks/useExams"
import { useSchools } from "@/hooks/useSchools"
import { getAcademicGradeDisplayName } from "@/lib/academicGrades"
import { ExamData, ExamFormData } from "@/types/exam"
import type { ManualSimulacroReport } from "@/types/manual-simulacro"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ExamManagementProps {
  schoolId?: string
  showResultsOnly?: boolean // Si es true, solo muestra resultados. Si es false, muestra gestión de exámenes
  userRole?: string // Rol del usuario para determinar permisos
}

export function ExamManagement({ schoolId, showResultsOnly = false, userRole = 'teacher_admin' }: ExamManagementProps) {
  const { toast } = useToast()
  
  // Estados para resultados de exámenes agrupados
  const [groupedExams, setGroupedExams] = useState<Array<{
    exam: any
    students: Array<{
      resultId: string
      user: any
      score: number
      isPassed: boolean
      completedAt: string
      correctAnswers: number
      incorrectAnswers: number
      timeTakenMinutes: number
    }>
    totalStudents: number
  }>>([])
  const [selectedExam, setSelectedExam] = useState<{
    exam: any
    students: Array<{
      resultId: string
      user: any
      score: number
      isPassed: boolean
      completedAt: string
      correctAnswers: number
      incorrectAnswers: number
      timeTakenMinutes: number
    }>
    totalStudents: number
  } | null>(null)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showReactivateDialog, setShowReactivateDialog] = useState(false)
  const [reactivateReason, setReactivateReason] = useState("")
  const [reactivating, setReactivating] = useState(false)
  const [reactivateMode, setReactivateMode] = useState<'single' | 'multiple' | 'all'>('single')
  // Estado para reportes de simulacros manuales
  const [manualReport, setManualReport] = useState<ManualSimulacroReport | null>(null)
  const [manualReportLoading, setManualReportLoading] = useState(false)
  const [manualReportSchoolId, setManualReportSchoolId] = useState<string>("all")

  // Estados para gestión de exámenes
  const [showExamForm, setShowExamForm] = useState(false)
  const [editingExam, setEditingExam] = useState<ExamData | null>(null)
  const [previewExam, setPreviewExam] = useState<ExamData | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({})
  
  // Filtros para gestión de exámenes
  const [pendingFilters, setPendingFilters] = useState({
    search: '',
    examType: 'all',
    competencyId: 'all',
    courseId: 'all',
    difficultyLevel: 'all',
    isPublished: 'all'
  })
  const [appliedFilters, setAppliedFilters] = useState<{
    search?: string
    examType?: string
    competencyId?: string
    courseId?: string
    difficultyLevel?: string
    isPublished?: boolean
  }>({})
  
  const { exams, loading: examsLoading, error: examsError, createExam, updateExam, deleteExam, fetchExams, generateExamQuestions } = useExams(appliedFilters)
  
  // Permisos basados en rol
  const canCreate = userRole === 'teacher_admin'
  const canEdit = userRole === 'teacher_admin' || userRole === 'school_admin'
  const canDelete = userRole === 'teacher_admin'
  const canPreview = true // Todos pueden ver/preview exámenes
  
  // Filtros adicionales para resultados
  const [filterCourse, setFilterCourse] = useState("")
  const [filterCompetency, setFilterCompetency] = useState("")
  const [filterExamType, setFilterExamType] = useState("all")
  const [courses, setCourses] = useState<Array<{id: string, title: string}>>([])
  const [competencies, setCompetencies] = useState<Array<{id: string, name: string}>>([])
  const [loadingFilters, setLoadingFilters] = useState(true)

  // Cache for courses and competencies
  const filtersCache = useRef<{ courses: Array<{id: string, title: string}>, competencies: Array<{id: string, name: string}>, timestamp: number } | null>(null)
  const FILTERS_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  useEffect(() => {
    if (showResultsOnly) {
      fetchGroupedExams()
    }
  }, [schoolId, showResultsOnly])

  useEffect(() => {
    fetchCoursesAndCompetencies()
  }, [schoolId])

  const fetchCoursesAndCompetencies = async () => {
    // Check cache first
    if (filtersCache.current && Date.now() - filtersCache.current.timestamp < FILTERS_CACHE_TTL) {
      setCourses(filtersCache.current.courses)
      setCompetencies(filtersCache.current.competencies)
      setLoadingFilters(false)
      return
    }

    setLoadingFilters(true)
    try {
      // Cargar cursos
      const coursesResponse = await fetch('/api/courses')
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        const mappedCourses = coursesData.map((course: any) => ({
          id: course.id,
          title: course.title
        }))
        setCourses(mappedCourses)

        // Cargar competencias
        const competenciesResponse = await fetch('/api/competencies')
        if (competenciesResponse.ok) {
          const competenciesData = await competenciesResponse.json()
          const mappedCompetencies = competenciesData.map((comp: any) => ({
            id: comp.id,
            name: comp.displayName || comp.name
          }))
          setCompetencies(mappedCompetencies)
          
          // Update cache
          filtersCache.current = {
            courses: mappedCourses,
            competencies: mappedCompetencies,
            timestamp: Date.now()
          }
        } else {
          console.error('Error loading competencies:', await competenciesResponse.text())
        }
      } else {
        console.error('Error loading courses:', await coursesResponse.text())
      }
    } catch (error) {
      console.error('Error fetching courses and competencies:', error)
    } finally {
      setLoadingFilters(false)
    }
  }

  const handleSearch = () => {
    fetchGroupedExams()
  }

  const fetchGroupedExams = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (searchTerm) {
        params.set('search', searchTerm)
      }
      if (schoolId && schoolId !== 'all') {
        params.set('schoolId', schoolId)
      }
      if (filterCourse) {
        params.set('courseId', filterCourse)
      }
      if (filterCompetency) {
        params.set('competencyId', filterCompetency)
      }
      if (filterExamType && filterExamType !== 'all') {
        params.set('isIcfesExam', filterExamType === 'icfes' ? 'true' : 'false')
      }

      const response = await fetch(`/api/admin/exams/grouped?${params}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Error al cargar los exámenes'
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorData.details || errorMessage
        } catch (e) {
          console.error('Could not parse error response as JSON')
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setGroupedExams(data.exams || [])
    } catch (error) {
      console.error('Error fetching grouped exams:', error)
      setGroupedExams([])
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error desconocido',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReactivate = async () => {
    if (!selectedExam) return

    setReactivating(true)
    try {
      let body: any = { reason: reactivateReason }

      if (reactivateMode === 'all') {
        // Reactivar todos los estudiantes del examen
        body.examId = selectedExam.exam.id
      } else if (reactivateMode === 'multiple' && selectedStudentIds.length > 0) {
        // Reactivar estudiantes seleccionados
        body.resultIds = selectedStudentIds
      } else if (reactivateMode === 'single' && selectedStudentIds.length === 1) {
        // Reactivar un solo estudiante
        body.resultId = selectedStudentIds[0]
      } else {
        toast({
          title: 'Error',
          description: 'Debes seleccionar al menos un estudiante',
          variant: 'destructive'
        })
        setReactivating(false)
        return
      }

      const response = await fetch('/api/admin/exams/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Éxito',
          description: data.message || 'Examen(es) reactivado(s) exitosamente'
        })
        setShowReactivateDialog(false)
        setSelectedStudentIds([])
        setReactivateReason("")
        
        // Actualizar la lista de exámenes agrupados
        await fetchGroupedExams()
        
        // Si hay un examen seleccionado, actualizar su lista de estudiantes
        if (selectedExam) {
          const updatedExams = await fetch(`/api/admin/exams/grouped?${new URLSearchParams({
            ...(schoolId && schoolId !== 'all' ? { schoolId } : {}),
            ...(filterCourse ? { courseId: filterCourse } : {}),
            ...(filterCompetency ? { competencyId: filterCompetency } : {}),
            ...(searchTerm ? { search: searchTerm } : {})
          })}`).then(r => r.json())
          
          const updatedExam = updatedExams.exams?.find((e: any) => e.exam.id === selectedExam.exam.id)
          if (updatedExam) {
            setSelectedExam(updatedExam)
          } else {
            // Si el examen ya no tiene estudiantes, volver a la lista
            setSelectedExam(null)
          }
        }
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Error al reactivar el examen',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error reactivating exam:', error)
      toast({
        title: 'Error',
        description: 'Error al reactivar el examen',
        variant: 'destructive'
      })
    } finally {
      setReactivating(false)
    }
  }

  const handleSelectStudent = (resultId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(resultId) 
        ? prev.filter(id => id !== resultId)
        : [...prev, resultId]
    )
  }

  const handleSelectAllStudents = () => {
    if (!selectedExam) return
    if (selectedStudentIds.length === selectedExam.students.length) {
      setSelectedStudentIds([])
    } else {
      setSelectedStudentIds(selectedExam.students.map(s => s.resultId))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Solo mostrar loading si estamos en modo de resultados Y está cargando
  if (showResultsOnly && loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Cargando resultados de exámenes...</p>
        </div>
      </div>
    )
  }

  // Handlers para filtros de gestión de exámenes
  const handlePendingFilterChange = (field: string, value: string) => {
    setPendingFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleApplyExamFilters = () => {
    const filters: typeof appliedFilters = {}
    
    if (pendingFilters.search) filters.search = pendingFilters.search
    if (pendingFilters.examType && pendingFilters.examType !== 'all') filters.examType = pendingFilters.examType
    if (pendingFilters.competencyId && pendingFilters.competencyId !== 'all') filters.competencyId = pendingFilters.competencyId
    if (pendingFilters.courseId && pendingFilters.courseId !== 'all') filters.courseId = pendingFilters.courseId
    if (pendingFilters.difficultyLevel && pendingFilters.difficultyLevel !== 'all') filters.difficultyLevel = pendingFilters.difficultyLevel
    if (pendingFilters.isPublished && pendingFilters.isPublished !== 'all') {
      filters.isPublished = pendingFilters.isPublished === 'true'
    }
    
    setAppliedFilters(filters)
    fetchExams()
  }

  const handleClearExamFilters = () => {
    setPendingFilters({
      search: '',
      examType: 'all',
      competencyId: 'all',
      courseId: 'all',
      difficultyLevel: 'all',
      isPublished: 'all'
    })
    setAppliedFilters({})
    fetchExams()
  }

  // Handlers para gestión de exámenes
  const handleCreateExam = async (examData: ExamFormData) => {
    const result = await createExam(examData)
    if (result) {
      // Si el examen tiene módulos incluidos, generar las preguntas automáticamente
      if (result.includedModules && result.includedModules.length > 0) {
        try {
          const generated = await generateExamQuestions(result.id)
          if (generated) {
            toast({
              title: 'Examen creado',
              description: 'El examen se ha creado y las preguntas se han generado exitosamente.',
            })
          } else {
            toast({
              title: 'Examen creado',
              description: 'El examen se ha creado, pero hubo un problema al generar las preguntas. Puedes generarlas manualmente.',
              variant: 'default',
            })
          }
        } catch (error) {
          console.error('Error generando preguntas:', error)
          toast({
            title: 'Examen creado',
            description: 'El examen se ha creado, pero hubo un problema al generar las preguntas. Puedes generarlas manualmente.',
            variant: 'default',
          })
        }
      } else {
        toast({
          title: 'Examen creado',
          description: 'El examen se ha creado exitosamente. Recuerda seleccionar módulos y generar las preguntas.',
        })
      }
      setShowExamForm(false)
      fetchExams()
    } else {
      toast({
        title: 'Error',
        description: 'No se pudo crear el examen.',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateExam = async (examData: ExamFormData) => {
    if (!editingExam) return
    const result = await updateExam(editingExam.id, examData)
    if (result) {
      toast({
        title: 'Examen actualizado',
        description: 'El examen se ha actualizado exitosamente.',
      })
      setEditingExam(null)
      setShowExamForm(false)
      fetchExams()
    } else {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el examen.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteExam = async (examId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este examen?')) {
      const success = await deleteExam(examId)
      if (success) {
        toast({
          title: 'Examen eliminado',
          description: 'El examen se ha eliminado exitosamente.',
        })
        fetchExams()
      } else {
        toast({
          title: 'Error',
          description: 'No se pudo eliminar el examen.',
          variant: 'destructive',
        })
      }
    }
  }

  const handlePreviewExam = async (exam: ExamData) => {
    try {
      // Obtener el examen completo con sus preguntas
      const response = await fetch(`/api/exams/${exam.id}`)
      if (!response.ok) {
        throw new Error('Error al cargar el examen')
      }
      const examData = await response.json()
      setPreviewExam(examData)
      setPreviewAnswers({}) // Resetear respuestas al abrir un nuevo examen
      setShowPreviewDialog(true)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo cargar el examen',
        variant: 'destructive',
      })
    }
  }

  const handlePreviewAnswerChange = (questionId: string, answer: any) => {
    // Manejar diferentes tipos de respuestas
    let formattedAnswer: any = answer
    
    // Si es un objeto (matching), mantenerlo como objeto
    // Si es un string (opción múltiple, fill_blank), mantenerlo como string
    setPreviewAnswers(prev => ({
      ...prev,
      [questionId]: formattedAnswer
    }))
  }

  // Si showResultsOnly es false, mostrar gestión de exámenes
  if (!showResultsOnly) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Exámenes</h2>
            <p className="text-gray-600">Crea y administra los exámenes del sistema</p>
          </div>
          <Button onClick={() => {
            setEditingExam(null)
            setShowExamForm(true)
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Examen
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Búsqueda */}
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Buscar exámenes..."
                    value={pendingFilters.search}
                    onChange={(e) => handlePendingFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Tipo de examen */}
              <div className="space-y-2">
                <Label htmlFor="examType">Tipo de Examen</Label>
                <Select
                  value={pendingFilters.examType}
                  onValueChange={(value) => handlePendingFilterChange('examType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="simulacro_completo">Simulacro Completo</SelectItem>
                    <SelectItem value="diagnostico">Diagnóstico</SelectItem>
                    <SelectItem value="por_competencia">Por Competencia</SelectItem>
                    <SelectItem value="por_modulo">Por Módulo</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Competencia */}
              <div className="space-y-2">
                <Label htmlFor="competency">Competencia</Label>
                <Select
                  value={pendingFilters.competencyId}
                  onValueChange={(value) => handlePendingFilterChange('competencyId', value)}
                  disabled={loadingFilters}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingFilters ? 'Cargando...' : 'Todas las competencias'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las competencias</SelectItem>
                    {competencies.map((competency) => (
                      <SelectItem key={competency.id} value={competency.id}>
                        {competency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Curso */}
              <div className="space-y-2">
                <Label htmlFor="course">Curso</Label>
                <Select
                  value={pendingFilters.courseId}
                  onValueChange={(value) => handlePendingFilterChange('courseId', value)}
                  disabled={loadingFilters}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingFilters ? 'Cargando...' : 'Todos los cursos'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los cursos</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dificultad */}
              <div className="space-y-2">
                <Label htmlFor="difficulty">Dificultad</Label>
                <Select
                  value={pendingFilters.difficultyLevel}
                  onValueChange={(value) => handlePendingFilterChange('difficultyLevel', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los niveles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los niveles</SelectItem>
                    <SelectItem value="facil">Fácil</SelectItem>
                    <SelectItem value="intermedio">Intermedio</SelectItem>
                    <SelectItem value="dificil">Difícil</SelectItem>
                    <SelectItem value="variable">Variable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Estado de publicación */}
              <div className="space-y-2">
                <Label htmlFor="isPublished">Estado</Label>
                <Select
                  value={pendingFilters.isPublished}
                  onValueChange={(value) => handlePendingFilterChange('isPublished', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="true">Publicado</SelectItem>
                    <SelectItem value="false">Borrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleClearExamFilters}>
                Limpiar filtros
              </Button>
              <Button onClick={handleApplyExamFilters}>
                <Search className="w-4 h-4 mr-2" />
                Aplicar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Formulario de examen */}
        {showExamForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingExam ? 'Editar Examen' : 'Nuevo Examen'}</CardTitle>
            </CardHeader>
            <CardContent>
              <ExamForm
                exam={editingExam || undefined}
                onSubmit={editingExam ? handleUpdateExam : handleCreateExam}
                onCancel={() => {
                  setShowExamForm(false)
                  setEditingExam(null)
                }}
                loading={examsLoading}
              />
            </CardContent>
          </Card>
        )}

        {/* Lista de exámenes */}
        {!showExamForm && (
          <>
            {examsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando exámenes...</p>
              </div>
            ) : examsError ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar exámenes</h3>
                  <p className="text-gray-600 mb-4">{examsError}</p>
                  <Button onClick={() => fetchExams()} variant="outline">
                    Reintentar
                  </Button>
                </CardContent>
              </Card>
            ) : exams.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay exámenes</h3>
                  <p className="text-gray-600 mb-4">Comienza creando tu primer examen.</p>
                  <Button onClick={() => setShowExamForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Examen
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {exams.map((exam) => (
                  <Card key={exam.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{exam.title}</h3>
                            {exam.isPublished ? (
                              <Badge variant="default" className="bg-green-500">Publicado</Badge>
                            ) : (
                              <Badge variant="secondary">Borrador</Badge>
                            )}
                            <Badge variant="outline">{exam.examType}</Badge>
                          </div>
                          
                          {exam.description && (
                            <p className="text-sm text-gray-600 mb-3">{exam.description}</p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            {exam.course && (
                              <div className="flex items-center space-x-1">
                                <BookOpen className="h-4 w-4" />
                                <span>{exam.course.title}</span>
                              </div>
                            )}
                            {exam.competency && (
                              <Badge variant="secondary">
                                {exam.competency.displayName || exam.competency.name}
                              </Badge>
                            )}
                            {exam.academicGrade ? (
                              <Badge variant="secondary">
                                {getAcademicGradeDisplayName(exam.academicGrade)}
                              </Badge>
                            ) : exam.course?.academicGrade ? (
                              <Badge variant="secondary">
                                {getAcademicGradeDisplayName(exam.course.academicGrade)}
                              </Badge>
                            ) : null}
                            {exam.timeLimitMinutes && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{exam.timeLimitMinutes} min</span>
                              </div>
                            )}
                            <span>Puntaje mínimo: {exam.passingScore}%</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {canPreview && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewExam(exam)}
                              title="Vista previa/Testear examen"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver/Testear
                            </Button>
                          )}
                          {canEdit && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingExam(exam)
                                setShowExamForm(true)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteExam(exam.id)}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal de Preview/Testeo de Examen */}
        {showPreviewDialog && previewExam && (
          <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
            <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden">
              <div className="flex h-full flex-col">
                <DialogHeader className="p-4 border-b">
                  <DialogTitle className="flex items-center justify-between">
                    <span>Vista Previa / Testeo del Examen</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowPreviewDialog(false)
                        setPreviewExam(null)
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </DialogTitle>
                  <DialogDescription>
                    {previewExam.title} - Vista como estudiante (sin respuestas correctas visibles)
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 min-h-0 overflow-y-auto p-4">
                  <ExamPreview
                    exam={previewExam}
                    mode="student"
                    answers={previewAnswers}
                    onAnswer={handlePreviewAnswerChange}
                    isSubmitted={false}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    )
  }

  // Si showResultsOnly es true, mostrar solo resultados
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {selectedExam ? (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedExam(null)
                  setSelectedStudentIds([])
                }}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedExam.exam.title}</h2>
                <p className="text-gray-600">{selectedExam.totalStudents} estudiante(s) completaron este examen</p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Resultados de Exámenes</h2>
              <p className="text-gray-600">Selecciona un examen para ver los estudiantes que lo completaron</p>
            </div>
          )}
        </div>
      </div>

      {/* Filtros - Solo mostrar si no hay examen seleccionado */}
      {!selectedExam && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Búsqueda general */}
              <div className="space-y-2">
                <Label htmlFor="search">Buscar examen</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Buscar por título de examen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Curso */}
              <div className="space-y-2">
                <Label htmlFor="filterCourse">Curso</Label>
                <Select
                  value={filterCourse || "all"}
                  onValueChange={(value) => setFilterCourse(value === "all" ? "" : value)}
                  disabled={loadingFilters}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingFilters ? 'Cargando...' : 'Todos los cursos'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los cursos</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Competencia */}
              <div className="space-y-2">
                <Label htmlFor="filterCompetency">Competencia</Label>
                <Select
                  value={filterCompetency || "all"}
                  onValueChange={(value) => setFilterCompetency(value === "all" ? "" : value)}
                  disabled={loadingFilters}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingFilters ? 'Cargando...' : 'Todas las competencias'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las competencias</SelectItem>
                    {competencies.map((competency) => (
                      <SelectItem key={competency.id} value={competency.id}>
                        {competency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Examen */}
              <div className="space-y-2">
                <Label htmlFor="filterExamType">Tipo de Examen</Label>
                <Select
                  value={filterExamType}
                  onValueChange={setFilterExamType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="icfes">ICFES</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setFilterCourse("")
                  setFilterCompetency("")
                  setFilterExamType("all")
                  fetchGroupedExams()
                }}
              >
                Limpiar filtros
              </Button>
              <Button onClick={handleSearch}>
                <Search className="w-4 h-4 mr-2" />
                Aplicar filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vista de lista de exámenes o detalle de estudiantes */}
      {selectedExam ? (
        /* Vista de estudiantes del examen seleccionado */
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Estudiantes que completaron el examen
                  {selectedExam.exam.isManualSimulacro && (
                    <Badge variant="outline" className="ml-2">
                      Simulacro Manual
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {selectedStudentIds.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReactivateMode('multiple')
                        setShowReactivateDialog(true)
                      }}
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reactivar Seleccionados ({selectedStudentIds.length})
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReactivateMode('all')
                      setShowReactivateDialog(true)
                    }}
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reactivar Todos
                  </Button>
                </div>
              </div>

              {/* Controles de reporte para simulacros manuales */}
              {selectedExam.exam.isManualSimulacro && (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-t pt-3 mt-2">
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="font-semibold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Reporte de Simulacro Manual
                    </div>
                    <p>
                      Genera reportes agregados por colegio, tema, subtema, componente y competencia
                      para este simulacro.
                    </p>
                  </div>
                  <div className="flex flex-col md:flex-row gap-2 md:items-center">
                    {/* Filtro por colegio basado en los estudiantes de este examen */}
                    <Select
                      value={manualReportSchoolId}
                      onValueChange={(value) => setManualReportSchoolId(value)}
                    >
                      <SelectTrigger className="w-full md:w-64">
                        <SelectValue placeholder="Todos los colegios" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los colegios</SelectItem>
                        {Array.from(
                          new Map(
                            selectedExam.students
                              .filter(s => s.user.school)
                              .map(s => [s.user.school.id, s.user.school])
                          ).values()
                        ).map((school: any) => (
                          <SelectItem key={school.id} value={school.id}>
                            {school.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      disabled={manualReportLoading}
                      onClick={async () => {
                        try {
                          setManualReportLoading(true)
                          const params = new URLSearchParams()
                          if (manualReportSchoolId !== "all") {
                            params.set("schoolId", manualReportSchoolId)
                          }
                          const response = await fetch(
                            `/api/manual-simulacros/${selectedExam.exam.id}/report` +
                              (params.toString() ? `?${params.toString()}` : "")
                          )
                          if (!response.ok) {
                            throw new Error("Error al obtener el reporte")
                          }
                          const data: ManualSimulacroReport = await response.json()
                          setManualReport(data)
                          toast({
                            title: "Reporte generado",
                            description: "Se ha generado el reporte del simulacro.",
                          })
                        } catch (error: any) {
                          console.error("Error loading manual simulacro report:", error)
                          toast({
                            title: "Error",
                            description: error?.message || "Error al generar el reporte",
                            variant: "destructive",
                          })
                        } finally {
                          setManualReportLoading(false)
                        }
                      }}
                    >
                      <BarChart3 className="w-4 h-4" />
                      {manualReportLoading ? "Generando..." : "Ver reporte"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      disabled={manualReportLoading}
                      onClick={async () => {
                        try {
                          const params = new URLSearchParams()
                          if (manualReportSchoolId !== "all") {
                            params.set("schoolId", manualReportSchoolId)
                          }
                          const url = `/api/manual-simulacros/${selectedExam.exam.id}/report/export-csv` +
                            (params.toString() ? `?${params.toString()}` : "")
                          const res = await fetch(url)
                          if (!res.ok) throw new Error("Error al descargar CSV")
                          const blob = await res.blob()
                          const downloadUrl = window.URL.createObjectURL(blob)
                          const a = document.createElement("a")
                          a.href = downloadUrl
                          a.download = `reporte-simulacro-${selectedExam.exam.id}.csv`
                          document.body.appendChild(a)
                          a.click()
                          a.remove()
                          window.URL.revokeObjectURL(downloadUrl)
                        } catch (error: any) {
                          console.error("Error exporting CSV:", error)
                          toast({
                            title: "Error",
                            description: error?.message || "Error al exportar CSV",
                            variant: "destructive",
                          })
                        }
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Exportar CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      disabled={manualReportLoading}
                      onClick={async () => {
                        try {
                          const params = new URLSearchParams()
                          if (manualReportSchoolId !== "all") {
                            params.set("schoolId", manualReportSchoolId)
                          }
                          const url = `/api/manual-simulacros/${selectedExam.exam.id}/report/export-pdf` +
                            (params.toString() ? `?${params.toString()}` : "")
                          const res = await fetch(url)
                          if (!res.ok) throw new Error("Error al descargar PDF")
                          const blob = await res.blob()
                          const downloadUrl = window.URL.createObjectURL(blob)
                          const a = document.createElement("a")
                          a.href = downloadUrl
                          a.download = `reporte-simulacro-${selectedExam.exam.id}.pdf`
                          document.body.appendChild(a)
                          a.click()
                          a.remove()
                          window.URL.revokeObjectURL(downloadUrl)
                        } catch (error: any) {
                          console.error("Error exporting PDF:", error)
                          toast({
                            title: "Error",
                            description: error?.message || "Error al exportar PDF",
                            variant: "destructive",
                          })
                        }
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Resumen de reporte de simulacro manual (si existe) */}
            {selectedExam.exam.isManualSimulacro && manualReport && (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-100">
                  <CardContent className="p-4">
                    <div className="text-xs font-semibold text-blue-700 uppercase mb-1">
                      Promedio del grupo
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {manualReport.averageScore}%
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      {manualReport.totalStudents} estudiante(s)
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100">
                  <CardContent className="p-4">
                    <div className="text-xs font-semibold text-green-700 uppercase mb-1">
                      Tasa de aprobación
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {manualReport.passRate}%
                    </div>
                    <div className="text-xs text-green-700 mt-1">
                      Basado en estudiantes con examen completado
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-100">
                  <CardContent className="p-4">
                    <div className="text-xs font-semibold text-purple-700 uppercase mb-1">
                      Intentos totales
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      {manualReport.totalAttempts}
                    </div>
                    <div className="text-xs text-purple-700 mt-1">
                      Incluye reintentos cuando existan
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedExam.students.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay estudiantes que hayan completado este examen</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedStudentIds.length === selectedExam.students.length && selectedExam.students.length > 0}
                        onCheckedChange={handleSelectAllStudents}
                      />
                    </TableHead>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Colegio</TableHead>
                    <TableHead>Puntuación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Tiempo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedExam.students.map((student) => (
                    <TableRow key={student.resultId}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudentIds.includes(student.resultId)}
                          onCheckedChange={() => handleSelectStudent(student.resultId)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {student.user.firstName} {student.user.lastName}
                      </TableCell>
                      <TableCell>{student.user.email}</TableCell>
                      <TableCell>
                        {student.user.school?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${getScoreColor(student.score)}`}>
                          {student.score}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {student.isPassed ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Aprobado
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="w-3 h-3 mr-1" />
                            No Aprobado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>{student.timeTakenMinutes} min</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(student.completedAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedStudentIds([student.resultId])
                            setReactivateMode('single')
                            setShowReactivateDialog(true)
                          }}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Vista de lista de exámenes */
        <div className="space-y-4">
          {groupedExams.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay exámenes completados</h3>
                <p className="text-gray-600">No se encontraron exámenes completados que coincidan con los filtros.</p>
              </CardContent>
            </Card>
          ) : (
            groupedExams.map((examData) => (
              <Card key={examData.exam.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedExam(examData)}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{examData.exam.title}</h3>
                        <Badge variant="outline">{examData.exam.examType}</Badge>
                      </div>
                      
                      {examData.exam.description && (
                        <p className="text-sm text-gray-600 mb-3">{examData.exam.description}</p>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{examData.totalStudents} estudiante(s)</span>
                        </div>
                        {examData.exam.course && (
                          <div className="flex items-center space-x-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{examData.exam.course.title}</span>
                          </div>
                        )}
                        {examData.exam.competency && (
                          <Badge variant="secondary">
                            {examData.exam.competency.displayName || examData.exam.competency.name}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Eye className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Reactivate Dialog */}
      <Dialog open={showReactivateDialog} onOpenChange={setShowReactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Reactivar Examen</span>
            </DialogTitle>
            <DialogDescription>
              {reactivateMode === 'all' 
                ? `¿Estás seguro de que quieres reactivar este examen para TODOS los estudiantes? Todos podrán volver a presentarlo.`
                : reactivateMode === 'multiple'
                ? `¿Estás seguro de que quieres reactivar este examen para los ${selectedStudentIds.length} estudiante(s) seleccionado(s)?`
                : '¿Estás seguro de que quieres reactivar este examen? El estudiante podrá volver a presentarlo.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedExam && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Detalles del Examen</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Examen:</strong> {selectedExam.exam.title}</p>
                  {reactivateMode === 'single' && selectedStudentIds.length === 1 && (
                    <>
                      {selectedExam.students.find(s => s.resultId === selectedStudentIds[0]) && (
                        <>
                          <p><strong>Estudiante:</strong> {
                            selectedExam.students.find(s => s.resultId === selectedStudentIds[0])!.user.firstName
                          } {
                            selectedExam.students.find(s => s.resultId === selectedStudentIds[0])!.user.lastName
                          }</p>
                          <p><strong>Puntuación actual:</strong> {
                            selectedExam.students.find(s => s.resultId === selectedStudentIds[0])!.score
                          }%</p>
                        </>
                      )}
                    </>
                  )}
                  {reactivateMode === 'multiple' && (
                    <p><strong>Estudiantes seleccionados:</strong> {selectedStudentIds.length}</p>
                  )}
                  {reactivateMode === 'all' && (
                    <p><strong>Total de estudiantes:</strong> {selectedExam.totalStudents}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Razón de la reactivación</Label>
                <Textarea
                  id="reason"
                  placeholder="Ej: Problemas técnicos, conexión perdida, etc."
                  value={reactivateReason}
                  onChange={(e) => setReactivateReason(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReactivateDialog(false)
                setSelectedStudentIds([])
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReactivate}
              disabled={reactivating || !reactivateReason.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {reactivating 
                ? 'Reactivando...' 
                : reactivateMode === 'all'
                ? `Reactivar Todos (${selectedExam?.totalStudents || 0})`
                : reactivateMode === 'multiple'
                ? `Reactivar Seleccionados (${selectedStudentIds.length})`
                : 'Reactivar Examen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}