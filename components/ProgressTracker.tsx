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
  TrendingUp,
  Award,
  Target,
  Calendar
} from "lucide-react"

interface CourseProgress {
  id: string
  title: string
  competency: string
  totalLessons: number
  completedLessons: number
  progressPercentage: number
  timeSpentMinutes: number
  estimatedTimeMinutes: number
  modules: Array<{
    id: string
    title: string
    totalLessons: number
    completedLessons: number
    progressPercentage: number
    timeSpentMinutes: number
  }>
}

interface CompetencyProgress {
  id: string
  name: string
  displayName: string
  totalLessons: number
  completedLessons: number
  progressPercentage: number
  totalTimeMinutes: number
  totalExams: number
  passedExams: number
  averageScore: number
  stats: {
    lessonsCompleted: number
    lessonsInProgress: number
    timeSpent: number
    examsTaken: number
    examsPassed: number
    averageScore: number
  }
}

export function ProgressTracker() {
  const [coursesProgress, setCoursesProgress] = useState<CourseProgress[]>([])
  const [competenciesProgress, setCompetenciesProgress] = useState<CompetencyProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'courses' | 'competencies'>('courses')

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    try {
      setLoading(true)
      const [coursesRes, competenciesRes] = await Promise.all([
        fetch('/api/student/progress/courses'),
        fetch('/api/student/progress/competencies')
      ])

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        setCoursesProgress(coursesData)
      }

      if (competenciesRes.ok) {
        const competenciesData = await competenciesRes.json()
        setCompetenciesProgress(competenciesData)
      }
    } catch (error) {
      console.error('Error loading progress:', error)
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

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-yellow-500'
    if (percentage >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando progreso...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === 'courses' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('courses')}
          className="flex-1"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Por Cursos
        </Button>
        <Button
          variant={activeTab === 'competencies' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('competencies')}
          className="flex-1"
        >
          <Award className="h-4 w-4 mr-2" />
          Por Competencias
        </Button>
      </div>

      {/* Courses Progress */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          {coursesProgress.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No estás inscrito en ningún curso</h3>
                  <p className="text-gray-600">
                    Contacta a tu profesor para inscribirte en cursos disponibles.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            coursesProgress.map((course) => (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{course.title}</CardTitle>
                      <p className="text-gray-600 mt-1">{course.competency}</p>
                    </div>
                    <Badge variant="outline">{course.progressPercentage}%</Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Overall Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progreso General</span>
                      <span className="text-sm text-gray-600">
                        {course.completedLessons} de {course.totalLessons} lecciones
                      </span>
                    </div>
                    <Progress 
                      value={course.progressPercentage} 
                      className="h-2"
                    />
                  </div>

                  {/* Stats */}
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
                      <p className="text-lg font-bold text-purple-600">{course.modules.length}</p>
                      <p className="text-xs text-gray-600">Módulos</p>
                    </div>
                    
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <Target className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-orange-600">
                        {Math.round((course.timeSpentMinutes / course.estimatedTimeMinutes) * 100)}%
                      </p>
                      <p className="text-xs text-gray-600">Tiempo Est.</p>
                    </div>
                  </div>

                  {/* Modules Progress */}
                  <div>
                    <h4 className="font-semibold mb-3">Progreso por Módulo</h4>
                    <div className="space-y-2">
                      {course.modules.map((module) => (
                        <div key={module.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{module.title}</p>
                            <p className="text-xs text-gray-600">
                              {module.completedLessons} de {module.totalLessons} lecciones
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Progress 
                              value={module.progressPercentage} 
                              className="w-20 h-2"
                            />
                            <span className="text-xs font-medium w-8">
                              {module.progressPercentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Competencies Progress */}
      {activeTab === 'competencies' && (
        <div className="space-y-4">
          {competenciesProgress.map((competency) => (
            <Card key={competency.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center space-x-2">
                      <span className="text-2xl">{competency.icon}</span>
                      <span>{competency.displayName}</span>
                    </CardTitle>
                    <p className="text-gray-600 mt-1">{competency.description}</p>
                  </div>
                  <Badge 
                    className={`${getProgressColor(competency.progressPercentage)} text-white`}
                  >
                    {competency.progressPercentage}%
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Overall Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progreso General</span>
                    <span className="text-sm text-gray-600">
                      {competency.completedLessons} de {competency.totalLessons} lecciones
                    </span>
                  </div>
                  <Progress 
                    value={competency.progressPercentage} 
                    className="h-2"
                  />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-blue-600">
                      {competency.stats.lessonsCompleted}
                    </p>
                    <p className="text-xs text-gray-600">Lecciones</p>
                  </div>
                  
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <Clock className="h-6 w-6 text-green-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-green-600">
                      {formatTime(competency.stats.timeSpent)}
                    </p>
                    <p className="text-xs text-gray-600">Tiempo</p>
                  </div>
                  
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <Award className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-purple-600">
                      {competency.stats.averageScore}%
                    </p>
                    <p className="text-xs text-gray-600">Promedio</p>
                  </div>
                </div>

                {/* Exam Stats */}
                {competency.stats.examsTaken > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-semibold mb-2">Rendimiento en Exámenes</h5>
                    <div className="flex items-center justify-between text-sm">
                      <span>Exámenes tomados: {competency.stats.examsTaken}</span>
                      <span>Exámenes aprobados: {competency.stats.examsPassed}</span>
                      <span>Promedio: {competency.stats.averageScore}%</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
