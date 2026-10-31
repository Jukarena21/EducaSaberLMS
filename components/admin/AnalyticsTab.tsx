"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { StudentDetailModal } from "@/components/StudentDetailModal"
import { useAnalytics } from "@/hooks/useAnalytics"
import { useCoursesBySchool } from "@/hooks/useCoursesBySchool"
import {
  Users,
  FileText,
  TrendingUp,
  BarChart3,
  Eye,
  Search,
  BookOpen,
  Activity,
  PieChart,
  LineChart,
  X,
  Award,
  Clock,
  Filter,
  Download,
  AlertTriangle,
  Target,
  TrendingDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
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
  Cell,
  AreaChart,
  Area,
} from "recharts"

type Option = { id?: string | null; [key: string]: any }

interface AnalyticsTabProps {
  schools: Option[]
  courses: Option[]
  competencies: Option[]
  /** Compartido con la pestaña Resultados, que filtra por el mismo colegio. */
  filterSchoolId: string
  onFilterSchoolIdChange: (schoolId: string) => void
}

const DEFAULT_SCHOOL_COLOR = "262 83% 58%"

function hexToHsl(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex || "")) return DEFAULT_SCHOOL_COLOR
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
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

function downloadExcel(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
) {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ;(worksheet as any)["!freeze"] = { xSplit: 0, ySplit: 1 }
  ;(worksheet as any)["!cols"] = headers.map((h, colIdx) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map((r) => (r[colIdx] != null ? String(r[colIdx]).length : 0))
    )
    return { wch: Math.min(Math.max(maxLen + 2, 10), 40) }
  })

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

const STUDENT_STATUS_LABELS: Record<string, string> = {
  excelente: "Excelente",
  bueno: "Bueno",
  mejorable: "Mejorable",
  requiere_atencion: "Requiere Atención",
  sin_datos: "Sin exámenes",
}

