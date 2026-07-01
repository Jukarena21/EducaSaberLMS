import fs from 'fs'
import path from 'path'
import Handlebars from 'handlebars'
import { prisma } from '@/lib/prisma'
import { isExamFeedbackReleased } from '@/lib/examFeedbackPolicy'
import {
  buildExamAttemptBreakdown,
  getCompetencyRadarComparison,
} from '@/lib/examPerformanceAnalytics'
import { launchBrowser } from '@/lib/pdf/launchBrowser'

let radarHelperRegistered = false

function registerCompetencyComparisonChartHelper() {
  if (radarHelperRegistered) return
  radarHelperRegistered = true

  Handlebars.registerHelper(
    'competencyComparisonChart',
    function (
      competencies: Array<{ id: string; displayName?: string; name?: string }>,
      attemptScores: Array<{ id: string; score: number }>,
      studentScores: Array<{ id: string; score: number }>,
      schoolScores: Array<{ id: string; score: number }>,
      platformScores: Array<{ id: string; score: number }>
    ) {
      if (!competencies?.length) return ''

      const svgWidth = 500
      const svgHeight = 500
      const centerX = svgWidth / 2
      const centerY = svgHeight / 2
      const radius = 180
      const numAxes = competencies.length
      const angleStep = (2 * Math.PI) / numAxes
      const maxValue = 100

      const getPoint = (index: number, value: number) => {
        const clampedValue = Math.min(Math.max(value, 0), maxValue)
        const angle = index * angleStep - Math.PI / 2
        const distance = (clampedValue / maxValue) * radius
        return {
          x: centerX + distance * Math.cos(angle),
          y: centerY + distance * Math.sin(angle),
        }
      }

      const buildPath = (getScore: (compId: string) => number) => {
        let pathData = ''
        competencies.forEach((comp, index) => {
          const point = getPoint(index, getScore(comp.id))
          pathData += index === 0 ? `M ${point.x} ${point.y} ` : `L ${point.x} ${point.y} `
        })
        return `${pathData}Z`
      }

      const scoreFor = (scores: Array<{ id: string; score: number }>, id: string) =>
        scores.find((s) => s.id === id)?.score ?? 0

      const attemptPath = buildPath((id) => scoreFor(attemptScores, id))
      const studentPath = buildPath((id) => scoreFor(studentScores, id))
      const schoolPath = buildPath((id) => scoreFor(schoolScores, id))
      const platformPath = buildPath((id) => scoreFor(platformScores, id))

      let axes = ''
      let labels = ''
      competencies.forEach((comp, index) => {
        const angle = index * angleStep - Math.PI / 2
        const endX = centerX + radius * Math.cos(angle)
        const endY = centerY + radius * Math.sin(angle)
        axes += `<line x1="${centerX}" y1="${centerY}" x2="${endX}" y2="${endY}" stroke="#e5e7eb" stroke-width="1"/>`

        for (let i = 1; i <= 4; i++) {
          const r = (radius / 4) * i
          const value = (100 / 4) * i
          axes += `<circle cx="${centerX}" cy="${centerY}" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="0.5" stroke-dasharray="2,2"/>`
          if (index === 0) {
            const labelX = centerX + r * Math.cos(-Math.PI / 2)
            const labelY = centerY + r * Math.sin(-Math.PI / 2) + 4
            axes += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="8" fill="#9ca3af">${value}</text>`
          }
        }

        const labelX = centerX + (radius + 25) * Math.cos(angle)
        const labelY = centerY + (radius + 25) * Math.sin(angle)
        labels += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="10" font-weight="bold" fill="#374151">${comp.displayName || comp.name}</text>`
      })

      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" style="background:white;border:1px solid #e5e7eb;border-radius:8px;">
          <g>
            ${axes}
            <path d="${platformPath}" fill="rgba(16,185,129,0.12)" stroke="#10b981" stroke-width="2" stroke-dasharray="4,2"/>
            <path d="${schoolPath}" fill="rgba(249,115,22,0.15)" stroke="#f97316" stroke-width="2" stroke-dasharray="3,3"/>
            <path d="${studentPath}" fill="rgba(59,130,246,0.2)" stroke="#3b82f6" stroke-width="2"/>
            <path d="${attemptPath}" fill="rgba(139,92,246,0.2)" stroke="#8b5cf6" stroke-width="2.5"/>
            ${labels}
            <g transform="translate(${svgWidth - 130}, 24)">
              <rect x="0" y="0" width="12" height="12" fill="rgba(139,92,246,0.2)" stroke="#8b5cf6" stroke-width="1.5"/>
              <text x="18" y="10" font-size="8" fill="#374151">Este examen</text>
              <rect x="0" y="16" width="12" height="12" fill="rgba(59,130,246,0.2)" stroke="#3b82f6" stroke-width="1.5"/>
              <text x="18" y="26" font-size="8" fill="#374151">Tu promedio</text>
              <rect x="0" y="32" width="12" height="12" fill="rgba(249,115,22,0.15)" stroke="#f97316" stroke-width="1.5"/>
              <text x="18" y="42" font-size="8" fill="#374151">Colegio</text>
              <rect x="0" y="48" width="12" height="12" fill="rgba(16,185,129,0.12)" stroke="#10b981" stroke-width="1.5"/>
              <text x="18" y="58" font-size="8" fill="#374151">Plataforma</text>
            </g>
          </g>
        </svg>
      `
    }
  )

  Handlebars.registerHelper('gte', (a: number, b: number) => a >= b)
}

function loadLogoBase64(relativePublicPath: string): string | null {
  try {
    const logoPath = path.join(process.cwd(), 'public', relativePublicPath)
    if (!fs.existsSync(logoPath)) return null
    const logoBuffer = fs.readFileSync(logoPath)
    return `data:image/png;base64,${logoBuffer.toString('base64')}`
  } catch {
    return null
  }
}

async function loadSchoolLogoBase64(logoUrl: string | null | undefined): Promise<string | null> {
  if (!logoUrl) return null
  try {
    if (logoUrl.startsWith('http')) {
      const response = await fetch(logoUrl)
      if (!response.ok) return null
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const contentType = response.headers.get('content-type') || 'image/png'
      return `data:${contentType};base64,${buffer.toString('base64')}`
    }
    if (logoUrl.startsWith('/')) {
      return loadLogoBase64(logoUrl.replace(/^\//, ''))
    }
  } catch {
    return null
  }
  return null
}

export class ExamResultReportError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function generateExamResultReportPdf(resultId: string, userId: string) {
  const result = await prisma.examResult.findFirst({
    where: { id: resultId, userId },
    include: {
      exam: {
        include: {
          competency: true,
          examQuestions: { include: { competency: true } },
        },
      },
      examQuestionAnswers: {
        select: { questionId: true, isCorrect: true },
      },
      user: { include: { school: true } },
    },
  })

  if (!result) {
    throw new ExamResultReportError('Resultado no encontrado', 404)
  }
  if (!result.completedAt) {
    throw new ExamResultReportError('El examen aún no ha sido completado', 400)
  }
  if (!isExamFeedbackReleased(result.exam)) {
    throw new ExamResultReportError(
      'El reporte estará disponible cuando finalice el periodo de la prueba (fecha de cierre del examen).',
      403
    )
  }

  const defaultCompetencyLabel = result.exam.competency?.displayName || 'General'
  const attemptBreakdown = buildExamAttemptBreakdown(
    result.exam.examQuestions.map((q) => ({
      id: q.id,
      competencyId: q.competencyId || result.exam.competencyId,
      tema: q.tema,
      subtema: q.subtema,
      competency: q.competency || result.exam.competency,
    })),
    result.examQuestionAnswers.map((a) => ({
      questionId: a.questionId,
      isCorrect: a.isCorrect || false,
    })),
    defaultCompetencyLabel
  )

  const radarData = await getCompetencyRadarComparison(
    userId,
    result.user.schoolId,
    attemptBreakdown
  )

  const weakTopics = [...attemptBreakdown.byTema, ...attemptBreakdown.bySubtema]
    .filter((item) => item.total >= 2 && item.percent < 60)
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 5)

  const completedDate = result.completedAt.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const performanceLevel =
    result.score >= 90
      ? 'Excelente'
      : result.score >= 80
        ? 'Bueno'
        : result.score >= 70
          ? 'Aceptable'
          : 'Necesita mejora'

  const comparisonRows = radarData.competencies.map((comp) => ({
    name: comp.displayName,
    attempt:
      radarData.attemptScores.find((s) => s.id === comp.id)?.score ?? 0,
    student:
      radarData.studentScores.find((s) => s.id === comp.id)?.score ?? 0,
    school: radarData.schoolScores.find((s) => s.id === comp.id)?.score ?? 0,
    platform:
      radarData.platformScores.find((s) => s.id === comp.id)?.score ?? 0,
  }))

  registerCompetencyComparisonChartHelper()

  const templatePath = path.join(process.cwd(), 'templates', 'exam-report.html')
  const templateContent = fs.readFileSync(templatePath, 'utf8')
  const template = Handlebars.compile(templateContent)

  const html = template({
    studentName:
      `${result.user.firstName || ''} ${result.user.lastName || ''}`.trim() ||
      'Estudiante',
    studentDocument: result.user.documentNumber
      ? `${result.user.documentType || 'CC'}: ${result.user.documentNumber}`
      : '',
    examTitle: result.exam.title,
    competencyName: result.exam.competency?.displayName || 'Competencia',
    completedDate,
    timeTakenMinutes: result.timeTakenMinutes ?? 0,
    score: result.score,
    totalQuestions: result.totalQuestions,
    correctAnswers: result.correctAnswers,
    incorrectAnswers: result.incorrectAnswers,
    isPassed: result.isPassed || false,
    performanceLevel,
    schoolName: result.user.school?.name || 'EducaSaber',
    companyLogo: loadLogoBase64('logo-educasaber.png'),
    schoolLogo: await loadSchoolLogoBase64(result.user.school?.logoUrl),
    primaryColor: '1e40af',
    secondaryColor: 'dc2626',
    accentColor: '059669',
    competencyBreakdown: attemptBreakdown.byCompetency,
    temaBreakdown: attemptBreakdown.byTema.filter(
      (item) => item.label !== 'Sin clasificar'
    ),
    weakTopics,
    competencies: radarData.competencies,
    attemptScoresForRadar: radarData.attemptScores,
    studentScoresForRadar: radarData.studentScores,
    schoolScoresForRadar: radarData.schoolScores,
    platformScoresForRadar: radarData.platformScores,
    comparisonRows,
    generatedDate: new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  })

  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 1 })
    await page.setContent(html, { waitUntil: 'load', timeout: 60000 })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0.4in', right: '0.4in', bottom: '0.4in', left: '0.4in' },
    })

    const fileName = `reporte-examen-${result.exam.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`

    return { pdfBuffer: Buffer.from(pdfBuffer), fileName }
  } finally {
    await browser.close()
  }
}
