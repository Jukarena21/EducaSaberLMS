"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Users, Target, Calendar, BookOpen, Award, AlertCircle } from 'lucide-react'
import { ExamPreviewProps } from '@/types/exam'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { QuestionRenderer } from '@/components/QuestionRenderer'

export function ExamPreview({ exam, mode, onAnswer, answers, isSubmitted, timeRemaining }: ExamPreviewProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No definida'
    return format(new Date(dateString), "PPP 'a las' p", { locale: es })
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

  const getDifficultyColor = (level: string) => {
    const colors = {
      'facil': 'bg-green-100 text-green-800',
      'intermedio': 'bg-yellow-100 text-yellow-800',
      'dificil': 'bg-red-100 text-red-800',
      'variable': 'bg-purple-100 text-purple-800'
    }
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getDifficultyLabel = (level: string) => {
    const labels = {
      'facil': 'Fácil',
      'intermedio': 'Intermedio',
      'dificil': 'Difícil',
      'variable': 'Variable (Todas las dificultades)'
    }
    return labels[level as keyof typeof labels] || level
  }

  if (mode === 'admin') {
    return (
      <div className="space-y-6">
        {/* Información del examen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {exam.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {exam.description && (
              <p className="text-gray-600">{exam.description}</p>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{getExamTypeLabel(exam.examType)}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor(exam.difficultyLevel)}>
                  {getDifficultyLabel(exam.difficultyLevel)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{exam.timeLimitMinutes || 'Sin límite'} min</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{exam.passingScore}% mínimo</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Apertura</p>
                  <p className="text-sm text-gray-600">{formatDate(exam.openDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Cierre</p>
                  <p className="text-sm text-gray-600">{formatDate(exam.closeDate)}</p>
                </div>
              </div>
            </div>

            {exam.course && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">Curso</p>
                <p className="text-sm text-gray-600">
                  {exam.course.title} - {exam.course.competency.displayName}
                </p>
              </div>
            )}

            {exam.includedModules && exam.includedModules.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium">Módulos Incluidos</p>
                <p className="text-sm text-gray-600">
                  {exam.includedModules.length} módulos seleccionados
                </p>
                <p className="text-sm text-gray-600">
                  {exam.questionsPerModule} preguntas por módulo
                </p>
                {exam.totalQuestions && (
                  <p className="text-sm font-medium text-primary">
                    Total: {exam.totalQuestions} preguntas
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estadísticas del examen */}
        {exam.examResults && exam.examResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Estadísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{exam.examResults.length}</p>
                  <p className="text-sm text-gray-600">Intentos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(exam.examResults.reduce((acc, result) => acc + result.score, 0) / exam.examResults.length)}%
                  </p>
                  <p className="text-sm text-gray-600">Promedio</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round((exam.examResults.filter(r => r.isPassed).length / exam.examResults.length) * 100)}%
                  </p>
                  <p className="text-sm text-gray-600">Aprobación</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {Math.round(exam.examResults.reduce((acc, result) => acc + (result.timeTakenMinutes || 0), 0) / exam.examResults.length)} min
                  </p>
                  <p className="text-sm text-gray-600">Tiempo Promedio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (mode === 'student') {
    return (
      <div className="space-y-6">
        {/* Información del examen para estudiantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {exam.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {exam.description && (
              <p className="text-gray-600">{exam.description}</p>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Tiempo</p>
                  <p className="text-sm text-gray-600">
                    {timeRemaining ? `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}` : `${exam.timeLimitMinutes || 'Sin límite'} min`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Puntuación Mínima</p>
                  <p className="text-sm text-gray-600">{exam.passingScore}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Preguntas</p>
                  <p className="text-sm text-gray-600">{exam.totalQuestions || 'No definido'}</p>
                </div>
              </div>
            </div>

            {exam.course && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Curso</p>
                <p className="text-sm text-blue-700">
                  {exam.course.title} - {exam.course.competency.displayName}
                </p>
              </div>
            )}

            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Instrucciones</p>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    <li>• Lee cada pregunta cuidadosamente antes de responder</li>
                    <li>• Solo puedes seleccionar una respuesta por pregunta</li>
                    <li>• Puedes revisar y cambiar tus respuestas antes de enviar</li>
                    <li>• Una vez enviado, no podrás modificar tus respuestas</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preguntas del examen */}
        {exam.examQuestions && exam.examQuestions.length > 0 ? (
          <div className="space-y-4">
            {exam.examQuestions.map((question, index) => (
              <Card key={question.id}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-medium">{question.questionText}</p>
                        {question.questionImage && (
                          <div className="mt-3">
                            <img
                              src={question.questionImage}
                              alt="Imagen de la pregunta"
                              className="max-w-full h-auto rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-11">
                      <QuestionRenderer
                        question={question}
                        selectedAnswer={answers?.[question.id]}
                        onAnswerChange={(answer) => !isSubmitted && onAnswer?.(question.id, answer)}
                        showCorrectAnswer={isSubmitted}
                        isSubmitted={isSubmitted}
                        disabled={isSubmitted}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Este examen no tiene preguntas generadas aún</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Modo preview (para el formulario)
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {exam.title || 'Nuevo Examen'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {exam.description && (
            <p className="text-gray-600">{exam.description}</p>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{getExamTypeLabel(exam.examType)}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getDifficultyColor(exam.difficultyLevel)}>
                {getDifficultyLabel(exam.difficultyLevel)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{exam.timeLimitMinutes || 'Sin límite'} min</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{exam.passingScore}% mínimo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Apertura</p>
                <p className="text-sm text-gray-600">{formatDate(exam.openDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Cierre</p>
                <p className="text-sm text-gray-600">{formatDate(exam.closeDate)}</p>
              </div>
            </div>
          </div>

          {exam.includedModules && exam.includedModules.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Configuración de Preguntas</p>
              <p className="text-sm text-gray-600">
                {exam.includedModules.length} módulos seleccionados
              </p>
              <p className="text-sm text-gray-600">
                {exam.questionsPerModule} preguntas por módulo
              </p>
              {exam.totalQuestions && (
                <p className="text-sm font-medium text-primary">
                  Total estimado: {exam.totalQuestions} preguntas
                </p>
              )}
            </div>
          )}

          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Información del Examen</p>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>• Las preguntas se seleccionarán aleatoriamente de los módulos incluidos</li>
                  <li>• Cada estudiante verá un conjunto diferente de preguntas</li>
                  <li>• El examen se generará automáticamente al publicarlo</li>
                  <li>• Los estudiantes podrán acceder durante el período de apertura</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
