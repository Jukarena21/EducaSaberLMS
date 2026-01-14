import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import Handlebars from 'handlebars'
import { prisma } from '@/lib/prisma'

// Función para generar análisis y recomendaciones específicas por curso
function generateCourseAnalysisAndRecommendations(
  modules: any[], 
  lessons: any[], 
  courseTitle: string,
  progressPercentage: number,
  moduleCompletionRate: number,
  daysSinceLastActivity: number | null,
  nextLesson: any | null
): { strengths: string[], improvements: string[], recommendations: string[] } {
  const strengths: string[] = []
  const improvements: string[] = []
  const recommendations: string[] = []

  // Análisis de módulos
  const completedModules = modules.filter(m => m.progressPercentage >= 80)
  const weakModules = modules.filter(m => m.progressPercentage < 50)

  if (completedModules.length > 0) {
    strengths.push(`Dominio sólido en ${completedModules.length} módulo${completedModules.length > 1 ? 's' : ''} del curso`)
  }

  if (weakModules.length > 0) {
    improvements.push(`${weakModules.length} módulo${weakModules.length > 1 ? 's' : ''} requieren más atención`)
    recommendations.push(`Enfócate en completar los módulos: ${weakModules.slice(0, 3).map(m => m.title).join(', ')}`)
  }

  // Análisis de progreso general
  if (progressPercentage >= 80) {
    strengths.push('Excelente progreso general en el curso')
  } else if (progressPercentage < 50) {
    improvements.push('El progreso del curso está por debajo del 50%')
    recommendations.push('Considera dedicar más tiempo diario al estudio de este curso')
  }

  // Análisis de tasa de finalización de módulos
  if (moduleCompletionRate >= 80) {
    strengths.push('Alta tasa de finalización de módulos')
  } else if (moduleCompletionRate < 50) {
    improvements.push('Baja tasa de finalización de módulos')
    recommendations.push('Completa los módulos iniciados antes de comenzar nuevos')
  }

  // Análisis de lecciones
  const completedLessons = lessons.filter(l => l.status === 'completado')
  const videoProgress = lessons.filter(l => l.videoCompleted).length
  const theoryProgress = lessons.filter(l => l.theoryCompleted).length
  const exercisesProgress = lessons.filter(l => l.exercisesCompleted).length

  if (completedLessons.length >= lessons.length * 0.8) {
    strengths.push('Alto nivel de completitud en las lecciones')
  }

  if (exercisesProgress < lessons.length * 0.6) {
    improvements.push('Necesitas practicar más ejercicios')
    recommendations.push('Dedica más tiempo a los ejercicios prácticos de cada lección')
  }

  if (videoProgress < lessons.length * 0.7) {
    improvements.push('Falta revisar algunos videos explicativos')
    recommendations.push('Completa todos los videos antes de continuar con ejercicios')
  }

  // Análisis de actividad
  if (daysSinceLastActivity !== null && daysSinceLastActivity > 7) {
    improvements.push(`Llevas ${daysSinceLastActivity} días sin actividad en este curso`)
    recommendations.push('Retoma el estudio de este curso para mantener el ritmo de aprendizaje')
  } else if (daysSinceLastActivity !== null && daysSinceLastActivity <= 2) {
    strengths.push('Excelente constancia en el estudio')
  }

  // Recomendaciones específicas
  if (nextLesson) {
    recommendations.push(`Continúa con la siguiente lección: "${nextLesson.title}"`)
  }

  if (completedLessons.length < lessons.length * 0.5) {
    recommendations.push('Continúa completando las lecciones pendientes del curso')
  }

  return {
    strengths: strengths.length > 0 ? strengths : ['Continúa trabajando para desarrollar fortalezas en este curso'],
    improvements: improvements.length > 0 ? improvements : ['Mantén el buen trabajo'],
    recommendations: recommendations.length > 0 ? recommendations : ['Sigue con tu rutina de estudio actual']
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { courseId } = await request.json()
    if (!courseId) {
      return NextResponse.json({ error: 'ID de curso requerido' }, { status: 400 })
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

    // Obtener información del curso
    const courseEnrollment = await prisma.courseEnrollment.findFirst({
      where: {
        userId,
        courseId,
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
              },
              orderBy: {
                module: {
                  orderIndex: 'asc'
                }
              }
            }
          }
        }
      }
    })

    if (!courseEnrollment) {
      return NextResponse.json({ error: 'Curso no encontrado o no estás inscrito' }, { status: 404 })
    }

    const course = courseEnrollment.course

    // Obtener progreso de lecciones del curso
    const lessonProgress = await prisma.studentLessonProgress.findMany({
      where: {
        userId,
        lesson: {
          moduleLessons: {
            some: {
              module: {
                courseModules: {
                  some: {
                    courseId
                  }
                }
              }
            }
          }
        }
      },
      include: {
        lesson: {
          include: {
            moduleLessons: {
              include: {
                module: true
              }
            }
          }
        }
      }
    })

    // Procesar datos de módulos
    const modulesData = course.courseModules.map(courseModule => {
      const module = courseModule.module
      const moduleLessons = lessonProgress.filter(lp => 
        module.moduleLessons.some(ml => ml.lessonId === lp.lessonId)
      )
      const completedLessons = moduleLessons.filter(lp => lp.status === 'completed' || lp.status === 'completado')
      const totalTime = moduleLessons.reduce((sum, lp) => sum + (lp.totalTimeMinutes || 0), 0)
      const progressPercentage = module.moduleLessons.length > 0 
        ? Math.round((completedLessons.length / module.moduleLessons.length) * 100)
        : 0

      return {
        id: module.id,
        title: module.title || 'Módulo sin nombre',
        progressPercentage,
        completedLessons: completedLessons.length,
        totalLessons: module.moduleLessons.length,
        timeHours: Math.round(totalTime / 60 * 10) / 10
      }
    })

    // Procesar datos de lecciones
    const lessonsData = lessonProgress.map(lp => {
      const moduleName = lp.lesson.moduleLessons[0]?.module?.title || 'Sin módulo asignado'
      
      return {
        id: lp.lesson.id,
        title: lp.lesson.title || 'Lección sin nombre',
        moduleName,
        status: lp.status,
        statusText: lp.status === 'completed' || lp.status === 'completado' ? 'Completado' : 
                    lp.status === 'in_progress' || lp.status === 'en_progreso' ? 'En Progreso' : 'No Iniciado',
        statusClass: lp.status === 'completed' || lp.status === 'completado' ? 'completed' : 
                     lp.status === 'in_progress' || lp.status === 'en_progreso' ? 'progress' : 'not-started',
        progress: lp.progressPercentage || 0,
        videoCompleted: lp.videoCompleted || false,
        theoryCompleted: lp.theoryCompleted || false,
        exercisesCompleted: lp.exercisesCompleted || false,
        timeMinutes: lp.totalTimeMinutes || 0,
        completedDate: lp.completedAt ? new Date(lp.completedAt).toLocaleDateString('es-ES') : '-'
      }
    })

    // Calcular métricas generales
    const totalLessons = lessonsData.length
    const completedLessons = lessonsData.filter(l => l.status === 'completed' || l.status === 'completado').length
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
    const totalTimeMinutes = lessonsData.reduce((sum, l) => sum + l.timeMinutes, 0)
    const totalTimeHours = Math.round(totalTimeMinutes / 60 * 10) / 10

    const totalModules = modulesData.length
    const completedModules = modulesData.filter(m => m.progressPercentage === 100).length
    const moduleCompletionRate = totalModules > 0 
      ? Math.round((completedModules / totalModules) * 100)
      : 0

    const averageTimePerLesson = completedLessons > 0
      ? Math.round(totalTimeMinutes / completedLessons)
      : 0

    // Calcular días desde última actividad
    const lastActivityDate = courseEnrollment.lastActivityAt || courseEnrollment.enrolledAt
    const daysSinceLastActivity = lastActivityDate
      ? Math.floor((new Date().getTime() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
      : null

    // Encontrar próxima lección pendiente
    let nextLesson = null
    for (const cm of course.courseModules.sort((a, b) => a.module.orderIndex - b.module.orderIndex)) {
      for (const ml of cm.module.moduleLessons.sort((a, b) => a.orderIndex - b.orderIndex)) {
        const lessonProg = lessonProgress.find(lp => lp.lessonId === ml.lessonId)
        if (!lessonProg || (lessonProg.status !== 'completed' && lessonProg.status !== 'completado')) {
          nextLesson = {
            id: ml.lesson.id,
            title: ml.lesson.title,
            moduleTitle: cm.module.title,
            orderIndex: ml.orderIndex
          }
          break
        }
      }
      if (nextLesson) break
    }

    // Generar análisis y recomendaciones
    const analysis = generateCourseAnalysisAndRecommendations(
      modulesData, 
      lessonsData, 
      course.title,
      progressPercentage,
      moduleCompletionRate,
      daysSinceLastActivity,
      nextLesson
    )

    // Convertir logos a base64
    let companyLogoBase64 = ''
    let schoolLogoBase64 = ''
    
    try {
      const companyLogoPath = path.join(process.cwd(), 'public', 'logo-educasaber.png')
      if (fs.existsSync(companyLogoPath)) {
        const companyLogoBuffer = fs.readFileSync(companyLogoPath)
        companyLogoBase64 = `data:image/png;base64,${companyLogoBuffer.toString('base64')}`
      }
    } catch (error) {
      console.warn('No se pudo cargar el logo de EducaSaber')
    }

    try {
      if (user.school?.logoUrl) {
        // Si es una URL, intentar descargarla o usar directamente
        if (user.school.logoUrl.startsWith('http')) {
          schoolLogoBase64 = user.school.logoUrl
        } else {
          const schoolLogoPath = path.join(process.cwd(), 'public', user.school.logoUrl)
          if (fs.existsSync(schoolLogoPath)) {
            const schoolLogoBuffer = fs.readFileSync(schoolLogoPath)
            schoolLogoBase64 = `data:image/png;base64,${schoolLogoBuffer.toString('base64')}`
          }
        }
      }
    } catch (error) {
      console.warn('No se pudo cargar el logo de la escuela')
    }

    // Preparar datos para la plantilla
    const templateData = {
      // Información general
      studentName: `${user.firstName} ${user.lastName}`,
      schoolName: user.school?.name || 'Sin escuela asignada',
      courseTitle: course.title,
      competencyName: course.competency?.name || 'General',
      academicGrade: course.academicGrade || 'N/A',
      generationDate: new Date().toLocaleDateString('es-ES'),
      
      // Logos
      companyLogo: companyLogoBase64 || 'https://via.placeholder.com/200x80/3b82f6/ffffff?text=EducaSaber',
      schoolLogo: schoolLogoBase64 || 'https://via.placeholder.com/200x80/ef4444/ffffff?text=Escuela',
      
      // Métricas principales
      progressPercentage,
      totalTimeHours,
      totalModules,
      completedModules,
      moduleCompletionRate,
      totalLessons,
      completedLessons,
      averageTimePerLesson,
      daysSinceLastActivity,
      nextLesson: nextLesson ? { title: nextLesson.title } : null,
      
      // Datos detallados
      modules: modulesData,
      lessons: lessonsData,
      
      // Análisis
      strengths: analysis.strengths,
      improvements: analysis.improvements,
      recommendations: analysis.recommendations
    }

    // Leer y compilar la plantilla
    const templatePath = path.join(process.cwd(), 'templates', 'course-report.html')
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
    const courseTitle = course.title || 'curso'
    const userName = `${user.firstName}-${user.lastName}` || 'estudiante'
    
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-${courseTitle.toLowerCase().replace(/\s+/g, '-')}-${userName.toLowerCase().replace(/\s+/g, '-')}.pdf"`
      }
    })

  } catch (error) {
    console.error('❌ Error generating course report:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

