import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import Handlebars from 'handlebars'

// Importar la función getStudentMetrics del endpoint de métricas
// Necesitamos extraer la lógica de getStudentMetrics para reutilizarla

// Helper para calcular nivel de desempeño
function getPerformanceLevel(score: number): string {
  if (score >= 80) return 'AVANZADO'
  if (score >= 60) return 'SATISFACTORIO'
  if (score >= 40) return 'MINIMO'
  return 'INSUFICIENTE'
}

// Helper para calcular nivel de inglés
function getEnglishLevel(score: number): string {
  if (score >= 80) return 'B2'
  if (score >= 60) return 'B1'
  if (score >= 40) return 'A2'
  return 'A1'
}

// Helper para comparación en Handlebars
Handlebars.registerHelper('eq', function(a: any, b: any) {
  return a === b
})

Handlebars.registerHelper('gte', function(a: number, b: number) {
  return a >= b
})

Handlebars.registerHelper('formatDate', function(dateString: string) {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
})

// Helper para generar barras comparativas en SVG
Handlebars.registerHelper('comparisonBar', function(studentScore: number, groupScore: number, maxScore: number = 100) {
  const studentWidth = Math.max(5, (studentScore / maxScore) * 100)
  const groupWidth = Math.max(5, (groupScore / maxScore) * 100)
  
  return new Handlebars.SafeString(`
    <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
      <div style="flex: 1; position: relative; height: 20px; background: #f0f0f0; border-radius: 4px; overflow: hidden;">
        <div style="position: absolute; left: 0; top: 0; height: 100%; width: ${studentWidth}%; background: #4A90E2; border-radius: 4px;"></div>
        <div style="position: absolute; left: 0; top: 0; height: 100%; width: ${groupWidth}%; background: #50C878; border-radius: 4px; opacity: 0.7;"></div>
      </div>
      <div style="min-width: 80px; text-align: right; font-size: 11px;">
        <span style="color: #4A90E2; font-weight: bold;">${studentScore.toFixed(0)}%</span> / 
        <span style="color: #50C878; font-weight: bold;">${groupScore.toFixed(0)}%</span>
      </div>
    </div>
  `)
})

