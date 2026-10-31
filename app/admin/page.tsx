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
import { AnalyticsTab } from "@/components/admin/AnalyticsTab"
import { ExamManagement } from "@/components/ExamManagement"
import UserForm from "@/components/UserForm"
import SchoolForm from "@/components/SchoolForm"
import QuestionForm from "@/components/QuestionForm"
import { QuestionManagementNew } from "@/components/QuestionManagementNew"
import { LessonManagement } from "@/components/LessonManagement"
import { ModuleManagement } from "@/components/ModuleManagement"
import { CourseManagement } from "@/components/CourseManagement"
import { BulkImportCenter } from "@/components/BulkImportCenter"
import { PerformanceLevelManagement } from "@/components/PerformanceLevelManagement"
import { BrandLoading } from "@/components/BrandLoading"
import { NotificationManagement } from "@/components/NotificationManagement"
import { StudentsManagement } from "@/components/StudentsManagement"
import { LiveClassManagement } from "@/components/LiveClassManagement"
import { ManualSimulacroManagement } from "@/components/ManualSimulacroManagement"
import { OtrosSimulacroManagement } from "@/components/OtrosSimulacroManagement"
// Datos placeholder eliminados - ahora usamos solo datos reales de la base de datos

export default function AdminDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const forbidden = searchParams.get('forbidden') === '1'
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState("analytics")
  // Colegio elegido en Analytics; la pestaña Resultados filtra por el mismo
  const [filterSchoolId, setFilterSchoolId] = useState<string>("all")
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)

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
  
  // Asegurar que los arrays sean siempre válidos
  const safeCourses = Array.isArray(courses) ? courses : []
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
                <TabsTrigger value="performance-levels" className="flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm">
                  <Target className="h-4 w-4 flex-shrink-0" />
                  <span>Niveles ICFES</span>
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
          <TabsContent value="analytics" forceMount className="space-y-6 data-[state=inactive]:hidden">
            <AnalyticsTab
              schools={safeSchools}
              courses={safeCourses}
              competencies={safeCompetencies}
              filterSchoolId={filterSchoolId}
              onFilterSchoolIdChange={setFilterSchoolId}
            />
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

          {/* PERFORMANCE LEVELS TAB */}
          {session?.user?.role === 'teacher_admin' && (
            <TabsContent value="performance-levels" className="space-y-6">
              <PerformanceLevelManagement />
            </TabsContent>
          )}

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
