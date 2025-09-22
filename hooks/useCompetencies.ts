import { useState, useEffect } from 'react';
import { CompetencyData } from '@/types/competency';

export function useCompetencies() {
  const [competencies, setCompetencies] = useState<CompetencyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener competencias
  const fetchCompetencies = async () => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Cargar competencias al montar el hook
  useEffect(() => {
    fetchCompetencies();
  }, []);

  return {
    competencies,
    loading,
    error,
    fetchCompetencies,
  };
} 