import { useState, useEffect } from 'react'

interface Course {
  id: string
  title: string
  academicGrade: string
  competency: {
    id: string
    name: string
    displayName: string
  }
}

const SCHOOL_COURSE_CACHE_TTL = 5 * 60 * 1000
const courseCache = new Map<string, { data: Course[]; timestamp: number }>()

const getCacheEntry = (id: string) => {
  const entry = courseCache.get(id)
  if (!entry) return null
  if (Date.now() - entry.timestamp > SCHOOL_COURSE_CACHE_TTL) {
    courseCache.delete(id)
    return null
  }
  return entry.data
}

const setCacheEntry = (id: string, data: Course[]) => {
  courseCache.set(id, { data, timestamp: Date.now() })
}

export function useCoursesBySchool(schoolId: string | null) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!schoolId || schoolId === 'all') {
      setCourses([])
      setLoading(false)
      return
    }

    const cached = getCacheEntry(schoolId)
    if (cached) {
      setCourses(cached)
      return
    }

    const fetchCourses = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/courses?schoolId=${schoolId}`)
        if (!response.ok) {
          throw new Error('Error al cargar los cursos')
        }
        
        const data = await response.json()
        setCourses(data)
        setCacheEntry(schoolId, data)
      } catch (err) {
        console.error('Error fetching courses:', err)
        setError(err instanceof Error ? err.message : 'Error desconocido')
        setCourses([])
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [schoolId])

  return { courses, loading, error }
}
