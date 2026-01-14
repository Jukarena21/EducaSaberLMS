import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireRole } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'

function csvEscape(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Verificar que el simulacro existe y es manual
    const exam = await prisma.exam.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        isManualSimulacro: true,
        isPublished: true,
        passingScore: true,
        examQuestions: {
          select: {
            id: true,
            tema: true,
            subtema: true,
            componente: true,
            competencyId: true,
          }
        }
      }
    })

    if (!exam || !exam.isManualSimulacro) {
      return NextResponse.json(
        { error: 'Simulacro no encontrado o no es manual' },
        { status: 404 }
      )
    }

    // Obtener resultados completados
    const results = await prisma.examResult.findMany({
      where: {
        examId: id,
        completedAt: { not: null },
        ...(schoolId
          ? { user: { schoolId } }
          : gate.session?.user.role === 'school_admin' && gate.session.user.schoolId
            ? { user: { schoolId: gate.session.user.schoolId } }
            : {}),
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

    // Agregados por metadatos y por pregunta
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
              }
            }
          }
          byQuestion[q.id].total++
          if (isCorrect) byQuestion[q.id].correct++
        }
      }
    }

    // Construir CSV
    const lines: string[] = []
    lines.push(`"Reporte Simulacro Manual","${csvEscape(exam.title)}"`)
    lines.push(`"Filtro colegio","${csvEscape(schoolId || 'Todos')}"`)
    lines.push(`"Total estudiantes",${totalStudents}`)
    lines.push(`"Intentos totales",${totalAttempts}`)
    lines.push(`"Promedio",${averageScore}%`)
    lines.push(`"Tasa de aprobación",${passRate}%`)
    lines.push("") // blank

    // Sección estudiantes
    lines.push("Estudiantes (uno por intento)")
    lines.push("Nombre,Email,Colegio,Score,¿Aprobó?,Fecha")
    results.forEach(r => {
      const name = `${r.user.firstName ?? ''} ${r.user.lastName ?? ''}`.trim()
      const schoolName = r.user.school?.name || ''
      lines.push([
        csvEscape(name),
        csvEscape(r.user.email),
        csvEscape(schoolName),
        r.score ?? 0,
        r.isPassed ? "Sí" : "No",
        r.completedAt ? new Date(r.completedAt).toISOString() : ''
      ].join(","))
    })
    lines.push("")

    // Sección por tema
    lines.push("Desglose por Tema")
    lines.push("Tema,Correctas,Total,Porcentaje")
    Object.entries(byTema).forEach(([tema, data]) => {
      const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
      lines.push([csvEscape(tema), data.correct, data.total, `${pct}%`].join(","))
    })
    lines.push("")

    // Sección por subtema
    lines.push("Desglose por Subtema")
    lines.push("Subtema,Correctas,Total,Porcentaje")
    Object.entries(bySubtema).forEach(([sub, data]) => {
      const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
      lines.push([csvEscape(sub), data.correct, data.total, `${pct}%`].join(","))
    })
    lines.push("")

    // Sección por componente
    lines.push("Desglose por Componente")
    lines.push("Componente,Correctas,Total,Porcentaje")
    Object.entries(byComponente).forEach(([comp, data]) => {
      const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
      lines.push([csvEscape(comp), data.correct, data.total, `${pct}%`].join(","))
    })
    lines.push("")

    // Sección por pregunta
    lines.push("Preguntas (más y menos respondidas)")
    lines.push("PreguntaID,Tema,Subtema,Componente,Correctas,Total,Porcentaje")
    Object.entries(byQuestion).forEach(([qid, data]) => {
      const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
      lines.push([
        qid,
        csvEscape(data.meta.tema || ''),
        csvEscape(data.meta.subtema || ''),
        csvEscape(data.meta.componente || ''),
        data.correct,
        data.total,
        `${pct}%`
      ].join(","))
    })

    const csvString = lines.join("\n")

    return new NextResponse(csvString, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reporte-simulacro-${exam.id}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting manual simulacro report CSV:', error)
    return NextResponse.json(
      { error: 'Error al exportar el reporte' },
      { status: 500 }
    )
  }
}


