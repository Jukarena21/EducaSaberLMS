import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import jsPDF from 'jspdf'
import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
import { Chart, registerables } from 'chart.js'

// Registrar componentes de Chart.js
Chart.register(...registerables)

// Función auxiliar para aplicar colores en jsPDF
function applyColor(pdf: jsPDF, colorType: 'fill' | 'text' | 'draw', color: number[]) {
  if (colorType === 'fill') {
    pdf.setFillColor(color[0], color[1], color[2])
  } else if (colorType === 'text') {
    pdf.setTextColor(color[0], color[1], color[2])
  } else if (colorType === 'draw') {
    pdf.setDrawColor(color[0], color[1], color[2])
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting export API...')
    
    const session = await getServerSession(authOptions)
    console.log('👤 Session:', session?.user?.role)
    console.log('👤 User ID:', session?.user?.id)
    console.log('👤 User email:', session?.user?.email)
    
    if (!session?.user || session.user.role !== 'student') {
      console.log('❌ Unauthorized access - Session:', !!session, 'User:', !!session?.user, 'Role:', session?.user?.role)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { type, competencyId, coursesData, competenciesData } = await request.json()
    console.log('📊 Request data:', { type, competencyId, coursesDataLength: coursesData?.length, competenciesDataLength: competenciesData?.length })
    
    const userId = session.user.id
    console.log('🆔 User ID:', userId)

    // Obtener datos del estudiante y escuela
    console.log('🔍 Fetching student data...')
    const student = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        school: true
      }
    })
    
    // El campo branding está disponible como student.school.branding (campo JSON)

    if (!student) {
      console.log('❌ Student not found')
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
    }
    
    console.log('✅ Student found:', student.firstName, student.lastName)

    // Obtener datos históricos para gráficos de evolución
    console.log('📈 Getting historical data...')
    const historicalData = await getHistoricalProgressData(userId, competencyId)
    console.log('📈 Historical data length:', historicalData.length)

    // Generar PDF
    console.log('📄 Generating PDF...')
    const pdf = await generateProgressReport({
      type,
      competencyId,
      student,
      coursesData,
      competenciesData,
      historicalData
    })
    console.log('✅ PDF generated successfully')

    // Convertir a buffer
    console.log('🔄 Converting to buffer...')
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    console.log('✅ Buffer created, size:', pdfBuffer.length)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="informe-progreso-${type}-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    })

  } catch (error) {
    console.error('❌ Error generating progress report:', error)
    console.error('❌ Error stack:', error.stack)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

async function getHistoricalProgressData(userId: string, competencyId?: string) {
  try {
    console.log('📈 Getting historical data for user:', userId, 'competency:', competencyId)
    
    // Obtener progreso histórico de los últimos 30 días
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    console.log('📅 Date range:', thirtyDaysAgo.toISOString(), 'to', new Date().toISOString())

    const historicalProgress = await prisma.studentLessonProgress.findMany({
      where: {
        userId,
        updatedAt: {
          gte: thirtyDaysAgo
        },
        ...(competencyId && {
          lesson: {
            moduleLessons: {
              some: {
                module: {
                  competencyId
                }
              }
            }
          }
        })
      },
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
      },
      orderBy: {
        updatedAt: 'asc'
      }
    })
    console.log('📊 Historical progress records found:', historicalProgress.length)

    // Agrupar por día y calcular progreso acumulado
    const dailyProgress = new Map()
    
    historicalProgress.forEach(progress => {
      const date = progress.updatedAt.toISOString().split('T')[0]
      if (!dailyProgress.has(date)) {
        dailyProgress.set(date, {
          date,
          lessonsCompleted: 0,
          timeSpent: 0,
          competencies: new Map()
        })
      }
      
      const dayData = dailyProgress.get(date)
      if (progress.status === 'completed') {
        dayData.lessonsCompleted++
      }
      
      // Agrupar por competencia
      progress.lesson.moduleLessons?.forEach(moduleLesson => {
        const compId = moduleLesson.module.competencyId
        if (compId && !dayData.competencies.has(compId)) {
          dayData.competencies.set(compId, {
            competencyId: compId,
            competencyName: moduleLesson.module.competency?.displayName || 'General',
            lessonsCompleted: 0
          })
        }
        
        if (progress.status === 'completed' && compId) {
          dayData.competencies.get(compId).lessonsCompleted++
        }
      })
    })

    const result = Array.from(dailyProgress.values()).map(day => ({
      ...day,
      competencies: Array.from(day.competencies.values())
    }))
    
    console.log('📈 Historical data processed:', result.length, 'days')
    return result
  } catch (error) {
    console.error('❌ Error getting historical data:', error)
    console.error('❌ Error stack:', error.stack)
    return []
  }
}

