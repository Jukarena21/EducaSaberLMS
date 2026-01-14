const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testBranding() {
  try {
    console.log('🔍 Verificando datos de branding...')
    
    // Verificar si hay escuelas con branding
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
    
    console.log(`📊 Encontradas ${schools.length} escuelas:`)
    schools.forEach(school => {
      console.log(`  - ${school.name} (${school.id})`)
      console.log(`    Logo: ${school.logoUrl || 'No definido'}`)
      console.log(`    Colores: ${school.themePrimary || 'No definido'}, ${school.themeSecondary || 'No definido'}, ${school.themeAccent || 'No definido'}`)
    })
    
    // Verificar usuarios con schoolId
    const users = await prisma.user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        name: true,
        schoolId: true,
        school: {
          select: {
            name: true,
            logoUrl: true,
            themePrimary: true
          }
        }
      },
      take: 5
    })
    
    console.log(`\n👥 Usuarios estudiantes con colegio:`)
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.id})`)
      console.log(`    Colegio: ${user.school?.name || 'Sin colegio'} (${user.schoolId})`)
      console.log(`    Logo del colegio: ${user.school?.logoUrl || 'No definido'}`)
      console.log(`    Color primario: ${user.school?.themePrimary || 'No definido'}`)
    })
    
    // Crear datos de prueba si no existen
    if (schools.length === 0) {
      console.log('\n🏫 Creando escuela de prueba...')
      const testSchool = await prisma.school.create({
        data: {
          name: 'Colegio de Prueba',
          city: 'Bogotá',
          neighborhood: 'Centro',
          institutionType: 'publica',
          academicCalendar: 'diurno',
          totalStudents: 500,
          numberOfCampuses: 1,
          yearsOfOperation: 20,
          contactEmail: 'test@colegio.edu.co',
          contactPhone: '3001234567',
          logoUrl: 'https://via.placeholder.com/100x100/3B82F6/FFFFFF?text=LOGO',
          themePrimary: '#3B82F6',
          themeSecondary: '#6B7280',
          themeAccent: '#EF4444'
        }
      })
      console.log(`✅ Escuela creada: ${testSchool.name} (${testSchool.id})`)
    }
    
    // Asignar escuela a usuarios sin schoolId
    const usersWithoutSchool = await prisma.user.findMany({
      where: { 
        role: 'student',
        schoolId: null
      }
    })
    
    if (usersWithoutSchool.length > 0) {
      const firstSchool = await prisma.school.findFirst()
      if (firstSchool) {
        console.log(`\n🔗 Asignando colegio a ${usersWithoutSchool.length} usuarios...`)
        await prisma.user.updateMany({
          where: { 
            role: 'student',
            schoolId: null
          },
          data: { schoolId: firstSchool.id }
        })
        console.log(`✅ Usuarios asignados al colegio: ${firstSchool.name}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testBranding()
