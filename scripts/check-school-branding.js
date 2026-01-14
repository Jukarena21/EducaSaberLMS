const { PrismaClient } = require('@prisma/client')

async function checkSchoolBranding() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Verificando branding del colegio...')
    
    // Obtener el colegio de prueba
    const school = await prisma.school.findUnique({
      where: { id: 'test-school-1' },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        themePrimary: true,
        themeSecondary: true,
        themeAccent: true
      }
    })
    
    if (!school) {
      console.log('❌ Colegio no encontrado')
      return
    }
    
    console.log('🏫 Colegio encontrado:', school.name)
    console.log('   ID:', school.id)
    console.log('   Logo:', school.logoUrl || 'No configurado')
    console.log('   Color Primario:', school.themePrimary || 'No configurado')
    console.log('   Color Secundario:', school.themeSecondary || 'No configurado')
    console.log('   Color Acento:', school.themeAccent || 'No configurado')
    
    // Verificar usuarios del colegio
    const users = await prisma.user.findMany({
      where: { schoolId: school.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        email: true
      }
    })
    
    console.log('\n👥 Usuarios del colegio:')
    users.forEach(user => {
      console.log(`   ${user.firstName} ${user.lastName} (${user.role}) - ${user.email}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkSchoolBranding()