async function generateProgressReport({
  type,
  competencyId,
  student,
  coursesData,
  competenciesData,
  historicalData
}: {
  type: string
  competencyId?: string
  student: any
  coursesData: any[]
  competenciesData: any[]
  historicalData: any[]
}) {
  try {
    console.log('📄 Starting professional PDF generation...')
    console.log('📊 Data received:', {
      type,
      competencyId,
      studentName: student?.firstName,
      coursesCount: coursesData?.length,
      competenciesCount: competenciesData?.length,
      historicalDataCount: historicalData?.length
    })

    // Validar datos de entrada
    if (!coursesData || !Array.isArray(coursesData)) {
      console.log('⚠️ Invalid coursesData:', coursesData)
      coursesData = []
    }
    
    if (!competenciesData || !Array.isArray(competenciesData)) {
      console.log('⚠️ Invalid competenciesData:', competenciesData)
      competenciesData = []
    }
    
    if (!historicalData || !Array.isArray(historicalData)) {
      console.log('⚠️ Invalid historicalData:', historicalData)
      historicalData = []
    }
    
    // Crear PDF en formato A4 vertical (hoja carta) para fácil impresión
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    let yPosition = 20

    // Validar dimensiones de página después de crear el PDF
    if (isNaN(pageWidth) || isNaN(pageHeight) || pageWidth <= 0 || pageHeight <= 0) {
      console.log(`⚠️ Invalid page dimensions: width=${pageWidth}, height=${pageHeight}`)
      throw new Error('Invalid page dimensions')
    }
    
    console.log('📄 PDF initialized, page size:', pageWidth, 'x', pageHeight)

    // Colores de EducaSaber (convertidos a RGB)
    const educaSaberColors = {
      primary: [30, 64, 175],    // Azul principal #1E40AF
      secondary: [220, 38, 38],  // Rojo secundario #DC2626
      accent: [5, 150, 105],      // Verde de éxito #059669
      light: [243, 244, 246],    // Gris claro #F3F4F6
      dark: [31, 41, 55]         // Gris oscuro #1F2937
    }

    // Header minimalista
    await addProfessionalHeader(pdf, student, pageWidth, educaSaberColors)
    yPosition = 50

    // Resumen ejecutivo con métricas visuales (como en la UI)
    yPosition = await addExecutiveSummary(pdf, coursesData, competenciesData, yPosition, pageWidth, educaSaberColors)

    // Progreso por competencias (replicando exactamente la UI)
    yPosition = await addCompetencyProgressChart(pdf, competenciesData, yPosition, pageWidth, pageHeight, educaSaberColors)

    // Pie de página profesional
    addProfessionalFooter(pdf, pageWidth, pageHeight, educaSaberColors)

    console.log('✅ Professional PDF generation completed successfully')
    return pdf
  } catch (error) {
    console.error('❌ Error in PDF generation:', error)
    console.error('❌ Error stack:', error.stack)
    throw error
  }
}

