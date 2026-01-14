const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function setupBrandingData() {
  try {
    console.log('🎨 Configurando datos de branding...')
    
    // Crear o actualizar escuela con branding
    const school = await prisma.school.upsert({
      where: { name: 'Colegio EducaSaber' },
      update: {
        logoUrl: 'https://via.placeholder.com/100x100/3B82F6/FFFFFF?text=LOGO',
        themePrimary: '#3B82F6',
        themeSecondary: '#6B7280', 
        themeAccent: '#EF4444'
      },
      create: {
        name: 'Colegio EducaSaber',
        city: 'Bogotá',
        neighborhood: 'Centro',
        institutionType: 'publica',
        academicCalendar: 'diurno',
        totalStudents: 500,
        numberOfCampuses: 1,
        yearsOfOperation: 20,
        contactEmail: 'info@educasaber.edu.co',
        contactPhone: '3001234567',
        logoUrl: 'https://via.placeholder.com/100x100/3B82F6/FFFFFF?text=LOGO',
        themePrimary: '#3B82F6',
        themeSecondary: '#6B7280',
        themeAccent: '#EF4444'
      }
    })
    
    console.log(`✅ Escuela configurada: ${school.name} (${school.id})`)
    console.log(`   Logo: ${school.logoUrl}`)
    console.log(`   Colores: ${school.themePrimary}, ${school.themeSecondary}, ${school.themeAccent}`)
    
    // Asignar escuela a todos los usuarios estudiantes
    const updatedUsers = await prisma.user.updateMany({
      where: { role: 'student' },
      data: { schoolId: school.id }
    })
    
    console.log(`✅ ${updatedUsers.count} usuarios estudiantes asignados al colegio`)
    
    // Verificar que funcione
    const testUser = await prisma.user.findFirst({
      where: { role: 'student' },
      include: { school: true }
    })
    
    if (testUser) {
      console.log(`\n🧪 Usuario de prueba:`)
      console.log(`   Usuario: ${testUser.name} (${testUser.id})`)
      console.log(`   Colegio: ${testUser.school?.name} (${testUser.schoolId})`)
      console.log(`   Logo: ${testUser.school?.logoUrl}`)
      console.log(`   Color primario: ${testUser.school?.themePrimary}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

setupBrandingData()
