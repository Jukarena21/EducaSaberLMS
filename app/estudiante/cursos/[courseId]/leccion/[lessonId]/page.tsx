"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Play, 
  CheckCircle,
  Target,
  PlayCircle,
  FileText,
  Brain
} from "lucide-react"
import { QuestionRenderer } from "@/components/QuestionRenderer"
import { StudentHeader } from "@/components/StudentHeader"

interface Lesson {
  id: string
  title: string
  description: string
  estimatedTimeMinutes: number
  videoUrl?: string
  theoryContent?: string
  exercises?: any[]
  status: 'not_started' | 'in_progress' | 'completed'
  progressPercentage: number
  totalTimeMinutes: number
  completedAt?: string
  questions?: Question[]
}

interface Question {
  id: string
  questionText: string
  questionType: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'essay'
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  optionAImage?: string
  optionBImage?: string
  optionCImage?: string
  optionDImage?: string
  questionImage?: string
  correctOption?: string
  explanation?: string
  explanationImage?: string
  difficultyLevel: string
  orderIndex: number
}

interface CourseData {
  course: {
    id: string
    title: string
    description: string
    competency: string
    academicGrade: string
  }
  modules: any[]
}

export default function LessonPage({ 
  params 
}: { 
  params: Promise<{ courseId: string; lessonId: string }> 
}) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [courseData, setCourseData] = useState<CourseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("video")
  const [currentExercise, setCurrentExercise] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({})
  const [showResults, setShowResults] = useState(false)
  const [videoViewed, setVideoViewed] = useState(false)
  const [theoryViewed, setTheoryViewed] = useState(false)
  const [exercisesCompleted, setExercisesCompleted] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    
    if (!session || session.user?.role !== "student") {
      router.push("/")
      return
    }

    loadLessonData()
  }, [session, status, router])

  // Efecto para detectar cuando se ve el video
  useEffect(() => {
    if (activeTab === "video" && lesson && !videoViewed) {
      setVideoViewed(true)
      updateProgress(true, theoryViewed, exercisesCompleted, 0, 0)
    }
  }, [activeTab, lesson, videoViewed, theoryViewed, exercisesCompleted])

  // Efecto para detectar cuando se ve la teoría
  useEffect(() => {
    if (activeTab === "theory" && lesson && !theoryViewed) {
      setTheoryViewed(true)
      updateProgress(videoViewed, true, exercisesCompleted, 0, 0)
    }
  }, [activeTab, lesson, theoryViewed, videoViewed, exercisesCompleted])

  const loadLessonData = async () => {
    try {
      const resolvedParams = await params
      
      // Cargar datos del curso
      const courseResponse = await fetch(`/api/student/courses/${resolvedParams.courseId}`)
      if (!courseResponse.ok) {
        throw new Error('Error al cargar el curso')
      }
      const courseData = await courseResponse.json()
      setCourseData(courseData)

      // Buscar la lección en los módulos
      let foundLesson = null
      for (const module of courseData.modules) {
        const lesson = module.lessons.find((l: Lesson) => l.id === resolvedParams.lessonId)
        if (lesson) {
          foundLesson = lesson
          break
        }
      }

      if (!foundLesson) {
        throw new Error('Lección no encontrada')
      }

      // Cargar preguntas de la lección
      const questionsResponse = await fetch(`/api/student/lessons/${resolvedParams.lessonId}/questions`)
      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json()
        console.log('[Lesson Page] Preguntas cargadas:', questionsData.length)
        const typeCounts = questionsData.reduce((acc: Record<string, number>, q: Question) => {
          acc[q.questionType] = (acc[q.questionType] || 0) + 1
          return acc
        }, {})
        console.log('[Lesson Page] Tipos de preguntas recibidas:', typeCounts)
        foundLesson.questions = questionsData
      }

      // Cargar progreso existente de la lección
      const progressResponse = await fetch(`/api/student/lessons/${resolvedParams.lessonId}/progress`)
      if (progressResponse.ok) {
        const progressData = await progressResponse.json()
        setVideoViewed(progressData.videoCompleted || false)
        setTheoryViewed(progressData.theoryCompleted || false)
        const wasCompleted = progressData.exercisesCompleted || false
        setExercisesCompleted(wasCompleted)
        // Si ya estaba completado, mostrar resultados pero permitir reiniciar
        if (wasCompleted) {
          setShowResults(true)
        }
        foundLesson.progressPercentage = progressData.progressPercentage || 0
        foundLesson.status = progressData.status || 'not_started'
      }

      setLesson(foundLesson)
    } catch (err) {
      setError('Error al cargar la lección')
      console.error('Error loading lesson:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (exerciseId: number, answer: any) => {
    setUserAnswers(prev => ({
      ...prev,
      [exerciseId]: answer
    }))
  }

  const isQuestionAnswered = (questionIndex: number): boolean => {
    const answer = userAnswers[questionIndex]
    if (answer === undefined || answer === null) return false
    
    const question = lesson?.questions?.[questionIndex]
    if (!question) return false

    switch (question.questionType) {
      case 'multiple_choice':
      case 'true_false':
        return typeof answer === 'string' && answer.length > 0
      case 'fill_blank':
        return typeof answer === 'string' && answer.trim().length > 0
      case 'matching':
        return typeof answer === 'object' && Object.keys(answer).length > 0
      case 'essay':
        return typeof answer === 'string' && answer.trim().length > 0
      default:
        return false
    }
  }

  const checkAnswer = (question: Question, userAnswer: any): boolean => {
    if (!question.correctOption) return false

    switch (question.questionType) {
      case 'multiple_choice':
      case 'true_false':
        return userAnswer === question.correctOption
      case 'fill_blank':
        const correctAnswer = question.optionA || ''
        return userAnswer?.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
      case 'matching':
        // Para matching, comparar cada par
        if (typeof userAnswer !== 'object') return false
        const pairs = [
          { key: 'A', option: question.optionA },
          { key: 'B', option: question.optionB },
          { key: 'C', option: question.optionC },
          { key: 'D', option: question.optionD }
        ].filter(p => p.option)
        
        for (const pair of pairs) {
          if (!pair.option) continue
          const separator = pair.option.includes('|') ? '|' : pair.option.includes('→') ? '→' : pair.option.includes('->') ? '->' : null
          if (!separator) continue
          const [leftElement, correctRight] = pair.option.split(separator).map(s => s.trim())
          const userRight = userAnswer[leftElement]
          if (userRight?.toLowerCase().trim() !== correctRight.toLowerCase().trim()) {
            return false
          }
        }
        return true
      case 'essay':
        // Los ensayos no tienen respuesta correcta única, se evalúan manualmente
        return true // Siempre se considera "correcto" si hay respuesta
      default:
        return false
    }
  }

  const resetExercises = async () => {
    try {
      const resolvedParams = await params
      
      // Recargar preguntas de forma aleatoria
      const questionsResponse = await fetch(`/api/student/lessons/${resolvedParams.lessonId}/questions`)
      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json()
        if (lesson) {
          setLesson({ ...lesson, questions: questionsData })
        }
      }
      
      // Resetear estado
      setUserAnswers({})
      setCurrentExercise(0)
      setShowResults(false)
      setExercisesCompleted(false)
    } catch (error) {
      console.error('Error al reiniciar ejercicios:', error)
    }
  }

  const checkAnswers = () => {
    // Verificar que todas las preguntas estén respondidas antes de mostrar resultados
    if (!lesson?.questions) return
    
    const allAnswered = lesson.questions.every((_, index) => isQuestionAnswered(index))
    if (!allAnswered) {
      // Si no todas están respondidas, encontrar la primera sin responder
      const firstUnanswered = lesson.questions.findIndex((_, index) => !isQuestionAnswered(index))
      if (firstUnanswered !== -1) {
        setCurrentExercise(firstUnanswered)
      }
      return
    }
    
    // Solo mostrar resultados si todas están respondidas
    setShowResults(true)
    setExercisesCompleted(true)
    
    // Calcular respuestas correctas
    const correctAnswers = lesson.questions.filter((question, index) => {
      const userAnswer = userAnswers[index]
      return checkAnswer(question, userAnswer)
    }).length
    
    // Actualizar progreso con los valores actuales de videoViewed y theoryViewed
    updateProgress(videoViewed, theoryViewed, true, correctAnswers, lesson.questions.length)
  }

  const updateProgress = async (video: boolean, theory: boolean, exercises: boolean, correctAnswers: number, totalQuestions: number) => {
    try {
      const resolvedParams = await params
      const response = await fetch(`/api/student/lessons/${resolvedParams.lessonId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoViewed: video,
          theoryViewed: theory,
          exercisesCompleted: exercises,
          correctAnswers,
          totalQuestions
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        // Actualizar el estado local de la lección
        setLesson(prev => prev ? {
          ...prev,
          progressPercentage: data.progressPercentage,
          status: data.status
        } : null)
      } else {
        const errorText = await response.text()
        throw new Error(`Error ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <Play className="h-5 w-5 text-blue-500" />
      default:
        return <Target className="h-5 w-5 text-gray-400" />
    }
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado'
      case 'in_progress':
        return 'En Progreso'
      default:
        return 'No Iniciado'
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando lección...</p>
        </div>
      </div>
    )
  }

  if (error || !lesson || !courseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'No se pudo cargar la lección'}</p>
            <Button onClick={() => router.push(`/estudiante/cursos/${courseData?.course.id}/modulos`)} className="w-full">
              Volver al Curso
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentHeader 
        title={lesson.title}
        subtitle={`${courseData.course.title} • ${courseData.course.competency}`}
        showBackButton={true}
        backUrl={`/estudiante/cursos/${courseData.course.id}`}
        rightContent={
          <div className="flex items-center space-x-4">
            <Badge className={getStatusColor(lesson.status)}>
              {getStatusText(lesson.status)}
            </Badge>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                <Clock className="h-4 w-4 inline mr-1" />
                {lesson.estimatedTimeMinutes || 0} min
              </div>
              {lesson.progressPercentage > 0 && (
                <div className="text-xs text-gray-500">
                  {Math.round(lesson.progressPercentage)}% completado
                </div>
              )}
            </div>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="video" className="flex items-center space-x-2">
                  <PlayCircle className="h-4 w-4" />
                  <span>Video</span>
                </TabsTrigger>
                <TabsTrigger value="theory" className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Teoría</span>
                </TabsTrigger>
                <TabsTrigger value="exercises" className="flex items-center space-x-2">
                  <Brain className="h-4 w-4" />
                  <span>Ejercicios</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="video" className="space-y-6">
                <Card>
                  <CardContent className="p-0">
                    <div className="aspect-video">
                      {lesson.videoUrl ? (
                        <iframe
                          width="100%"
                          height="100%"
                          src={lesson.videoUrl}
                          title={lesson.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
                          <div className="text-center">
                            <PlayCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No hay video disponible para esta lección</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PlayCircle className="h-5 w-5" />
                      <span>Contenido del Video</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{lesson.description}</p>
                    <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{lesson.estimatedTimeMinutes || 0} minutos</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="h-4 w-4" />
                        <span>{courseData.course.competency}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="theory" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5" />
                      <span>Contenido Teórico</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lesson.theoryContent ? (
                      <div 
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: lesson.theoryContent }}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No hay contenido teórico disponible para esta lección</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="exercises" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="h-5 w-5" />
                      <span>Ejercicios de Práctica</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lesson.questions && lesson.questions.length > 0 ? (
                      <div className="space-y-6">
                        {/* Si ya completó los ejercicios, mostrar mensaje y botón arriba */}
                        {exercisesCompleted && showResults ? (
                          <div className="flex flex-col items-center justify-center py-6 space-y-4 border-b border-gray-200">
                            <div className="text-center space-y-2">
                              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                              <h3 className="text-lg font-semibold text-gray-800">¡Ejercicios Completados!</h3>
                              <p className="text-sm text-gray-600">
                                Has completado todos los ejercicios de esta lección.
                              </p>
                            </div>
                            <Button
                              onClick={resetExercises}
                              size="lg"
                              className="bg-[#C00102] hover:bg-[#A00102] text-white px-6 py-3"
                            >
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Practicar Otra Vez
                            </Button>
                          </div>
                        ) : null}
                        
                        {/* Mostrar preguntas y respuestas solo si no está en estado "ya completado" */}
                        {!(exercisesCompleted && showResults) ? (
                        <div className="space-y-6">
                          <div className="text-center">
                            <p className="text-gray-600 mb-2">
                              Pregunta {currentExercise + 1} de {lesson.questions.length}
                            </p>
                            <div className="flex justify-center space-x-2 mb-4">
                              {lesson.questions.map((_, index) => (
                                <div
                                  key={index}
                                  className={`w-3 h-3 rounded-full ${
                                    userAnswers[index] !== undefined
                                      ? 'bg-green-500'
                                      : index === currentExercise
                                      ? 'bg-blue-500'
                                      : 'bg-gray-300'
                                  }`}
                                  title={userAnswers[index] !== undefined ? 'Respondida' : index === currentExercise ? 'Actual' : 'Pendiente'}
                                />
                              ))}
                            </div>
                            <Progress 
                              value={((currentExercise + 1) / lesson.questions.length) * 100} 
                              className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                              {lesson.questions.filter((_, index) => isQuestionAnswered(index)).length} de {lesson.questions.length} respondidas
                            </p>
                          </div>

                          <div className="space-y-4">
                            {/* Renderizar pregunta usando QuestionRenderer */}
                            {lesson.questions[currentExercise] && (
                              <QuestionRenderer
                                question={lesson.questions[currentExercise]}
                                selectedAnswer={userAnswers[currentExercise]}
                                onAnswerChange={(answer) => handleAnswer(currentExercise, answer)}
                                showCorrectAnswer={showResults}
                                isSubmitted={showResults}
                                disabled={showResults}
                              />
                            )}
                          </div>

                          <div className="flex justify-between">
                            <Button
                              variant="outline"
                              onClick={() => setCurrentExercise(Math.max(0, currentExercise - 1))}
                              disabled={currentExercise === 0}
                            >
                              Anterior
                            </Button>
                            
                            {currentExercise < lesson.questions.length - 1 ? (
                              <Button
                                onClick={() => setCurrentExercise(currentExercise + 1)}
                                disabled={!isQuestionAnswered(currentExercise)}
                              >
                                Siguiente
                              </Button>
                            ) : (
                              <Button
                                onClick={checkAnswers}
                                disabled={!isQuestionAnswered(currentExercise)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Finalizar Ejercicios
                              </Button>
                            )}
                          </div>

                        </div>
                        ) : null}
                        
                        {/* Mostrar resultados siempre que showResults sea true */}
                        {showResults && (
                          <div className="mt-6 space-y-4">
                            <h4 className="font-semibold text-gray-800 mb-4">Resultados de los Ejercicios:</h4>
                            <div className="space-y-3">
                              {lesson.questions.map((question: Question, index: number) => {
                                const userAnswer = userAnswers[index]
                                const isCorrect = checkAnswer(question, userAnswer)
                                
                                return (
                                  <div 
                                    key={question.id} 
                                    className={`p-4 rounded-lg border-2 ${
                                      isCorrect 
                                        ? 'bg-green-50 border-green-300' 
                                        : 'bg-red-50 border-red-300'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="font-medium text-sm">Pregunta {index + 1}</h4>
                                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        isCorrect 
                                          ? 'bg-green-200 text-green-800' 
                                          : 'bg-red-200 text-red-800'
                                      }`}>
                                        {isCorrect ? '✓ Correcta' : '✗ Incorrecta'}
                                      </div>
                                    </div>
                                    <QuestionRenderer
                                      question={question}
                                      selectedAnswer={userAnswer}
                                      showCorrectAnswer={true}
                                      isSubmitted={true}
                                      disabled={true}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                            
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-800">
                                  Resumen: {lesson.questions?.filter((question, index) => checkAnswer(question, userAnswers[index])).length || 0} de {lesson.questions?.length || 0} correctas
                                </span>
                                <span className="text-sm font-bold text-blue-900">
                                  {lesson.questions && lesson.questions.length > 0 
                                    ? Math.round((lesson.questions.filter((question, index) => checkAnswer(question, userAnswers[index])).length / lesson.questions.length) * 100)
                                    : 0}%
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No hay ejercicios disponibles para esta lección</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progreso de la Lección</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(lesson.progressPercentage)}%
                  </div>
                  <div className="text-sm text-gray-600">Completado</div>
                  <Progress value={lesson.progressPercentage} className="mt-2" />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Video:</span>
                    <div className="flex items-center space-x-2">
                      {videoViewed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                      )}
                      <span className={videoViewed ? 'text-green-600' : 'text-gray-500'}>
                        {videoViewed ? 'Visto' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Teoría:</span>
                    <div className="flex items-center space-x-2">
                      {theoryViewed ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                      )}
                      <span className={theoryViewed ? 'text-green-600' : 'text-gray-500'}>
                        {theoryViewed ? 'Leída' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Ejercicios:</span>
                    <div className="flex items-center space-x-2">
                      {exercisesCompleted ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                      )}
                      <span className={exercisesCompleted ? 'text-green-600' : 'text-gray-500'}>
                        {exercisesCompleted ? 'Completados' : 'Pendientes'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <Badge className={getStatusColor(lesson.status)}>
                      {getStatusText(lesson.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tiempo estimado:</span>
                    <span>{lesson.estimatedTimeMinutes || 0} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tiempo estudiado:</span>
                    <span>{lesson.totalTimeMinutes || 0} min</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => setActiveTab("video")}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Ver Video
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveTab("theory")}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Leer Teoría
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveTab("exercises")}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Hacer Ejercicios
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
