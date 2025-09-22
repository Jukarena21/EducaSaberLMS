import { useState, useEffect } from 'react';
import { ModuleData, ModuleFormData, ModuleFilters } from '@/types/module';

export function useModules(forCourseCreation: boolean = false) {
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ModuleFilters>({});

  // Función para construir la URL con filtros
  const buildUrl = (baseUrl: string, filters: ModuleFilters) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.createdById) params.append('createdById', filters.createdById);
    if (forCourseCreation) params.append('forCourseCreation', 'true');
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  // Obtener módulos
  const fetchModules = async (newFilters?: ModuleFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = buildUrl('/api/modules', newFilters || filters);
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener módulos');
      }
      
      const data = await response.json();
      setModules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Crear módulo
  const createModule = async (moduleData: ModuleFormData): Promise<ModuleData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moduleData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear módulo');
      }
      
      const newModule = await response.json();
      setModules(prev => [...prev, newModule]);
      return newModule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar módulo
  const updateModule = async (id: string, moduleData: ModuleFormData): Promise<ModuleData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/modules/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moduleData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar módulo');
      }
      
      const updatedModule = await response.json();
      setModules(prev => prev.map(module => 
        module.id === id ? updatedModule : module
      ));
      return updatedModule;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar módulo
  const deleteModule = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Eliminando módulo con ID:', id);
      const response = await fetch(`/api/modules/${id}`, {
        method: 'DELETE',
      });
      
      console.log('Respuesta de eliminación:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error al eliminar módulo:', errorData);
        throw new Error(errorData.error || 'Error al eliminar módulo');
      }
      
      // Refrescar la lista completa para asegurar datos actualizados
      await fetchModules();
      return true;
    } catch (err) {
      console.error('Error en deleteModule:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Obtener módulo específico
  const getModule = async (id: string): Promise<ModuleData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/modules/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener módulo');
      }
      
      const module = await response.json();
      return module;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  const applyFilters = (newFilters: ModuleFilters) => {
    setFilters(newFilters);
    fetchModules(newFilters);
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({});
    fetchModules({});
  };

  // Cargar módulos al montar el hook
  useEffect(() => {
    fetchModules();
  }, []);

  return {
    modules,
    loading,
    error,
    filters,
    fetchModules,
    createModule,
    updateModule,
    deleteModule,
    getModule,
    applyFilters,
    clearFilters,
  };
} 