async function addProfessionalHeader(pdf: jsPDF, student: any, pageWidth: number, colors: any) {
  // Header minimalista y elegante
  applyColor(pdf, 'fill', [255, 255, 255]) // Fondo blanco
  
  // Logo de EducaSaber más prominente
  applyColor(pdf, 'text', [59, 130, 246]) // Azul vibrante
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text('EducaSaber', 20, 25)
  
  // Información del estudiante en el header
  applyColor(pdf, 'text', colors.dark)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`${student.firstName} ${student.lastName}`, pageWidth - 20, 20, { align: 'right' })
  
  // Institución
  applyColor(pdf, 'text', [107, 114, 128]) // Gris medio
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'normal')
  pdf.text(student.school?.name || 'Institución Educativa', pageWidth - 20, 28, { align: 'right' })
  
  // Fecha de generación
  pdf.setFontSize(9)
  pdf.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, pageWidth - 20, 35, { align: 'right' })
  
  // Línea separadora sutil
  applyColor(pdf, 'draw', [229, 231, 235]) // Gris claro
  pdf.setLineWidth(0.5)
  pdf.line(20, 40, pageWidth - 20, 40)
}

async function addStudentInfoCard(pdf: jsPDF, student: any, yPosition: number, pageWidth: number, colors: any): Promise<number> {
  // Fondo de la tarjeta
  applyColor(pdf, 'fill', colors.light)
  pdf.rect(20, yPosition, pageWidth - 40, 25, 'F')
  
  // Borde de la tarjeta
  applyColor(pdf, 'draw', colors.primary)
  pdf.setLineWidth(1)
  pdf.rect(20, yPosition, pageWidth - 40, 25)
  
  // Título de la sección
  applyColor(pdf, 'text', colors.primary)
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('INFORMACIÓN DEL ESTUDIANTE', 25, yPosition + 8)
  
  // Información del estudiante
  applyColor(pdf, 'text', colors.dark)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Nombre: ${student.firstName} ${student.lastName}`, 25, yPosition + 15)
  pdf.text(`Institución: ${student.school?.name || 'No especificada'}`, pageWidth / 2, yPosition + 15)
  pdf.text(`Email: ${student.email}`, 25, yPosition + 22)
  pdf.text(`Rol: Estudiante`, pageWidth / 2, yPosition + 22)
  
  return yPosition + 35
}

function generateRecommendations(coursesData: any[], competenciesData: any[], averageProgress: number): string[] {
  const recommendations = []

  if (averageProgress < 50) {
    recommendations.push('Incrementar el tiempo de estudio diario para mejorar el progreso general')
  }

  if (averageProgress >= 80) {
    recommendations.push('Excelente progreso. Considerar avanzar a temas más desafiantes')
  }

  // Recomendaciones por competencia
  competenciesData.forEach(competency => {
    if (competency.progressPercentage < 40) {
      recommendations.push(`Fortalecer el estudio en ${competency.displayName} - progreso actual: ${competency.progressPercentage}%`)
    }
    
    if (competency.averageScore < 60 && competency.totalExams > 0) {
      recommendations.push(`Revisar conceptos fundamentales de ${competency.displayName} - promedio en exámenes: ${competency.averageScore}%`)
    }
  })

  // Recomendaciones por curso
  coursesData.forEach(course => {
    if (course.progressPercentage < 30) {
      recommendations.push(`Dedicar más tiempo al curso "${course.title}" - progreso actual: ${course.progressPercentage}%`)
    }
  })

  if (recommendations.length === 0) {
    recommendations.push('Continuar con el excelente trabajo académico')
    recommendations.push('Mantener la constancia en el estudio diario')
  }

  return recommendations.slice(0, 5) // Máximo 5 recomendaciones
}

async function addExecutiveSummary(pdf: jsPDF, coursesData: any[], competenciesData: any[], yPosition: number, pageWidth: number, colors: any): Promise<number> {
  // Título de la sección más elegante
  applyColor(pdf, 'text', colors.dark)
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Resumen Ejecutivo', 20, yPosition)
  yPosition += 20

  // Calcular métricas
  const totalCourses = coursesData.length
  const totalLessonsCompleted = coursesData.reduce((acc, c) => acc + (c.completedLessons || 0), 0)
  const totalTimeSpent = coursesData.reduce((acc, c) => acc + (c.timeSpentMinutes || 0), 0)
  const averageProgress = coursesData.length > 0 
    ? Math.round(coursesData.reduce((acc, c) => acc + (c.progressPercentage || 0), 0) / coursesData.length)
    : 0

  // Crear tarjetas de métricas como en la UI (2x2) con más espacio
  const cardWidth = (pageWidth - 80) / 2
  const cardHeight = 45
  const cardSpacing = 40

  // Validar dimensiones
  if (isNaN(cardWidth) || cardWidth <= 0) {
    console.log(`⚠️ Invalid cardWidth: ${cardWidth}`)
    return yPosition + 60
  }

  // Fila 1: Cursos y Lecciones
  // Tarjeta 1: Cursos activos
  applyColor(pdf, 'fill', [255, 255, 255]) // Blanco
  applyColor(pdf, 'draw', [229, 231, 235]) // Borde gris claro
  pdf.setLineWidth(1)
  pdf.rect(20, yPosition, cardWidth, cardHeight, 'FD')
  
  // Icono más grande (círculo azul)
  applyColor(pdf, 'fill', [59, 130, 246]) // Azul más vibrante
  pdf.circle(35, yPosition + 18, 5, 'F')
  
  applyColor(pdf, 'text', colors.dark)
  pdf.setFontSize(28)
  pdf.setFont('helvetica', 'bold')
  pdf.text(totalCourses.toString(), 50, yPosition + 25)
  
  applyColor(pdf, 'text', [107, 114, 128]) // Gris medio
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Cursos Activos', 50, yPosition + 35)

  // Tarjeta 2: Lecciones completadas
  applyColor(pdf, 'fill', [255, 255, 255])
  applyColor(pdf, 'draw', [229, 231, 235])
  pdf.rect(20 + cardWidth + cardSpacing, yPosition, cardWidth, cardHeight, 'FD')
  
  // Icono más grande (círculo verde)
  applyColor(pdf, 'fill', [34, 197, 94]) // Verde más vibrante
  pdf.circle(35 + cardWidth + cardSpacing, yPosition + 18, 5, 'F')
  
  applyColor(pdf, 'text', colors.dark)
  pdf.setFontSize(28)
  pdf.setFont('helvetica', 'bold')
  pdf.text(totalLessonsCompleted.toString(), 50 + cardWidth + cardSpacing, yPosition + 25)
  
  applyColor(pdf, 'text', [107, 114, 128])
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Lecciones Completadas', 50 + cardWidth + cardSpacing, yPosition + 35)

  yPosition += cardHeight + 20

  // Fila 2: Tiempo y Progreso
  // Tarjeta 3: Tiempo invertido
  applyColor(pdf, 'fill', [255, 255, 255])
  applyColor(pdf, 'draw', [229, 231, 235])
  pdf.rect(20, yPosition, cardWidth, cardHeight, 'FD')
  
  // Icono más grande (círculo naranja)
  applyColor(pdf, 'fill', [249, 115, 22]) // Naranja vibrante
  pdf.circle(35, yPosition + 18, 5, 'F')
  
  applyColor(pdf, 'text', colors.dark)
  pdf.setFontSize(28)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`${Math.round(totalTimeSpent / 60)}h`, 50, yPosition + 25)
  
  applyColor(pdf, 'text', [107, 114, 128])
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Tiempo Invertido', 50, yPosition + 35)

  // Tarjeta 4: Progreso promedio
  applyColor(pdf, 'fill', [255, 255, 255])
  applyColor(pdf, 'draw', [229, 231, 235])
  pdf.rect(20 + cardWidth + cardSpacing, yPosition, cardWidth, cardHeight, 'FD')
  
  // Icono más grande (círculo morado)
  applyColor(pdf, 'fill', [147, 51, 234]) // Morado vibrante
  pdf.circle(35 + cardWidth + cardSpacing, yPosition + 18, 5, 'F')
  
  applyColor(pdf, 'text', colors.dark)
  pdf.setFontSize(28)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`${averageProgress}%`, 50 + cardWidth + cardSpacing, yPosition + 25)
  
  applyColor(pdf, 'text', [107, 114, 128])
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Progreso Promedio', 50 + cardWidth + cardSpacing, yPosition + 35)

  return yPosition + cardHeight + 30
}

async function addCompetencyProgressChart(pdf: jsPDF, competenciesData: any[], yPosition: number, pageWidth: number, pageHeight: number, colors: any): Promise<number> {
  // Título de la sección más elegante
  applyColor(pdf, 'text', colors.dark)
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Progreso por Competencias', 20, yPosition)
  yPosition += 25

  competenciesData.forEach((competency, index) => {
    // Verificar si necesitamos nueva página
    if (yPosition > pageHeight - 80) {
      pdf.addPage()
      yPosition = 20
    }

    const progressPercentage = competency.progressPercentage || 0
    
    // Tarjeta de competencia más grande como en la UI
    applyColor(pdf, 'fill', [255, 255, 255]) // Fondo blanco
    applyColor(pdf, 'draw', [229, 231, 235]) // Borde gris claro
    pdf.setLineWidth(1)
    pdf.rect(20, yPosition, pageWidth - 40, 40, 'FD')
    
    // Borde izquierdo más grueso y colorido (como en la UI)
    applyColor(pdf, 'fill', [59, 130, 246]) // Azul vibrante
    pdf.rect(20, yPosition, 6, 40, 'F')
    
    // Nombre de la competencia más grande
    applyColor(pdf, 'text', colors.dark)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text(competency.displayName, 35, yPosition + 15)
    
    // Información adicional más clara
    applyColor(pdf, 'text', [107, 114, 128]) // Gris medio
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${competency.completedLessons || 0} de ${competency.totalLessons || 0} lecciones`, 35, yPosition + 28)
    
    // Barra de progreso más prominente como en la UI
    const barX = 35
    const barY = yPosition + 32
    const barWidth = pageWidth - 120
    const barHeight = 6
    
    // Fondo de la barra (gris claro)
    applyColor(pdf, 'fill', [229, 231, 235])
    pdf.rect(barX, barY, barWidth, barHeight, 'F')
    
    // Barra de progreso (color según porcentaje)
    const progressWidth = (progressPercentage / 100) * barWidth
    if (progressWidth > 0) {
      if (progressPercentage >= 80) {
        applyColor(pdf, 'fill', [34, 197, 94]) // Verde vibrante
      } else if (progressPercentage >= 50) {
        applyColor(pdf, 'fill', [249, 115, 22]) // Naranja vibrante
      } else {
        applyColor(pdf, 'fill', [239, 68, 68]) // Rojo vibrante
      }
      pdf.rect(barX, barY, progressWidth, barHeight, 'F')
    }
    
    // Porcentaje más prominente al final de la barra
    applyColor(pdf, 'text', colors.dark)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`${progressPercentage}%`, barX + barWidth + 10, barY + 4)

    yPosition += 50
  })

  return yPosition + 15
}

