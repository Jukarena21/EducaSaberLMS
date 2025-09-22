import { useState, useEffect } from 'react';
import { CourseData, CourseFormData, CourseFilters } from '@/types/course';

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
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  // Obtener cursos
  const fetchCourses = async (newFilters?: CourseFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = buildUrl('/api/courses', newFilters || filters);
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener cursos');
      }
      
      const data = await response.json();
      setCourses(data);
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
    fetchCourses(newFilters);
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({});
    fetchCourses({});
  };

  // Cargar cursos al montar el hook
  useEffect(() => {
    fetchCourses();
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