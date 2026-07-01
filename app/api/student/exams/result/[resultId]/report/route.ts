import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { resultId } = await params
    const { pdfBuffer, fileName } = await generateExamResultReportPdf(
      resultId,
      session.user.id
    )

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    if (error instanceof ExamResultReportError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Error generating exam report PDF:', error)
    const detail = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { error: 'Error al generar el reporte PDF', detail },
      { status: 500 }
    )
  }
}
