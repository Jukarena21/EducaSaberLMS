import { useState, useEffect } from 'react';
import { CompetencyData } from '@/types/competency';

const COMPETENCIES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let competenciesCache: { data: CompetencyData[]; timestamp: number } | null = null;

const getCompetenciesCache = () => {
  if (!competenciesCache) return null;
  if (Date.now() - competenciesCache.timestamp > COMPETENCIES_CACHE_TTL) {
    competenciesCache = null;
    return null;
  }
  return competenciesCache.data;
};

const setCompetenciesCache = (data: CompetencyData[]) => {
  competenciesCache = { data, timestamp: Date.now() };
};

const invalidateCompetenciesCache = () => {
  competenciesCache = null;
};

export function useCompetencies() {
  const [competencies, setCompetencies] = useState<CompetencyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener competencias
  const fetchCompetencies = async (options: { skipCache?: boolean } = {}) => {
    // Try cache first if not skipping
    if (!options.skipCache) {
      const cached = getCompetenciesCache();
      if (cached) {
        setCompetencies(cached);
        return;
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/competencies');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener competencias');
      }
      
      const data = await response.json();
      setCompetencies(data);
      setCompetenciesCache(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Cargar competencias al montar el hook
  useEffect(() => {
    // Try cache first, only fetch if no cached data
    fetchCompetencies({ skipCache: false });
  }, []);

  return {
    competencies,
    loading,
    error,
    fetchCompetencies,
  };
}