export function AnalyticsTab({
  schools,
  courses,
  competencies,
  filterSchoolId,
  onFilterSchoolIdChange: setFilterSchoolId,
}: AnalyticsTabProps) {
  const { data: session } = useSession()
  const [selectedPeriod, setSelectedPeriod] = useState("6m")

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
    loading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useAnalytics()

  const safeGradeSeries = Array.isArray(gradeSeries) ? gradeSeries : []
  const safeGradeDistribution = Array.isArray(gradeDistribution) ? gradeDistribution : []
  const safeHourlyActivity = Array.isArray(hourlyActivity) ? hourlyActivity : []
  const safeSchoolRanking = Array.isArray(schoolRanking) ? schoolRanking : []
  const safeReportSeries = Array.isArray(reportSeries) ? reportSeries : []
  const safeReportRows = Array.isArray(reportRows) ? reportRows : []
  const safeCompReportRows = Array.isArray(compReportRows) ? compReportRows : []
  const safeSchools = Array.isArray(schools) ? schools : []
  const safeCourses = Array.isArray(courses) ? courses : []
  const safeCompetencies = Array.isArray(competencies) ? competencies : []

  const [filterCourseId, setFilterCourseId] = useState<string>('all')
  const [filterGrade, setFilterGrade] = useState<string>('all')
  const [filterCompetencyId, setFilterCompetencyId] = useState<string>('all')
  const [filterMinAge, setFilterMinAge] = useState<string>('')
  const [filterMaxAge, setFilterMaxAge] = useState<string>('')
  const [filterGender, setFilterGender] = useState<string>('all')
  const [filterSocioeconomicStratum, setFilterSocioeconomicStratum] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState("")

  const { courses: filteredCourses } = useCoursesBySchool(filterSchoolId)
  const safeFilteredCourses = Array.isArray(filteredCourses) ? filteredCourses : []

  const [studentsMetrics, setStudentsMetrics] = useState<any[]>([])
  const [studentsMetricsLoading, setStudentsMetricsLoading] = useState(false)
  const [studentsMetricsError, setStudentsMetricsError] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)

  const [studentListPage, setStudentListPage] = useState(1)
  const [atRiskPage, setAtRiskPage] = useState(1)
  const [inactivePage, setInactivePage] = useState(1)
  const studentsPerPage = 10

  useEffect(() => {
    setStudentListPage(1)
  }, [searchTerm, filterGrade])

  useEffect(() => {
    setAtRiskPage(1)
    setInactivePage(1)
  }, [studentsMetrics])

  useEffect(() => {
    setFilterCourseId('all')
  }, [filterSchoolId])

  const buildFilterParams = () => ({
    period: selectedPeriod,
    schoolId: filterSchoolId !== 'all' ? filterSchoolId : undefined,
    courseId: filterCourseId !== 'all' ? filterCourseId : undefined,
    grade: filterGrade !== 'all' ? filterGrade : undefined,
    competencyId: filterCompetencyId !== 'all' ? filterCompetencyId : undefined,
    minAge: filterMinAge || undefined,
    maxAge: filterMaxAge || undefined,
    gender: filterGender !== 'all' ? filterGender : undefined,
    socioeconomicStratum: filterSocioeconomicStratum !== 'all' ? filterSocioeconomicStratum : undefined,
  })

  // La lista de estudiantes usa los mismos filtros que el resto de la pestaña,
  // salvo el año escolar, que se filtra en pantalla con el grado de cada fila.
  const studentsMetricsCache = useRef<Map<string, { data: any[]; timestamp: number }>>(new Map())
  const STUDENTS_METRICS_CACHE_TTL = 5 * 60 * 1000

  const loadStudentsMetrics = async (filters: ReturnType<typeof buildFilterParams>, skipCache = false) => {
    const params = new URLSearchParams()
    if (filters.period) params.set('period', filters.period)
    if (session?.user?.role === 'school_admin' && session.user.schoolId) {
      params.set('schoolId', session.user.schoolId)
    } else if (filters.schoolId) {
      params.set('schoolId', filters.schoolId)
    }
    if (filters.courseId) params.set('courseId', filters.courseId)
    if (filters.competencyId) params.set('competencyId', filters.competencyId)
    if (filters.minAge) params.set('minAge', filters.minAge)
    if (filters.maxAge) params.set('maxAge', filters.maxAge)
    if (filters.gender) params.set('gender', filters.gender)
    if (filters.socioeconomicStratum) params.set('socioeconomicStratum', filters.socioeconomicStratum)

    const query = params.toString()
    const cacheKey = `${session?.user?.id}:${query}`
    const cached = studentsMetricsCache.current.get(cacheKey)
    if (!skipCache && cached && Date.now() - cached.timestamp < STUDENTS_METRICS_CACHE_TTL) {
      setStudentsMetrics(cached.data)
      return
    }

    try {
      setStudentsMetricsLoading(true)
      setStudentsMetricsError(null)
      const response = await fetch(`/api/admin/students/metrics?${query}`)
      if (!response.ok) {
        throw new Error('Error al cargar métricas de estudiantes')
      }
      const data = await response.json()
      const students = data.students || []
      setStudentsMetrics(students)
      studentsMetricsCache.current.set(cacheKey, { data: students, timestamp: Date.now() })
    } catch (error: any) {
      console.error('Error loading students metrics:', error)
      setStudentsMetricsError(error.message || 'Error al cargar métricas')
    } finally {
      setStudentsMetricsLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      loadStudentsMetrics(buildFilterParams())
    }
  }, [session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => {
    const filters = buildFilterParams()
    refetchAnalytics(filters)
    loadStudentsMetrics(filters, true)
  }

  const matchesStudentSearch = (student: any) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim()
      const nameMatch = student.studentName?.toLowerCase().includes(searchLower) || false
      const emailMatch = student.studentEmail?.toLowerCase().includes(searchLower) || false
      if (!nameMatch && !emailMatch) return false
    }
    if (filterGrade !== 'all' && student.academicGrade !== filterGrade) return false
    return true
  }

  const exportStudentsCSV = () => {
    if (studentsMetrics.length === 0) return

    const headers = [
      "Nombre",
      "Email",
      "Grado",
      "Exámenes en el Período",
      "Promedio",
      "Tasa de Aprobación",
      "Avance en Cursos",
      "Cursos Completados",
      "Cursos Activos",
      "Estado",
      "Última Actividad",
      "Factores de Riesgo",
    ]

    const rows = studentsMetrics.filter(matchesStudentSearch).map((student: any) => [
      student.studentName || "",
      student.studentEmail || "",
      student.academicGrade
        ? student.academicGrade.charAt(0).toUpperCase() + student.academicGrade.slice(1)
        : "N/A",
      student.totalExams || 0,
      Number((student.averageScore || 0).toFixed(1)),
      Number((student.passRate || 0).toFixed(1)),
      Number((student.averageCourseProgress || 0).toFixed(1)),
      student.completedCourses || 0,
      student.activeCourses || 0,
      STUDENT_STATUS_LABELS[student.status] || "Sin exámenes",
      student.lastActivity
        ? new Date(student.lastActivity).toLocaleDateString("es-CO")
        : "Sin actividad",
      student.riskFactors && student.riskFactors.length > 0
        ? student.riskFactors.join("; ")
        : "Ninguno",
    ])

    const dateStr = new Date().toISOString().split("T")[0]
    const filtersStr = filterGrade !== "all" ? `_${filterGrade}` : ""
    downloadExcel(`estudiantes_metricas_${dateStr}${filtersStr}.xlsx`, "Estudiantes", headers, rows)
  }

  const exportCompCSV = () => {
    const headers = ["Competencia", "Dificultad", "Intentos", "Promedio", "Aprobación %"]
    const rows = safeCompReportRows.map((r: any) => [
      r.competencyName || "N/A",
      r.difficultyLevel || "N/A",
      r.attempts || 0,
      Number((r.avgScore || 0).toFixed(1)),
      Number((r.passRate || 0).toFixed(1)),
    ])
    downloadExcel("reporte_competencias.xlsx", "Competencias", headers, rows)
  }

  const exportRowsToCSV = () => {
    const headers = ["Colegio", "Curso", "Competencia", "Intentos", "Promedio", "Aprobación %"]
    const rows = safeReportRows.map((r: any) => [
      r.schoolName || "N/A",
      r.courseName || "N/A",
      r.competencyName || "N/A",
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
      ["Tiempo Total en Exámenes", engagementMetrics.examTimeHours, "horas"],
      ["Duración Promedio por Examen", engagementMetrics.averageExamDurationMinutes, "minutos"],
      ["Estudiantes Activos", engagementMetrics.activeUsers, "estudiantes"],
      ["Cursos Completados", engagementMetrics.courseCompletions, "cursos"],
      ["Avance Promedio en Lecciones", engagementMetrics.averageProgress, "porcentaje"],
      ["Lecciones Terminadas", engagementMetrics.completionRate, "porcentaje"],
    ]

    const dateStr = new Date().toISOString().split("T")[0]
    downloadExcel(`metricas_engagement_${dateStr}.xlsx`, "Métricas", headers, rows)
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
      const { period: _period, ...filters } = buildFilterParams()

      const response = await fetch('/api/admin/analytics/export-bulk-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      })

      if (!response.ok) {
        let errorData: any = {}
        try {
          const text = await response.text()
          errorData = text ? JSON.parse(text) : {}
        } catch (e) {
          errorData = { error: `Error ${response.status}: ${response.statusText}` }
        }
        console.error('Error al generar reporte:', errorData)

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
          message: errorData.error || 'Error desconocido',
          filters: activeFilters
        })
        setErrorModalOpen(true)
        return
      }

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

  const [evolutionView, setEvolutionView] = useState<'areas' | 'avgScore' | 'passRate'>('areas')
  const seriesAreaKeys = Object.keys(safeGradeSeries[0] || {}).filter(
    (k) => k !== 'period' && k !== 'avgScore' && k !== 'passRate' && k !== 'attempts'
  )

  // Una fila por área, de peor a mejor promedio
  const areaRows = (() => {
    const byArea = new Map<string, { name: string; scoreSum: number; passSum: number; attempts: number; byDifficulty: any[] }>()
    safeCompReportRows.forEach((row: any) => {
      const key = row.competencyId || row.competencyName || 'general'
      if (!byArea.has(key)) {
        byArea.set(key, { name: row.competencyName || 'General', scoreSum: 0, passSum: 0, attempts: 0, byDifficulty: [] })
      }
      const area = byArea.get(key)!
      const attempts = row.attempts || 0
      area.scoreSum += (row.avgScore || 0) * attempts
      area.passSum += (row.passRate || 0) * attempts
      area.attempts += attempts
      area.byDifficulty.push(row)
    })
    return Array.from(byArea.entries())
      .map(([id, a]) => ({
        id,
        name: a.name,
        attempts: a.attempts,
        avgScore: a.attempts > 0 ? a.scoreSum / a.attempts : 0,
        passRate: a.attempts > 0 ? a.passSum / a.attempts : 0,
        byDifficulty: a.byDifficulty,
      }))
      .sort((a, b) => a.avgScore - b.avgScore)
  })()

  const areaStatus = (avg: number) =>
    avg < 60
      ? { label: 'Crítica', className: 'bg-red-500 text-white' }
      : avg < 70
      ? { label: 'Requiere atención', className: 'bg-orange-500 text-white' }
      : avg < 80
      ? { label: 'Aceptable', className: 'bg-blue-500 text-white' }
      : { label: 'Fuerte', className: 'bg-green-500 text-white' }

  const criticalAreas = areaRows.filter((a) => a.attempts > 0 && a.avgScore < 60)
  const atRiskCount = studentsMetrics.filter((s: any) => s.status === 'requiere_atencion').length
  const inactiveCount = studentsMetrics.filter((s: any) => s.isInactive).length

  const formatMonthShort = (value: string) => {
    const [year, month] = String(value).split('-')
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`
  }
  const formatMonthLong = (value: string) => {
    const [year, month] = String(value).split('-')
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }
  const AREA_COLORS = ["#C00102", "#73A2D3", "#22c55e", "#f97316", "#8b5cf6", "#ec4899", "#14b8a6"]

  return (
    <>
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

                         {/* Período */}
                         <AccordionItem value="comparison">
                           <AccordionTrigger className="hover:no-underline">
                             <div className="flex items-center gap-2">
                               <TrendingUp className="h-4 w-4 text-purple-600" />
                               <span className="font-semibold">Período</span>
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
                               <p className="text-xs text-gray-500 self-end">
                                 Todo en esta pestaña usa este período, también la lista de estudiantes.
                                 El detalle de cada estudiante muestra su historial completo.
                               </p>
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
                               setSelectedPeriod('6m')
                               const defaults = { period: '6m' } as ReturnType<typeof buildFilterParams>
                               refetchAnalytics(defaults)
                               loadStudentsMetrics(defaults, true)
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

            {/* Alertas concretas */}
            {(criticalAreas.length > 0 || atRiskCount > 0 || inactiveCount > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {criticalAreas.length > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-red-800">
                        {criticalAreas.length === 1 ? '1 área crítica' : `${criticalAreas.length} áreas críticas`}
                      </div>
                      <div className="text-sm text-red-700 mt-1">
                        Promedio por debajo de 60%: {criticalAreas.slice(0, 3).map((a) => a.name).join(', ')}
                        {criticalAreas.length > 3 ? ' y otras' : ''}.
                      </div>
                    </div>
                  </div>
                )}
                {atRiskCount > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <Users className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-orange-800">
                        {atRiskCount === 1 ? '1 estudiante requiere atención' : `${atRiskCount} estudiantes requieren atención`}
                      </div>
                      <div className="text-sm text-orange-700 mt-1">
                        Bajo rendimiento sostenido en el período. Ver la sección de estudiantes.
                      </div>
                    </div>
                  </div>
                )}
                {inactiveCount > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-amber-800">
                        {inactiveCount === 1 ? '1 estudiante sin actividad' : `${inactiveCount} estudiantes sin actividad`}
                      </div>
                      <div className="text-sm text-amber-700 mt-1">
                        Sin exámenes ni lecciones en los últimos 30 días.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ¿Cómo van? */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-gray-700" />
                  <span>¿Cómo van?</span>
                </CardTitle>
                <p className="text-xs text-gray-600 mt-1 ml-7">
                  Evolución mes a mes, distribución de notas y comparación entre colegios
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4 flex-wrap">
                    <CardTitle className="flex items-center space-x-2">
                      <LineChart className="h-5 w-5" />
                      <span>Evolución Mensual</span>
                    </CardTitle>
                    <Tabs value={evolutionView} onValueChange={(v) => setEvolutionView(v as typeof evolutionView)}>
                      <TabsList>
                        <TabsTrigger value="areas">Por área</TabsTrigger>
                        <TabsTrigger value="avgScore">Promedio general</TabsTrigger>
                        <TabsTrigger value="passRate">Aprobación</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </CardHeader>
                  <CardContent>
                    {safeGradeSeries.length > 0 ? (
                      <ResponsiveContainer width="100%" height={320}>
                        <RechartsLineChart data={safeGradeSeries} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                          <XAxis dataKey="period" tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={formatMonthShort} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(value) => `${value}%`} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            labelFormatter={formatMonthLong}
                            formatter={(value: any, name: any) => [`${Number(value).toFixed(1)}%`, name]}
                          />
                          {evolutionView === 'areas' ? (
                            <>
                              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />
                              {seriesAreaKeys.map((key, idx) => (
                                <Line
                                  key={key}
                                  type="monotone"
                                  dataKey={key}
                                  stroke={AREA_COLORS[idx % AREA_COLORS.length]}
                                  strokeWidth={2.5}
                                  dot={{ fill: AREA_COLORS[idx % AREA_COLORS.length], r: 3 }}
                                  activeDot={{ r: 5 }}
                                />
                              ))}
                            </>
                          ) : (
                            <Line
                              type="monotone"
                              dataKey={evolutionView}
                              name={evolutionView === 'avgScore' ? 'Promedio' : 'Aprobación'}
                              stroke={evolutionView === 'avgScore' ? '#73A2D3' : '#22c55e'}
                              strokeWidth={2.5}
                              dot={{ fill: evolutionView === 'avgScore' ? '#73A2D3' : '#22c55e', r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          )}
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Comparación Período Actual vs Anterior */}
                          {safeReportSeries.length >= 2 && (
                            <Card className="lg:col-span-2">
                              <CardHeader>
                                <CardTitle className="text-base">Último Mes vs Mes Anterior</CardTitle>
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
                                            {avgScoreChange >= 0 ? '+' : ''}{avgScoreChange.toFixed(1)} puntos vs mes anterior
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
                                            {passRateChange >= 0 ? '+' : ''}{passRateChange.toFixed(1)} puntos vs mes anterior
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
                                            {attemptsChange >= 0 ? '+' : ''}{attemptsChange} vs mes anterior
                                          </div>
                                        </div>
                                      </>
                                    )
                                  })()}
                                </div>
                              </CardContent>
                            </Card>
                          )}
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
                              return {
                                nombre: school?.name || r.schoolId || 'Sin nombre',
                                promedio: r.avgScore || 0,
                                rank: idx + 1,
                              }
                            })}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                          >
                            <defs>
                              {safeSchoolRanking.slice(0, 5).map((r, idx) => {
                                const school = safeSchools.find(s => s.id === r.schoolId)
                                const schoolColor = hexToHsl(school?.themePrimary || '')
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
              </CardContent>
            </Card>

            {/* ¿Qué áreas fallan? */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-red-600" />
                      <span>¿Qué áreas fallan?</span>
                    </CardTitle>
                    <p className="text-xs text-gray-600 mt-1 ml-7">
                      Rendimiento por área, de la más débil a la más fuerte
                    </p>
                  </div>
                  <Button onClick={exportCompCSV} variant="outline" size="sm" disabled={safeCompReportRows.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {analyticsLoading ? (
                  <div className="py-8 text-center">Cargando...</div>
                ) : analyticsError ? (
                  <div className="py-8 text-center text-red-600">{analyticsError}</div>
                ) : areaRows.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500">Sin datos para los filtros seleccionados</div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Área</TableHead>
                            <TableHead>Intentos</TableHead>
                            <TableHead>Promedio</TableHead>
                            <TableHead>Aprobación</TableHead>
                            <TableHead>Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {areaRows.map((area) => {
                            const status = areaStatus(area.avgScore)
                            return (
                              <TableRow key={area.id}>
                                <TableCell className="font-medium">{area.name}</TableCell>
                                <TableCell>{area.attempts}</TableCell>
                                <TableCell>{area.avgScore.toFixed(1)}%</TableCell>
                                <TableCell>{area.passRate.toFixed(1)}%</TableCell>
                                <TableCell>
                                  <Badge className={status.className}>{status.label}</Badge>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <Accordion type="single" collapsible className="w-full mt-4">
                      <AccordionItem value="by-difficulty">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <PieChart className="h-4 w-4 text-purple-600" />
                            <span className="font-semibold text-sm">Detalle por dificultad</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Área</TableHead>
                                <TableHead>Dificultad</TableHead>
                                <TableHead>Intentos</TableHead>
                                <TableHead>Promedio</TableHead>
                                <TableHead>Aprobación</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {areaRows.flatMap((area) =>
                                area.byDifficulty.map((r: any, idx: number) => (
                                  <TableRow key={`${area.id}-${idx}`}>
                                    <TableCell>{area.name}</TableCell>
                                    <TableCell>{r.difficultyLevel || 'N/A'}</TableCell>
                                    <TableCell>{r.attempts || 0}</TableCell>
                                    <TableCell>{(r.avgScore || 0).toFixed(1)}%</TableCell>
                                    <TableCell>{(r.passRate || 0).toFixed(1)}%</TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </>
                )}
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
                                const filteredStudents = studentsMetrics.filter(matchesStudentSearch)

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
                                        return <Badge className="bg-gray-500 text-white">Sin exámenes</Badge>
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
                                        {student.totalExams > 0 ? (
                                          <Badge className={getScoreBadge(student.averageScore || 0)}>
                                            {(student.averageScore || 0).toFixed(1)}%
                                          </Badge>
                                        ) : (
                                          <span className="text-gray-400">—</span>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {getStatusBadge(student.status || 'sin_datos')}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
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
                            student.status === 'requiere_atencion' && matchesStudentSearch(student)
                          )
                          const criterion = (
                            <p className="text-xs text-gray-500 mb-3">
                              Estudiantes con al menos 2 exámenes terminados en el período y promedio por debajo
                              de 60% o que aprueban menos de la mitad de sus exámenes.
                            </p>
                          )

                          if (atRiskStudents.length === 0) {
                            return (
                              <>
                                {criterion}
                                <div className="text-center py-8">
                                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                                  <p className="font-semibold text-green-700">¡Excelente!</p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    No hay estudiantes que requieran atención en este período
                                  </p>
                                </div>
                              </>
                            )
                          }

                          // Paginación para estudiantes en riesgo
                          const totalAtRiskPages = Math.ceil(atRiskStudents.length / studentsPerPage)
                          const startAtRiskIndex = (atRiskPage - 1) * studentsPerPage
                          const endAtRiskIndex = startAtRiskIndex + studentsPerPage
                          const paginatedAtRisk = atRiskStudents.slice(startAtRiskIndex, endAtRiskIndex)

                          return (
                            <>
                              {criterion}
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

                  {/* Estudiantes sin actividad reciente */}
                  <AccordionItem value="inactive">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="font-semibold">Estudiantes sin Actividad Reciente</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-4">
                        {studentsMetricsLoading ? (
                          <div className="py-8 text-center">Cargando...</div>
                        ) : (() => {
                          const inactiveStudents = studentsMetrics
                            .filter((student: any) => student.isInactive && matchesStudentSearch(student))
                            .sort((a: any, b: any) => (b.inactiveDays ?? Infinity) - (a.inactiveDays ?? Infinity))

                          if (inactiveStudents.length === 0) {
                            return (
                              <div className="text-center py-8">
                                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                                <p className="text-sm text-gray-600">
                                  Todos los estudiantes tuvieron actividad en los últimos 30 días
                                </p>
                              </div>
                            )
                          }

                          const totalInactivePages = Math.ceil(inactiveStudents.length / studentsPerPage)
                          const startInactiveIndex = (inactivePage - 1) * studentsPerPage
                          const paginatedInactive = inactiveStudents.slice(startInactiveIndex, startInactiveIndex + studentsPerPage)

                          return (
                            <>
                              <p className="text-xs text-gray-500 mb-3">
                                Sin exámenes ni lecciones en los últimos 30 días. Es un tema de seguimiento,
                                no de rendimiento.
                              </p>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Estudiante</TableHead>
                                    <TableHead>Grado</TableHead>
                                    <TableHead>Última actividad</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {paginatedInactive.map((student: any) => (
                                    <TableRow key={student.studentId}>
                                      <TableCell>
                                        <div className="font-medium">{student.studentName}</div>
                                        <div className="text-xs text-gray-500">{student.studentEmail}</div>
                                      </TableCell>
                                      <TableCell>
                                        {student.academicGrade
                                          ? student.academicGrade.charAt(0).toUpperCase() + student.academicGrade.slice(1)
                                          : 'N/A'}
                                      </TableCell>
                                      <TableCell>
                                        {student.lastActivity ? (
                                          <span>
                                            {new Date(student.lastActivity).toLocaleDateString('es-CO')}{' '}
                                            <span className="text-xs text-gray-500">(hace {student.inactiveDays} días)</span>
                                          </span>
                                        ) : (
                                          <span className="text-gray-500">Nunca ha entrado a un examen o lección</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedStudentId(student.studentId)
                                            setIsStudentModalOpen(true)
                                          }}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                              {inactiveStudents.length > studentsPerPage && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                  <div className="text-sm text-gray-600">
                                    {inactiveStudents.length} estudiantes sin actividad reciente
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setInactivePage(p => Math.max(1, p - 1))}
                                      disabled={inactivePage === 1}
                                    >
                                      <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="text-sm text-gray-600">
                                      Página {inactivePage} de {totalInactivePages}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setInactivePage(p => Math.min(totalInactivePages, p + 1))}
                                      disabled={inactivePage === totalInactivePages}
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


            {/* Participación e informes */}
            <Card>
              <CardContent className="p-6">
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="engagement">
                    <div className="flex items-center justify-between pr-4">
                      <AccordionTrigger className="hover:no-underline flex-1">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-green-600" />
                          <span className="font-semibold">Participación</span>
                        </div>
                      </AccordionTrigger>
                      <Button onClick={exportEngagementCSV} variant="outline" size="sm" className="ml-2" disabled={!engagementMetrics}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Excel
                      </Button>
                    </div>
                    <AccordionContent>
                      <div className="pt-4 space-y-6">
                        {engagementMetrics ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {[
                              { label: 'Lecciones terminadas', value: engagementMetrics.totalLessonsCompleted?.toLocaleString('es-CO') ?? '0', icon: BookOpen, color: 'text-[#22c55e]' },
                              { label: '% de lecciones trabajadas que se terminaron', value: `${engagementMetrics.completionRate?.toFixed(1) ?? '0.0'}%`, icon: CheckCircle2, color: 'text-[#8b5cf6]' },
                              { label: 'Avance promedio en lecciones', value: `${engagementMetrics.averageProgress?.toFixed(1) ?? '0.0'}%`, icon: TrendingUp, color: 'text-[#73A2D3]' },
                              { label: 'Cursos completados', value: engagementMetrics.courseCompletions?.toLocaleString('es-CO') ?? '0', icon: Award, color: 'text-[#06b6d4]' },
                              { label: 'Tiempo total en exámenes', value: `${engagementMetrics.examTimeHours?.toLocaleString('es-CO') ?? '0'}h`, icon: Clock, color: 'text-[#f97316]' },
                              { label: 'Duración promedio por examen', value: `${engagementMetrics.averageExamDurationMinutes?.toFixed(0) ?? '0'} min`, icon: Clock, color: 'text-[#8b5cf6]' },
                            ].map((metric) => (
                              <Card key={metric.label}>
                                <CardContent className="p-4">
                                  <metric.icon className={`h-5 w-5 mb-2 ${metric.color}`} />
                                  <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
                                  <div className="text-xs text-gray-600 mt-1">{metric.label}</div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="py-4 text-center text-sm text-gray-500">Sin datos de participación</div>
                        )}
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

                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Informe de Rendimiento */}
                  <AccordionItem value="performance-report">
                    <div className="flex items-center justify-between pr-4">
                      <AccordionTrigger className="hover:no-underline flex-1">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">Informe por Colegio, Curso y Área</span>
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
                                    <TableCell>{r.schoolName}</TableCell>
                                    <TableCell>{r.courseName}</TableCell>
                                    <TableCell>{r.competencyName}</TableCell>
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

                </Accordion>
              </CardContent>
            </Card>

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
    </>
  )
}
