const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkStudentUser() {
  try {
    console.log('🔍 Verificando configuración del usuario estudiante...\n')

    // Buscar usuarios con rol 'student'
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      include: {
        school: true,
        courseEnrollments: {
          include: {
            course: {
              include: {
                competency: true
              }
            }
          }
        }
      }
    })

    console.log(`📊 Encontrados ${students.length} usuarios estudiantes\n`)

    if (students.length === 0) {
      console.log('❌ No hay usuarios estudiantes en el sistema')
      console.log('💡 Necesitas crear un usuario estudiante o verificar la configuración')
      return
    }

    // Verificar cada estudiante
    for (const student of students) {
      console.log(`👤 Estudiante: ${student.firstName} ${student.lastName}`)
      console.log(`   📧 Email: ${student.email}`)
      console.log(`   🏫 Colegio: ${student.school?.name || 'Sin asignar'}`)
      console.log(`   📚 Cursos inscritos: ${student.courseEnrollments.length}`)
      
      if (student.courseEnrollments.length > 0) {
        console.log('   📖 Cursos:')
        student.courseEnrollments.forEach(enrollment => {
          console.log(`      - ${enrollment.course.title} (${enrollment.course.competency.name})`)
        })
      }
      
      console.log('')
    }

    // Verificar si hay cursos disponibles
    const availableCourses = await prisma.course.findMany({
      where: { isActive: true },
      include: {
        competency: true,
        courseEnrollments: true
      }
    })

    console.log(`📚 Cursos disponibles: ${availableCourses.length}`)
    
    if (availableCourses.length > 0) {
      console.log('📖 Cursos activos:')
      availableCourses.forEach(course => {
        console.log(`   - ${course.title} (${course.competency.name}) - ${course.courseEnrollments.length} estudiantes`)
      })
    }

    // Verificar notificaciones
    const notifications = await prisma.notification.findMany({
      where: { 
        user: { role: 'student' }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    console.log(`\n🔔 Notificaciones recientes: ${notifications.length}`)
    if (notifications.length > 0) {
      notifications.forEach(notification => {
        console.log(`   - ${notification.title} (${notification.type})`)
      })
    }

    console.log('\n✅ Verificación completada')

  } catch (error) {
    console.error('❌ Error verificando usuario estudiante:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkStudentUser()
