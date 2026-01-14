const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed simple...');

  try {
    // Limpiar datos existentes (en orden correcto para evitar errores de foreign key)
    await prisma.examResult.deleteMany();
    await prisma.examQuestion.deleteMany();
    await prisma.exam.deleteMany();
    await prisma.studentLessonProgress.deleteMany();
    await prisma.studentModuleProgress.deleteMany();
    await prisma.courseEnrollment.deleteMany();
    await prisma.courseModule.deleteMany();
    await prisma.course.deleteMany();
    await prisma.moduleLesson.deleteMany();
    await prisma.module.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.questionOption.deleteMany();
    await prisma.question.deleteMany();
    await prisma.competency.deleteMany();
    await prisma.user.deleteMany();
    await prisma.school.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.achievement.deleteMany();
    await prisma.userAchievement.deleteMany();
    await prisma.goal.deleteMany();

    console.log('✅ Datos limpiados');

    // Crear competencias
    const competencies = [
      { name: 'lectura_critica', displayName: 'Lectura Crítica', description: 'Habilidades de comprensión y análisis de textos.', iconName: 'book', colorHex: '#3B82F6' },
      { name: 'matematicas', displayName: 'Matemáticas', description: 'Razonamiento cuantitativo y resolución de problemas.', iconName: 'calculator', colorHex: '#10B981' },
      { name: 'ciencias_naturales', displayName: 'Ciencias Naturales', description: 'Comprensión de fenómenos biológicos, químicos y físicos.', iconName: 'flask', colorHex: '#F59E0B' },
      { name: 'ciencias_sociales', displayName: 'Ciencias Sociales', description: 'Análisis de eventos históricos, geográficos y sociales.', iconName: 'globe', colorHex: '#8B5CF6' },
      { name: 'ingles', displayName: 'Inglés', description: 'Dominio de la lengua inglesa en contextos académicos.', iconName: 'flag', colorHex: '#EF4444' },
    ];

    const createdCompetencies = [];
    for (const comp of competencies) {
      const created = await prisma.competency.create({ data: comp });
      createdCompetencies.push(created);
    }
    console.log(`✅ Creadas ${createdCompetencies.length} competencias`);

    // Crear escuelas
    const schools = [];
    for (let i = 0; i < 3; i++) {
      const school = await prisma.school.create({
        data: {
          name: `Colegio ${i + 1}`,
          city: 'Bogotá',
          neighborhood: `Barrio ${i + 1}`,
          address: `Calle ${i + 1} #${i + 1}-${i + 1}`,
          institutionType: i === 0 ? 'publica' : 'privada',
          academicCalendar: 'diurno',
          totalStudents: 500 + (i * 200),
          numberOfCampuses: 1,
          yearsOfOperation: 20 + (i * 5),
          contactEmail: `contacto@colegio${i + 1}.edu.co`,
          contactPhone: `+57 1 234-${i.toString().padStart(4, '0')}`,
          logoUrl: null,
          themePrimary: null,
          themeSecondary: null,
          themeAccent: null,
        },
      });
      schools.push(school);
    }
    console.log(`✅ Creadas ${schools.length} escuelas`);

    // Crear usuarios
    const passwordHash = await bcrypt.hash('password123', 10);

    // Teacher admin
    const teacherAdmin = await prisma.user.create({
      data: {
        email: 'teacher@educasaber.com',
        passwordHash,
        firstName: 'Admin',
        lastName: 'Profesor',
        role: 'teacher_admin',
        schoolId: schools[0].id,
      },
    });

    // School admins
    const schoolAdmins = [];
    for (let i = 0; i < schools.length; i++) {
      const admin = await prisma.user.create({
        data: {
          email: `admin@colegio${i + 1}.edu.co`,
          passwordHash,
          firstName: `Admin`,
          lastName: `Colegio ${i + 1}`,
          role: 'school_admin',
          schoolId: schools[i].id,
        },
      });
      schoolAdmins.push(admin);
    }

    // Estudiantes
    const students = [];
    for (let i = 0; i < 20; i++) {
      const school = schools[i % schools.length];
      const student = await prisma.user.create({
        data: {
          email: `estudiante${i + 1}@colegio${(i % schools.length) + 1}.edu.co`,
          passwordHash,
          firstName: `Estudiante`,
          lastName: `${i + 1}`,
          role: 'student',
          schoolId: school.id,
          academicGrade: ['sexto', 'septimo', 'octavo', 'noveno', 'decimo', 'once'][i % 6],
          dateOfBirth: new Date(2005 + (i % 5), i % 12, (i % 28) + 1),
          gender: i % 2 === 0 ? 'masculino' : 'femenino',
          documentType: 'CC',
          documentNumber: `1234567${i.toString().padStart(3, '0')}`,
          address: `Calle ${i + 1} #${i + 1}-${i + 1}`,
          city: school.city,
          neighborhood: school.neighborhood,
          socioeconomicStratum: (i % 6) + 1,
          housingType: i % 2 === 0 ? 'propia' : 'arriendo',
          schoolEntryYear: 2020 + (i % 3),
          academicAverage: 3.5 + (i % 1.5),
          homeTechnologyAccess: true,
          homeInternetAccess: true,
        },
      });
      students.push(student);
    }

    console.log(`✅ Creados usuarios: 1 teacher_admin, ${schoolAdmins.length} school_admins, ${students.length} estudiantes`);

    // Crear lecciones
    const lessons = [];
    for (let i = 0; i < 20; i++) {
      const competency = createdCompetencies[i % createdCompetencies.length];
      const lesson = await prisma.lesson.create({
        data: {
          title: `Lección ${i + 1}: ${competency.displayName}`,
          description: `Descripción de la lección ${i + 1}`,
          estimatedTimeMinutes: 30 + (i % 30),
          videoUrl: `https://example.com/video${i + 1}`,
          videoDescription: `Video de la lección ${i + 1}`,
          theoryContent: `Contenido teórico de la lección ${i + 1}`,
          competencyId: competency.id,
          createdByUserId: teacherAdmin.id,
        },
      });
      lessons.push(lesson);
    }
    console.log(`✅ Creadas ${lessons.length} lecciones`);

    // Crear módulos
    const modules = [];
    for (let i = 0; i < 10; i++) {
      const competency = createdCompetencies[i % createdCompetencies.length];
      const module = await prisma.module.create({
        data: {
          title: `Módulo ${i + 1}: ${competency.displayName}`,
          description: `Descripción del módulo ${i + 1}`,
          orderIndex: i + 1,
          competencyId: competency.id,
          createdByUserId: teacherAdmin.id,
        },
      });
      modules.push(module);

      // Asignar 2 lecciones por módulo
      const lessonsForModule = lessons.slice(i * 2, (i * 2) + 2);
      for (let j = 0; j < lessonsForModule.length; j++) {
        await prisma.moduleLesson.create({
          data: {
            moduleId: module.id,
            lessonId: lessonsForModule[j].id,
            orderIndex: j + 1,
          },
        });
      }
    }
    console.log(`✅ Creados ${modules.length} módulos con lecciones asignadas`);

    // Crear cursos
    const courses = [];
    for (let i = 0; i < 5; i++) {
      const competency = createdCompetencies[i % createdCompetencies.length];
      const school = schools[i % schools.length];
      const course = await prisma.course.create({
        data: {
          title: `Curso ${i + 1}: ${competency.displayName}`,
          description: `Descripción del curso ${i + 1}`,
          competencyId: competency.id,
          academicGrade: ['sexto', 'septimo', 'octavo', 'noveno', 'decimo'][i % 5],
          estimatedTimeMinutes: 120 + (i * 60),
          difficulty: ['facil', 'intermedio', 'dificil'][i % 3],
          isActive: true,
          createdByUserId: teacherAdmin.id,
          schoolId: school.id,
        },
      });
      courses.push(course);

      // Asignar 2 módulos por curso
      const modulesForCourse = modules.slice(i * 2, (i * 2) + 2);
      for (let j = 0; j < modulesForCourse.length; j++) {
        await prisma.courseModule.create({
          data: {
            courseId: course.id,
            moduleId: modulesForCourse[j].id,
            orderIndex: j + 1,
          },
        });
      }
    }
    console.log(`✅ Creados ${courses.length} cursos con módulos asignados`);

    // Inscribir estudiantes a cursos
    for (const student of students) {
      const coursesToEnroll = courses.slice(0, 2); // Cada estudiante se inscribe a 2 cursos
      for (const course of coursesToEnroll) {
        await prisma.courseEnrollment.create({
          data: {
            userId: student.id,
            courseId: course.id,
            status: 'active',
            enrolledAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
          },
        });
      }
    }
    console.log('✅ Estudiantes inscritos a cursos');

    // Crear preguntas
    const questions = [];
    for (let i = 0; i < 50; i++) {
      const lesson = lessons[i % lessons.length];
      const question = await prisma.question.create({
        data: {
          lessonId: lesson.id,
          questionText: `Pregunta ${i + 1}: ¿Cuál es la respuesta correcta?`,
          questionType: 'multiple_choice',
          difficultyLevel: ['facil', 'intermedio', 'dificil'][i % 3],
          explanation: `Explicación de la pregunta ${i + 1}`,
          orderIndex: i + 1,
          createdByUserId: teacherAdmin.id,
        },
      });
      questions.push(question);

      // Crear opciones de respuesta
      const options = ['A', 'B', 'C', 'D'];
      for (let j = 0; j < options.length; j++) {
        await prisma.questionOption.create({
          data: {
            questionId: question.id,
            optionText: `Opción ${options[j]}`,
            optionKey: options[j],
            isCorrect: j === 0, // Siempre A es correcta
          },
        });
      }
    }
    console.log(`✅ Creadas ${questions.length} preguntas con opciones`);

    // Crear exámenes
    const exams = [];
    for (let i = 0; i < 8; i++) {
      const course = courses[i % courses.length];
      const competency = createdCompetencies[i % createdCompetencies.length];
      const exam = await prisma.exam.create({
        data: {
          title: `Examen ${i + 1}: ${competency.displayName}`,
          description: `Descripción del examen ${i + 1}`,
          examType: ['simulacro_completo', 'por_competencia', 'por_modulo'][i % 3],
          courseId: course.id,
          competencyId: competency.id,
          academicGrade: course.academicGrade,
          timeLimitMinutes: 60 + (i * 15),
          totalQuestions: 10 + (i * 5),
          passingScore: 70,
          difficultyLevel: ['intermedio', 'dificil'][i % 2],
          isPublished: true,
          openDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Hace 7 días
          closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // En 30 días
          createdByUserId: teacherAdmin.id,
        },
      });
      exams.push(exam);

      // Asignar preguntas al examen
      const questionsForExam = questions.slice(i * 5, (i * 5) + exam.totalQuestions);
      for (let j = 0; j < questionsForExam.length; j++) {
        await prisma.examQuestion.create({
          data: {
            examId: exam.id,
            questionId: questionsForExam[j].id,
            orderIndex: j + 1,
            lessonId: questionsForExam[j].lessonId,
          },
        });
      }
    }
    console.log(`✅ Creados ${exams.length} exámenes con preguntas asignadas`);

    // Crear resultados de exámenes para algunos estudiantes
    for (const student of students.slice(0, 10)) { // Solo 10 estudiantes con resultados
      const enrolledCourses = await prisma.courseEnrollment.findMany({
        where: { userId: student.id, status: 'active' },
        select: { courseId: true },
      });
      const studentCourseIds = enrolledCourses.map(e => e.courseId);

      const examsForStudent = exams.filter(e => studentCourseIds.includes(e.courseId));

      for (const exam of examsForStudent.slice(0, 2)) { // Máximo 2 exámenes por estudiante
        const score = 60 + Math.floor(Math.random() * 40); // Score entre 60-100
        await prisma.examResult.create({
          data: {
            examId: exam.id,
            userId: student.id,
            score,
            passed: score >= exam.passingScore,
            durationMinutes: Math.floor(Math.random() * exam.timeLimitMinutes),
            startedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
    console.log('✅ Creados resultados de exámenes');

    // Crear progreso de lecciones para algunos estudiantes
    for (const student of students.slice(0, 15)) { // 15 estudiantes con progreso
      const enrolledCourses = await prisma.courseEnrollment.findMany({
        where: { userId: student.id, status: 'active' },
        include: {
          course: {
            include: {
              courseModules: {
                include: {
                  module: {
                    include: {
                      moduleLessons: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      for (const enrollment of enrolledCourses) {
        for (const courseModule of enrollment.course.courseModules) {
          for (const moduleLesson of courseModule.module.moduleLessons) {
            if (Math.random() > 0.3) { // 70% de probabilidad de completar
              await prisma.studentLessonProgress.create({
                data: {
                  userId: student.id,
                  lessonId: moduleLesson.lessonId,
                  status: 'completed',
                  timeSpentMinutes: 15 + Math.floor(Math.random() * 30),
                  completedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                },
              });
            }
          }
        }
      }
    }
    console.log('✅ Creado progreso de lecciones');

    console.log('🎉 Seed completado exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`- ${createdCompetencies.length} competencias`);
    console.log(`- ${schools.length} escuelas`);
    console.log(`- 1 teacher_admin, ${schoolAdmins.length} school_admins, ${students.length} estudiantes`);
    console.log(`- ${lessons.length} lecciones`);
    console.log(`- ${modules.length} módulos`);
    console.log(`- ${courses.length} cursos`);
    console.log(`- ${questions.length} preguntas`);
    console.log(`- ${exams.length} exámenes`);

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
