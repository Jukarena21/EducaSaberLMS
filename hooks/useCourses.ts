import { useState, useEffect } from 'react';
import { CourseData, CourseFormData, CourseFilters } from '@/types/course';

const COURSE_CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const courseCache = new Map<string, { data: CourseData[]; timestamp: number }>();

const getCacheEntry = (key: string) => {
  const entry = courseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > COURSE_CACHE_TTL) {
    courseCache.delete(key);
    return null;
  }
  return entry;
};

const setCacheEntry = (key: string, data: CourseData[]) => {
  courseCache.set(key, { data, timestamp: Date.now() });
};

const invalidateCourseCache = () => {
  courseCache.clear();
};

export function useCourses() {
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CourseFilters>({});

  // Función para construir la URL con filtros
  const buildUrl = (baseUrl: string, filters: CourseFilters) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.schoolId) params.append('schoolId', filters.schoolId);
    if (filters.competencyId) params.append('competencyId', filters.competencyId);
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.isIcfesCourse !== undefined) params.append('isIcfesCourse', filters.isIcfesCourse.toString());
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  // Obtener cursos
  const fetchCourses = async (newFilters?: CourseFilters, options: { skipCache?: boolean } = {}) => {
    const activeFilters = newFilters ?? filters;
    const url = buildUrl('/api/courses', activeFilters);
    const cacheKey = url;

    if (!options.skipCache) {
      const cacheEntry = getCacheEntry(cacheKey);
      if (cacheEntry) {
        setCourses(cacheEntry.data);
        return;
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener cursos');
      }
      
      const data = await response.json();
      setCourses(data);
      setCacheEntry(cacheKey, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Crear curso
  const createCourse = async (courseData: CourseFormData): Promise<CourseData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear curso');
      }
      
      const newCourse = await response.json();
      setCourses(prev => [...prev, newCourse]);
      invalidateCourseCache();
      return newCourse;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar curso
  const updateCourse = async (id: string, courseData: CourseFormData): Promise<CourseData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar curso');
      }
      
      const updatedCourse = await response.json();
      setCourses(prev => prev.map(course => 
        course.id === id ? updatedCourse : course
      ));
      invalidateCourseCache();
      return updatedCourse;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar curso
  const deleteCourse = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar curso');
      }
      
      setCourses(prev => prev.filter(course => course.id !== id));
      invalidateCourseCache();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Obtener curso específico
  const getCourse = async (id: string): Promise<CourseData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/courses/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener curso');
      }
      
      const course = await response.json();
      return course;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  const applyFilters = (newFilters: CourseFilters) => {
    setFilters(newFilters);
    fetchCourses(newFilters, { skipCache: true });
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({});
    fetchCourses({}, { skipCache: true });
  };

  // Cargar cursos al montar el hook
  useEffect(() => {
    // Try cache first, only fetch if no cached data
    fetchCourses({}, { skipCache: false });
  }, []);

  return {
    courses,
    loading,
    error,
    filters,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    getCourse,
    applyFilters,
    clearFilters,
  };
} 