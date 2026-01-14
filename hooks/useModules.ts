import { useState, useEffect } from 'react';
import { ModuleData, ModuleFormData, ModuleFilters } from '@/types/module';

type ModulePagination = {
  total: number;
  page: number;
  pages: number;
  limit: number;
};

type ModuleCacheValue = {
  data: ModuleData[];
  pagination?: ModulePagination;
};

const MODULE_CACHE_TTL = 5 * 60 * 1000;
const DEFAULT_LIMIT = 6;
const moduleCache = new Map<string, { value: ModuleCacheValue; timestamp: number }>();

const getModuleCacheEntry = (key: string) => {
  const entry = moduleCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > MODULE_CACHE_TTL) {
    moduleCache.delete(key);
    return null;
  }
  return entry.value;
};

const setModuleCacheEntry = (key: string, value: ModuleCacheValue) => {
  moduleCache.set(key, { value, timestamp: Date.now() });
};

const invalidateModuleCache = () => {
  moduleCache.clear();
};

export function useModules(forCourseCreation: boolean = false) {
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ModuleFilters>({});
  const [pagination, setPagination] = useState<ModulePagination>({
    total: 0,
    page: 1,
    pages: 1,
    limit: DEFAULT_LIMIT,
  });
  const enablePagination = !forCourseCreation;

  const buildUrl = (baseUrl: string, filters: ModuleFilters) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.createdById) params.append('createdById', filters.createdById);
    if (filters.competencyId) params.append('competencyId', filters.competencyId);
    if (filters.isIcfesModule !== undefined) params.append('isIcfesModule', filters.isIcfesModule.toString());
    if (forCourseCreation) params.append('forCourseCreation', 'true');
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  const fetchModules = async ({
    filters: overrideFilters,
    page,
    skipCache,
  }: { filters?: ModuleFilters; page?: number; skipCache?: boolean } = {}) => {
    const activeFilters = overrideFilters ?? filters;
    const baseUrl = buildUrl('/api/modules', activeFilters);

    let finalUrl = baseUrl;
    let targetPage = pagination.page || 1;

    if (enablePagination) {
      targetPage = page ?? pagination.page ?? 1;
      const paginationParams = new URLSearchParams({
        page: targetPage.toString(),
        limit: pagination.limit.toString(),
      });
      finalUrl += (finalUrl.includes('?') ? '&' : '?') + paginationParams.toString();
    }

    const cacheKey = finalUrl;

    if (!skipCache) {
      const cached = getModuleCacheEntry(cacheKey);
      if (cached) {
        setModules(cached.data);
        if (enablePagination && cached.pagination) {
          setPagination(cached.pagination);
        }
        return;
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(finalUrl);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener módulos');
      }
      
      if (enablePagination) {
        const payload = await response.json();
        const data: ModuleData[] = payload.data || [];
        const meta = payload.pagination || {};
        const normalizedPagination: ModulePagination = {
          total: meta.total || 0,
          page: meta.page || targetPage,
          pages: meta.pages || Math.max(1, Math.ceil((meta.total || 0) / pagination.limit) || 1),
          limit: meta.limit || pagination.limit,
        };
        setModules(data);
        setPagination(normalizedPagination);
        setModuleCacheEntry(cacheKey, { data, pagination: normalizedPagination });
      } else {
        const data = await response.json();
        setModules(data || []);
        setModuleCacheEntry(cacheKey, { data: data || [] });
      }
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
      invalidateModuleCache();
      await fetchModules({ skipCache: true });
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
      invalidateModuleCache();
      await fetchModules({ skipCache: true });
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
      
      await fetchModules({ skipCache: true });
      invalidateModuleCache();
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

  const applyFilters = (newFilters: ModuleFilters) => {
    setFilters(newFilters);
    if (enablePagination) {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchModules({ filters: newFilters, page: 1, skipCache: true });
    } else {
      fetchModules({ filters: newFilters, skipCache: true });
    }
  };

  const clearFilters = () => {
    setFilters({});
    if (enablePagination) {
      setPagination(prev => ({ ...prev, page: 1 }));
      fetchModules({ filters: {}, page: 1, skipCache: true });
    } else {
      fetchModules({ filters: {}, skipCache: true });
    }
  };

  const goToPage = (page: number) => {
    if (!enablePagination) return;
    const target = Math.max(1, page);
    setPagination(prev => ({ ...prev, page: target }));
    fetchModules({ page: target, skipCache: true });
  };

  useEffect(() => {
    // Try cache first, only fetch if no cached data
    fetchModules({ skipCache: false });
  }, []);

  return {
    modules,
    loading,
    error,
    filters,
    pagination,
    fetchModules,
    goToPage,
    createModule,
    updateModule,
    deleteModule,
    getModule,
    applyFilters,
    clearFilters,
  };
}