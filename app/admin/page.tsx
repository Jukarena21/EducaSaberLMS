"use client"
import { useState, useEffect, useMemo, useRef } from "react"
import BrandingForm from "@/components/BrandingForm"
import { AdminHeader } from "@/components/AdminHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Users,
  FileText,
  TrendingUp,
  LogOut,
  BarChart3,
  Building,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  BookOpen,
  Video,
  ImageIcon,
  Bell,
  Activity,
  PieChart,
  LineChart,
  Upload,
  Save,
  X,
  Award,
  Clock,
  Filter,
  ChevronDown,
  Download,
  Calendar,
  AlertTriangle,
  Lightbulb,
  Target,
  TrendingDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  GraduationCap,
  HelpCircle,
  ClipboardCheck,
  Settings,
  Palette,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useUsers } from "@/hooks/useUsers"
import { useSchools } from "@/hooks/useSchools"
import { useQuestions } from "@/hooks/useQuestions"
import { useCompetencies } from "@/hooks/useCompetencies"
import { useLessons } from "@/hooks/useLessons"
import { useModules } from "@/hooks/useModules"
import { useCourses } from "@/hooks/useCourses"
import { useCoursesBySchool } from "@/hooks/useCoursesBySchool"
import { useAnalytics } from "@/hooks/useAnalytics"
import { ExamManagement } from "@/components/ExamManagement"
import UserForm from "@/components/UserForm"
import SchoolForm from "@/components/SchoolForm"
import QuestionForm from "@/components/QuestionForm"
import { QuestionManagementNew } from "@/components/QuestionManagementNew"
import { LessonManagement } from "@/components/LessonManagement"
import { ModuleManagement } from "@/components/ModuleManagement"
import { CourseManagement } from "@/components/CourseManagement"
import { StudentDetailModal } from "@/components/StudentDetailModal"
import { BulkImportCenter } from "@/components/BulkImportCenter"
import { BrandLoading } from "@/components/BrandLoading"
import { NotificationManagement } from "@/components/NotificationManagement"
import { StudentsManagement } from "@/components/StudentsManagement"
import { LiveClassManagement } from "@/components/LiveClassManagement"
import { ManualSimulacroManagement } from "@/components/ManualSimulacroManagement"
import { OtrosSimulacroManagement } from "@/components/OtrosSimulacroManagement"
import * as XLSX from "xlsx"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  AreaChart,
  Area,
  Pie,
  ComposedChart,
  ReferenceLine,
} from "recharts"

// Datos placeholder eliminados - ahora usamos solo datos reales de la base de datos

