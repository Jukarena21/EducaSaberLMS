import { useState, useEffect } from 'react'
import { QuestionData, QuestionFormData } from '@/types/question'

interface UseQuestionsReturn {
  questions: QuestionData[]
  loading: boolean
  error: string | null
  createQuestion: (data: QuestionFormData) => Promise<QuestionData | null>
  updateQuestion: (id: string, data: QuestionFormData) => Promise<QuestionData | null>
  deleteQuestion: (id: string) => Promise<boolean>
  refreshQuestions: () => Promise<void>
}

export function useQuestions(): UseQuestionsReturn {
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchQuestions = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/questions')
      if (!response.ok) {
        throw new Error('Error al cargar las preguntas')
      }
      const data = await response.json()
      setQuestions(data.questions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const createQuestion = async (data: QuestionFormData): Promise<QuestionData | null> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear la pregunta')
      }

      const newQuestion = await response.json()
      await fetchQuestions()
      return newQuestion
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateQuestion = async (id: string, data: QuestionFormData): Promise<QuestionData | null> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar la pregunta')
      }

      const updatedQuestion = await response.json()
      await fetchQuestions()
      return updatedQuestion
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return null
    } finally {
      setLoading(false)
    }
  }

  const deleteQuestion = async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar la pregunta')
      }

      await fetchQuestions()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return false
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestions()
  }, [])

  return {
    questions,
    loading,
    error,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    refreshQuestions: fetchQuestions,
  }
} 