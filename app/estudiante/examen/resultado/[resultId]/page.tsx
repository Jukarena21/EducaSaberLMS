"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StudentHeader } from "@/components/StudentHeader"
import {
  CheckCircle,
  XCircle,
  Download,
  Target,
  Clock,
  ArrowRight,
} from "lucide-react"

interface ExamResult {
  id: string
  score: number
  correctAnswers: number
  incorrectAnswers: number
  totalQuestions: number
  isPassed: boolean
  timeTakenMinutes: number
  exam: {
    id: string
    title: string
    description: string
    competency: {
      id: string
      name: string
      displayName: string
    }
  }
  questions?: Array<{
    id: string
    text: string
    questionImage?: string
    optionA: string
    optionB: string
    optionC: string
    optionD: string
    optionAImage?: string
    optionBImage?: string
    optionCImage?: string
    optionDImage?: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
    explanation: string
    explanationImage?: string
    lesson?: {
      id: string
      title: string
      courseId: string
      courseTitle: string
    } | null
  }>
}

export default function ExamResultPage({ params }: { params: Promise<{ resultId: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [result, setResult] = useState<ExamResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("resumen")

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
      console.log('Loading result for:', resolvedParams.resultId)
      const response = await fetch(`/api/student/exams/result/${resolvedParams.resultId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API error:', errorData)
        throw new Error(errorData.error || 'Error al cargar el resultado')
      }
      
      const data = await response.json()
      console.log('Result data:', data)
      setResult(data)
    } catch (err) {
      setError('Error al cargar el resultado del examen')
      console.error('Error loading result:', err)
    } finally {
      setLoading(false)
    }
  }

  const getNivelRendimiento = (puntaje: number) => {
    if (puntaje >= 90) return { nivel: "Excelente", color: "text-green-600", bg: "bg-green-100" }
    if (puntaje >= 80) return { nivel: "Bueno", color: "text-blue-600", bg: "bg-blue-100" }
    if (puntaje >= 70) return { nivel: "Aceptable", color: "text-yellow-600", bg: "bg-yellow-100" }
    return { nivel: "Necesita Mejora", color: "text-red-600", bg: "bg-red-100" }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando resultado...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'No se pudo cargar el resultado'}</p>
            <Button onClick={() => router.push('/estudiante')} className="w-full">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Preparar datos para la vista
  // Como todos los exámenes actuales son por competencia única, usamos la competencia del examen
  const examCompetency = result.exam.competency?.displayName || 'General'
  const preguntasFiltradas = result.questions || []
  
  // Función para obtener el texto de una opción
  const getOptionText = (pregunta: ExamResult['questions'][0], option: string) => {
    switch(option) {
      case 'A': return pregunta.optionA
      case 'B': return pregunta.optionB
      case 'C': return pregunta.optionC
      case 'D': return pregunta.optionD
      default: return option
    }
  }
  
  // Función para obtener la imagen de una opción
  const getOptionImage = (pregunta: ExamResult['questions'][0], option: string) => {
    switch(option) {
      case 'A': return pregunta.optionAImage
      case 'B': return pregunta.optionBImage
      case 'C': return pregunta.optionCImage
      case 'D': return pregunta.optionDImage
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentHeader 
        title={`Resultado: ${result.exam.title}`}
        subtitle={result.exam.competency?.displayName || 'General'}
        showBackButton={true}
        backUrl="/estudiante"
      />

      {/* Header de resultados */}
      <div className="bg-gradient-to-r from-[#73A2D3] to-[#C00102] text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Resultados del Examen</h1>
              <p className="text-lg opacity-90">{result.exam.title}</p>
              <div className="flex items-center space-x-6 mt-4 text-sm opacity-90">
                <span>Estudiante: {session?.user?.firstName} {session?.user?.lastName}</span>
                <span>Fecha: {new Date().toLocaleDateString()}</span>
                <span>Duración: {result.timeTakenMinutes} min</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{result.score}%</div>
              <div className="text-lg">Puntaje General</div>
              <Badge
                className={`mt-2 ${getNivelRendimiento(result.score).bg} ${getNivelRendimiento(result.score).color}`}
              >
                {getNivelRendimiento(result.score).nivel}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${false ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            {/* Solo mostrar "Por Materia" si hay más de una competencia (futuro: simulacros completos) */}
            {false && <TabsTrigger value="por-materia">Por Materia</TabsTrigger>}
            <TabsTrigger value="preguntas">Preguntas</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{result.correctAnswers}</div>
                  <div className="text-sm text-gray-600">Respuestas Correctas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">{result.incorrectAnswers}</div>
                  <div className="text-sm text-gray-600">Respuestas Incorrectas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{result.totalQuestions}</div>
                  <div className="text-sm text-gray-600">Total Preguntas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">{result.timeTakenMinutes} min</div>
                  <div className="text-sm text-gray-600">Tiempo Total</div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="bg-[#73A2D3] hover:bg-[#5a8bc4]"
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/student/exams/result/${result.id}/certificate`, {
                      method: 'POST'
                    })
                    
                    if (!response.ok) {
                      throw new Error('Error al generar el certificado')
                    }
                    
                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `certificado-examen-${result.exam.title.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                  } catch (error) {
                    console.error('Error descargando certificado:', error)
                    alert('Error al descargar el certificado. Por favor, intenta nuevamente.')
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar Certificado
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preguntas" className="space-y-6">
            {result.questions && result.questions.length > 0 && (
              <div className="space-y-4">
                {preguntasFiltradas.map((pregunta, index) => {
                  const userAnswerText = getOptionText(pregunta, pregunta.userAnswer)
                  const correctAnswerText = getOptionText(pregunta, pregunta.correctAnswer)
                  const userAnswerImage = getOptionImage(pregunta, pregunta.userAnswer)
                  const correctAnswerImage = getOptionImage(pregunta, pregunta.correctAnswer)
                  
                  return (
                    <Card
                      key={pregunta.id}
                      className={`border-l-4 ${pregunta.isCorrect ? "border-l-green-500" : "border-l-red-500"}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline">{examCompetency}</Badge>
                              {pregunta.isCorrect ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                            <CardTitle className="text-lg">Pregunta {index + 1}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {pregunta.questionImage && (
                          <div className="mb-4">
                            <Image
                              src={pregunta.questionImage}
                              alt="Imagen de la pregunta"
                              width={600}
                              height={300}
                              className="rounded-lg w-full h-auto"
                            />
                          </div>
                        )}
                        <p className="text-gray-700">{pregunta.text}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Tu respuesta:</span>
                            <div
                              className={`mt-1 p-3 rounded ${pregunta.isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                            >
                              <div className="font-semibold mb-1">Opción {pregunta.userAnswer}</div>
                              <div>{userAnswerText}</div>
                              {userAnswerImage && (
                                <div className="mt-2">
                                  <Image
                                    src={userAnswerImage}
                                    alt="Imagen de tu respuesta"
                                    width={200}
                                    height={150}
                                    className="rounded"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Respuesta correcta:</span>
                            <div className="mt-1 p-3 rounded bg-green-50 text-green-800">
                              <div className="font-semibold mb-1">Opción {pregunta.correctAnswer}</div>
                              <div>{correctAnswerText}</div>
                              {correctAnswerImage && (
                                <div className="mt-2">
                                  <Image
                                    src={correctAnswerImage}
                                    alt="Imagen de la respuesta correcta"
                                    width={200}
                                    height={150}
                                    className="rounded"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-800 mb-2">Explicación:</h4>
                          <p className="text-blue-700 text-sm">{pregunta.explanation}</p>
                          {pregunta.explanationImage && (
                            <div className="mt-2">
                              <Image
                                src={pregunta.explanationImage}
                                alt="Imagen de explicación"
                                width={400}
                                height={250}
                                className="rounded"
                              />
                            </div>
                          )}
                        </div>

                        {!pregunta.isCorrect && pregunta.lesson && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-yellow-800 mb-1">¿Necesitas repasar este tema?</h4>
                                <p className="text-yellow-700 text-sm">Accede al material de estudio relacionado</p>
                                {pregunta.lesson.courseTitle && (
                                  <p className="text-yellow-600 text-xs mt-1">{pregunta.lesson.courseTitle} - {pregunta.lesson.title}</p>
                                )}
                              </div>
                              <Button 
                                size="sm" 
                                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                onClick={() => {
                                  if (pregunta.lesson?.courseId && pregunta.lesson?.id) {
                                    router.push(`/estudiante/cursos/${pregunta.lesson.courseId}/leccion/${pregunta.lesson.id}`)
                                  }
                                }}
                              >
                                Estudiar Tema
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}