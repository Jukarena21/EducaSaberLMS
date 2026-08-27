import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { buildExamResultDetail } from '@/lib/examResultDetail'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    const gate = await requireRole(['teacher_admin', 'school_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const { resultId } = await params

    // Un school_admin solo puede abrir resultados de estudiantes de su propio colegio
    if (gate.session?.user.role === 'school_admin') {
      const owner = await prisma.examResult.findUnique({
        where: { id: resultId },
        select: { user: { select: { schoolId: true } } },
      })
      if (!owner) {
        return NextResponse.json({ error: 'Resultado no encontrado' }, { status: 404 })
      }
      if (owner.user.schoolId !== gate.session.user.schoolId) {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
      }
    }

    const detail = await buildExamResultDetail(resultId, { bypassFeedbackGate: true })

    if (detail.status === 'not_found') {
      return NextResponse.json({ error: 'Resultado no encontrado' }, { status: 404 })
    }

    return NextResponse.json(detail.payload)
  } catch (error) {
    console.error('Error fetching exam result (admin):', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
