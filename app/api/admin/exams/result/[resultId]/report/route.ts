import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import {
  ExamResultReportError,
  generateExamResultReportPdf,
} from '@/lib/pdf/examResultReportService'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    const gate = await requireRole(['teacher_admin', 'school_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { resultId } = await params

    const owner = await prisma.examResult.findUnique({
      where: { id: resultId },
      select: { userId: true, user: { select: { schoolId: true } } },
    })

    if (!owner) {
      return NextResponse.json({ error: 'Resultado no encontrado' }, { status: 404 })
    }

    // Un school_admin solo puede descargar reportes de su propio colegio
    if (
      gate.session?.user.role === 'school_admin' &&
      owner.user.schoolId !== gate.session.user.schoolId
    ) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { pdfBuffer, fileName } = await generateExamResultReportPdf(resultId, owner.userId, {
      bypassFeedbackGate: true,
    })

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    if (error instanceof ExamResultReportError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Error generating exam result report (admin):', error)
    return NextResponse.json(
      { error: 'Error al generar el reporte' },
      { status: 500 }
    )
  }
}