async function addDetailedCompetencyAnalysis(pdf: jsPDF, competenciesData: any[], yPosition: number, pageWidth: number, pageHeight: number, colors: any): Promise<number> {
  // Verificar si necesitamos una nueva página
  if (yPosition > pageHeight - 100) {
    pdf.addPage()
    yPosition = 20
  }

  // Título de la sección
  applyColor(pdf, 'text', colors.primary)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('ANÁLISIS DETALLADO POR COMPETENCIAS', 20, yPosition)
  yPosition += 10

  competenciesData.forEach((competency, index) => {
    if (yPosition > pageHeight - 50) {
      pdf.addPage()
      yPosition = 20
    }

    // Tarjeta de competencia
    applyColor(pdf, 'fill', colors.light)
    pdf.rect(20, yPosition, pageWidth - 40, 30, 'F')
    applyColor(pdf, 'draw', colors.primary)
    pdf.rect(20, yPosition, pageWidth - 40, 30)

    // Nombre de la competencia
    applyColor(pdf, 'text', colors.primary)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text(competency.displayName, 25, yPosition + 10)

    // Métricas en dos columnas
    applyColor(pdf, 'text', colors.dark)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    
    // Columna izquierda
    pdf.text(`Progreso: ${competency.progressPercentage}%`, 25, yPosition + 18)
    pdf.text(`Lecciones: ${competency.completedLessons}/${competency.totalLessons}`, 25, yPosition + 25)
    
    // Columna derecha
    pdf.text(`Tiempo: ${Math.round(competency.totalTimeMinutes / 60)}h`, pageWidth / 2, yPosition + 18)
    pdf.text(`Exámenes: ${competency.passedExams}/${competency.totalExams}`, pageWidth / 2, yPosition + 25)

    yPosition += 35
  })

  return yPosition
}

