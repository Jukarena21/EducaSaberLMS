import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isStudySection, recordLessonStudyTime } from '@/lib/studyTime'

/**
 * Recibe el tiempo activo de estudio de una lección. Se llama cada minuto y al
 * salir de la página (con sendBeacon), así que nunca debe bloquear la lección:
 * ante cualquier problema responde sin error visible para el estudiante.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { lessonId } = await params
    const body = await request.json().catch(() => null)
    const entries = Array.isArray(body?.entries)
      ? body.entries
          .filter((e: any) => isStudySection(e?.section) && typeof e?.seconds === 'number')
          .map((e: any) => ({ section: e.section, seconds: e.seconds }))
      : []

    const result = await recordLessonStudyTime(session.user.id, lessonId, entries)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Error registrando tiempo de estudio:', error)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
