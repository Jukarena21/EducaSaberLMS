const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function assignCoursesToStudent() {
  try {
    console.log('🎓 Asignando cursos al estudiante...')

    // Buscar un estudiante
    const student = await prisma.user.findFirst({
      where: { role: 'student' }
    })

    if (!student) {
      console.log('❌ No se encontró ningún estudiante')
      return
    }

    console.log(`👤 Estudiante encontrado: ${student.firstName} ${student.lastName}`)

    // Buscar algunos cursos
    const courses = await prisma.course.findMany({
      take: 3
    })

    if (courses.length === 0) {
      console.log('❌ No se encontraron cursos')
      return
    }

    console.log(`📚 Encontrados ${courses.length} cursos`)

    // Asignar cursos al estudiante
    for (const course of courses) {
      try {
        // Verificar si ya está inscrito
        const existingEnrollment = await prisma.courseEnrollment.findUnique({
          where: {
            userId_courseId: {
              userId: student.id,
              courseId: course.id
            }
          }
        })

        if (existingEnrollment) {
          console.log(`⚠️ Ya está inscrito en: ${course.title}`)
          continue
        }

        // Crear inscripción
        await prisma.courseEnrollment.create({
          data: {
            userId: student.id,
            courseId: course.id,
            isActive: true
          }
        })

        console.log(`✅ Inscrito en: ${course.title}`)
      } catch (error) {
        console.log(`❌ Error asignando curso ${course.title}:`, error.message)
      }
    }

    console.log('🎉 ¡Cursos asignados exitosamente!')

  } catch (error) {
    console.error('❌ Error asignando cursos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

assignCoursesToStudent()
