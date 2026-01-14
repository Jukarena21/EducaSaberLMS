const { PrismaClient } = require('@prisma/client')

async function checkBranding() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Verificando datos de branding...')
    
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        logoUrl: true,
        themePrimary: true,
        themeSecondary: true,
        themeAccent: true
      }
    })
    
    console.log('📊 Escuelas encontradas:', schools.length)
    
    schools.forEach(school => {
      console.log(`\n🏫 ${school.name} (ID: ${school.id})`)
      console.log(`   Logo: ${school.logoUrl || 'No configurado'}`)
      console.log(`   Primario: ${school.themePrimary || 'No configurado'}`)
      console.log(`   Secundario: ${school.themeSecondary || 'No configurado'}`)
      console.log(`   Acento: ${school.themeAccent || 'No configurado'}`)
    })
    
    // Buscar usuarios para ver a qué escuela pertenecen
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        schoolId: true
      }
    })
    
    console.log('\n👥 Usuarios y sus escuelas:')
    users.forEach(user => {
      const school = schools.find(s => s.id === user.schoolId)
      console.log(`   ${user.name} (${user.role}) -> ${school?.name || 'Sin escuela'} (ID: ${user.schoolId})`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkBranding()
