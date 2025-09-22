import { useState, useEffect } from 'react';

interface ActivityItem {
  id: string;
  type: 'lesson_completed' | 'exam_completed' | 'course_enrolled';
  title: string;
  description: string;
  date: string;
  metadata: Record<string, any>;
  actionUrl?: string;
}

interface ActivityStats {
  totalActivities: number;
  lessonsCompleted: number;
  examsCompleted: number;
  coursesEnrolled: number;
  averageExamScore: number;
  totalStudyTime: number;
}

interface PerformanceMetric {
  competency: any;
  competencyName: string;
  averageScore: number;
  examCount: number;
  passedCount: number;
  passRate: number;
  recentExams: any[];
  trend: 'improving' | 'declining' | 'stable';
  lessonProgress: {
    totalLessons: number;
    completedLessons: number;
    totalTime: number;
    averageProgress: number;
  };
}

interface OverallStats {
  totalExams: number;
  averageScore: number;
  totalLessonsCompleted: number;
  totalStudyTime: number;
  period: number;
  startDate: string;
  endDate: string;
}

interface UseActivityHistoryReturn {
  activities: ActivityItem[];
  stats: ActivityStats | null;
  performance: PerformanceMetric[];
  overallStats: OverallStats | null;
  loading: boolean;
  error: string | null;
  fetchActivityHistory: (filters?: {
    type?: string;
    limit?: number;
    offset?: number;
  }) => Promise<void>;
  fetchPerformance: (filters?: {
    period?: number;
    competencyId?: string;
  }) => Promise<void>;
  refreshData: () => Promise<void>;
}

export function useActivityHistory(): UseActivityHistoryReturn {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetric[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivityHistory = async (filters?: {
    type?: string;
    limit?: number;
    offset?: number;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await fetch(`/api/student/activity/history?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar historial de actividad');
      }

      const data = await response.json();
      setActivities(data.activities);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async (filters?: {
    period?: number;
    competencyId?: string;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters?.period) params.append('period', filters.period.toString());
      if (filters?.competencyId) params.append('competencyId', filters.competencyId);

      const response = await fetch(`/api/student/activity/performance?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar datos de rendimiento');
      }

      const data = await response.json();
      setPerformance(data.performance);
      setOverallStats(data.overallStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await Promise.all([
      fetchActivityHistory(),
      fetchPerformance(),
    ]);
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    refreshData();
  }, []);

  return {
    activities,
    stats,
    performance,
    overallStats,
    loading,
    error,
    fetchActivityHistory,
    fetchPerformance,
    refreshData,
  };
}
