const { PrismaClient } = require('@prisma/client')

async function checkUsersAndSchools() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Verificando usuarios y sus colegios...')
    
    // Obtener todos los usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        schoolId: true
      }
    })
    
    console.log('\n👥 Usuarios encontrados:')
    users.forEach(user => {
      console.log(`   ${user.firstName} ${user.lastName} (${user.email}) - Rol: ${user.role} - Colegio ID: ${user.schoolId || 'SIN COLEGIO'}`)
    })
    
    // Obtener todos los colegios
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
    
    console.log('\n🏫 Colegios encontrados:')
    schools.forEach(school => {
      console.log(`   ${school.name} (ID: ${school.id})`)
      console.log(`     Logo: ${school.logoUrl || 'No configurado'}`)
      console.log(`     Colores: ${school.themePrimary || 'No configurado'}, ${school.themeSecondary || 'No configurado'}, ${school.themeAccent || 'No configurado'}`)
    })
    
    // Buscar estudiantes sin colegio
    const studentsWithoutSchool = users.filter(user => user.role === 'student' && !user.schoolId)
    if (studentsWithoutSchool.length > 0) {
      console.log('\n⚠️  Estudiantes sin colegio asignado:')
      studentsWithoutSchool.forEach(student => {
        console.log(`   ${student.firstName} ${student.lastName} (${student.email})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsersAndSchools()
