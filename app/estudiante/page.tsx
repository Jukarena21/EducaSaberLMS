"use client"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Award, Clock, CheckCircle, LogOut, TrendingUp, BarChart3, Calendar } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { useStudentDashboard } from "@/hooks/useStudentDashboard"
import { StudentExamsTab } from "@/components/StudentExamsTab"
import { ProgressTracker } from "@/components/ProgressTracker"
import { CourseCatalog } from "@/components/CourseCatalog"
import { MyCourses } from "@/components/MyCourses"
import { ActivityHistory } from "@/components/ActivityHistory"
import { NotificationCenter } from "@/components/NotificationCenter"
import { NotificationToastContainer } from "@/components/NotificationToast"
import { useNotifications } from "@/hooks/useNotifications"
import { GamificationPanel } from "@/components/GamificationPanel"

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
  if (!session || session.user?.role !== "student") {
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
            <h1 className="text-xl font-semibold text-gray-800">Portal del Estudiante</h1>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationCenter />
            <Badge variant="secondary" className="bg-[#73A2D3] text-white">
              Estudiante
            </Badge>
            <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Bienvenido de nuevo, {session.user?.firstName || 'Estudiante'}!</h2>
          <p className="text-gray-600">Continúa tu preparación para el ICFES</p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Inicio</TabsTrigger>
            <TabsTrigger value="cursos">Mis Cursos</TabsTrigger>
            <TabsTrigger value="examenes">Exámenes</TabsTrigger>
            <TabsTrigger value="progreso">Progreso</TabsTrigger>
            <TabsTrigger value="gamificacion">Logros</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-[#73A2D3]" />
                    <div>
                      <div className="text-2xl font-bold">{kpis ? kpis.activeCourses : '...'}</div>
                      <div className="text-sm text-gray-600">Cursos Activos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-[#C00102]" />
                    <div>
                      <div className="text-2xl font-bold">{kpis ? kpis.examCompleted : '...'}</div>
                      <div className="text-sm text-gray-600">Exámenes Completados</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-[#73A2D3]" />
                    <div>
                      <div className="text-2xl font-bold">{kpis ? Math.round((kpis.studyTimeMinutes||0)/60)+'h' : '...'}</div>
                      <div className="text-sm text-gray-600">Tiempo de Estudio</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-[#C00102]" />
                    <div>
                      <div className="text-2xl font-bold">{kpis ? `${kpis.averageScore}%` : '...'}</div>
                      <div className="text-sm text-gray-600">Puntaje Promedio</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Próximos exámenes */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Exámenes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingExams.map((ex, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-[#73A2D3]" />
                        <div>
                          <div className="font-medium">{ex.title || 'Examen'}</div>
                          <div className="text-sm text-gray-600">{ex.startAt ? new Date(ex.startAt).toLocaleString('es-CO') : ''}</div>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
                    </div>
                  ))}
                  {upcomingExams.length === 0 && (
                    <div className="text-sm text-gray-500 text-center">No tienes exámenes próximos</div>
                  )}
                  <Button className="w-full bg-[#73A2D3]" onClick={() => setTab('examenes')}>Ir a exámenes</Button>
                </div>
              </CardContent>
            </Card>

            {/* Actividad reciente */}
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
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
        </Tabs>
      </div>

      {/* Notificaciones Toast */}
      <NotificationToastContainer 
        notifications={notifications.filter(n => !n.isRead).slice(0, 3)} // Solo las 3 más recientes no leídas
        onClose={(id) => markAsRead(id)}
      />
    </div>
  )
}
