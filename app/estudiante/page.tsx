"use client"

// Evitar prerender estático con restricciones de useSearchParams en Next 15
export const dynamic = "force-dynamic"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { BookOpen, Award, Clock, CheckCircle, TrendingUp, BarChart3, Calendar, Home, GraduationCap, FileText, BarChart, Trophy, Video } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useStudentDashboard } from "@/hooks/useStudentDashboard"
import { StudentExamsTab } from "@/components/StudentExamsTab"
import { ProgressTracker } from "@/components/ProgressTracker"
import { CourseCatalog } from "@/components/CourseCatalog"
import { MyCourses } from "@/components/MyCourses"
import { ActivityHistory } from "@/components/ActivityHistory"
import { NotificationToastContainer } from "@/components/NotificationToast"
import { useNotifications } from "@/hooks/useNotifications"
import { GamificationPanel } from "@/components/GamificationPanel"
import { StudentHeader } from "@/components/StudentHeader"
import { useSchoolBranding } from "@/hooks/useSchoolBranding"
import { BrandLoading } from "@/components/BrandLoading"
import { LiveClassCalendar } from "@/components/LiveClassCalendar"

export default function EstudianteDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const forbidden = searchParams.get('forbidden') === '1'
  const { data: session, status } = useSession()

  // Hook dashboard (siempre en mismo orden de render)
  const isStudent = !!session && session.user?.role === "student"
  const sessionReady = status !== "loading"
  const { loading: dashLoading, error: dashError, kpis, upcomingExams, recentActivity } = useStudentDashboard(sessionReady && isStudent)
  const { notifications, markAsRead } = useNotifications()
  const [tab, setTab] = useState("dashboard")

  // Branding del colegio para evitar parpadeo de colores de la empresa al entrar como estudiante
  const { loading: brandingLoading } = useSchoolBranding(session?.user?.schoolId)

  // Forzar que el splash de marca se vea al menos X ms
  const [splashMinTimePassed, setSplashMinTimePassed] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setSplashMinTimePassed(true), 1200) // 1.2s mínimo
    return () => clearTimeout(timeout)
  }, [])

  // Redirigir si no está autenticado o no es estudiante
  useEffect(() => {
    if (status === "loading") return // Esperar a que cargue la sesión
    
    if (!session) {
      router.push("/")
      return
    }

    if (session.user?.role !== "student") {
      router.push("/")
      return
    }
  }, [session, status, router])

  const initialLoading =
    status === "loading" ||
    !session ||
    session.user?.role !== "student" ||
    (brandingLoading && session?.user?.schoolId)

  if (initialLoading || !splashMinTimePassed) {
    const message =
      status === "loading"
        ? "Cargando tu sesión de estudiante..."
        : brandingLoading
        ? "Cargando la apariencia de tu colegio..."
        : "Preparando tu panel de estudiante..."
    return <BrandLoading message={message} />
  }

  // Si algo salió mal con la sesión/rol después del splash, no renderizar nada (se redirigirá por el efecto de arriba)
  if (!session || session.user?.role !== "student") {
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
      <StudentHeader />

      <div className="container mx-auto px-4 py-6">
        <div className="student-tabs-shell space-y-6">
          <div className="mb-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              ¡Bienvenido de nuevo, {session.user?.name || 'Estudiante'}!
            </h2>
            <p className="text-gray-600">Continúa tu preparación para el ICFES</p>
          </div>

          <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="student-tabs-bar grid w-full grid-cols-6 gap-1.5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span>Inicio</span>
            </TabsTrigger>
            <TabsTrigger value="cursos" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span>Mis Cursos</span>
            </TabsTrigger>
            <TabsTrigger value="examenes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Exámenes</span>
            </TabsTrigger>
            <TabsTrigger value="progreso" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span>Progreso</span>
            </TabsTrigger>
            <TabsTrigger value="gamificacion" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span>Logros</span>
            </TabsTrigger>
            <TabsTrigger value="clases-en-vivo" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span>Clases en Vivo</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards con ayudas contextuales */}
            <TooltipProvider delayDuration={200}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 cursor-help">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-3xl font-bold text-blue-700">{kpis ? kpis.activeCourses : '...'}</div>
                            <div className="text-sm text-blue-600 font-medium">Cursos Activos</div>
                          </div>
                          <div className="p-3 bg-blue-200 rounded-full">
                            <BookOpen className="h-6 w-6 text-blue-700" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
                    Número de cursos en los que estás inscrito y activos actualmente.{" "}
                    Se calcula a partir de tus inscripciones marcadas como activas por tu colegio.
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 cursor-help">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-3xl font-bold text-green-700">{kpis ? kpis.examCompleted : '...'}</div>
                            <div className="text-sm text-green-600 font-medium">Exámenes Completados</div>
                          </div>
                          <div className="p-3 bg-green-200 rounded-full">
                            <Award className="h-6 w-6 text-green-700" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
                    Cantidad total de exámenes que has terminado en la plataforma.{" "}
                    Solo se cuentan los intentos de examen que aparecen como completados.
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 cursor-help">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-3xl font-bold text-purple-700">{kpis ? Math.round((kpis.studyTimeMinutes||0)/60)+'h' : '...'}</div>
                            <div className="text-sm text-purple-600 font-medium">Tiempo de Estudio</div>
                          </div>
                          <div className="p-3 bg-purple-200 rounded-full">
                            <Clock className="h-6 w-6 text-purple-700" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
                    Tiempo total que has pasado estudiando dentro de la plataforma.{" "}
                    Se suman los minutos registrados en cada lección donde has tenido actividad.
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300 cursor-help">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-3xl font-bold text-orange-700">
                              {kpis ? (kpis.icfesScore !== undefined ? kpis.icfesScore : 'N/A') : '...'}
                            </div>
                            <div className="text-sm text-orange-600 font-medium">Puntaje ICFES</div>
                            <div className="text-xs text-orange-500 mt-1">Escala 0-500</div>
                          </div>
                          <div className="p-3 bg-orange-200 rounded-full">
                            <TrendingUp className="h-6 w-6 text-orange-700" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
                    Estimación de tu posible puntaje global en el ICFES (0-500).{" "}
                    Se calcula a partir de tus respuestas en simulacros completos y exámenes de diagnóstico, teniendo en cuenta la competencia, dificultad de las preguntas y qué tan recientes son tus exámenes.
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            {/* Próximos exámenes mejorado */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-800">
                  <Calendar className="h-6 w-6" />
                  <span>Próximos Exámenes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingExams.map((ex, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-100 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{ex.title || 'Examen'}</div>
                          <div className="text-sm text-gray-600">
                            {ex.startAt ? new Date(ex.startAt).toLocaleString('es-CO') : ''}
                            {ex.competency && ` • ${ex.competency}`}
                          </div>
                        </div>
                      </div>
                      <Badge className={ex.inProgress 
                        ? "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300"
                        : "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200"
                      }>
                        {ex.inProgress ? 'En Progreso' : 'Pendiente'}
                      </Badge>
                    </div>
                  ))}
                  {upcomingExams.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <div className="text-gray-500">No tienes exámenes próximos</div>
                      <div className="text-sm text-gray-400 mt-1">Perfecto, puedes enfocarte en estudiar</div>
                    </div>
                  )}
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200" 
                    onClick={() => setTab('examenes')}
                  >
                    Ir al Centro de Exámenes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Actividad reciente mejorada */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <BarChart3 className="h-6 w-6" />
                  <span>Actividad Reciente</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityHistory />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examenes" className="space-y-6">
            <StudentExamsTab />
          </TabsContent>

          <TabsContent value="progreso" className="space-y-6">
            <ProgressTracker />
          </TabsContent>

          <TabsContent value="cursos" className="space-y-6">
            <MyCourses />
          </TabsContent>

          <TabsContent value="gamificacion" className="space-y-6">
            <GamificationPanel />
          </TabsContent>

          <TabsContent value="clases-en-vivo" className="space-y-6">
            <LiveClassCalendar />
          </TabsContent>
        </Tabs>
        </div>
      </div>

      {/* Notificaciones Toast */}
      <NotificationToastContainer 
        notifications={notifications.filter(n => !n.isRead).slice(0, 3)} // Solo las 3 más recientes no leídas
        onClose={(id) => markAsRead(id)}
      />
    </div>
  )
}
