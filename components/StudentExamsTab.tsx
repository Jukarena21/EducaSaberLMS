"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Play,
  Eye,
  Calendar
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
    score: number
    passed: boolean
    completedAt: string
  }
  canRetake: boolean
  status: 'not_attempted' | 'passed' | 'failed'
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
      'por_modulo': 'Por Módulo',
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
    return <Badge variant="outline">Disponible</Badge>
  }

  const canTakeExam = (exam: Exam) => {
    const now = new Date()
    if (exam.openDate && new Date(exam.openDate) > now) return false
    if (exam.closeDate && new Date(exam.closeDate) < now) return false
    return exam.status === 'not_attempted' || exam.canRetake
  }

  const handleStartExam = (examId: string) => {
    router.push(`/estudiante/examen/${examId}`)
  }

  const handleViewResult = (exam: Exam) => {
    if (exam.lastAttempt) {
      // Buscar el resultId del último intento
      // Por ahora redirigimos al dashboard, pero podríamos implementar una vista de resultados
      router.push('/estudiante')
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

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {exams.map((exam) => (
          <Card key={exam.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{exam.title}</CardTitle>
                  <p className="text-gray-600 mb-3">{exam.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline">{getExamTypeLabel(exam.examType)}</Badge>
                    <Badge variant="outline">{exam.competency}</Badge>
                    {getStatusBadge(exam)}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Tiempo</p>
                    <p className="font-semibold">{exam.timeLimitMinutes} min</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Preguntas</p>
                    <p className="font-semibold">{exam.totalQuestions}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Mínimo</p>
                    <p className="font-semibold">{exam.passingScore}%</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Disponible</p>
                    <p className="font-semibold text-xs">
                      {exam.openDate ? new Date(exam.openDate).toLocaleDateString() : 'Siempre'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Last Attempt Info */}
              {exam.lastAttempt && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Último intento</p>
                      <p className="font-semibold">
                        {exam.lastAttempt.score}% - {exam.lastAttempt.passed ? 'Aprobado' : 'No Aprobado'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(exam.lastAttempt.completedAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewResult(exam)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Resultado
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end">
                {canTakeExam(exam) ? (
                  <Button
                    onClick={() => handleStartExam(exam.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {exam.status === 'not_attempted' ? 'Comenzar Examen' : 'Reintentar'}
                  </Button>
                ) : (
                  <div className="text-right">
                    {exam.status === 'passed' && !exam.canRetake && (
                      <p className="text-sm text-green-600 font-medium">
                        ✓ Examen completado exitosamente
                      </p>
                    )}
                    {exam.openDate && new Date(exam.openDate) > new Date() && (
                      <p className="text-sm text-yellow-600">
                        Disponible desde {new Date(exam.openDate).toLocaleString()}
                      </p>
                    )}
                    {exam.closeDate && new Date(exam.closeDate) < new Date() && (
                      <p className="text-sm text-red-600">
                        Examen cerrado
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
