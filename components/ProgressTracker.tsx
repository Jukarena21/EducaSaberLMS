"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Calendar,
  BarChart3,
  Download,
  FileText,
  Brain,
  Timer,
  GraduationCap,
  Star,
  Zap,
  Users,
  ChevronRight
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
  totalModules: number
  completedModules: number
  moduleCompletionRate: number
  averageTimePerLesson: number
  daysSinceLastActivity: number | null
  nextLesson: {
    id: string
    title: string
    moduleTitle: string
    orderIndex: number
  } | null
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
  groupAverageScore?: number
  comparisonStatus?: 'above' | 'below' | 'equal' | 'no_data'
  trend?: 'improving' | 'declining' | 'stable' | 'no_data'
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
  const [activeTab, setActiveTab] = useState<'competencies'>('competencies')
  const [exporting, setExporting] = useState(false)
  const [expandedCompetency, setExpandedCompetency] = useState<string | null>(null)

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

  const handleExportReport = async (type: 'complete' | 'competency' | 'course', competencyId?: string, courseId?: string) => {
    try {
      setExporting(true)
      
      console.log('📊 Exporting report:', { type, competencyId, courseId })
      
      let response: Response
      
      if (type === 'complete') {
        // Usar la API existente para el reporte completo
        response = await fetch('/api/student/progress/export-puppeteer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type,
            competencyId,
            coursesData: coursesProgress,
            competenciesData: competenciesProgress
          })
        })
      } else if (type === 'competency') {
        // Usar la nueva API para reporte de competencia específica
        response = await fetch('/api/student/progress/export-competency', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            competencyId
          })
        })
      } else if (type === 'course') {
        // Usar la nueva API para reporte de curso específico
        response = await fetch('/api/student/progress/export-course', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseId
          })
        })
      } else {
        throw new Error('Tipo de reporte no válido')
      }

      console.log('📡 Response status:', response.status)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        // Obtener el nombre para el archivo según el tipo
        let fileName = ''
        if (type === 'complete') {
          fileName = `informe-progreso-completo-${new Date().toISOString().split('T')[0]}.pdf`
        } else if (type === 'competency') {
          const competencyName = competencyId 
            ? competenciesProgress.find(c => c.id === competencyId)?.displayName || 'competencia'
            : 'competencia'
          fileName = `informe-${competencyName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
        } else if (type === 'course') {
          const courseName = courseId 
            ? coursesProgress.find(c => c.id === courseId)?.title || 'curso'
            : 'curso'
          fileName = `informe-${courseName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
        }
        
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const errorText = await response.text()
        console.error('❌ Export error:', errorText)
        alert('Error al generar el informe. Por favor, intenta nuevamente.')
      }
    } catch (error) {
      console.error('Error exporting report:', error)
    } finally {
      setExporting(false)
    }
  }

  // Calcular estadísticas generales (enfoque en rendimiento)
  const totalCourses = coursesProgress.length
  const totalCompetencies = competenciesProgress.length
  const totalLessonsCompleted = coursesProgress.reduce((acc, c) => acc + c.completedLessons, 0)
  const totalTimeSpent = coursesProgress.reduce((acc, c) => acc + c.timeSpentMinutes, 0)
  
  // Calcular promedio de puntajes de exámenes (0-100%)
  const allExamScores = competenciesProgress
    .filter(c => c.stats.examsTaken > 0)
    .map(c => c.stats.averageScore)
  const averageExamScore = allExamScores.length > 0
    ? Math.round(allExamScores.reduce((acc, score) => acc + score, 0) / allExamScores.length)
    : 0

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
      {/* Estadísticas generales con tooltips */}
      <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 cursor-help">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-blue-700">{totalCourses}</div>
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
              Cantidad de cursos en los que estás trabajando actualmente.{" "}
              Coincide con los cursos que aparecen en tu pestaña de Mis Cursos.
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 cursor-help">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-green-700">{totalLessonsCompleted}</div>
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
              Suma de todas las lecciones completadas en todos tus cursos.{" "}
              Te ayuda a ver tu avance global en contenido estudiado.
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 cursor-help">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-purple-700">{formatTime(totalTimeSpent)}</div>
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
              Tiempo total de estudio registrado en la plataforma.{" "}
              Incluye todas las lecciones donde has tenido actividad.
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300 cursor-help">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-orange-700">{averageExamScore}</div>
                      <div className="text-sm text-orange-600 font-medium">Promedio de Puntajes</div>
                      <div className="text-xs text-orange-500 mt-1">En exámenes (0-100%)</div>
                    </div>
                    <div className="p-3 bg-orange-200 rounded-full">
                      <TrendingUp className="h-6 w-6 text-orange-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
              Promedio de tus puntajes en exámenes considerando todas las competencias.{" "}
              Cada examen se expresa en porcentaje (0-100) y luego se promedia.
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Botones de exportación */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <FileText className="h-6 w-6" />
            <span>Exportar Informes de Progreso</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Informe Completo</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => handleExportReport('complete', undefined, 1)}
                  disabled={exporting}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Informe Completo
                </Button>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Informes por Competencia</h3>
              <p className="text-xs text-gray-500 mb-2">Enfocado en resultados y rendimiento en exámenes</p>
              <div className="flex flex-wrap gap-3">
                {competenciesProgress.map((competency) => (
                  <Button
                    key={competency.id}
                    onClick={() => handleExportReport('competency', competency.id)}
                    disabled={exporting}
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    {competency.displayName}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Informes por Curso</h3>
              <p className="text-xs text-gray-500 mb-2">Enfocado en lecciones, módulos y avance del aprendizaje</p>
              <div className="flex flex-wrap gap-3">
                {coursesProgress.map((course) => (
                  <Button
                    key={course.id}
                    onClick={() => handleExportReport('course', undefined, course.id)}
                    disabled={exporting}
                    variant="outline"
                    className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    {course.title}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            <strong>Reporte por Competencia:</strong> Análisis de rendimiento en exámenes, comparación con grupo y evolución temporal. 
            <br />
            <strong>Reporte por Curso:</strong> Progreso detallado de lecciones, módulos completados y tiempo invertido en el aprendizaje.
          </p>
        </CardContent>
      </Card>

      {/* Competencies Progress */}
      {activeTab === 'competencies' && (
        <div className="space-y-6">
          {competenciesProgress.length === 0 ? (
            <Card className="bg-gradient-to-r from-gray-50 to-green-50 border-gray-200">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No hay datos de competencias disponibles</h3>
                  <p className="text-gray-600">
                    Completa lecciones y exámenes para ver tu progreso por competencias.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            competenciesProgress.map((competency) => (
              <Card key={competency.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
                <CardHeader className="pb-4">
                  <div 
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedCompetency(expandedCompetency === competency.id ? null : competency.id)}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <ChevronRight 
                        className={`h-5 w-5 transition-transform text-green-600 flex-shrink-0 ${
                          expandedCompetency === competency.id ? 'rotate-90' : ''
                        }`} 
                      />
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Award className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl text-gray-800">{competency.displayName}</CardTitle>
                        <p className="text-gray-600 mt-1">
                          {competency.completedLessons} de {competency.totalLessons} lecciones completadas
                        </p>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {competency.progressPercentage}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {competency.stats.examsTaken > 0 
                          ? `${competency.stats.examsPassed}/${competency.stats.examsTaken} exámenes`
                          : `${competency.completedLessons}/${competency.totalLessons} lecciones`
                        }
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                {expandedCompetency === competency.id && (
                  <CardContent className="space-y-6 bg-gradient-to-r from-gray-50 to-green-50">
                {/* Overall Progress */}
                <div className="p-4 bg-white rounded-lg border border-green-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-semibold text-gray-800">Progreso General</span>
                    <span className="text-sm text-gray-600 font-medium">
                      {competency.completedLessons} de {competency.totalLessons} lecciones
                    </span>
                  </div>
                  <Progress 
                    value={competency.progressPercentage} 
                    className="h-4"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>0%</span>
                    <span className="font-semibold">{competency.progressPercentage}%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Stats Grid mejoradas */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg border border-blue-100 hover:shadow-md transition-shadow">
                    <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-xl font-bold text-blue-700">
                      {competency.stats.lessonsCompleted}
                    </p>
                    <p className="text-sm text-blue-600 font-medium">Lecciones</p>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg border border-green-100 hover:shadow-md transition-shadow">
                    <Timer className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-xl font-bold text-green-700">
                      {formatTime(competency.stats.timeSpent)}
                    </p>
                    <p className="text-sm text-green-600 font-medium">Tiempo</p>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg border border-purple-100 hover:shadow-md transition-shadow">
                    <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-xl font-bold text-purple-700">
                      {competency.stats.averageScore}
                    </p>
                    <p className="text-sm text-purple-600 font-medium">Promedio de Puntajes</p>
                    <p className="text-xs text-purple-500">En exámenes (0-100%)</p>
                  </div>
                </div>

                {/* Comparación con grupo y evolución */}
                {(competency.comparisonStatus !== 'no_data' || competency.trend !== 'no_data') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {competency.comparisonStatus !== 'no_data' && competency.groupAverageScore !== undefined && (
                      <div className="p-4 bg-white rounded-lg border border-green-100">
                        <h5 className="font-semibold mb-3 text-gray-800 flex items-center space-x-2">
                          <Users className="h-5 w-5 text-green-600" />
                          <span>Comparación con Grupo</span>
                        </h5>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Tu promedio</p>
                            <p className="text-2xl font-bold text-blue-600">{competency.stats.averageScore}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Promedio del grupo</p>
                            <p className="text-2xl font-bold text-gray-600">{competency.groupAverageScore}</p>
                          </div>
                          <div className="text-right">
                            {competency.comparisonStatus === 'above' && (
                              <Badge className="bg-green-100 text-green-800">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                Por encima
                              </Badge>
                            )}
                            {competency.comparisonStatus === 'below' && (
                              <Badge className="bg-red-100 text-red-800">
                                <TrendingDown className="h-4 w-4 mr-1" />
                                Por debajo
                              </Badge>
                            )}
                            {competency.comparisonStatus === 'equal' && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                Igual
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {competency.trend !== 'no_data' && (
                      <div className="p-4 bg-white rounded-lg border border-blue-100">
                        <h5 className="font-semibold mb-3 text-gray-800 flex items-center space-x-2">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                          <span>Evolución Temporal</span>
                        </h5>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Tendencia</p>
                            {competency.trend === 'improving' && (
                              <Badge className="bg-green-100 text-green-800 mt-2">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                Mejorando
                              </Badge>
                            )}
                            {competency.trend === 'declining' && (
                              <Badge className="bg-red-100 text-red-800 mt-2">
                                <TrendingDown className="h-4 w-4 mr-1" />
                                Declinando
                              </Badge>
                            )}
                            {competency.trend === 'stable' && (
                              <Badge className="bg-yellow-100 text-yellow-800 mt-2">
                                Estable
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Promedio actual</p>
                            <p className="text-2xl font-bold text-blue-600">{competency.stats.averageScore}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Exam Stats mejoradas */}
                {competency.stats.examsTaken > 0 && (
                  <div className="p-4 bg-white rounded-lg border border-green-100">
                    <h5 className="font-semibold mb-3 text-gray-800 flex items-center space-x-2">
                      <Zap className="h-5 w-5 text-green-600" />
                      <span>Rendimiento en Exámenes</span>
                    </h5>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-blue-600">{competency.stats.examsTaken}</p>
                        <p className="text-sm text-gray-600">Tomados</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-600">{competency.stats.examsPassed}</p>
                        <p className="text-sm text-gray-600">Aprobados</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-purple-600">{competency.stats.averageScore}</p>
                        <p className="text-sm text-gray-600">Promedio de Puntajes</p>
                        <p className="text-xs text-gray-500">En exámenes (0-100%)</p>
                      </div>
                    </div>
                  </div>
                )}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
