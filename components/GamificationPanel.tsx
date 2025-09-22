"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Trophy, 
  Target, 
  Star, 
  Medal, 
  Award,
  TrendingUp,
  Clock,
  BookOpen,
  Zap,
  Crown,
  Flame,
  Calendar,
  CheckCircle
} from "lucide-react"

interface UserStats {
  totalPoints: number
  level: number
  currentLevelPoints: number
  pointsToNextLevel: number
  totalLessonsCompleted: number
  totalExamsTaken: number
  totalExamsPassed: number
  totalStudyTimeMinutes: number
  currentStreakDays: number
  longestStreakDays: number
  averageExamScore: number
  bestExamScore: number
  totalAchievements: number
}

interface Achievement {
  id: string
  name: string
  description: string
  iconName: string
  category: string
  points: number
  unlockedAt?: string
  isUnlocked: boolean
}


export function GamificationPanel() {
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGamificationData()
  }, [])

  const loadGamificationData = async () => {
    try {
      setLoading(true)
      
      // Cargar estadísticas del usuario
      const statsResponse = await fetch('/api/student/gamification/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setUserStats(statsData)
      }

      // Cargar logros
      const achievementsResponse = await fetch('/api/student/gamification/achievements')
      if (achievementsResponse.ok) {
        const achievementsData = await achievementsResponse.json()
        setAchievements(achievementsData)
      }

    } catch (error) {
      console.error('Error loading gamification data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      trophy: Trophy,
      star: Star,
      medal: Medal,
      award: Award,
      crown: Crown,
      flame: Flame,
      zap: Zap,
      book: BookOpen,
      clock: Clock,
      target: Target,
      trending: TrendingUp,
      calendar: Calendar,
      check: CheckCircle
    }
    const IconComponent = icons[iconName] || Trophy
    return <IconComponent className="h-6 w-6" />
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      lessons: 'bg-blue-100 text-blue-800',
      exams: 'bg-green-100 text-green-800',
      time: 'bg-purple-100 text-purple-800',
      streak: 'bg-orange-100 text-orange-800',
      performance: 'bg-yellow-100 text-yellow-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }


  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando gamificación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-600" />
          Gamificación
        </h2>
        <p className="text-gray-600">
          Completa metas, desbloquea logros y sube de nivel mientras aprendes.
        </p>
      </div>

      {/* User Level & Stats */}
      {userStats && (
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              Nivel {userStats.level} - {userStats.totalPoints} puntos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Level Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progreso al Nivel {userStats.level + 1}</span>
                  <span>{userStats.currentLevelPoints}/{userStats.pointsToNextLevel} puntos</span>
                </div>
                <Progress 
                  value={(userStats.currentLevelPoints / userStats.pointsToNextLevel) * 100} 
                  className="h-3"
                />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-blue-600">{userStats.totalLessonsCompleted}</p>
                  <p className="text-xs text-gray-600">Lecciones</p>
                </div>
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <Target className="h-5 w-5 text-green-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-green-600">{userStats.totalExamsPassed}</p>
                  <p className="text-xs text-gray-600">Exámenes</p>
                </div>
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <Flame className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-orange-600">{userStats.currentStreakDays}</p>
                  <p className="text-xs text-gray-600">Racha</p>
                </div>
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <Trophy className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
                  <p className="text-lg font-bold text-yellow-600">{userStats.totalAchievements}</p>
                  <p className="text-xs text-gray-600">Logros</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements Section */}
      <div className="w-full">

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <Card 
                key={achievement.id} 
                className={`transition-all ${
                  achievement.isUnlocked 
                    ? 'border-yellow-300 bg-yellow-50/50' 
                    : 'border-gray-200 bg-gray-50/50'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      achievement.isUnlocked 
                        ? 'bg-yellow-100 text-yellow-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {getIconComponent(achievement.iconName)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{achievement.name}</h4>
                        <Badge className={getCategoryColor(achievement.category)}>
                          {achievement.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{achievement.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-yellow-600">
                          +{achievement.points} puntos
                        </span>
                        {achievement.isUnlocked && (
                          <Badge variant="secondary" className="text-xs">
                            Desbloqueado
                          </Badge>
                        )}
                      </div>
                      {achievement.unlockedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
