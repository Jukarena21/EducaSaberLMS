"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Play,
  Eye,
  Calendar,
  Target,
  Trophy,
  Star,
  Zap,
  Brain,
  Award,
  TrendingUp,
  BarChart3,
  Users,
  Timer
} from "lucide-react"

interface Exam {
  id: string
  title: string
  description: string
  examType: string
  competency: string
  course: string
  timeLimitMinutes: number
  totalQuestions: number
  passingScore: number
  openDate?: string
  closeDate?: string
  lastAttempt?: {
    resultId: string
    score: number
    passed: boolean
    completedAt: string | null
    startedAt?: string | null
  }
  canRetake: boolean
  status: 'not_attempted' | 'in_progress' | 'passed' | 'failed'
}

export function StudentExamsTab() {
  const router = useRouter()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadExams()
  }, [])

  const loadExams = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/student/exams/available')
      
      if (!response.ok) {
        throw new Error('Error al cargar los exámenes')
      }
      
      const data = await response.json()
      setExams(data)
    } catch (err) {
      setError('Error al cargar los exámenes')
      console.error('Error loading exams:', err)
    } finally {
      setLoading(false)
    }
  }

  const getExamTypeLabel = (type: string) => {
    const types = {
      'simulacro_completo': 'Simulacro Completo',
      'por_competencia': 'Por Competencia',
      'por_modulo': 'Quiz de Módulo',
      'personalizado': 'Personalizado',
      'diagnostico': 'Diagnóstico'
    }
    return types[type as keyof typeof types] || type
  }

  const getStatusBadge = (exam: Exam) => {
    if (exam.status === 'passed') {
      return <Badge className="bg-green-100 text-green-800">Aprobado</Badge>
    }
    if (exam.status === 'failed') {
      return <Badge className="bg-red-100 text-red-800">No Aprobado</Badge>
    }
    if (exam.status === 'in_progress') {
      return <Badge className="bg-blue-100 text-blue-800">En Progreso</Badge>
    }
    return <Badge variant="outline">Disponible</Badge>
  }

  const canTakeExam = (exam: Exam) => {
    const now = new Date()
    if (exam.openDate && new Date(exam.openDate) > now) return false
    if (exam.closeDate && new Date(exam.closeDate) < now) return false
    return exam.status === 'not_attempted' || exam.status === 'in_progress' || exam.canRetake
  }

  const handleStartExam = (examId: string) => {
    router.push(`/estudiante/examen/${examId}`)
  }

  const handleViewResult = (exam: Exam) => {
    if (exam.lastAttempt?.resultId) {
      router.push(`/estudiante/examen/resultado/${exam.lastAttempt.resultId}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando exámenes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (exams.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No hay exámenes disponibles</h3>
            <p className="text-gray-600 mb-4">
              Aún no tienes exámenes asignados. Contacta a tu profesor para más información.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Separar exámenes pendientes y presentados
  // Pendientes: no han sido presentados O pueden reintentar y están disponibles
  const pendingExams = exams.filter(e => {
    if (!e.lastAttempt) return true // No presentado = pendiente
    if (e.canRetake && canTakeExam(e)) return true // Puede reintentar y está disponible
    return false
  })
  
  // Presentados: tienen un intento y no pueden reintentar o no están disponibles
  const completedExams = exams.filter(e => {
    if (!e.lastAttempt) return false // No presentado = no en completados
    if (e.canRetake && canTakeExam(e)) return false // Puede reintentar = pendiente
    return true // Tiene intento y no puede reintentar = presentado
  })

  // Ordenar exámenes pendientes por fecha de apertura (disponibles primero, luego por fecha)
  pendingExams.sort((a, b) => {
    const now = new Date().getTime()
    const dateA = a.openDate ? new Date(a.openDate).getTime() : 0
    const dateB = b.openDate ? new Date(b.openDate).getTime() : 0
    
    // Los que ya están disponibles (openDate <= now) van primero
    const aAvailable = !a.openDate || dateA <= now
    const bAvailable = !b.openDate || dateB <= now
    
    if (aAvailable && !bAvailable) return -1
    if (!aAvailable && bAvailable) return 1
    
    // Si ambos están disponibles o ambos no, ordenar por fecha de apertura
    if (!a.openDate && !b.openDate) return 0
    if (!a.openDate) return 1
    if (!b.openDate) return -1
    
    return dateA - dateB // Más antiguos primero (disponibles desde antes)
  })

  // Ordenar exámenes completados por fecha de completado (más recientes primero)
  completedExams.sort((a, b) => {
    const dateA = a.lastAttempt?.completedAt ? new Date(a.lastAttempt.completedAt).getTime() : 0
    const dateB = b.lastAttempt?.completedAt ? new Date(b.lastAttempt.completedAt).getTime() : 0
    return dateB - dateA // Más recientes primero
  })

  // Calcular estadísticas generales
  const totalExams = exams.length
  const passedExams = exams.filter(e => e.status === 'passed').length
  // Solo considerar exámenes completados (con completedAt) para el promedio
  const completedExamsWithScore = exams.filter(e => e.lastAttempt?.completedAt && e.lastAttempt?.score !== undefined)
  const averageScore = completedExamsWithScore.length > 0
    ? Math.round(completedExamsWithScore.reduce((acc, e) => acc + (e.lastAttempt?.score || 0), 0) / completedExamsWithScore.length)
    : 0
  const availableExams = pendingExams.length

  return (
    <div className="space-y-6">
      {/* Estadísticas generales con tooltips */}
      <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 cursor-help">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-blue-700">{totalExams}</div>
                      <div className="text-sm text-blue-600 font-medium">Exámenes Totales</div>
                    </div>
                    <div className="p-3 bg-blue-200 rounded-full">
                      <Target className="h-6 w-6 text-blue-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
              Cantidad de exámenes que has intentado al menos una vez.{" "}
              Incluye exámenes aprobados, reprobados y en progreso.
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 cursor-help">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-green-700">{passedExams}</div>
                      <div className="text-sm text-green-600 font-medium">Aprobados</div>
                    </div>
                    <div className="p-3 bg-green-200 rounded-full">
                      <Trophy className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
              Número de exámenes en los que alcanzaste o superaste la nota mínima de aprobación definida.
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 cursor-help">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-purple-700">{Math.round(averageScore)}</div>
                      <div className="text-sm text-purple-600 font-medium">Promedio de Puntajes</div>
                      <div className="text-xs text-purple-500">En exámenes (0-100%)</div>
                    </div>
                    <div className="p-3 bg-purple-200 rounded-full">
                      <TrendingUp className="h-6 w-6 text-purple-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
              Promedio de todos tus exámenes completados.{" "}
              Cada examen se convierte a porcentaje según el número de respuestas correctas sobre el total de preguntas.
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300 cursor-help">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-orange-700">{availableExams}</div>
                      <div className="text-sm text-orange-600 font-medium">Disponibles</div>
                    </div>
                    <div className="p-3 bg-orange-200 rounded-full">
                      <Zap className="h-6 w-6 text-orange-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
              Exámenes que puedes presentar ahora mismo.{" "}
              No incluye los que ya finalizaste, pero sí los que están en curso o reactivados para reintento.
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Exámenes Pendientes */}
      {pendingExams.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Exámenes Pendientes</h2>
            <Badge variant="outline" className="ml-2">{pendingExams.length}</Badge>
          </div>
          {pendingExams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Brain className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-gray-800">{exam.title}</CardTitle>
                        {exam.description && (
                          <p className="text-gray-600 text-sm">{exam.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        {getExamTypeLabel(exam.examType)}
                      </Badge>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                        {exam.competency}
                      </Badge>
                      {getStatusBadge(exam)}
                      {exam.openDate && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          Disponible desde {new Date(exam.openDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Información del examen con iconos atractivos */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Timer className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-600">Tiempo</p>
                      <p className="font-bold text-blue-700">{exam.timeLimitMinutes} min</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <BookOpen className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-600">Preguntas</p>
                      <p className="font-bold text-green-700">{exam.totalQuestions}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <Target className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-600">Mínimo</p>
                      <p className="font-bold text-purple-700">{exam.passingScore}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-xs text-gray-600">Disponible</p>
                      <p className="font-bold text-orange-700 text-xs">
                        {exam.openDate ? new Date(exam.openDate).toLocaleDateString() : 'Siempre'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botón de acción */}
                <div className="flex justify-end">
                  {canTakeExam(exam) ? (
                    <Button
                      onClick={() => handleStartExam(exam.id)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      {exam.status === 'not_attempted' ? 'Comenzar Examen' : exam.status === 'in_progress' ? 'Continuar Examen' : exam.canRetake ? 'Reintentar' : 'Ver Resultado'}
                    </Button>
                  ) : (
                    <div className="text-right">
                      {exam.openDate && new Date(exam.openDate) > new Date() && (
                        <div className="flex items-center space-x-2 text-yellow-600">
                          <Clock className="h-4 w-4" />
                          <p className="text-sm">
                            Disponible desde {new Date(exam.openDate).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {exam.closeDate && new Date(exam.closeDate) < new Date() && (
                        <div className="flex items-center space-x-2 text-red-600">
                          <XCircle className="h-4 w-4" />
                          <p className="text-sm">Examen cerrado</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Exámenes Presentados */}
      {completedExams.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-800">Exámenes Presentados</h2>
            <Badge variant="outline" className="ml-2">{completedExams.length}</Badge>
          </div>
          {completedExams.map((exam) => (
          <Card key={exam.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Brain className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-800">{exam.title}</CardTitle>
                      {exam.description && (
                        <p className="text-gray-600 text-sm">{exam.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      {getExamTypeLabel(exam.examType)}
                    </Badge>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      {exam.competency}
                    </Badge>
                    {getStatusBadge(exam)}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Información del examen con iconos atractivos */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Timer className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Tiempo</p>
                    <p className="font-bold text-blue-700">{exam.timeLimitMinutes} min</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">Preguntas</p>
                    <p className="font-bold text-green-700">{exam.totalQuestions}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <Target className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-600">Mínimo</p>
                    <p className="font-bold text-purple-700">{exam.passingScore}%</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-xs text-gray-600">Presentado</p>
                    <p className="font-bold text-orange-700 text-xs">
                      {exam.lastAttempt?.completedAt ? new Date(exam.lastAttempt.completedAt).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>
              </div>

                {/* Resultado del examen */}
                {exam.lastAttempt && (
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${exam.lastAttempt.passed ? 'bg-green-100' : 'bg-red-100'}`}>
                          {exam.lastAttempt.passed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Resultado</p>
                          <p className="font-bold text-lg">
                            {exam.lastAttempt.score}% - {exam.lastAttempt.passed ? '¡Aprobado!' : 'No aprobado'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(exam.lastAttempt.completedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewResult(exam)}
                        className="hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                )}

                {/* Botón de acción si puede reintentar */}
                {exam.canRetake && canTakeExam(exam) && (
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleStartExam(exam.id)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Reintentar Examen
                    </Button>
                  </div>
                )}
            </CardContent>
          </Card>
          ))}
        </div>
      )}

      {/* Mensaje si no hay exámenes */}
      {pendingExams.length === 0 && completedExams.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No hay exámenes disponibles</h3>
              <p className="text-gray-600 mb-4">
                Aún no tienes exámenes asignados. Contacta a tu profesor para más información.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensaje motivacional */}
      {exams.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6 text-center">
            <Award className="h-12 w-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Sigue así</h3>
            <p className="text-gray-600">
              Cada examen es una oportunidad de demostrar lo que has aprendido. 
              Confía en ti mismo y da lo mejor.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
