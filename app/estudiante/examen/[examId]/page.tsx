"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ExamInterface } from "@/components/ExamInterface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { StudentHeader } from "@/components/StudentHeader"
import { AlertCircle, Clock, BookOpen, Loader2 } from "lucide-react"
import { BrandLoading } from "@/components/BrandLoading"

interface ExamPageProps {
  params: Promise<{ examId: string }>
}

export default function ExamPage({ params }: ExamPageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [examData, setExamData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    
    if (!session || session.user?.role !== "student") {
      router.push("/")
      return
    }

    loadExam()
  }, [session, status, router])

  const loadExam = async () => {
    try {
      const resolvedParams = await params
      const response = await fetch(`/api/student/exams/available`)
      
      if (!response.ok) {
        throw new Error('Error al cargar los exámenes')
      }
      
      const exams = await response.json()
      const exam = exams.find((e: any) => e.id === resolvedParams.examId)
      
      if (!exam) {
        setError('Examen no encontrado')
        return
      }

      setExamData(exam)
    } catch (err) {
      setError('Error al cargar el examen')
      console.error('Error loading exam:', err)
    } finally {
      setLoading(false)
    }
  }

  const startExam = async () => {
    if (!examData || starting) return
    
    setStarting(true)
    try {
      const response = await fetch('/api/student/exams/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId: examData.id })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al iniciar el examen')
      }

      const data = await response.json()
      
      // Redirigir a la interfaz del examen
      router.push(`/estudiante/examen/tomar/${data.attemptId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar el examen')
      console.error('Error starting exam:', err)
    } finally {
      setStarting(false)
    }
  }

  if (status === "loading" || loading) {
    return <BrandLoading message="Cargando examen..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/estudiante')} className="w-full">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!examData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Examen no encontrado</p>
            <Button onClick={() => router.push('/estudiante')} className="w-full mt-4">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Verificar si el examen ya fue completado
  if (examData.status === 'passed' && !examData.canRetake) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-center text-green-600">¡Examen Completado!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-semibold">Puntaje: {examData.lastAttempt?.score}%</p>
              <p className="text-sm text-gray-600">
                Completado el {new Date(examData.lastAttempt?.completedAt).toLocaleDateString()}
              </p>
            </div>
            <Button onClick={() => router.push('/estudiante')} className="w-full">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentHeader 
        title={examData.title}
        subtitle={examData.description}
        showBackButton={true}
        backUrl="/estudiante"
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{examData.title}</CardTitle>
              <p className="text-gray-600">{examData.description}</p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Exam Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Tiempo límite</p>
                    <p className="font-semibold">{examData.timeLimitMinutes} minutos</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Preguntas</p>
                    <p className="font-semibold">{examData.totalQuestions}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Puntaje mínimo</p>
                    <p className="font-semibold">{examData.passingScore}%</p>
                  </div>
                </div>
              </div>

              {/* Competency and Course */}
              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-sm text-gray-600">Competencia</p>
                  <p className="font-semibold">{examData.competency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Curso</p>
                  <p className="font-semibold">{examData.course}</p>
                </div>
              </div>

              {/* Last Attempt Info */}
              {examData.lastAttempt && examData.lastAttempt.completedAt && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Último intento: {examData.lastAttempt.score}% 
                    ({examData.lastAttempt.passed ? 'Aprobado' : 'No aprobado'}) - 
                    {new Date(examData.lastAttempt.completedAt).toLocaleDateString()}
                  </AlertDescription>
                </Alert>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Instrucciones:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Tienes {examData.timeLimitMinutes} minutos para completar el examen</li>
                  <li>• Lee cada pregunta cuidadosamente antes de responder</li>
                  <li>• Puedes navegar entre preguntas usando los botones o la barra lateral</li>
                  <li>• Tus respuestas se guardan automáticamente</li>
                  <li>• Una vez que envíes el examen, no podrás modificarlo</li>
                </ul>
              </div>

              {/* Start Button */}
              <div className="text-center">
                <Button
                  onClick={startExam}
                  disabled={starting}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {starting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Iniciando...
                    </>
                  ) : examData.status === 'in_progress' ? (
                    'Continuar Examen'
                  ) : (
                    'Comenzar Examen'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
