"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Play,
  ChevronRight,
  Target,
  Calendar,
  Award
} from "lucide-react"

interface EnrolledCourse {
  id: string
  title: string
  description: string
  competency: string
  competencyDisplayName: string
  academicGrade: string
  totalModules: number
  totalLessons: number
  completedLessons: number
  progressPercentage: number
  timeSpentMinutes: number
  estimatedTimeMinutes: number
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
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Mis Cursos</h2>
        <p className="text-gray-600">
          Continúa tu aprendizaje en los cursos en los que estás inscrito.
        </p>
      </div>

      {/* Courses List */}
      <div className="space-y-4">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div 
                className="flex items-start justify-between cursor-pointer"
                onClick={() => toggleCourse(course.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <ChevronRight 
                      className={`h-4 w-4 transition-transform ${
                        expandedCourse === course.id ? 'rotate-90' : ''
                      }`} 
                    />
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                    <p className="text-gray-600 mt-1">{course.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline">{course.competencyDisplayName}</Badge>
                      <Badge variant="outline">{course.academicGrade}</Badge>
                      <Badge className={getStatusColor(course.enrollment.status)}>
                        {getStatusLabel(course.enrollment.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {course.progressPercentage}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {course.completedLessons}/{course.totalLessons} lecciones
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {expandedCourse === course.id && (
              <CardContent className="space-y-4">
                {/* Overall Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progreso General</span>
                    <span className="text-sm text-gray-600">
                      {formatTime(course.timeSpentMinutes)} / {formatTime(course.estimatedTimeMinutes)}
                    </span>
                  </div>
                  <Progress value={course.progressPercentage} className="h-3" />
                </div>

                {/* Course Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-blue-600">{course.completedLessons}</p>
                    <p className="text-xs text-gray-600">Completadas</p>
                  </div>
                  
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <Clock className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-green-600">
                      {formatTime(course.timeSpentMinutes)}
                    </p>
                    <p className="text-xs text-gray-600">Tiempo</p>
                  </div>
                  
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <BookOpen className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-purple-600">{course.totalModules}</p>
                    <p className="text-xs text-gray-600">Módulos</p>
                  </div>
                  
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <Calendar className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-orange-600">
                      {new Date(course.enrollment.enrolledAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-600">Inscrito</p>
                  </div>
                </div>

                {/* Modules Progress */}
                <div>
                  <h4 className="font-semibold mb-3">Progreso por Módulo</h4>
                  <div className="space-y-2">
                    {course.modules.map((module) => (
                      <div key={module.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{module.title}</p>
                          <p className="text-sm text-gray-600">
                            {module.completedLessons} de {module.totalLessons} lecciones
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={module.progressPercentage} 
                            className="w-20 h-2"
                          />
                          <span className="text-sm font-medium w-8">
                            {module.progressPercentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button 
                    className="flex-1"
                    onClick={() => router.push(`/estudiante/cursos/${course.id}`)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Continuar Aprendiendo
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => router.push(`/estudiante/cursos/${course.id}`)}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-yellow-600" />
            <span>Resumen de Progreso</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{courses.length}</p>
              <p className="text-sm text-gray-600">Cursos Inscritos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {courses.reduce((acc, c) => acc + c.completedLessons, 0)}
              </p>
              <p className="text-sm text-gray-600">Lecciones Completadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {formatTime(courses.reduce((acc, c) => acc + c.timeSpentMinutes, 0))}
              </p>
              <p className="text-sm text-gray-600">Tiempo Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {Math.round(courses.reduce((acc, c) => acc + c.progressPercentage, 0) / courses.length)}%
              </p>
              <p className="text-sm text-gray-600">Promedio General</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
