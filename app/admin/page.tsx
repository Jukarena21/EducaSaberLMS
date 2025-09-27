"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
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
import { useAnalytics } from "@/hooks/useAnalytics"
import UserForm from "@/components/UserForm"
import SchoolForm from "@/components/SchoolForm"
import QuestionForm from "@/components/QuestionForm"
import { QuestionManagementNew } from "@/components/QuestionManagementNew"
import { LessonManagement } from "@/components/LessonManagement"
import { ModuleManagement } from "@/components/ModuleManagement"
import { CourseManagement } from "@/components/CourseManagement"
import { ExamManagement } from "@/components/ExamManagement"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  AreaChart,
  Area,
  Pie,
} from "recharts"

// Datos de ejemplo para gráficos
const rendimientoTemporal = [
  { mes: "Ene", matematicas: 65, lectura: 72, ciencias: 68, sociales: 75, ingles: 70 },
  { mes: "Feb", matematicas: 68, lectura: 75, ciencias: 71, sociales: 78, ingles: 73 },
  { mes: "Mar", matematicas: 72, lectura: 78, ciencias: 74, sociales: 80, ingles: 76 },
  { mes: "Abr", matematicas: 75, lectura: 80, ciencias: 77, sociales: 82, ingles: 78 },
  { mes: "May", matematicas: 78, lectura: 83, ciencias: 80, sociales: 85, ingles: 81 },
  { mes: "Jun", matematicas: 80, lectura: 85, ciencias: 82, sociales: 87, ingles: 83 },
]

const distribucionNotas = [
  { rango: "0-40", estudiantes: 45, color: "#ef4444" },
  { rango: "41-60", estudiantes: 120, color: "#f97316" },
  { rango: "61-80", estudiantes: 380, color: "#eab308" },
  { rango: "81-100", estudiantes: 255, color: "#22c55e" },
]

const actividadDiaria = [
  { hora: "06:00", estudiantes: 12 },
  { hora: "08:00", estudiantes: 45 },
  { hora: "10:00", estudiantes: 89 },
  { hora: "12:00", estudiantes: 156 },
  { hora: "14:00", estudiantes: 234 },
  { hora: "16:00", estudiantes: 298 },
  { hora: "18:00", estudiantes: 187 },
  { hora: "20:00", estudiantes: 134 },
  { hora: "22:00", estudiantes: 67 },
]

