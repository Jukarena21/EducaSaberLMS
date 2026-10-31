import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getStudentCoursesProgress } from '@/lib/progress/studentProgress'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    return NextResponse.json(await getStudentCoursesProgress(userId))

  } catch (error) {
    console.error('Error fetching course progress:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
