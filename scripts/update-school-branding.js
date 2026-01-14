const { PrismaClient } = require('@prisma/client')

async function updateSchoolBranding() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🎨 Actualizando branding del colegio...')
    
    // Actualizar el colegio con nuevos colores
    const updatedSchool = await prisma.school.update({
      where: { id: 'test-school-1' },
      data: {
        logoUrl: 'https://via.placeholder.com/100x100/8B5CF6/FFFFFF?text=COLEGIO',
        themePrimary: '#8B5CF6', // Púrpura
        themeSecondary: '#10B981', // Verde
        themeAccent: '#F59E0B' // Naranja
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        themePrimary: true,
        themeSecondary: true,
        themeAccent: true
      }
    })
    
    console.log('✅ Branding actualizado:')
    console.log('   Colegio:', updatedSchool.name)
    console.log('   Logo:', updatedSchool.logoUrl)
    console.log('   Color Primario:', updatedSchool.themePrimary)
    console.log('   Color Secundario:', updatedSchool.themeSecondary)
    console.log('   Color Acento:', updatedSchool.themeAccent)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

updateSchoolBranding()
