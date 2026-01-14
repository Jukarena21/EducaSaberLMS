"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Play,
  ChevronRight,
  Target,
  Calendar,
  Award,
  TrendingUp,
  Users,
  Star,
  Zap,
  Brain,
  GraduationCap,
  BarChart3,
  Timer,
  BookMarked
} from "lucide-react"

interface EnrolledCourse {
  id: string
  title: string
  description: string
  competency: string
  competencyDisplayName: string
  academicGrade: string
  totalModules: number
  completedModules?: number
  totalLessons: number
  completedLessons: number
  progressPercentage: number
  timeSpentMinutes: number
  estimatedTimeMinutes: number
  nextLesson?: {
    id: string
    title: string
    moduleTitle: string
    orderIndex: number
  } | null
  daysSinceLastActivity?: number | null
  modules: Array<{
    id: string
    title: string
    description: string
    orderIndex: number
    totalLessons: number
    completedLessons: number
    progressPercentage: number
    timeSpentMinutes: number
    estimatedTimeMinutes: number
  }>
  enrollment: {
    id: string
    status: string
    enrolledAt: string
    lastActivityAt?: string
  }
}

export function MyCourses() {
  const router = useRouter()
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)

  useEffect(() => {
    loadEnrolledCourses()
  }, [])

  const loadEnrolledCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/student/courses/enrolled')
      if (!response.ok) {
        // Si el estudiante no tiene cursos o hay error temporal, mostrar estado vacío
        console.warn('Fallo al cargar cursos inscritos. HTTP', response.status)
        setCourses([])
        return
      }
      const data = await response.json()
      setCourses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading enrolled courses:', error)
      // En caso de error de red, mostrar estado vacío en lugar de alerta de error
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activo'
      case 'completed':
        return 'Completado'
      case 'paused':
        return 'Pausado'
      default:
        return 'Desconocido'
    }
  }

  const toggleCourse = (courseId: string) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cursos...</p>
        </div>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No estás inscrito en ningún curso</h3>
            <p className="text-gray-600 mb-4">
              Los cursos son asignados por tu profesor. Contacta a tu profesor para más información.
            </p>
            <p className="text-sm text-gray-500">
              Los cursos son asignados por tu profesor. Contacta a tu profesor para más información.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats - Estilo consistente con dashboard + tooltips */}
      <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 cursor-help">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-blue-700">{courses.length}</div>
                      <div className="text-sm text-blue-600 font-medium">Cursos Inscritos</div>
                    </div>
                    <div className="p-3 bg-blue-200 rounded-full">
                      <BookOpen className="h-6 w-6 text-blue-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
              Cantidad de cursos que tienes asignados en la plataforma.{" "}
              Se basa en tus inscripciones activas e inactivas registradas por el colegio.
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 cursor-help">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-green-700">
                        {courses.reduce((acc, c) => acc + c.completedLessons, 0)}
                      </div>
                      <div className="text-sm text-green-600 font-medium">Lecciones Completadas</div>
                    </div>
                    <div className="p-3 bg-green-200 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
              Suma de todas las lecciones que has marcado como completadas en tus cursos.{" "}
              Te ayuda a ver cuánto contenido has terminado en total.
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 cursor-help">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-purple-700">
                        {formatTime(courses.reduce((acc, c) => acc + c.timeSpentMinutes, 0))}
                      </div>
                      <div className="text-sm text-purple-600 font-medium">Tiempo Total</div>
                    </div>
                    <div className="p-3 bg-purple-200 rounded-full">
                      <Timer className="h-6 w-6 text-purple-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
              Tiempo total invertido estudiando en todos tus cursos.{" "}
              Se calcula a partir de los minutos registrados en cada lección.
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300 cursor-help">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-orange-700">
                        {courses.reduce((acc, c) => acc + (c.completedModules || 0), 0)}
                      </div>
                      <div className="text-sm text-orange-600 font-medium">Módulos Completados</div>
                      <div className="text-xs text-orange-500">
                        de {courses.reduce((acc, c) => acc + c.totalModules, 0)} total
                      </div>
                    </div>
                    <div className="p-3 bg-orange-200 rounded-full">
                      <Target className="h-6 w-6 text-orange-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
              Número de módulos que has completado dentro de todos tus cursos.{" "}
              Un módulo se considera completado cuando todas sus lecciones están marcadas como terminadas.
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Courses List mejorada */}
      <div className="space-y-6">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
            <CardHeader className="pb-4">
              <div 
                className="flex items-start justify-between cursor-pointer"
                onClick={() => toggleCourse(course.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <ChevronRight 
                      className={`h-5 w-5 transition-transform text-blue-600 ${
                        expandedCourse === course.id ? 'rotate-90' : ''
                      }`} 
                    />
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <GraduationCap className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl text-gray-800 mb-2">{course.title}</CardTitle>
                    <p className="text-gray-600 mb-3">{course.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        {course.competencyDisplayName}
                      </Badge>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                        {course.academicGrade}
                      </Badge>
                      <Badge className={getStatusColor(course.enrollment.status)}>
                        {getStatusLabel(course.enrollment.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {course.progressPercentage}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {course.completedLessons}/{course.totalLessons} lecciones
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatTime(course.timeSpentMinutes)} estudiado
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {expandedCourse === course.id && (
              <CardContent className="space-y-6 bg-gradient-to-r from-gray-50 to-blue-50">
                {/* Overall Progress mejorado */}
                <div className="p-4 bg-white rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-semibold text-gray-800">Progreso General</span>
                    <span className="text-sm text-gray-600 font-medium">
                      {formatTime(course.timeSpentMinutes)} / {formatTime(course.estimatedTimeMinutes)}
                    </span>
                  </div>
                  <Progress value={course.progressPercentage} className="h-4" />
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>0%</span>
                    <span className="font-semibold">{course.progressPercentage}%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Course Stats mejoradas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg border border-blue-100 hover:shadow-md transition-shadow">
                    <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-xl font-bold text-blue-700">{course.completedModules || 0}/{course.totalModules}</p>
                    <p className="text-sm text-blue-600 font-medium">Módulos Completados</p>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg border border-green-100 hover:shadow-md transition-shadow">
                    <Timer className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-xl font-bold text-green-700">
                      {formatTime(course.timeSpentMinutes)}
                    </p>
                    <p className="text-sm text-green-600 font-medium">Tiempo</p>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg border border-purple-100 hover:shadow-md transition-shadow">
                    <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-xl font-bold text-purple-700">
                      {course.nextLesson ? 'Sí' : 'No'}
                    </p>
                    <p className="text-sm text-purple-600 font-medium">Próxima Lección</p>
                    {course.nextLesson && (
                      <p className="text-xs text-purple-500 truncate">{course.nextLesson.title}</p>
                    )}
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg border border-orange-100 hover:shadow-md transition-shadow">
                    <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-xl font-bold text-orange-700">
                      {course.daysSinceLastActivity !== null && course.daysSinceLastActivity !== undefined 
                        ? course.daysSinceLastActivity 
                        : 'N/A'}
                    </p>
                    <p className="text-sm text-orange-600 font-medium">Días sin Actividad</p>
                    {course.daysSinceLastActivity !== null && course.daysSinceLastActivity > 7 && (
                      <p className="text-xs text-red-500">Requiere atención</p>
                    )}
                  </div>
                </div>

                {/* Modules Progress mejorado */}
                <div className="p-4 bg-white rounded-lg border border-blue-100">
                  <h4 className="font-semibold mb-4 text-gray-800 flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    <span>Progreso por Módulo</span>
                  </h4>
                  <div className="space-y-3">
                    {course.modules.map((module) => (
                      <div key={module.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{module.title}</p>
                          <p className="text-sm text-gray-600">
                            {module.completedLessons} de {module.totalLessons} lecciones completadas
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Progress 
                            value={module.progressPercentage} 
                            className="w-24 h-3"
                          />
                          <span className="text-sm font-bold text-blue-600 w-10">
                            {module.progressPercentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons mejorados */}
                <div className="flex space-x-4">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
                    onClick={() => {
                      // Si hay próxima lección, ir directamente a ella
                      if (course.nextLesson) {
                        router.push(`/estudiante/cursos/${course.id}/leccion/${course.nextLesson.id}`)
                      } else {
                        // Si no hay próxima lección, ir a la página del curso
                        router.push(`/estudiante/cursos/${course.id}`)
                      }
                    }}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Continuar Aprendiendo
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                    onClick={() => router.push(`/estudiante/cursos/${course.id}`)}
                  >
                    <Target className="h-5 w-5 mr-2" />
                    Ver Curso Completo
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
