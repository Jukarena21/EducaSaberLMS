import { prisma } from '@/lib/prisma'

export interface AchievementCriteria {
  type: string
  value: number
}

export interface AchievementCheckResult {
  shouldUnlock: boolean
  currentValue?: number
  requiredValue?: number
}

export class AchievementService {
  /**
   * Verifica si un usuario debe desbloquear un logro específico
   */
  /**
   * Normaliza el formato de criterios para soportar múltiples formatos
   */
  private static normalizeCriteria(criteria: any): AchievementCriteria {
    // Formato nuevo: { type: 'lessons_completed', value: 1 }
    if (criteria.type && criteria.value !== undefined) {
      return { type: criteria.type, value: criteria.value }
    }

    // Formato antiguo: { lessonsCompleted: 1 }, { examsTaken: 1 }, etc.
    const typeMapping: Record<string, string> = {
      'lessonsCompleted': 'lessons_completed',
      'examsTaken': 'exams_completed', // exams_taken mapea a exams_completed
      'examsPassed': 'exams_passed',
      'examScore': 'exam_score',
      'perfectScore': 'perfect_score',
      'perfectExam': 'perfect_score',
      'studyTimeMinutes': 'study_time_minutes',
      'studyStreak': 'study_streak_days',
      'dailyStudyTime': 'daily_study_time',
      'totalStudyTime': 'study_time_minutes',
      'streakDays': 'study_streak_days',
      'averageScore': 'average_score',
      'courseCompleted': 'course_completed'
    }

    // Buscar en el mapeo
    for (const [oldKey, newType] of Object.entries(typeMapping)) {
      if (criteria[oldKey] !== undefined) {
        console.log(`[Achievements] Mapeando criterio "${oldKey}" (${criteria[oldKey]}) a tipo "${newType}"`)
        return { type: newType, value: criteria[oldKey] }
      }
    }

    // Si no se encuentra ningún formato conocido, intentar usar el primer valor numérico
    const numericKeys = Object.keys(criteria).filter(key => typeof criteria[key] === 'number')
    if (numericKeys.length > 0) {
      const key = numericKeys[0]
      const mappedType = typeMapping[key] || key.toLowerCase()
      console.log(`[Achievements] Usando primer valor numérico "${key}" (${criteria[key]}) mapeado a tipo "${mappedType}"`)
      return { type: mappedType, value: criteria[key] }
    }

    console.error(`[Achievements] Formato de criterio no reconocido: ${JSON.stringify(criteria)}`)
    throw new Error(`Formato de criterio no reconocido: ${JSON.stringify(criteria)}`)
  }

  static async checkAchievement(userId: string, achievementId: string): Promise<AchievementCheckResult> {
    try {
      const achievement = await prisma.achievement.findUnique({
        where: { id: achievementId }
      })

      if (!achievement) {
        console.log(`[Achievements] Logro con ID ${achievementId} no encontrado`)
        return { shouldUnlock: false }
      }

      const rawCriteria = JSON.parse(achievement.criteria)
      console.log(`[Achievements] Verificando logro "${achievement.name}" con criterio raw:`, rawCriteria)
      
      // Normalizar el formato de criterios
      const criteria = this.normalizeCriteria(rawCriteria)
      console.log(`[Achievements] Criterio normalizado:`, criteria)
      
      const currentValue = await this.getCurrentValue(userId, criteria.type)
      
      // Para criterios de tipo 'exam_score', verificar si el mejor score es >= al valor requerido
      // Para otros criterios, verificar si el valor actual es >= al valor requerido
      const shouldUnlock = currentValue >= criteria.value
      
      console.log(`[Achievements] Resultado para "${achievement.name}":`, {
        currentValue,
        requiredValue: criteria.value,
        shouldUnlock
      })
      
      return {
        shouldUnlock,
        currentValue,
        requiredValue: criteria.value
      }
    } catch (error) {
      console.error(`[Achievements] Error checking achievement ${achievementId}:`, error)
      return { shouldUnlock: false }
    }
  }

