import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Crear un colegio de prueba
  const school = await prisma.school.upsert({
    where: { id: 'test-school-1' },
    update: {},
    create: {
      id: 'test-school-1',
      name: 'Colegio de Prueba',
      address: 'Calle 123 #45-67',
      city: 'Bogotá',
      neighborhood: 'Chapinero',
      institutionType: 'PRIVADA',
      academicCalendar: 'DIURNO',
      totalStudents: 500,
      numberOfCampuses: 1,
      yearsOfOperation: 10,
      contactEmail: 'admin@colegio.com',
      contactPhone: '+573001234567',
      activeStudentsCount: 450,
      averageStudentUsageMinutes: 120,
    },
  })

  // Hash de las contraseñas
  const hashedPassword = await bcrypt.hash('123456', 12)

  // Crear usuarios de prueba con las nuevas credenciales
  const student = await prisma.user.upsert({
    where: { email: 'estudiante@test.com' },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      email: 'estudiante@test.com',
      passwordHash: hashedPassword,
      firstName: 'Juan',
      lastName: 'Pérez',
      role: 'student',
      schoolId: school.id,
    },
  })

  const schoolAdmin = await prisma.user.upsert({
    where: { email: 'admin@colegio.com' },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      email: 'admin@colegio.com',
      passwordHash: hashedPassword,
      firstName: 'María',
      lastName: 'García',
      role: 'school_admin',
      schoolId: school.id,
    },
  })

  const professorAdmin = await prisma.user.upsert({
    where: { email: 'profesor@admin.com' },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      email: 'profesor@admin.com',
      passwordHash: hashedPassword,
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      role: 'teacher_admin',
    },
  })

  // Crear competencias ICFES
  const competencies = await Promise.all([
    prisma.competency.upsert({
      where: { name: 'lectura_critica' },
      update: {},
      create: {
        name: 'lectura_critica',
        displayName: 'Lectura Crítica',
        description: 'Comprensión y análisis de textos escritos',
        colorHex: '#3B82F6',
        iconName: 'book-open',
      },
    }),
    prisma.competency.upsert({
      where: { name: 'matematicas' },
      update: {},
      create: {
        name: 'matematicas',
        displayName: 'Razonamiento Cuantitativo',
        description: 'Resolución de problemas matemáticos',
        colorHex: '#EF4444',
        iconName: 'calculator',
      },
    }),
    prisma.competency.upsert({
      where: { name: 'sociales' },
      update: {},
      create: {
        name: 'sociales',
        displayName: 'Competencias Ciudadanas',
        description: 'Análisis de fenómenos sociales',
        colorHex: '#10B981',
        iconName: 'users',
      },
    }),
    prisma.competency.upsert({
      where: { name: 'ciencias' },
      update: {},
      create: {
        name: 'ciencias',
        displayName: 'Ciencias Naturales',
        description: 'Comprensión de fenómenos naturales',
        colorHex: '#F59E0B',
        iconName: 'flask',
      },
    }),
    prisma.competency.upsert({
      where: { name: 'ingles' },
      update: {},
      create: {
        name: 'ingles',
        displayName: 'Inglés',
        description: 'Comprensión de textos en inglés',
        colorHex: '#8B5CF6',
        iconName: 'globe',
      },
    }),
  ])

  // Crear módulos de ejemplo (creados por Profesor Administrador)
  const modules = await Promise.all([
    prisma.module.upsert({
      where: { id: 'module-math-1' },
      update: {},
      create: {
        id: 'module-math-1',
        title: 'Álgebra y Funciones',
        description: 'Operaciones con polinomios y funciones básicas',
        estimatedTimeMinutes: 120,
        orderIndex: 1,
        isPublished: true,
        createdById: professorAdmin.id,
      },
    }),
    prisma.module.upsert({
      where: { id: 'module-math-2' },
      update: {},
      create: {
        id: 'module-math-2',
        title: 'Geometría',
        description: 'Conceptos básicos de geometría plana',
        estimatedTimeMinutes: 90,
        orderIndex: 2,
        isPublished: true,
        createdById: professorAdmin.id,
      },
    }),
  ])

  // Crear lecciones de ejemplo
  const lessons = await Promise.all([
    prisma.lesson.upsert({
      where: { id: 'lesson-math-1-1' },
      update: {},
      create: {
        id: 'lesson-math-1-1',
        title: 'Operaciones con Polinomios',
        description: 'Suma, resta y multiplicación de polinomios',
        estimatedTimeMinutes: 45,
        isPublished: true,
        videoUrl: 'https://example.com/video1.mp4',
        videoDescription: 'Video explicativo sobre operaciones con polinomios',
        theoryContent: 'Teoría sobre operaciones con polinomios...',
      },
    }),
    prisma.lesson.upsert({
      where: { id: 'lesson-math-1-2' },
      update: {},
      create: {
        id: 'lesson-math-1-2',
        title: 'Factorización',
        description: 'Métodos de factorización de polinomios',
        estimatedTimeMinutes: 60,
        isPublished: true,
        videoUrl: 'https://example.com/video2.mp4',
        videoDescription: 'Video explicativo sobre factorización',
        theoryContent: 'Teoría sobre factorización...',
      },
    }),
  ])

  // Crear relaciones ModuleLesson
  await Promise.all([
    prisma.moduleLesson.upsert({
      where: { 
        moduleId_lessonId: {
          moduleId: modules[0].id,
          lessonId: lessons[0].id
        }
      },
      update: {},
      create: {
        moduleId: modules[0].id,
        lessonId: lessons[0].id,
        orderIndex: 1,
      },
    }),
    prisma.moduleLesson.upsert({
      where: { 
        moduleId_lessonId: {
          moduleId: modules[0].id,
          lessonId: lessons[1].id
        }
      },
      update: {},
      create: {
        moduleId: modules[0].id,
        lessonId: lessons[1].id,
        orderIndex: 2,
      },
    }),
  ])

  // Crear preguntas de ejemplo
  await Promise.all([
    prisma.lessonQuestion.upsert({
      where: { id: 'question-1' },
      update: {},
      create: {
        id: 'question-1',
        lessonId: lessons[0].id,
        questionText: '¿Cuál es el resultado de (2x + 3) + (x - 1)?',
        optionA: '3x + 2',
        optionB: '3x + 4',
        optionC: '2x + 2',
        optionD: '2x + 4',
        correctOption: 'A',
        explanation: 'Para sumar polinomios, sumamos los términos semejantes: 2x + x = 3x, 3 + (-1) = 2',
        orderIndex: 1,
        difficultyLevel: 'facil',
      },
    }),
    prisma.lessonQuestion.upsert({
      where: { id: 'question-2' },
      update: {},
      create: {
        id: 'question-2',
        lessonId: lessons[0].id,
        questionText: '¿Cuál es el resultado de (x + 2)(x - 3)?',
        optionA: 'x² - x - 6',
        optionB: 'x² + x - 6',
        optionC: 'x² - x + 6',
        optionD: 'x² + x + 6',
        correctOption: 'A',
        explanation: 'Usando la propiedad distributiva: x(x-3) + 2(x-3) = x² - 3x + 2x - 6 = x² - x - 6',
        orderIndex: 2,
        difficultyLevel: 'medio',
      },
    }),
  ])

  console.log('✅ Database seeded successfully!')
  console.log('Created users:')
  console.log(`- Student: ${student.email}`)
  console.log(`- School Admin: ${schoolAdmin.email}`)
  console.log(`- Professor Admin: ${professorAdmin.email}`)
  console.log(`- School: ${school.name}`)
  console.log(`- Competencies: ${competencies.length}`)
  console.log(`- Modules: ${modules.length}`)
  console.log(`- Lessons: ${lessons.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 