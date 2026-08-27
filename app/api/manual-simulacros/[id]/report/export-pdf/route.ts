import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { launchBrowser } from '@/lib/pdf/launchBrowser'
import type { Browser } from 'puppeteer-core'
import fs from 'fs'
import path from 'path'
import {
  buildQuestionReportRows,
  groupRowsByArea,
  pct,
  type QuestionReportRow,
} from '@/lib/reports/manualSimulacroReport'

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

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function pctClass(value: number): string {
  if (value >= 70) return 'pct-good'
  if (value >= 40) return 'pct-mid'
  return 'pct-bad'
}

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let browser: Browser | null = null
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
        examQuestions: {
          select: {
            id: true,
            orderIndex: true,
            tema: true,
            subtema: true,
            componente: true,
            competencia: true,
            difficultyLevel: true,
            competency: { select: { id: true, name: true, displayName: true } },
          },
          orderBy: { orderIndex: 'asc' },
        },
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

    // Una fila por pregunta del simulacro, numeradas por orden de presentación
    const allAnswers = results.flatMap((r) =>
      r.examQuestionAnswers.map((a) => ({
        questionId: a.questionId,
        isCorrect: a.isCorrect,
      }))
    )
    const questionRows = buildQuestionReportRows(exam.examQuestions, allAnswers)
    const areaGroups = groupRowsByArea(questionRows)

    // Agregados por metadato, calculados sobre las filas ya normalizadas
    const aggregate = (key: keyof Pick<QuestionReportRow, 'tema' | 'subtema' | 'componente' | 'competencia'>) => {
      const map = new Map<string, { correct: number; total: number }>()
      for (const row of questionRows) {
        const bucket = row[key]
        if (bucket === '—') continue
        const entry = map.get(bucket) ?? { correct: 0, total: 0 }
        entry.correct += row.correct
        entry.total += row.total
        map.set(bucket, entry)
      }
      return Array.from(map.entries())
        .map(([name, data]) => ({ name, ...data, pct: pct(data.correct, data.total) }))
        .sort((a, b) => a.pct - b.pct)
    }

    const byTema = aggregate('tema')
    const bySubtema = aggregate('subtema')
    const byComponente = aggregate('componente')

    const answeredRows = questionRows.filter((q) => q.total > 0)
    const rankedByDifficulty = [...answeredRows].sort((a, b) => a.pct - b.pct)
    const worstQuestions = rankedByDifficulty.slice(0, 5)
    const bestQuestions = rankedByDifficulty.slice(-5).reverse()

    const generatedAt = new Date().toLocaleDateString('es-ES')

    const companyLogo = getCompanyLogoBase64()

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    @page { size: A4; margin: 14mm 12mm 16mm 12mm; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      color: #1f2937;
      background: #ffffff;
      font-size: 10px;
      line-height: 1.45;
    }

    .header-gradient {
      background: linear-gradient(135deg, #3b82f6 0%, #ef4444 100%);
      color: white;
      padding: 14px 18px;
      border-radius: 10px;
      margin-bottom: 16px;
    }
    .header-row { display: flex; justify-content: space-between; align-items: center; }
    .flex { display: flex; align-items: center; }
    .mr-4 { margin-right: 14px; }
    .text-right { text-align: right; }
    .logo-main, .logo-school { height: 40px; width: auto; object-fit: contain; }

    .title-main { font-size: 20px; font-weight: 700; margin: 0; color: #0f172a; }
    .subtitle-main { font-size: 11px; color: #4b5563; margin: 4px 0 0 0; }
    .underline-bar { width: 60px; height: 3px; border-radius: 9999px; background: linear-gradient(90deg, #3b82f6, #ef4444); margin: 8px auto 0 auto; }

    /* Una sección nunca debe empezar al final de una página y continuar sola */
    .section { margin-bottom: 18px; }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #0f172a;
      padding-bottom: 5px;
      border-bottom: 2px solid #e5e7eb;
      break-after: avoid;
      page-break-after: avoid;
    }
    .section-hint { font-size: 9px; color: #6b7280; margin: -4px 0 8px 0; }

    .page-break { page-break-before: always; }

    .card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px 12px; background: #ffffff; }
    .card h4 { margin: 0 0 4px 0; font-size: 9px; text-transform: uppercase; letter-spacing: .4px; color: #6b7280; }
    .card .value { font-size: 20px; font-weight: 700; color: #111827; }
    .card .sub { font-size: 9px; color: #6b7280; margin-top: 2px; }

    /* table-layout fijo: sin esto las columnas cambian de ancho entre páginas
       y las etiquetas de competencia parecen "moverse" */
    table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
      font-size: 9px;
      background: #ffffff;
    }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; break-inside: avoid; }
    th {
      text-align: left;
      background: #f1f5f9;
      padding: 6px 7px;
      border: 1px solid #e2e8f0;
      color: #334155;
      font-weight: 700;
      font-size: 9px;
    }
    td {
      padding: 5px 7px;
      border: 1px solid #e5e7eb;
      color: #111827;
      vertical-align: top;
      overflow-wrap: break-word;
      word-break: break-word;
      hyphens: auto;
    }
    tbody tr:nth-child(even) td { background: #fafafa; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .center { text-align: center; }

    .area-block { margin-bottom: 14px; }
    .area-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px 8px 0 0;
      padding: 6px 10px;
      break-after: avoid;
      page-break-after: avoid;
    }
    .area-head .name { font-weight: 700; font-size: 11px; color: #1e3a8a; }
    .area-head .meta { font-size: 9px; color: #1d4ed8; }

    .pct-pill {
      display: inline-block;
      min-width: 34px;
      text-align: center;
      padding: 1px 5px;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 9px;
    }
    .pct-good { background: #dcfce7; color: #166534; }
    .pct-mid { background: #fef3c7; color: #92400e; }
    .pct-bad { background: #fee2e2; color: #991b1b; }

    .empty { font-size: 9px; color: #6b7280; font-style: italic; padding: 6px 0; }

    .footer-note {
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
      font-size: 8px;
      color: #9ca3af;
      text-align: center;
    }
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
          <h1 style="font-size:18px;font-weight:700;margin:0;">EducaSaber</h1>
          <p style="font-size:11px;margin:2px 0 0 0;opacity:.9;">Sistema de Gestión de Aprendizaje</p>
        </div>
      </div>
      <div class="flex">
        <div class="text-right" style="margin-right:14px;">
          <h2 style="font-size:14px;font-weight:600;margin:0;">${escapeHtml(branding.schoolName)}</h2>
          <p style="font-size:11px;margin:2px 0 0 0;opacity:.9;">Simulacro Manual</p>
          <p style="font-size:10px;margin:2px 0 0 0;opacity:.8;">${generatedAt}</p>
        </div>
        ${schoolFilterId ? `
        <div>
          <img src="${branding.logoUrl}" alt="${escapeHtml(branding.schoolName)}" class="logo-school" />
        </div>` : ``}
      </div>
    </div>
  </div>

  <div style="text-align:center;margin-bottom:14px;">
    <p class="title-main">${escapeHtml(exam.title)}</p>
    <div class="underline-bar"></div>
    <p class="subtitle-main">Resultados del simulacro por área, competencia y pregunta</p>
  </div>

  <div class="section">
    <div class="section-title">Resumen general</div>
    <div class="card-grid">
      <div class="card">
        <h4>Promedio del grupo</h4>
        <div class="value">${averageScore}%</div>
        <div class="sub">${totalStudents} estudiante(s)</div>
      </div>
      <div class="card">
        <h4>Tasa de aprobación</h4>
        <div class="value">${passRate}%</div>
        <div class="sub">Sobre exámenes completados</div>
      </div>
      <div class="card">
        <h4>Preguntas del simulacro</h4>
        <div class="value">${questionRows.length}</div>
        <div class="sub">${answeredRows.length} con respuestas registradas</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Desempeño por área</div>
    ${areaGroups.length === 0 ? `<p class="empty">Sin datos de área para este simulacro.</p>` : `
    <table>
      <colgroup>
        <col style="width:46%" />
        <col style="width:18%" />
        <col style="width:18%" />
        <col style="width:18%" />
      </colgroup>
      <thead>
        <tr><th>Área</th><th class="num">Preguntas</th><th class="num">Aciertos</th><th class="center">% Acierto</th></tr>
      </thead>
      <tbody>
        ${areaGroups.map(g => `
          <tr>
            <td>${escapeHtml(g.area)}</td>
            <td class="num">${g.rows.length}</td>
            <td class="num">${g.correct} / ${g.total}</td>
            <td class="center"><span class="pct-pill ${pctClass(g.pct)}">${g.pct}%</span></td>
          </tr>`).join('')}
      </tbody>
    </table>`}
  </div>

  <div class="section">
    <div class="section-title">Preguntas más falladas</div>
    <div class="section-hint">Las 5 preguntas con menor porcentaje de acierto del grupo.</div>
    ${worstQuestions.length === 0 ? `<p class="empty">Aún no hay respuestas registradas.</p>` : `
    <table>
      <colgroup>
        <col style="width:8%" /><col style="width:24%" /><col style="width:24%" />
        <col style="width:20%" /><col style="width:12%" /><col style="width:12%" />
      </colgroup>
      <thead>
        <tr><th class="num">N.º</th><th>Área</th><th>Competencia</th><th>Tema</th><th class="num">Aciertos</th><th class="center">%</th></tr>
      </thead>
      <tbody>
        ${worstQuestions.map(q => `
          <tr>
            <td class="num">${q.number}</td>
            <td>${escapeHtml(q.area)}</td>
            <td>${escapeHtml(q.competencia)}</td>
            <td>${escapeHtml(q.tema)}</td>
            <td class="num">${q.correct} / ${q.total}</td>
            <td class="center"><span class="pct-pill ${pctClass(q.pct)}">${q.pct}%</span></td>
          </tr>`).join('')}
      </tbody>
    </table>`}
  </div>

  <div class="section">
    <div class="section-title">Preguntas mejor resueltas</div>
    <div class="section-hint">Las 5 preguntas con mayor porcentaje de acierto del grupo.</div>
    ${bestQuestions.length === 0 ? `<p class="empty">Aún no hay respuestas registradas.</p>` : `
    <table>
      <colgroup>
        <col style="width:8%" /><col style="width:24%" /><col style="width:24%" />
        <col style="width:20%" /><col style="width:12%" /><col style="width:12%" />
      </colgroup>
      <thead>
        <tr><th class="num">N.º</th><th>Área</th><th>Competencia</th><th>Tema</th><th class="num">Aciertos</th><th class="center">%</th></tr>
      </thead>
      <tbody>
        ${bestQuestions.map(q => `
          <tr>
            <td class="num">${q.number}</td>
            <td>${escapeHtml(q.area)}</td>
            <td>${escapeHtml(q.competencia)}</td>
            <td>${escapeHtml(q.tema)}</td>
            <td class="num">${q.correct} / ${q.total}</td>
            <td class="center"><span class="pct-pill ${pctClass(q.pct)}">${q.pct}%</span></td>
          </tr>`).join('')}
      </tbody>
    </table>`}
  </div>

  <div class="section page-break">
    <div class="section-title">Análisis pregunta por pregunta</div>
    <div class="section-hint">Agrupado por área y en el orden en que las preguntas aparecen en el simulacro.</div>
    ${areaGroups.length === 0 ? `<p class="empty">Este simulacro no tiene preguntas registradas.</p>` : areaGroups.map(g => `
      <div class="area-block">
        <div class="area-head">
          <span class="name">${escapeHtml(g.area)}</span>
          <span class="meta">${g.rows.length} pregunta(s) · ${g.pct}% de acierto</span>
        </div>
        <table>
          <colgroup>
            <col style="width:7%" /><col style="width:21%" /><col style="width:19%" />
            <col style="width:19%" /><col style="width:12%" /><col style="width:11%" /><col style="width:11%" />
          </colgroup>
          <thead>
            <tr>
              <th class="num">N.º</th>
              <th>Competencia</th>
              <th>Componente</th>
              <th>Tema</th>
              <th>Dificultad</th>
              <th class="num">Aciertos</th>
              <th class="center">%</th>
            </tr>
          </thead>
          <tbody>
            ${g.rows.map(q => `
              <tr>
                <td class="num">${q.number}</td>
                <td>${escapeHtml(q.competencia)}</td>
                <td>${escapeHtml(q.componente)}</td>
                <td>${escapeHtml(q.tema)}</td>
                <td>${escapeHtml(q.dificultad)}</td>
                <td class="num">${q.correct} / ${q.total}</td>
                <td class="center"><span class="pct-pill ${pctClass(q.pct)}">${q.pct}%</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`).join('')}
  </div>

  <div class="section page-break">
    <div class="section-title">Desglose por componente</div>
    ${byComponente.length === 0 ? `<p class="empty">Sin componentes registrados.</p>` : `
    <table>
      <colgroup><col style="width:52%" /><col style="width:16%" /><col style="width:16%" /><col style="width:16%" /></colgroup>
      <thead><tr><th>Componente</th><th class="num">Correctas</th><th class="num">Total</th><th class="center">%</th></tr></thead>
      <tbody>
        ${byComponente.map(c => `
          <tr>
            <td>${escapeHtml(c.name)}</td>
            <td class="num">${c.correct}</td>
            <td class="num">${c.total}</td>
            <td class="center"><span class="pct-pill ${pctClass(c.pct)}">${c.pct}%</span></td>
          </tr>`).join('')}
      </tbody>
    </table>`}
  </div>

  <div class="section">
    <div class="section-title">Desglose por tema</div>
    ${byTema.length === 0 ? `<p class="empty">Sin temas registrados.</p>` : `
    <table>
      <colgroup><col style="width:52%" /><col style="width:16%" /><col style="width:16%" /><col style="width:16%" /></colgroup>
      <thead><tr><th>Tema</th><th class="num">Correctas</th><th class="num">Total</th><th class="center">%</th></tr></thead>
      <tbody>
        ${byTema.map(t => `
          <tr>
            <td>${escapeHtml(t.name)}</td>
            <td class="num">${t.correct}</td>
            <td class="num">${t.total}</td>
            <td class="center"><span class="pct-pill ${pctClass(t.pct)}">${t.pct}%</span></td>
          </tr>`).join('')}
      </tbody>
    </table>`}
  </div>

  <div class="section">
    <div class="section-title">Desglose por subtema</div>
    ${bySubtema.length === 0 ? `<p class="empty">Sin subtemas registrados.</p>` : `
    <table>
      <colgroup><col style="width:52%" /><col style="width:16%" /><col style="width:16%" /><col style="width:16%" /></colgroup>
      <thead><tr><th>Subtema</th><th class="num">Correctas</th><th class="num">Total</th><th class="center">%</th></tr></thead>
      <tbody>
        ${bySubtema.map(s => `
          <tr>
            <td>${escapeHtml(s.name)}</td>
            <td class="num">${s.correct}</td>
            <td class="num">${s.total}</td>
            <td class="center"><span class="pct-pill ${pctClass(s.pct)}">${s.pct}%</span></td>
          </tr>`).join('')}
      </tbody>
    </table>`}
  </div>

  <div class="section page-break">
    <div class="section-title">Estudiantes</div>
    <div class="section-hint">Un registro por intento completado.</div>
    ${results.length === 0 ? `<p class="empty">Ningún estudiante ha completado este simulacro.</p>` : `
    <table>
      <colgroup>
        <col style="width:26%" /><col style="width:28%" /><col style="width:20%" />
        <col style="width:9%" /><col style="width:8%" /><col style="width:9%" />
      </colgroup>
      <thead>
        <tr><th>Nombre</th><th>Email</th><th>Colegio</th><th class="center">Puntaje</th><th class="center">Aprobó</th><th class="center">Fecha</th></tr>
      </thead>
      <tbody>
        ${results.map(r => {
          const name = `${r.user.firstName ?? ''} ${r.user.lastName ?? ''}`.trim()
          const schoolName = r.user.school?.name || '—'
          const score = r.score ?? 0
          const date = r.completedAt ? new Date(r.completedAt).toLocaleDateString('es-ES') : '—'
          return `<tr>
            <td>${escapeHtml(name)}</td>
            <td>${escapeHtml(r.user.email)}</td>
            <td>${escapeHtml(schoolName)}</td>
            <td class="center"><span class="pct-pill ${pctClass(score)}">${score}%</span></td>
            <td class="center">${r.isPassed ? 'Sí' : 'No'}</td>
            <td class="center">${date}</td>
          </tr>`
        }).join('')}
      </tbody>
    </table>`}
  </div>

  <div class="footer-note">
    Reporte generado el ${generatedAt} · EducaSaber LMS
  </div>
</body>
</html>
`

    browser = await launchBrowser()
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

