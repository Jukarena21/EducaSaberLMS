"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Users, 
  Target,
  Play,
  CheckCircle,
  Lock,
  TrendingUp,
  Award,
  Calendar
} from "lucide-react"

interface CourseDetailPageProps {
  params: Promise<{ courseId: string }>
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [courseData, setCourseData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    
    if (!session || session.user?.role !== "student") {
      router.push("/")
      return
    }

    loadCourseData()
  }, [session, status, router])

  const loadCourseData = async () => {
    try {
      const resolvedParams = await params
      const response = await fetch(`/api/student/courses/${resolvedParams.courseId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar el curso')
      }
      
      const data = await response.json()
      setCourseData(data)
    } catch (err) {
      setError('Error al cargar los datos del curso')
      console.error('Error loading course:', err)
    } finally {
      setLoading(false)
    }
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

  const getStatusColor = (status: string) => {
    const colors = {
      'completed': 'bg-green-100 text-green-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'not_started': 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'in_progress':
        return <Play className="h-4 w-4" />
      default:
        return <Lock className="h-4 w-4" />
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando curso...</p>
        </div>
      </div>
    )
  }

  if (error || !courseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">{error || 'Curso no encontrado'}</p>
            <Button onClick={() => router.push('/estudiante')} className="w-full mt-4">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => router.push('/estudiante')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{courseData.course.title}</h1>
              <p className="text-gray-600">{courseData.course.description}</p>
            </div>
          </div>

          {/* Course Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Course Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Información del Curso</CardTitle>
                    <Badge className={getDifficultyColor(courseData.course.difficultyLevel)}>
                      {courseData.course.difficultyLevel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-lg font-semibold text-blue-600">{courseData.course.totalModules}</p>
                      <p className="text-sm text-gray-600">Módulos</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-lg font-semibold text-green-600">{courseData.course.totalLessons}</p>
                      <p className="text-sm text-gray-600">Lecciones</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <Clock className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-lg font-semibold text-purple-600">{courseData.course.durationHours || 0}h</p>
                      <p className="text-sm text-gray-600">Duración</p>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <Users className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                      <p className="text-lg font-semibold text-orange-600">{courseData.course.competency}</p>
                      <p className="text-sm text-gray-600">Competencia</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Progreso General
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progreso del Curso</span>
                        <span>{Math.round(courseData.enrollment.progressPercentage || 0)}%</span>
                      </div>
                      <Progress value={courseData.enrollment.progressPercentage || 0} className="h-3" />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {courseData.enrollment.completedModulesCount || 0}
                        </p>
                        <p className="text-sm text-gray-600">Módulos Completados</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {Math.round(courseData.enrollment.totalTimeMinutes / 60) || 0}
                        </p>
                        <p className="text-sm text-gray-600">Horas Estudiadas</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">
                          {courseData.enrollment.enrolledAt ? 
                            Math.ceil((Date.now() - new Date(courseData.enrollment.enrolledAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
                          }
                        </p>
                        <p className="text-sm text-gray-600">Días Inscrito</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Enrollment Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Estado de Inscripción
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Inscrito desde:</span>
                      <span className="text-sm font-medium">
                        {new Date(courseData.enrollment.enrolledAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Estado:</span>
                      <Badge className={getStatusColor(courseData.enrollment.status)}>
                        {courseData.enrollment.status}
                      </Badge>
                    </div>
                    {courseData.enrollment.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completado:</span>
                        <span className="text-sm font-medium">
                          {new Date(courseData.enrollment.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" onClick={() => router.push('/estudiante/examenes')}>
                    <Target className="h-4 w-4 mr-2" />
                    Ver Exámenes
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => router.push('/estudiante/progreso')}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Ver Progreso
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Course Content */}
          <Card>
            <CardHeader>
              <CardTitle>Contenido del Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="modules" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="modules">Módulos</TabsTrigger>
                  <TabsTrigger value="lessons">Todas las Lecciones</TabsTrigger>
                </TabsList>

                <TabsContent value="modules" className="space-y-4">
                  {courseData.modules.map((module: any, moduleIndex: number) => (
                    <Card key={module.id} className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                                Módulo {moduleIndex + 1}
                              </span>
                              {module.title}
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusIcon(module.status)}
                              <Badge className={getStatusColor(module.status)}>
                                {module.status === 'completed' ? 'Completado' : 
                                 module.status === 'in_progress' ? 'En Progreso' : 'No Iniciado'}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600">
                              {module.completedLessonsCount}/{module.totalLessons} lecciones
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progreso del Módulo</span>
                              <span>{Math.round(module.progressPercentage || 0)}%</span>
                            </div>
                            <Progress value={module.progressPercentage || 0} className="h-2" />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {module.lessons.map((lesson: any, lessonIndex: number) => (
                              <div 
                                key={lesson.id}
                                className={`p-3 rounded-lg border ${
                                  lesson.status === 'completed' 
                                    ? 'border-green-200 bg-green-50' 
                                    : lesson.status === 'in_progress'
                                      ? 'border-blue-200 bg-blue-50'
                                      : 'border-gray-200 bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(lesson.status)}
                                    <span className="font-medium text-sm">
                                      Lección {lessonIndex + 1}: {lesson.title}
                                    </span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {lesson.estimatedTimeMinutes || 0} min
                                  </Badge>
                                </div>
                                
                                <div className="flex justify-between text-xs text-gray-600 mb-2">
                                  <span>Progreso: {Math.round(lesson.progressPercentage || 0)}%</span>
                                  <span>Tiempo: {Math.round(lesson.totalTimeMinutes / 60) || 0}h</span>
                                </div>
                                
                                <Progress value={lesson.progressPercentage || 0} className="h-1 mb-2" />
                                
                                <Button
                                  size="sm"
                                  variant={lesson.status === 'completed' ? 'outline' : 'default'}
                                  className="w-full"
                                  onClick={() => router.push(`/leccion/${lesson.id}`)}
                                >
                                  {lesson.status === 'completed' ? 'Revisar' : 
                                   lesson.status === 'in_progress' ? 'Continuar' : 'Comenzar'}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="lessons" className="space-y-3">
                  {courseData.allLessons.map((lesson: any, index: number) => (
                    <div 
                      key={lesson.id}
                      className={`p-4 rounded-lg border ${
                        lesson.status === 'completed' 
                          ? 'border-green-200 bg-green-50' 
                          : lesson.status === 'in_progress'
                            ? 'border-blue-200 bg-blue-50'
                            : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(lesson.status)}
                          <div>
                            <h4 className="font-medium">{lesson.title}</h4>
                            <p className="text-sm text-gray-600">{lesson.moduleTitle} • {lesson.estimatedTimeMinutes || 0} min</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-sm font-medium">{Math.round(lesson.progressPercentage || 0)}%</div>
                            <Progress value={lesson.progressPercentage || 0} className="w-20 h-2" />
                          </div>
                          <Button
                            size="sm"
                            variant={lesson.status === 'completed' ? 'outline' : 'default'}
                            onClick={() => router.push(`/leccion/${lesson.id}`)}
                          >
                            {lesson.status === 'completed' ? 'Revisar' : 
                             lesson.status === 'in_progress' ? 'Continuar' : 'Comenzar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
