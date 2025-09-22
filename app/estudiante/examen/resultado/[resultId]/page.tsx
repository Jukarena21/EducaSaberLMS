"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  BookOpen, 
  TrendingUp,
  ArrowLeft,
  Download,
  Share2,
  Eye,
  ChevronDown,
  ChevronUp
} from "lucide-react"

interface ExamResultPageProps {
  params: Promise<{ resultId: string }>
}

export default function ExamResultPage({ params }: ExamResultPageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [resultData, setResultData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetailedAnswers, setShowDetailedAnswers] = useState(false)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (status === "loading") return
    
    if (!session || session.user?.role !== "student") {
      router.push("/")
      return
    }

    loadResult()
  }, [session, status, router])

  const loadResult = async () => {
    try {
      const resolvedParams = await params
      const response = await fetch(`/api/student/exams/result/${resolvedParams.resultId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar el resultado')
      }
      
      const data = await response.json()
      setResultData(data)
    } catch (err) {
      setError('Error al cargar el resultado del examen')
      console.error('Error loading result:', err)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const toggleQuestionExpansion = (questionIndex: number) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(questionIndex)) {
      newExpanded.delete(questionIndex)
    } else {
      newExpanded.add(questionIndex)
    }
    setExpandedQuestions(newExpanded)
  }

  const getOptionLabel = (option: string) => {
    const labels = { A: 'A', B: 'B', C: 'C', D: 'D' }
    return labels[option as keyof typeof labels] || option
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando resultado...</p>
        </div>
      </div>
    )
  }

  if (error || !resultData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">{error || 'Resultado no encontrado'}</p>
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
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Resultado del Examen</h1>
            <p className="text-gray-600">{resultData.exam.title}</p>
          </div>

          {/* Main Result Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Resumen del Resultado</CardTitle>
                <Badge className={getScoreBadgeColor(resultData.score)}>
                  {resultData.passed ? 'Aprobado' : 'No Aprobado'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Score Display */}
              <div className="text-center">
                <div className={`text-6xl font-bold ${getScoreColor(resultData.score)} mb-2`}>
                  {resultData.score}%
                </div>
                <Progress value={resultData.score} className="h-3 mb-4" />
                <p className="text-sm text-gray-600">
                  {resultData.correctAnswers} de {resultData.totalQuestions} preguntas correctas
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{resultData.correctAnswers}</p>
                  <p className="text-sm text-gray-600">Correctas</p>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">
                    {resultData.totalQuestions - resultData.correctAnswers}
                  </p>
                  <p className="text-sm text-gray-600">Incorrectas</p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{resultData.timeSpentMinutes}</p>
                  <p className="text-sm text-gray-600">Minutos</p>
                </div>
              </div>

              {/* Performance Message */}
              <div className={`p-4 rounded-lg ${
                resultData.passed 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {resultData.passed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <p className={`font-semibold ${
                    resultData.passed ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {resultData.passed 
                      ? '¡Felicitaciones! Has aprobado el examen.'
                      : 'No has alcanzado el puntaje mínimo requerido.'
                    }
                  </p>
                </div>
                <p className={`text-sm mt-2 ${
                  resultData.passed ? 'text-green-700' : 'text-red-700'
                }`}>
                  {resultData.passed 
                    ? `Tu puntaje de ${resultData.score}% supera el mínimo requerido de ${resultData.exam.passingScore}%.`
                    : `Necesitas al menos ${resultData.exam.passingScore}% para aprobar. Tu puntaje fue ${resultData.score}%.`
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Exam Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Examen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Competencia</p>
                  <p className="font-semibold">{resultData.exam.competency || 'General'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Examen</p>
                  <p className="font-semibold">{resultData.exam.examType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completado</p>
                  <p className="font-semibold">
                    {new Date(resultData.completedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tiempo Límite</p>
                  <p className="font-semibold">{resultData.exam.timeLimitMinutes} minutos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Competency Breakdown */}
          {resultData.competencyBreakdown && (
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento por Competencia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resultData.competencyBreakdown.map((comp: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{comp.competency}</p>
                        <p className="text-sm text-gray-600">
                          {comp.correct} de {comp.total} preguntas
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{comp.percentage}%</p>
                        <Progress value={comp.percentage} className="w-24 h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/estudiante')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver al Dashboard</span>
            </Button>
            
            <Button
              onClick={() => router.push('/estudiante/examenes')}
              className="flex items-center space-x-2"
            >
              <BookOpen className="h-4 w-4" />
              <span>Ver Más Exámenes</span>
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Descargar Resultado</span>
            </Button>
          </div>

          {/* Recommendations */}
          {!resultData.passed && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">Recomendaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-yellow-700">
                  <p>• Revisa las lecciones relacionadas con este tema</p>
                  <p>• Practica con más ejercicios de la misma competencia</p>
                  <p>• Considera tomar un examen de diagnóstico para identificar áreas de mejora</p>
                  <p>• Puedes volver a intentar este examen cuando te sientas preparado</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Answers Section */}
          {resultData.detailedAnswers && resultData.detailedAnswers.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Revisión Detallada de Respuestas
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetailedAnswers(!showDetailedAnswers)}
                  >
                    {showDetailedAnswers ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Ocultar Detalles
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              
              {showDetailedAnswers && (
                <CardContent>
                  <div className="space-y-4">
                    {resultData.detailedAnswers.map((answer: any, index: number) => (
                      <Card 
                        key={answer.id} 
                        className={`border-l-4 ${
                          answer.isCorrect 
                            ? 'border-l-green-500 bg-green-50/30' 
                            : 'border-l-red-500 bg-red-50/30'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-lg">Pregunta {index + 1}</span>
                              <Badge className={getDifficultyColor(answer.difficultyLevel)}>
                                {answer.difficultyLevel}
                              </Badge>
                              <Badge variant="outline">
                                {answer.competency}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {answer.isCorrect ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                              <span className={`font-semibold ${
                                answer.isCorrect ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {answer.isCorrect ? 'Correcta' : 'Incorrecta'}
                              </span>
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="font-medium mb-2">{answer.questionText}</p>
                            {answer.questionImage && (
                              <img 
                                src={answer.questionImage} 
                                alt="Imagen de la pregunta" 
                                className="max-w-full h-auto rounded-lg mb-3"
                              />
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {['A', 'B', 'C', 'D'].map(option => (
                              <div 
                                key={option}
                                className={`p-3 rounded-lg border-2 ${
                                  answer.selectedOption === option
                                    ? answer.isCorrect
                                      ? 'border-green-500 bg-green-100'
                                      : 'border-red-500 bg-red-100'
                                    : answer.correctOption === option
                                      ? 'border-green-300 bg-green-50'
                                      : 'border-gray-200 bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">{option}.</span>
                                  {answer.selectedOption === option && (
                                    <Badge variant="secondary" className="text-xs">
                                      Tu respuesta
                                    </Badge>
                                  )}
                                  {answer.correctOption === option && (
                                    <Badge className="bg-green-100 text-green-800 text-xs">
                                      Correcta
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm">{answer.options[option]}</p>
                                {answer.options[`${option}Image`] && (
                                  <img 
                                    src={answer.options[`${option}Image`]} 
                                    alt={`Opción ${option}`}
                                    className="max-w-full h-auto rounded mt-2"
                                  />
                                )}
                              </div>
                            ))}
                          </div>

                          {answer.explanation && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h4 className="font-semibold text-blue-800 mb-2">Explicación:</h4>
                              <p className="text-blue-700">{answer.explanation}</p>
                              {answer.explanationImage && (
                                <img 
                                  src={answer.explanationImage} 
                                  alt="Imagen de explicación" 
                                  className="max-w-full h-auto rounded-lg mt-3"
                                />
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-4 pt-3 border-t">
                            <div className="text-sm text-gray-600">
                              <p>Tiempo empleado: {answer.timeSpentSeconds || 0} segundos</p>
                              <p>Lección relacionada: {answer.lessonTitle}</p>
                            </div>
                            {answer.lessonUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(answer.lessonUrl, '_blank')}
                              >
                                <BookOpen className="h-4 w-4 mr-2" />
                                Ver Lección
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
