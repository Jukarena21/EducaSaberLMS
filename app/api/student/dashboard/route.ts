import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'student') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const userId = session.user.id

    // KPIs básicos
    const [coursesCount, examAttemptsCount] = await Promise.all([
      prisma.courseEnrollment.count({ where: { userId, status: 'active' } }).catch(() => 0),
      prisma.examResult.count({ where: { userId } }).catch(() => 0),
    ])

    // Promedio y tiempo (simples agregados; ajustar si hay tracking detallado)
    const results = await prisma.examResult.findMany({ where: { userId }, select: { score: true, durationMinutes: true }, orderBy: { createdAt: 'desc' }, take: 20 }).catch(() => [])
    const avg = results.length ? results.reduce((s, r) => s + (r.score || 0), 0) / results.length : 0
    const timeMinutes = results.reduce((s, r) => s + (r.durationMinutes || 0), 0)

    // Próximos exámenes: asignaciones del usuario en el futuro
    const now = new Date()
    const upcoming = await prisma.examAssignment.findMany({
      where: { userId, exam: { startAt: { gt: now } } },
      select: { exam: { select: { id: true, title: true, startAt: true, durationMinutes: true } } },
      orderBy: { exam: { startAt: 'asc' } },
      take: 5,
    }).catch(() => [])

    // Actividad reciente: últimos eventos de examen/curso
    const recent = await prisma.examResult.findMany({
      where: { userId },
      select: { id: true, score: true, exam: { select: { title: true } }, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }).catch(() => [])

    return NextResponse.json({
      kpis: {
        activeCourses: coursesCount,
        examCompleted: examAttemptsCount,
        studyTimeMinutes: timeMinutes,
        averageScore: Number(avg.toFixed(1)),
      },
      upcomingExams: upcoming.map(u => ({
        id: u.exam?.id,
        title: u.exam?.title,
        startAt: u.exam?.startAt,
        durationMinutes: u.exam?.durationMinutes || 0,
      })),
      recentActivity: recent.map(r => ({
        type: 'exam_completed',
        title: r.exam?.title,
        score: r.score,
        createdAt: r.createdAt,
      })),
    })
  } catch (e) {
    console.error('GET /api/student/dashboard', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}


