"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Play, 
  CheckCircle, 
  Clock, 
  BookOpen,
  Video,
  FileText,
  Target,
  Calendar
} from "lucide-react"

interface LessonProgressProps {
  lessonId: string
}

interface LessonData {
  id: string
  title: string
  description: string
  estimatedTimeMinutes: number
  timeSpentMinutes: number
  status: 'not_started' | 'in_progress' | 'completed'
  progressPercentage: number
  completedAt?: string
  lastAccessedAt?: string
  course?: {
    id: string
    title: string
    academicGrade: string
  }
  competency?: {
    id: string
    name: string
    displayName: string
  }
  module?: {
    id: string
    title: string
    orderIndex: number
  }
  contentProgress: {
    video: {
      completed: boolean
      timeSpent: number
      lastAccessed?: string
    }
    theory: {
      completed: boolean
      timeSpent: number
      lastAccessed?: string
    }
    exercises: {
      completed: boolean
      timeSpent: number
      lastAccessed?: string
    }
  }
}

export function LessonProgress({ lessonId }: LessonProgressProps) {
  const [lessonData, setLessonData] = useState<LessonData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLessonData()
  }, [lessonId])

  const loadLessonData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/student/progress/lessons?lessonId=${lessonId}`)
      
      if (response.ok) {
        const lessons = await response.json()
        const lesson = lessons.find((l: any) => l.id === lessonId)
        
        if (lesson) {
          setLessonData(lesson)
        }
      }
    } catch (error) {
      console.error('Error loading lesson data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProgress = async (contentType: string, status: string, timeSpent?: number) => {
    try {
      const response = await fetch('/api/student/progress/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          contentType,
          status,
          timeSpentMinutes: timeSpent,
          progressPercentage: status === 'completed' ? 100 : 50
        })
      })

      if (response.ok) {
        loadLessonData() // Reload data
      }
    } catch (error) {
      console.error('Error updating progress:', error)
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
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5" />
      case 'theory':
        return <FileText className="h-5 w-5" />
      case 'exercises':
        return <Target className="h-5 w-5" />
      default:
        return <BookOpen className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando lección...</p>
        </div>
      </div>
    )
  }

  if (!lessonData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Lección no encontrada</h3>
            <p className="text-gray-600">
              No se pudo cargar la información de la lección.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Lesson Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{lessonData.title}</CardTitle>
              <p className="text-gray-600 mt-1">{lessonData.description}</p>
              <div className="flex items-center space-x-2 mt-2">
                {lessonData.course && (
                  <Badge variant="outline">{lessonData.course.title}</Badge>
                )}
                {lessonData.competency && (
                  <Badge variant="outline">{lessonData.competency.displayName}</Badge>
                )}
                {lessonData.module && (
                  <Badge variant="outline">Módulo {lessonData.module.orderIndex}</Badge>
                )}
              </div>
            </div>
            <Badge className={getStatusColor(lessonData.status)}>
              {lessonData.status === 'completed' ? 'Completada' :
               lessonData.status === 'in_progress' ? 'En Progreso' : 'No Iniciada'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Overall Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progreso General</span>
              <span className="text-sm text-gray-600">
                {lessonData.progressPercentage}% completado
              </span>
            </div>
            <Progress value={lessonData.progressPercentage} className="h-3" />
          </div>

          {/* Lesson Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-600">
                {formatTime(lessonData.timeSpentMinutes)}
              </p>
              <p className="text-xs text-gray-600">Tiempo Invertido</p>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Target className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-green-600">
                {formatTime(lessonData.estimatedTimeMinutes)}
              </p>
              <p className="text-xs text-gray-600">Tiempo Estimado</p>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-purple-600">
                {lessonData.lastAccessedAt 
                  ? new Date(lessonData.lastAccessedAt).toLocaleDateString()
                  : 'Nunca'
                }
              </p>
              <p className="text-xs text-gray-600">Último Acceso</p>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-orange-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-orange-600">
                {lessonData.completedAt 
                  ? new Date(lessonData.completedAt).toLocaleDateString()
                  : 'Pendiente'
                }
              </p>
              <p className="text-xs text-gray-600">Completada</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso por Contenido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Video Progress */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Video className="h-6 w-6 text-red-600" />
                <div>
                  <h4 className="font-semibold">Video</h4>
                  <p className="text-sm text-gray-600">
                    Tiempo: {formatTime(lessonData.contentProgress.video.timeSpent)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(
                  lessonData.contentProgress.video.completed ? 'completed' : 'not_started'
                )}>
                  {lessonData.contentProgress.video.completed ? 'Completado' : 'Pendiente'}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateProgress('video', 'in_progress')}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Ver
                </Button>
              </div>
            </div>

            {/* Theory Progress */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <div>
                  <h4 className="font-semibold">Teoría</h4>
                  <p className="text-sm text-gray-600">
                    Tiempo: {formatTime(lessonData.contentProgress.theory.timeSpent)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(
                  lessonData.contentProgress.theory.completed ? 'completed' : 'not_started'
                )}>
                  {lessonData.contentProgress.theory.completed ? 'Completado' : 'Pendiente'}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateProgress('theory', 'in_progress')}
                >
                  <BookOpen className="h-4 w-4 mr-1" />
                  Leer
                </Button>
              </div>
            </div>

            {/* Exercises Progress */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Target className="h-6 w-6 text-green-600" />
                <div>
                  <h4 className="font-semibold">Ejercicios</h4>
                  <p className="text-sm text-gray-600">
                    Tiempo: {formatTime(lessonData.contentProgress.exercises.timeSpent)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(
                  lessonData.contentProgress.exercises.completed ? 'completed' : 'not_started'
                )}>
                  {lessonData.contentProgress.exercises.completed ? 'Completado' : 'Pendiente'}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateProgress('exercises', 'in_progress')}
                >
                  <Target className="h-4 w-4 mr-1" />
                  Practicar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
