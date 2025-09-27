import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { SchoolData, SchoolFormData } from '@/types/school'

interface UseSchoolsReturn {
  schools: SchoolData[]
  loading: boolean
  error: string | null
  createSchool: (data: SchoolFormData) => Promise<void>
  updateSchool: (id: string, data: SchoolFormData) => Promise<void>
  deleteSchool: (id: string) => Promise<void>
  refreshSchools: () => Promise<void>
}

export function useSchools(): UseSchoolsReturn {
  const { data: session } = useSession()
  const [schools, setSchools] = useState<SchoolData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSchools = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/schools')
      if (!response.ok) {
        throw new Error('Error al cargar los colegios')
      }
      const data = await response.json()
      setSchools(data.schools || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      console.error('Error fetching schools:', err)
    } finally {
      setLoading(false)
    }
  }

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
      
      await fetchSchools()
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
      
      await fetchSchools()
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
      
      await fetchSchools()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      console.error('Error deleting school:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const refreshSchools = fetchSchools

  useEffect(() => {
    if (session?.user) {
      fetchSchools()
    }
  }, [session?.user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    schools,
    loading,
    error,
    createSchool,
    updateSchool,
    deleteSchool,
    refreshSchools,
  }
} 