export default function AdminDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const forbidden = searchParams.get('forbidden') === '1'
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState("analytics")
  const [selectedPeriod, setSelectedPeriod] = useState("6m")
  
  // Función para convertir hex a HSL
  const hexToHsl = (hex: string): string => {
    if (!hex || !hex.startsWith('#')) return 'hsl(262 83% 58%)' // Color por defecto
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
  }
  
  // Analytics hook con datos reales
  const {
    kpis,
    engagementMetrics,
    gradeSeries,
    gradeDistribution,
    hourlyActivity,
    schoolRanking,
    reportRows,
    compReportRows,
    reportSeries,
    reportDistribution,
    loading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useAnalytics()
  
  // Asegurar que los datos de analytics sean siempre arrays válidos
  const safeGradeSeries = Array.isArray(gradeSeries) ? gradeSeries : []
  const safeGradeDistribution = Array.isArray(gradeDistribution) ? gradeDistribution : []
  const safeHourlyActivity = Array.isArray(hourlyActivity) ? hourlyActivity : []
  const safeSchoolRanking = Array.isArray(schoolRanking) ? schoolRanking : []
  const safeReportSeries = Array.isArray(reportSeries) ? reportSeries : []
  const safeReportDistribution = Array.isArray(reportDistribution) ? reportDistribution : []
  const safeReportRows = Array.isArray(reportRows) ? reportRows : []
  const safeCompReportRows = Array.isArray(compReportRows) ? compReportRows : []
  
  // Filtros de analytics
  const [filterSchoolId, setFilterSchoolId] = useState<string>('all')
  const [filterCourseId, setFilterCourseId] = useState<string>('all')
  const [filterGrade, setFilterGrade] = useState<string>('all')
  const [filterCompetencyId, setFilterCompetencyId] = useState<string>('all')
  const [filterMinAge, setFilterMinAge] = useState<string>('')
  const [filterMaxAge, setFilterMaxAge] = useState<string>('')
  const [filterGender, setFilterGender] = useState<string>('all')
  const [filterSocioeconomicStratum, setFilterSocioeconomicStratum] = useState<string>('all')
  const [comparePeriod, setComparePeriod] = useState<string>('none')
  const [searchTriggered, setSearchTriggered] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  
  // Estado para métricas de estudiantes
  const [studentsMetrics, setStudentsMetrics] = useState<any[]>([])
  const [studentsMetricsLoading, setStudentsMetricsLoading] = useState(false)
  const [studentsMetricsError, setStudentsMetricsError] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)
  
  // Paginación para lista de estudiantes
  const [studentListPage, setStudentListPage] = useState(1)
  const [atRiskPage, setAtRiskPage] = useState(1)
  const studentsPerPage = 10
  
  // Resetear páginas cuando cambien los filtros
  useEffect(() => {
    setStudentListPage(1)
  }, [searchTerm, filterGrade])
  
  useEffect(() => {
    setAtRiskPage(1)
  }, [studentsMetrics])

  // Hooks para obtener datos
  const { users, loading: usersLoading, error: usersError } = useUsers()
  
  // Asegurar que users sea siempre un array válido
  const safeUsers = Array.isArray(users) ? users : []
  const { schools, loading: schoolsLoading, error: schoolsError } = useSchools()
  const { questions, loading: questionsLoading, error: questionsError } = useQuestions()
  const { competencies, loading: competenciesLoading, error: competenciesError } = useCompetencies()
  const { lessons, loading: lessonsLoading, error: lessonsError } = useLessons()
  const { modules, loading: modulesLoading, error: modulesError } = useModules(true) // forCourseCreation = true
  const { courses, loading: coursesLoading, error: coursesError } = useCourses()
  const { courses: filteredCourses, loading: filteredCoursesLoading } = useCoursesBySchool(filterSchoolId)
  
  // Asegurar que los arrays sean siempre válidos
  const safeCourses = Array.isArray(courses) ? courses : []
  const safeFilteredCourses = Array.isArray(filteredCourses) ? filteredCourses : []
  const safeSchools = Array.isArray(schools) ? schools : []
  const safeCompetencies = Array.isArray(competencies) ? competencies : []

  // Redirigir si no está autenticado o no es admin
  useEffect(() => {
    if (status === "loading") return // Esperar a que cargue la sesión
    
    if (!session) {
      router.push("/")
      return
    }

    if (session.user?.role !== "school_admin" && session.user?.role !== "teacher_admin") {
      router.push("/")
      return
    }
  }, [session, status, router])

  // Refetch analytics when search is triggered
  useEffect(() => {
    if (activeTab !== 'analytics' || !searchTriggered) return
    
    const filters = {
      schoolId: filterSchoolId !== 'all' ? filterSchoolId : undefined,
      courseId: filterCourseId !== 'all' ? filterCourseId : undefined,
      grade: filterGrade !== 'all' ? filterGrade : undefined,
      competencyId: filterCompetencyId !== 'all' ? filterCompetencyId : undefined,
      minAge: filterMinAge || undefined,
      maxAge: filterMaxAge || undefined,
      gender: filterGender !== 'all' ? filterGender : undefined,
      socioeconomicStratum: filterSocioeconomicStratum !== 'all' ? filterSocioeconomicStratum : undefined
    }
    
    refetchAnalytics(filters)
    setSearchTriggered(false) // Reset the trigger
  }, [activeTab, searchTriggered, filterSchoolId, filterCourseId, filterGrade, filterCompetencyId, filterMinAge, filterMaxAge, filterGender, filterSocioeconomicStratum, refetchAnalytics])

  // Función para manejar la búsqueda
  const handleSearch = () => {
    setSearchTriggered(true)
  }

  // Resetear filtro de curso cuando cambie el colegio
  useEffect(() => {
    if (filterSchoolId === 'all') {
      setFilterCourseId('all')
    } else {
      setFilterCourseId('all')
    }
  }, [filterSchoolId])

  // Cache for students metrics
  const studentsMetricsCache = useRef<Map<string, { data: any[]; timestamp: number }>>(new Map())
  const STUDENTS_METRICS_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  
  const getStudentsMetricsCacheKey = () => {
    const schoolIdParam = session?.user?.role === 'school_admin' 
      ? session.user.schoolId 
      : (filterSchoolId !== 'all' ? filterSchoolId : undefined)
    return `students-${session?.user?.id}-${schoolIdParam || 'all'}`
  }

  // Cargar métricas de estudiantes cuando cambien los filtros o se active la pestaña de analytics
  useEffect(() => {
    if (activeTab === 'analytics' && session?.user) {
      loadStudentsMetrics()
    }
  }, [activeTab, session?.user?.id, filterSchoolId, filterGrade]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadStudentsMetrics = async () => {
    try {
      const cacheKey = getStudentsMetricsCacheKey()
      const cached = studentsMetricsCache.current.get(cacheKey)
      
      // Check cache first
      if (cached && Date.now() - cached.timestamp < STUDENTS_METRICS_CACHE_TTL) {
        setStudentsMetrics(cached.data)
        return
      }

      setStudentsMetricsLoading(true)
      setStudentsMetricsError(null)
      
      const schoolIdParam = session?.user?.role === 'school_admin' 
        ? session.user.schoolId 
        : (filterSchoolId !== 'all' ? filterSchoolId : undefined)
      
      const url = new URL('/api/admin/students/metrics', window.location.origin)
      if (schoolIdParam) {
        url.searchParams.set('schoolId', schoolIdParam)
      }
      
      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error('Error al cargar métricas de estudiantes')
      }
      
      const data = await response.json()
      const students = data.students || []
      console.log('Loaded students metrics:', students.length, 'students')
      if (students.length > 0) {
        console.log('Sample student:', {
          name: students[0].studentName,
          email: students[0].studentEmail,
          id: students[0].studentId
        })
        // Buscar específicamente el usuario "test"
        const testUser = students.find((s: any) => 
          s.studentName?.toLowerCase().includes('test') || 
          s.studentEmail?.toLowerCase().includes('test')
        )
        if (testUser) {
          console.log('Found test user:', testUser)
        } else {
          console.log('Test user not found in results. All student names:', students.map((s: any) => s.studentName))
        }
      }
      setStudentsMetrics(students)
      // Update cache
      studentsMetricsCache.current.set(cacheKey, { data: students, timestamp: Date.now() })
    } catch (error: any) {
      console.error('Error loading students metrics:', error)
      setStudentsMetricsError(error.message || 'Error al cargar métricas')
    } finally {
      setStudentsMetricsLoading(false)
    }
  }

  // Utilidad para crear y descargar un Excel sencillo (similar a plantillas de carga masiva)
  const downloadExcel = (
    filename: string,
    sheetName: string,
    headers: string[],
    rows: (string | number | null | undefined)[][]
  ) => {
    const data = [headers, ...rows]
    const worksheet = XLSX.utils.aoa_to_sheet(data)

    // Congelar encabezado
    ;(worksheet as any)["!freeze"] = { xSplit: 0, ySplit: 1 }

    // Auto-ajustar ancho de columnas
    const colWidths = headers.map((h, colIdx) => {
      const maxLen = Math.max(
        h.length,
        ...rows.map((r) => (r[colIdx] != null ? String(r[colIdx]).length : 0))
      )
      return { wch: Math.min(Math.max(maxLen + 2, 10), 40) }
    })
    ;(worksheet as any)["!cols"] = colWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportStudentsCSV = () => {
    if (studentsMetrics.length === 0) return

    // Filtrar estudiantes según los filtros aplicados
    const filteredStudents = studentsMetrics.filter((student: any) => {
      if (
        searchTerm &&
        !student.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !student.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false
      if (filterGrade !== "all" && student.academicGrade !== filterGrade) return false
      return true
    })

    const headers = [
      "Nombre",
      "Email",
      "Grado",
      "Total Exámenes",
      "Promedio",
      "Tasa de Aprobación",
      "Tiempo de Estudio (h)",
      "Progreso Promedio",
      "Cursos Completados",
      "Cursos Activos",
      "Estado",
      "Última Actividad",
      "Factores de Riesgo",
    ]

    const rows = filteredStudents.map((student: any) => [
      student.studentName || "",
      student.studentEmail || "",
      student.academicGrade
        ? student.academicGrade.charAt(0).toUpperCase() + student.academicGrade.slice(1)
        : "N/A",
      student.totalExams || 0,
      Number((student.averageScore || 0).toFixed(1)),
      Number((student.passRate || 0).toFixed(1)),
      Number((student.totalStudyTimeHours || 0).toFixed(1)),
      Number((student.averageCourseProgress || 0).toFixed(1)),
      student.completedCourses || 0,
      student.activeCourses || 0,
      student.status === "excelente"
        ? "Excelente"
        : student.status === "bueno"
        ? "Bueno"
        : student.status === "mejorable"
        ? "Mejorable"
        : student.status === "requiere_atencion"
        ? "Requiere Atención"
        : "Sin datos",
      student.lastActivity
        ? new Date(student.lastActivity).toLocaleDateString("es-ES")
        : "N/A",
      student.riskFactors && student.riskFactors.length > 0
        ? student.riskFactors.join("; ")
        : "Ninguno",
    ])

    const dateStr = new Date().toISOString().split("T")[0]
    const filtersStr = filterGrade !== "all" ? `_${filterGrade}` : ""
    downloadExcel(
      `estudiantes_metricas_${dateStr}${filtersStr}.xlsx`,
      "Estudiantes",
      headers,
      rows
    )
  }

  const exportCompCSV = () => {
    const headers = ["Competencia", "Dificultad", "Intentos", "Promedio", "Aprobación %"]
    const rows = safeCompReportRows.map((r: any) => [
      safeCompetencies.find((c) => c.id === r.competencyId)?.displayName || "N/A",
      r.difficultyLevel || "N/A",
      r.attempts || 0,
      Number((r.avgScore || 0).toFixed(1)),
      Number((r.passRate || 0).toFixed(1)),
    ])
    downloadExcel("reporte_competencias.xlsx", "Competencias", headers, rows)
  }

  const exportRowsToCSV = () => {
    const headers = ["Colegio", "Curso", "Competencia", "Intentos", "Promedio", "Aprobación %"]
    const rows = safeReportRows.map((r) => [
      safeSchools.find((s) => s.id === r.schoolId)?.name || "N/A",
      safeCourses.find((c) => c.id === r.courseId)?.title || "N/A",
      safeCompetencies.find((c) => c.id === r.competencyId)?.displayName || "N/A",
      r.attempts || 0,
      Number((r.avgScore || 0).toFixed(1)),
      Number((r.passRate || 0).toFixed(1)),
    ])
    downloadExcel("reporte_resumen.xlsx", "Resumen", headers, rows)
  }

  const exportEngagementCSV = () => {
    if (!engagementMetrics) return

    const headers = ["Métrica", "Valor", "Unidad"]
    const rows: (string | number)[][] = [
      ["Lecciones Completadas", engagementMetrics.totalLessonsCompleted, "unidades"],
      ["Tiempo Total de Estudio", engagementMetrics.totalStudyTimeHours, "horas"],
      [
        "Duración Promedio de Sesión",
        engagementMetrics.averageSessionDurationMinutes,
        "minutos",
      ],
      ["Usuarios Activos", engagementMetrics.activeUsers, "usuarios"],
      ["Cursos Completados", engagementMetrics.courseCompletions, "cursos"],
      ["Progreso Promedio", engagementMetrics.averageProgress, "porcentaje"],
      ["Tasa de Finalización", engagementMetrics.completionRate, "porcentaje"],
    ]

    const dateStr = new Date().toISOString().split("T")[0]
    downloadExcel(
      `metricas_engagement_${dateStr}.xlsx`,
      "Métricas",
      headers,
      rows
    )
  }

  const [exportingBulkReport, setExportingBulkReport] = useState(false)
  const [errorModalOpen, setErrorModalOpen] = useState(false)
  const [errorModalData, setErrorModalData] = useState<{
    title: string
    message: string
    filters?: Record<string, any>
  } | null>(null)

  const exportFullReport = async () => {
    setExportingBulkReport(true)
    try {
      const filters = {
        schoolId: filterSchoolId !== 'all' ? filterSchoolId : undefined,
        courseId: filterCourseId !== 'all' ? filterCourseId : undefined,
        grade: filterGrade !== 'all' ? filterGrade : undefined,
        competencyId: filterCompetencyId !== 'all' ? filterCompetencyId : undefined,
        minAge: filterMinAge || undefined,
        maxAge: filterMaxAge || undefined,
        gender: filterGender !== 'all' ? filterGender : undefined,
        socioeconomicStratum: filterSocioeconomicStratum !== 'all' ? filterSocioeconomicStratum : undefined
      }

      console.log('📤 Enviando filtros para reporte masivo:', filters)

      const response = await fetch('/api/admin/analytics/export-bulk-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters)
      })

      if (!response.ok) {
        let errorData: any = {}
        try {
          const text = await response.text()
          console.error('❌ Respuesta del servidor (texto):', text)
          errorData = text ? JSON.parse(text) : {}
        } catch (e) {
          console.error('❌ Error al parsear respuesta:', e)
          errorData = { error: `Error ${response.status}: ${response.statusText}` }
        }
        console.error('❌ Error al generar reporte:', errorData)
        
        let errorMessage = errorData.error || 'Error desconocido'
        const activeFilters = errorData.details?.filters 
          ? Object.entries(errorData.details.filters)
              .filter(([_, value]) => value !== undefined && value !== 'all' && value !== null)
              .reduce((acc, [key, value]) => {
                acc[key] = value
                return acc
              }, {} as Record<string, any>)
          : {}
        
        setErrorModalData({
          title: 'No se encontraron estudiantes',
          message: errorMessage,
          filters: activeFilters
        })
        setErrorModalOpen(true)
        return
      }

      // Descargar el PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte-masivo-estudiantes-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      console.error('Error exporting bulk report:', error)
      setErrorModalData({
        title: 'Error al generar el reporte',
        message: error.message || 'Ocurrió un error inesperado al generar el reporte. Por favor, intenta nuevamente.'
      })
      setErrorModalOpen(true)
    } finally {
      setExportingBulkReport(false)
    }
  }

  // Splash de marca para admin (general o de colegio)
  const [adminSplashDone, setAdminSplashDone] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setAdminSplashDone(true), 1200) // 1.2s mínimo
    return () => clearTimeout(timeout)
  }, [])

  const adminInitialLoading =
    status === "loading" ||
    !session ||
    (session.user?.role !== "school_admin" && session.user?.role !== "teacher_admin") ||
    schoolsLoading ||
    coursesLoading ||
    competenciesLoading ||
    analyticsLoading ||
    usersLoading

  if (adminInitialLoading || !adminSplashDone) {
    const message =
      status === "loading"
        ? "Cargando tu sesión administrativa..."
        : "Preparando el panel administrativo..."
    return <BrandLoading message={message} />
  }

  // Si no hay sesión o el rol no es válido, no renderizar nada (los efectos de arriba redirigen)
  if (!session || (session.user?.role !== "school_admin" && session.user?.role !== "teacher_admin")) {
    return null
  }

  // Si no hay sesión, no renderizar nada (se redirigirá)
  if (!session || (session.user?.role !== "school_admin" && session.user?.role !== "teacher_admin")) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 school-gradient">
      {forbidden && (
        <div className="container mx-auto px-4 pt-4">
          <div className="rounded-md border border-yellow-300 bg-yellow-50 text-yellow-900 p-3 text-sm flex items-start justify-between">
            <div>
              Acceso restringido. No tienes permisos para acceder a esa sección.
            </div>
          </div>
        </div>
      )}
      <AdminHeader />

      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            ¡Bienvenido, {session?.user?.name || (session?.user?.role === 'school_admin' ? 'Admin del Colegio' : 'Administrador')}!
          </h2>
          <p className="text-gray-600">
            {session?.user?.role === 'school_admin' 
              ? 'Gestiona estudiantes, contenido y analiza el rendimiento de tu institución'
              : 'Gestiona contenido, analiza datos y supervisa el rendimiento de la plataforma'
            }
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto scrollbar-hover">
            <TabsList className="inline-flex w-full min-w-max gap-1.5 h-auto p-1.5">
              <TabsTrigger value="analytics" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm">
                <BarChart3 className="h-4 w-4 flex-shrink-0" />
                <span>Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="courses" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm">
                <BookOpen className="h-4 w-4 flex-shrink-0" />
                <span>Cursos</span>
              </TabsTrigger>
              <TabsTrigger value="modules" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm">
                <Layers className="h-4 w-4 flex-shrink-0" />
                <span>Módulos</span>
              </TabsTrigger>
              <TabsTrigger value="lessons" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm">
                <GraduationCap className="h-4 w-4 flex-shrink-0" />
                <span>Lecciones</span>
              </TabsTrigger>
              <TabsTrigger value="questions" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm">
                <HelpCircle className="h-4 w-4 flex-shrink-0" />
                <span>Preguntas</span>
              </TabsTrigger>
              <TabsTrigger value="exams" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm">
                <FileText className="h-4 w-4 flex-shrink-0" />
                <span>Exámenes</span>
              </TabsTrigger>
              {session?.user?.role === 'teacher_admin' && (
                <TabsTrigger value="manual-simulacros" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm">
                  <ClipboardCheck className="h-4 w-4 flex-shrink-0" />
                  <span>Simulacro saber</span>
                </TabsTrigger>
              )}
              {session?.user?.role === 'teacher_admin' && (
                <TabsTrigger value="otros-simulacros" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm">
                  <ClipboardCheck className="h-4 w-4 flex-shrink-0" />
                  <span>Otros simulacros</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="live-classes" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm">
                <Video className="h-4 w-4 flex-shrink-0" />
                <span>Clases en Vivo</span>
              </TabsTrigger>
              <TabsTrigger value="exam-management" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm">
                <ClipboardCheck className="h-4 w-4 flex-shrink-0" />
                <span>Resultados</span>
              </TabsTrigger>
              <TabsTrigger value="students" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span>{session?.user?.role === 'teacher_admin' ? 'Usuarios' : 'Estudiantes'}</span>
              </TabsTrigger>
              {session?.user?.role === 'teacher_admin' && (
                <TabsTrigger value="schools" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm">
                  <Building className="h-4 w-4 flex-shrink-0" />
                  <span>Colegios</span>
                </TabsTrigger>
              )}
              {session?.user?.role === 'teacher_admin' && (
                <TabsTrigger value="settings" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm">
                  <Settings className="h-4 w-4 flex-shrink-0" />
                  <span>Configuración</span>
                </TabsTrigger>
              )}
              {(session?.user?.role === 'school_admin' || session?.user?.role === 'teacher_admin') && (
                <TabsTrigger value="branding" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm">
                  <Palette className="h-4 w-4 flex-shrink-0" />
                  <span>Branding</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="notifications" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm">
                <Bell className="h-4 w-4 flex-shrink-0" />
                <span>Notificaciones</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* BRANDING TAB */}
          {(session?.user?.role === 'school_admin' || session?.user?.role === 'teacher_admin') && (
            <TabsContent value="branding" className="space-y-6">
              {session?.user?.role === 'teacher_admin' ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Gestión de Branding por Colegio</CardTitle>
                    <CardDescription>
                      Selecciona un colegio para gestionar su branding
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BrandingManagementForTeacherAdmin schools={schools || []} />
                  </CardContent>
                </Card>
              ) : (
                <BrandingForm schoolId={session?.user?.schoolId} />
              )}
            </TabsContent>
          )}

          {/* NOTIFICATIONS TAB */}
          <TabsContent value="notifications" className="space-y-6">
            <NotificationManagement />
          </TabsContent>

          {/* ANALYTICS + REPORTS TAB */}
          <TabsContent value="analytics" className="space-y-6">
                   {/* Resumen Ejecutivo - 3 Tarjetas Separadas */}
                   {kpis && (
                     <TooltipProvider delayDuration={200}>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 cursor-help">
                               <CardContent className="p-5">
                                 <div className="flex items-center justify-between mb-3">
                                   <div className="p-2 bg-blue-200 rounded-lg">
                                     <Users className="h-6 w-6 text-blue-700" />
                                   </div>
                                   {kpis.activeStudents && kpis.activeStudents > 0 && (
                                     <Badge className={`${
                                       kpis.activeStudents >= 100 ? 'bg-green-500' :
                                       kpis.activeStudents >= 50 ? 'bg-yellow-500' :
                                       'bg-red-500'
                                     } text-white`}>
                                       {kpis.activeStudents >= 100 ? 'Alto' :
                                        kpis.activeStudents >= 50 ? 'Medio' : 'Bajo'}
                                     </Badge>
                                   )}
                                 </div>
                                 <div className="text-3xl font-bold text-blue-700 mb-1">
                                   {kpis?.activeStudents?.toLocaleString('es-CO') || '0'}
                                 </div>
                                 <div className="text-sm font-medium text-blue-600">Estudiantes Activos</div>
                                 <div className="text-xs text-blue-500 mt-1">
                                   {session?.user?.role === 'school_admin' 
                                     ? 'En tu colegio' 
                                     : 'En el período seleccionado'}
                                 </div>
                               </CardContent>
                             </Card>
                           </TooltipTrigger>
                           <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
                             Número de estudiantes que han tenido actividad en la plataforma durante el período seleccionado.{" "}
                             {session?.user?.role === 'school_admin' 
                               ? 'Incluye solo estudiantes de tu colegio que han iniciado sesión, completado lecciones o presentado exámenes.' 
                               : 'Incluye todos los estudiantes que han iniciado sesión, completado lecciones o presentado exámenes según los filtros aplicados.'}
                           </TooltipContent>
                         </Tooltip>

                         <Tooltip>
                           <TooltipTrigger asChild>
                             <Card className={`bg-gradient-to-br ${
                               kpis?.averageScore && kpis.averageScore >= 80 ? 'from-green-50 to-green-100 border-green-200' :
                               kpis?.averageScore && kpis.averageScore >= 70 ? 'from-blue-50 to-blue-100 border-blue-200' :
                               'from-orange-50 to-orange-100 border-orange-200'
                             } hover:shadow-lg transition-all duration-300 cursor-help`}>
                               <CardContent className="p-5">
                                 <div className="flex items-center justify-between mb-3">
                                   <div className={`p-2 rounded-lg ${
                                     kpis?.averageScore && kpis.averageScore >= 80 ? 'bg-green-200' :
                                     kpis?.averageScore && kpis.averageScore >= 70 ? 'bg-blue-200' :
                                     'bg-orange-200'
                                   }`}>
                                     <Award className={`h-6 w-6 ${
                                       kpis?.averageScore && kpis.averageScore >= 80 ? 'text-green-700' :
                                       kpis?.averageScore && kpis.averageScore >= 70 ? 'text-blue-700' :
                                       'text-orange-700'
                                     }`} />
                                   </div>
                                   {kpis?.averageScore && (
                                     <Badge className={`${
                                       kpis.averageScore >= 80 ? 'bg-green-500' :
                                       kpis.averageScore >= 70 ? 'bg-blue-500' :
                                       'bg-orange-500'
                                     } text-white`}>
                                       {kpis.averageScore >= 80 ? 'Excelente' :
                                        kpis.averageScore >= 70 ? 'Bueno' : 'Mejorable'}
                                     </Badge>
                                   )}
                                 </div>
                                 <div className={`text-3xl font-bold mb-1 ${
                                   kpis?.averageScore && kpis.averageScore >= 80 ? 'text-green-700' :
                                   kpis?.averageScore && kpis.averageScore >= 70 ? 'text-blue-700' :
                                   'text-orange-700'
                                 }`}>
                                   {kpis?.averageScore?.toFixed(1) || '0.0'}
                                 </div>
                                 <div className={`text-sm font-medium ${
                                   kpis?.averageScore && kpis.averageScore >= 80 ? 'text-green-600' :
                                   kpis?.averageScore && kpis.averageScore >= 70 ? 'text-blue-600' :
                                   'text-orange-600'
                                 }`}>
                                   Promedio General
                                 </div>
                                 <div className={`text-xs mt-1 ${
                                   kpis?.averageScore && kpis.averageScore >= 80 ? 'text-green-500' :
                                   kpis?.averageScore && kpis.averageScore >= 70 ? 'text-blue-500' :
                                   'text-orange-500'
                                 }`}>
                                   Rendimiento académico
                                 </div>
                               </CardContent>
                             </Card>
                           </TooltipTrigger>
                           <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
                             Promedio general de todos los exámenes completados en el período seleccionado.{" "}
                             Se calcula como el promedio de todos los puntajes obtenidos por los estudiantes en sus exámenes,{" "}
                             expresado en porcentaje (0-100%). Este indicador refleja el rendimiento académico general según los filtros aplicados.
                           </TooltipContent>
                         </Tooltip>

                         <Tooltip>
                           <TooltipTrigger asChild>
                             <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 cursor-help">
                               <CardContent className="p-5">
                                 <div className="flex items-center justify-between mb-3">
                                   <div className="p-2 bg-purple-200 rounded-lg">
                                     <FileText className="h-6 w-6 text-purple-700" />
                                   </div>
                                   {kpis?.examAttempts && kpis.examAttempts > 0 && (
                                     <Badge className={`${
                                       kpis.examAttempts >= 500 ? 'bg-green-500' :
                                       kpis.examAttempts >= 200 ? 'bg-yellow-500' :
                                       'bg-red-500'
                                     } text-white`}>
                                       {kpis.examAttempts >= 500 ? 'Alto' :
                                        kpis.examAttempts >= 200 ? 'Medio' : 'Bajo'}
                                     </Badge>
                                   )}
                                 </div>
                                 <div className="text-3xl font-bold text-purple-700 mb-1">
                                   {kpis?.examAttempts?.toLocaleString('es-CO') || '0'}
                                 </div>
                                 <div className="text-sm font-medium text-purple-600">Exámenes Realizados</div>
                                 <div className="text-xs text-purple-500 mt-1">Actividad de evaluación</div>
                               </CardContent>
                             </Card>
                           </TooltipTrigger>
                           <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
                             Total de intentos de exámenes completados durante el período seleccionado.{" "}
                             Incluye todos los exámenes que han sido iniciados y finalizados por los estudiantes,{" "}
                             según los filtros aplicados. Cada intento cuenta como un examen realizado,{" "}
                             por lo que si un estudiante presenta el mismo examen múltiples veces, cada intento se cuenta por separado.
                           </TooltipContent>
                         </Tooltip>
                       </div>
                     </TooltipProvider>
                   )}

                   {/* Filtros de Análisis - Filtran todos los datos de analytics y gráficos */}
                   <Card className="border-2 border-blue-100">
                     <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <Filter className="h-5 w-5 text-blue-600" />
                           <div>
                             <CardTitle className="flex items-center gap-2">
                               <span>Filtros de Análisis</span>
                             </CardTitle>
                             <p className="text-xs text-gray-600 mt-1">
                               Los filtros aplican a todos los KPIs, gráficos e informes de esta pestaña
                             </p>
                           </div>
                         </div>
                         <Badge variant="outline" className="bg-white">
                           {[
                             filterSchoolId !== 'all',
                             filterCourseId !== 'all',
                             filterGrade !== 'all',
                             filterCompetencyId !== 'all',
                             filterMinAge || filterMaxAge,
                             filterGender !== 'all',
                             filterSocioeconomicStratum !== 'all'
                           ].filter(Boolean).length} filtros activos
                         </Badge>
                       </div>
                     </CardHeader>
                     <CardContent className="p-6">
                       <Accordion type="multiple" defaultValue={["academic"]} className="w-full">
                         {/* Filtros Académicos */}
                         <AccordionItem value="academic">
                           <AccordionTrigger className="hover:no-underline">
                             <div className="flex items-center gap-2">
                               <BookOpen className="h-4 w-4 text-blue-600" />
                               <span className="font-semibold">Filtros Académicos</span>
                             </div>
                           </AccordionTrigger>
                           <AccordionContent>
                             <div className={`grid grid-cols-1 md:grid-cols-${session?.user?.role === 'teacher_admin' ? '4' : '3'} gap-4 pt-4`}>
                               {/* Solo mostrar filtro de colegio para teacher_admin */}
                               {session?.user?.role === 'teacher_admin' && (
                                 <div>
                                   <Label className="text-sm font-medium">Colegio</Label>
                                   <Select value={filterSchoolId} onValueChange={setFilterSchoolId}>
                                     <SelectTrigger>
                                       <SelectValue placeholder="Todos" />
                                     </SelectTrigger>
                                     <SelectContent>
                                       <SelectItem value="all">Todos</SelectItem>
                                       {safeSchools.map(s => (
                                         <SelectItem key={s.id} value={s.id || ''}>{s.name}</SelectItem>
                                       ))}
                                     </SelectContent>
                                   </Select>
                                 </div>
                               )}
                               <div>
                                 <Label className="text-sm font-medium">Curso</Label>
                                 <Select value={filterCourseId} onValueChange={setFilterCourseId}>
                                   <SelectTrigger>
                                     <SelectValue placeholder="Todos" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="all">Todos</SelectItem>
                                     {(filterSchoolId === 'all' ? safeCourses : safeFilteredCourses).map(c => (
                                       <SelectItem key={c.id} value={c.id || ''}>{c.title}</SelectItem>
                                     ))}
                                   </SelectContent>
                                 </Select>
                               </div>
                               <div>
                                 <Label className="text-sm font-medium">Año Escolar</Label>
                                 <Select value={filterGrade} onValueChange={setFilterGrade}>
                                   <SelectTrigger>
                                     <SelectValue placeholder="Todos" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="all">Todos</SelectItem>
                                     {['sexto','septimo','octavo','noveno','decimo','once'].map(g => (
                                       <SelectItem key={g} value={g}>{g.charAt(0).toUpperCase()+g.slice(1)}</SelectItem>
                                     ))}
                                   </SelectContent>
                                 </Select>
                               </div>
                               <div>
                                 <Label className="text-sm font-medium">Competencia</Label>
                                 <Select value={filterCompetencyId} onValueChange={setFilterCompetencyId}>
                                   <SelectTrigger>
                                     <SelectValue placeholder="Todas" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="all">Todas</SelectItem>
                                     {safeCompetencies.map(comp => (
                                       <SelectItem key={comp.id} value={comp.id || ''}>{comp.displayName}</SelectItem>
                                     ))}
                                   </SelectContent>
                                 </Select>
                               </div>
                             </div>
                           </AccordionContent>
                         </AccordionItem>

                         {/* Filtros Demográficos */}
                         <AccordionItem value="demographic">
                           <AccordionTrigger className="hover:no-underline">
                             <div className="flex items-center gap-2">
                               <Users className="h-4 w-4 text-green-600" />
                               <span className="font-semibold">Filtros Demográficos</span>
                             </div>
                           </AccordionTrigger>
                           <AccordionContent>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                               <div>
                                 <Label className="text-sm font-medium">Rango de Edad</Label>
                                 <div className="flex gap-2 mt-1">
                                   <Input 
                                     value={filterMinAge} 
                                     onChange={(e) => setFilterMinAge(e.target.value)} 
                                     placeholder="Mín: 12" 
                                     type="number"
                                     className="flex-1"
                                   />
                                   <span className="self-center text-gray-400">-</span>
                                   <Input 
                                     value={filterMaxAge} 
                                     onChange={(e) => setFilterMaxAge(e.target.value)} 
                                     placeholder="Máx: 18" 
                                     type="number"
                                     className="flex-1"
                                   />
                                 </div>
                               </div>
                               <div>
                                 <Label className="text-sm font-medium">Género</Label>
                                 <Select value={filterGender} onValueChange={setFilterGender}>
                                   <SelectTrigger>
                                     <SelectValue placeholder="Todos" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="all">Todos</SelectItem>
                                     <SelectItem value="masculino">Masculino</SelectItem>
                                     <SelectItem value="femenino">Femenino</SelectItem>
                                     <SelectItem value="otro">Otro</SelectItem>
                                   </SelectContent>
                                 </Select>
                               </div>
                               <div>
                                 <Label className="text-sm font-medium">Estrato Socioeconómico</Label>
                                 <Select value={filterSocioeconomicStratum} onValueChange={setFilterSocioeconomicStratum}>
                                   <SelectTrigger>
                                     <SelectValue placeholder="Todos" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="all">Todos</SelectItem>
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
                           </AccordionContent>
                         </AccordionItem>

                         {/* Comparación y Períodos */}
                         <AccordionItem value="comparison">
                           <AccordionTrigger className="hover:no-underline">
                             <div className="flex items-center gap-2">
                               <TrendingUp className="h-4 w-4 text-purple-600" />
                               <span className="font-semibold">Comparación y Períodos</span>
                             </div>
                           </AccordionTrigger>
                           <AccordionContent>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                               <div>
                                 <Label className="text-sm font-medium">Período de Análisis</Label>
                                 <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                   <SelectTrigger>
                                     <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="1m">Último mes</SelectItem>
                                     <SelectItem value="3m">Últimos 3 meses</SelectItem>
                                     <SelectItem value="6m">Últimos 6 meses</SelectItem>
                                     <SelectItem value="1y">Último año</SelectItem>
                                   </SelectContent>
                                 </Select>
                               </div>
                               <div>
                                 <Label className="text-sm font-medium">Comparar con</Label>
                                 <Select value={comparePeriod} onValueChange={setComparePeriod}>
                                   <SelectTrigger>
                                     <SelectValue placeholder="Sin comparación" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="none">Sin comparación</SelectItem>
                                     <SelectItem value="previous">Período anterior</SelectItem>
                                     <SelectItem value="last_year">Mismo período año pasado</SelectItem>
                                     <SelectItem value="custom">Período personalizado</SelectItem>
                                   </SelectContent>
                                 </Select>
                               </div>
                             </div>
                           </AccordionContent>
                         </AccordionItem>
                       </Accordion>
                       
                       {/* Botones de Acción */}
                       <div className="mt-6 flex flex-wrap gap-3 justify-between items-center pt-4 border-t">
                         <div className="flex gap-2">
                           <Button 
                             onClick={handleSearch} 
                             className="bg-blue-600 hover:bg-blue-700 text-white"
                             size="lg"
                           >
                             <Search className="h-4 w-4 mr-2" />
                             Aplicar Filtros
                           </Button>
                           <Button 
                             onClick={() => {
                               setFilterSchoolId('all')
                               setFilterCourseId('all')
                               setFilterGrade('all')
                               setFilterCompetencyId('all')
                               setFilterMinAge('')
                               setFilterMaxAge('')
                               setFilterGender('all')
                               setFilterSocioeconomicStratum('all')
                               setComparePeriod('none')
                             }}
                             variant="outline"
                             size="lg"
                           >
                             <X className="h-4 w-4 mr-2" />
                             Limpiar Filtros
                           </Button>
                         </div>
                         <Button 
                           onClick={exportFullReport}
                           disabled={exportingBulkReport}
                           className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                           size="lg"
                         >
                           {exportingBulkReport ? (
                             <>
                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                               Generando...
                             </>
                           ) : (
                             <>
                               <Download className="h-4 w-4 mr-2" />
                               Exportar Reporte Masivo PDF
                             </>
                           )}
                         </Button>
                       </div>
                     </CardContent>
                   </Card>

            {/* Vista de Estudiantes con Métricas Individuales */}
            <Card className="border-2 border-indigo-100">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <span>Vista de Estudiantes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Accordion type="multiple" defaultValue={["student-list"]} className="w-full">
                  {/* Lista de Estudiantes con Métricas */}
                  <AccordionItem value="student-list">
                    <div className="flex items-center justify-between pr-4">
                      <AccordionTrigger className="hover:no-underline flex-1">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-indigo-600" />
                          <span className="font-semibold">Lista de Estudiantes con Métricas</span>
                        </div>
                      </AccordionTrigger>
                      <Button
                        onClick={exportStudentsCSV}
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        disabled={studentsMetricsLoading || studentsMetrics.length === 0}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Excel
                      </Button>
                    </div>
                    <AccordionContent>
                      <div className="pt-4 space-y-4">
                        {/* Filtros rápidos para estudiantes */}
                        <div className="flex gap-2 flex-wrap">
                          <Input
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-xs"
                          />
                          <Select value={filterGrade} onValueChange={setFilterGrade}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Todos los grados" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos los grados</SelectItem>
                              {['sexto','septimo','octavo','noveno','decimo','once'].map(g => (
                                <SelectItem key={g} value={g}>{g.charAt(0).toUpperCase()+g.slice(1)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Tabla de estudiantes con métricas */}
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Estudiante</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Grado</TableHead>
                                <TableHead>Exámenes</TableHead>
                                <TableHead>Promedio</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {studentsMetricsLoading ? (
                                <TableRow>
                                  <TableCell colSpan={7} className="text-center py-8">
                                    <div className="flex items-center justify-center">
                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#73A2D3]"></div>
                                      <span className="ml-2 text-gray-600">Cargando métricas...</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : studentsMetricsError ? (
                                <TableRow>
                                  <TableCell colSpan={7} className="text-center text-red-600 py-8">
                                    {studentsMetricsError}
                                  </TableCell>
                                </TableRow>
                              ) : (() => {
                                // Filtrar estudiantes según los filtros aplicados
                                let filteredStudents = studentsMetrics.filter((student: any) => {
                                  // Búsqueda por nombre o email (más flexible)
                                  if (searchTerm) {
                                    const searchLower = searchTerm.toLowerCase().trim()
                                    const nameMatch = student.studentName?.toLowerCase().includes(searchLower) || false
                                    const emailMatch = student.studentEmail?.toLowerCase().includes(searchLower) || false
                                    // También buscar por partes del nombre (firstName, lastName)
                                    const nameParts = student.studentName?.toLowerCase().split(' ') || []
                                    const namePartsMatch = nameParts.some((part: string) => part.includes(searchLower))
                                    
                                    if (!nameMatch && !emailMatch && !namePartsMatch) {
                                      return false
                                    }
                                  }
                                  if (filterGrade !== 'all' && student.academicGrade !== filterGrade) return false
                                  return true
                                })

                                if (filteredStudents.length === 0) {
                                  return (
                                    <TableRow>
                                      <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-8">
                                        {studentsMetrics.length === 0 
                                          ? 'No hay estudiantes registrados' 
                                          : 'No se encontraron estudiantes con los filtros seleccionados'}
                                      </TableCell>
                                    </TableRow>
                                  )
                                }

                                // Paginación
                                const totalPages = Math.ceil(filteredStudents.length / studentsPerPage)
                                const startIndex = (studentListPage - 1) * studentsPerPage
                                const endIndex = startIndex + studentsPerPage
                                const paginatedStudents = filteredStudents.slice(startIndex, endIndex)

                                return (
                                  <>
                                    {paginatedStudents.map((student: any) => {
                                  const getStatusBadge = (status: string) => {
                                    switch (status) {
                                      case 'excelente':
                                        return <Badge className="bg-green-500 text-white">Excelente</Badge>
                                      case 'bueno':
                                        return <Badge className="bg-blue-500 text-white">Bueno</Badge>
                                      case 'mejorable':
                                        return <Badge className="bg-yellow-500 text-white">Mejorable</Badge>
                                      case 'requiere_atencion':
                                        return <Badge className="bg-red-500 text-white">Requiere Atención</Badge>
                                      default:
                                        return <Badge className="bg-gray-500 text-white">Sin datos</Badge>
                                    }
                                  }

                                  const getScoreBadge = (score: number) => {
                                    if (score >= 80) return 'bg-green-500 text-white'
                                    if (score >= 70) return 'bg-blue-500 text-white'
                                    if (score >= 60) return 'bg-yellow-500 text-white'
                                    return 'bg-red-500 text-white'
                                  }

                                  return (
                                    <TableRow key={student.studentId} className="hover:bg-gray-50 transition-colors">
                                      <TableCell className="font-medium">
                                        {student.studentName}
                                      </TableCell>
                                      <TableCell>{student.studentEmail}</TableCell>
                                      <TableCell>
                                        {student.academicGrade ? 
                                          student.academicGrade.charAt(0).toUpperCase() + student.academicGrade.slice(1) 
                                          : 'N/A'}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="font-semibold">
                                          {student.totalExams || 0}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Badge className={getScoreBadge(student.averageScore || 0)}>
                                          {(student.averageScore || 0).toFixed(1)}%
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        {getStatusBadge(student.status || 'bueno')}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            console.log('Opening modal for student:', student.studentId, student.studentName)
                                            setSelectedStudentId(student.studentId)
                                            setIsStudentModalOpen(true)
                                          }}
                                          className="hover:bg-blue-50 hover:text-blue-600"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                                
                                {/* Controles de Paginación */}
                                {filteredStudents.length > studentsPerPage && (
                                  <TableRow>
                                    <TableCell colSpan={7} className="py-4">
                                      <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-600">
                                          Mostrando {startIndex + 1} - {Math.min(endIndex, filteredStudents.length)} de {filteredStudents.length} estudiantes
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setStudentListPage(p => Math.max(1, p - 1))}
                                            disabled={studentListPage === 1}
                                          >
                                            <ChevronLeft className="h-4 w-4" />
                                          </Button>
                                          <div className="text-sm text-gray-600">
                                            Página {studentListPage} de {totalPages}
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setStudentListPage(p => Math.min(totalPages, p + 1))}
                                            disabled={studentListPage === totalPages}
                                          >
                                            <ChevronRight className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                                  </>
                                )
                              })()}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Estudiantes que Requieren Atención */}
                  <AccordionItem value="at-risk">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="font-semibold">Estudiantes que Requieren Atención</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-4">
                        {studentsMetricsLoading ? (
                          <div className="py-8 text-center">Cargando...</div>
                        ) : (() => {
                          const atRiskStudents = studentsMetrics.filter((student: any) => 
                            student.status === 'requiere_atencion' || 
                            (student.riskFactors && student.riskFactors.length > 0)
                          )

                          if (atRiskStudents.length === 0) {
                            return (
                              <div className="text-center py-8">
                                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                                <p className="font-semibold text-green-700">¡Excelente!</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  No hay estudiantes que requieran atención inmediata
                                </p>
                              </div>
                            )
                          }

                          // Paginación para estudiantes en riesgo
                          const totalAtRiskPages = Math.ceil(atRiskStudents.length / studentsPerPage)
                          const startAtRiskIndex = (atRiskPage - 1) * studentsPerPage
                          const endAtRiskIndex = startAtRiskIndex + studentsPerPage
                          const paginatedAtRisk = atRiskStudents.slice(startAtRiskIndex, endAtRiskIndex)

                          return (
                            <>
                              <div className="space-y-3">
                                {paginatedAtRisk.map((student: any) => (
                                  <Card key={student.studentId} className="border-2 border-red-200 bg-red-50">
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-semibold text-gray-800">{student.studentName}</h4>
                                            <Badge className="bg-red-500 text-white">Requiere Atención</Badge>
                                          </div>
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                                            <div>
                                              <span className="text-gray-600">Promedio:</span>
                                              <div className="font-semibold text-red-700">{(student.averageScore || 0).toFixed(1)}%</div>
                                            </div>
                                            <div>
                                              <span className="text-gray-600">Exámenes:</span>
                                              <div className="font-semibold">{student.totalExams || 0}</div>
                                            </div>
                                            <div>
                                              <span className="text-gray-600">Tasa Aprobación:</span>
                                              <div className="font-semibold text-red-700">{(student.passRate || 0).toFixed(1)}%</div>
                                            </div>
                                            <div>
                                              <span className="text-gray-600">Cursos Activos:</span>
                                              <div className="font-semibold">{student.activeCourses || 0}</div>
                                            </div>
                                          </div>
                                          {student.riskFactors && student.riskFactors.length > 0 && (
                                            <div className="mt-2">
                                              <div className="text-xs font-semibold text-red-700 mb-1">Factores de Riesgo:</div>
                                              <ul className="text-xs text-red-600 space-y-1">
                                                {student.riskFactors.map((factor: string, idx: number) => (
                                                  <li key={idx}>• {factor}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedStudentId(student.studentId)
                                            setIsStudentModalOpen(true)
                                          }}
                                          className="hover:bg-red-100 hover:text-red-600"
                                        >
                                          <Eye className="h-4 w-4 mr-1" />
                                          Ver detalles
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                              {atRiskStudents.length > studentsPerPage && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                  <div className="text-sm text-gray-600">
                                    Mostrando {startAtRiskIndex + 1} - {Math.min(endAtRiskIndex, atRiskStudents.length)} de {atRiskStudents.length} estudiantes
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setAtRiskPage(p => Math.max(1, p - 1))}
                                      disabled={atRiskPage === 1}
                                    >
                                      <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="text-sm text-gray-600">
                                      Página {atRiskPage} de {totalAtRiskPages}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setAtRiskPage(p => Math.min(totalAtRiskPages, p + 1))}
                                      disabled={atRiskPage === totalAtRiskPages}
                                    >
                                      <ChevronRight className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Análisis de Rendimiento */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-gray-700" />
                  <span>Análisis de Rendimiento</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Accordion type="multiple" defaultValue={["performance"]} className="w-full">
                  {/* Análisis Temporal - Evolución de Rendimiento */}
                  {safeReportSeries.length > 0 && (
                    <AccordionItem value="temporal">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">Evolución Temporal del Rendimiento</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                          {/* Evolución Mensual de Promedio */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Promedio Mensual</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ResponsiveContainer width="100%" height={250}>
                                <RechartsLineChart data={safeReportSeries}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                  <XAxis 
                                    dataKey="period" 
                                    tick={{ fontSize: 11 }}
                                    tickFormatter={(value) => {
                                      const [year, month] = value.split('-')
                                      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
                                      return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`
                                    }}
                                  />
                                  <YAxis 
                                    domain={[0, 100]}
                                    tick={{ fontSize: 11 }}
                                    tickFormatter={(value) => `${value}%`}
                                  />
                                  <RechartsTooltip 
                                    formatter={(value: any) => [`${value}%`, 'Promedio']}
                                    labelFormatter={(label: string) => {
                                      const [year, month] = label.split('-')
                                      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
                                      return `${monthNames[parseInt(month) - 1]} ${year}`
                                    }}
                                  />
                                  <Line 
                                    type="monotone" 
                                    dataKey="avgScore" 
                                    name="Promedio" 
                                    stroke="#73A2D3" 
                                    strokeWidth={2.5}
                                    dot={{ fill: '#73A2D3', r: 4 }}
                                    activeDot={{ r: 6 }}
                                  />
                                </RechartsLineChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>

                          {/* Evolución de Tasa de Aprobación */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Tasa de Aprobación Mensual</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ResponsiveContainer width="100%" height={250}>
                                <RechartsLineChart data={safeReportSeries}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                  <XAxis 
                                    dataKey="period" 
                                    tick={{ fontSize: 11 }}
                                    tickFormatter={(value) => {
                                      const [year, month] = value.split('-')
                                      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
                                      return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`
                                    }}
                                  />
                                  <YAxis 
                                    domain={[0, 100]}
                                    tick={{ fontSize: 11 }}
                                    tickFormatter={(value) => `${value}%`}
                                  />
                                  <RechartsTooltip 
                                    formatter={(value: any) => [`${value}%`, 'Tasa de Aprobación']}
                                    labelFormatter={(label: string) => {
                                      const [year, month] = label.split('-')
                                      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
                                      return `${monthNames[parseInt(month) - 1]} ${year}`
                                    }}
                                  />
                                  <Line 
                                    type="monotone" 
                                    dataKey="passRate" 
                                    name="Tasa de Aprobación" 
                                    stroke="#22c55e" 
                                    strokeWidth={2.5}
                                    dot={{ fill: '#22c55e', r: 4 }}
                                    activeDot={{ r: 6 }}
                                  />
                                </RechartsLineChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>

                          {/* Comparación Período Actual vs Anterior */}
                          {safeReportSeries.length >= 2 && (
                            <Card className="lg:col-span-2">
                              <CardHeader>
                                <CardTitle className="text-base">Comparación Período Actual vs Anterior</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {(() => {
                                    const currentPeriod = safeReportSeries[safeReportSeries.length - 1]
                                    const previousPeriod = safeReportSeries[safeReportSeries.length - 2]
                                    
                                    if (!currentPeriod || !previousPeriod) return null
                                    
                                    const avgScoreChange = (currentPeriod.avgScore || 0) - (previousPeriod.avgScore || 0)
                                    const passRateChange = (currentPeriod.passRate || 0) - (previousPeriod.passRate || 0)
                                    const attemptsChange = (currentPeriod.attempts || 0) - (previousPeriod.attempts || 0)

                                    return (
                                      <>
                                        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-blue-600 font-medium">Promedio</span>
                                            {avgScoreChange >= 0 ? (
                                              <TrendingUp className="h-4 w-4 text-green-600" />
                                            ) : (
                                              <TrendingDown className="h-4 w-4 text-red-600" />
                                            )}
                                          </div>
                                          <div className="text-2xl font-bold text-blue-700">
                                            {(currentPeriod.avgScore || 0).toFixed(1)}%
                                          </div>
                                          <div className={`text-xs mt-1 ${
                                            avgScoreChange >= 0 ? 'text-green-600' : 'text-red-600'
                                          }`}>
                                            {avgScoreChange >= 0 ? '+' : ''}{avgScoreChange.toFixed(1)}% vs período anterior
                                          </div>
                                        </div>

                                        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-green-600 font-medium">Tasa Aprobación</span>
                                            {passRateChange >= 0 ? (
                                              <TrendingUp className="h-4 w-4 text-green-600" />
                                            ) : (
                                              <TrendingDown className="h-4 w-4 text-red-600" />
                                            )}
                                          </div>
                                          <div className="text-2xl font-bold text-green-700">
                                            {(currentPeriod.passRate || 0).toFixed(1)}%
                                          </div>
                                          <div className={`text-xs mt-1 ${
                                            passRateChange >= 0 ? 'text-green-600' : 'text-red-600'
                                          }`}>
                                            {passRateChange >= 0 ? '+' : ''}{passRateChange.toFixed(1)}% vs período anterior
                                          </div>
                                        </div>

                                        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-purple-600 font-medium">Exámenes Realizados</span>
                                            {attemptsChange >= 0 ? (
                                              <TrendingUp className="h-4 w-4 text-green-600" />
                                            ) : (
                                              <TrendingDown className="h-4 w-4 text-red-600" />
                                            )}
                                          </div>
                                          <div className="text-2xl font-bold text-purple-700">
                                            {currentPeriod.attempts || 0}
                                          </div>
                                          <div className={`text-xs mt-1 ${
                                            attemptsChange >= 0 ? 'text-green-600' : 'text-red-600'
                                          }`}>
                                            {attemptsChange >= 0 ? '+' : ''}{attemptsChange} vs período anterior
                                          </div>
                                        </div>
                                      </>
                                    )
                                  })()}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Gráficos de Rendimiento */}
                  <AccordionItem value="performance">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <LineChart className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold">Gráficos de Rendimiento</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
              {/* Rendimiento por Materia */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <LineChart className="h-5 w-5" />
                    <span>Evolución por Competencia</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {safeGradeSeries.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <RechartsLineChart data={safeGradeSeries} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                        <XAxis 
                          dataKey="period" 
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          tickFormatter={(value) => {
                            const [year, month] = value.split('-')
                            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
                            return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`
                          }}
                        />
                        <YAxis 
                          domain={[0, 100]}
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          labelFormatter={(label: string) => {
                            const [year, month] = label.split('-')
                            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
                            return `${monthNames[parseInt(month) - 1]} ${year}`
                          }}
                          formatter={(value: any) => [`${Number(value).toFixed(1)}%`, '']}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="line"
                        />
                        {Object.keys(safeGradeSeries[0] || {}).filter(k => k !== 'period' && k !== 'avgScore' && k !== 'passRate' && k !== 'attempts').map((key, idx) => (
                          <Line 
                            key={key} 
                            type="monotone" 
                            dataKey={key} 
                            stroke={["#C00102","#73A2D3","#22c55e","#f97316","#8b5cf6","#ec4899","#14b8a6"][idx % 7]} 
                            strokeWidth={2.5}
                            dot={{ fill: ["#C00102","#73A2D3","#22c55e","#f97316","#8b5cf6","#ec4899","#14b8a6"][idx % 7], r: 3 }}
                            activeDot={{ r: 5 }}
                          />
                        ))}
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>No hay datos disponibles</p>
                        <p className="text-xs text-gray-400 mt-1">Ajusta los filtros o espera a que haya actividad</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Distribución de Notas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Distribución de Calificaciones</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {safeGradeDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart 
                        data={safeGradeDistribution} 
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
                        <YAxis 
                          type="category" 
                          dataKey="rango" 
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          width={80}
                        />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: any) => [`${value} estudiantes`, '']}
                        />
                        <Bar 
                          dataKey="estudiantes" 
                          radius={[0, 8, 8, 0]}
                        >
                          {safeGradeDistribution.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={['#ef4444','#f97316','#eab308','#22c55e'][index % 4]} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>No hay datos disponibles</p>
                        <p className="text-xs text-gray-400 mt-1">Ajusta los filtros o espera a que haya actividad</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actividad Diaria */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Actividad por Hora del Día</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {safeHourlyActivity.length > 0 ? (
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart 
                        data={safeHourlyActivity}
                        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorEstudiantes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#73A2D3" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#73A2D3" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                        <XAxis 
                          dataKey="hora" 
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          tickFormatter={(value) => `${value}:00`}
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                        />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          labelFormatter={(label: string) => `Hora: ${label}:00`}
                          formatter={(value: any) => [`${value} estudiantes`, '']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="estudiantes" 
                          stroke="#73A2D3" 
                          strokeWidth={2}
                          fill="url(#colorEstudiantes)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      <div className="text-center">
                        <Activity className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>No hay datos disponibles</p>
                        <p className="text-xs text-gray-400 mt-1">Ajusta los filtros o espera a que haya actividad</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ranking de Instituciones - Solo una vez, sin duplicar */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Ranking de Instituciones</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {safeSchoolRanking.length > 0 ? (
                    <Tabs defaultValue="top5" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="top5">Top 5</TabsTrigger>
                        <TabsTrigger value="completo">Lista Completa ({safeSchoolRanking.length})</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="top5" className="mt-4">
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart
                            data={safeSchoolRanking.slice(0, 5).map((r, idx) => {
                              const school = safeSchools.find(s => s.id === r.schoolId)
                              const schoolColor = school?.themePrimary 
                                ? hexToHsl(school.themePrimary)
                                : 'hsl(262 83% 58%)' // Color por defecto
                              return {
                                nombre: school?.name || r.schoolId || 'Sin nombre',
                                promedio: r.avgScore || 0,
                                rank: idx + 1,
                                color: schoolColor
                              }
                            })}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                          >
                            <defs>
                              {safeSchoolRanking.slice(0, 5).map((r, idx) => {
                                const school = safeSchools.find(s => s.id === r.schoolId)
                                const schoolColor = school?.themePrimary 
                                  ? hexToHsl(school.themePrimary)
                                  : 'hsl(262 83% 58%)'
                                return (
                                  <linearGradient key={`gradient-${idx}`} id={`colorPromedio-${idx}`} x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor={`hsl(${schoolColor})`} stopOpacity={0.9}/>
                                    <stop offset="100%" stopColor={`hsl(${schoolColor})`} stopOpacity={0.7}/>
                                  </linearGradient>
                                )
                              })}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                            <XAxis 
                              type="number" 
                              domain={[0, 100]}
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              tickFormatter={(value) => `${value}`}
                            />
                            <YAxis 
                              type="category" 
                              dataKey="nombre" 
                              tick={{ fontSize: 11, fill: '#6b7280' }}
                              width={90}
                            />
                            <RechartsTooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                              }}
                              formatter={(value: any) => [`${Number(value).toFixed(1)}`, 'Promedio']}
                            />
                            <Bar 
                              dataKey="promedio" 
                              radius={[0, 8, 8, 0]}
                            >
                              {safeSchoolRanking.slice(0, 5).map((_, idx) => (
                                <Cell key={`cell-${idx}`} fill={`url(#colorPromedio-${idx})`} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </TabsContent>
                      
                      <TabsContent value="completo" className="mt-4">
                        <div className="max-h-[320px] overflow-y-auto">
                          <div className="space-y-2">
                            {safeSchoolRanking.map((r, idx) => {
                              const school = safeSchools.find(s => s.id === r.schoolId)
                              const schoolName = school?.name || r.schoolId || 'Sin nombre'
                              const schoolLogo = school?.logoUrl
                              const promedio = r.avgScore || 0
                              const position = idx + 1
                              
                              // Colores según posición
                              let positionColor = 'text-gray-600'
                              let bgColor = 'bg-gray-50'
                              if (position === 1) {
                                positionColor = 'text-yellow-600'
                                bgColor = 'bg-yellow-50'
                              } else if (position === 2) {
                                positionColor = 'text-gray-400'
                                bgColor = 'bg-gray-50'
                              } else if (position === 3) {
                                positionColor = 'text-amber-600'
                                bgColor = 'bg-amber-50'
                              }
                              
                              return (
                                <div 
                                  key={r.schoolId || idx} 
                                  className={`flex items-center justify-between p-3 rounded-lg border ${bgColor} hover:shadow-sm transition-shadow`}
                                >
                                  <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${positionColor} ${position <= 3 ? 'bg-white border-2' : 'bg-white border border-gray-200'}`}>
                                      {position <= 3 ? (
                                        position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'
                                      ) : (
                                        position
                                      )}
                                    </div>
                                    {schoolLogo && (
                                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white border border-gray-200 p-1.5 flex items-center justify-center">
                                        <img 
                                          src={schoolLogo} 
                                          alt={schoolName}
                                          className="w-full h-full object-contain"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none'
                                          }}
                                        />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-gray-900 truncate">{schoolName}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-gray-900">{promedio.toFixed(1)}</div>
                                      <div className="text-xs text-gray-500">Promedio</div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>No hay datos disponibles</p>
                        <p className="text-xs text-gray-400 mt-1">Ajusta los filtros o espera a que haya actividad</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                </Accordion>
              </CardContent>
            </Card>

            {/* Sección de Informes con Acordeones */}
            {/* Informes Detallados - Tablas con datos agregados por curso/competencia */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-700" />
                    <span>Informes Detallados</span>
                  </CardTitle>
                  <p className="text-xs text-gray-600 mt-1 ml-7">
                    Tablas con métricas agregadas por curso y competencia (filtradas según los filtros aplicados)
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <Accordion type="multiple" defaultValue={["performance-report"]} className="w-full">
                  {/* Informe de Rendimiento */}
                  <AccordionItem value="performance-report">
                    <div className="flex items-center justify-between pr-4">
                      <AccordionTrigger className="hover:no-underline flex-1">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">Informe de Rendimiento por Curso y Competencia</span>
                        </div>
                      </AccordionTrigger>
                      <Button 
                        onClick={exportRowsToCSV}
                        variant="outline" 
                        size="sm"
                        className="ml-2"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Excel
                      </Button>
                    </div>
                    <AccordionContent>
                      <div className="pt-4">
                        {analyticsLoading ? (
                          <div className="py-8 text-center">Cargando...</div>
                        ) : analyticsError ? (
                          <div className="py-8 text-center text-red-600">{analyticsError}</div>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Colegio</TableHead>
                                  <TableHead>Curso</TableHead>
                                  <TableHead>Competencia</TableHead>
                                  <TableHead>Intentos</TableHead>
                                  <TableHead>Promedio</TableHead>
                                  <TableHead>Aprobación</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {safeReportRows.map((r, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell>{(safeSchools.find(s=>s.id===r.schoolId)?.name)||'NA'}</TableCell>
                                    <TableCell>{(safeCourses.find(c=>c.id===r.courseId)?.title)||'NA'}</TableCell>
                                    <TableCell>{(safeCompetencies.find(c=>c.id===r.competencyId)?.displayName)||'NA'}</TableCell>
                                    <TableCell>{r.attempts || 0}</TableCell>
                                    <TableCell>{(r.avgScore || 0).toFixed(1)}%</TableCell>
                                    <TableCell>{(r.passRate || 0).toFixed(1)}%</TableCell>
                                  </TableRow>
                                ))}
                                {reportRows.length === 0 && (
                                  <TableRow>
                                    <TableCell colSpan={6} className="text-center text-sm text-gray-500">Sin datos para los filtros seleccionados</TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Informe por Competencia y Dificultad */}
                  <AccordionItem value="competency-difficulty">
                    <div className="flex items-center justify-between pr-4">
                      <AccordionTrigger className="hover:no-underline flex-1">
                        <div className="flex items-center gap-2">
                          <PieChart className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold">Análisis por Competencia y Dificultad</span>
                        </div>
                      </AccordionTrigger>
                      <Button 
                        onClick={exportCompCSV}
                        variant="outline" 
                        size="sm"
                        className="ml-2"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Excel
                      </Button>
                    </div>
                    <AccordionContent>
                      <div className="pt-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Competencia</TableHead>
                              <TableHead>Dificultad</TableHead>
                              <TableHead>Intentos</TableHead>
                              <TableHead>Promedio</TableHead>
                              <TableHead>Aprobación</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {safeCompReportRows.map((r:any, idx:number) => (
                              <TableRow key={idx}>
                                <TableCell>{(safeCompetencies.find(c=>c.id===r.competencyId)?.displayName)||'NA'}</TableCell>
                                <TableCell>{r.difficultyLevel || 'N/A'}</TableCell>
                                <TableCell>{r.attempts || 0}</TableCell>
                                <TableCell>{(r.avgScore || 0).toFixed(1)}%</TableCell>
                                <TableCell>{(r.passRate || 0).toFixed(1)}%</TableCell>
                              </TableRow>
                            ))}
                            {compReportRows.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-sm text-gray-500">Sin datos</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Análisis de Engagement - Consolidado */}
            {engagementMetrics && (
              <Card>
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-600" />
                      <span>Análisis de Engagement</span>
                    </CardTitle>
                    <Button onClick={exportEngagementCSV} variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Exportar Métricas
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Métricas Principales */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-[#22c55e]">{engagementMetrics?.totalLessonsCompleted?.toLocaleString('es-CO') || '0'}</div>
                            <div className="text-sm text-gray-600">Lecciones Completadas</div>
                          </div>
                          <BookOpen className="h-8 w-8 text-[#22c55e]" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-[#f97316]">{engagementMetrics?.totalStudyTimeHours?.toLocaleString('es-CO') || '0'}h</div>
                            <div className="text-sm text-gray-600">Tiempo de Estudio</div>
                          </div>
                          <Clock className="h-8 w-8 text-[#f97316]" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-[#8b5cf6]">{engagementMetrics?.completionRate?.toFixed(1) || '0.0'}%</div>
                            <div className="text-sm text-gray-600">Tasa de Finalización</div>
                          </div>
                          <TrendingUp className="h-8 w-8 text-[#8b5cf6]" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-2xl font-bold text-[#06b6d4]">{engagementMetrics?.courseCompletions?.toLocaleString('es-CO') || '0'}</div>
                            <div className="text-sm text-gray-600">Cursos Completados</div>
                          </div>
                          <Award className="h-8 w-8 text-[#06b6d4]" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráficas de Engagement */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5" />
                          <span>Progreso y Finalización</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Progreso Promedio</span>
                            <span className="text-2xl font-bold text-[#73A2D3]">{engagementMetrics?.averageProgress?.toFixed(1) || '0.0'}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-[#73A2D3] h-2 rounded-full" 
                              style={{ width: `${engagementMetrics?.averageProgress || 0}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Tasa de Finalización</span>
                            <span className="text-2xl font-bold text-[#22c55e]">{engagementMetrics?.completionRate?.toFixed(1) || '0.0'}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-[#22c55e] h-2 rounded-full" 
                              style={{ width: `${engagementMetrics?.completionRate || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Clock className="h-5 w-5" />
                          <span>Métricas de Tiempo</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-[#f97316]">{engagementMetrics?.totalStudyTimeHours?.toLocaleString('es-CO') || '0'}h</div>
                            <div className="text-sm text-gray-600">Tiempo Total de Estudio</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-3xl font-bold text-[#8b5cf6]">{engagementMetrics?.averageSessionDurationMinutes?.toFixed(0) || '0'}min</div>
                            <div className="text-sm text-gray-600">Duración Promedio de Sesión</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-3xl font-bold text-[#06b6d4]">{engagementMetrics?.activeUsers?.toLocaleString('es-CO') || '0'}</div>
                            <div className="text-sm text-gray-600">Usuarios Activos</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Insights y Recomendaciones - Al final */}
            {(kpis || engagementMetrics) && (
              <>
                <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-600" />
                      <span>Insights y Recomendaciones</span>
                    </CardTitle>
                  </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Análisis de Rendimiento */}
                    {kpis && (
                      <>
                        {kpis.averageScore !== undefined && kpis.averageScore !== null && (
                          <>
                            {kpis.averageScore < 70 ? (
                              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-semibold text-red-800">Atención Requerida: Rendimiento Bajo</div>
                                  <div className="text-sm text-red-700 mt-1">
                                    El promedio general ({kpis.averageScore.toFixed(1)}%) está por debajo del umbral recomendado (70%). 
                                    Se recomienda implementar estrategias de refuerzo académico y revisar las áreas con menor rendimiento.
                                  </div>
                                </div>
                              </div>
                            ) : kpis.averageScore >= 80 ? (
                              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-semibold text-green-800">Excelente Rendimiento</div>
                                  <div className="text-sm text-green-700 mt-1">
                                    El promedio general ({kpis.averageScore.toFixed(1)}%) indica un excelente desempeño académico. 
                                    Continúa con las estrategias actuales que están generando buenos resultados.
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <Target className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-semibold text-blue-800">Buen Rendimiento con Oportunidades de Mejora</div>
                                  <div className="text-sm text-blue-700 mt-1">
                                    El promedio general ({kpis.averageScore.toFixed(1)}%) está en un rango aceptable. 
                                    Hay oportunidades para mejorar identificando áreas específicas de fortalecimiento.
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        
                        {kpis.examAttempts < 100 && (
                          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-semibold text-yellow-800">Baja Participación en Evaluaciones</div>
                              <div className="text-sm text-yellow-700 mt-1">
                                Solo {kpis.examAttempts} exámenes realizados. Se recomienda promover una mayor participación 
                                mediante incentivos, recordatorios y estrategias de gamificación.
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Análisis de Engagement */}
                    {engagementMetrics && (
                      <>
                        {engagementMetrics.completionRate !== undefined && engagementMetrics.completionRate !== null && engagementMetrics.completionRate < 50 && (
                          <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <TrendingDown className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-semibold text-orange-800">Baja Tasa de Finalización</div>
                              <div className="text-sm text-orange-700 mt-1">
                                La tasa de finalización ({engagementMetrics.completionRate.toFixed(1)}%) indica que los estudiantes 
                                no están completando los cursos. Considera implementar estrategias de engagement, 
                                recordatorios personalizados y contenido más interactivo.
                              </div>
                            </div>
                          </div>
                        )}
                        {engagementMetrics.completionRate !== undefined && engagementMetrics.completionRate !== null && engagementMetrics.completionRate >= 70 && (
                          <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-semibold text-green-800">Alto Nivel de Engagement</div>
                              <div className="text-sm text-green-700 mt-1">
                                Excelente tasa de finalización ({engagementMetrics.completionRate.toFixed(1)}%). 
                                Los estudiantes están comprometidos con el aprendizaje. Mantén las estrategias actuales.
                              </div>
                            </div>
                          </div>
                        )}

                        {engagementMetrics.averageProgress !== undefined && engagementMetrics.averageProgress !== null && engagementMetrics.averageProgress < 50 && (
                          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <Target className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-semibold text-amber-800">Progreso Promedio Bajo</div>
                              <div className="text-sm text-amber-700 mt-1">
                                El progreso promedio ({engagementMetrics.averageProgress.toFixed(1)}%) sugiere que los estudiantes 
                                necesitan más apoyo. Considera revisar la dificultad del contenido y proporcionar recursos adicionales.
                              </div>
                            </div>
                          </div>
                        )}

                        {engagementMetrics.totalStudyTimeHours !== undefined && engagementMetrics.totalStudyTimeHours !== null && engagementMetrics.totalStudyTimeHours > 0 && engagementMetrics.totalStudyTimeHours < 10 && (
                          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-semibold text-blue-800">Oportunidad: Aumentar Tiempo de Estudio</div>
                              <div className="text-sm text-blue-700 mt-1">
                                El tiempo total de estudio ({engagementMetrics.totalStudyTimeHours.toFixed(1)}h) puede mejorarse. 
                                Considera implementar recordatorios de estudio y establecer metas de tiempo semanales.
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Recomendaciones Generales */}
                    <div className="mt-4 pt-4 border-t border-amber-200">
                      <div className="font-semibold text-amber-800 mb-2">Recomendaciones Estratégicas:</div>
                      <ul className="space-y-2 text-sm text-amber-700">
                        {kpis && kpis.averageScore < 70 && (
                          <li className="flex items-start gap-2">
                            <span className="text-amber-600">•</span>
                            <span>Implementar sesiones de refuerzo para competencias con menor rendimiento</span>
                          </li>
                        )}
                        {engagementMetrics && engagementMetrics.completionRate < 50 && (
                          <li className="flex items-start gap-2">
                            <span className="text-amber-600">•</span>
                            <span>Desarrollar estrategias de gamificación para aumentar la participación</span>
                          </li>
                        )}
                        {kpis && kpis.examAttempts < 100 && (
                          <li className="flex items-start gap-2">
                            <span className="text-amber-600">•</span>
                            <span>Promover mayor participación en evaluaciones mediante incentivos y recordatorios</span>
                          </li>
                        )}
                        {engagementMetrics && engagementMetrics.totalStudyTimeHours < 20 && (
                          <li className="flex items-start gap-2">
                            <span className="text-amber-600">•</span>
                            <span>Establecer metas de tiempo de estudio y proporcionar recursos de apoyo</span>
                          </li>
                        )}
                        <li className="flex items-start gap-2">
                          <span className="text-amber-600">•</span>
                          <span>Revisar regularmente los informes detallados para identificar tendencias y áreas de mejora</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Análisis de Competencias que Necesitan Atención */}
              {safeCompReportRows.length > 0 && (
                <Card className="border-2 border-red-100">
                  <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <span>Competencias que Requieren Atención</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {(() => {
                        // Agrupar por competencia y calcular promedio general
                        const compMap = new Map<string, { totalScore: number; totalAttempts: number; competencies: any[] }>()
                        
                        safeCompReportRows.forEach((row: any) => {
                          const compId = row.competencyId
                          if (!compId) return // Skip if no competency ID
                          if (!compMap.has(compId)) {
                            compMap.set(compId, { totalScore: 0, totalAttempts: 0, competencies: [] })
                          }
                          const comp = compMap.get(compId)!
                          const avgScore = row.avgScore || 0
                          const attempts = row.attempts || 0
                          comp.totalScore += avgScore * attempts
                          comp.totalAttempts += attempts
                          comp.competencies.push(row)
                        })

                        // Calcular promedio por competencia y ordenar
                        const compAnalysis = Array.from(compMap.entries())
                          .map(([compId, data]) => {
                            const avgScore = data.totalAttempts > 0 
                              ? data.totalScore / data.totalAttempts 
                              : 0
                            const competency = safeCompetencies.find(c => c.id === compId)
                            const passRate = data.totalAttempts > 0
                              ? data.competencies.reduce((sum, c) => sum + ((c.passRate || 0) * (c.attempts || 0)), 0) / data.totalAttempts
                              : 0
                            return {
                              competencyId: compId,
                              competencyName: competency?.displayName || 'Competencia desconocida',
                              avgScore,
                              passRate,
                              totalAttempts: data.totalAttempts,
                              competencies: data.competencies
                            }
                          })
                          .filter(comp => comp.avgScore < 70)
                          .sort((a, b) => a.avgScore - b.avgScore)
                          .slice(0, 5)

                        if (compAnalysis.length === 0) {
                          return (
                            <div className="text-center py-8">
                              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                              <p className="font-semibold text-green-700">¡Excelente!</p>
                              <p className="text-sm text-gray-600 mt-1">
                                Todas las competencias están por encima del umbral de atención (70%)
                              </p>
                            </div>
                          )
                        }

                        return (
                          <>
                            <div className="text-sm text-gray-600 mb-4">
                              Las siguientes competencias tienen un promedio inferior al 70% y requieren atención prioritaria:
                            </div>
                            {compAnalysis.map((comp) => (
                              <div key={comp.competencyId} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="font-semibold text-red-800 mb-1">{comp.competencyName}</div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                      <div>
                                        <span className="text-gray-600">Promedio:</span>
                                        <span className="ml-2 font-semibold text-red-700">
                                          {comp.avgScore.toFixed(1)}%
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Tasa de Aprobación:</span>
                                        <span className="ml-2 font-semibold text-red-700">
                                          {comp.passRate.toFixed(1)}%
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-600">Total Intentos:</span>
                                        <span className="ml-2 font-semibold">{comp.totalAttempts}</span>
                                      </div>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-600">
                                      <span className="text-gray-600">Estado:</span>
                                      <span className="ml-2 font-semibold text-red-700">
                                        {comp.avgScore < 60 ? 'Crítico' : 'Requiere Atención'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-red-200">
                                  <div className="text-xs text-red-700">
                                    <strong>Recomendación:</strong> Implementar estrategias de refuerzo específicas para esta competencia, 
                                    revisar el contenido y considerar sesiones de apoyo adicional.
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        )
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}
              </>
            )}

          </TabsContent>

          {/* QUESTIONS BANK TAB */}
          <TabsContent value="questions" className="space-y-6">
            <QuestionManagementNew 
              competencies={competencies} 
              userRole={session?.user?.role || ''} 
            />
          </TabsContent>

          {/* STUDENTS TAB */}
          <TabsContent value="students" className="space-y-6">
            <StudentsManagement />
          </TabsContent>

          {/* SCHOOLS TAB - Only for Teacher Admins */}
          {session?.user?.role === 'teacher_admin' && (
            <TabsContent value="schools" className="space-y-6">
              <SchoolsManagement />
            </TabsContent>
          )}

          {/* LESSONS TAB */}
          <TabsContent value="lessons" className="space-y-6">
            <LessonManagement 
              userRole={session?.user?.role || ''} 
            />
          </TabsContent>

          {/* MODULES TAB */}
          <TabsContent value="modules" className="space-y-6">
            <ModuleManagement 
              userRole={session?.user?.role || ''}
              competencies={competencies}
              teachers={safeUsers.filter(user => user.role === 'teacher_admin').map(user => ({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName
              }))}
              onModuleCreated={() => {
                // Refrescar los módulos cuando se crea uno nuevo
                if (modules && modules.length > 0) {
                  // Forzar re-render del componente CourseManagement
                  setActiveTab(activeTab);
                }
              }}
            />
          </TabsContent>

          {/* COURSES TAB */}
          <TabsContent value="courses" className="space-y-6">
            <CourseManagement 
              competencies={competencies}
              schools={schools}
              userRole={session?.user?.role || ''}
              userSchoolId={session?.user?.schoolId}
            />
          </TabsContent>

          {/* EXAMS TAB - Gestión de Exámenes (crear/editar) */}
          <TabsContent value="exams" className="space-y-6">
            <ExamManagement 
              showResultsOnly={false} 
              userRole={session?.user?.role || ''}
            />
          </TabsContent>

          {/* MANUAL SIMULACROS TAB - Solo para teacher_admin */}
          {session?.user?.role === 'teacher_admin' && (
            <TabsContent value="manual-simulacros" className="space-y-6">
              <ManualSimulacroManagement />
            </TabsContent>
          )}

          {session?.user?.role === 'teacher_admin' && (
            <TabsContent value="otros-simulacros" className="space-y-6">
              <OtrosSimulacroManagement />
            </TabsContent>
          )}

          {/* LIVE CLASSES TAB - Clases en Vivo */}
          <TabsContent value="live-classes" className="space-y-6">
            <LiveClassManagement
              competencies={safeCompetencies.map(c => ({
                id: c.id,
                name: c.name,
                displayName: c.displayName
              }))}
              modules={(modules || []).map(m => ({
                id: m.id,
                title: m.title,
                competencyId: m.competencyId
              }))}
              lessons={(lessons || []).map(l => ({
                id: l.id,
                title: l.title,
                moduleId: l.modules?.[0]?.moduleId, // Obtener el primer módulo si existe
                competencyId: l.competencyId
              }))}
              schools={safeSchools}
              userRole={session?.user?.role || ''}
              userSchoolId={session?.user?.schoolId}
            />
          </TabsContent>

          {/* EXAM MANAGEMENT TAB - Resultados de Exámenes Completados */}
          <TabsContent value="exam-management" className="space-y-6">
            <ExamManagement schoolId={filterSchoolId} showResultsOnly={true} />
          </TabsContent>

          {/* REPORTS TAB REMOVED (merged into analytics) */}

          {/* SETTINGS TAB - Only for Teacher Admins */}
          {session?.user?.role === 'teacher_admin' && (
            <TabsContent value="settings" className="space-y-6">
            <HomepageSettings />

            <Card>
              <CardHeader>
                <CardTitle>Carga Masiva (CSV)</CardTitle>
              </CardHeader>
              <CardContent>
                <BulkImportCenter />
              </CardContent>
            </Card>
          </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Add Question Modal */}
      {showAddQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Crear Nueva Pregunta</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAddQuestion(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Materia</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar materia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="matematicas">Matemáticas</SelectItem>
                      <SelectItem value="lectura">Lectura Crítica</SelectItem>
                      <SelectItem value="ciencias">Ciencias Naturales</SelectItem>
                      <SelectItem value="sociales">Ciencias Sociales</SelectItem>
                      <SelectItem value="ingles">Inglés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dificultad</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar dificultad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facil">Fácil</SelectItem>
                      <SelectItem value="medio">Medio</SelectItem>
                      <SelectItem value="dificil">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Pregunta</Label>
                <Textarea placeholder="Escribe la pregunta aquí..." rows={3} />
              </div>
              <div>
                <Label>Contexto (opcional)</Label>
                <Textarea placeholder="Contexto adicional para la pregunta..." rows={2} />
              </div>
              <div className="space-y-3">
                <Label>Opciones de Respuesta</Label>
                {["A", "B", "C", "D"].map((option) => (
                  <div key={option} className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-medium">
                      {option}
                    </div>
                    <Input placeholder={`Opción ${option}`} className="flex-1" />
                    <input type="radio" name="correct" className="w-4 h-4" />
                    <span className="text-sm text-gray-600">Correcta</span>
                  </div>
                ))}
              </div>
              <div>
                <Label>Explicación</Label>
                <Textarea placeholder="Explicación de la respuesta correcta..." rows={2} />
              </div>
              <div className="flex space-x-3 pt-4">
                <Button onClick={() => setShowAddQuestion(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button className="flex-1 bg-[#C00102]">
                  <Save className="h-4 w-4 mr-2" />
                  Crear Pregunta
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles del Estudiante */}
      <StudentDetailModal
        studentId={selectedStudentId}
        isOpen={isStudentModalOpen}
        onClose={() => {
          console.log('Closing modal')
          setIsStudentModalOpen(false)
          setSelectedStudentId(null)
        }}
      />

      {/* Modal de Error para Reporte Masivo */}
      <Dialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle className="text-xl">{errorModalData?.title || 'Error'}</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              {errorModalData?.message || 'Ocurrió un error inesperado.'}
            </DialogDescription>
          </DialogHeader>
          
          {errorModalData?.filters && Object.keys(errorModalData.filters).length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros activos:
              </h4>
              <div className="space-y-2">
                {Object.entries(errorModalData.filters).map(([key, value]) => {
                  // Mapear nombres de filtros a etiquetas más amigables
                  const filterLabels: Record<string, string> = {
                    schoolId: 'Colegio',
                    courseId: 'Curso',
                    grade: 'Grado',
                    competencyId: 'Competencia',
                    gender: 'Género',
                    socioeconomicStratum: 'Estrato',
                    minAge: 'Edad mínima',
                    maxAge: 'Edad máxima'
                  }
                  
                  const label = filterLabels[key] || key
                  let displayValue = value
                  
                  // Formatear valores específicos
                  if (key === 'gender') {
                    displayValue = value === 'M' ? 'Masculino' : value === 'F' ? 'Femenino' : value
                  } else if (key === 'grade') {
                    displayValue = `${value.charAt(0).toUpperCase()}${value.slice(1)}°`
                  }
                  
                  return (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{label}:</span>
                      <Badge variant="secondary" className="font-medium">
                        {String(displayValue)}
                      </Badge>
                    </div>
                  )
                })}
              </div>
              <p className="mt-3 text-xs text-gray-500 italic">
                💡 Intenta relajar algunos filtros para encontrar más estudiantes.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              onClick={() => setErrorModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Homepage Settings Component
function HomepageSettings() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCarousel, setShowCarousel] = useState(true)
  const [institutions, setInstitutions] = useState<Array<{ id: string; name: string; logoUrl: string; website?: string }>>([])
  
  // Asegurar que institutions sea siempre un array válido
  const safeInstitutions = Array.isArray(institutions) ? institutions : []
  const [newInst, setNewInst] = useState<{ name: string; logoUrl: string; website?: string }>({ name: '', logoUrl: '', website: '' })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/settings/homepage')
        if (!res.ok) throw new Error('HTTP '+res.status)
        const data = await res.json()
        if (!mounted) return
        setShowCarousel(!!data.showInstitutionsCarousel)
        setInstitutions(Array.isArray(data.institutions) ? data.institutions : [])
      } catch (e) {
        setError('No se pudo cargar la configuración')
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const addInstitution = () => {
    if (!newInst.name.trim() || !newInst.logoUrl.trim()) return
    setInstitutions(prev => [...prev, { id: crypto.randomUUID(), name: newInst.name.trim(), logoUrl: newInst.logoUrl.trim(), website: newInst.website?.trim() }])
    setNewInst({ name: '', logoUrl: '', website: '' })
  }

  const removeInstitution = (id: string) => {
    setInstitutions(prev => prev.filter(i => i.id !== id))
  }

  const save = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/settings/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showInstitutionsCarousel: showCarousel, institutions }),
      })
      if (!res.ok) throw new Error('HTTP '+res.status)
      alert('Configuración guardada')
    } catch (e) {
      setError('No se pudo guardar la configuración')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inicio: Instituciones que confían en nosotros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Mostrar carrusel</div>
            <div className="text-sm text-gray-600">Activa o desactiva la sección en la página principal.</div>
          </div>
          <Switch checked={showCarousel} onCheckedChange={setShowCarousel} />
        </div>

        {/* Sección de instituciones y guardado de configuración eliminada según nueva decisión */}
      </CardContent>
    </Card>
  )
}

function BulkImportWidget() {
  const [type, setType] = useState<string>('students')
  const [file, setFile] = useState<File|null>(null)
  const [result, setResult] = useState<{ created: number; errors: Array<{row:number; message:string}> }|null>(null)
  const [loading, setLoading] = useState(false)

  const onUpload = async () => {
    if (!file) return
    const fd = new FormData()
    fd.append('type', type)
    fd.append('file', file)
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/bulk-import', { method: 'POST', body: fd })
      const data = await res.json()
      setResult(data)
    } finally {
      setLoading(false)
    }
  }

  const templateOf = (t: string) => {
    switch (t) {
      case 'students':
        return [
          'email,firstName,lastName,role,dateOfBirth,gender,schoolId,city,neighborhood,totalPlatformTimeMinutes',
          'julia.rojas@colegio.edu,Julia,Rojas,student,2009-05-17,female,sch_123,Bogotá,Chapinero,0'
        ].join('\n')
      case 'schools':
        return [
          'name,city,daneCode,institutionType,academicCalendar,neighborhood,address,contactEmail,contactPhone,website',
          'Colegio Distrital Modelo,Bogotá,110001000001,publica,diurno,Chapinero,Cra 1 # 2-3,contacto@modelo.edu,6011234567,https://modelo.edu'
        ].join('\n')
      case 'lessons':
        return [
          'title,description,estimatedTimeMinutes,videoUrl,videoDescription,theoryContent,competencyId',
          'Operaciones con polinomios,Polinomios básicos,45,https://youtu.be/abc123,Video introductorio,"<p>Contenido HTML</p>",comp_matematicas'
        ].join('\n')
      case 'questions':
        return [
          'lessonId,questionText,questionImage,questionType,optionA,optionB,optionC,optionD,optionAImage,optionBImage,optionCImage,optionDImage,correctOption,explanation,explanationImage,orderIndex,difficultyLevel,timeLimit',
          ',¿Cuál es el resultado de (x+2)(x+3)?,,multiple_choice,x^2+5x+6,x^2+6x+5,x^2+3x+2,x^2+5x+3,,,,,A,Aplicar distributiva,,1,medio,60'
        ].join('\n')
      default:
        return ''
    }
  }

  const downloadTemplate = () => {
    const csv = templateOf(type)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}.template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }


  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Tipo</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="students">Estudiantes</SelectItem>
              <SelectItem value="schools">Colegios</SelectItem>
              <SelectItem value="lessons">Lecciones</SelectItem>
              <SelectItem value="questions">Preguntas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Archivo CSV</Label>
          <input type="file" accept=".csv" onChange={(e)=>setFile(e.target.files?.[0]||null)} className="block w-full border rounded px-3 py-2" />
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={onUpload} disabled={!file || loading}>{loading ? 'Subiendo...' : 'Subir'}</Button>
          <Button variant="outline" onClick={downloadTemplate}>Descargar plantilla</Button>
        </div>
      </div>

      {result && (
        <div className="text-sm">
          <div className="mb-2">Creados/Actualizados: <strong>{result.created}</strong></div>
          {result.errors?.length ? (
            <div className="space-y-1">
              <div className="font-medium text-red-600">Errores:</div>
              {(result.errors || []).slice(0,10).map((e, idx)=>(
                <div key={idx} className="text-red-600">Fila {e.row}: {e.message}</div>
              ))}
              {result.errors.length>10 && <div className="text-muted-foreground">... {result.errors.length-10} más</div>}
            </div>
          ) : (
            <div className="text-green-700">Sin errores</div>
          )}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Usa plantillas CSV con headers exactos. Codificación UTF-8. Separador coma. Para teoría en lecciones, puedes incluir HTML seguro.
      </div>
    </div>
  )
}

// Students Management Component - Now using imported component from @/components/StudentsManagement
// The local component has been removed to use the one with bulk course assignment functionality

// Branding Management for Teacher Admin
function BrandingManagementForTeacherAdmin({ schools }: { schools: Array<{ id?: string; name: string }> }) {
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('')
  
  // Filtrar solo colegios con ID válido
  const validSchools = schools.filter(s => s.id)
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="school-select">Seleccionar Colegio</Label>
        <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
          <SelectTrigger id="school-select">
            <SelectValue placeholder="Selecciona un colegio" />
          </SelectTrigger>
          <SelectContent>
            {validSchools.map((school) => (
              <SelectItem key={school.id} value={school.id!}>
                {school.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {selectedSchoolId && (
        <div className="mt-6">
          <BrandingForm schoolId={selectedSchoolId} />
        </div>
      )}
      
      {!selectedSchoolId && (
        <div className="text-center py-8 text-muted-foreground">
          <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Selecciona un colegio para gestionar su branding</p>
        </div>
      )}
    </div>
  )
}

// Schools Management Component
function SchoolsManagement() {
  const { 
    schools, 
    loading, 
    error, 
    pagination,
    filters,
    pendingFilters,
    setPendingFilters,
    applyFilters,
    clearFilters,
    goToPage,
    createSchool, 
    updateSchool, 
    deleteSchool 
  } = useSchools()
  const [showSchoolForm, setShowSchoolForm] = useState(false)
  const [editingSchool, setEditingSchool] = useState<any>(null)

  const handleCreateSchool = async (schoolData: any) => {
    try {
      await createSchool(schoolData)
      setShowSchoolForm(false)
    } catch (error) {
      console.error('Error creating school:', error)
    }
  }

  const handleUpdateSchool = async (schoolData: any) => {
    try {
      await updateSchool(editingSchool.id, schoolData)
      setShowSchoolForm(false)
      setEditingSchool(null)
    } catch (error) {
      console.error('Error updating school:', error)
    }
  }

  const handleDeleteSchool = async (schoolId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este colegio?')) {
      try {
        await deleteSchool(schoolId)
      } catch (error) {
        console.error('Error deleting school:', error)
      }
    }
  }

  const handleEditSchool = async (schoolId: string) => {
    const school = (schools || []).find(s => s.id === schoolId)
    if (school) {
      setEditingSchool(school)
      setShowSchoolForm(true)
    }
  }

  const handlePendingFilterChange = (field: string, value: string) => {
    const updated = { ...pendingFilters, [field]: value }
    setPendingFilters(updated)
  }

  const handleApplySchoolFilters = () => {
    applyFilters(pendingFilters)
  }

  const handleClearSchoolFilters = () => {
    const defaultFilters = {
      search: '',
      city: 'none',
      institutionType: 'none',
    }
    setPendingFilters(defaultFilters)
    clearFilters()
  }

  const getInstitutionTypeDisplayName = (type: string) => {
    switch (type) {
      case 'publica': return 'Pública'
      case 'privada': return 'Privada'
      case 'otro': return 'Otro'
      default: return type
    }
  }

  const getAcademicCalendarDisplayName = (calendar: string) => {
    switch (calendar) {
      case 'diurno': return 'Diurno'
      case 'nocturno': return 'Nocturno'
      case 'ambos': return 'Ambos'
      default: return calendar
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Colegios</h2>
          <p className="text-gray-600">Administra las instituciones educativas registradas{pagination ? ` (${pagination.total})` : ''}</p>
        </div>
        <Button onClick={() => setShowSchoolForm(true)} className="bg-[#C00102] hover:bg-[#a00102]">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Colegio
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
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nombre, ciudad, barrio..."
                  value={pendingFilters.search}
                  onChange={(e) => handlePendingFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Select value={pendingFilters.city} onValueChange={(value) => handlePendingFilterChange('city', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las ciudades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todas las ciudades</SelectItem>
                  {/* Note: This would ideally come from a separate API endpoint for unique cities */}
                  {Array.from(new Set((schools || []).map(s => s.city).filter(Boolean))).map((city: string) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="institutionType">Tipo de Institución</Label>
              <Select value={pendingFilters.institutionType} onValueChange={(value) => handlePendingFilterChange('institutionType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos los tipos</SelectItem>
                  <SelectItem value="publica">Pública</SelectItem>
                  <SelectItem value="privada">Privada</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleClearSchoolFilters}>
              Limpiar filtros
            </Button>
            <Button onClick={handleApplySchoolFilters}>
              <Search className="w-4 h-4 mr-2" />
              Aplicar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schools Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Colegios</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#73A2D3]"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : schools.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron colegios con los filtros actuales.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Barrio</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Calendario</TableHead>
                    <TableHead>Estudiantes</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schools.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell className="font-medium">{school.name}</TableCell>
                      <TableCell>{school.city}</TableCell>
                      <TableCell>{school.neighborhood}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            school.institutionType === 'publica'
                              ? 'bg-blue-100 text-blue-800'
                              : school.institutionType === 'privada'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {getInstitutionTypeDisplayName(school.institutionType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getAcademicCalendarDisplayName(school.academicCalendar)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Total: {school.totalStudents}</div>
                          <div>Activos: {school.activeStudentsCount || 0}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{school.contactEmail}</div>
                          <div className="text-gray-500">{school.contactPhone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {school.createdAt && formatDate(school.createdAt.toString())}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditSchool(school.id!)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => handleDeleteSchool(school.id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {pagination && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-gray-600">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} colegios
                  </p>
                  {pagination.pages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm">
                        Página {pagination.page} de {pagination.pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                      >
                        Siguiente
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* School Form Modal */}
      {showSchoolForm && (
        <SchoolForm
          school={editingSchool}
          onSubmit={editingSchool ? handleUpdateSchool : handleCreateSchool}
          onCancel={() => {
            setShowSchoolForm(false)
            setEditingSchool(null)
          }}
          loading={loading}
        />
      )}
    </div>
  )
}

// Questions Management Component
