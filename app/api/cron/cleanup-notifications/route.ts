import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Endpoint para limpieza automática de notificaciones expiradas
 * Diseñado para ser llamado por un cron job (Vercel Cron, GitHub Actions, etc.)
 * 
 * Seguridad: Usa un secret token en el header para prevenir llamadas no autorizadas
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar el secret token para seguridad
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'default-secret-change-in-production'
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
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
      timestamp: now.toISOString(),
      message: `Se eliminaron ${result.count} notificaciones expiradas automáticamente`
    })
  } catch (error) {
    console.error('Error en limpieza automática de notificaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint para verificar el estado del cron job
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'default-secret-change-in-production'
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const now = new Date()
    
    const expiredCount = await prisma.notification.count({
      where: {
        expiresAt: {
          lt: now
        }
      }
    })

    const totalCount = await prisma.notification.count()
    const activeCount = totalCount - expiredCount

    return NextResponse.json({
      status: 'ok',
      total: totalCount,
      active: activeCount,
      expired: expiredCount,
      percentageExpired: totalCount > 0 ? Math.round((expiredCount / totalCount) * 100) : 0,
      timestamp: now.toISOString()
    })
  } catch (error) {
    console.error('Error verificando estado de notificaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