export default function AdminDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const forbidden = searchParams.get('forbidden') === '1'
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState("analytics")
  const [selectedPeriod, setSelectedPeriod] = useState("6m")
  
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
  // Programaciones de informes (stub en memoria)
  const [scheduledReports, setScheduledReports] = useState<Array<{ id: string; name: string; cron: string; nextRun: string; active: boolean }>>([
    { id: 'weekly', name: 'Informe Semanal', cron: '0 8 * * 1', nextRun: 'Lunes 8:00 AM', active: true },
    { id: 'monthly', name: 'Reporte Mensual', cron: '0 8 1 * *', nextRun: '1ro de cada mes 8:00 AM', active: true },
  ])

  const toggleSchedule = (id: string) => {
    setScheduledReports(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s))
  }

  const runScheduleNow = (id: string) => {
    const s = scheduledReports.find(x => x.id === id)
    if (!s) return
    // Simulación: exporta el CSV de resumen con nombre del schedule
    const header = ['Colegio','Curso','Competencia','Intentos','Promedio','Aprobación %']
    const lines = reportRows.map(r => [
      (schools.find(sc=>sc.id===r.schoolId)?.name)||'NA',
      (courses.find(c=>c.id===r.courseId)?.title)||'NA',
      (competencies.find(c=>c.id===r.competencyId)?.displayName)||'NA',
      r.attempts,
      r.avgScore,
      r.passRate,
    ].join(','))
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${s.name.replace(/\s+/g,'_').toLowerCase()}_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  // Filtros de analytics
  const [filterSchoolId, setFilterSchoolId] = useState<string>('all')
  const [filterCourseId, setFilterCourseId] = useState<string>('all')
  const [filterGrade, setFilterGrade] = useState<string>('all')
  const [filterCompetencyId, setFilterCompetencyId] = useState<string>('all')
  const [filterMinAge, setFilterMinAge] = useState<string>('')
  const [filterMaxAge, setFilterMaxAge] = useState<string>('')
  const [comparePeriod, setComparePeriod] = useState<string>('none')
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddCourse, setShowAddCourse] = useState(false)
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)

  // Hooks para obtener datos
  const { users, loading: usersLoading, error: usersError } = useUsers()
  const { schools, loading: schoolsLoading, error: schoolsError } = useSchools()
  const { questions, loading: questionsLoading, error: questionsError } = useQuestions()
  const { competencies, loading: competenciesLoading, error: competenciesError } = useCompetencies()
  const { lessons, loading: lessonsLoading, error: lessonsError } = useLessons()
  const { modules, loading: modulesLoading, error: modulesError } = useModules(true) // forCourseCreation = true
  const { courses, loading: coursesLoading, error: coursesError } = useCourses()

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

  // Refetch analytics when filters change
  useEffect(() => {
    if (activeTab !== 'analytics') return
    
    const filters = {
      schoolId: filterSchoolId !== 'all' ? filterSchoolId : undefined,
      courseId: filterCourseId !== 'all' ? filterCourseId : undefined,
      grade: filterGrade !== 'all' ? filterGrade : undefined,
      competencyId: filterCompetencyId !== 'all' ? filterCompetencyId : undefined,
      minAge: filterMinAge || undefined,
      maxAge: filterMaxAge || undefined
    }
    
    refetchAnalytics(filters)
  }, [activeTab, filterSchoolId, filterCourseId, filterGrade, filterCompetencyId, filterMinAge, filterMaxAge]) // Removed refetchAnalytics from deps


  const exportCompCSV = () => {
    const header = ['Competencia','Dificultad','Intentos','Promedio','Aprobación %']
    const lines = compReportRows.map((r:any) => [
      (competencies.find(c=>c.id===r.competencyId)?.displayName)||'NA',
      r.difficultyLevel,
      r.attempts,
      r.avgScore,
      r.passRate,
    ].join(','))
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reporte_competencias.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportRowsToCSV = () => {
    const header = ['Colegio','Curso','Competencia','Intentos','Promedio','Aprobación %']
    const lines = reportRows.map(r => [
      (schools.find(s=>s.id===r.schoolId)?.name)||'NA',
      (courses.find(c=>c.id===r.courseId)?.title)||'NA',
      (competencies.find(c=>c.id===r.competencyId)?.displayName)||'NA',
      r.attempts,
      r.avgScore,
      r.passRate,
    ].join(','))
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reporte_resumen.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportEngagementCSV = () => {
    if (!engagementMetrics) return
    
    const headers = ['Métrica', 'Valor', 'Unidad']
    const rows = [
      ['Lecciones Completadas', engagementMetrics.totalLessonsCompleted, 'unidades'],
      ['Tiempo Total de Estudio', engagementMetrics.totalStudyTimeHours, 'horas'],
      ['Duración Promedio de Sesión', engagementMetrics.averageSessionDurationMinutes, 'minutos'],
      ['Usuarios Activos', engagementMetrics.activeUsers, 'usuarios'],
      ['Cursos Completados', engagementMetrics.courseCompletions, 'cursos'],
      ['Progreso Promedio', engagementMetrics.averageProgress, 'porcentaje'],
      ['Tasa de Finalización', engagementMetrics.completionRate, 'porcentaje']
    ]
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `metricas_engagement_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Mostrar loading mientras verifica la sesión
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#73A2D3] mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no hay sesión, no renderizar nada (se redirigirá)
  if (!session || (session.user?.role !== "school_admin" && session.user?.role !== "teacher_admin")) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {forbidden && (
        <div className="container mx-auto px-4 pt-4">
          <div className="rounded-md border border-yellow-300 bg-yellow-50 text-yellow-900 p-3 text-sm flex items-start justify-between">
            <div>
              Acceso restringido. No tienes permisos para acceder a esa sección.
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Image src="/logo-educasaber.png" alt="Educasaber Colombia" width={40} height={40} />
            <h1 className="text-xl font-semibold text-gray-800">Portal Administrativo</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </Button>
            <Badge variant="secondary" className="bg-[#C00102] text-white">
              Administrador
            </Badge>
            <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {session?.user?.role === 'school_admin' ? 'Admin Colegio' : 'Panel de Administración'}
          </h2>
          <p className="text-gray-600">
            {session?.user?.role === 'school_admin' 
              ? 'Gestiona estudiantes, contenido y analiza el rendimiento de tu institución'
              : 'Gestiona contenido, analiza datos y supervisa el rendimiento de la plataforma'
            }
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${session?.user?.role === 'teacher_admin' ? 'grid-cols-10' : 'grid-cols-8'}`}>
            <TabsTrigger value="analytics">📊 Analytics e Informes</TabsTrigger>
            <TabsTrigger value="content">📚 Contenido</TabsTrigger>
            <TabsTrigger value="lessons">📖 Lecciones</TabsTrigger>
            <TabsTrigger value="modules">📚 Módulos</TabsTrigger>
            <TabsTrigger value="courses">🎓 Cursos</TabsTrigger>
            <TabsTrigger value="questions">❓ Preguntas</TabsTrigger>
            <TabsTrigger value="exams">📝 Exámenes</TabsTrigger>
            <TabsTrigger value="students">{session?.user?.role === 'teacher_admin' ? '👥 Usuarios' : '👥 Estudiantes'}</TabsTrigger>
            {session?.user?.role === 'teacher_admin' && (
              <TabsTrigger value="schools">🏫 Colegios</TabsTrigger>
            )}
            {session?.user?.role === 'teacher_admin' && (
              <TabsTrigger value="settings">⚙️ Configuración</TabsTrigger>
            )}
          </TabsList>

                 {/* ANALYTICS + REPORTS TAB */}
                 <TabsContent value="analytics" className="space-y-6">
                   {/* Resumen Ejecutivo */}
                   {kpis && (
                     <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                       <CardHeader>
                         <CardTitle className="flex items-center space-x-2">
                           <BarChart3 className="h-5 w-5 text-blue-600" />
                           <span className="text-blue-800">
                             Resumen Ejecutivo
                             {session?.user?.role === 'school_admin' && (
                               <span className="text-sm font-normal text-gray-600 ml-2">
                                 (Datos de tu colegio únicamente)
                               </span>
                             )}
                           </span>
                         </CardTitle>
                       </CardHeader>
                       <CardContent>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div className="text-center">
                             <div className="text-3xl font-bold text-blue-600">{kpis.activeStudents.toLocaleString('es-CO')}</div>
                             <div className="text-sm text-blue-700">Estudiantes Activos</div>
                             <div className="text-xs text-gray-600 mt-1">En el período seleccionado</div>
                           </div>
                           <div className="text-center">
                             <div className="text-3xl font-bold text-green-600">{kpis.averageScore.toFixed(1)}%</div>
                             <div className="text-sm text-green-700">Promedio General</div>
                             <div className="text-xs text-gray-600 mt-1">Rendimiento académico</div>
                           </div>
                           <div className="text-center">
                             <div className="text-3xl font-bold text-purple-600">{kpis.examAttempts.toLocaleString('es-CO')}</div>
                             <div className="text-sm text-purple-700">Exámenes Realizados</div>
                             <div className="text-xs text-gray-600 mt-1">Actividad de evaluación</div>
                           </div>
                         </div>
                       </CardContent>
                     </Card>
                   )}

                   {/* Filtros */}
                   <Card>
                     <CardHeader>
                       <CardTitle>Filtros de Análisis</CardTitle>
                     </CardHeader>
                     <CardContent>
                       <div className={`grid grid-cols-1 md:grid-cols-${session?.user?.role === 'teacher_admin' ? '4' : '3'} gap-4`}>
                         {/* Solo mostrar filtro de colegio para teacher_admin */}
                         {session?.user?.role === 'teacher_admin' && (
                           <div>
                             <Label>Colegio</Label>
                             <Select value={filterSchoolId} onValueChange={setFilterSchoolId}>
                               <SelectTrigger>
                                 <SelectValue placeholder="Todos" />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="all">Todos</SelectItem>
                                 {schools.map(s => (
                                   <SelectItem key={s.id} value={s.id || ''}>{s.name}</SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                           </div>
                         )}
                         <div>
                           <Label>Curso</Label>
                           <Select value={filterCourseId} onValueChange={setFilterCourseId}>
                             <SelectTrigger>
                               <SelectValue placeholder="Todos" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="all">Todos</SelectItem>
                               {courses.map(c => (
                                 <SelectItem key={c.id} value={c.id || ''}>{c.title}</SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </div>
                         <div>
                           <Label>Año Escolar</Label>
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
                           <Label>Competencia</Label>
                           <Select value={filterCompetencyId} onValueChange={setFilterCompetencyId}>
                             <SelectTrigger>
                               <SelectValue placeholder="Todas" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="all">Todas</SelectItem>
                               {competencies.map(comp => (
                                 <SelectItem key={comp.id} value={comp.id || ''}>{comp.displayName}</SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                         <div>
                           <Label>Edad mínima</Label>
                           <Input value={filterMinAge} onChange={(e) => setFilterMinAge(e.target.value)} placeholder="Ej: 12" />
                         </div>
                         <div>
                           <Label>Edad máxima</Label>
                           <Input value={filterMaxAge} onChange={(e) => setFilterMaxAge(e.target.value)} placeholder="Ej: 18" />
                         </div>
                         <div>
                           <Label>Comparar con</Label>
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
                     </CardContent>
                   </Card>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-[#73A2D3]">{kpis ? (kpis.activeStudents).toLocaleString('es-CO') : '...'}</div>
                      <div className="text-sm text-gray-600">Estudiantes Activos</div>
                      {comparePeriod !== 'none' && (
                        <div className="text-xs text-green-600 flex items-center mt-1">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +12% vs período anterior
                        </div>
                      )}
                    </div>
                    <Users className="h-8 w-8 text-[#73A2D3]" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-[#C00102]">{kpis ? (kpis.examAttempts).toLocaleString('es-CO') : '...'}</div>
                      <div className="text-sm text-gray-600">Exámenes Realizados</div>
                    </div>
                    <FileText className="h-8 w-8 text-[#C00102]" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-[#73A2D3]">{kpis ? `${kpis.averageScore.toFixed(1)}%` : '...'}</div>
                      <div className="text-sm text-gray-600">Promedio General</div>
                    </div>
                    <Award className="h-8 w-8 text-[#73A2D3]" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-[#C00102]">{kpis ? (kpis.institutions).toLocaleString('es-CO') : '...'}</div>
                      <div className="text-sm text-gray-600">Instituciones</div>
                    </div>
                    <Building className="h-8 w-8 text-[#C00102]" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Engagement Metrics */}
            {engagementMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-[#22c55e]">{engagementMetrics.totalLessonsCompleted.toLocaleString('es-CO')}</div>
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
                        <div className="text-2xl font-bold text-[#f97316]">{engagementMetrics.totalStudyTimeHours.toLocaleString('es-CO')}h</div>
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
                        <div className="text-2xl font-bold text-[#8b5cf6]">{engagementMetrics.completionRate.toFixed(1)}%</div>
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
                        <div className="text-2xl font-bold text-[#06b6d4]">{engagementMetrics.courseCompletions.toLocaleString('es-CO')}</div>
                        <div className="text-sm text-gray-600">Cursos Completados</div>
                      </div>
                      <Award className="h-8 w-8 text-[#06b6d4]" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Period Selector */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Análisis de Rendimiento</h3>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[180px]">
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

            {/* Charts Grid (Analytics) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rendimiento por Materia */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <LineChart className="h-5 w-5" />
                    <span>Evolución por Materia</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={gradeSeries.length ? gradeSeries : rendimientoTemporal}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={gradeSeries.length ? 'period' : 'mes'} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {/* Si vienen claves dinámicas por competencia, las dibujamos */}
                      {gradeSeries.length ? (
                        Object.keys(gradeSeries[0] || {}).filter(k => k !== 'period').map((key, idx) => (
                          <Line key={key} type="monotone" dataKey={key} stroke={["#C00102","#73A2D3","#22c55e","#f97316","#8b5cf6"][idx % 5]} strokeWidth={2} />
                        ))
                      ) : (
                        <>
                          <Line type="monotone" dataKey="matematicas" stroke="#C00102" strokeWidth={2} />
                          <Line type="monotone" dataKey="lectura" stroke="#73A2D3" strokeWidth={2} />
                          <Line type="monotone" dataKey="ciencias" stroke="#22c55e" strokeWidth={2} />
                          <Line type="monotone" dataKey="sociales" stroke="#f97316" strokeWidth={2} />
                          <Line type="monotone" dataKey="ingles" stroke="#8b5cf6" strokeWidth={2} />
                        </>
                      )}
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Distribución de Notas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5" />
                    <span>Distribución de Calificaciones</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={gradeDistribution.length ? gradeDistribution : distribucionNotas}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="estudiantes"
                        label={({ rango, estudiantes }) => `${rango}: ${estudiantes}`}
                      >
                        {(gradeDistribution.length ? gradeDistribution : distribucionNotas).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || ['#ef4444','#f97316','#eab308','#22c55e'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  {gradeDistribution.length === 0 && (
                    <div className="text-center text-sm text-gray-500 mt-2">Sin datos en el rango/filtros seleccionados</div>
                  )}
                </CardContent>
              </Card>

              {/* Actividad Diaria */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Actividad por Hora</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={hourlyActivity.length ? hourlyActivity : actividadDiaria}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hora" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="estudiantes" stroke="#73A2D3" fill="#73A2D3" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Instituciones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Ranking de Instituciones</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={(schoolRanking.length ? schoolRanking.map((r) => ({ nombre: (schools.find(s=>s.id===r.schoolId)?.name)||r.schoolId, promedio: r.avgScore })) : [
                        { nombre: "San José", promedio: 85 },
                        { nombre: "La Salle", promedio: 82 },
                        { nombre: "Santa María", promedio: 79 },
                        { nombre: "Nacional", promedio: 75 },
                        { nombre: "Moderno", promedio: 68 },
                      ])}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="promedio" fill="#73A2D3" />
                    </BarChart>
                  </ResponsiveContainer>
                  {schoolRanking.length === 0 && (
                    <div className="text-center text-sm text-gray-500 mt-2">Sin datos en el rango/filtros seleccionados</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Engagement Charts */}
            {engagementMetrics && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Métricas de Engagement</h3>
                  <Button onClick={exportEngagementCSV} variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar Métricas
                  </Button>
                </div>
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
                        <span className="text-2xl font-bold text-[#73A2D3]">{engagementMetrics.averageProgress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#73A2D3] h-2 rounded-full" 
                          style={{ width: `${engagementMetrics.averageProgress}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tasa de Finalización</span>
                        <span className="text-2xl font-bold text-[#22c55e]">{engagementMetrics.completionRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#22c55e] h-2 rounded-full" 
                          style={{ width: `${engagementMetrics.completionRate}%` }}
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
                        <div className="text-3xl font-bold text-[#f97316]">{engagementMetrics.totalStudyTimeHours.toLocaleString('es-CO')}h</div>
                        <div className="text-sm text-gray-600">Tiempo Total de Estudio</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#8b5cf6]">{engagementMetrics.averageSessionDurationMinutes.toFixed(0)}min</div>
                        <div className="text-sm text-gray-600">Duración Promedio de Sesión</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#06b6d4]">{engagementMetrics.activeUsers.toLocaleString('es-CO')}</div>
                        <div className="text-sm text-gray-600">Usuarios Activos</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </div>
              </div>
            )}

            {/* Reports Section */}
            <div className="flex items-center justify-between pt-4">
              <h3 className="text-lg font-semibold">Informes</h3>
              <Button onClick={exportRowsToCSV} variant="outline">
                <FileText className="h-4 w-4 mr-2" /> Exportar CSV
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tabla de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="py-8 text-center">Cargando...</div>
                ) : analyticsError ? (
                  <div className="py-8 text-center text-red-600">{analyticsError}</div>
                ) : (
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
                      {reportRows.map((r, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{(schools.find(s=>s.id===r.schoolId)?.name)||'NA'}</TableCell>
                          <TableCell>{(courses.find(c=>c.id===r.courseId)?.title)||'NA'}</TableCell>
                          <TableCell>{(competencies.find(c=>c.id===r.competencyId)?.displayName)||'NA'}</TableCell>
                          <TableCell>{r.attempts}</TableCell>
                          <TableCell>{r.avgScore}%</TableCell>
                          <TableCell>{r.passRate}%</TableCell>
                        </TableRow>
                      ))}
                      {reportRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-sm text-gray-500">Sin datos para los filtros seleccionados</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Competency x Difficulty Report */}
            <div className="flex items-center justify-between pt-2">
              <h4 className="text-md font-semibold">Por Competencia y Dificultad</h4>
              <Button onClick={exportCompCSV} variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" /> Exportar CSV
              </Button>
            </div>
            <Card>
              <CardContent>
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
                    {compReportRows.map((r:any, idx:number) => (
                      <TableRow key={idx}>
                        <TableCell>{(competencies.find(c=>c.id===r.competencyId)?.displayName)||'NA'}</TableCell>
                        <TableCell>{r.difficultyLevel}</TableCell>
                        <TableCell>{r.attempts}</TableCell>
                        <TableCell>{r.avgScore}%</TableCell>
                        <TableCell>{r.passRate}%</TableCell>
                      </TableRow>
                    ))}
                    {compReportRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-gray-500">Sin datos</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Evolución Mensual</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={reportSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="avgScore" name="Promedio" stroke="#73A2D3" strokeWidth={2} />
                      <Line type="monotone" dataKey="passRate" name="Aprobación %" stroke="#22c55e" strokeWidth={2} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                  {reportSeries.length === 0 && (
                    <div className="text-center text-sm text-gray-500 mt-2">Sin datos</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Calificaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie data={reportDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="estudiantes">
                        {reportDistribution.map((d, i) => (
                          <Cell key={i} fill={["#ef4444","#f97316","#eab308","#22c55e"][i%4]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  {reportDistribution.length === 0 && (
                    <div className="text-center text-sm text-gray-500 mt-2">Sin datos</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Programaciones de Informes (Stub) */}
            <Card>
              <CardHeader>
                <CardTitle>Programaciones de Informes (stub)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>CRON</TableHead>
                      <TableHead>Próxima ejecución</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scheduledReports.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.cron}</TableCell>
                        <TableCell>{s.nextRun}</TableCell>
                        <TableCell>
                          <Badge className={s.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {s.active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => toggleSchedule(s.id)}>
                            {s.active ? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button size="sm" onClick={() => runScheduleNow(s.id)}>Ejecutar ahora</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="text-xs text-gray-500 mt-2">Stub local: no persiste ni crea jobs reales aún.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONTENT MANAGEMENT TAB */}
          <TabsContent value="content" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Gestión de Contenido</h3>
              <div className="flex space-x-2">
                <Button onClick={() => setShowAddCourse(true)} className="bg-[#73A2D3]">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Curso
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Contenido
                </Button>
              </div>
            </div>

            {/* Content Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-[#73A2D3]" />
                  <div className="text-2xl font-bold">24</div>
                  <div className="text-sm text-gray-600">Cursos Activos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Video className="h-8 w-8 mx-auto mb-2 text-[#C00102]" />
                  <div className="text-2xl font-bold">156</div>
                  <div className="text-sm text-gray-600">Videos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-[#73A2D3]" />
                  <div className="text-2xl font-bold">342</div>
                  <div className="text-sm text-gray-600">Lecciones</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 text-[#C00102]" />
                  <div className="text-2xl font-bold">89</div>
                  <div className="text-sm text-gray-600">Recursos</div>
                </CardContent>
              </Card>
            </div>

            {/* Content Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Cursos y Contenido</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Input placeholder="Buscar contenido..." className="w-64" />
                    <Button variant="outline" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Curso/Lección</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Materia</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Estudiantes</TableHead>
                      <TableHead>Última Actualización</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      {
                        nombre: "Matemáticas Básicas",
                        tipo: "Curso",
                        materia: "Matemáticas",
                        estado: "Publicado",
                        estudiantes: 245,
                        fecha: "2024-01-15",
                      },
                      {
                        nombre: "Álgebra Lineal",
                        tipo: "Módulo",
                        materia: "Matemáticas",
                        estado: "Borrador",
                        estudiantes: 0,
                        fecha: "2024-01-10",
                      },
                      {
                        nombre: "Comprensión Lectora",
                        tipo: "Curso",
                        materia: "Lectura Crítica",
                        estado: "Publicado",
                        estudiantes: 189,
                        fecha: "2024-01-12",
                      },
                      {
                        nombre: "Química Orgánica",
                        tipo: "Lección",
                        materia: "Ciencias Naturales",
                        estado: "Revisión",
                        estudiantes: 67,
                        fecha: "2024-01-08",
                      },
                    ].map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.nombre}</TableCell>
                        <TableCell>
                          <Badge
                            variant={item.tipo === "Curso" ? "default" : "secondary"}
                            className={
                              item.tipo === "Curso"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                            }
                          >
                            {item.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.materia}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.estado === "Publicado"
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : item.estado === "Borrador"
                                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            }
                          >
                            {item.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.estudiantes}</TableCell>
                        <TableCell>{item.fecha}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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

          {/* EXAMS TAB */}
          <TabsContent value="exams" className="space-y-6">
            <ExamManagement competencies={competencies} />
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
                <BulkImportWidget />
              </CardContent>
            </Card>
          </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Add Course Modal */}
      {showAddCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Crear Nuevo Curso</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAddCourse(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Nombre del Curso</Label>
                <Input placeholder="Ej: Matemáticas Avanzadas" />
              </div>
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
                <Label>Descripción</Label>
                <Textarea placeholder="Descripción del curso..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duración (semanas)</Label>
                  <Input type="number" placeholder="12" />
                </div>
                <div>
                  <Label>Nivel</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basico">Básico</SelectItem>
                      <SelectItem value="intermedio">Intermedio</SelectItem>
                      <SelectItem value="avanzado">Avanzado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <Button onClick={() => setShowAddCourse(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button className="flex-1 bg-[#73A2D3]">
                  <Save className="h-4 w-4 mr-2" />
                  Crear Curso
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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

    </div>
  )
}

// Homepage Settings Component
function HomepageSettings() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCarousel, setShowCarousel] = useState(true)
  const [institutions, setInstitutions] = useState<Array<{ id: string; name: string; logoUrl: string; website?: string }>>([])
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

        <div>
          <div className="font-medium mb-2">Instituciones</div>
          <div className="space-y-3">
            {institutions.map(inst => (
              <div key={inst.id} className="flex items-center gap-3 p-2 rounded border">
                <img src={inst.logoUrl} alt={inst.name} className="h-8 w-8 object-contain" />
                <div className="flex-1">
                  <div className="font-medium">{inst.name}</div>
                  {inst.website && <div className="text-xs text-gray-500">{inst.website}</div>}
                </div>
                <Button variant="outline" size="sm" onClick={() => removeInstitution(inst.id)}>Quitar</Button>
              </div>
            ))}
            {institutions.length === 0 && (
              <div className="text-sm text-gray-500">Aún no hay instituciones agregadas.</div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Nombre" value={newInst.name} onChange={e=>setNewInst(v=>({ ...v, name: e.target.value }))} />
            <Input placeholder="Logo URL" value={newInst.logoUrl} onChange={e=>setNewInst(v=>({ ...v, logoUrl: e.target.value }))} />
            <Input placeholder="Website (opcional)" value={newInst.website} onChange={e=>setNewInst(v=>({ ...v, website: e.target.value }))} />
          </div>
          <div className="mt-2">
            <Button variant="secondary" onClick={addInstitution}>Agregar</Button>
          </div>
        </div>

        <div className="pt-2">
          <Button onClick={save} disabled={loading}>{loading ? 'Guardando...' : 'Guardar cambios'}</Button>
        </div>
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
              {result.errors.slice(0,10).map((e, idx)=>(
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

// Students Management Component
function StudentsManagement() {
  const { data: session } = useSession()
  const {
    users,
    schools,
    pagination,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    getUser,
    clearError,
  } = useUsers()

  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    schoolId: 'all',
  })
  const [currentPage, setCurrentPage] = useState(1)

  // Load users on component mount
  useEffect(() => {
    const apiFilters = {
      page: currentPage,
      search: filters.search,
      role: filters.role === 'all' ? '' : filters.role,
      schoolId: filters.schoolId === 'all' ? '' : filters.schoolId,
    }
    fetchUsers(apiFilters)
  }, [currentPage, filters])

  const handleCreateUser = async (userData: any) => {
    const result = await createUser(userData)
    if (result) {
      setShowUserForm(false)
      // Show success message
      alert('Usuario creado exitosamente')
    }
  }

  const handleUpdateUser = async (userData: any) => {
    if (editingUser) {
      const result = await updateUser(editingUser.id, userData)
      if (result) {
        setShowUserForm(false)
        setEditingUser(null)
        // Show success message
        alert('Usuario actualizado exitosamente')
      }
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      const result = await deleteUser(userId)
      if (result) {
        // Show success message
        alert('Usuario eliminado exitosamente')
      }
    }
  }

  const handleEditUser = async (userId: string) => {
    const user = await getUser(userId)
    if (user) {
      setEditingUser(user)
      setShowUserForm(true)
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'student': return 'Estudiante'
      case 'school_admin': return 'Administrador de Colegio'
      case 'teacher_admin': return 'Profesor Administrador'
      default: return role
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestión de Usuarios</h3>
          <p className="text-sm text-gray-600">
            {session?.user?.role === 'teacher_admin' 
              ? 'Administra estudiantes, profesores y administradores del sistema'
              : 'Consulta y supervisa los usuarios de tu institución'
            }
          </p>
        </div>
        {session?.user?.role === 'teacher_admin' && (
          <Button onClick={() => setShowUserForm(true)} className="bg-[#C00102]">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Buscar</Label>
              <Input
                placeholder="Nombre, apellido o email..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div>
              <Label>Rol</Label>
              <Select value={filters.role} onValueChange={(value) => handleFilterChange('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                                 <SelectContent>
                   <SelectItem value="all">Todos los roles</SelectItem>
                   <SelectItem value="student">Estudiante</SelectItem>
                   <SelectItem value="school_admin">Administrador de Colegio</SelectItem>
                   {session?.user?.role === 'teacher_admin' && (
                     <SelectItem value="teacher_admin">Profesor Administrador</SelectItem>
                   )}
                 </SelectContent>
              </Select>
            </div>
            {session?.user?.role === 'teacher_admin' && (
              <div>
                <Label>Colegio</Label>
                <Select value={filters.schoolId} onValueChange={(value) => handleFilterChange('schoolId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los colegios" />
                  </SelectTrigger>
                                   <SelectContent>
                   <SelectItem value="all">Todos los colegios</SelectItem>
                   {schools.map(school => (
                     <SelectItem key={school.id} value={school.id}>
                       {school.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-end">
                             <Button 
                 onClick={() => {
                   const apiFilters = {
                     page: 1,
                     search: filters.search,
                     role: filters.role === 'all' ? '' : filters.role,
                     schoolId: filters.schoolId === 'all' ? '' : filters.schoolId,
                   }
                   fetchUsers(apiFilters)
                 }}
                 disabled={loading}
                 className="w-full"
               >
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-red-700">{error}</p>
              <Button variant="ghost" size="sm" onClick={clearError}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#73A2D3]"></div>
              <span className="ml-2">Cargando usuarios...</span>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Colegio</TableHead>
                    <TableHead>Actividad</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-[#73A2D3] flex items-center justify-center text-white font-semibold">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            user.role === 'student'
                              ? 'bg-blue-100 text-blue-800'
                              : user.role === 'school_admin'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-purple-100 text-purple-800'
                          }
                        >
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.school?.name || 'Sin asignar'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Sesiones: {user.sessionsStarted}</div>
                          <div>Tiempo: {formatTime(user.totalPlatformTimeMinutes)}</div>
                          {user.lastSessionAt && (
                            <div className="text-gray-500">
                              Última: {formatDate(user.lastSessionAt)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditUser(user.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {session?.user?.role === 'teacher_admin' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-700">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                    {pagination.total} usuarios
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === 1}
                      onClick={() => setCurrentPage(pagination.page - 1)}
                    >
                      Anterior
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      Página {pagination.page} de {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page === pagination.pages}
                      onClick={() => setCurrentPage(pagination.page + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Form Modal - Only for Teacher Admins */}
      {session?.user?.role === 'teacher_admin' && showUserForm && (
        <UserForm
          user={editingUser}
          schools={schools}
          onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
          onCancel={() => {
            setShowUserForm(false)
            setEditingUser(null)
          }}
          loading={loading}
        />
      )}
    </div>
  )
}

// Schools Management Component
function SchoolsManagement() {
  const { schools, loading, error, createSchool, updateSchool, deleteSchool } = useSchools()
  const [showSchoolForm, setShowSchoolForm] = useState(false)
  const [editingSchool, setEditingSchool] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    search: '',
    city: 'none',
    institutionType: 'none',
  })

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
    const school = schools.find(s => s.id === schoolId)
    if (school) {
      setEditingSchool(school)
      setShowSchoolForm(true)
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value === 'none' ? '' : value }))
    setCurrentPage(1)
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
          <p className="text-gray-600">Administra las instituciones educativas registradas</p>
        </div>
        <Button onClick={() => setShowSchoolForm(true)} className="bg-[#C00102] hover:bg-[#a00102]">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Colegio
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Nombre, ciudad, barrio..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="city">Ciudad</Label>
              <Select value={filters.city} onValueChange={(value) => handleFilterChange('city', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las ciudades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todas las ciudades</SelectItem>
                  {Array.from(new Set(schools.map(s => s.city))).map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="institutionType">Tipo de Institución</Label>
              <Select value={filters.institutionType} onValueChange={(value) => handleFilterChange('institutionType', value)}>
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
