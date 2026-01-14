import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { SchoolData, SchoolFormData } from '@/types/school'

interface SchoolFilters {
  search?: string
  city?: string
  institutionType?: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

interface UseSchoolsReturn {
  schools: SchoolData[]
  loading: boolean
  error: string | null
  pagination: PaginationInfo | null
  filters: SchoolFilters
  pendingFilters: SchoolFilters
  setPendingFilters: (filters: SchoolFilters) => void
  applyFilters: (filters: SchoolFilters) => void
  clearFilters: () => void
  goToPage: (page: number) => void
  createSchool: (data: SchoolFormData) => Promise<void>
  updateSchool: (id: string, data: SchoolFormData) => Promise<void>
  deleteSchool: (id: string) => Promise<void>
  refreshSchools: (options?: { skipCache?: boolean }) => Promise<void>
}

const SCHOOL_CACHE_TTL = 5 * 60 * 1000
const schoolCache = new Map<string, { data: SchoolData[]; pagination: PaginationInfo; timestamp: number }>()

const getSchoolCacheEntry = (key: string) => {
  const entry = schoolCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > SCHOOL_CACHE_TTL) {
    schoolCache.delete(key)
    return null
  }
  return entry
}

const setSchoolCacheEntry = (key: string, data: SchoolData[], pagination: PaginationInfo) => {
  schoolCache.set(key, { data, pagination, timestamp: Date.now() })
}

const invalidateSchoolCache = () => {
  schoolCache.clear()
}

const defaultFilters: SchoolFilters = {
  search: '',
  city: 'none',
  institutionType: 'none',
}

export function useSchools(): UseSchoolsReturn {
  const { data: session } = useSession()
  const [schools, setSchools] = useState<SchoolData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [filters, setFilters] = useState<SchoolFilters>(defaultFilters)
  const [pendingFilters, setPendingFilters] = useState<SchoolFilters>(defaultFilters)
  const [page, setPage] = useState(1)
  const limit = 10

  const buildUrl = useCallback((filters: SchoolFilters, page: number, limit: number) => {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    
    if (filters.search) params.append('search', filters.search)
    if (filters.city && filters.city !== 'none') params.append('city', filters.city)
    if (filters.institutionType && filters.institutionType !== 'none') params.append('institutionType', filters.institutionType)
    
    return `/api/schools?${params.toString()}`
  }, [])

  const fetchSchools = useCallback(async (
    newFilters?: SchoolFilters,
    newPage?: number,
    options: { skipCache?: boolean } = {}
  ) => {
    if (!session?.user) {
      return
    }
    
    const activeFilters = newFilters ?? filters
    const activePage = newPage ?? page
    const url = buildUrl(activeFilters, activePage, limit)
    const cacheKey = url

    if (!options.skipCache) {
      const cached = getSchoolCacheEntry(cacheKey)
      if (cached) {
        setSchools(cached.data)
        setPagination(cached.pagination)
        return
      }
    }
    
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Error al cargar los colegios')
      }
      const data = await response.json()
      const list = data.schools || []
      const paginationData = data.pagination || { page: activePage, limit, total: list.length, pages: 1 }
      
      setSchools(list)
      setPagination(paginationData)
      setSchoolCacheEntry(cacheKey, list, paginationData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      console.error('Error fetching schools:', err)
    } finally {
      setLoading(false)
    }
  }, [session?.user, filters, page, limit, buildUrl])

  const applyFilters = useCallback((newFilters: SchoolFilters) => {
    setFilters(newFilters)
    setPage(1)
    fetchSchools(newFilters, 1, { skipCache: true })
  }, [fetchSchools])

  const clearFilters = useCallback(() => {
    setPendingFilters(defaultFilters)
    setFilters(defaultFilters)
    setPage(1)
    fetchSchools(defaultFilters, 1, { skipCache: true })
  }, [fetchSchools])

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage)
    fetchSchools(filters, newPage, { skipCache: true })
  }, [filters, fetchSchools])

  const createSchool = async (data: SchoolFormData) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al crear colegio')
      }
      
      invalidateSchoolCache()
      await fetchSchools(filters, page, { skipCache: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      console.error('Error creating school:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateSchool = async (id: string, data: SchoolFormData) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/schools/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar colegio')
      }
      
      invalidateSchoolCache()
      await fetchSchools(filters, page, { skipCache: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      console.error('Error updating school:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteSchool = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/schools/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar colegio')
      }
      
      invalidateSchoolCache()
      await fetchSchools(filters, page, { skipCache: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      console.error('Error deleting school:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const refreshSchools = (options?: { skipCache?: boolean }) => fetchSchools(filters, page, options)

  useEffect(() => {
    if (session?.user) {
      // Try cache first, only fetch if no cached data
      // Use default values directly to avoid dependency issues
      fetchSchools(defaultFilters, 1, { skipCache: false })
    }
  }, [session?.user?.id]) // Only on mount or session change - eslint-disable-line react-hooks/exhaustive-deps

  return {
    schools,
    loading,
    error,
    pagination,
    filters,
    pendingFilters,
    setPendingFilters,
    applyFilters,
    clearFilters,
    goToPage,
    createSchool,
    updateSchool,
    deleteSchool,
    refreshSchools,
  }
}
