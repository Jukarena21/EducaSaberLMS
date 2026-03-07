"use client"

import { useState, useEffect } from "react"
import { ExamInterface } from "@/components/ExamInterface"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface ExamPreviewInterfaceProps {
  simulacroId: string
  onClose?: () => void
}

export function ExamPreviewInterface({ simulacroId, onClose }: ExamPreviewInterfaceProps) {
  const [examData, setExamData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadExamData()
  }, [simulacroId])

  const loadExamData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/manual-simulacros/${simulacroId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar el simulacro')
      }
      
      const exam = await response.json()
      
      if (!exam.examQuestions || exam.examQuestions.length === 0) {
        setError('Este simulacro no tiene preguntas. Agrega preguntas antes de ver la vista previa.')
        setLoading(false)
        return
      }

      // Transformar datos al formato que espera ExamInterface
      const transformedExam = {
        id: exam.id,
        title: exam.title,
        description: exam.description || '',
        timeLimitMinutes: exam.timeLimitMinutes || 60,
        totalQuestions: exam.examQuestions.length
      }

      const transformedQuestions = exam.examQuestions.map((q: any) => ({
        id: q.id,
        text: q.questionText || '', // Solo la pregunta específica
        type: q.questionType || 'multiple_choice',
        difficultyLevel: q.difficultyLevel || 'intermedio',
        imageUrl: q.questionImage,
        questionImage: q.questionImage,
        questionType: q.questionType || 'multiple_choice',
        lessonUrl: q.lessonUrl, // Enunciado (texto base ICFES) - se mostrará por separado
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        optionAImage: q.optionAImage,
        optionBImage: q.optionBImage,
        optionCImage: q.optionCImage,
        optionDImage: q.optionDImage,
        options: [
          { id: 'A', text: q.optionA, isCorrect: false },
          { id: 'B', text: q.optionB, isCorrect: false },
          { id: 'C', text: q.optionC, isCorrect: false },
          { id: 'D', text: q.optionD, isCorrect: false }
        ],
        competency: q.competency?.displayName || 'General'
      }))

      setExamData({
        exam: transformedExam,
        questions: transformedQuestions,
        attemptId: `preview-${simulacroId}`, // ID mock para preview
        startedAt: new Date().toISOString(),
        existingAnswers: {}
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el simulacro')
      console.error('Error loading exam data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#73A2D3] mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando vista previa...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!examData) {
    return (
      <div className="p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No se pudieron cargar los datos del examen</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Renderizar ExamInterface pero deshabilitando el guardado de respuestas
  // Sobrescribimos la función saveAnswer para que no haga nada
  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-50 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 text-yellow-800 text-sm font-medium">
          <AlertCircle className="h-4 w-4" />
          <span>Vista Previa - Las respuestas no se guardarán</span>
        </div>
      </div>
      <ExamInterface
        exam={examData.exam}
        questions={examData.questions}
        attemptId={examData.attemptId}
        startedAt={examData.startedAt}
        existingAnswers={examData.existingAnswers}
        previewMode={true}
      />
    </div>
  )
}
