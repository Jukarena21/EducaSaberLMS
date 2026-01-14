import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import { AchievementService } from '@/lib/achievementService'
import Handlebars from 'handlebars'

// Función para convertir logo de EducaSaber a base64
function getCompanyLogoBase64(): string {
  try {
    const companyLogoPath = path.join(process.cwd(), 'public', 'logo-educasaber.png')
    if (fs.existsSync(companyLogoPath)) {
      const companyLogoBuffer = fs.readFileSync(companyLogoPath)
      return `data:image/png;base64,${companyLogoBuffer.toString('base64')}`
    }
  } catch (error) {
    console.warn('No se pudo cargar el logo de EducaSaber (informe completo)')
  }
  return 'https://via.placeholder.com/200x80/3b82f6/ffffff?text=EducaSaber'
}

// Función para convertir logo de escuela a base64
function getSchoolLogoBase64(logoUrl?: string | null): string {
  try {
    if (logoUrl) {
      // Si es una URL completa, usarla directamente
      if (logoUrl.startsWith('http')) {
        return logoUrl
      } else {
        const schoolLogoPath = path.join(process.cwd(), 'public', logoUrl)
        if (fs.existsSync(schoolLogoPath)) {
          const schoolLogoBuffer = fs.readFileSync(schoolLogoPath)
          return `data:image/png;base64,${schoolLogoBuffer.toString('base64')}`
        }
      }
    }
  } catch (error) {
    console.warn('No se pudo cargar el logo de la escuela (informe completo)')
  }
  return 'https://via.placeholder.com/200x80/ef4444/ffffff?text=Escuela'
}

// Función para obtener el icono del logro
function getAchievementIcon(iconName: string): string {
  const iconMap: { [key: string]: string } = {
    trophy: '🏆',
    star: '⭐',
    medal: '🥇',
    award: '🏅',
    crown: '👑',
    flame: '🔥',
    zap: '⚡',
    book: '📚',
    clock: '⏰',
    target: '🎯',
    trending: '📈',
    calendar: '📅',
    check: '✅'
  }
  return iconMap[iconName] || '🏆'
}

// Función para generar recomendaciones personalizadas
function generateRecommendations(coursesData: any[], competenciesData: any[], averageProgress: number): string[] {
  const recommendations: string[] = []
  
  if (averageProgress < 30) {
    recommendations.push('Considera dedicar más tiempo diario al estudio para mejorar tu progreso general')
    recommendations.push('Revisa las lecciones pendientes y establece un horario de estudio regular')
  } else if (averageProgress < 60) {
    recommendations.push('Mantén el ritmo actual y considera aumentar gradualmente el tiempo de estudio')
    recommendations.push('Enfócate en completar las lecciones de las competencias con menor progreso')
  } else if (averageProgress < 80) {
    recommendations.push('Excelente progreso, continúa con la misma dedicación')
    recommendations.push('Considera revisar las lecciones completadas para reforzar el aprendizaje')
  } else {
    recommendations.push('Progreso sobresaliente, mantén este excelente nivel')
    recommendations.push('Considera explorar contenido adicional o avanzado')
  }
  
  // Recomendaciones específicas por competencia
  const lowProgressCompetencies = competenciesData.filter(c => c.progressPercentage < 50)
  if (lowProgressCompetencies.length > 0) {
    recommendations.push(`Enfócate especialmente en ${lowProgressCompetencies[0].displayName} para mejorar tu progreso`)
  }
  
  // Recomendaciones por tiempo invertido
  const totalTime = coursesData.reduce((acc, c) => acc + (c.timeSpentMinutes || 0), 0)
  if (totalTime < 60) {
    recommendations.push('Considera aumentar el tiempo de estudio para optimizar tu aprendizaje')
  }
  
  return recommendations.slice(0, 6) // Máximo 6 recomendaciones
}

// Funciones auxiliares para el formato ICFES
function getCompetencyScore(competencies: any[], competencyName: string): number {
  const competency = competencies.find(c => c.displayName?.includes(competencyName))
  const score = competency ? Math.round(competency.progressPercentage || 0) : 0
  // Asegurar altura mínima visible (15% mínimo para que se vea bien la barra)
  return Math.max(15, score)
}

function calculateStemScore(competencies: any[]): number {
  const math = competencies.find(c => c.displayName?.includes('Matemáticas'))
  const science = competencies.find(c => c.displayName?.includes('Ciencias Naturales'))
  
  if (math && science) {
    const score = Math.round((math.progressPercentage + science.progressPercentage) / 2)
    return Math.max(15, score) // Altura mínima visible
  }
  return 15 // Altura mínima cuando no hay datos
}

function calculateElaScore(competencies: any[]): number {
  const reading = competencies.find(c => c.displayName?.includes('Lectura Crítica'))
  const english = competencies.find(c => c.displayName?.includes('Inglés'))
  const social = competencies.find(c => c.displayName?.includes('Ciencias Sociales y Ciudadanas'))
  
  const scores = [reading, english, social].filter(Boolean).map(c => c.progressPercentage)
  if (scores.length > 0) {
    const score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    return Math.max(15, score) // Altura mínima visible
  }
  return 15 // Altura mínima cuando no hay datos
}

/**
 * Calcula el puntaje ICFES basado en respuestas individuales a preguntas
 * Solo considera exámenes completos (simulacro_completo) y de diagnóstico
 */
