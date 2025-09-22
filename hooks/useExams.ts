import { useState, useEffect } from 'react'
import { ExamData, ExamFormData, ExamFilters, ExamStatistics } from '@/types/exam'

export function useExams(filters?: ExamFilters) {
  const [exams, setExams] = useState<ExamData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchExams = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const queryParams = new URLSearchParams()
      if (filters?.search) queryParams.append('search', filters.search)
      if (filters?.examType) queryParams.append('examType', filters.examType)
      if (filters?.competencyId) queryParams.append('competencyId', filters.competencyId)
      if (filters?.courseId) queryParams.append('courseId', filters.courseId)
      if (filters?.difficultyLevel) queryParams.append('difficultyLevel', filters.difficultyLevel)
      if (filters?.isPublished !== undefined) queryParams.append('isPublished', filters.isPublished.toString())
      if (filters?.createdById) queryParams.append('createdById', filters.createdById)
      if (filters?.openDateFrom) queryParams.append('openDateFrom', filters.openDateFrom)
      if (filters?.openDateTo) queryParams.append('openDateTo', filters.openDateTo)
      if (filters?.closeDateFrom) queryParams.append('closeDateFrom', filters.closeDateFrom)
      if (filters?.closeDateTo) queryParams.append('closeDateTo', filters.closeDateTo)

      const response = await fetch(`/api/exams?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar los exámenes')
      }
      
      const data = await response.json()
      setExams(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const createExam = async (examData: ExamFormData): Promise<ExamData | null> => {
    try {
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(examData),
      })

      if (!response.ok) {
        throw new Error('Error al crear el examen')
      }

      const newExam = await response.json()
      await fetchExams() // Refrescar la lista
      return newExam
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el examen')
      return null
    }
  }

  const updateExam = async (id: string, examData: Partial<ExamFormData>): Promise<ExamData | null> => {
    try {
      const response = await fetch(`/api/exams/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(examData),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el examen')
      }

      const updatedExam = await response.json()
      await fetchExams() // Refrescar la lista
      return updatedExam
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el examen')
      return null
    }
  }

  const deleteExam = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/exams/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el examen')
      }

      await fetchExams() // Refrescar la lista
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el examen')
      return false
    }
  }

  const generateExamQuestions = async (examId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/exams/${examId}/generate-questions`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Error al generar las preguntas del examen')
      }

      await fetchExams() // Refrescar la lista
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar las preguntas')
      return false
    }
  }

  useEffect(() => {
    fetchExams()
  }, [filters])

  return {
    exams,
    loading,
    error,
    fetchExams,
    createExam,
    updateExam,
    deleteExam,
    generateExamQuestions,
  }
}

export function useExamStatistics() {
  const [statistics, setStatistics] = useState<ExamStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatistics = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/exams/statistics')
      
      if (!response.ok) {
        throw new Error('Error al cargar las estadísticas')
      }
      
      const data = await response.json()
      setStatistics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatistics()
  }, [])

  return {
    statistics,
    loading,
    error,
    fetchStatistics,
  }
}