async function addTemporalEvolutionChart(pdf: jsPDF, historicalData: any[], yPosition: number, pageWidth: number, pageHeight: number, colors: any): Promise<number> {
  // Verificar si necesitamos una nueva página
  if (yPosition > pageHeight - 80) {
    pdf.addPage()
    yPosition = 20
  }

  // Título de la sección
  applyColor(pdf, 'text', colors.primary)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('EVOLUCIÓN TEMPORAL', 20, yPosition)
  yPosition += 10

  if (historicalData.length === 0) {
    applyColor(pdf, 'text', colors.dark)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text('No hay datos históricos disponibles para mostrar la evolución.', 20, yPosition)
    return yPosition + 20
  }

  // Crear gráfico de línea simple
  const chartWidth = Math.max(0, pageWidth - 40)
  const chartHeight = 60
  const chartX = 20
  const chartY = yPosition

  // Validar dimensiones del gráfico
  if (isNaN(chartWidth) || chartWidth <= 0) {
    console.log(`⚠️ Invalid temporal chart width: ${chartWidth}`)
    return yPosition + 30
  }

  // Fondo del gráfico
  applyColor(pdf, 'fill', colors.light)
  pdf.rect(chartX, chartY, chartWidth, chartHeight, 'F')
  applyColor(pdf, 'draw', colors.primary)
  pdf.rect(chartX, chartY, chartWidth, chartHeight)

  // Ejes
  applyColor(pdf, 'draw', colors.dark)
  pdf.setLineWidth(0.5)
  pdf.line(chartX + 10, chartY + 10, chartX + 10, chartY + chartHeight - 10) // Eje Y
  pdf.line(chartX + 10, chartY + chartHeight - 10, chartX + chartWidth - 10, chartY + chartHeight - 10) // Eje X

  // Datos del gráfico
  const maxLessons = Math.max(...historicalData.map(d => d.lessonsCompleted || 0))
  const safeMaxLessons = maxLessons > 0 ? maxLessons : 1
  const stepX = Math.max(0, (chartWidth - 20) / Math.max(1, historicalData.length))

  historicalData.forEach((data, index) => {
    const lessonsCompleted = data.lessonsCompleted || 0
    const x = chartX + 10 + (index * stepX)
    const y = chartY + chartHeight - 10 - ((lessonsCompleted / safeMaxLessons) * (chartHeight - 20))
    
    // Validar coordenadas
    if (isNaN(x) || isNaN(y) || x < 0 || y < 0) {
      console.log(`⚠️ Invalid coordinates for data point ${index}: x=${x}, y=${y}`)
      return
    }
    
    // Punto en el gráfico
    applyColor(pdf, 'fill', colors.secondary)
    pdf.circle(x, y, 1, 'F')
    
    // Línea conectando puntos
    if (index > 0) {
      const prevLessonsCompleted = historicalData[index - 1].lessonsCompleted || 0
      const prevX = chartX + 10 + ((index - 1) * stepX)
      const prevY = chartY + chartHeight - 10 - ((prevLessonsCompleted / safeMaxLessons) * (chartHeight - 20))
      
      // Validar coordenadas previas
      if (!isNaN(prevX) && !isNaN(prevY) && prevX >= 0 && prevY >= 0) {
        applyColor(pdf, 'draw', colors.secondary)
        pdf.setLineWidth(1)
        pdf.line(prevX, prevY, x, y)
      }
    }
  })

  // Etiquetas
  applyColor(pdf, 'text', colors.dark)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Lecciones Completadas', chartX + chartWidth / 2, chartY + chartHeight + 5, { align: 'center' })

  return yPosition + chartHeight + 20
}

