import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AchievementService } from '@/lib/achievementService'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    console.log(`[Check Achievements API] Verificación manual de logros para usuario ${userId}`)

    // Verificar y desbloquear todos los logros posibles
    const unlockedAchievements = await AchievementService.checkAndUnlockAllAchievements(userId)

    console.log(`[Check Achievements API] Resultado: ${unlockedAchievements.length} logros desbloqueados`)

    return NextResponse.json({
      success: true,
      unlockedAchievements,
      count: unlockedAchievements.length
    })

  } catch (error) {
    console.error('[Check Achievements API] Error checking achievements:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const achievementId = searchParams.get('achievementId')

    if (achievementId) {
      // Verificar un logro específico
      const result = await AchievementService.checkAchievement(userId, achievementId)
      return NextResponse.json(result)
    } else {
      // Verificar todos los logros
      const unlockedAchievements = await AchievementService.checkAndUnlockAllAchievements(userId)
      return NextResponse.json({
        unlockedAchievements,
        count: unlockedAchievements.length
      })
    }

  } catch (error) {
    console.error('Error checking achievements:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