  /**
   * Obtiene el valor actual para un tipo de criterio específico
   */
  private static async getCurrentValue(userId: string, criteriaType: string): Promise<number> {
    switch (criteriaType) {
      case 'lessons_completed':
        return await this.getLessonsCompleted(userId)
      
      case 'exams_completed':
      case 'exams_taken': // Alias para compatibilidad con seed
        return await this.getExamsCompleted(userId)
      
      case 'exams_passed':
        return await this.getExamsPassed(userId)
      
      case 'perfect_score':
      case 'perfect_exam': // Alias para compatibilidad con seed
        return await this.getPerfectScores(userId)
      
      case 'exam_score':
        return await this.getBestExamScore(userId)
      
      case 'high_scores_streak':
        return await this.getHighScoresStreak(userId)
      
      case 'study_time_minutes':
      case 'total_study_time': // Alias para compatibilidad con seed (en minutos)
        return await this.getStudyTimeMinutes(userId)
      
      case 'daily_study_time':
        return await this.getDailyStudyTime(userId)
      
      case 'study_streak_days':
      case 'streak_days': // Alias para compatibilidad con seed
        return await this.getStudyStreakDays(userId)
      
      case 'average_score':
        return await this.getAverageScore(userId)
      
      case 'improvement_streak':
        return await this.getImprovementStreak(userId)
      
      case 'all_competencies_high':
        return await this.getAllCompetenciesHigh(userId)
      
      case 'course_completed':
        return await this.getCoursesCompleted(userId)
      
      case 'different_competencies':
        return await this.getDifferentCompetencies(userId)
      
      case 'icfes_score':
        return await this.getIcfesScore(userId)
      
      default:
        console.warn(`Unknown criteria type: ${criteriaType}`)
        return 0
    }
  }

  /**
   * Obtiene el número de lecciones completadas por el usuario
   */
  private static async getLessonsCompleted(userId: string): Promise<number> {
    // Buscar lecciones completadas usando ambos valores posibles (por inconsistencia en el schema)
    const count = await prisma.studentLessonProgress.count({
      where: {
        userId,
        OR: [
          { status: 'completed' },
          { status: 'completado' },
          { progressPercentage: { gte: 100 } } // Fallback por si el status no está actualizado
        ]
      }
    })
    return count
  }

  /**
   * Obtiene el número de exámenes completados por el usuario
   */
  private static async getExamsCompleted(userId: string): Promise<number> {
    const count = await prisma.examResult.count({
      where: {
        userId,
        completedAt: { not: null }
      }
    })
    console.log(`[Achievements] getExamsCompleted para usuario ${userId}: ${count} exámenes`)
    return count
  }

  /**
   * Obtiene el número de exámenes aprobados (score >= 60%)
   */
  private static async getExamsPassed(userId: string): Promise<number> {
    const count = await prisma.examResult.count({
      where: {
        userId,
        completedAt: { not: null },
        score: { gte: 60 }
      }
    })
    return count
  }

  /**
   * Obtiene la mejor calificación en un examen
   */
  private static async getBestExamScore(userId: string): Promise<number> {
    const result = await prisma.examResult.findFirst({
      where: {
        userId,
        completedAt: { not: null }
      },
      orderBy: {
        score: 'desc'
      },
      select: {
        score: true
      }
    })
    return result?.score || 0
  }

  /**
   * Obtiene el tiempo de estudio en minutos del día actual
   */
  private static async getDailyStudyTime(userId: string): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const progress = await prisma.studentLessonProgress.findMany({
      where: {
        userId,
        updatedAt: {
          gte: today,
          lt: tomorrow
        }
      },
      select: { totalTimeMinutes: true }
    })