// Helper para generar gráfico de radar en SVG
Handlebars.registerHelper('radarChart', function(competencyPerformance: any[]) {
  if (!competencyPerformance || competencyPerformance.length === 0) return ''
  
  const svgWidth = 400
  const svgHeight = 400
  const centerX = svgWidth / 2
  const centerY = svgHeight / 2
  const radius = 140
  const numAxes = competencyPerformance.length
  const angleStep = (2 * Math.PI) / numAxes
  
  const getPoint = (index: number, value: number, maxValue: number = 100) => {
    const angle = (index * angleStep) - (Math.PI / 2)
    const distance = (value / maxValue) * radius
    return {
      x: centerX + distance * Math.cos(angle),
      y: centerY + distance * Math.sin(angle)
    }
  }
  
  let studentPath = ''
  competencyPerformance.forEach((comp, index) => {
    const score = comp.averageScore || 0
    const point = getPoint(index, score)
    if (index === 0) {
      studentPath += `M ${point.x} ${point.y} `
    } else {
      studentPath += `L ${point.x} ${point.y} `
    }
  })
  studentPath += 'Z'
  
  let axes = ''
  let labels = ''
  competencyPerformance.forEach((comp, index) => {
    const angle = (index * angleStep) - (Math.PI / 2)
    const endX = centerX + radius * Math.cos(angle)
    const endY = centerY + radius * Math.sin(angle)
    axes += `<line x1="${centerX}" y1="${centerY}" x2="${endX}" y2="${endY}" stroke="#e5e7eb" stroke-width="1"/>`
    
    const labelX = centerX + (radius + 30) * Math.cos(angle)
    const labelY = centerY + (radius + 30) * Math.sin(angle)
    labels += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="10" fill="#374151" font-weight="500">${comp.competencyName}</text>`
  })
  
  let circles = ''
  for (let i = 1; i <= 4; i++) {
    const r = (radius / 4) * i
    circles += `<circle cx="${centerX}" cy="${centerY}" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="0.5"/>`
    if (i === 1) {
      circles += `<text x="${centerX + r + 5}" y="${centerY - 3}" font-size="8" fill="#9ca3af">${i * 25}</text>`
    }
  }
  
  return new Handlebars.SafeString(`
    <svg width="${svgWidth}" height="${svgHeight}" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px;">
      ${circles}
      ${axes}
      <path d="${studentPath}" fill="#73A2D3" fill-opacity="0.6" stroke="#73A2D3" stroke-width="2"/>
      ${labels}
    </svg>
  `)
})

// Helper para generar gráfico de línea mensual
Handlebars.registerHelper('lineChart', function(monthlyEvolution: any[]) {
  if (!monthlyEvolution || monthlyEvolution.length === 0) return ''
  
  const width = 600
  const height = 200
  const padding = { top: 40, right: 40, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  
  const scores = monthlyEvolution.map(e => e.averageScore || 0)
  const maxValue = Math.max(...scores, 100)
  const minValue = Math.min(...scores, 0)
  const range = Math.max(maxValue - minValue, 30)
  
  const scaleX = (index: number) => {
    if (scores.length === 1) return padding.left + chartWidth / 2
    return padding.left + (index / (scores.length - 1)) * chartWidth
  }
  const scaleY = (value: number) => padding.top + chartHeight - ((value - minValue) / range) * chartHeight
  
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
    points += `<circle cx="${x}" cy="${y}" r="4" fill="#73A2D3" stroke="white" stroke-width="2"/>`
    points += `<text x="${x}" y="${y - 8}" text-anchor="middle" font-size="9" font-weight="bold" fill="#1f2937">${score}</text>`
  })
  
  const yAxisValues = [Math.floor(minValue), Math.floor((minValue + maxValue) / 2), Math.ceil(maxValue)]
  
  return new Handlebars.SafeString(`
    <svg width="${width}" height="${height}" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px;">
      ${yAxisValues.map(val => {
        const y = scaleY(val)
        return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e5e7eb" stroke-width="0.5" stroke-dasharray="2,2"/>`
      }).join('')}
      ${scores.length > 1 ? `<path d="${dataPoints}" fill="none" stroke="#73A2D3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
      ${points}
      <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#374151" stroke-width="1.5"/>
      ${monthlyEvolution.map((e, index) => {
        const x = scaleX(index)
        const monthLabel = e.month ? e.month.split('-')[1] + '/' + e.month.split('-')[0].slice(2) : ''
        return `<text x="${x}" y="${height - padding.bottom + 15}" text-anchor="middle" font-size="8" fill="#6b7280" font-weight="500">${monthLabel}</text>`
      }).join('')}
      <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#374151" stroke-width="1.5"/>
      ${yAxisValues.map(val => {
        const y = scaleY(val)
        return `<text x="${padding.left - 8}" y="${y + 3}" text-anchor="end" font-size="8" fill="#6b7280" font-weight="500">${Math.round(val)}</text>`
      }).join('')}
      <text x="${width / 2}" y="25" text-anchor="middle" font-size="12" font-weight="bold" fill="#1f2937">Evolución Mensual de Rendimiento</text>
    </svg>
  `)
})

// Helper para generar gráfico de barras comparativo
Handlebars.registerHelper('comparisonChart', function(chartData: any[]) {
  if (!chartData || chartData.length === 0) {
    return new Handlebars.SafeString('<p>No hay datos para mostrar</p>')
  }
  
  const maxValue = Math.max(...chartData.map(s => Math.max(s.studentScore || 0, s.groupScore || 0)), 100)
  const chartHeight = 200
  const barWidth = 50
  const spacing = 15
  const startX = 50
  
  let svg = `
    <svg width="550" height="${chartHeight + 80}" style="margin: 10px 0;">
      <defs>
        <linearGradient id="studentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#357ABD;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="groupGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#50C878;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#3FA066;stop-opacity:1" />
        </linearGradient>
      </defs>
  `
  
  chartData.forEach((subject, index) => {
    const x = startX + index * (barWidth * 2 + spacing)
    const studentScore = subject.studentScore || 0
    const groupScore = subject.groupScore || 0
    const studentHeight = (studentScore / maxValue) * chartHeight
    const groupHeight = (groupScore / maxValue) * chartHeight
    const studentY = chartHeight - studentHeight + 40
    const groupY = chartHeight - groupHeight + 40
    
    // Barras
    svg += `
      <rect x="${x}" y="${studentY}" width="${barWidth}" height="${studentHeight}" fill="url(#studentGrad)" rx="2"/>
      <rect x="${x + barWidth + 5}" y="${groupY}" width="${barWidth}" height="${groupHeight}" fill="url(#groupGrad)" rx="2"/>
      
      <!-- Valores en las barras -->
      <text x="${x + barWidth/2}" y="${studentY - 5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333">${studentScore}</text>
      <text x="${x + barWidth + 5 + barWidth/2}" y="${groupY - 5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333">${groupScore}</text>
      
      <!-- Etiquetas -->
      <text x="${x + barWidth}" y="${chartHeight + 60}" text-anchor="middle" font-size="9" fill="#666">${subject.name}</text>
    `
  })
  
  // Leyenda
  svg += `
    <g transform="translate(350, ${chartHeight + 20})">
      <rect x="0" y="0" width="15" height="15" fill="url(#studentGrad)"/>
      <text x="20" y="12" font-size="10" fill="#333">ESTUDIANTE</text>
      <rect x="100" y="0" width="15" height="15" fill="url(#groupGrad)"/>
      <text x="120" y="12" font-size="10" fill="#333">GRUPO</text>
    </g>
  `
  
  svg += '</svg>'
  
  return new Handlebars.SafeString(svg)
})

export async function POST(request: NextRequest) {
  try {
    const gate = await requireRole(['teacher_admin', 'school_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    if (!gate.session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      schoolId,
      courseId,
      grade,
      competencyId,
      minAge,
      maxAge,
      gender,
      socioeconomicStratum
    } = body

    // Construir filtros para estudiantes
    const studentWhere: any = {
      role: 'student'
    }

    if (gate.session.user.role === 'school_admin') {
      studentWhere.schoolId = gate.session.user.schoolId
      console.log(`🔍 Filtro school_admin: schoolId = ${gate.session.user.schoolId}`)
    } else if (schoolId && schoolId !== 'all') {
      studentWhere.schoolId = schoolId
      console.log(`🔍 Filtro schoolId: ${schoolId}`)
    }
    // NOTA: No agregamos filtro de schoolId = { not: null } aquí porque puede excluir estudiantes válidos
    // El filtro por tipo de institución se aplica después cuando tenemos la relación school cargada

    // Nota: academicGrade no existe en el modelo User, se filtra después por cursos
    if (gender && gender !== 'all') {
      studentWhere.gender = gender
      console.log(`🔍 Filtro gender: ${gender}`)
    }

    if (socioeconomicStratum && socioeconomicStratum !== 'all') {
      studentWhere.socioeconomicStratum = parseInt(socioeconomicStratum)
      console.log(`🔍 Filtro socioeconomicStratum: ${socioeconomicStratum}`)
    }

    if (minAge || maxAge) {
      const now = new Date()
      if (maxAge) {
        const minDate = new Date(now.getFullYear() - parseInt(maxAge) - 1, now.getMonth(), now.getDate())
        studentWhere.dateOfBirth = { ...studentWhere.dateOfBirth, gte: minDate }
        console.log(`🔍 Filtro maxAge: ${maxAge} (minDate: ${minDate.toISOString()})`)
      }
      if (minAge) {
        const maxDate = new Date(now.getFullYear() - parseInt(minAge), now.getMonth(), now.getDate())
        studentWhere.dateOfBirth = { ...studentWhere.dateOfBirth, lte: maxDate }
        console.log(`🔍 Filtro minAge: ${minAge} (maxDate: ${maxDate.toISOString()})`)
      }
    }

    console.log('📋 Filtros aplicados:', JSON.stringify(studentWhere, null, 2))

    // Obtener estudiantes que cumplan los filtros
    let students = await prisma.user.findMany({
      where: studentWhere,
      include: {
        school: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        courseEnrollments: {
          include: {
            course: {
              select: {
                id: true,
                academicGrade: true
              }
            }
          }
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    })

    console.log(`📊 Estudiantes encontrados antes de filtros adicionales: ${students.length}`)
    
    // Debug: verificar tipos de instituciones
    if (students.length > 0) {
      const schoolTypes = new Map<string, number>()
      students.forEach(s => {
        const type = s.school?.type || 'null'
        schoolTypes.set(type, (schoolTypes.get(type) || 0) + 1)
      })
      console.log(`📊 Tipos de instituciones encontrados:`, Object.fromEntries(schoolTypes))
    }

    // Filtrar por tipo de institución: solo colegios (type = 'school'), no empresas u otros tipos
    // Si un estudiante no tiene school o school.type no es 'school', excluirlo
    const beforeTypeFilter = students.length
    const studentsWithoutSchool = students.filter(s => !s.school).length
    const studentsWithNonSchoolType = students.filter(s => s.school && s.school.type !== 'school').length
    
    students = students.filter(student => {
      // Si no tiene school asignado, excluir (solo para reportes de colegios)
      if (!student.school) {
        return false
      }
      // Solo incluir estudiantes de colegios (type = 'school')
      return student.school.type === 'school'
    })
    console.log(`🔍 Filtro tipo institución (solo colegios): Estudiantes antes: ${beforeTypeFilter}, después: ${students.length}`)
    console.log(`   - Estudiantes sin school: ${studentsWithoutSchool}`)
    console.log(`   - Estudiantes con tipo no-school: ${studentsWithNonSchoolType}`)
    
    // Si después del filtro no hay estudiantes, dar un mensaje más descriptivo
    if (students.length === 0 && beforeTypeFilter > 0) {
      console.error('❌ Todos los estudiantes fueron excluidos por el filtro de tipo de institución')
      let errorMessage = `No se encontraron estudiantes de colegios. Se encontraron ${beforeTypeFilter} estudiantes, pero ninguno pertenece a un colegio (tipo 'school').`
      if (studentsWithoutSchool > 0) {
        errorMessage += ` ${studentsWithoutSchool} estudiantes no tienen colegio asignado.`
      }
      if (studentsWithNonSchoolType > 0) {
        errorMessage += ` ${studentsWithNonSchoolType} estudiantes pertenecen a instituciones que no son colegios.`
      }
      return NextResponse.json({ 
        error: errorMessage,
        details: {
          filters: {
            schoolId: gate.session.user.role === 'school_admin' ? gate.session.user.schoolId : schoolId,
            grade,
            courseId,
            competencyId,
            gender,
            socioeconomicStratum,
            minAge,
            maxAge
          },
          studentsFoundBeforeTypeFilter: beforeTypeFilter,
          studentsWithoutSchool,
          studentsWithNonSchoolType
        }
      }, { status: 404 })
    }

    // Filtrar por grado académico si se especifica (basado en los cursos del estudiante)
    if (grade && grade !== 'all') {
      const beforeGradeFilter = students.length
      students = students.filter(student => {
        // Verificar si el estudiante tiene cursos del grado especificado
        const hasGrade = student.courseEnrollments.some(enrollment => 
          enrollment.course?.academicGrade === grade
        )
        return hasGrade
      })
      console.log(`🔍 Filtro grade: ${grade} - Estudiantes antes: ${beforeGradeFilter}, después: ${students.length}`)
    } else {
      console.log('🔍 Sin filtro de grado académico')
    }

    // Filtrar por curso si se especifica
    if (courseId && courseId !== 'all') {
      const beforeCourseFilter = students.length
      students = students.filter(student => {
        return student.courseEnrollments.some(enrollment => 
          enrollment.course?.id === courseId
        )
      })
      console.log(`🔍 Filtro courseId: ${courseId} - Estudiantes antes: ${beforeCourseFilter}, después: ${students.length}`)
    }

    // Filtrar por competencia si se especifica (a través de exámenes)
    if (competencyId && competencyId !== 'all') {
      // Necesitamos obtener los exámenes de esta competencia primero
      const examsWithCompetency = await prisma.exam.findMany({
        where: { competencyId },
        select: { id: true }
      })
      const examIds = examsWithCompetency.map(e => e.id)
      
      if (examIds.length > 0) {
        const examResults = await prisma.examResult.findMany({
          where: {
            examId: { in: examIds },
            userId: { in: students.map(s => s.id) }
          },
          select: { userId: true },
          distinct: ['userId']
        })
        const userIdsWithCompetency = new Set(examResults.map(er => er.userId))
        const beforeCompetencyFilter = students.length
        students = students.filter(student => userIdsWithCompetency.has(student.id))
        console.log(`🔍 Filtro competencyId: ${competencyId} - Estudiantes antes: ${beforeCompetencyFilter}, después: ${students.length}`)
      } else {
        // No hay exámenes de esta competencia, ningún estudiante cumple el filtro
        students = []
        console.log(`🔍 Filtro competencyId: ${competencyId} - No hay exámenes de esta competencia`)
      }
    }

    console.log(`📊 Total de estudiantes después de todos los filtros: ${students.length}`)

    if (students.length === 0) {
      console.error('❌ No se encontraron estudiantes con los filtros:', {
        schoolId: gate.session.user.role === 'school_admin' ? gate.session.user.schoolId : schoolId,
        grade,
        courseId,
        competencyId,
        gender,
        socioeconomicStratum,
        minAge,
        maxAge
      })
      return NextResponse.json({ 
        error: 'No se encontraron estudiantes con los filtros seleccionados',
        details: {
          filters: {
            schoolId: gate.session.user.role === 'school_admin' ? gate.session.user.schoolId : schoolId,
            grade,
            courseId,
            competencyId,
            gender,
            socioeconomicStratum,
            minAge,
            maxAge
          }
        }
      }, { status: 404 })
    }

    console.log(`📊 Generando reporte para ${students.length} estudiantes`)

    // Obtener todas las competencias
    const competencies = await prisma.area.findMany({
      orderBy: { name: 'asc' }
    })

    // Obtener resultados de exámenes de todos los estudiantes
    const allExamResults = await prisma.examResult.findMany({
      where: {
        userId: { in: students.map(s => s.id) }
      },
      include: {
        exam: {
          include: {
            competency: true
          }
        },
        user: true
      }
    })

    // Calcular promedios del grupo por materia y competencia
    const groupAverages: any = {
      subjects: {},
      competencies: {}
    }

    // Agrupar por materia principal
    const subjectMap: { [key: string]: string[] } = {
      'MATEMÁTICAS': ['Matemáticas', 'Matemática'],
      'CIENCIAS NATURALES': ['Ciencias Naturales', 'Ciencias'],
      'SOCIALES Y CIUDADANAS': ['Ciencias Sociales', 'Sociales'],
      'LECTURA CRÍTICA': ['Lectura Crítica', 'Lectura'],
      'INGLÉS': ['Inglés', 'English']
    }

    // Calcular promedios por materia
    Object.keys(subjectMap).forEach(subject => {
      const keywords = subjectMap[subject]
      const subjectExams = allExamResults.filter(er => 
        er.exam?.competency?.displayName && keywords.some(kw => er.exam.competency.displayName.includes(kw))
      )
      
      if (subjectExams.length > 0) {
        const avgScore = subjectExams.reduce((sum, er) => sum + er.score, 0) / subjectExams.length
        groupAverages.subjects[subject] = Math.round(avgScore)
      } else {
        groupAverages.subjects[subject] = 0
      }
    })

    // Calcular promedios por competencia
    competencies.forEach(comp => {
      const compExams = allExamResults.filter(er => er.exam.competencyId === comp.id)
      if (compExams.length > 0) {
        const avgScore = compExams.reduce((sum, er) => sum + er.score, 0) / compExams.length
        groupAverages.competencies[comp.id] = Math.round(avgScore)
      } else {
        groupAverages.competencies[comp.id] = 0
      }
    })

    // Función auxiliar para obtener métricas completas de un estudiante
    const getStudentFullMetrics = async (studentId: string) => {
      const [
        examResults,
        lessonProgress,
        courseProgress,
        courseEnrollments
      ] = await Promise.all([
        prisma.examResult.findMany({
          where: { userId: studentId },
          include: {
            exam: {
              include: { competency: true }
            }
          },
          orderBy: { completedAt: 'desc' }
        }),
        prisma.studentLessonProgress.findMany({
          where: { userId: studentId },
          include: {
            lesson: {
              include: {
                moduleLessons: {
                  include: {
                    module: {
                      include: { competency: true }
                    }
                  }
                }
              }
            }
          }
        }),
        prisma.studentCourseProgress.findMany({
          where: { userId: studentId },
          include: {
            course: {
              include: { competency: true }
            }
          }
        }),
        prisma.courseEnrollment.findMany({
          where: { userId: studentId, isActive: true },
          include: { course: true }
        })
      ])

      // Calcular métricas básicas
      const totalExams = examResults.length
      const averageScore = totalExams > 0
        ? Math.round(examResults.reduce((sum, er) => sum + er.score, 0) / totalExams * 10) / 10
        : 0
      const passedExams = examResults.filter(er => er.isPassed).length
      const passRate = totalExams > 0
        ? Math.round((passedExams / totalExams) * 100 * 10) / 10
        : 0

      const totalStudyTimeMinutes = lessonProgress.reduce((sum, lp) => sum + (lp.totalTimeMinutes || 0), 0)
      const totalStudyTimeHours = Math.round((totalStudyTimeMinutes / 60) * 10) / 10

      const averageCourseProgress = courseProgress.length > 0
        ? Math.round(courseProgress.reduce((sum, cp) => sum + (cp.progressPercentage || 0), 0) / courseProgress.length * 10) / 10
        : 0

      const completedCourses = courseProgress.filter(cp => cp.completedAt !== null).length
      const activeCourses = courseEnrollments.length

      // Calcular métricas por competencia
      const competencyMap = new Map<string, {
        scores: number[]
        exams: number
        passed: number
      }>()

      examResults.forEach(er => {
        if (er.exam?.competency) {
          const compId = er.exam.competency.id
          if (!competencyMap.has(compId)) {
            competencyMap.set(compId, { scores: [], exams: 0, passed: 0 })
          }
          const comp = competencyMap.get(compId)!
          comp.scores.push(er.score)
          comp.exams += 1
          if (er.isPassed) comp.passed += 1
        }
      })

      const competencyPerformance = Array.from(competencyMap.entries()).map(([compId, data]) => {
        const competency = examResults.find(er => er.exam?.competency?.id === compId)?.exam?.competency
        return {
          competencyId: compId,
          competencyName: competency?.displayName || competency?.name || 'Competencia Desconocida',
          averageScore: data.scores.length > 0
            ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length * 10) / 10
            : 0,
          examsCount: data.exams,
          passRate: data.exams > 0
            ? Math.round((data.passed / data.exams) * 100 * 10) / 10
            : 0
        }
      })

      // Calcular evolución mensual
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const recentExams = examResults.filter(er => 
        er.completedAt && new Date(er.completedAt) >= sixMonthsAgo
      )

      const monthlyMap = new Map<string, { scores: number[], count: number }>()
      
      recentExams.forEach(er => {
        if (er.completedAt) {
          const monthKey = `${er.completedAt.getFullYear()}-${String(er.completedAt.getMonth() + 1).padStart(2, '0')}`
          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, { scores: [], count: 0 })
          }
          const month = monthlyMap.get(monthKey)!
          month.scores.push(er.score)
          month.count += 1
        }
      })

      const monthlyEvolution = Array.from(monthlyMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, data]) => ({
          month,
          averageScore: data.scores.length > 0
            ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length * 10) / 10
            : 0,
          examsCount: data.count
        }))

      // Determinar estado y factores de riesgo
      let status: 'excelente' | 'bueno' | 'mejorable' | 'requiere_atencion' = 'bueno'
      const riskFactors: string[] = []

      if (averageScore >= 80) {
        status = 'excelente'
      } else if (averageScore >= 70) {
        status = 'bueno'
      } else if (averageScore >= 60) {
        status = 'mejorable'
      } else {
        status = 'requiere_atencion'
        riskFactors.push('Promedio por debajo de 60%')
      }

      if (passRate < 50 && totalExams > 0) {
        riskFactors.push('Tasa de aprobación menor al 50%')
      }

      if (totalExams < 3) {
        riskFactors.push('Menos de 3 exámenes realizados')
      }

      const lastExamDate = examResults.length > 0 && examResults[0].completedAt
        ? (examResults[0].completedAt instanceof Date 
            ? examResults[0].completedAt.toISOString() 
            : new Date(examResults[0].completedAt).toISOString())
        : null

      const lastActivityDate = lastExamDate 
        ? new Date(lastExamDate)
        : (lessonProgress.length > 0 && lessonProgress[0].updatedAt
          ? new Date(lessonProgress[0].updatedAt)
          : null)

      if (lastActivityDate) {
        const daysSinceLastActivity = Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceLastActivity > 30) {
          riskFactors.push(`Sin actividad en los últimos ${daysSinceLastActivity} días`)
        }
      } else {
        riskFactors.push('Sin actividad registrada')
      }

      // Preparar datos detallados de exámenes
      const examHistory = examResults.map(er => ({
        id: er.id,
        examId: er.examId,
        examTitle: er.exam?.title || 'Examen sin título',
        competencyName: er.exam?.competency?.displayName || er.exam?.competency?.name || 'Sin competencia',
        score: er.score,
        isPassed: er.isPassed,
        completedAt: er.completedAt ? er.completedAt.toISOString() : new Date().toISOString(),
        totalQuestions: er.totalQuestions || 0,
        correctAnswers: er.correctAnswers || 0
      }))

      // Preparar datos detallados de cursos
      const coursesDetail = courseEnrollments.map(enrollment => {
        const course = enrollment.course
        const courseProg = courseProgress.find(cp => cp.courseId === course.id)
        
        const courseLessons = course.courseModules?.flatMap(cm => 
          cm.module?.moduleLessons?.map(ml => ml.lessonId) || []
        ) || []
        
        const completedLessonsCount = lessonProgress.filter(lp => 
          courseLessons.includes(lp.lessonId) && lp.status === 'completed'
        ).length
        
        const totalLessonsCount = courseLessons.length
        
        return {
          courseId: course.id,
          courseTitle: course.title,
          competencyName: course.competency?.displayName || course.competency?.name || 'Sin competencia',
          enrollmentDate: enrollment.enrolledAt ? enrollment.enrolledAt.toISOString() : new Date().toISOString(),
          progressPercentage: courseProg?.progressPercentage || 0,
          completedLessons: completedLessonsCount,
          totalLessons: totalLessonsCount,
          timeSpentHours: courseProg?.totalTimeMinutes 
            ? Math.round((courseProg.totalTimeMinutes / 60) * 10) / 10 
            : 0,
          isActive: enrollment.isActive
        }
      })

      return {
        totalExams,
        averageScore,
        passRate,
        totalStudyTimeHours,
        averageCourseProgress,
        completedCourses,
        activeCourses,
        competencyPerformance,
        monthlyEvolution,
        examHistory,
        coursesDetail,
        status,
        lastActivity: lastActivityDate?.toISOString() || null,
        riskFactors
      }
    }

    // Procesar datos de cada estudiante con métricas completas
    const studentReports = await Promise.all(students.map(async (student) => {
      const studentMetrics = await getStudentFullMetrics(student.id)
      const studentExams = allExamResults.filter(er => er.userId === student.id)
      
      // Calcular puntajes por materia
      const subjectScores: any = {}
      Object.keys(subjectMap).forEach(subject => {
        const keywords = subjectMap[subject]
        const subjectExams = studentExams.filter(er => 
          er.exam?.competency?.displayName && keywords.some(kw => er.exam.competency.displayName.includes(kw))
        )
        
        if (subjectExams.length > 0) {
          const avgScore = subjectExams.reduce((sum, er) => sum + er.score, 0) / subjectExams.length
          const subjectKey = subject.replace(/\s+/g, '_')
          subjectScores[subjectKey] = {
            score: Math.round(avgScore),
            level: subject === 'INGLÉS' ? getEnglishLevel(avgScore) : getPerformanceLevel(avgScore)
          }
        } else {
          const subjectKey = subject.replace(/\s+/g, '_')
          subjectScores[subjectKey] = {
            score: 0,
            level: 'SIN DATOS'
          }
        }
      })

      // Calcular promedio general
      const allScores = Object.values(subjectScores).map((s: any) => s.score).filter((s: number) => s > 0)
      const generalAverage = allScores.length > 0
        ? Math.round(allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length)
        : 0

      // Calcular puesto (ranking basado en promedio general)
      const studentRank = students
        .map(s => {
          const sExams = allExamResults.filter(er => er.userId === s.id)
          const sSubjectScores: any = {}
          Object.keys(subjectMap).forEach(subject => {
            const keywords = subjectMap[subject]
            const sSubjectExams = sExams.filter(er => 
              keywords.some(kw => er.exam.competency?.displayName?.includes(kw))
            )
            if (sSubjectExams.length > 0) {
              const avgScore = sSubjectExams.reduce((sum, er) => sum + er.score, 0) / sSubjectExams.length
              sSubjectScores[subject] = Math.round(avgScore)
            } else {
              sSubjectScores[subject] = 0
            }
          })
          const sAllScores = Object.values(sSubjectScores).filter((s: number) => s > 0) as number[]
          const sAvg = sAllScores.length > 0
            ? Math.round(sAllScores.reduce((a, b) => a + b, 0) / sAllScores.length)
            : 0
          return { id: s.id, avg: sAvg }
        })
        .sort((a, b) => b.avg - a.avg)
        .findIndex(s => s.id === student.id) + 1

      // Calcular puntajes por competencia
      const competencyScores = competencies.map(comp => {
        const compExams = studentExams.filter(er => er.exam.competencyId === comp.id)
        const studentScore = compExams.length > 0
          ? Math.round(compExams.reduce((sum, er) => sum + er.score, 0) / compExams.length)
          : 0
        const groupScore = groupAverages.competencies[comp.id] || 0
        
        return {
          name: comp.displayName || comp.name,
          studentScore,
          groupScore,
          studentWidth: Math.max(5, studentScore),
          groupWidth: Math.max(5, groupScore)
        }
      })

      // Calcular subpruebas (sub-competencias o temas específicos)
      // Por ahora, usaremos las competencias como subpruebas
      const subpruebas = competencyScores
        .filter(c => {
          const name = c.name.toLowerCase()
          return name.includes('biología') || name.includes('física') || name.includes('química') ||
                 name.includes('razonamiento') || name.includes('ciudadan') || 
                 name.includes('parte') || name.includes('descripción') || name.includes('aviso') ||
                 name.includes('diálogo') || name.includes('completar') || name.includes('lectura')
        })
        .map(c => ({
          name: c.name,
          score: c.studentScore,
          level: getPerformanceLevel(c.studentScore)
        }))

      // Preparar datos para el gráfico comparativo
      const chartData = [
        {
          name: 'Matemática',
          studentScore: subjectScores.MATEMÁTICAS?.score || 0,
          groupScore: groupAverages.subjects['MATEMÁTICAS'] || 0
        },
        {
          name: 'C. Naturales',
          studentScore: subjectScores.CIENCIAS_NATURALES?.score || 0,
          groupScore: groupAverages.subjects['CIENCIAS NATURALES'] || 0
        },
        {
          name: 'C. Sociales',
          studentScore: subjectScores.SOCIALES_Y_CIUDADANAS?.score || 0,
          groupScore: groupAverages.subjects['SOCIALES Y CIUDADANAS'] || 0
        },
        {
          name: 'Lectura',
          studentScore: subjectScores.LECTURA_CRÍTICA?.score || 0,
          groupScore: groupAverages.subjects['LECTURA CRÍTICA'] || 0
        },
        {
          name: 'Inglés',
          studentScore: subjectScores.INGLÉS?.score || 0,
          groupScore: groupAverages.subjects['INGLÉS'] || 0
        }
      ].filter(item => item.studentScore > 0 || item.groupScore > 0) // Solo incluir materias con datos

      // Obtener el grado académico del estudiante basado en sus cursos
      const studentGrade = student.courseEnrollments?.find(e => e.course?.academicGrade)?.course?.academicGrade || null

      return {
        student: {
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          group: studentGrade ? `${studentGrade.charAt(0).toUpperCase()}${studentGrade.slice(1)}°` : 'N/A',
          school: student.school?.name || 'N/A'
        },
        // Métricas completas del estudiante
        ...studentMetrics,
        // Datos adicionales para comparación
        generalAverage,
        rank: studentRank,
        subjectScores,
        competencyScores,
        subpruebas,
        chartData,
        groupAverages: {
          subjects: groupAverages.subjects,
          generalAverage: Object.values(groupAverages.subjects)
            .filter((s: any) => s > 0)
            .reduce((a: number, b: number) => a + b, 0) / Object.values(groupAverages.subjects).filter((s: any) => s > 0).length || 0
        }
      }
    }))

    // Cargar template
    const templatePath = path.join(process.cwd(), 'templates', 'bulk-student-report.html')
    let templateContent: string

    try {
      templateContent = fs.readFileSync(templatePath, 'utf8')
    } catch (error) {
      return NextResponse.json({ error: 'Template no encontrado' }, { status: 500 })
    }

    // Compilar template
    const template = Handlebars.compile(templateContent)
    const html = template({
      reports: studentReports,
      generationDate: new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    })

    // Generar PDF con Puppeteer
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
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 1
    })

    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.2in',
        right: '0.2in',
        bottom: '0.2in',
        left: '0.2in'
      },
      preferCSSPageSize: true
    })

    await browser.close()

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-masivo-estudiantes-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    })

  } catch (error: any) {
    console.error('❌ Error generating bulk report:', error)
    console.error('❌ Stack trace:', error?.stack)
    return NextResponse.json({ 
      error: error?.message || 'Error interno del servidor',
      details: error?.details || {}
    }, { status: 500 })
  }
}

