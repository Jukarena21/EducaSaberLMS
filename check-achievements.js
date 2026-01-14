const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAchievements() {
  try {
    console.log('🏆 Verificando logros existentes...')
    
    const achievements = await prisma.achievement.findMany({
      orderBy: { points: 'asc' }
    })
    
    console.log(`📊 Total de logros: ${achievements.length}`)
    
    if (achievements.length === 0) {
      console.log('❌ No hay logros creados')
      return
    }
    
    achievements.forEach((achievement, index) => {
      console.log(`\n🏅 Logro ${index + 1}: ${achievement.name}`)
      console.log(`   ID: ${achievement.id}`)
      console.log(`   Descripción: ${achievement.description}`)
      console.log(`   Categoría: ${achievement.category}`)
      console.log(`   Icono: ${achievement.iconName}`)
      console.log(`   Puntos: ${achievement.points}`)
      console.log(`   Activo: ${achievement.isActive ? 'Sí' : 'No'}`)
      console.log(`   Criterios: ${achievement.criteria}`)
    })
    
    // Verificar logros de usuarios
    const userAchievements = await prisma.userAchievement.findMany({
      include: {
        achievement: true,
        user: true
      },
      take: 5
    })
    
    console.log(`\n👥 Logros de usuarios (ejemplo):`)
    userAchievements.forEach((ua, index) => {
      console.log(`\n👤 Usuario ${index + 1}: ${ua.user.firstName} ${ua.user.lastName}`)
      console.log(`   Logro: ${ua.achievement.name}`)
      console.log(`   Desbloqueado: ${ua.unlockedAt}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAchievements()