    return progress.reduce((total, p) => total + (p.totalTimeMinutes || 0), 0)
  }

  /**
   * Obtiene el número de calificaciones perfectas (100%)
   */
  private static async getPerfectScores(userId: string): Promise<number> {
    const count = await prisma.examResult.count({
      where: {
        userId,
        completedAt: { not: null },
        score: 100
      }
    })
    return count
  }

  /**
   * Obtiene la racha actual de calificaciones altas (90%+)
   */
  private static async getHighScoresStreak(userId: string): Promise<number> {
    const results = await prisma.examResult.findMany({
      where: {
        userId,
        completedAt: { not: null }
      },
      orderBy: { completedAt: 'desc' },
      take: 10 // Revisar los últimos 10 exámenes
    })

    let streak = 0
    for (const result of results) {
      if (result.score >= 90) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  /**
   * Obtiene el tiempo total de estudio en minutos
   */
  private static async getStudyTimeMinutes(userId: string): Promise<number> {
    const progress = await prisma.studentLessonProgress.findMany({
      where: { userId },
      select: { totalTimeMinutes: true }
    })

    return progress.reduce((total, p) => total + (p.totalTimeMinutes || 0), 0)
  }

  /**
   * Obtiene la racha de días de estudio consecutivos
   */
  private static async getStudyStreakDays(userId: string): Promise<number> {
    // Esta es una implementación simplificada
    // En un sistema real, necesitarías rastrear la actividad diaria
    const recentActivity = await prisma.studentLessonProgress.findMany({
      where: {
        userId,
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
        }
      },
      select: { updatedAt: true },
      orderBy: { updatedAt: 'desc' }
    })

    // Agrupar por día y contar días consecutivos
    const activityByDay = new Set()
    recentActivity.forEach(activity => {
      const day = activity.updatedAt.toISOString().split('T')[0]
      activityByDay.add(day)
    })

    // Calcular racha consecutiva desde hoy hacia atrás
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const dayString = checkDate.toISOString().split('T')[0]
      
      if (activityByDay.has(dayString)) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  /**
   * Obtiene el promedio de calificaciones del usuario
   */
  private static async getAverageScore(userId: string): Promise<number> {
    const result = await prisma.examResult.aggregate({
      where: {
        userId,
        completedAt: { not: null }
      },
      _avg: {
        score: true
      }
    })

    return Math.round(result._avg.score || 0)
  }

  /**
   * Obtiene la racha de mejora en calificaciones
   */
  private static async getImprovementStreak(userId: string): Promise<number> {
    const results = await prisma.examResult.findMany({
      where: {
        userId,
        completedAt: { not: null }
      },
      orderBy: { completedAt: 'desc' },
      take: 10
    })

    let streak = 0
    for (let i = 0; i < results.length - 1; i++) {
      if (results[i].score > results[i + 1].score) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  /**
   * Verifica si todas las competencias tienen calificación alta
   */
  private static async getAllCompetenciesHigh(userId: string): Promise<number> {
    // Obtener el promedio por competencia
    const competencies = await prisma.area.findMany()
    let highCompetencies = 0

    for (const competency of competencies) {
      const avgScore = await prisma.examResult.aggregate({
        where: {
          userId,
          completedAt: { not: null },
          exam: {
            competencyId: competency.id
          }
        },
        _avg: {
          score: true
        }
      })

      if ((avgScore._avg?.score || 0) >= 95) {
        highCompetencies++
      }
    }

    return highCompetencies === competencies.length ? 1 : 0
  }

  /**
   * Obtiene el número de cursos completados
   */
  private static async getCoursesCompleted(userId: string): Promise<number> {
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId, isActive: true },
      include: {
        course: {
          include: {
            courseModules: {
              include: {
                module: {
                  include: {
                    moduleLessons: {
                      include: {
                        lesson: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    let completedCourses = 0

    for (const enrollment of enrollments) {
      // Calcular total de lecciones del curso
      const totalLessons = enrollment.course.courseModules.reduce(
        (total: number, cm: any) => total + (cm.module.moduleLessons?.length || 0), 0
      )

      if (totalLessons === 0) continue

      // Obtener todas las lecciones del curso
      const lessonIds = enrollment.course.courseModules.flatMap(
        (cm: any) => cm.module.moduleLessons?.map((ml: any) => ml.lessonId) || []
      )

      // Contar lecciones completadas
      const completedLessons = await prisma.studentLessonProgress.count({
        where: {
          userId,
          lessonId: { in: lessonIds },
          OR: [
            { status: 'completed' },
            { status: 'completado' },
            { progressPercentage: { gte: 100 } }
          ]
        }
      })

      if (completedLessons >= totalLessons) {
        completedCourses++
      }
    }

    return completedCourses
  }

  /**
   * Obtiene el número de competencias diferentes en las que ha estudiado
   */
  private static async getDifferentCompetencies(userId: string): Promise<number> {
    // Obtener cursos en los que el usuario está inscrito
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId, isActive: true },
      include: {
        course: {
          select: {
            competencyId: true
          }
        }
      }
    })

    // Obtener competencias únicas
    const competencyIds = new Set(
      enrollments.map(e => e.course.competencyId).filter(Boolean)
    )

    return competencyIds.size
  }

  /**
   * Obtiene la puntuación estimada de ICFES
   * Usa la nueva fórmula basada en respuestas individuales a preguntas
   */
  private static async getIcfesScore(userId: string): Promise<number> {
    try {
      // Usar la nueva fórmula basada en preguntas
      // Duplicamos la lógica aquí para evitar dependencias circulares
      const allAnswers = await prisma.examQuestionAnswer.findMany({
        where: { 
          userId,
          examResult: {
            exam: {
              examType: {
                in: ['simulacro_completo', 'diagnostico']
              }
            }
          }
        },
        include: {
          question: {
            include: {
              exam: {
                include: {
                  competency: true
                }
              }
            }
          },
          examResult: {
            include: {
              exam: {
                select: {
                  id: true,
                  examType: true
                }
              }
            }
          }
        }
      }) as any[]
      
      if (allAnswers.length > 0) {
        const competencyWeights: Record<string, number> = {
          'matematicas': 0.25,
          'lectura_critica': 0.25,
          'ciencias_naturales': 0.20,
          'sociales_y_ciudadanas': 0.15,
          'ingles': 0.15
        }
        
        const difficultyWeights: Record<string, number> = {
          'facil': 0.7,
          'intermedio': 1.0,
          'dificil': 1.5
        }
        
        const now = new Date()
        const getRecencyFactor = (completedAt: Date | null): number => {
          if (!completedAt) return 1.0
          const daysDiff = (now.getTime() - new Date(completedAt).getTime()) / (1000 * 60 * 60 * 24)
          if (daysDiff <= 30) return 1.0
          if (daysDiff <= 60) return 0.9
          if (daysDiff <= 90) return 0.8
          if (daysDiff <= 120) return 0.7
          if (daysDiff <= 180) return 0.6
          if (daysDiff <= 365) return 0.5
          return 0.3
        }
        
        const getTimeFactor = (timeSpentSeconds: number | null): number => {
          if (!timeSpentSeconds) return 1.0
          if (timeSpentSeconds < 5) return 0.8
          if (timeSpentSeconds < 30) return 1.0
          return 1.1
        }
        
        const competencyScores: Record<string, { 
          obtained: number
          maxPossible: number
          competencyName: string
        }> = {}
        
        for (const answer of allAnswers) {
          if (!answer.question?.exam?.competencyId || !answer.question?.exam?.competency) continue
          
          const competencyId = answer.question.exam.competencyId
          const competencyName = answer.question.exam.competency.name.toLowerCase().replace(/\s+/g, '_')
          const isCorrect = answer.isCorrect === true
          
          const baseScore = isCorrect ? 1 : 0
          const difficultyWeight = difficultyWeights[answer.question.difficultyLevel] || 1.0
          const timeFactor = getTimeFactor(answer.timeSpentSeconds)
          const recencyFactor = getRecencyFactor(answer.examResult.completedAt)
          
          const questionScore = baseScore * difficultyWeight * timeFactor * recencyFactor
          const maxQuestionScore = difficultyWeight * timeFactor * recencyFactor
          
          if (!competencyScores[competencyId]) {
            competencyScores[competencyId] = {
              obtained: 0,
              maxPossible: 0,
              competencyName
            }
          }
          competencyScores[competencyId].obtained += questionScore
          competencyScores[competencyId].maxPossible += maxQuestionScore
        }
        
        let weightedSum = 0
        let totalWeight = 0
        
        for (const [competencyId, scores] of Object.entries(competencyScores)) {
          if (scores.maxPossible === 0) continue
          
          const competencyPercentage = (scores.obtained / scores.maxPossible) * 100
          const weight = competencyWeights[scores.competencyName] || 0.20
          
          weightedSum += competencyPercentage * weight
          totalWeight += weight
        }
        
        if (totalWeight > 0) {
          const normalizedScore = weightedSum / totalWeight
          return Math.max(0, Math.min(500, Math.round(normalizedScore * 5)))
        }
      }
    } catch (error) {
      console.error('Error using new ICFES formula, falling back to average:', error)
    }
    
    // Fallback: Implementación simplificada - calcular promedio y convertir a escala ICFES
    const avgScore = await this.getAverageScore(userId)
    
    // Conversión simple: 0-100% -> 0-500 puntos ICFES (escala oficial)
    const icfesScore = avgScore * 5
    return Math.round(Math.max(0, Math.min(500, icfesScore)))
  }

  /**
   * Desbloquea un logro para un usuario
   */
  static async unlockAchievement(userId: string, achievementId: string): Promise<boolean> {
    try {
      // Verificar si ya está desbloqueado
      const existing = await prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId
          }
        }
      })

      if (existing) {
        return false // Ya está desbloqueado
      }

      // Obtener información del logro para la notificación
      const achievement = await prisma.achievement.findUnique({
        where: { id: achievementId }
      })

      if (!achievement) {
        console.error(`Achievement ${achievementId} not found`)
        return false
      }

      // Desbloquear el logro
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId,
          unlockedAt: new Date()
        }
      })

      // Crear notificación de logro desbloqueado (expira en 15 días)
      try {
        const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 días
        await prisma.notification.create({
          data: {
            userId,
            type: 'achievement_unlocked',
            title: '¡Logro Desbloqueado! 🎉',
            message: `Has desbloqueado el logro "${achievement.name}": ${achievement.description}`,
            actionUrl: '/estudiante',
            expiresAt,
            metadata: JSON.stringify({
              achievementId: achievement.id,
              achievementName: achievement.name,
              achievementDescription: achievement.description
            })
          }
        })
      } catch (notificationError) {
        console.error('Error creating achievement notification:', notificationError)
        // No fallar el desbloqueo si la notificación falla
      }

      return true
    } catch (error) {
      console.error('Error unlocking achievement:', error)
      return false
    }
  }

  /**
   * Verifica y desbloquea todos los logros posibles para un usuario
   */
  static async checkAndUnlockAllAchievements(userId: string): Promise<string[]> {
    const unlockedAchievements: string[] = []

    try {
      const achievements = await prisma.achievement.findMany({
        where: { isActive: true }
      })

      console.log(`[Achievements] Verificando ${achievements.length} logros para usuario ${userId}`)

      for (const achievement of achievements) {
        // Verificar si ya está desbloqueado para evitar verificaciones innecesarias
        const alreadyUnlocked = await prisma.userAchievement.findUnique({
          where: {
            userId_achievementId: {
              userId,
              achievementId: achievement.id
            }
          }
        })

        if (alreadyUnlocked) {
          console.log(`[Achievements] Logro "${achievement.name}" ya está desbloqueado, saltando`)
          continue // Ya está desbloqueado, saltar
        }

        const checkResult = await this.checkAchievement(userId, achievement.id)
        
        console.log(`[Achievements] Verificando "${achievement.name}":`, {
          criteria: JSON.parse(achievement.criteria),
          currentValue: checkResult.currentValue,
          requiredValue: checkResult.requiredValue,
          shouldUnlock: checkResult.shouldUnlock
        })
        
        if (checkResult.shouldUnlock) {
          console.log(`[Achievements] Desbloqueando logro "${achievement.name}"`)
          const unlocked = await this.unlockAchievement(userId, achievement.id)
          if (unlocked) {
            unlockedAchievements.push(achievement.name)
            console.log(`[Achievements] ✅ Logro "${achievement.name}" desbloqueado exitosamente`)
          } else {
            console.log(`[Achievements] ❌ Error al desbloquear logro "${achievement.name}"`)
          }
        }
      }
    } catch (error) {
      console.error('[Achievements] Error checking achievements:', error)
    }

    console.log(`[Achievements] Total de logros desbloqueados: ${unlockedAchievements.length}`)
    return unlockedAchievements
  }
}