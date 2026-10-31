import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { launchBrowser } from '@/lib/pdf/launchBrowser'
import fs from 'fs'
import path from 'path'
import Handlebars from 'handlebars'
import type { Prisma } from '@prisma/client'
import { resolveAnalyticsFilters, studentWhere } from '@/lib/analytics/filters'
import { academicGradeAliases } from '@/lib/academicGrades'
import { buildStudentDetail } from '@/lib/analytics/studentDetail'


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

export const maxDuration = 60
export const dynamic = 'force-dynamic'

/** Más estudiantes no caben en el tiempo máximo de una función de Vercel. */
const MAX_STUDENTS_PER_REPORT = 200
const DETAIL_CONCURRENCY = 5

const FILTER_KEYS = ['schoolId', 'courseId', 'grade', 'competencyId', 'minAge', 'maxAge', 'gender', 'socioeconomicStratum'] as const

export async function POST(request: NextRequest) {
  try {
    const gate = await requireRole(['teacher_admin', 'school_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }
    if (!gate.session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const params = new URLSearchParams()
    FILTER_KEYS.forEach((key) => {
      const value = body?.[key]
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        params.set(key === 'grade' ? 'academicGrade' : key, String(value))
      }
    })
    const filters = resolveAnalyticsFilters(params, gate.session.user)
    const appliedFilters = {
      schoolId: filters.schoolId,
      courseId: filters.courseId,
      grade: filters.academicGrade,
      competencyId: filters.competencyId,
      gender: filters.gender,
      socioeconomicStratum: filters.socioeconomicStratum,
      minAge: filters.minAge,
      maxAge: filters.maxAge,
    }

    // Mismos criterios de estudiante que el resto de Analytics; el reporte es
    // de colegios, así que deja por fuera a quien no pertenece a uno.
    const and: Prisma.UserWhereInput[] = [studentWhere(filters), { school: { type: 'school' } }]
    if (filters.academicGrade) {
      const grades = academicGradeAliases(filters.academicGrade)
      if (grades.length > 0) {
        and.push({
          OR: [
            { academicGrade: { in: grades } },
            { academicGrade: null, courseEnrollments: { some: { course: { academicGrade: { in: grades } } } } },
          ],
        })
      }
    }
    if (filters.courseId) {
      and.push({ courseEnrollments: { some: { courseId: filters.courseId } } })
    }
    if (filters.competencyId) {
      and.push({
        examResults: { some: { completedAt: { not: null }, exam: { competencyId: filters.competencyId } } },
      })
    }

    const students = await prisma.user.findMany({
      where: { AND: and },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        school: { select: { name: true } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    if (students.length === 0) {
      return NextResponse.json({
        error: 'No se encontraron estudiantes de colegios con los filtros seleccionados',
        details: { filters: appliedFilters },
      }, { status: 404 })
    }

    if (students.length > MAX_STUDENTS_PER_REPORT) {
      return NextResponse.json({
        error: `Los filtros incluyen ${students.length} estudiantes. El reporte masivo admite hasta ${MAX_STUDENTS_PER_REPORT}; elige un colegio, curso o grado para dividirlo.`,
        details: { filters: appliedFilters },
      }, { status: 400 })
    }

    const reports: any[] = []
    for (let i = 0; i < students.length; i += DETAIL_CONCURRENCY) {
      const batch = students.slice(i, i + DETAIL_CONCURRENCY)
      const details = await Promise.all(batch.map((s) => buildStudentDetail(s.id)))
      details.forEach((detail, idx) => {
        if (detail.status !== 'ok') return
        const student = batch[idx]
        const grade = detail.data.academicGrade
        reports.push({
          student: {
            name: `${student.firstName} ${student.lastName}`.trim(),
            email: student.email,
            group: grade ? `${grade.charAt(0).toUpperCase()}${grade.slice(1)}°` : 'N/A',
            school: student.school?.name || 'N/A',
          },
          ...detail.data,
        })
      })
    }

    const templatePath = path.join(process.cwd(), 'templates', 'bulk-student-report.html')
    let templateContent: string
    try {
      templateContent = fs.readFileSync(templatePath, 'utf8')
    } catch (error) {
      return NextResponse.json({ error: 'Template no encontrado' }, { status: 500 })
    }

    const template = Handlebars.compile(templateContent)
    const html = template({
      reports,
      generationDate: new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    })

    const browser = await launchBrowser()
    try {
      const page = await browser.newPage()
      await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 1 })
      await page.setContent(html, { waitUntil: 'networkidle0' })
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0.2in', right: '0.2in', bottom: '0.2in', left: '0.2in' },
        preferCSSPageSize: true
      })

      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="reporte-masivo-estudiantes-${new Date().toISOString().split('T')[0]}.pdf"`
        }
      })
    } finally {
      await browser.close()
    }
  } catch (error: any) {
    console.error('Error generating bulk report:', error)
    return NextResponse.json({
      error: error?.message || 'Error interno del servidor',
      details: error?.details || {}
    }, { status: 500 })
  }
}
