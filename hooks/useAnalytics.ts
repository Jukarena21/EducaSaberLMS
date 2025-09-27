import { useState, useEffect } from 'react'
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

  const fetchAnalytics = async (filters: {
    schoolId?: string
    courseId?: string
    grade?: string
    competencyId?: string
    minAge?: string
    maxAge?: string
  } = {}) => {
    if (!session?.user) return

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

      setData({
        kpis: kpisData,
        engagementMetrics: engagementData,
        gradeSeries: gradesData?.gradeSeries || [],
        gradeDistribution: gradesData?.gradeDistribution || [],
        hourlyActivity: gradesData?.hourlyActivity || [],
        schoolRanking: gradesData?.schoolRanking || [],
        reportRows: competencyData?.rows || [],
        compReportRows: competencyData?.compRows || [],
        reportSeries: gradesData?.reportSeries || [],
        reportDistribution: gradesData?.reportDistribution || [],
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cargar los datos de analytics'
      }))
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchAnalytics()
    }
  }, [session])

  return {
    ...data,
    refetch: fetchAnalytics
  }
}