async function calculateIcfesScoreFromQuestions(userId: string): Promise<number> {
  const { prisma } = await import('@/lib/prisma')
  
  try {
    // 1. Cargar todas las respuestas de exámenes ICFES (simulacro_completo y diagnostico)
    // IMPORTANTE: Solo considerar exámenes marcados como ICFES (isIcfesExam = true)
    // Los cursos personalizados para empresas NO deben usar este cálculo
    const allAnswers = await prisma.examQuestionAnswer.findMany({
      where: { 
        userId,
        examResult: {
          exam: {
            examType: {
              in: ['simulacro_completo', 'diagnostico']
            },
            isIcfesExam: true // SOLO exámenes ICFES
          }
        }
      },
      include: {
        question: {
          include: {
            exam: {
              include: {
                competency: true,
                course: {
                  include: {
                    competency: true
                  }
                }
              }
            },
            lesson: {
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
    }) as any[] // Type assertion para evitar errores de tipo con Prisma
    
    if (allAnswers.length === 0) {
      // No hay exámenes completos, retornar 0
      return 0
    }
    
    // 2. Pesos por competencia (ICFES real)
    // Mapeo de nombres de competencias a pesos ICFES
    const competencyWeights: Record<string, number> = {
      // Competencias ICFES principales (5 competencias)
      'razonamiento_cuantitativo': 0.25, // Matemáticas/Razonamiento Cuantitativo
      'matematicas': 0.25, // Alias para compatibilidad
      'lectura_critica': 0.25,
      'ciencias_naturales': 0.20,
      'competencias_ciudadanas': 0.15, // Sociales y Ciudadanas
      'sociales_y_ciudadanas': 0.15, // Alias para compatibilidad
      'sociales': 0.15, // Alias alternativo
      'ingles': 0.15,
      // Comunicación Escrita no está en el ICFES tradicional, pero puede estar en el sistema
      'comunicacion_escrita': 0.0 // No se incluye en cálculo ICFES estándar
    }
    
    // 3. Pesos por dificultad
    const difficultyWeights: Record<string, number> = {
      'facil': 0.7,
      'intermedio': 1.0,
      'dificil': 1.5
    }
    
    // 4. Calcular recencia (ajustado para preICFES 3-4 meses)
    // El más reciente tiene peso 1.0 (baseline), los anteriores tienen menos peso
    const now = new Date()
    const getRecencyFactor = (completedAt: Date | null): number => {
      if (!completedAt) return 1.0
      const daysDiff = (now.getTime() - new Date(completedAt).getTime()) / (1000 * 60 * 60 * 24)
      if (daysDiff <= 30) return 1.0      // Más reciente (0-30 días): peso completo
      if (daysDiff <= 60) return 0.9       // 1-2 meses: ligeramente menos relevante
      if (daysDiff <= 90) return 0.8       // 2-3 meses: menos relevante
      if (daysDiff <= 120) return 0.7      // 3-4 meses: proceso completo, pero menos peso
      if (daysDiff <= 180) return 0.6      // 4-6 meses: poco relevante
      if (daysDiff <= 365) return 0.5      // 6-12 meses: muy poco relevante
      return 0.3                            // Más de 12 meses: casi sin relevancia
    }
    
    // 5. Factor de tiempo
    const getTimeFactor = (timeSpentSeconds: number | null): number => {
      if (!timeSpentSeconds) return 1.0
      if (timeSpentSeconds < 5) return 0.8      // Muy rápido, posible al azar
      if (timeSpentSeconds < 30) return 1.0     // Normal
      return 1.1                                 // Reflexión profunda
    }
    
    // 6. Agrupar por competencia
    const competencyScores: Record<string, { 
      obtained: number
      maxPossible: number
      competencyName: string
    }> = {}
    
    for (const answer of allAnswers) {
      // Obtener competencia desde la lección (prioridad) o desde el examen/curso
      let competencyId: string | null = null
      let competencyName: string | null = null
      
      // Prioridad 1: Competencia desde la lección (más precisa para simulacros completos)
      if (answer.question?.lesson?.competencyId && answer.question?.lesson?.competency) {
        competencyId = answer.question.lesson.competencyId
        competencyName = answer.question.lesson.competency.name.toLowerCase().replace(/\s+/g, '_')
      }
      // Prioridad 2: Competencia directa del examen
      else if (answer.question?.exam?.competencyId && answer.question?.exam?.competency) {
        competencyId = answer.question.exam.competencyId
        competencyName = answer.question.exam.competency.name.toLowerCase().replace(/\s+/g, '_')
      }
      // Prioridad 3: Competencia desde el curso del examen
      else if (answer.question?.exam?.course?.competencyId && answer.question?.exam?.course?.competency) {
        competencyId = answer.question.exam.course.competencyId
        competencyName = answer.question.exam.course.competency.name.toLowerCase().replace(/\s+/g, '_')
      }
      
      // Si no se pudo obtener competencia, saltar esta respuesta
      if (!competencyId || !competencyName) continue
      
      const isCorrect = answer.isCorrect === true
      
      // Calcular factores
      const baseScore = isCorrect ? 1 : 0
      const difficultyWeight = difficultyWeights[answer.question.difficultyLevel] || 1.0
      const timeFactor = getTimeFactor(answer.timeSpentSeconds)
      const recencyFactor = getRecencyFactor(answer.examResult.completedAt)
      
      // Puntaje de esta pregunta
      const questionScore = baseScore * difficultyWeight * timeFactor * recencyFactor
      const maxQuestionScore = difficultyWeight * timeFactor * recencyFactor
      
      // Acumular por competencia
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
    
    // 7. Calcular score ponderado por competencia
    let weightedSum = 0
    let totalWeight = 0
    
    for (const [competencyId, scores] of Object.entries(competencyScores)) {
      if (scores.maxPossible === 0) continue
      
      // Calcular porcentaje de la competencia
      const competencyPercentage = (scores.obtained / scores.maxPossible) * 100
      
      // Obtener peso según nombre de competencia
      const weight = competencyWeights[scores.competencyName] || 0.20
      
      weightedSum += competencyPercentage * weight
      totalWeight += weight
    }
    
    // 8. Si no hay datos suficientes, retornar 0
    if (totalWeight === 0) return 0
    
    // 9. Normalizar y convertir a escala ICFES (0-500)
    const normalizedScore = weightedSum / totalWeight
    return Math.max(0, Math.min(500, Math.round(normalizedScore * 5)))
  } catch (error) {
    console.error('Error calculating ICFES score from questions:', error)
    return 0
  }
}

/**
 * Función legacy: Calcula ICFES basado en progreso promedio (fallback)
 * Se usa cuando no hay exámenes completos disponibles
 */
function calculateIcfesScore(competencies: any[], averageProgress: number): number {
  // Fórmula de estimación ICFES basada en competencias
  // ICFES: 0-500 puntos (escala oficial)
  // Factor de conversión: progreso promedio (0-100%) -> ICFES (0-500 puntos)
  // Progreso 0% = 0 puntos, Progreso 100% = 500 puntos
  const icfesBase = Math.round(averageProgress * 5)
  return Math.max(0, Math.min(500, icfesBase))
}

function calculateIcfesPercentage(averageProgress: number): number {
  // Convertir progreso promedio a porcentaje ICFES (0-500 puntos)
  // Progreso 0% = 0 puntos, Progreso 100% = 500 puntos
  const icfesScore = calculateIcfesScore([], averageProgress)
  return Math.round((icfesScore / 500) * 100)
}

function generateExamHistoryFromResults(examResults: any[], competencyId?: string): any[] {
  // Filtrar resultados por competencia si se especifica
  const filteredResults = competencyId 
    ? examResults.filter(er => er.exam?.competencyId === competencyId)
    : examResults
  
  // Ordenar por fecha de completado
  const sortedResults = filteredResults
    .filter(er => er.completedAt && er.score !== null)
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
  
  if (sortedResults.length === 0) {
    // Si no hay resultados, generar datos de ejemplo basados en el score actual
    return []
  }
  
  // Calcular altura máxima para escalar las barras
  const maxScore = Math.max(...sortedResults.map(er => er.score), 100)
  const maxHeight = 100
  
  return sortedResults.map((result, index) => {
    const score = result.score
    const height = Math.max(8, Math.round((score / maxScore) * maxHeight))
    
    // Calcular tendencia (mejorando, empeorando, estable)
    let trend = 'stable'
    if (index > 0) {
      const previousScore = sortedResults[index - 1].score
      if (score > previousScore + 5) {
        trend = 'improving'
      } else if (score < previousScore - 5) {
        trend = 'declining'
      }
    }
    
    return {
      score: score, // Nota como número (0-100)
      height: height,
      trend: trend,
      date: result.completedAt ? new Date(result.completedAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) : '',
      examTitle: result.exam?.title || 'Examen'
    }
  })
}

function calculateSchoolRank(progressPercentage: number): number {
  // Simulación: estudiantes con buen rendimiento están en percentiles altos
  return Math.round(Math.min(95, Math.max(5, progressPercentage + Math.random() * 10 - 5)))
}

function calculatePlatformRank(progressPercentage: number): number {
  // Simulación: estudiantes activos en la plataforma tienen buen ranking
  return Math.round(Math.min(90, Math.max(10, progressPercentage + Math.random() * 15 - 7)))
}

function generateIcfesComparison(icfesScore: number): string {
  if (icfesScore >= 400) {
    return 'Rendimiento superior al promedio nacional ICFES (400+)'
  } else if (icfesScore >= 350) {
    return 'Rendimiento por encima del promedio nacional ICFES (350-399)'
  } else if (icfesScore >= 300) {
    return 'Rendimiento cercano al promedio nacional ICFES (300-349)'
  } else if (icfesScore >= 250) {
    return 'Rendimiento por debajo del promedio nacional ICFES (250-299)'
  } else if (icfesScore >= 200) {
    return 'Rendimiento bajo, requiere refuerzo para alcanzar el promedio nacional ICFES (200-249)'
  } else {
    return 'Rendimiento muy bajo, requiere refuerzo significativo para alcanzar el promedio nacional ICFES (<200)'
  }
}

function generateStrengths(competencies: any[], averageProgress: number): string[] {
  const strengths: string[] = []
  
  const highPerformers = competencies.filter(c => c.progressPercentage >= 80)
  if (highPerformers.length > 0) {
    strengths.push(`Excelente rendimiento en ${highPerformers.map(c => c.displayName).join(', ')}`)
  }
  
  if (averageProgress >= 80) {
    strengths.push('Progreso general sobresaliente en todas las competencias')
  } else if (averageProgress >= 60) {
    strengths.push('Progreso sólido y consistente en la mayoría de competencias')
  }
  
  const completedLessons = competencies.reduce((acc, c) => acc + (c.completedLessons || 0), 0)
  if (completedLessons > 50) {
    strengths.push('Alto nivel de compromiso con el aprendizaje')
  }
  
  return strengths.slice(0, 4)
}

function generateImprovementAreas(competencies: any[], averageProgress: number): string[] {
  const areas: string[] = []
  
  const lowPerformers = competencies.filter(c => c.progressPercentage < 60)
  if (lowPerformers.length > 0) {
    areas.push(`Necesita refuerzo en ${lowPerformers.map(c => c.displayName).join(', ')}`)
  }
  
  if (averageProgress < 60) {
    areas.push('Requiere mayor dedicación al tiempo de estudio')
  }
  
  const incompleteCompetencies = competencies.filter(c => c.progressPercentage < 70)
  if (incompleteCompetencies.length > 0) {
    areas.push('Algunas competencias no alcanzan el benchmark de preparación')
  }
  
  return areas.slice(0, 4)
}

function generateParentRecommendations(competencies: any[], averageProgress: number): string[] {
  const recommendations: string[] = []
  
  if (averageProgress >= 80) {
    recommendations.push('Mantener el excelente nivel de dedicación y motivación')
    recommendations.push('Considerar actividades de enriquecimiento académico')
  } else if (averageProgress >= 60) {
    recommendations.push('Establecer rutinas de estudio más estructuradas')
    recommendations.push('Monitorear el progreso semanalmente')
  } else {
    recommendations.push('Crear un plan de estudio personalizado con metas específicas')
    recommendations.push('Considerar apoyo adicional en áreas de menor rendimiento')
  }
  
  const lowProgressCompetencies = competencies.filter(c => c.progressPercentage < 60)
  if (lowProgressCompetencies.length > 0) {
    recommendations.push(`Enfocar esfuerzos en ${lowProgressCompetencies[0].displayName}`)
  }
  
  recommendations.push('Mantener comunicación regular con los docentes')
  
  return recommendations.slice(0, 6)
}

function generateAchievements(competencies: any[], averageProgress: number): any[] {
  const achievements = []
  
  // Logros basados en progreso general
  if (averageProgress >= 90) {
    achievements.push({ name: 'Excelencia', icon: '🏆', unlocked: true })
  } else {
    achievements.push({ name: 'Excelencia', icon: '🏆', unlocked: false })
  }
  
  if (averageProgress >= 80) {
    achievements.push({ name: 'Sobresaliente', icon: '⭐', unlocked: true })
  } else {
    achievements.push({ name: 'Sobresaliente', icon: '⭐', unlocked: false })
  }
  
  if (averageProgress >= 70) {
    achievements.push({ name: 'Destacado', icon: '🎯', unlocked: true })
  } else {
    achievements.push({ name: 'Destacado', icon: '🎯', unlocked: false })
  }
  
  // Logros por competencias específicas
  const math = competencies.find(c => c.displayName?.includes('Matemáticas'))
  if (math && math.progressPercentage >= 80) {
    achievements.push({ name: 'Matemático', icon: '📐', unlocked: true })
  } else {
    achievements.push({ name: 'Matemático', icon: '📐', unlocked: false })
  }
  
  const science = competencies.find(c => c.displayName?.includes('Ciencias Naturales'))
  if (science && science.progressPercentage >= 80) {
    achievements.push({ name: 'Científico', icon: '🔬', unlocked: true })
  } else {
    achievements.push({ name: 'Científico', icon: '🔬', unlocked: false })
  }
  
  const reading = competencies.find(c => c.displayName?.includes('Lectura Crítica'))
  if (reading && reading.progressPercentage >= 80) {
    achievements.push({ name: 'Lector', icon: '📚', unlocked: true })
  } else {
    achievements.push({ name: 'Lector', icon: '📚', unlocked: false })
  }
  
  const english = competencies.find(c => c.displayName?.includes('Inglés'))
  if (english && english.progressPercentage >= 80) {
    achievements.push({ name: 'Bilingüe', icon: '🌍', unlocked: true })
  } else {
    achievements.push({ name: 'Bilingüe', icon: '🌍', unlocked: false })
  }
  
  const social = competencies.find(c => c.displayName?.includes('Ciencias Sociales'))
  if (social && social.progressPercentage >= 80) {
    achievements.push({ name: 'Social', icon: '🏛️', unlocked: true })
  } else {
    achievements.push({ name: 'Social', icon: '🏛️', unlocked: false })
  }
  
  // Logros por tiempo de estudio
  const totalTime = competencies.reduce((acc, c) => acc + (c.timeSpentMinutes || 0), 0)
  if (totalTime >= 120) { // 2 horas
    achievements.push({ name: 'Estudioso', icon: '⏰', unlocked: true })
  } else {
    achievements.push({ name: 'Estudioso', icon: '⏰', unlocked: false })
  }
  
  return achievements
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting Puppeteer PDF generation...')
    
    // Verificar autenticación
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener datos del request
    const body = await request.json()
    const { type, competencyId, proposal, coursesData, competenciesData, studentId } = body

    // Determinar el userId: si es admin y se pasa studentId, usar ese; si no, usar el del session
    let userId = session.user.id
    const isAdmin = session.user.role === 'teacher_admin' || session.user.role === 'school_admin'
    
    if (isAdmin && studentId) {
      // Admin generando reporte para otro estudiante
      userId = studentId
      console.log('👤 Admin generating report for student:', userId)
    } else {
      console.log('👤 User ID:', userId)
    }

    console.log('📊 Request data:', {
      type,
      competencyId,
      studentId: studentId || 'none (using session user)',
      coursesDataLength: coursesData?.length,
      competenciesDataLength: competenciesData?.length
    })

    // Obtener información del estudiante
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    const student = await prisma.user.findUnique({
      where: { id: userId },
      include: { school: true }
    })

    if (!student) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
    }

    // Si es admin y el estudiante no pertenece a su colegio, verificar permisos
    if (isAdmin && session.user.role === 'school_admin' && student.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: 'No autorizado para ver este estudiante' }, { status: 403 })
    }

    console.log('✅ Student found:', student.firstName, student.lastName)

    // Determinar si el estudiante es tipo ICFES (basado en si está inscrito en cursos ICFES)
    const initialEnrollmentsForType = await prisma.courseEnrollment.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        course: {
          select: {
            isIcfesCourse: true
          }
        }
      }
    })
    const isIcfesStudentForFilter = initialEnrollmentsForType.some((enrollment: any) => enrollment.course.isIcfesCourse)

    // Competencias ICFES (nombres exactos)
    const ICFES_COMPETENCY_NAMES_FOR_FILTER = [
      'lectura_critica',
      'razonamiento_cuantitativo',
      'competencias_ciudadanas',
      'comunicacion_escrita',
      'ingles',
      // Aliases para compatibilidad
      'matematicas',
      'ciencias_naturales',
      'ciencias_sociales',
      'sociales_y_ciudadanas'
    ]

    // Obtener resultados reales de exámenes por competencia
    console.log('📊 Fetching real exam results...')
    let examResultsWhere: any = { userId }
    
    // Si es estudiante ICFES, filtrar solo exámenes de competencias ICFES
    if (isIcfesStudentForFilter) {
      // Obtener IDs de competencias ICFES
      const icfesCompetencies = await prisma.competency.findMany({
        where: {
          OR: [
            { name: { in: ICFES_COMPETENCY_NAMES_FOR_FILTER } },
            { displayName: { in: ['Lectura Crítica', 'Razonamiento Cuantitativo', 'Competencias Ciudadanas', 'Comunicación Escrita', 'Inglés', 'Matemáticas', 'Ciencias Naturales', 'Ciencias Sociales y Ciudadanas'] } }
          ]
        },
        select: { id: true }
      })
      const icfesCompetencyIds = icfesCompetencies.map(c => c.id)
      
      examResultsWhere.exam = {
        competencyId: { in: icfesCompetencyIds }
      }
    }

    const examResults = await prisma.examResult.findMany({
      where: examResultsWhere,
      include: {
        exam: {
          include: {
            competency: true
          }
        }
      },
      orderBy: { completedAt: 'asc' } // Ordenar por fecha para ver evolución
    })

    // Obtener logros del estudiante
    console.log('🏆 Fetching student achievements...')
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true
      },
      orderBy: { unlockedAt: 'desc' }
    })

    // Obtener todos los logros disponibles para mostrar los no desbloqueados
    const allAchievements = await prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: { points: 'asc' }
    })

    // Crear mapa de logros desbloqueados
    const unlockedAchievementIds = new Set(userAchievements.map(ua => ua.achievementId))

    // Combinar logros con estado de desbloqueo
    const achievementsWithStatus = allAchievements.map(achievement => {
      const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id)
      
      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        iconName: achievement.iconName,
        category: achievement.category,
        points: achievement.points,
        unlocked: unlockedAchievementIds.has(achievement.id),
        unlockedAt: userAchievement?.unlockedAt || null,
        icon: getAchievementIcon(achievement.iconName)
      }
    })

    console.log('🏆 Achievements loaded:', achievementsWithStatus.length)

    // Si no se proporcionan coursesData o competenciesData, obtenerlos de la base de datos
    let finalCoursesData = coursesData
    
    // Determinar si el estudiante es tipo ICFES (basado en si está inscrito en cursos ICFES)
    // Primero obtener los enrollments para determinar el tipo
    const initialEnrollments = await prisma.courseEnrollment.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        course: {
          select: {
            isIcfesCourse: true
          }
        }
      }
    })
    const isIcfesStudent = initialEnrollments.some((enrollment: any) => enrollment.course.isIcfesCourse)

    // Competencias ICFES (nombres exactos)
    const ICFES_COMPETENCY_NAMES = [
      'lectura_critica',
      'razonamiento_cuantitativo',
      'competencias_ciudadanas',
      'comunicacion_escrita',
      'ingles',
      // Aliases para compatibilidad
      'matematicas',
      'ciencias_naturales',
      'ciencias_sociales',
      'sociales_y_ciudadanas'
    ]

    // Filtrar competencias según el tipo de estudiante
    let finalCompetenciesData
    if (competenciesData) {
      // Si vienen del frontend, filtrar según tipo de estudiante
      if (isIcfesStudent) {
        // Solo competencias ICFES
        finalCompetenciesData = competenciesData.filter((c: any) => 
          c.name !== 'otros' && 
          c.displayName !== 'Otros' &&
          (ICFES_COMPETENCY_NAMES.includes(c.name) ||
           ['Lectura Crítica', 'Razonamiento Cuantitativo', 'Competencias Ciudadanas', 'Comunicación Escrita', 'Inglés', 'Matemáticas', 'Ciencias Naturales', 'Ciencias Sociales y Ciudadanas'].includes(c.displayName))
        )
      } else {
        // Excluir competencias ICFES y "otros"
        finalCompetenciesData = competenciesData.filter((c: any) => 
          c.name !== 'otros' && 
          c.displayName !== 'Otros' &&
          !ICFES_COMPETENCY_NAMES.includes(c.name) &&
          !['Lectura Crítica', 'Razonamiento Cuantitativo', 'Competencias Ciudadanas', 'Comunicación Escrita', 'Inglés', 'Matemáticas', 'Ciencias Naturales', 'Ciencias Sociales y Ciudadanas'].includes(c.displayName)
        )
      }
    }
    let courseEnrollments: any[] = []
    let lessonProgress: any[] = []
    let contentProgress: any[] = []

    if (!finalCoursesData || !finalCompetenciesData) {
      console.log('📚 Fetching courses and competencies data from database...')
      
      // Obtener cursos en los que está inscrito el estudiante
      courseEnrollments = await prisma.courseEnrollment.findMany({
        where: { 
          userId,
          isActive: true
        },
        include: {
          course: {
            include: {
              competency: true,
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

      // Obtener progreso de lecciones del estudiante
      lessonProgress = await prisma.studentLessonProgress.findMany({
        where: { userId },
        include: {
          lesson: {
            include: {
              moduleLessons: {
                include: {
                  module: {
                    include: {
                      competency: true
                    }
                  }
                }
              }
            }
          }
        }
      })

      // Obtener progreso de contenido del estudiante
      contentProgress = await prisma.studentLessonProgress.findMany({
        where: { userId },
        include: {
          lesson: {
            include: {
              moduleLessons: {
                include: {
                  module: {
                    include: {
                      competency: true
                    }
                  }
                }
              }
            }
          }
        }
      })

      // Procesar datos para cada curso (si no se proporcionaron)
      if (!finalCoursesData) {
        finalCoursesData = courseEnrollments.map(enrollment => {
          const course = enrollment.course
          const totalLessons = course.courseModules.reduce((acc: number, cm: any) => 
            acc + cm.module.moduleLessons.length, 0
          )
          
          const totalModules = course.courseModules.length
          
          // Calcular lecciones completadas
          const completedLessons = lessonProgress.filter((lp: any) => 
            course.courseModules.some((cm: any) => 
              cm.module.moduleLessons.some((ml: any) => ml.lessonId === lp.lessonId)
            ) && lp.status === 'completed'
          ).length

          // Calcular tiempo total invertido
          const totalTimeMinutes = contentProgress
            .filter((cp: any) => 
              course.courseModules.some((cm: any) => 
                cm.module.moduleLessons.some((ml: any) => ml.lessonId === cp.lessonId)
              )
            )
            .reduce((acc: number, cp: any) => acc + (cp.totalTimeMinutes || 0), 0)

          const progressPercentage = totalLessons > 0 
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0

          return {
            id: course.id,
            title: course.title,
            competencyId: course.competencyId,
            competencyName: course.competency?.name || 'Sin competencia',
            totalLessons,
            completedLessons,
            totalModules,
            progressPercentage,
            timeSpentMinutes: totalTimeMinutes
          }
        })
      }

      // Procesar datos por competencia (si no se proporcionaron)
      if (!finalCompetenciesData) {
        // Determinar si el estudiante es tipo ICFES (basado en si está inscrito en cursos ICFES)
        const isIcfesStudent = courseEnrollments.some((enrollment: any) => enrollment.course.isIcfesCourse)

        // Competencias ICFES (nombres exactos)
        const ICFES_COMPETENCY_NAMES = [
          'lectura_critica',
          'razonamiento_cuantitativo',
          'competencias_ciudadanas',
          'comunicacion_escrita',
          'ingles',
          // Aliases para compatibilidad
          'matematicas',
          'ciencias_naturales',
          'ciencias_sociales',
          'sociales_y_ciudadanas'
        ]

        // Obtener competencias según el tipo de estudiante
        let competencies
        if (isIcfesStudent) {
          // Si es estudiante ICFES, solo mostrar competencias ICFES
          competencies = await prisma.competency.findMany({
            where: {
              OR: [
                { name: { in: ICFES_COMPETENCY_NAMES } },
                { displayName: { in: ['Lectura Crítica', 'Razonamiento Cuantitativo', 'Competencias Ciudadanas', 'Comunicación Escrita', 'Inglés', 'Matemáticas', 'Ciencias Naturales', 'Ciencias Sociales y Ciudadanas'] } }
              ],
              name: { not: 'otros' }
            },
            orderBy: { name: 'asc' }
          })
        } else {
          // Si no es ICFES, mostrar todas excepto ICFES y "otros"
          competencies = await prisma.competency.findMany({
            where: {
              AND: [
                { name: { not: 'otros' } },
                { name: { notIn: ICFES_COMPETENCY_NAMES } },
                { displayName: { notIn: ['Lectura Crítica', 'Razonamiento Cuantitativo', 'Competencias Ciudadanas', 'Comunicación Escrita', 'Inglés', 'Matemáticas', 'Ciencias Naturales', 'Ciencias Sociales y Ciudadanas'] } }
              ]
            },
            orderBy: { name: 'asc' }
          })
        }

        // Obtener resultados de exámenes por competencia
        const competencyExamResults = await prisma.examResult.findMany({
          where: { userId },
          include: {
            exam: {
              include: {
                competency: true
              }
            }
          }
        })

        finalCompetenciesData = competencies.map(competency => {
          // Filtrar resultados de exámenes para esta competencia
          const competencyExams = competencyExamResults.filter(er => 
            er.exam?.competencyId === competency.id
          )

          // Calcular promedio de notas
          const examScores = competencyExams.map(er => er.score)
          const averageScore = examScores.length > 0
            ? Math.round(examScores.reduce((a, b) => a + b, 0) / examScores.length)
            : 0

          // Calcular progreso basado en lecciones completadas
          const competencyLessons = lessonProgress.filter((lp: any) => 
            lp.lesson?.moduleLessons?.some((ml: any) => 
              ml.module?.competencyId === competency.id
            )
          )

          const completedLessons = competencyLessons.filter((lp: any) => lp.status === 'completed').length
          const totalLessons = competencyLessons.length
          const progressPercentage = totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0

          // Calcular tiempo total
          const totalTimeMinutes = contentProgress
            .filter((cp: any) => 
              cp.lesson?.moduleLessons?.some((ml: any) => 
                ml.module?.competencyId === competency.id
              )
            )
            .reduce((acc: number, cp: any) => acc + (cp.totalTimeMinutes || 0), 0)

          return {
            id: competency.id,
            name: competency.name,
            displayName: competency.name,
            averageScore,
            progressPercentage,
            totalExams: competencyExams.length,
            totalTimeMinutes,
            examHistory: competencyExams.map(er => ({
              id: er.id,
              score: er.score,
              completedAt: er.completedAt ? (er.completedAt instanceof Date ? er.completedAt.toISOString() : new Date(er.completedAt).toISOString()) : new Date().toISOString(),
              examTitle: er.exam?.title || 'Examen'
            }))
          }
        })
      }

      console.log('✅ Courses and competencies data loaded:', {
        coursesCount: finalCoursesData.length,
        competenciesCount: finalCompetenciesData.length
      })
    }

    // Calcular métricas generales
    const totalCourses = finalCoursesData?.length || 0
    const totalLessonsCompleted = finalCoursesData?.reduce((acc: number, c: any) => acc + (c.completedLessons || 0), 0) || 0
    const totalTimeSpentMinutes = finalCoursesData?.reduce((acc: number, c: any) => acc + (c.timeSpentMinutes || 0), 0) || 0
    const totalTimeSpent = Math.round(totalTimeSpentMinutes / 60)
    const totalTimeHours = Math.round(totalTimeSpentMinutes / 60 * 10) / 10
    const averageProgress = finalCoursesData?.length > 0 
      ? Math.round(finalCoursesData.reduce((acc: number, c: any) => acc + (c.progressPercentage || 0), 0) / finalCoursesData.length)
      : 0

    // Calcular promedio de exámenes (solo exámenes completados)
    const completedExamResults = examResults.filter(er => er.completedAt !== null)
    const averageExamScore = completedExamResults.length > 0
      ? Math.round(completedExamResults.reduce((acc, er) => {
          const percentage = er.totalQuestions > 0 ? (er.score / er.totalQuestions) * 100 : 0
          return acc + percentage
        }, 0) / completedExamResults.length)
      : 0

    // Preparar datos para la plantilla ICFES (curso = competencia)
    const templateData = {
      studentName: `${student.firstName} ${student.lastName}`,
      schoolName: student.school?.name || 'Institución Educativa',
      generationDate: new Date().toLocaleDateString('es-CO'),
      companyLogo: getCompanyLogoBase64(),
      schoolLogo: getSchoolLogoBase64(student.school?.logoUrl || null),
      
      // Puntuaciones principales
      generalScore: Math.max(0, Math.round(averageProgress)), // Progreso general en cursos
      averageExamScore, // Promedio de todos los exámenes
      totalTimeHours, // Tiempo total en horas
      mathScore: getCompetencyScore(finalCompetenciesData || [], 'Matemáticas') || 0,
      scienceScore: getCompetencyScore(finalCompetenciesData || [], 'Ciencias Naturales') || 0,
      englishScore: getCompetencyScore(finalCompetenciesData || [], 'Inglés') || 0,
      readingScore: getCompetencyScore(finalCompetenciesData || [], 'Lectura Crítica') || 0,
      socialScore: getCompetencyScore(finalCompetenciesData || [], 'Ciencias Sociales y Ciudadanas') || 0,
      icfesScore: await calculateIcfesScoreFromQuestions(userId) || calculateIcfesScore(finalCompetenciesData || [], averageProgress),
      icfesPercentage: calculateIcfesPercentage(averageProgress),
      
      // Benchmarks removidos - usando solo valores reales calculados
      
      // Competencias - Datos resumidos para el informe completo
      competencies: (finalCompetenciesData || []).map((competency: any) => {
        // Filtrar exámenes completados para esta competencia
        const competencyExams = examResults.filter(er => 
          er.exam?.competencyId === competency.id && er.completedAt !== null
        )
        
        // Calcular promedio de exámenes (porcentaje 0-100)
        const examScores = competencyExams.map(er => {
          return er.totalQuestions > 0 ? (er.score / er.totalQuestions) * 100 : 0
        })
        const averageScore = examScores.length > 0
          ? Math.round(examScores.reduce((a, b) => a + b, 0) / examScores.length)
          : 0
        
        // Calcular mejor calificación
        const bestScore = examScores.length > 0
          ? Math.round(Math.max(...examScores))
          : 0
        
        // Obtener historial real de exámenes para esta competencia
        const examHistory = generateExamHistoryFromResults(examResults, competency.id)
        
        // Calcular tendencia general
        let overallTrend: 'improving' | 'declining' | 'stable' = 'stable'
        if (examHistory.length >= 2) {
          const firstScore = examHistory[0].score
          const lastScore = examHistory[examHistory.length - 1].score
          if (lastScore > firstScore + 5) {
            overallTrend = 'improving'
          } else if (lastScore < firstScore - 5) {
            overallTrend = 'declining'
          }
        }
        
        return {
          ...competency,
          averageScore, // Promedio de exámenes como porcentaje (0-100)
          bestScore, // Mejor calificación como porcentaje (0-100)
          score: averageScore, // Para compatibilidad
          progressPercentage: competency.progressPercentage || 0, // Progreso de lecciones como porcentaje
          schoolRank: calculateSchoolRank(averageScore), // Percentil como porcentaje
          platformRank: calculatePlatformRank(averageScore), // Percentil como porcentaje
          timeSpent: Math.round((competency.totalTimeMinutes || 0) / 60),
          examHistory: examHistory,
          overallTrend: overallTrend,
          totalExams: competencyExams.length
        }
      }),
      
      // Cursos - Datos resumidos para el informe completo
      courses: (finalCoursesData || []).map((course: any) => {
        // Si ya tenemos totalModules en el curso, usarlo; si no, calcularlo
        const totalModules = course.totalModules || 0
        
        // Calcular módulos completados basado en lecciones completadas
        // Un módulo está completo si todas sus lecciones están completadas
        let completedModules = 0
        if (courseEnrollments && lessonProgress) {
          const enrollment = courseEnrollments.find((ce: any) => ce.course.id === course.id)
          if (enrollment) {
            const courseModules = enrollment.course?.courseModules || []
            completedModules = courseModules.filter((cm: any) => {
              const moduleLessons = cm.module?.moduleLessons || []
              if (moduleLessons.length === 0) return false
              
              const moduleProgress = lessonProgress.filter((lp: any) =>
                moduleLessons.some((ml: any) => ml.lessonId === lp.lessonId)
              )
              const completed = moduleProgress.filter((lp: any) => 
                lp.status === 'completed' || lp.status === 'completado'
              ).length
              return completed === moduleLessons.length
            }).length
          }
        }
        
        return {
          id: course.id,
          title: course.title,
          competencyName: course.competencyName || 'Sin competencia',
          progressPercentage: course.progressPercentage || 0,
          completedModules: completedModules || 0,
          totalModules: totalModules || 0,
          completedLessons: course.completedLessons || 0,
          totalLessons: course.totalLessons || 0,
          timeSpentHours: Math.round((course.timeSpentMinutes || 0) / 60 * 10) / 10
        }
      }),
      
      // Rankings individuales para clasificaciones
      schoolRankGeneral: calculateSchoolRank(averageProgress),
      schoolRankMath: calculateSchoolRank(getCompetencyScore(finalCompetenciesData || [], 'Matemáticas')),
      schoolRankScience: calculateSchoolRank(getCompetencyScore(finalCompetenciesData || [], 'Ciencias Naturales')),
      schoolRankReading: calculateSchoolRank(getCompetencyScore(finalCompetenciesData || [], 'Lectura Crítica')),
      schoolRankSocial: calculateSchoolRank(getCompetencyScore(finalCompetenciesData || [], 'Ciencias Sociales y Ciudadanas')),
      schoolRankEnglish: calculateSchoolRank(getCompetencyScore(finalCompetenciesData || [], 'Inglés')),
      
      platformRankGeneral: calculatePlatformRank(averageProgress),
      platformRankMath: calculatePlatformRank(getCompetencyScore(finalCompetenciesData || [], 'Matemáticas')),
      platformRankScience: calculatePlatformRank(getCompetencyScore(finalCompetenciesData || [], 'Ciencias Naturales')),
      platformRankReading: calculatePlatformRank(getCompetencyScore(finalCompetenciesData || [], 'Lectura Crítica')),
      platformRankSocial: calculatePlatformRank(getCompetencyScore(finalCompetenciesData || [], 'Ciencias Sociales y Ciudadanas')),
      platformRankEnglish: calculatePlatformRank(getCompetencyScore(finalCompetenciesData || [], 'Inglés')),
      
      // Comparación ICFES - Usar nueva fórmula basada en preguntas
      estimatedIcfesScore: await calculateIcfesScoreFromQuestions(userId) || calculateIcfesScore(finalCompetenciesData || [], averageProgress),
      icfesComparison: generateIcfesComparison(await calculateIcfesScoreFromQuestions(userId) || calculateIcfesScore(finalCompetenciesData || [], averageProgress)),
      
      // Análisis y recomendaciones
      strengths: generateStrengths(finalCompetenciesData || [], averageProgress),
      improvementAreas: generateImprovementAreas(finalCompetenciesData || [], averageProgress),
      parentRecommendations: generateParentRecommendations(finalCompetenciesData || [], averageProgress),
      
      // Logros desbloqueados
      achievements: achievementsWithStatus,
      achievementsUnlocked: achievementsWithStatus.filter(a => a.unlocked).length,
      achievementsTotal: achievementsWithStatus.length,
      achievementsProgress: achievementsWithStatus.length > 0 
        ? Math.round((achievementsWithStatus.filter(a => a.unlocked).length / achievementsWithStatus.length) * 100)
        : 0,
      achievementsMultiple: achievementsWithStatus.filter(a => a.unlocked).length !== 1,
      totalPoints: achievementsWithStatus
        .filter(a => a.unlocked)
        .reduce((total, a) => total + a.points, 0),
      
      // Datos para gráfica radar (3 series: estudiante, colegio, plataforma)
      studentScoresForRadar: (finalCompetenciesData || []).map((comp: any) => {
        const rawScore = comp.averageScore > 0 ? comp.averageScore : Math.max(15, comp.progressPercentage || 0)
        const clampedScore = Math.min(Math.max(rawScore, 0), 100) // Limitar entre 0 y 100
        return {
          id: comp.id,
          score: clampedScore
        }
      }),
      schoolScoresForRadar: (finalCompetenciesData || []).map((comp: any) => {
        // Estimar promedio del colegio basado en el percentil del estudiante
        // Si el estudiante está en percentil 80%, el promedio del colegio sería aproximadamente 5-10 puntos menos
        const studentScore = comp.averageScore > 0 ? comp.averageScore : Math.max(15, comp.progressPercentage || 0)
        const schoolRank = calculateSchoolRank(studentScore)
        // Convertir percentil a nota estimada (percentil 50% = nota promedio, ajustar según percentil)
        const estimatedSchoolAvg = Math.max(30, Math.min(90, studentScore - (100 - schoolRank) * 0.3))
        const clampedScore = Math.min(Math.max(Math.round(estimatedSchoolAvg), 0), 100) // Limitar entre 0 y 100
        return {
          id: comp.id,
          score: clampedScore
        }
      }),
      platformScoresForRadar: (finalCompetenciesData || []).map((comp: any) => {
        // Estimar promedio de la plataforma basado en el percentil del estudiante
        const studentScore = comp.averageScore > 0 ? comp.averageScore : Math.max(15, comp.progressPercentage || 0)
        const platformRank = calculatePlatformRank(studentScore)
        // Convertir percentil a nota estimada
        const estimatedPlatformAvg = Math.max(40, Math.min(85, studentScore - (100 - platformRank) * 0.25))
        const clampedScore = Math.min(Math.max(Math.round(estimatedPlatformAvg), 0), 100) // Limitar entre 0 y 100
        return {
          id: comp.id,
          score: clampedScore
        }
      })
    }

    console.log('📄 Template data prepared:', {
      studentName: templateData.studentName,
      totalCourses,
      totalLessonsCompleted,
      totalTimeSpent,
      averageProgress,
      competenciesCount: templateData.competencies.length
    })

    // Usar siempre la propuesta 1 (Dashboard Moderno)
    const templateFileName = 'progress-report-proposal-1.html'
    
    // Leer plantilla HTML
    const templatePath = path.join(process.cwd(), 'templates', templateFileName)
    const templateContent = fs.readFileSync(templatePath, 'utf8')

    // Registrar helpers necesarios para Handlebars
    Handlebars.registerHelper('gte', function(a: number, b: number) {
      return a >= b
    })
    
    Handlebars.registerHelper('gt', function(a: number, b: number) {
      return a > b
    })
    
    Handlebars.registerHelper('lt', function(a: number, b: number) {
      return a < b
    })
    
    Handlebars.registerHelper('eq', function(a: any, b: any) {
      return a === b
    })
    
    // Helper para generar gráfica de control (p-chart) en SVG con promedios del colegio y plataforma
    Handlebars.registerHelper('controlChart', function(...args: any[]) {
      // Handlebars pasa los argumentos de forma especial, el último es el contexto
      const options = args[args.length - 1]
      const examHistory = args[0]
      const competencyName = args[1] || ''
      const competencyId = args[2] || ''
      const schoolScores = args[3]
      const platformScores = args[4]
      
      if (!examHistory || !Array.isArray(examHistory) || examHistory.length === 0) return ''
      
      const scores = examHistory.map((e: any) => e.score)
      const mean = scores.reduce((a: number, b: number) => a + b, 0) / scores.length
      
      // Obtener promedios del colegio y plataforma para esta competencia (con validación robusta)
      const schoolScoresArray = Array.isArray(schoolScores) ? schoolScores : []
      const platformScoresArray = Array.isArray(platformScores) ? platformScores : []
      const schoolAvg = schoolScoresArray.find((s: any) => s && s.id === competencyId)?.score || 0
      const platformAvg = platformScoresArray.find((s: any) => s && s.id === competencyId)?.score || 0
      
      const width = 600
      const height = 200
      const padding = { top: 40, right: 120, bottom: 40, left: 50 }
      const chartWidth = width - padding.left - padding.right
      const chartHeight = height - padding.top - padding.bottom
      
      // Asegurar un rango mínimo para visualización
      const maxValue = Math.max(...scores, schoolAvg, platformAvg, mean, 100)
      const minValue = Math.min(...scores, schoolAvg, platformAvg, mean, 0)
      const range = Math.max(maxValue - minValue, 30) // Mínimo 30 puntos de rango
      
      const scaleX = (index: number) => {
        if (scores.length === 1) return padding.left + chartWidth / 2
        return padding.left + (index / (scores.length - 1)) * chartWidth
      }
      const scaleY = (value: number) => padding.top + chartHeight - ((value - minValue) / range) * chartHeight
      
      // Generar puntos de la línea de datos
      let dataPoints = ''
      let points = ''
      scores.forEach((score, index) => {
        const x = scaleX(index)
        const y = scaleY(score)
        if (index === 0) {
          dataPoints += `M ${x} ${y} `
        } else {
          dataPoints += `L ${x} ${y} `
        }
        // Puntos más grandes y visibles
        points += `<circle cx="${x}" cy="${y}" r="5" fill="#3b82f6" stroke="white" stroke-width="2"/>`
        // Etiqueta del valor (ajustar posición para evitar superposición)
        const labelOffset = Math.abs(score - mean) < 3 ? (score > mean ? -12 : 12) : -8
        points += `<text x="${x}" y="${y + labelOffset}" text-anchor="middle" font-size="9" font-weight="bold" fill="#1f2937">${score}</text>`
      })
      
      // Líneas de referencia (ajustar posición si coinciden con puntos)
      const meanY = scaleY(mean)
      const schoolAvgY = scaleY(schoolAvg)
      const platformAvgY = scaleY(platformAvg)
      
      // Verificar si alguna línea está muy cerca de un punto de datos
      const tolerance = 5 // píxeles
      let meanOffset = 0
      let schoolOffset = 0
      let platformOffset = 0
      
      scores.forEach((score) => {
        const scoreY = scaleY(score)
        if (Math.abs(scoreY - meanY) < tolerance) meanOffset = score > mean ? -2 : 2
        if (Math.abs(scoreY - schoolAvgY) < tolerance) schoolOffset = -2
        if (Math.abs(scoreY - platformAvgY) < tolerance) platformOffset = 2
      })
      
      // Calcular valores para el eje Y (ajustar según el rango real)
      const yAxisValues: number[] = []
      const step = Math.ceil(range / 4)
      for (let i = Math.floor(minValue / step) * step; i <= maxValue; i += step) {
        if (i >= minValue && i <= maxValue) {
          yAxisValues.push(i)
        }
      }
      if (yAxisValues.length < 3) {
        yAxisValues.length = 0
        yAxisValues.push(Math.floor(minValue), Math.floor((minValue + maxValue) / 2), Math.ceil(maxValue))
      }
      
      return `
        <svg width="${width}" height="${height}" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px;">
          <!-- Grid horizontal -->
          ${yAxisValues.map(val => {
            const y = scaleY(val)
            return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e5e7eb" stroke-width="0.5" stroke-dasharray="2,2"/>`
          }).join('')}
          
          <!-- Líneas de referencia PRIMERO (para que queden detrás de los puntos) -->
          <line x1="${padding.left}" y1="${meanY + meanOffset}" x2="${width - padding.right}" y2="${meanY + meanOffset}" stroke="#92400e" stroke-width="2" stroke-dasharray="4,2" opacity="0.8"/>
          <line x1="${padding.left}" y1="${schoolAvgY + schoolOffset}" x2="${width - padding.right}" y2="${schoolAvgY + schoolOffset}" stroke="#f97316" stroke-width="2" stroke-dasharray="3,3" opacity="0.8"/>
          <line x1="${padding.left}" y1="${platformAvgY + platformOffset}" x2="${width - padding.right}" y2="${platformAvgY + platformOffset}" stroke="#10b981" stroke-width="2" stroke-dasharray="4,2" opacity="0.8"/>
          
          <!-- Línea de datos -->
          ${scores.length > 1 ? `<path d="${dataPoints}" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
          ${points}
          
          <!-- Etiquetas de líneas de referencia (a la derecha) -->
          <g transform="translate(${width - padding.right + 10}, 0)">
            <text y="${meanY + meanOffset + 4}" font-size="9" fill="#92400e" font-weight="bold">Tu Promedio: ${mean.toFixed(1)}</text>
            <text y="${schoolAvgY + schoolOffset + 4}" font-size="9" fill="#f97316" font-weight="bold">Promedio Colegio: ${schoolAvg.toFixed(1)}</text>
            <text y="${platformAvgY + platformOffset + 4}" font-size="9" fill="#10b981" font-weight="bold">Promedio Plataforma: ${platformAvg.toFixed(1)}</text>
          </g>
          
          <!-- Eje X -->
          <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#374151" stroke-width="1.5"/>
          ${scores.map((_, index) => {
            const x = scaleX(index)
            return `<text x="${x}" y="${height - padding.bottom + 15}" text-anchor="middle" font-size="8" fill="#6b7280" font-weight="500">${index + 1}</text>`
          }).join('')}
          <text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-size="9" fill="#6b7280" font-weight="bold">Número de Examen</text>
          
          <!-- Eje Y -->
          <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#374151" stroke-width="1.5"/>
          ${yAxisValues.map(val => {
            const y = scaleY(val)
            return `<text x="${padding.left - 8}" y="${y + 3}" text-anchor="end" font-size="8" fill="#6b7280" font-weight="500">${Math.round(val)}</text>`
          }).join('')}
          <text x="15" y="${height / 2}" text-anchor="middle" font-size="9" fill="#6b7280" font-weight="bold" transform="rotate(-90, 15, ${height / 2})">Nota</text>
          
          <!-- Título -->
          <text x="${width / 2}" y="25" text-anchor="middle" font-size="12" font-weight="bold" fill="#1f2937">${competencyName} - Evolución de Notas</text>
        </svg>
      `
    })
    
    // Helper para generar gráfica radar en SVG con 3 series
    Handlebars.registerHelper('radarChart', function(competencies: any[], studentScores: any[], schoolScores: any[], platformScores: any[]) {
      if (!competencies || competencies.length === 0) return ''
      
      
      // Mantener tamaño original
      const svgWidth = 500
      const svgHeight = 500
      const centerX = svgWidth / 2
      const centerY = svgHeight / 2
      const radius = 180
      const numAxes = competencies.length
      const angleStep = (2 * Math.PI) / numAxes
      
      const maxValue = 100 // Valor máximo fijo para la escala
      
      // Calcular puntos para cada eje
      const getPoint = (index: number, value: number) => {
        // Limitar el valor a un máximo de 100 para que no se salga del gráfico
        const clampedValue = Math.min(Math.max(value, 0), maxValue)
        const angle = (index * angleStep) - (Math.PI / 2) // Empezar desde arriba
        const distance = (clampedValue / maxValue) * radius
        return {
          x: centerX + distance * Math.cos(angle),
          y: centerY + distance * Math.sin(angle)
        }
      }
      
      // Generar polígono para estudiante (azul)
      let studentPath = ''
      competencies.forEach((comp, index) => {
        const score = studentScores.find((s: any) => s.id === comp.id)?.score || comp.score || 0
        const point = getPoint(index, score)
        if (index === 0) {
          studentPath += `M ${point.x} ${point.y} `
        } else {
          studentPath += `L ${point.x} ${point.y} `
        }
      })
      studentPath += 'Z'
      
      // Generar polígono para promedio colegio (naranja)
      let schoolPath = ''
      competencies.forEach((comp, index) => {
        const schoolScore = schoolScores.find((s: any) => s.id === comp.id)?.score || 0
        const point = getPoint(index, schoolScore)
        if (index === 0) {
          schoolPath += `M ${point.x} ${point.y} `
        } else {
          schoolPath += `L ${point.x} ${point.y} `
        }
      })
      schoolPath += 'Z'
      
      // Generar polígono para promedio plataforma (verde)
      let platformPath = ''
      competencies.forEach((comp, index) => {
        const platformScore = platformScores.find((s: any) => s.id === comp.id)?.score || 0
        const point = getPoint(index, platformScore)
        if (index === 0) {
          platformPath += `M ${point.x} ${point.y} `
        } else {
          platformPath += `L ${point.x} ${point.y} `
        }
      })
      platformPath += 'Z'
      
      // Generar ejes y etiquetas
      let axes = ''
      let labels = ''
      competencies.forEach((comp, index) => {
        const angle = (index * angleStep) - (Math.PI / 2)
        const endX = centerX + radius * Math.cos(angle)
        const endY = centerY + radius * Math.sin(angle)
        
        // Línea del eje
        axes += `<line x1="${centerX}" y1="${centerY}" x2="${endX}" y2="${endY}" stroke="#e5e7eb" stroke-width="1"/>`
        
        // Círculos concéntricos con valores
        for (let i = 1; i <= 4; i++) {
          const r = (radius / 4) * i
          const value = (100 / 4) * i // 25, 50, 75, 100
          axes += `<circle cx="${centerX}" cy="${centerY}" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="0.5" stroke-dasharray="2,2"/>`
          // Etiqueta del valor en el círculo (solo en el primer eje para no saturar)
          if (index === 0) {
            const labelX = centerX + r * Math.cos(-Math.PI / 2)
            const labelY = centerY + r * Math.sin(-Math.PI / 2) + 4
            axes += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="8" fill="#9ca3af" font-weight="500">${value}</text>`
          }
        }
        
        // Etiqueta de la competencia
        const labelX = centerX + (radius + 25) * Math.cos(angle)
        const labelY = centerY + (radius + 25) * Math.sin(angle)
        labels += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="10" font-weight="bold" fill="#374151">${comp.displayName || comp.name}</text>`
      })
      
      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; max-width: 100%; height: auto; overflow: hidden;">
          <defs>
            <clipPath id="chartClip">
              <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}"/>
            </clipPath>
          </defs>
          <g clip-path="url(#chartClip)">
            ${axes}
            <!-- Polígono plataforma (verde) - primero para que quede atrás -->
            <path d="${platformPath}" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="2" stroke-dasharray="4,2"/>
            <!-- Polígono colegio (naranja) -->
            <path d="${schoolPath}" fill="rgba(249, 115, 22, 0.2)" stroke="#f97316" stroke-width="2" stroke-dasharray="3,3"/>
            <!-- Polígono estudiante (azul) - último para que quede adelante -->
            <path d="${studentPath}" fill="rgba(59, 130, 246, 0.3)" stroke="#3b82f6" stroke-width="2.5"/>
            ${labels}
            <!-- Leyenda -->
            <g transform="translate(${svgWidth - 120}, 30)">
              <rect x="0" y="0" width="14" height="14" fill="rgba(59, 130, 246, 0.3)" stroke="#3b82f6" stroke-width="1.5"/>
              <text x="20" y="11" font-size="9" fill="#374151" font-weight="bold">Estudiante</text>
              <rect x="0" y="18" width="14" height="14" fill="rgba(249, 115, 22, 0.2)" stroke="#f97316" stroke-width="1.5" stroke-dasharray="3,3"/>
              <text x="20" y="29" font-size="9" fill="#374151" font-weight="bold">Promedio Colegio</text>
              <rect x="0" y="36" width="14" height="14" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4,2"/>
              <text x="20" y="47" font-size="9" fill="#374151" font-weight="bold">Promedio Plataforma</text>
            </g>
            <!-- Título -->
            <text x="${centerX}" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="#1f2937">Desempeño por Competencia</text>
          </g>
        </svg>
      `
    })

    // Asegurar que los datos para las gráficas estén disponibles en el contexto global
    // Esto permite que los helpers accedan a estos datos incluso si no se pasan directamente
    const templateContext = {
      ...templateData,
      // Asegurar que los arrays estén disponibles
      schoolScoresForRadar: templateData.schoolScoresForRadar || [],
      platformScoresForRadar: templateData.platformScoresForRadar || [],
      studentScoresForRadar: templateData.studentScoresForRadar || []
    }
    
    // Compilar plantilla Handlebars
    const template = Handlebars.compile(templateContent)
    const html = template(templateContext)

    console.log('📝 HTML template compiled')

    // Configurar Puppeteer optimizado
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    })

    const page = await browser.newPage()
    
    // Configurar viewport para A4 (ancho suficiente para la gráfica de 500px + padding)
    await page.setViewport({
      width: 1200, // Ancho mayor para acomodar la gráfica completa
      height: 1600, // Altura mayor para mejor renderizado
      deviceScaleFactor: 1
    })

    // Configurar recursos para mejor rendimiento
    await page.setRequestInterception(true)
    page.on('request', (req) => {
      if (req.resourceType() === 'image' && req.url().includes('placeholder')) {
        req.abort()
      } else {
        req.continue()
      }
    })

    // Cargar HTML
    await page.setContent(html, { waitUntil: 'networkidle0' })

    console.log('🌐 Page loaded successfully')

    // Generar PDF con márgenes optimizados
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.3in',
        right: '0.3in',
        bottom: '0.3in',
        left: '0.3in'
      },
      preferCSSPageSize: true
    })

    await browser.close()

    console.log('✅ PDF generated successfully with Puppeteer')

    // Retornar PDF
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="informe-progreso-${student.firstName}-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    })

  } catch (error: any) {
    console.error('❌ Error generating PDF with Puppeteer:', error)
    console.error('❌ Error stack:', error.stack)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, { status: 500 })
  }
}
