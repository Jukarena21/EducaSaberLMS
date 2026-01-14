import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Limpiando base de datos y creando datos de demo...')

  try {
    // 1. Limpiar datos en orden seguro según el schema actual
    await prisma.examQuestionAnswer.deleteMany()
    await prisma.examResult.deleteMany()
    await prisma.examQuestion.deleteMany()
    await prisma.exam.deleteMany()
    await prisma.studentLessonProgress.deleteMany()
    await prisma.studentModuleProgress.deleteMany()
    await prisma.studentCourseProgress.deleteMany()
    await prisma.courseEnrollment.deleteMany()
    await prisma.courseModule.deleteMany()
    await prisma.course.deleteMany()
    await prisma.moduleLesson.deleteMany()
    await prisma.module.deleteMany()
    await prisma.lessonQuestion.deleteMany()
    await prisma.lesson.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.goal.deleteMany()
    await prisma.competency.deleteMany()
    await prisma.user.deleteMany()
    await prisma.school.deleteMany()

    console.log('✅ Datos anteriores eliminados')

    // 2. Competencias (incluye "Otros")
    const competencies = await prisma.$transaction(
      [
        {
          name: 'lectura_critica',
          displayName: 'Lectura Crítica',
          description: 'Habilidades de comprensión y análisis de textos.',
          iconName: 'book',
          colorHex: '#3B82F6',
        },
        {
          name: 'matematicas',
          displayName: 'Matemáticas',
          description: 'Razonamiento cuantitativo y resolución de problemas.',
          iconName: 'calculator',
          colorHex: '#10B981',
        },
        {
          name: 'ciencias_naturales',
          displayName: 'Ciencias Naturales',
          description: 'Comprensión de fenómenos biológicos, químicos y físicos.',
          iconName: 'flask',
          colorHex: '#F59E0B',
        },
        {
          name: 'ciencias_sociales_y_ciudadanas',
          displayName: 'Ciencias Sociales y Ciudadanas',
          description: 'Análisis de hechos históricos, geográficos y ciudadanos.',
          iconName: 'globe',
          colorHex: '#8B5CF6',
        },
        {
          name: 'ingles',
          displayName: 'Inglés',
          description: 'Dominio de la lengua inglesa en contextos académicos.',
          iconName: 'flag',
          colorHex: '#EF4444',
        },
        {
          name: 'otros',
          displayName: 'Otros',
          description: 'Competencias para instituciones no escolares y contenidos especiales.',
          iconName: 'target',
          colorHex: '#6366F1',
        },
      ].map((c) => prisma.competency.create({ data: c }))
    )

    console.log(`✅ Creadas ${competencies.length} competencias (incluye "Otros")`)

    // 3. Escuelas / instituciones (colegios + otros)
    const schools = await prisma.$transaction([
      prisma.school.create({
        data: {
          name: 'Colegio de Prueba',
          city: 'Bogotá',
          neighborhood: 'Chapinero',
          address: 'Calle 80 #10-20',
          institutionType: 'privada',
          academicCalendar: 'diurno',
          contactEmail: 'admin@colegioprueba.edu.co',
          contactPhone: '+57 1 555 0000',
        },
      }),
      prisma.school.create({
        data: {
          name: 'Colegio Distrital Demo',
          city: 'Bogotá',
          neighborhood: 'Suba',
          address: 'Cra 90 #120-30',
          institutionType: 'publica',
          academicCalendar: 'diurno',
          contactEmail: 'contacto@colegiodemo.edu.co',
          contactPhone: '+57 1 555 1111',
        },
      }),
      prisma.school.create({
        data: {
          name: 'Academia de Idiomas Global',
          city: 'Medellín',
          neighborhood: 'El Poblado',
          address: 'Calle 10 #40-25',
          institutionType: 'otros',
          academicCalendar: 'continuo',
          contactEmail: 'info@academiaglobal.com',
          contactPhone: '+57 4 555 2222',
        },
      }),
      prisma.school.create({
        data: {
          name: 'Centro de Formación Empresarial',
          city: 'Cali',
          neighborhood: 'Granada',
          address: 'Av 4N # 23-15',
          institutionType: 'otros',
          academicCalendar: 'continuo',
          contactEmail: 'contacto@centroempresarial.com',
          contactPhone: '+57 2 555 3333',
        },
      }),
    ])

    console.log(`✅ Creadas ${schools.length} instituciones`)

    // 4. Usuarios de prueba
    const passwordHash = await bcrypt.hash('123456', 12)
    const mainSchool = schools[0]

    const studentTest = await prisma.user.create({
      data: {
        email: 'estudiante@test.com',
        passwordHash,
        firstName: 'Juan',
        lastName: 'Pérez',
        role: 'student',
        schoolId: mainSchool.id,
      },
    })

    const schoolAdminTest = await prisma.user.create({
      data: {
        email: 'admin@colegio.com',
        passwordHash,
        firstName: 'María',
        lastName: 'García',
        role: 'school_admin',
        schoolId: mainSchool.id,
      },
    })

    const teacherAdminTest = await prisma.user.create({
      data: {
        email: 'profesor@admin.com',
        passwordHash,
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        role: 'teacher_admin',
        schoolId: mainSchool.id,
      },
    })

    console.log('✅ Usuarios de prueba creados')

    // Estudiantes demo adicionales
    const extraStudents: any[] = []
    for (let i = 0; i < 20; i++) {
      const school = schools[i % schools.length]
      const student = await prisma.user.create({
        data: {
          email: `demo.student${i + 1}@${school.name.replace(/\s+/g, '').toLowerCase()}.demo`,
          passwordHash,
          firstName: 'Demo',
          lastName: `Estudiante ${i + 1}`,
          role: 'student',
          schoolId: school.id,
        },
      })
      extraStudents.push(student)
    }

    const allStudents = [studentTest, ...extraStudents]
    console.log(`✅ ${allStudents.length} estudiantes en total (incluye 1 de prueba)`)

    // 5. Lecciones
    const lessons: any[] = []
    for (let i = 0; i < 24; i++) {
      const competency = competencies[i % competencies.length]
      const lesson = await prisma.lesson.create({
        data: {
          title: `Lección ${i + 1}: ${competency.displayName}`,
          description: `Descripción de la lección ${i + 1}`,
          estimatedTimeMinutes: 20 + (i % 25),
          videoUrl: `https://example.com/video${i + 1}`,
          videoDescription: `Video de la lección ${i + 1}`,
          theoryContent: `Contenido teórico de la lección ${i + 1}`,
          competencyId: competency.id,
          isPublished: true,
        },
      })
      lessons.push(lesson)
    }
    console.log(`✅ Creadas ${lessons.length} lecciones`)

    // 6. Módulos
    const modules: any[] = []
    for (let i = 0; i < 10; i++) {
      const competency = competencies[i % competencies.length]
      const module = await prisma.module.create({
        data: {
          title: `Módulo ${i + 1}: ${competency.displayName}`,
          description: `Descripción del módulo ${i + 1}`,
          orderIndex: i + 1,
          competencyId: competency.id,
          estimatedTimeMinutes: 60 + i * 10,
          isPublished: true,
        },
      })
      modules.push(module)

      const lessonsForModule = lessons.slice(i * 2, i * 2 + 2)
      for (let j = 0; j < lessonsForModule.length; j++) {
        await prisma.moduleLesson.create({
          data: {
            moduleId: module.id,
            lessonId: lessonsForModule[j].id,
            orderIndex: j + 1,
          },
        })
      }
    }
    console.log(`✅ Creados ${modules.length} módulos con lecciones`)

    // 7. Cursos (uno para "Otros")
    const courses: any[] = []
    for (let i = 0; i < 6; i++) {
      const competency = competencies[i % competencies.length]
      const school = schools[i % schools.length]

      const course = await prisma.course.create({
        data: {
          title: `Curso ${i + 1}: ${competency.displayName}`,
          description: `Descripción del curso ${i + 1}`,
          competencyId: competency.id,
          academicGrade: ['sexto', 'septimo', 'octavo', 'noveno', 'decimo', 'once'][i % 6],
          durationHours: 20 + i * 5,
          difficultyLevel: ['facil', 'intermedio', 'dificil'][i % 3],
          isPublished: true,
          isIcfesCourse: competency.name !== 'otros',
          totalModules: 0,
          totalLessons: 0,
        },
      })
      courses.push(course)

      const modulesForCourse = modules.slice(i * 2, i * 2 + 2)
      for (let j = 0; j < modulesForCourse.length; j++) {
        await prisma.courseModule.create({
          data: {
            courseId: course.id,
            moduleId: modulesForCourse[j].id,
            orderIndex: j + 1,
          },
        })
      }

      await prisma.courseSchool.create({
        data: {
          courseId: course.id,
          schoolId: school.id,
        },
      })
    }
    console.log(`✅ Creados ${courses.length} cursos`)

    // 8. Inscribir estudiantes a cursos
    for (const student of allStudents) {
      const coursesToEnroll = courses.slice(0, 3)
      for (const course of coursesToEnroll) {
        await prisma.courseEnrollment.create({
          data: {
            userId: student.id,
            courseId: course.id,
            enrolledAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
            isActive: true,
          },
        })
      }
    }
    console.log('✅ Estudiantes inscritos en cursos')

    // 9. Crear LessonQuestions para lecciones (banco de preguntas)
    const lessonQuestions: any[] = []
    for (let i = 0; i < 60; i++) {
      const lesson = lessons[i % lessons.length]
      const lq = await prisma.lessonQuestion.create({
        data: {
          lessonId: lesson.id,
          questionText: `Pregunta de lección ${i + 1}: ¿Cuál es la respuesta correcta?`,
          questionType: 'multiple_choice',
          usage: i % 3 === 0 ? 'exam' : i % 2 === 0 ? 'both' : 'lesson',
          optionA: 'Opción A',
          optionB: 'Opción B',
          optionC: 'Opción C',
          optionD: 'Opción D',
          correctOption: 'A',
          explanation: `Explicación de la pregunta de lección ${i + 1}`,
          orderIndex: i + 1,
          difficultyLevel: ['facil', 'intermedio', 'dificil'][i % 3],
        },
      })
      lessonQuestions.push(lq)
    }
    console.log(`✅ Creadas ${lessonQuestions.length} LessonQuestions`)

    // 10. Crear exámenes y ExamQuestions basadas en LessonQuestions (usage exam/both)
    const exams: any[] = []
    for (let i = 0; i < 8; i++) {
      const course = courses[i % courses.length]
      const competency = competencies[i % competencies.length]

      const exam = await prisma.exam.create({
        data: {
          title: `Examen ${i + 1}: ${competency.displayName}`,
          description: `Descripción del examen ${i + 1}`,
          examType: ['simulacro_completo', 'por_competencia', 'diagnostico'][i % 3],
          courseId: course.id,
          competencyId: competency.id,
          academicGrade: course.academicGrade,
          timeLimitMinutes: 60 + i * 10,
          passingScore: 70,
          difficultyLevel: ['intermedio', 'dificil'][i % 2],
          isPublished: true,
          isIcfesExam: competency.name !== 'otros',
          openDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          closeDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          questionsPerModule: 5,
        },
      })
      exams.push(exam)

      const questionsForExam = lessonQuestions
        .filter((q) => q.usage === 'exam' || q.usage === 'both')
        .slice(i * 10, i * 10 + 20)

      let orderIndex = 1
      for (const q of questionsForExam) {
        await prisma.examQuestion.create({
          data: {
            examId: exam.id,
            questionText: q.questionText,
            questionImage: q.questionImage,
            questionType: q.questionType,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctOption: q.correctOption,
            explanation: q.explanation,
            difficultyLevel: q.difficultyLevel,
            points: 1,
            orderIndex,
            lessonId: q.lessonId || null,
          },
        })
        orderIndex++
      }
    }
    console.log(`✅ Creados ${exams.length} exámenes con ExamQuestions`)

    // 11. Resultados de exámenes + respuestas
    const allEnrollments = await prisma.courseEnrollment.findMany({
      include: { course: true },
    })

    for (const student of allStudents) {
      const studentCourseIds = allEnrollments
        .filter((e) => e.userId === student.id && e.isActive)
        .map((e) => e.courseId)

      const examsForStudent = exams.filter((e) => studentCourseIds.includes(e.courseId || ''))

      for (const exam of examsForStudent.slice(0, 3)) {
        const examQuestions = await prisma.examQuestion.findMany({
          where: { examId: exam.id },
        })
        if (examQuestions.length === 0) continue

        let correctAnswers = 0
        const totalQuestions = examQuestions.length

        const startedAt = new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000)
        const completedAt = new Date(startedAt.getTime() + Math.random() * 60 * 60 * 1000)

        const examResult = await prisma.examResult.create({
          data: {
            examId: exam.id,
            userId: student.id,
            score: 0, // se actualiza luego
            totalQuestions,
            correctAnswers: 0,
            incorrectAnswers: 0,
            timeTakenMinutes: Math.floor(Math.random() * (exam.timeLimitMinutes || 60)),
            startedAt,
            completedAt,
            isPassed: false,
          },
        })

        for (const eq of examQuestions) {
          const isCorrect = Math.random() > 0.3
          if (isCorrect) correctAnswers++

          await prisma.examQuestionAnswer.create({
            data: {
              examResultId: examResult.id,
              questionId: eq.id,
              selectedOption: isCorrect ? eq.correctOption : ['A', 'B', 'C', 'D'].find((k) => k !== eq.correctOption) || eq.correctOption,
              isCorrect,
              timeSpentSeconds: 10 + Math.floor(Math.random() * 60),
              userId: student.id,
            },
          })
        }

        const score = Math.round((correctAnswers / totalQuestions) * 100)
        await prisma.examResult.update({
          where: { id: examResult.id },
          data: {
            score,
            correctAnswers,
            incorrectAnswers: totalQuestions - correctAnswers,
            isPassed: score >= exam.passingScore,
          },
        })
      }
    }
    console.log('✅ Resultados y respuestas de exámenes generados')

    // 12. Progreso de lecciones
    const enrollmentsWithCourseModules = await prisma.courseEnrollment.findMany({
      where: { isActive: true },
      include: {
        course: {
          include: {
            courseModules: {
              include: {
                module: {
                  include: { moduleLessons: true },
                },
              },
            },
          },
        },
      },
    })

    for (const enrollment of enrollmentsWithCourseModules) {
      for (const cm of enrollment.course.courseModules) {
        for (const ml of cm.module.moduleLessons) {
          if (Math.random() > 0.4) {
            await prisma.studentLessonProgress.create({
              data: {
                userId: enrollment.userId,
                lessonId: ml.lessonId,
                status: 'completado',
                progressPercentage: 100,
                videoCompleted: true,
                theoryCompleted: true,
                exercisesCompleted: true,
                totalTimeMinutes: 10 + Math.floor(Math.random() * 40),
                completedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
              },
            })
          }
        }
      }
    }

    console.log('✅ Progreso de lecciones generado')

    console.log('\n🎉 Demo seed completado.')
  } catch (error) {
    console.error('❌ Error en reset-and-seed-demo:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


