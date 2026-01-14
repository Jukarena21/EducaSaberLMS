"use client"

import { useEffect, useState } from "react"

export interface StudentKpis {
  activeCourses: number
  examCompleted: number
  studyTimeMinutes: number
  averageScore: number // Promedio de puntajes (0-100%)
  icfesScore?: number // Puntaje ICFES (0-500)
}

export interface UpcomingExamItem {
  id?: string
  title?: string
  startAt?: string
  durationMinutes?: number
  competency?: string
  inProgress?: boolean
}

export interface ActivityItem {
  type: string
  title?: string
  score?: number | null
  createdAt?: string
}

export function useStudentDashboard(enabled: boolean = true) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [kpis, setKpis] = useState<StudentKpis | null>(null)
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExamItem[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])

  useEffect(() => {
    const controller = new AbortController()
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/student/dashboard', { signal: controller.signal })
        if (!res.ok) throw new Error('HTTP '+res.status)
        const data = await res.json()
        setKpis(data.kpis || null)
        setUpcomingExams(Array.isArray(data.upcomingExams) ? data.upcomingExams : [])
        setRecentActivity(Array.isArray(data.recentActivity) ? data.recentActivity : [])
      } catch (e: any) {
        if (e.name !== 'AbortError') setError('No se pudo cargar el tablero del estudiante')
      } finally {
        setLoading(false)
      }
    }
    if (enabled) fetchData()
    return () => controller.abort()
  }, [enabled])

  return { loading, error, kpis, upcomingExams, recentActivity }
}


