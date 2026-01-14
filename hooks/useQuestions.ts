import { useState, useEffect, useCallback } from 'react'
import { QuestionData, QuestionFormData, QuestionFilters } from '@/types/question'

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

interface UseQuestionsReturn {
  questions: QuestionData[]
  loading: boolean
  error: string | null
  pagination: PaginationInfo | null
  filters: QuestionFilters
  pendingFilters: QuestionFilters
  setPendingFilters: (filters: QuestionFilters) => void
  applyFilters: (filters: QuestionFilters) => void
  clearFilters: () => void
  goToPage: (page: number) => void
  createQuestion: (data: QuestionFormData) => Promise<QuestionData | null>
  updateQuestion: (id: string, data: QuestionFormData) => Promise<QuestionData | null>
  deleteQuestion: (id: string) => Promise<boolean>
  refreshQuestions: (options?: { skipCache?: boolean }) => Promise<void>
}

const QUESTIONS_CACHE_TTL = 5 * 60 * 1000
const questionCache = new Map<string, { data: QuestionData[]; pagination: PaginationInfo; timestamp: number }>()

const getQuestionCacheEntry = (key: string) => {
  const entry = questionCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > QUESTIONS_CACHE_TTL) {
    questionCache.delete(key)
    return null
  }
  return entry
}

const setQuestionCacheEntry = (key: string, data: QuestionData[], pagination: PaginationInfo) => {
  questionCache.set(key, { data, pagination, timestamp: Date.now() })
}

const invalidateQuestionCache = () => {
  questionCache.clear()
}

const defaultFilters: QuestionFilters = {
  search: '',
  competencyId: 'all',
  lessonId: 'all',
  difficultyLevel: 'all',
  questionType: 'all',
  hasImages: 'all',
  isIcfesCourse: undefined,
}

export function useQuestions(): UseQuestionsReturn {
  const [questions, setQuestions] = useState<QuestionData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [filters, setFilters] = useState<QuestionFilters>(defaultFilters)
  const [pendingFilters, setPendingFilters] = useState<QuestionFilters>(defaultFilters)
  const [page, setPage] = useState(1)
  const limit = 10

  const buildUrl = useCallback((filters: QuestionFilters, page: number, limit: number) => {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    
    if (filters.search) params.append('search', filters.search)
    if (filters.competencyId && filters.competencyId !== 'all') params.append('competencyId', filters.competencyId)
    if (filters.lessonId && filters.lessonId !== 'all') params.append('lessonId', filters.lessonId)
    if (filters.difficultyLevel && filters.difficultyLevel !== 'all') params.append('difficultyLevel', filters.difficultyLevel)
    if (filters.questionType && filters.questionType !== 'all') params.append('questionType', filters.questionType)
    if (filters.isIcfesCourse !== undefined) params.append('isIcfesCourse', filters.isIcfesCourse.toString())
    
    return `/api/questions?${params.toString()}`
  }, [])

  const fetchQuestions = useCallback(async (
    newFilters?: QuestionFilters,
    newPage?: number,
    options: { skipCache?: boolean } = {}
  ) => {
    const activeFilters = newFilters ?? filters
    const activePage = newPage ?? page
    const url = buildUrl(activeFilters, activePage, limit)
    const cacheKey = url

    if (!options.skipCache) {
      const cached = getQuestionCacheEntry(cacheKey)
      if (cached) {
        setQuestions(cached.data)
        setPagination(cached.pagination)
        return
      }
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Error al cargar las preguntas')
      }
      const data = await response.json()
      const list = data.questions || []
      const paginationData = data.pagination || { page: activePage, limit, total: list.length, pages: 1 }
      
      setQuestions(list)
      setPagination(paginationData)
      setQuestionCacheEntry(cacheKey, list, paginationData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [filters, page, limit, buildUrl])

  const applyFilters = useCallback((newFilters: QuestionFilters) => {
    setFilters(newFilters)
    setPage(1)
    fetchQuestions(newFilters, 1, { skipCache: true })
  }, [fetchQuestions])

  const clearFilters = useCallback(() => {
    setPendingFilters(defaultFilters)
    setFilters(defaultFilters)
    setPage(1)
    fetchQuestions(defaultFilters, 1, { skipCache: true })
  }, [fetchQuestions])

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage)
    fetchQuestions(filters, newPage, { skipCache: true })
  }, [filters, fetchQuestions])

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
      invalidateQuestionCache()
      await fetchQuestions(filters, page, { skipCache: true })
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
      invalidateQuestionCache()
      await fetchQuestions(filters, page, { skipCache: true })
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

      // Invalidar cache
      invalidateQuestionCache()
      
      // Refrescar la lista sin mostrar errores si la eliminación fue exitosa
      // pero el refresh falla (por ejemplo, si no hay más preguntas en la página actual)
      try {
        // Si estamos en la última página y eliminamos la última pregunta,
        // intentar ir a la página anterior
        if (pagination && page > 1 && questions.length === 1) {
          const previousPage = page - 1
          setPage(previousPage)
          await fetchQuestions(filters, previousPage, { skipCache: true })
        } else {
          // Refrescar la página actual
          await fetchQuestions(filters, page, { skipCache: true })
        }
      } catch (refreshError) {
        // Si hay error al refrescar, intentar cargar la primera página
        console.warn('Error al refrescar después de eliminar, intentando página 1:', refreshError)
        try {
          setPage(1)
          await fetchQuestions(filters, 1, { skipCache: true })
        } catch (finalError) {
          // Si aún falla, solo loguear pero no fallar la eliminación
          console.warn('Error al refrescar después de eliminar:', finalError)
        }
      }
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return false
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Try cache first, only fetch if no cached data
    // Use default values directly to avoid dependency issues
    fetchQuestions(defaultFilters, 1, { skipCache: false })
  }, []) // Only on mount - eslint-disable-line react-hooks/exhaustive-deps

  return {
    questions,
    loading,
    error,
    pagination,
    filters,
    pendingFilters,
    setPendingFilters,
    applyFilters,
    clearFilters,
    goToPage,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    refreshQuestions: (options) => fetchQuestions(filters, page, options),
  }
}
