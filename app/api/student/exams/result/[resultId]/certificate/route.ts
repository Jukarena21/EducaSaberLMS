import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import Handlebars from 'handlebars'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { resultId } = await params
    const userId = session.user.id

    // Obtener el resultado del examen
    const result = await prisma.examResult.findFirst({
      where: {
        id: resultId,
        userId
      },
      include: {
        exam: {
          include: {
            competency: true
          }
        },
        user: {
          include: {
            school: true
          }
        }
      }
    })

    if (!result) {
      return NextResponse.json({ error: 'Resultado no encontrado' }, { status: 404 })
    }

    // Verificar que el examen esté completado
    if (!result.completedAt) {
      return NextResponse.json({ error: 'El examen aún no ha sido completado' }, { status: 400 })
    }

    // Obtener datos de desempeño por competencia para el gráfico radar (solo ICFES, excluir "otros")
    const competencies = await prisma.area.findMany({
      where: {
        name: { not: 'otros' }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Obtener resultados de exámenes del estudiante por competencia
    const studentExamResults = await prisma.examResult.findMany({
      where: {
        userId,
        completedAt: { not: null }
      },
      include: {
        exam: {
          include: {
            competency: true
          }
        }
      }
    })

    // Calcular promedios por competencia para el estudiante
    const studentScoresByCompetency = competencies.map(comp => {
      const exams = studentExamResults.filter(r => r.exam.competencyId === comp.id)
      const avgScore = exams.length > 0
        ? Math.round(exams.reduce((sum, e) => sum + e.score, 0) / exams.length)
        : 0
      // Asegurar que el score esté entre 0 y 100
      const clampedScore = Math.min(Math.max(avgScore, 0), 100)
      return {
        id: comp.id,
        score: clampedScore
      }
    })

    // Calcular promedios por competencia para el colegio
    const schoolExamResults = await prisma.examResult.findMany({
      where: {
        user: {
          schoolId: result.user.schoolId
        },
        completedAt: { not: null }
      },
      include: {
        exam: {
          include: {
            competency: true
          }
        }
      }
    })

    const schoolScoresByCompetency = competencies.map(comp => {
      const exams = schoolExamResults.filter(r => r.exam.competencyId === comp.id)
      const avgScore = exams.length > 0
        ? Math.round(exams.reduce((sum, e) => sum + e.score, 0) / exams.length)
        : 0
      // Asegurar que el score esté entre 0 y 100
      const clampedScore = Math.min(Math.max(avgScore, 0), 100)
      return {
        id: comp.id,
        score: clampedScore
      }
    })

    // Calcular promedios por competencia para toda la plataforma
    const platformExamResults = await prisma.examResult.findMany({
      where: {
        completedAt: { not: null }
      },
      include: {
        exam: {
          include: {
            competency: true
          }
        }
      },
      take: 10000 // Limitar para rendimiento
    })

    const platformScoresByCompetency = competencies.map(comp => {
      const exams = platformExamResults.filter(r => r.exam.competencyId === comp.id)
      const avgScore = exams.length > 0
        ? Math.round(exams.reduce((sum, e) => sum + e.score, 0) / exams.length)
        : 0
      // Asegurar que el score esté entre 0 y 100
      const clampedScore = Math.min(Math.max(avgScore, 0), 100)
      return {
        id: comp.id,
        score: clampedScore
      }
    })


    // Preparar datos para el certificado
    const fullName = `${result.user.firstName || ''} ${result.user.lastName || ''}`.trim() || 'Estudiante'
    const documentInfo = result.user.documentNumber 
      ? `${result.user.documentType || 'CC'}: ${result.user.documentNumber}`
      : ''
    
    // Convertir logo de EducaSaber a base64 para incrustarlo en el PDF
    let companyLogoBase64: string | null = null
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo-educasaber.png')
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath)
        companyLogoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`
      }
    } catch (error) {
      console.error('Error loading EducaSaber logo:', error)
    }
    
    // Convertir logo del colegio a base64 si existe
    let schoolLogoBase64: string | null = null
    if (result.user.school?.logoUrl) {
      try {
        // Si es una URL, intentar descargarla y convertirla
        if (result.user.school.logoUrl.startsWith('http')) {
          const response = await fetch(result.user.school.logoUrl)
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const contentType = response.headers.get('content-type') || 'image/png'
            schoolLogoBase64 = `data:${contentType};base64,${buffer.toString('base64')}`
          }
        } else if (result.user.school.logoUrl.startsWith('/')) {
          // Si es una ruta relativa, leer del sistema de archivos
          const logoPath = path.join(process.cwd(), 'public', result.user.school.logoUrl.replace(/^\//, ''))
          if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath)
            const ext = path.extname(logoPath).toLowerCase()
            const contentType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png'
            schoolLogoBase64 = `data:${contentType};base64,${logoBuffer.toString('base64')}`
          }
        }
      } catch (error) {
        console.error('Error loading school logo:', error)
      }
    }
    
    const certificateData = {
      studentName: fullName,
      studentDocument: documentInfo,
      examTitle: result.exam.title,
      competencyName: result.exam.competency?.displayName || 'Competencia',
      score: result.score,
      totalQuestions: result.totalQuestions,
      correctAnswers: result.correctAnswers,
      isPassed: result.isPassed || false,
      completedDate: result.completedAt.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      schoolName: result.user.school?.name || 'EducaSaber',
      schoolLogo: schoolLogoBase64,
      companyLogo: companyLogoBase64,
      // Colores de EducaSaber (sin # para usar en CSS)
      primaryColor: '1e40af', // Azul
      secondaryColor: 'dc2626', // Rojo
      accentColor: '059669', // Verde
      // Datos para el gráfico radar
      competencies: competencies.map(c => ({
        id: c.id,
        displayName: c.displayName || c.name
      })),
      studentScoresForRadar: studentScoresByCompetency,
      schoolScoresForRadar: schoolScoresByCompetency,
      platformScoresForRadar: platformScoresByCompetency
    }

    // Registrar helper de Handlebars para el gráfico radar
    Handlebars.registerHelper('radarChart', function(competencies: any[], studentScores: any[], schoolScores: any[], platformScores: any[]) {
      if (!competencies || competencies.length === 0) return ''
      
      
      const svgWidth = 500
      const svgHeight = 500
      const centerX = svgWidth / 2
      const centerY = svgHeight / 2
      const radius = 180
      const numAxes = competencies.length
      const angleStep = (2 * Math.PI) / numAxes
      const maxValue = 100 // Valor máximo fijo para la escala
      
      const getPoint = (index: number, value: number) => {
        // Limitar el valor a un máximo de 100 para que no se salga del gráfico
        const clampedValue = Math.min(Math.max(value, 0), maxValue)
        const angle = (index * angleStep) - (Math.PI / 2)
        const distance = (clampedValue / maxValue) * radius
        return {
          x: centerX + distance * Math.cos(angle),
          y: centerY + distance * Math.sin(angle)
        }
      }
      
      // Generar polígono para estudiante (azul)
      let studentPath = ''
      const studentValues: number[] = []
      competencies.forEach((comp, index) => {
        const score = studentScores.find((s: any) => s.id === comp.id)?.score || comp.score || 0
        studentValues.push(score)
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
        
        axes += `<line x1="${centerX}" y1="${centerY}" x2="${endX}" y2="${endY}" stroke="#e5e7eb" stroke-width="1"/>`
        
        // Círculos concéntricos
        for (let i = 1; i <= 4; i++) {
          const r = (radius / 4) * i
          const value = (100 / 4) * i
          axes += `<circle cx="${centerX}" cy="${centerY}" r="${r}" fill="none" stroke="#e5e7eb" stroke-width="0.5" stroke-dasharray="2,2"/>`
          if (index === 0) {
            const labelX = centerX + r * Math.cos(-Math.PI / 2)
            const labelY = centerY + r * Math.sin(-Math.PI / 2) + 4
            axes += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="8" fill="#9ca3af" font-weight="500">${value}</text>`
          }
        }
        
        const labelX = centerX + (radius + 25) * Math.cos(angle)
        const labelY = centerY + (radius + 25) * Math.sin(angle)
        labels += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="10" font-weight="bold" fill="#374151">${comp.displayName || comp.name}</text>`
      })
      
      // Calcular el padding necesario para las etiquetas y leyenda
      const padding = 60
      const viewBoxX = -padding
      const viewBoxY = -padding
      const viewBoxWidth = svgWidth + (padding * 2)
      const viewBoxHeight = svgHeight + (padding * 2)
      
      return `
        <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; max-width: 100%; height: auto; overflow: hidden;">
          <defs>
            <clipPath id="chartClip">
              <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}"/>
            </clipPath>
          </defs>
          <g clip-path="url(#chartClip)">
            ${axes}
            <path d="${platformPath}" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="2" stroke-dasharray="4,2"/>
            <path d="${schoolPath}" fill="rgba(249, 115, 22, 0.2)" stroke="#f97316" stroke-width="2" stroke-dasharray="3,3"/>
            <path d="${studentPath}" fill="rgba(59, 130, 246, 0.3)" stroke="#3b82f6" stroke-width="2.5"/>
            ${labels}
            <g transform="translate(${svgWidth - 120}, 30)">
              <rect x="0" y="0" width="14" height="14" fill="rgba(59, 130, 246, 0.3)" stroke="#3b82f6" stroke-width="1.5"/>
              <text x="20" y="11" font-size="9" fill="#374151" font-weight="bold">Estudiante</text>
              <rect x="0" y="18" width="14" height="14" fill="rgba(249, 115, 22, 0.2)" stroke="#f97316" stroke-width="1.5" stroke-dasharray="3,3"/>
              <text x="20" y="29" font-size="9" fill="#374151" font-weight="bold">Promedio Colegio</text>
              <rect x="0" y="36" width="14" height="14" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4,2"/>
              <text x="20" y="47" font-size="9" fill="#374151" font-weight="bold">Promedio Plataforma</text>
            </g>
            <text x="${centerX}" y="20" text-anchor="middle" font-size="12" font-weight="bold" fill="#1f2937">Desempeño por Competencia</text>
          </g>
        </svg>
      `
    })

    // Cargar plantilla Handlebars
    const templatePath = path.join(process.cwd(), 'templates', 'exam-certificate.html')
    let templateContent: string

    try {
      templateContent = fs.readFileSync(templatePath, 'utf8')
    } catch (error) {
      // Si no existe la plantilla, crear una básica
      templateContent = getDefaultTemplate()
    }

    // Compilar plantilla
    const template = Handlebars.compile(templateContent)
    const html = template(certificateData)

    // Generar PDF con Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    
    // Configurar viewport para orientación horizontal (A4 landscape) con más altura para el gráfico
    await page.setViewport({
      width: 1200, // Ancho mayor para acomodar el gráfico completo
      height: 1000, // Altura mayor para mejor renderizado
      deviceScaleFactor: 1
    })
    
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true, // Orientación horizontal
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

    // Retornar el PDF
    const fileName = `certificado-${result.exam.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    })

  } catch (error) {
    console.error('Error generating certificate:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

function getDefaultTemplate(): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificado de Examen</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 40px;
      min-height: 100vh;
    }
    
    .certificate {
      background: white;
      border: 8px solid {{primaryColor}};
      border-radius: 20px;
      padding: 60px;
      max-width: 800px;
      margin: 0 auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      position: relative;
    }
    
    .certificate::before {
      content: '';
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      border: 2px solid {{secondaryColor}};
      border-radius: 20px;
      z-index: -1;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid {{primaryColor}};
      padding-bottom: 20px;
    }
    
    .logo {
      max-width: 150px;
      margin-bottom: 20px;
    }
    
    .title {
      font-size: 48px;
      font-weight: bold;
      color: {{primaryColor}};
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 3px;
    }
    
    .subtitle {
      font-size: 24px;
      color: #666;
      font-style: italic;
    }
    
    .content {
      text-align: center;
      margin: 40px 0;
    }
    
    .certificate-text {
      font-size: 18px;
      line-height: 1.8;
      color: #333;
      margin-bottom: 30px;
    }
    
    .student-name {
      font-size: 36px;
      font-weight: bold;
      color: {{primaryColor}};
      margin: 20px 0;
      text-decoration: underline;
      text-decoration-color: {{secondaryColor}};
      text-decoration-thickness: 3px;
    }
    
    .exam-details {
      background: #f9fafb;
      border-left: 4px solid {{accentColor}};
      padding: 20px;
      margin: 30px 0;
      text-align: left;
    }
    
    .exam-details h3 {
      color: {{primaryColor}};
      margin-bottom: 15px;
      font-size: 20px;
    }
    
    .exam-details p {
      margin: 8px 0;
      font-size: 16px;
      color: #555;
    }
    
    .score-display {
      text-align: center;
      margin: 40px 0;
      padding: 30px;
      background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%);
      border-radius: 15px;
      color: white;
    }
    
    .score-number {
      font-size: 72px;
      font-weight: bold;
      margin: 10px 0;
    }
    
    .score-label {
      font-size: 24px;
      opacity: 0.9;
    }
    
    .status-badge {
      display: inline-block;
      padding: 15px 40px;
      border-radius: 50px;
      font-size: 20px;
      font-weight: bold;
      margin: 20px 0;
      {{#if isPassed}}
      background: {{accentColor}};
      color: white;
      {{else}}
      background: {{secondaryColor}};
      color: white;
      {{/if}}
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 30px;
      border-top: 2px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    .signature {
      text-align: center;
      flex: 1;
    }
    
    .signature-line {
      border-top: 2px solid #333;
      width: 200px;
      margin: 50px auto 10px;
    }
    
    .signature-name {
      font-weight: bold;
      color: {{primaryColor}};
    }
    
    .date {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-top: 30px;
    }
    
    .seal {
      position: absolute;
      bottom: 40px;
      right: 40px;
      width: 100px;
      height: 100px;
      border: 3px solid {{primaryColor}};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      font-size: 12px;
      text-align: center;
      color: {{primaryColor}};
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      {{#if companyLogo}}
      <img src="{{companyLogo}}" alt="Logo" class="logo">
      {{/if}}
      <h1 class="title">Certificado</h1>
      <p class="subtitle">de Presentación de Examen</p>
    </div>
    
    <div class="content">
      <p class="certificate-text">
        Se certifica que
      </p>
      
      <div class="student-name">
        {{studentName}}
      </div>
      
      <p class="certificate-text">
        ha completado exitosamente el examen
      </p>
      
      <div class="exam-details">
        <h3>Detalles del Examen</h3>
        <p><strong>Examen:</strong> {{examTitle}}</p>
        <p><strong>Competencia:</strong> {{competencyName}}</p>
        <p><strong>Fecha de Presentación:</strong> {{completedDate}}</p>
        <p><strong>Preguntas Respondidas:</strong> {{correctAnswers}} de {{totalQuestions}}</p>
      </div>
      
      <div class="score-display">
        <div class="score-number">{{score}}%</div>
        <div class="score-label">Puntaje Obtenido</div>
      </div>
      
      <div class="status-badge">
        {{#if isPassed}}
        ✓ APROBADO
        {{else}}
        REPROBADO
        {{/if}}
      </div>
    </div>
    
    <div class="footer">
      <div class="signature">
        <div class="signature-line"></div>
        <div class="signature-name">{{schoolName}}</div>
        <div style="color: #666; font-size: 12px; margin-top: 5px;">Institución Educativa</div>
      </div>
    </div>
    
    <div class="date">
      Fecha de emisión: {{completedDate}}
    </div>
    
    <div class="seal">
      <div>
        SELLO<br>
        OFICIAL
      </div>
    </div>
  </div>
</body>
</html>
  `
}
