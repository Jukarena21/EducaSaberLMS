import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * Endpoint para limpiar notificaciones expiradas
 * Se puede llamar manualmente o desde un cron job
 */
export async function POST(request: NextRequest) {
  try {
    // Solo admin general puede ejecutar la limpieza (mantenimiento global del sistema)
    const gate = await requireRole(['teacher_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: 'Solo el administrador general puede limpiar notificaciones expiradas' }, { status: 403 })
    }

    const now = new Date()
    
    // Eliminar notificaciones expiradas (expiresAt < now)
    const result = await prisma.notification.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    })

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Se eliminaron ${result.count} notificaciones expiradas`
    })
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint para obtener estadísticas de notificaciones expiradas
 */
export async function GET(request: NextRequest) {
  try {
    const gate = await requireRole(['teacher_admin', 'school_admin'])
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }

    const session = await getServerSession(authOptions)
    const schoolId = session?.user?.schoolId
    const now = new Date()
    
    // Obtener IDs de estudiantes si es school_admin
    let studentIds: string[] | undefined
    if (session?.user?.role === 'school_admin' && schoolId) {
      const schoolStudents = await prisma.user.findMany({
        where: { role: 'student', schoolId },
        select: { id: true }
      })
      studentIds = schoolStudents.map(s => s.id)
    }
    
    // Construir filtro según el rol
    const baseWhere: any = {
      expiresAt: {
        lt: now
      }
    }
    
    if (studentIds) {
      baseWhere.userId = { in: studentIds }
    }
    
    const expiredCount = await prisma.notification.count({
      where: baseWhere
    })

    // Contar totales con el mismo filtro
    const totalWhere = studentIds 
      ? { userId: { in: studentIds } }
      : {}
    
    const totalCount = await prisma.notification.count({ where: totalWhere })
    const activeCount = totalCount - expiredCount

    return NextResponse.json({
      total: totalCount,
      active: activeCount,
      expired: expiredCount,
      percentageExpired: totalCount > 0 ? Math.round((expiredCount / totalCount) * 100) : 0
    })
  } catch (error) {
    console.error('Error getting notification stats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

