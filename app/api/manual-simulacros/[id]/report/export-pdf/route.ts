import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'

const ED_PRIMARY = '#0F172A' // slate-900
const ED_SECONDARY = '#1D4ED8' // blue-700
const ED_LOGO = 'https://via.placeholder.com/200x80/3b82f6/ffffff?text=EducaSaber'

// Igual que en export-puppeteer de progreso: logo EducaSaber desde /public/logo-educasaber.png
function getCompanyLogoBase64(): string {
  try {
    const companyLogoPath = path.join(process.cwd(), 'public', 'logo-educasaber.png')
    if (fs.existsSync(companyLogoPath)) {
      const companyLogoBuffer = fs.readFileSync(companyLogoPath)
      return `data:image/png;base64,${companyLogoBuffer.toString('base64')}`
    }
  } catch (error) {
    console.warn('No se pudo cargar el logo de EducaSaber (simulacro manual)')
  }
  // Fallback coherente con otros reportes
  return 'https://via.placeholder.com/200x80/3b82f6/ffffff?text=EducaSaber'
}

function pct(correct: number, total: number) {
  return total > 0 ? Math.round((correct / total) * 100) : 0
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let browser: puppeteer.Browser | null = null
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const gate = await requireRole(['teacher_admin', 'school_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId') || undefined

    const exam = await prisma.exam.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        isManualSimulacro: true,
        isPublished: true,
      }
    })

    if (!exam || !exam.isManualSimulacro) {
      return NextResponse.json(
        { error: 'Simulacro no encontrado o no es manual' },
        { status: 404 }
      )
    }

    // Branding (colegio si se filtró, si no EducaSaber)
    let branding = {
      primary: ED_PRIMARY,
      secondary: ED_SECONDARY,
      logoUrl: ED_LOGO,
      schoolName: 'EducaSaber',
    }

    const schoolFilterId =
      schoolId ||
      (gate.session?.user.role === 'school_admin' ? gate.session.user.schoolId : undefined)

    if (schoolFilterId) {
      const school = await prisma.school.findUnique({
        where: { id: schoolFilterId },
        select: {
          name: true,
          logoUrl: true,
          themePrimary: true,
          themeSecondary: true,
        }
      })
      if (school) {
        branding = {
          primary: school.themePrimary || branding.primary,
          secondary: school.themeSecondary || branding.secondary,
          logoUrl: school.logoUrl || branding.logoUrl,
          schoolName: school.name,
        }
      }
    }

    // Resultados
    const results = await prisma.examResult.findMany({
      where: {
        examId: id,
        completedAt: { not: null },
        ...(schoolFilterId ? { user: { schoolId: schoolFilterId } } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            school: { select: { id: true, name: true } }
          }
        },
        examQuestionAnswers: {
          include: {
            question: {
              select: {
                id: true,
                tema: true,
                subtema: true,
                componente: true,
                difficultyLevel: true,
                competency: {
                  select: {
                    id: true,
                    name: true,
                    displayName: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    })

    const totalStudents = results.length
    const totalAttempts = results.length
    const averageScore = totalStudents > 0
      ? Math.round(results.reduce((s, r) => s + (r.score ?? 0), 0) / totalStudents)
      : 0
    const passRate = totalStudents > 0
      ? Math.round((results.filter(r => r.isPassed).length / totalStudents) * 100)
      : 0

    // Agregados
    const byTema: Record<string, { correct: number; total: number }> = {}
    const bySubtema: Record<string, { correct: number; total: number }> = {}
    const byComponente: Record<string, { correct: number; total: number }> = {}
    const byQuestion: Record<string, { correct: number; total: number; meta: any }> = {}

    for (const result of results) {
      for (const answer of result.examQuestionAnswers) {
        const q = answer.question
        const isCorrect = answer.isCorrect ?? false

        if (q?.tema) {
          if (!byTema[q.tema]) byTema[q.tema] = { correct: 0, total: 0 }
          byTema[q.tema].total++
          if (isCorrect) byTema[q.tema].correct++
        }
        if (q?.subtema) {
          if (!bySubtema[q.subtema]) bySubtema[q.subtema] = { correct: 0, total: 0 }
          bySubtema[q.subtema].total++
          if (isCorrect) bySubtema[q.subtema].correct++
        }
        if (q?.componente) {
          if (!byComponente[q.componente]) byComponente[q.componente] = { correct: 0, total: 0 }
          byComponente[q.componente].total++
          if (isCorrect) byComponente[q.componente].correct++
        }
        if (q) {
          if (!byQuestion[q.id]) {
            byQuestion[q.id] = {
              correct: 0,
              total: 0,
              meta: {
                tema: q.tema,
                subtema: q.subtema,
                componente: q.componente,
                dificultad: q.difficultyLevel,
                competencia: q.competency?.displayName || q.competency?.name || '',
              }
            }
          }
          byQuestion[q.id].total++
          if (isCorrect) byQuestion[q.id].correct++
        }
      }
    }

    const questionsSorted = Object.entries(byQuestion)
      .map(([id, data]) => ({
        id,
        correct: data.correct,
        total: data.total,
        pct: pct(data.correct, data.total),
        meta: data.meta,
      }))
      .sort((a, b) => a.pct - b.pct)

    const worstQuestions = questionsSorted.slice(0, 5)
    const bestQuestions = questionsSorted.slice(-5).reverse()

    const generatedAt = new Date().toLocaleDateString('es-ES')

    const companyLogo = getCompanyLogoBase64()

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; color: #1f2937; background: #f8fafc; }
    .header-gradient {
      background: linear-gradient(135deg, #3b82f6 0%, #ef4444 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      margin: 16px 16px 20px 16px;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .flex { display: flex; align-items: center; }
    .mr-4 { margin-right: 16px; }
    .text-right { text-align: right; }
    .logo-main { height: 48px; width: auto; object-fit: contain; }
    .logo-school { height: 48px; width: auto; object-fit: contain; }
    .title-main { font-size: 22px; font-weight: 700; margin: 0; color: #0f172a; }
    .subtitle-main { font-size: 13px; color: #4b5563; margin: 4px 0 0 0; }
    .underline-bar { width: 64px; height: 4px; border-radius: 9999px; background: linear-gradient(90deg, #3b82f6, #ef4444); margin: 8px auto 0 auto; }
    .section { padding: 0 16px 18px 16px; }
    .section-title { font-size: 15px; font-weight: 700; margin: 16px 0 8px 0; color: #0f172a; }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-top: 4px; }
    .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; background: #ffffff; box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
    .card h4 { margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: .4px; color: #6b7280; }
    .card .value { font-size: 22px; font-weight: 700; color: #1f2937; }
    .card .sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; background: #ffffff; border-radius: 10px; overflow: hidden; }
    th { text-align: left; background: #f9fafb; padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280; }
    td { padding: 7px 8px; border-bottom: 1px solid #e5e7eb; color: #111827; }
  </style>
</head>
<body>
  <div class="header-gradient">
    <div class="header-row">
        <div class="flex">
        <div class="mr-4">
          <img src="${companyLogo}" alt="EducaSaber" class="logo-main" />
        </div>
        <div>
          <h1 style="font-size:20px;font-weight:700;margin:0;">EducaSaber</h1>
          <p style="font-size:12px;margin:2px 0 0 0;opacity:.9;">Sistema de Gestión de Aprendizaje</p>
        </div>
      </div>
      <div class="flex">
        <div class="text-right" style="margin-right:16px;">
          <h2 style="font-size:16px;font-weight:600;margin:0;">${branding.schoolName}</h2>
          <p style="font-size:12px;margin:2px 0 0 0;opacity:.9;">Simulacro Manual</p>
          <p style="font-size:11px;margin:2px 0 0 0;opacity:.8;">${generatedAt}</p>
        </div>
        ${schoolFilterId ? `
        <div>
          <img src="${branding.logoUrl}" alt="${branding.schoolName}" class="logo-school" />
        </div>` : ``}
      </div>
    </div>
  </div>

  <div style="text-align:center;margin-top:4px;margin-bottom:8px;">
    <p class="title-main">${exam.title}</p>
    <div class="underline-bar"></div>
    <p class="subtitle-main">Resumen ejecutivo de resultados del simulacro por temas y competencias</p>
  </div>

  <div class="section">
    <div class="card-grid">
      <div class="card">
        <h4>Promedio del grupo</h4>
        <div class="value">${averageScore}%</div>
        <div class="sub">${totalStudents} estudiante(s)</div>
      </div>
      <div class="card">
        <h4>Tasa de aprobación</h4>
        <div class="value">${passRate}%</div>
        <div class="sub">Basado en completados</div>
      </div>
      <div class="card">
        <h4>Intentos totales</h4>
        <div class="value">${totalAttempts}</div>
        <div class="sub">Incluye reintentos</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Estudiantes (uno por intento)</div>
    <table>
      <thead>
        <tr><th>Nombre</th><th>Email</th><th>Colegio</th><th>Score</th><th>¿Aprobó?</th><th>Fecha</th></tr>
      </thead>
      <tbody>
        ${results.map(r => {
          const name = `${r.user.firstName ?? ''} ${r.user.lastName ?? ''}`.trim()
          const schoolName = r.user.school?.name || ''
          const score = r.score ?? 0
          const passed = r.isPassed ? 'Sí' : 'No'
          const date = r.completedAt ? new Date(r.completedAt).toLocaleDateString('es-ES') : ''
          return `<tr>
            <td>${name}</td>
            <td>${r.user.email}</td>
            <td>${schoolName}</td>
            <td>${score}%</td>
            <td>${passed}</td>
            <td>${date}</td>
          </tr>`
        }).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Desglose por Tema</div>
    <table>
      <thead><tr><th>Tema</th><th>Correctas</th><th>Total</th><th>%</th></tr></thead>
      <tbody>
        ${Object.entries(byTema).map(([tema, data]) => {
          const p = pct(data.correct, data.total)
          return `<tr><td>${tema}</td><td>${data.correct}</td><td>${data.total}</td><td>${p}%</td></tr>`
        }).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Desglose por Subtema</div>
    <table>
      <thead><tr><th>Subtema</th><th>Correctas</th><th>Total</th><th>%</th></tr></thead>
      <tbody>
        ${Object.entries(bySubtema).map(([sub, data]) => {
          const p = pct(data.correct, data.total)
          return `<tr><td>${sub}</td><td>${data.correct}</td><td>${data.total}</td><td>${p}%</td></tr>`
        }).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Desglose por Componente</div>
    <table>
      <thead><tr><th>Componente</th><th>Correctas</th><th>Total</th><th>%</th></tr></thead>
    <tbody>
      ${Object.entries(byComponente).map(([comp, data]) => {
        const p = pct(data.correct, data.total)
        return `<tr><td>${comp}</td><td>${data.correct}</td><td>${data.total}</td><td>${p}%</td></tr>`
      }).join('')}
    </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Preguntas más falladas (Top 5)</div>
    <table>
      <thead><tr><th>ID</th><th>Tema</th><th>Subtema</th><th>Componente</th><th>Correctas</th><th>Total</th><th>%</th></tr></thead>
      <tbody>
        ${worstQuestions.map(q => `
          <tr>
            <td>${q.id}</td>
            <td>${q.meta.tema || ''}</td>
            <td>${q.meta.subtema || ''}</td>
            <td>${q.meta.componente || ''}</td>
            <td>${q.correct}</td>
            <td>${q.total}</td>
            <td>${q.pct}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Preguntas más acertadas (Top 5)</div>
    <table>
      <thead><tr><th>ID</th><th>Tema</th><th>Subtema</th><th>Componente</th><th>Correctas</th><th>Total</th><th>%</th></tr></thead>
      <tbody>
        ${bestQuestions.map(q => `
          <tr>
            <td>${q.id}</td>
            <td>${q.meta.tema || ''}</td>
            <td>${q.meta.subtema || ''}</td>
            <td>${q.meta.componente || ''}</td>
            <td>${q.correct}</td>
            <td>${q.total}</td>
            <td>${q.pct}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Análisis pregunta por pregunta</div>
    <table>
      <thead>
        <tr>
          <th>ID Pregunta</th>
          <th>Tema</th>
          <th>Subtema</th>
          <th>Componente</th>
          <th>Competencia</th>
          <th>Dificultad</th>
          <th>Correctas</th>
          <th>Total</th>
          <th>% Acierto</th>
        </tr>
      </thead>
      <tbody>
        ${questionsSorted.map(q => `
          <tr>
            <td>${q.id}</td>
            <td>${q.meta.tema || ''}</td>
            <td>${q.meta.subtema || ''}</td>
            <td>${q.meta.componente || ''}</td>
            <td>${q.meta.competencia || ''}</td>
            <td>${q.meta.dificultad || ''}</td>
            <td>${q.correct}</td>
            <td>${q.total}</td>
            <td>${q.pct}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

</body>
</html>
`

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '12mm', bottom: '16mm', left: '12mm' },
    })

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-simulacro-${exam.id}${schoolFilterId ? `-colegio-${schoolFilterId}` : ''}.pdf"`,
      }
    })
  } catch (error) {
    console.error('Error exporting manual simulacro report PDF:', error)
    return NextResponse.json(
      { error: 'Error al exportar el PDF' },
      { status: 500 }
    )
  } finally {
    if (browser) await browser.close()
  }
}

