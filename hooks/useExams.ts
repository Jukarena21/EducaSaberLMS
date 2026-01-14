import { useState, useEffect, useCallback, useRef } from 'react'
import { ExamData, ExamFormData, ExamFilters, ExamStatistics } from '@/types/exam'

export function useExams(filters?: ExamFilters) {
  const [exams, setExams] = useState<ExamData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const filtersRef = useRef<ExamFilters | undefined>(filters)
  const hasFetchedRef = useRef(false)

  const fetchExams = useCallback(async (currentFilters?: ExamFilters) => {
    const filtersToUse = currentFilters || filtersRef.current
    try {
      setLoading(true)
      setError(null)
      
      const queryParams = new URLSearchParams()
      if (filtersToUse?.search) queryParams.append('search', filtersToUse.search)
      if (filtersToUse?.examType) queryParams.append('examType', filtersToUse.examType)
      if (filtersToUse?.competencyId) queryParams.append('competencyId', filtersToUse.competencyId)
      if (filtersToUse?.courseId) queryParams.append('courseId', filtersToUse.courseId)
      if (filtersToUse?.difficultyLevel) queryParams.append('difficultyLevel', filtersToUse.difficultyLevel)
      if (filtersToUse?.isPublished !== undefined) queryParams.append('isPublished', filtersToUse.isPublished.toString())
      if (filtersToUse?.createdById) queryParams.append('createdById', filtersToUse.createdById)
      if (filtersToUse?.openDateFrom) queryParams.append('openDateFrom', filtersToUse.openDateFrom)
      if (filtersToUse?.openDateTo) queryParams.append('openDateTo', filtersToUse.openDateTo)
      if (filtersToUse?.closeDateFrom) queryParams.append('closeDateFrom', filtersToUse.closeDateFrom)
      if (filtersToUse?.closeDateTo) queryParams.append('closeDateTo', filtersToUse.closeDateTo)

      console.log('🔍 [useExams] Fetching exams with filters:', filtersToUse)
      const response = await fetch(`/api/exams?${queryParams.toString()}`)
      console.log('🔍 [useExams] Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ [useExams] Error response:', errorData)
        throw new Error(errorData.error || 'Error al cargar los exámenes')
      }
      
      const data = await response.json()
      console.log('✅ [useExams] Response data type:', typeof data, 'Is array:', Array.isArray(data))
      console.log('✅ [useExams] Response data:', data)
      const examsArray = Array.isArray(data) ? data : []
      console.log('✅ [useExams] Exams loaded:', examsArray.length, 'exams')
      setExams(examsArray)
    } catch (err) {
      console.error('❌ [useExams] Error fetching exams:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setExams([])
    } finally {
      console.log('✅ [useExams] Setting loading to false')
      setLoading(false)
    }
  }, [])
  
  // Función pública para refrescar manualmente
  const refreshExams = useCallback(() => {
    fetchExams(filtersRef.current)
  }, [fetchExams])

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
      await fetchExams(filtersRef.current) // Refrescar la lista
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
      await fetchExams(filtersRef.current) // Refrescar la lista
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

      await fetchExams(filtersRef.current) // Refrescar la lista
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar las preguntas')
      return false
    }
  }

  useEffect(() => {
    console.log('🔄 [useExams] useEffect triggered')
    console.log('🔄 [useExams] hasFetchedRef.current:', hasFetchedRef.current)
    console.log('🔄 [useExams] filters:', filters)
    
    // Solo fetch en el mount inicial
    if (!hasFetchedRef.current) {
      console.log('🔄 [useExams] Initial mount, fetching exams...')
      hasFetchedRef.current = true // Marcar inmediatamente para evitar doble fetch
      filtersRef.current = filters
      fetchExams(filters).catch(err => {
        console.error('❌ [useExams] Error in initial fetch:', err)
        hasFetchedRef.current = false // Resetear si hay error para permitir reintento
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Efecto separado para cuando cambien los filtros
  useEffect(() => {
    if (hasFetchedRef.current) {
      const filtersChanged = JSON.stringify(filtersRef.current) !== JSON.stringify(filters)
      if (filtersChanged) {
        console.log('🔄 [useExams] Filters changed, fetching exams...')
        filtersRef.current = filters
        fetchExams(filters).catch(err => {
          console.error('❌ [useExams] Error in filter change fetch:', err)
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters?.search,
    filters?.examType,
    filters?.competencyId,
    filters?.courseId,
    filters?.difficultyLevel,
    filters?.isPublished,
    filters?.createdById,
    filters?.openDateFrom,
    filters?.openDateTo,
    filters?.closeDateFrom,
    filters?.closeDateTo,
  ])

  return {
    exams,
    loading,
    error,
    fetchExams: refreshExams,
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
