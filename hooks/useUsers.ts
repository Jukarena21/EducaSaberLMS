import { useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  avatarUrl?: string
  schoolId?: string
  school?: {
    id: string
    name: string
  }
  academicGrade?: string
  dateOfBirth?: string
  gender?: string
  documentType?: string
  documentNumber?: string
  address?: string
  neighborhood?: string
  city?: string
  contactPhone?: string
  socioeconomicStratum?: number
  housingType?: string
  schoolEntryYear?: number
  academicAverage?: number
  areasOfDifficulty?: any
  areasOfStrength?: any
  repetitionHistory?: boolean
  schoolSchedule?: string
  disabilities?: any
  specialEducationalNeeds?: string
  medicalConditions?: string
  homeTechnologyAccess?: boolean
  homeInternetAccess?: boolean
  status?: string
  totalPlatformTimeMinutes: number
  sessionsStarted: number
  lastSessionAt?: string
  createdAt: string
  updatedAt: string
}

interface UserFilters {
  page?: number
  limit?: number
  search?: string
  role?: string
  schoolId?: string
}

interface UserFormData {
  email: string
  password?: string
  firstName: string
  lastName: string
  role: string
  schoolId?: string
  dateOfBirth?: string
  gender?: string
  documentType?: string
  documentNumber?: string
  address?: string
  neighborhood?: string
  city?: string
  socioeconomicStratum?: number
  housingType?: string
  schoolEntryYear?: number
  academicAverage?: number
  areasOfDifficulty?: any
  areasOfStrength?: any
  repetitionHistory?: boolean
  schoolSchedule?: string
  disabilities?: any
  specialEducationalNeeds?: string
  medicalConditions?: string
  homeTechnologyAccess?: boolean
  homeInternetAccess?: boolean
  academicGrade?: string
  contactPhone?: string
  status?: string
}

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  schools: Array<{
    id: string
    name: string
  }>
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [schools, setSchools] = useState<Array<{ id: string; name: string }>>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch users with filters
  const fetchUsers = async (filters: UserFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.search) params.append('search', filters.search)
      if (filters.role) params.append('role', filters.role)
      if (filters.schoolId) params.append('schoolId', filters.schoolId)

      const response = await fetch(`/api/users?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cargar usuarios')
      }

      const data: UsersResponse = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)
      setSchools(data.schools || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Create new user
  const createUser = async (userData: UserFormData): Promise<User | null> => {
    setLoading(true)
    setError(null)

    try {
      console.log('Creating user with data:', userData)
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.error || 'Error al crear usuario')
      }

      const data = await response.json()
      console.log('Success response:', data)
      
      // Refresh users list
      await fetchUsers()
      return data.user
    } catch (err) {
      console.error('Error in createUser:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Update user
  const updateUser = async (id: string, userData: Partial<UserFormData>): Promise<User | null> => {
    setLoading(true)
    setError(null)

    try {
      console.log('Updating user with data:', { id, userData })
      
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      console.log('Update response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Update error response:', errorData)
        throw new Error(errorData.error || 'Error al actualizar usuario')
      }

      const data = await response.json()
      console.log('Update success response:', data)
      
      // Refresh users list
      await fetchUsers()
      return data.user
    } catch (err) {
      console.error('Error in updateUser:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Delete user
  const deleteUser = async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar usuario')
      }

      // Refresh users list
      await fetchUsers()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return false
    } finally {
      setLoading(false)
    }
  }

  // Get single user
  const getUser = async (id: string): Promise<User | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/users/${id}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cargar usuario')
      }

      const user = await response.json()
      return user
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Clear error
  const clearError = () => {
    setError(null)
  }

  return {
    users,
    schools,
    pagination,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    getUser,
    clearError,
  }
} 