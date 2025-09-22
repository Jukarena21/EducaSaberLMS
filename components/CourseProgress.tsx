"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Play,
  Lock,
  ChevronRight,
  Target
} from "lucide-react"

interface CourseProgressProps {
  courseId: string
}

interface Module {
  id: string
  title: string
  description: string
  orderIndex: number
  totalLessons: number
  completedLessons: number
  progressPercentage: number
  timeSpentMinutes: number
  estimatedTimeMinutes: number
  lessons: Array<{
    id: string
    title: string
    description: string
    estimatedTimeMinutes: number
    status: 'not_started' | 'in_progress' | 'completed'
    timeSpentMinutes: number
    progressPercentage: number
  }>
}

export function CourseProgress({ courseId }: CourseProgressProps) {
  const [courseData, setCourseData] = useState<any>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedModule, setExpandedModule] = useState<string | null>(null)

  useEffect(() => {
    loadCourseData()
  }, [courseId])

  const loadCourseData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/student/progress/courses`)
      
      if (response.ok) {
        const courses = await response.json()
        const course = courses.find((c: any) => c.id === courseId)
        
        if (course) {
          setCourseData(course)
          setModules(course.modules || [])
        }
      }
    } catch (error) {
      console.error('Error loading course data:', error)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-600" />
      default:
        return <Lock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando curso...</p>
        </div>
      </div>
    )
  }

  if (!courseData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Curso no encontrado</h3>
            <p className="text-gray-600">
              No se pudo cargar la información del curso.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{courseData.title}</CardTitle>
              <p className="text-gray-600 mt-1">{courseData.description}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline">{courseData.competency}</Badge>
                <Badge variant="outline">{courseData.academicGrade}</Badge>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              {courseData.progressPercentage}% Completado
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Overall Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progreso General</span>
              <span className="text-sm text-gray-600">
                {courseData.completedLessons} de {courseData.totalLessons} lecciones
              </span>
            </div>
            <Progress value={courseData.progressPercentage} className="h-3" />
          </div>

          {/* Course Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-600">{courseData.completedLessons}</p>
              <p className="text-xs text-gray-600">Completadas</p>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Clock className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-green-600">
                {formatTime(courseData.timeSpentMinutes)}
              </p>
              <p className="text-xs text-gray-600">Tiempo</p>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-purple-600">{courseData.totalModules}</p>
              <p className="text-xs text-gray-600">Módulos</p>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <Target className="h-6 w-6 text-orange-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-orange-600">
                {Math.round((courseData.timeSpentMinutes / courseData.estimatedTimeMinutes) * 100)}%
              </p>
              <p className="text-xs text-gray-600">Tiempo Est.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Módulos del Curso</h3>
        
        {modules.map((module) => (
          <Card key={module.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleModule(module.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">
                      {module.orderIndex}
                    </span>
                    <ChevronRight 
                      className={`h-4 w-4 transition-transform ${
                        expandedModule === module.id ? 'rotate-90' : ''
                      }`} 
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <p className="text-sm text-gray-600">{module.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {module.completedLessons}/{module.totalLessons}
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800">
                    {module.progressPercentage}%
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            {expandedModule === module.id && (
              <CardContent>
                {/* Module Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progreso del Módulo</span>
                    <span className="text-sm text-gray-600">
                      {formatTime(module.timeSpentMinutes)} / {formatTime(module.estimatedTimeMinutes)}
                    </span>
                  </div>
                  <Progress value={module.progressPercentage} className="h-2" />
                </div>

                {/* Lessons */}
                <div className="space-y-2">
                  <h5 className="font-semibold">Lecciones</h5>
                  {module.lessons.map((lesson) => (
                    <div 
                      key={lesson.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(lesson.status)}
                        <div>
                          <p className="font-medium">{lesson.title}</p>
                          <p className="text-sm text-gray-600">{lesson.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(lesson.status)}>
                          {lesson.status === 'completed' ? 'Completada' :
                           lesson.status === 'in_progress' ? 'En Progreso' : 'No Iniciada'}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {formatTime(lesson.timeSpentMinutes)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
