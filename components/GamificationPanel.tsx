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
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  const [checking, setChecking] = useState(false)
  const { toast } = useToast()

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

  const checkForNewAchievements = async () => {
    try {
      setChecking(true)
      const response = await fetch('/api/student/gamification/check-achievements', {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.unlockedAchievements && result.unlockedAchievements.length > 0) {
          // Recargar datos para mostrar los nuevos logros
          await loadGamificationData()
          // Mostrar toast de éxito
          toast({
            title: "¡Felicidades! 🎉",
            description: `Has desbloqueado ${result.unlockedAchievements.length} nuevo(s) logro(s)`,
            variant: "default",
          })
          return result.unlockedAchievements
        } else {
          // No hay logros nuevos
          toast({
            title: "Sin logros nuevos",
            description: "No hay logros nuevos por desbloquear. ¡Sigue avanzando!",
            variant: "default",
          })
        }
      } else {
        toast({
          title: "Error",
          description: "Error al verificar logros. Por favor, intenta de nuevo.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error checking achievements:', error)
      toast({
        title: "Error",
        description: "Error al verificar logros. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setChecking(false)
    }
    return []
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
          <p className="text-gray-600">Cargando logros...</p>
        </div>
      </div>
    )
  }

  const unlockedCount = achievements.filter(a => a.isUnlocked).length
  const totalCount = achievements.length
  const progressPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0

  const getCategoryGradient = (category: string, isUnlocked: boolean) => {
    const gradients: { [key: string]: { unlocked: string, locked: string } } = {
      lessons: {
        unlocked: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
        locked: 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300'
      },
      exams: {
        unlocked: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
        locked: 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300'
      },
      time: {
        unlocked: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200',
        locked: 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300'
      },
      streak: {
        unlocked: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200',
        locked: 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300'
      },
      performance: {
        unlocked: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200',
        locked: 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300'
      }
    }
    
    const categoryGradient = gradients[category] || {
      unlocked: 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200',
      locked: 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300'
    }
    
    return isUnlocked ? categoryGradient.unlocked : categoryGradient.locked
  }

  const getCategoryIconBg = (category: string, isUnlocked: boolean) => {
    const colors: { [key: string]: { unlocked: string, locked: string } } = {
      lessons: {
        unlocked: 'bg-blue-200 text-blue-700',
        locked: 'bg-gray-300 text-gray-500'
      },
      exams: {
        unlocked: 'bg-green-200 text-green-700',
        locked: 'bg-gray-300 text-gray-500'
      },
      time: {
        unlocked: 'bg-purple-200 text-purple-700',
        locked: 'bg-gray-300 text-gray-500'
      },
      streak: {
        unlocked: 'bg-orange-200 text-orange-700',
        locked: 'bg-gray-300 text-gray-500'
      },
      performance: {
        unlocked: 'bg-yellow-200 text-yellow-700',
        locked: 'bg-gray-300 text-gray-500'
      }
    }
    
    const categoryColor = colors[category] || {
      unlocked: 'bg-gray-200 text-gray-400',
      locked: 'bg-gray-300 text-gray-500'
    }
    
    return isUnlocked ? categoryColor.unlocked : categoryColor.locked
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas de logros - 3 tarjetas separadas con tooltips */}
      <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300 rounded-lg cursor-help">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-blue-700">{unlockedCount}</div>
                      <div className="text-sm text-blue-600 font-medium">Desbloqueados</div>
                      <div className="text-xs text-blue-500 mt-1">de {totalCount} logros</div>
                    </div>
                    <div className="p-3 bg-blue-200 rounded-full">
                      <CheckCircle className="h-6 w-6 text-blue-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
              Cantidad de logros que ya has conseguido en la plataforma.{" "}
              Cada logro se desbloquea al cumplir una meta específica de estudio o rendimiento.
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300 rounded-lg cursor-help">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-purple-700">{totalCount - unlockedCount}</div>
                      <div className="text-sm text-purple-600 font-medium">Por Desbloquear</div>
                      <div className="text-xs text-purple-500 mt-1">Sigue avanzando</div>
                    </div>
                    <div className="p-3 bg-purple-200 rounded-full">
                      <Target className="h-6 w-6 text-purple-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
              Logros que todavía no has alcanzado.{" "}
              Te muestran cuánto puedes seguir mejorando en estudio, exámenes y constancia.
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300 rounded-lg cursor-help">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-green-700">{Math.round(progressPercentage)}%</div>
                      <div className="text-sm text-green-600 font-medium">Progreso Total</div>
                      <div className="mt-2">
                        <Progress 
                          value={progressPercentage} 
                          className="h-2 bg-green-200"
                        />
                      </div>
                    </div>
                    <div className="p-3 bg-green-200 rounded-full">
                      <TrendingUp className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs leading-snug">
              Porcentaje de logros desbloqueados frente al total disponible.{" "}
              Te da una idea rápida de qué tan avanzado vas en tu proceso de gamificación.
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Achievements Section */}
      <Card className="w-full shadow-md rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Trophy className="h-6 w-6" />
              <span>Mis Logros</span>
            </CardTitle>
            <Button 
              onClick={checkForNewAchievements}
              variant="outline"
              size="sm"
              disabled={checking}
              className="text-xs hover:bg-blue-50 hover:border-blue-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checking ? 'Verificando...' : 'Verificar Logros'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Lista de logros */}
            {achievements.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay logros disponibles aún.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <Card 
                    key={achievement.id} 
                    className={`transition-all duration-300 rounded-lg border ${
                      achievement.isUnlocked 
                        ? `hover:shadow-lg hover:scale-[1.02] ${getCategoryGradient(achievement.category, achievement.isUnlocked)}`
                        : `opacity-75 grayscale ${getCategoryGradient(achievement.category, achievement.isUnlocked)}`
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full transition-all flex-shrink-0 ${
                          achievement.isUnlocked 
                            ? getCategoryIconBg(achievement.category, achievement.isUnlocked)
                            : 'bg-gray-200 text-gray-400 grayscale'
                        }`}>
                          {getIconComponent(achievement.iconName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className={`font-bold text-base leading-tight ${
                              achievement.isUnlocked ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                              {achievement.name}
                            </h4>
                            {/* Puntos ocultos visualmente pero mantenidos en el código */}
                            <Badge 
                              className={`text-xs font-semibold flex-shrink-0 rounded-full hidden ${
                                achievement.isUnlocked 
                                  ? getCategoryColor(achievement.category)
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                              style={{ display: 'none' }}
                              aria-hidden="true"
                            >
                              {achievement.points} pts
                            </Badge>
                          </div>
                          <p className={`text-sm mb-3 leading-relaxed ${
                            achievement.isUnlocked ? 'text-gray-700' : 'text-gray-400'
                          }`}>
                            {achievement.description}
                          </p>
                          {achievement.isUnlocked && achievement.unlockedAt && (
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <p className="text-xs text-green-700 font-medium">
                                Desbloqueado: {new Date(achievement.unlockedAt).toLocaleDateString('es-ES', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                          )}
                          {!achievement.isUnlocked && (
                            <div className="pt-2">
                              <Badge variant="outline" className="text-xs text-gray-400 border-gray-400 rounded-full bg-gray-50">
                                🔒 Bloqueado
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
