import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'

interface KPIData {
  activeStudents: number
  averageScore: number
  examAttempts: number
  institutions: number
}

interface EngagementMetrics {
  totalLessonsCompleted: number
  totalStudyTimeHours: number
  averageSessionDurationMinutes: number
  activeUsers: number
  courseCompletions: number
  averageProgress: number
  completionRate: number
}

interface AnalyticsData {
  kpis: KPIData | null
  engagementMetrics: EngagementMetrics | null
  gradeSeries: any[]
  gradeDistribution: any[]
  hourlyActivity: any[]
  schoolRanking: any[]
  reportRows: any[]
  compReportRows: any[]
  reportSeries: any[]
  reportDistribution: any[]
  loading: boolean
  error: string | null
}

interface AnalyticsFilters {
  schoolId?: string
  courseId?: string
  grade?: string
  competencyId?: string
  minAge?: string
  maxAge?: string
  gender?: string
  socioeconomicStratum?: string
}

const ANALYTICS_CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const analyticsCache = new Map<string, { data: AnalyticsData; timestamp: number }>()

const getAnalyticsCacheKey = (filters: AnalyticsFilters): string => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'all') {
      params.append(key, value)
    }
  })
  return params.toString() || 'default'
}

const getAnalyticsCacheEntry = (key: string) => {
  const entry = analyticsCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > ANALYTICS_CACHE_TTL) {
    analyticsCache.delete(key)
    return null
  }
  return entry.data
}

const setAnalyticsCacheEntry = (key: string, data: AnalyticsData) => {
  analyticsCache.set(key, { data, timestamp: Date.now() })
}

const invalidateAnalyticsCache = () => {
  analyticsCache.clear()
}

export function useAnalytics() {
  const { data: session } = useSession()
  const [data, setData] = useState<AnalyticsData>({
    kpis: null,
    engagementMetrics: null,
    gradeSeries: [],
    gradeDistribution: [],
    hourlyActivity: [],
    schoolRanking: [],
    reportRows: [],
    compReportRows: [],
    reportSeries: [],
    reportDistribution: [],
    loading: true,
    error: null
  })
  
  // Use ref to track if we've already fetched on mount
  const hasFetchedRef = useRef(false)

  const fetchAnalytics = useCallback(async (filters: AnalyticsFilters = {}, options: { skipCache?: boolean } = {}) => {
    if (!session?.user) return

    const cacheKey = getAnalyticsCacheKey(filters)
    
    // Try cache first if not skipping
    if (!options.skipCache) {
      const cached = getAnalyticsCacheEntry(cacheKey)
      if (cached) {
        setData(cached)
        return
      }
    }

    setData(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Construir parámetros de consulta
      const params = new URLSearchParams()
      if (filters.schoolId && filters.schoolId !== 'all') params.set('schoolId', filters.schoolId)
      if (filters.courseId && filters.courseId !== 'all') params.set('courseId', filters.courseId)
      if (filters.grade && filters.grade !== 'all') params.set('academicGrade', filters.grade)
      if (filters.competencyId && filters.competencyId !== 'all') params.set('competencyId', filters.competencyId)
      if (filters.minAge) params.set('minAge', filters.minAge)
      if (filters.maxAge) params.set('maxAge', filters.maxAge)
      if (filters.gender && filters.gender !== 'all') params.set('gender', filters.gender)
      if (filters.socioeconomicStratum && filters.socioeconomicStratum !== 'all') params.set('socioeconomicStratum', filters.socioeconomicStratum)

      // Para school_admin, forzar el filtro por su colegio
      if (session.user.role === 'school_admin' && session.user.schoolId) {
        params.set('schoolId', session.user.schoolId)
      }

      // Fetch KPIs
      const kpisResponse = await fetch(`/api/reports/summary?${params.toString()}`)
      const kpisData = kpisResponse.ok ? await kpisResponse.json() : null

      // Fetch Engagement Metrics
      const engagementResponse = await fetch(`/api/analytics/engagement?${params.toString()}`)
      const engagementData = engagementResponse.ok ? await engagementResponse.json() : null

      // Fetch Grade Analytics
      const gradesResponse = await fetch(`/api/analytics/grades?${params.toString()}`)
      const gradesData = gradesResponse.ok ? await gradesResponse.json() : null

      // Fetch Competency Reports
      const competencyResponse = await fetch(`/api/reports/competencies?${params.toString()}`)
      const competencyData = competencyResponse.ok ? await competencyResponse.json() : null

      // Transformar hourly para que coincida con el formato esperado por el componente
      const transformedHourly = (gradesData?.hourly || []).map((h: any) => ({
        hora: h.hour,
        estudiantes: h.count
      }))

      const newData: AnalyticsData = {
        kpis: kpisData || null,
        engagementMetrics: engagementData || null,
        gradeSeries: gradesData?.series || [],
        gradeDistribution: gradesData?.distribution || [],
        hourlyActivity: transformedHourly,
        schoolRanking: gradesData?.ranking || [],
        reportRows: competencyData?.rows || [],
        compReportRows: competencyData?.compRows || [],
        reportSeries: gradesData?.series || [],
        reportDistribution: gradesData?.distribution || [],
        loading: false,
        error: null
      }
      
      setData(newData)
      setAnalyticsCacheEntry(cacheKey, newData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cargar los datos de analytics'
      }))
    }
  }, [session?.user])

  useEffect(() => {
    // Only fetch once on mount if we haven't fetched yet
    if (session?.user && !hasFetchedRef.current) {
      hasFetchedRef.current = true
      fetchAnalytics({}, { skipCache: false })
    }
  }, [session?.user?.id, fetchAnalytics]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...data,
    refetch: (filters?: AnalyticsFilters) => fetchAnalytics(filters || {}, { skipCache: true })
  }
}
