"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { StudentHeader } from "@/components/StudentHeader"
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  Flag,
  BookOpen
} from "lucide-react"
import { QuestionRenderer } from "@/components/QuestionRenderer"

interface Question {
  id: string
  text: string
  type: string
  difficultyLevel: string
  imageUrl?: string
  questionImage?: string
  questionType?: string
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  optionAImage?: string
  optionBImage?: string
  optionCImage?: string
  optionDImage?: string
  options: Array<{
    id: string
    text: string
    isCorrect: boolean
  }>
  competency: string
}

interface ExamData {
  id: string
  title: string
  description: string
  timeLimitMinutes: number
  totalQuestions: number
}

interface ExamInterfaceProps {
  exam: ExamData
  questions: Question[]
  attemptId: string
  startedAt: string
  existingAnswers?: Record<string, any>
}

export function ExamInterface({ exam, questions, attemptId, startedAt, existingAnswers }: ExamInterfaceProps) {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [timeRemaining, setTimeRemaining] = useState(exam.timeLimitMinutes * 60)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)

  // Inicializar respuestas existentes
  useEffect(() => {
    if (existingAnswers) {
      const formattedAnswers: Record<string, any> = {}
      Object.keys(existingAnswers).forEach(questionId => {
        const answer = existingAnswers[questionId]
        // Mantener el formato completo de la respuesta para que isAnswered funcione correctamente
        if (answer.answer !== undefined) {
          // Para matching o respuestas parseadas, usar answer directamente
          formattedAnswers[questionId] = answer.answer
        } else if (answer.optionId) {
          // Para opción múltiple, guardar como string
          formattedAnswers[questionId] = answer.optionId
        } else if (answer.text) {
          // Para fill_blank o essay, guardar como string
          formattedAnswers[questionId] = answer.text
        }
      })
      setAnswers(formattedAnswers)
    }
  }, [existingAnswers])

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const answeredQuestions = Object.keys(answers).length

  // Timer effect
  useEffect(() => {
    const startTime = new Date(startedAt).getTime()
    const timeLimitMs = exam.timeLimitMinutes * 60 * 1000
    
    const updateTimer = () => {
      const now = Date.now()
      const elapsed = now - startTime
      const remaining = Math.max(0, timeLimitMs - elapsed)
      setTimeRemaining(Math.floor(remaining / 1000))
      
      // No auto-submit when time runs out, just show warning
      if (remaining <= 0) {
        setTimeRemaining(0)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [startedAt, exam.timeLimitMinutes])

  // Auto-save answers
  const saveAnswer = useCallback(async (questionId: string, answer: any) => {
    try {
      // Adaptar la respuesta al formato esperado por el API
      const payload: any = { questionId }
      
      if (typeof answer === 'string') {
        // Para opción múltiple o verdadero/falso
        payload.selectedOptionId = answer
      } else if (typeof answer === 'object') {
        if (answer.optionId) {
          payload.selectedOptionId = answer.optionId
        }
        if (answer.text) {
          payload.answerText = answer.text
        }
        // Para matching, convertir el objeto a JSON string
        if (Object.keys(answer).length > 0 && !answer.optionId && !answer.text) {
          payload.answerText = JSON.stringify(answer)
        }
      }
      
      await fetch(`/api/student/exams/${attemptId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      console.error('Error saving answer:', error)
    }
  }, [attemptId])

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
    saveAnswer(questionId, answer)
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmitExam = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/student/exams/${attemptId}/submit`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Exam submitted successfully:', result)
        router.push(`/estudiante/examen/resultado/${result.resultId}`)
      } else {
        const errorData = await response.json()
        console.error('Submit error:', errorData)
        throw new Error(errorData.error || 'Error al enviar el examen')
      }
    } catch (error) {
      console.error('Error submitting exam:', error)
      alert('Error al enviar el examen. Inténtalo de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'facil': return 'bg-green-100 text-green-800'
      case 'intermedio': return 'bg-yellow-100 text-yellow-800'
      case 'dificil': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isAnswered = (questionId: string) => {
    const answer = answers[questionId]
    if (!answer) return false
    
    // Si es un string (opción múltiple, verdadero/falso, fill_blank, essay)
    if (typeof answer === 'string') {
      return answer.trim().length > 0
    }
    
    // Si es un objeto (matching o respuesta estructurada)
    if (typeof answer === 'object') {
      // Para matching, verificar que tenga al menos una clave
      if (Object.keys(answer).length > 0) {
        return true
      }
      // Para respuestas estructuradas
      if (answer.optionId || (answer.text && answer.text.trim().length > 0) || answer.answer) {
        return true
      }
    }
    
    return false
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentHeader 
        title={exam.title}
        subtitle={exam.description}
        showBackButton={false}
        rightContent={
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className={`font-mono text-lg ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-800'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <Badge variant="outline">
              {answeredQuestions}/{questions.length} respondidas
            </Badge>
          </div>
        }
      />
      
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-2">
          {/* Progress Bar */}
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>Pregunta {currentQuestionIndex + 1} de {questions.length}</span>
              <span>{Math.round(progress)}% completado</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">
                        Pregunta {currentQuestionIndex + 1}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getDifficultyColor(currentQuestion.difficultyLevel)}>
                          {currentQuestion.difficultyLevel}
                        </Badge>
                        <Badge variant="outline">
                          {currentQuestion.competency}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {isAnswered(currentQuestion.id) && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Renderizar pregunta usando QuestionRenderer */}
                <QuestionRenderer
                  question={{
                    id: currentQuestion.id,
                    questionText: currentQuestion.text,
                    questionType: (currentQuestion.questionType || currentQuestion.type) as 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'essay',
                    questionImage: currentQuestion.questionImage || currentQuestion.imageUrl,
                    optionA: currentQuestion.optionA || currentQuestion.options[0]?.text,
                    optionB: currentQuestion.optionB || currentQuestion.options[1]?.text,
                    optionC: currentQuestion.optionC || currentQuestion.options[2]?.text,
                    optionD: currentQuestion.optionD || currentQuestion.options[3]?.text,
                    optionAImage: currentQuestion.optionAImage,
                    optionBImage: currentQuestion.optionBImage,
                    optionCImage: currentQuestion.optionCImage,
                    optionDImage: currentQuestion.optionDImage,
                  }}
                  selectedAnswer={answers[currentQuestion.id]}
                  onAnswerChange={(answer) => {
                    // Adaptar la respuesta al formato esperado por el API
                    if (typeof answer === 'string') {
                      handleAnswerChange(currentQuestion.id, { optionId: answer, text: answer })
                    } else if (typeof answer === 'object') {
                      handleAnswerChange(currentQuestion.id, answer)
                    } else {
                      handleAnswerChange(currentQuestion.id, { text: answer })
                    }
                  }}
                  showCorrectAnswer={false}
                  isSubmitted={false}
                  disabled={false}
                />
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Anterior</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => router.push('/estudiante')}
                  className="flex items-center space-x-2 text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Salir del Examen</span>
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    className="flex items-center space-x-2"
                  >
                    <span>Siguiente</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowConfirmSubmit(true)}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Finalizar Examen</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navegación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                        index === currentQuestionIndex
                          ? 'bg-blue-600 text-white border-blue-600'
                          : isAnswered(questions[index].id)
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-600 rounded"></div>
                    <span>Actual</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                    <span>Respondida</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                    <span>Sin responder</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Time Warning */}
            {timeRemaining <= 0 ? (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  ⏰ ¡El tiempo se ha agotado! Puedes continuar respondiendo, pero el examen se marcará como tardío.
                </AlertDescription>
              </Alert>
            ) : timeRemaining < 300 && timeRemaining > 0 ? (
              <Alert className="mt-4 border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  ⚠️ ¡Quedan menos de 5 minutos! Asegúrate de enviar tu examen a tiempo.
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>¿Finalizar examen?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Has respondido {answeredQuestions} de {questions.length} preguntas.
                ¿Estás seguro de que quieres finalizar el examen?
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitExam}
                  disabled={isSubmitting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? 'Enviando...' : 'Finalizar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
