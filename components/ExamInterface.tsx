"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  Flag,
  BookOpen
} from "lucide-react"

interface Question {
  id: string
  text: string
  type: string
  difficultyLevel: string
  imageUrl?: string
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
}

export function ExamInterface({ exam, questions, attemptId, startedAt }: ExamInterfaceProps) {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, { optionId?: string; text?: string }>>({})
  const [timeRemaining, setTimeRemaining] = useState(exam.timeLimitMinutes * 60)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)

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
      
      if (remaining <= 0) {
        handleSubmitExam()
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [startedAt, exam.timeLimitMinutes])

  // Auto-save answers
  const saveAnswer = useCallback(async (questionId: string, answer: { optionId?: string; text?: string }) => {
    try {
      await fetch(`/api/student/exams/${attemptId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          selectedOptionId: answer.optionId,
          answerText: answer.text
        })
      })
    } catch (error) {
      console.error('Error saving answer:', error)
    }
  }, [attemptId])

  const handleAnswerChange = (questionId: string, answer: { optionId?: string; text?: string }) => {
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
        router.push(`/estudiante/examen/resultado/${result.resultId}`)
      } else {
        throw new Error('Error al enviar el examen')
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
    return answer && (answer.optionId || (answer.text && answer.text.trim().length > 0))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{exam.title}</h1>
              <p className="text-sm text-gray-600">{exam.description}</p>
            </div>
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
          </div>
          
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
                {/* Question Text */}
                <div>
                  <p className="text-lg leading-relaxed">{currentQuestion.text}</p>
                  {currentQuestion.imageUrl && (
                    <div className="mt-4">
                      <img 
                        src={currentQuestion.imageUrl} 
                        alt="Imagen de la pregunta"
                        className="max-w-full h-auto rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                {/* Answer Options */}
                <div className="space-y-3">
                  {currentQuestion.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {currentQuestion.options.map((option, index) => (
                        <label
                          key={option.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            answers[currentQuestion.id]?.optionId === option.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={option.id}
                            checked={answers[currentQuestion.id]?.optionId === option.id}
                            onChange={() => handleAnswerChange(currentQuestion.id, { optionId: option.id })}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="flex-1">
                            <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === 'true_false' && (
                    <div className="space-y-2">
                      {currentQuestion.options.map((option) => (
                        <label
                          key={option.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            answers[currentQuestion.id]?.optionId === option.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={option.id}
                            checked={answers[currentQuestion.id]?.optionId === option.id}
                            onChange={() => handleAnswerChange(currentQuestion.id, { optionId: option.id })}
                            className="h-4 w-4 text-blue-600"
                          />
                          <span className="flex-1">{option.text}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {currentQuestion.type === 'essay' && (
                    <div>
                      <textarea
                        value={answers[currentQuestion.id]?.text || ''}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, { text: e.target.value })}
                        placeholder="Escribe tu respuesta aquí..."
                        className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Anterior</span>
              </Button>

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
            {timeRemaining < 300 && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  ¡Quedan menos de 5 minutos! Asegúrate de enviar tu examen a tiempo.
                </AlertDescription>
              </Alert>
            )}
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
