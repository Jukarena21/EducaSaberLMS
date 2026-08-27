import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { buildExamResultDetail } from '@/lib/examResultDetail'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resultId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { resultId } = await params

    const detail = await buildExamResultDetail(resultId, { userId: session.user.id })

    if (detail.status === 'not_found') {
      return NextResponse.json({ error: 'Resultado no encontrado' }, { status: 404 })
    }

    return NextResponse.json(detail.payload)
  } catch (error) {
    console.error('Error fetching exam result:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
