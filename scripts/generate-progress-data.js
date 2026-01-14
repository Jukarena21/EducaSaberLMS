const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Función para generar datos de progreso realistas
async function generateProgressData() {
  try {
    console.log('🚀 Generando datos de progreso...')

    // 1. Obtener estudiantes
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      include: { school: true }
    })
    console.log(`📚 Encontrados ${students.length} estudiantes`)

    // 2. Obtener lecciones
    const lessons = await prisma.lesson.findMany({
      include: {
        moduleLessons: {
          include: {
            module: {
              include: {
                courseModules: {
                  include: {
                    course: true
                  }
                }
              }
            }
          }
        }
      }
    })
    console.log(`📝 Encontradas ${lessons.length} lecciones`)

    // 3. Obtener exámenes
    const exams = await prisma.exam.findMany({
      include: {
        course: true,
        examQuestions: true
      }
    })
    console.log(`📋 Encontrados ${exams.length} exámenes`)

    // 4. Generar progreso de lecciones para cada estudiante
    console.log('📚 Generando progreso de lecciones...')
    const lessonProgressData = []
    
    for (const student of students) {
      // Cada estudiante completa 3-8 lecciones aleatoriamente
      const numLessons = Math.floor(Math.random() * 6) + 3
      const studentLessons = lessons.slice(0, numLessons)
      
      for (const lesson of studentLessons) {
        const isCompleted = Math.random() > 0.3 // 70% de probabilidad de completar
        const timeSpent = Math.floor(Math.random() * 30) + 10 // 10-40 minutos
        
        lessonProgressData.push({
          userId: student.id,
          lessonId: lesson.id,
          status: isCompleted ? 'completado' : 'en_progreso',
          videoCompleted: isCompleted ? true : Math.random() > 0.5,
          theoryCompleted: isCompleted ? true : Math.random() > 0.3,
          exercisesCompleted: isCompleted ? true : Math.random() > 0.4,
          totalTimeMinutes: timeSpent,
          completedAt: isCompleted ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null
        })
      }
    }

    // Insertar progreso de lecciones
    await prisma.studentLessonProgress.createMany({
      data: lessonProgressData
    })
    console.log(`✅ ${lessonProgressData.length} registros de progreso de lecciones creados`)

    // 5. Generar resultados de exámenes
    console.log('📋 Generando resultados de exámenes...')
    const examResultsData = []
    
    for (const student of students) {
      // Cada estudiante toma 1-3 exámenes
      const numExams = Math.floor(Math.random() * 3) + 1
      const studentExams = exams.slice(0, numExams)
      
      for (const exam of studentExams) {
        const score = Math.floor(Math.random() * 40) + 60 // 60-100 puntos
        const timeTaken = Math.floor(Math.random() * 30) + 30 // 30-60 minutos
        const isPassed = score >= 70
        
        const totalQuestions = exam.examQuestions.length || 10
        const correctAnswers = Math.floor((score / 100) * totalQuestions)
        const incorrectAnswers = totalQuestions - correctAnswers
        
        examResultsData.push({
          userId: student.id,
          examId: exam.id,
          score: score,
          totalQuestions: totalQuestions,
          correctAnswers: correctAnswers,
          incorrectAnswers: incorrectAnswers,
          timeTakenMinutes: timeTaken,
          isPassed: isPassed,
          startedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000 - timeTaken * 60 * 1000), // Inicio del examen
          completedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
        })
      }
    }

    // Insertar resultados de exámenes
    await prisma.examResult.createMany({
      data: examResultsData
    })
    console.log(`✅ ${examResultsData.length} resultados de exámenes creados`)

    // 6. Generar progreso de cursos
    console.log('📖 Generando progreso de cursos...')
    const courseProgressData = []
    
    for (const student of students) {
      // Obtener cursos del colegio del estudiante
      const schoolCourses = await prisma.course.findMany({
        where: { schoolId: student.schoolId }
      })
      
      // Cada estudiante está inscrito en 2-5 cursos
      const numCourses = Math.min(Math.floor(Math.random() * 4) + 2, schoolCourses.length)
      const studentCourses = schoolCourses.slice(0, numCourses)
      
      for (const course of studentCourses) {
        const isCompleted = Math.random() > 0.4 // 60% de probabilidad de completar
        const progressPercentage = isCompleted ? 100 : Math.floor(Math.random() * 80) + 10
        
        courseProgressData.push({
          userId: student.id,
          courseId: course.id,
          progressPercentage: progressPercentage,
          completedModulesCount: Math.floor(progressPercentage / 20), // Aproximadamente 1 módulo por cada 20% de progreso
          totalTimeMinutes: Math.floor(Math.random() * 300) + 60, // Entre 1 y 5 horas
          enrolledAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000), // Últimos 60 días
          completedAt: isCompleted ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null
        })
      }
    }

    // Insertar progreso de cursos
    await prisma.studentCourseProgress.createMany({
      data: courseProgressData
    })
    console.log(`✅ ${courseProgressData.length} registros de progreso de cursos creados`)

    // 7. Crear inscripciones de cursos
    console.log('📝 Creando inscripciones de cursos...')
    const enrollmentsData = []
    
    for (const student of students) {
      const schoolCourses = await prisma.course.findMany({
        where: { schoolId: student.schoolId }
      })
      
      const numCourses = Math.min(Math.floor(Math.random() * 4) + 2, schoolCourses.length)
      const studentCourses = schoolCourses.slice(0, numCourses)
      
      for (const course of studentCourses) {
        enrollmentsData.push({
          userId: student.id,
          courseId: course.id,
          enrolledAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
          isActive: true
        })
      }
    }

    // Insertar inscripciones
    await prisma.courseEnrollment.createMany({
      data: enrollmentsData
    })
    console.log(`✅ ${enrollmentsData.length} inscripciones de cursos creadas`)

    // 8. Actualizar métricas de usuarios
    console.log('👤 Actualizando métricas de usuarios...')
    for (const student of students) {
      const totalTime = Math.floor(Math.random() * 1200) + 300 // 5-25 horas
      const sessions = Math.floor(Math.random() * 50) + 10 // 10-60 sesiones
      
      await prisma.user.update({
        where: { id: student.id },
        data: {
          totalPlatformTimeMinutes: totalTime,
          sessionsStarted: sessions,
          lastSessionAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          averageSessionTimeMinutes: Math.floor(totalTime / sessions)
        }
      })
    }
    console.log(`✅ Métricas de usuarios actualizadas`)

    console.log('🎉 ¡Datos de progreso generados exitosamente!')
    console.log(`📊 Resumen:`)
    console.log(`   - ${lessonProgressData.length} registros de progreso de lecciones`)
    console.log(`   - ${examResultsData.length} resultados de exámenes`)
    console.log(`   - ${courseProgressData.length} registros de progreso de cursos`)
    console.log(`   - ${enrollmentsData.length} inscripciones de cursos`)

  } catch (error) {
    console.error('❌ Error al generar datos de progreso:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar el script
generateProgressData()
  .then(() => {
    console.log('✅ Script completado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error en el script:', error)
    process.exit(1)
  })
