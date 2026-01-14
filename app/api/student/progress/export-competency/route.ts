import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import Handlebars from 'handlebars'
import { prisma } from '@/lib/prisma'

// Función para convertir logo de EducaSaber a base64
function getCompanyLogoBase64(): string {
  try {
    const companyLogoPath = path.join(process.cwd(), 'public', 'logo-educasaber.png')
    if (fs.existsSync(companyLogoPath)) {
      const companyLogoBuffer = fs.readFileSync(companyLogoPath)
      return `data:image/png;base64,${companyLogoBuffer.toString('base64')}`
    }
  } catch (error) {
    console.warn('No se pudo cargar el logo de EducaSaber')
  }
  return 'https://via.placeholder.com/200x80/3b82f6/ffffff?text=EducaSaber'
}

// Función para convertir logo de escuela a base64
function getSchoolLogoBase64(logoUrl?: string | null): string {
  try {
    if (logoUrl) {
      // Si es una URL, intentar descargarla o usar directamente
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
    console.warn('No se pudo cargar el logo de la escuela')
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

// Función para generar análisis y recomendaciones basado SOLO en exámenes
function generateExamBasedAnalysis(
  exams: any[], 
  competencyName: string,
  groupAverageScore?: number
): { strengths: string[], improvements: string[], recommendations: string[] } {
  const strengths: string[] = []
  const improvements: string[] = []
  const recommendations: string[] = []

  if (exams.length === 0) {
    return {
      strengths: ['Aún no has presentado exámenes en esta competencia'],
      improvements: ['Presenta exámenes para evaluar tu conocimiento'],
      recommendations: ['Comienza a presentar exámenes para medir tu progreso']
    }
  }

  // Calcular métricas de exámenes
  const examScores = exams.map(e => e.scorePercentage || 0)
  const averageScore = examScores.reduce((sum, s) => sum + s, 0) / examScores.length
  const bestScore = Math.max(...examScores)
  const worstScore = Math.min(...examScores)
  const passedExams = exams.filter(e => e.isPassed).length
  const passRate = (passedExams / exams.length) * 100

  // Análisis de rendimiento general
  if (averageScore >= 80) {
    strengths.push('Excelente rendimiento promedio en exámenes')
  } else if (averageScore >= 70) {
    strengths.push('Buen rendimiento en exámenes')
  } else if (averageScore < 60) {
    improvements.push('Rendimiento por debajo del nivel esperado')
    recommendations.push('Revisa los temas donde tuviste más dificultades en los exámenes')
  }

  // Análisis de mejor calificación
  if (bestScore >= 90) {
    strengths.push('Capacidad demostrada para alcanzar calificaciones sobresalientes')
  } else if (bestScore >= 80) {
    strengths.push('Has logrado buenas calificaciones en algunos exámenes')
  }

  // Análisis de consistencia
  const scoreVariance = examScores.reduce((sum, s) => sum + Math.pow(s - averageScore, 2), 0) / examScores.length
  if (scoreVariance < 100 && exams.length >= 3) {
    strengths.push('Rendimiento consistente en los exámenes')
  } else if (scoreVariance > 400 && exams.length >= 3) {
    improvements.push('Rendimiento inconsistente entre exámenes')
    recommendations.push('Identifica qué factores influyen en tu rendimiento variable')
  }

  // Análisis de tasa de aprobación
  if (passRate >= 80) {
    strengths.push('Alta tasa de aprobación en exámenes')
  } else if (passRate < 50) {
    improvements.push('Baja tasa de aprobación')
    recommendations.push('Enfócate en mejorar tu preparación antes de presentar exámenes')
  }

  // Análisis de tendencia (mejora o declive)
  if (exams.length >= 3) {
    const recentExams = exams.slice(-3).map(e => e.scorePercentage || 0)
    const olderExams = exams.slice(0, -3).map(e => e.scorePercentage || 0)
    if (olderExams.length > 0) {
      const recentAvg = recentExams.reduce((sum, s) => sum + s, 0) / recentExams.length
      const olderAvg = olderExams.reduce((sum, s) => sum + s, 0) / olderExams.length
      if (recentAvg > olderAvg + 5) {
        strengths.push('Mejora constante en el rendimiento')
      } else if (recentAvg < olderAvg - 5) {
        improvements.push('Disminución en el rendimiento reciente')
        recommendations.push('Revisa qué ha cambiado y ajusta tu estrategia de estudio')
      }
    }
  }

  // Comparación con grupo
  if (groupAverageScore !== undefined) {
    if (averageScore > groupAverageScore + 5) {
      strengths.push(`Rendimiento superior al promedio del grupo (${groupAverageScore}%)`)
    } else if (averageScore < groupAverageScore - 5) {
      improvements.push(`Rendimiento por debajo del promedio del grupo (${groupAverageScore}%)`)
      recommendations.push('Estudia más a fondo los temas evaluados en los exámenes')
    }
  }

  // Recomendaciones específicas por competencia basadas en exámenes
  if (averageScore < 70) {
    switch (competencyName.toLowerCase()) {
      case 'matemáticas':
        recommendations.push('Practica más ejercicios de los temas evaluados en los exámenes')
        break
      case 'lectura crítica':
        recommendations.push('Mejora tu comprensión lectora practicando con textos similares a los del examen')
        break
      case 'ciencias naturales':
        recommendations.push('Refuerza los conceptos científicos evaluados en los exámenes')
        break
      case 'ciencias sociales y ciudadanas':
        recommendations.push('Estudia más a fondo los temas históricos y sociales evaluados')
        break
      case 'inglés':
        recommendations.push('Practica más la comprensión y uso del inglés en contextos similares al examen')
        break
    }
  }

  return {
    strengths: strengths.length > 0 ? strengths : ['Continúa trabajando para mejorar tu rendimiento'],
    improvements: improvements.length > 0 ? improvements : ['Mantén el buen trabajo'],
    recommendations: recommendations.length > 0 ? recommendations : ['Sigue preparándote para los próximos exámenes']
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { competencyId } = await request.json()
    if (!competencyId) {
      return NextResponse.json({ error: 'ID de competencia requerido' }, { status: 400 })
    }

    const userId = session.user.id

    // Obtener información del estudiante y escuela
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Obtener información de la competencia (solo exámenes, no cursos)
    const competency = await prisma.competency.findUnique({
      where: { id: competencyId },
      include: {
        exams: {
          include: {
            examResults: {
              where: { userId }
            }
          }
        }
      }
    })

    if (!competency) {
      console.error('❌ Competency not found:', competencyId)
      return NextResponse.json({ error: 'Competencia no encontrada' }, { status: 404 })
    }

    console.log('✅ Competency found:', competency.name)

    // Obtener logros específicos de la competencia
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true
      }
    })

    const competencyAchievements = await prisma.achievement.findMany({
      where: {
        isActive: true,
        OR: [
          { category: competency.name.toLowerCase() },
          { name: { contains: competency.name } },
          { description: { contains: competency.name } }
        ]
      }
    })

    // Procesar datos de exámenes con porcentajes
    const examsData = competency.exams.flatMap(exam => 
      exam.examResults
        .filter(result => result.completedAt !== null) // Solo exámenes completados
        .map(result => {
          const scorePercentage = result.totalQuestions > 0 
            ? Math.round((result.score / result.totalQuestions) * 100)
            : 0
          return {
            id: result.id,
            title: exam.title,
            score: result.score,
            totalQuestions: result.totalQuestions,
            scorePercentage,
            timeMinutes: result.timeTakenMinutes || 0,
            completedDate: result.completedAt ? new Date(result.completedAt).toLocaleDateString('es-ES') : '-',
            completedAt: result.completedAt,
            isPassed: result.isPassed || false
          }
        })
    ).sort((a, b) => {
      // Ordenar por fecha, más recientes primero
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0
      return dateB - dateA
    })

    // Calcular comparación con grupo
    let groupAverageScore: number | undefined = undefined
    let comparisonStatus: 'above' | 'below' | 'equal' | 'no_data' = 'no_data'
    
    if (user.schoolId && examsData.length > 0) {
      try {
        const groupExamResults = await prisma.examResult.findMany({
          where: {
            exam: {
              competencyId: competency.id
            },
            user: {
              schoolId: user.schoolId,
              role: 'student'
            },
            completedAt: { not: null }
          },
          select: {
            score: true,
            totalQuestions: true
          }
        })

        if (groupExamResults.length > 0) {
          const groupAverage = groupExamResults.reduce((acc, er) => {
            const percentage = er.totalQuestions > 0 
              ? (er.score / er.totalQuestions) * 100 
              : 0
            return acc + percentage
          }, 0) / groupExamResults.length
          
          groupAverageScore = Math.round(groupAverage)
          
          const studentAverage = examsData.reduce((sum, e) => sum + e.scorePercentage, 0) / examsData.length
          
          if (studentAverage > groupAverageScore + 2) {
            comparisonStatus = 'above'
          } else if (studentAverage < groupAverageScore - 2) {
            comparisonStatus = 'below'
          } else {
            comparisonStatus = 'equal'
          }
        }
      } catch (error) {
        console.warn('Error calculating group average:', error)
      }
    }

    // Calcular evolución temporal (últimos 6 meses por mes)
    const evolutionData: any[] = []
    if (examsData.length > 0) {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      const monthlyMap = new Map<string, number[]>()
      examsData.forEach(exam => {
        if (exam.completedAt) {
          const date = new Date(exam.completedAt)
          if (date >= sixMonthsAgo) {
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            if (!monthlyMap.has(monthKey)) {
              monthlyMap.set(monthKey, [])
            }
            monthlyMap.get(monthKey)!.push(exam.scorePercentage)
          }
        }
      })

      const sortedMonths = Array.from(monthlyMap.entries()).sort()
      let previousAvg = 0
      
      sortedMonths.forEach(([monthKey, scores], index) => {
        const average = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        const [year, month] = monthKey.split('-')
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        const monthNum = parseInt(month)
        const period = `${monthNames[monthNum - 1]} ${year}`
        
        evolutionData.push({
          period,
          averageScore: average,
          examsCount: scores.length,
          trend: index > 0 && average > previousAvg + 2
        })
        
        previousAvg = average
      })
    }

    // Métricas de exámenes (solo porcentajes)
    const totalExams = examsData.length
    const passedExams = examsData.filter(e => e.isPassed).length
    const averageScore = totalExams > 0 
      ? Math.round(examsData.reduce((sum, e) => sum + e.scorePercentage, 0) / totalExams)
      : 0
    const bestScore = totalExams > 0 
      ? Math.max(...examsData.map(e => e.scorePercentage))
      : 0
    const averageTimeMinutes = totalExams > 0 
      ? Math.round(examsData.reduce((sum, e) => sum + e.timeMinutes, 0) / totalExams)
      : 0
    const passRate = totalExams > 0 
      ? Math.round((passedExams / totalExams) * 100)
      : 0

    // Procesar logros específicos de la competencia
    const unlockedAchievementIds = new Set(userAchievements.map(ua => ua.achievementId))
    const competencyAchievementsWithStatus = competencyAchievements.map(achievement => {
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

    const competencyAchievementsUnlocked = competencyAchievementsWithStatus.filter(a => a.unlocked).length
    const competencyAchievementsTotal = competencyAchievementsWithStatus.length
    const competencyAchievementsProgress = competencyAchievementsTotal > 0 
      ? Math.round((competencyAchievementsUnlocked / competencyAchievementsTotal) * 100)
      : 0
    const competencyAchievementsMultiple = competencyAchievementsUnlocked !== 1
    const competencyTotalPoints = competencyAchievementsWithStatus
      .filter(a => a.unlocked)
      .reduce((total, a) => total + a.points, 0)

    // Generar análisis y recomendaciones basado SOLO en exámenes
    const analysis = generateExamBasedAnalysis(examsData, competency?.name || 'Competencia', groupAverageScore)

    // Preparar datos para la plantilla
    const templateData = {
      // Información general
      studentName: user?.name || 'Estudiante',
      schoolName: user?.school?.name || 'Sin escuela asignada',
      competencyName: competency?.name || 'Competencia',
      generationDate: new Date().toLocaleDateString('es-ES'),
      
      // Logos (convertir a base64)
      companyLogo: getCompanyLogoBase64(),
      schoolLogo: getSchoolLogoBase64(user.school?.logoUrl),
      
      // Métricas principales de exámenes
      totalExams,
      passedExams,
      averageScore,
      bestScore,
      averageTimeMinutes,
      passRate,
      groupAverageScore,
      comparisonStatus,
      
      // Datos detallados
      exams: examsData,
      evolutionData,
      
      // Análisis
      strengths: analysis.strengths,
      improvements: analysis.improvements,
      recommendations: analysis.recommendations,
      
      // Logros
      competencyAchievements: competencyAchievementsWithStatus,
      competencyAchievementsUnlocked,
      competencyAchievementsTotal,
      competencyAchievementsProgress,
      competencyAchievementsMultiple,
      competencyTotalPoints
    }

    // Registrar helpers de Handlebars
    Handlebars.registerHelper('eq', function(a: any, b: any) {
      return a === b
    })

    // Leer y compilar la plantilla
    const templatePath = path.join(process.cwd(), 'templates', 'competency-report.html')
    const templateContent = fs.readFileSync(templatePath, 'utf8')
    const template = Handlebars.compile(templateContent)
    const html = template(templateData)

    // Generar PDF con Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.3in',
        right: '0.3in',
        bottom: '0.3in',
        left: '0.3in'
      }
    })

    await browser.close()

    // Retornar el PDF
    const competencyName = competency?.name || 'competencia'
    const userName = user?.name || 'estudiante'
    
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-${competencyName.toLowerCase().replace(/\s+/g, '-')}-${userName.toLowerCase().replace(/\s+/g, '-')}.pdf"`
      }
    })

  } catch (error) {
    console.error('❌ Error generating competency report:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