async function addCourseDetails(pdf: jsPDF, coursesData: any[], yPosition: number, pageWidth: number, pageHeight: number, colors: any): Promise<number> {
  // Verificar si necesitamos una nueva página
  if (yPosition > pageHeight - 80) {
    pdf.addPage()
    yPosition = 20
  }

  // Título de la sección elegante
  applyColor(pdf, 'text', colors.dark)
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Detalle por Cursos', 20, yPosition)
  yPosition += 15

  coursesData.forEach((course, index) => {
    if (yPosition > pageHeight - 50) {
      pdf.addPage()
      yPosition = 20
    }

    // Tarjeta de curso como en la UI
    applyColor(pdf, 'fill', [255, 255, 255]) // Fondo blanco
    applyColor(pdf, 'draw', [229, 231, 235]) // Borde gris claro
    pdf.setLineWidth(1)
    pdf.rect(20, yPosition, pageWidth - 40, 30, 'FD')
    
    // Borde izquierdo de color
    applyColor(pdf, 'fill', colors.accent)
    pdf.rect(20, yPosition, 4, 30, 'F')
    
    // Nombre del curso
    applyColor(pdf, 'text', colors.dark)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text(course.title, 30, yPosition + 10)
    
    // Competencia
    applyColor(pdf, 'text', [107, 114, 128]) // Gris medio
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Competencia: ${course.competency}`, 30, yPosition + 18)
    
    // Métricas en dos columnas
    applyColor(pdf, 'text', colors.dark)
    pdf.setFontSize(9)
    pdf.text(`Progreso: ${course.progressPercentage || 0}%`, pageWidth / 2, yPosition + 10)
    pdf.text(`Lecciones: ${course.completedLessons || 0}/${course.totalLessons || 0}`, pageWidth / 2, yPosition + 18)
    pdf.text(`Tiempo: ${Math.round((course.timeSpentMinutes || 0) / 60)}h`, pageWidth / 2 + 60, yPosition + 10)
    pdf.text(`Módulos: ${course.totalModules || 0}`, pageWidth / 2 + 60, yPosition + 18)

    yPosition += 40
  })

  return yPosition
}

async function addPersonalizedRecommendations(pdf: jsPDF, coursesData: any[], competenciesData: any[], yPosition: number, pageWidth: number, pageHeight: number, colors: any): Promise<number> {
  // Verificar si necesitamos una nueva página
  if (yPosition > pageHeight - 60) {
    pdf.addPage()
    yPosition = 20
  }

  // Título de la sección elegante
  applyColor(pdf, 'text', colors.dark)
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Recomendaciones', 20, yPosition)
  yPosition += 15

  const recommendations = generateRecommendations(coursesData, competenciesData, 
    coursesData.length > 0 ? Math.round(coursesData.reduce((acc, c) => acc + (c.progressPercentage || 0), 0) / coursesData.length) : 0)

  recommendations.forEach((rec, index) => {
    if (yPosition > pageHeight - 20) {
      pdf.addPage()
      yPosition = 20
    }

    // Bullet point elegante
    applyColor(pdf, 'fill', colors.primary)
    pdf.circle(25, yPosition + 3, 1.5, 'F')
    
    // Texto de la recomendación
    applyColor(pdf, 'text', colors.dark)
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(rec, 30, yPosition + 4)

    yPosition += 8
  })

  return yPosition + 10
}

function addProfessionalFooter(pdf: jsPDF, pageWidth: number, pageHeight: number, colors: any) {
  // Línea separadora sutil
  applyColor(pdf, 'draw', [229, 231, 235]) // Gris claro
  pdf.setLineWidth(0.5)
  pdf.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15)
  
  // Texto del pie de página elegante
  applyColor(pdf, 'text', [107, 114, 128]) // Gris medio
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text('EducaSaber LMS - Sistema de Gestión de Aprendizaje', pageWidth / 2, pageHeight - 8, { align: 'center' })
}
