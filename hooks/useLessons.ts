import { useState, useEffect } from 'react';
import { LessonData, LessonFormData, LessonFilters } from '@/types/lesson';

export function useLessons() {
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LessonFilters>({});

  // Función para construir la URL con filtros
  const buildUrl = (baseUrl: string, filters: LessonFilters) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.moduleId) params.append('moduleId', filters.moduleId);
    if (filters.competencyId) params.append('competencyId', filters.competencyId);
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  // Obtener lecciones
  const fetchLessons = async (newFilters?: LessonFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = buildUrl('/api/lessons', newFilters || filters);
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener lecciones');
      }
      
      const data = await response.json();
      setLessons(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Crear lección
  const createLesson = async (lessonData: LessonFormData): Promise<LessonData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lessonData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear lección');
      }
      
      const newLesson = await response.json();
      setLessons(prev => [...prev, newLesson]);
      return newLesson;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar lección
  const updateLesson = async (id: string, lessonData: LessonFormData): Promise<LessonData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/lessons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lessonData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar lección');
      }
      
      const updatedLesson = await response.json();
      // Refrescar la lista completa para asegurar datos actualizados
      await fetchLessons();
      return updatedLesson;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar lección
  const deleteLesson = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/lessons/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar lección');
      }
      
      // Refrescar la lista completa para asegurar datos actualizados
      await fetchLessons();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Obtener lección específica
  const getLesson = async (id: string): Promise<LessonData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/lessons/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener lección');
      }
      
      const lesson = await response.json();
      return lesson;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  const applyFilters = (newFilters: LessonFilters) => {
    setFilters(newFilters);
    fetchLessons(newFilters);
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({});
    fetchLessons({});
  };

  // Cargar lecciones al montar el hook
  useEffect(() => {
    fetchLessons();
  }, []);

  return {
    lessons,
    loading,
    error,
    filters,
    fetchLessons,
    createLesson,
    updateLesson,
    deleteLesson,
    getLesson,
    applyFilters,
    clearFilters,
  };
} 