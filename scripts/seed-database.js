const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// Datos de colegios
const schools = [
  {
    name: "Colegio San José",
    city: "Bogotá",
    neighborhood: "Chapinero",
    address: "Calle 85 #12-45",
    institutionType: "privada",
    academicCalendar: "diurno",
    totalStudents: 1200,
    numberOfCampuses: 2,
    yearsOfOperation: 25,
    contactEmail: "contacto@colegiosanjose.edu.co",
    contactPhone: "601-234-5678"
  },
  {
    name: "Instituto La Salle",
    city: "Medellín",
    neighborhood: "El Poblado",
    address: "Carrera 43A #5-23",
    institutionType: "privada",
    academicCalendar: "diurno",
    totalStudents: 800,
    numberOfCampuses: 1,
    yearsOfOperation: 30,
    contactEmail: "info@lasalle.edu.co",
    contactPhone: "604-567-8901"
  },
  {
    name: "Colegio Santa María",
    city: "Cali",
    neighborhood: "San Antonio",
    address: "Calle 5 #23-45",
    institutionType: "privada",
    academicCalendar: "diurno",
    totalStudents: 950,
    numberOfCampuses: 1,
    yearsOfOperation: 20,
    contactEmail: "santamaria@edu.co",
    contactPhone: "602-345-6789"
  },
  {
    name: "Instituto Nacional",
    city: "Bogotá",
    neighborhood: "La Candelaria",
    address: "Calle 10 #6-38",
    institutionType: "publica",
    academicCalendar: "diurno",
    totalStudents: 1500,
    numberOfCampuses: 3,
    yearsOfOperation: 50,
    contactEmail: "nacional@edu.gov.co",
    contactPhone: "601-456-7890"
  },
  {
    name: "Colegio Moderno",
    city: "Barranquilla",
    neighborhood: "Riomar",
    address: "Carrera 50 #84-123",
    institutionType: "privada",
    academicCalendar: "diurno",
    totalStudents: 600,
    numberOfCampuses: 1,
    yearsOfOperation: 15,
    contactEmail: "moderno@edu.co",
    contactPhone: "605-678-9012"
  }
]

// Competencias
const competencies = [
  {
    id: "comp-matematicas",
    name: "matematicas",
    displayName: "Matemáticas",
    description: "Competencias en matemáticas básicas y avanzadas"
  },
  {
    id: "comp-lectura",
    name: "lectura",
    displayName: "Lectura Crítica",
    description: "Comprensión lectora y análisis crítico"
  },
  {
    id: "comp-ciencias",
    name: "ciencias",
    displayName: "Ciencias Naturales",
    description: "Conocimientos en física, química y biología"
  },
  {
    id: "comp-sociales",
    name: "sociales",
    displayName: "Ciencias Sociales",
    description: "Historia, geografía y ciencias sociales"
  },
  {
    id: "comp-ingles",
    name: "ingles",
    displayName: "Inglés",
    description: "Competencias en lengua extranjera inglés"
  }
]

// Cursos por competencia
const courses = [
  // Matemáticas
  {
    title: "Matemáticas Básicas 6°",
    description: "Fundamentos de matemáticas para sexto grado",
    competencyId: "comp-matematicas",
    academicGrade: "sexto",
    durationWeeks: 16,
    isPublished: true
  },
  {
    title: "Álgebra Intermedia 9°",
    description: "Álgebra para noveno grado",
    competencyId: "comp-matematicas",
    academicGrade: "noveno",
    durationWeeks: 20,
    isPublished: true
  },
  {
    title: "Cálculo Avanzado 11°",
    description: "Cálculo diferencial e integral",
    competencyId: "comp-matematicas",
    academicGrade: "once",
    durationWeeks: 24,
    isPublished: true
  },
  // Lectura
  {
    title: "Comprensión Lectora 7°",
    description: "Desarrollo de habilidades de lectura",
    competencyId: "comp-lectura",
    academicGrade: "septimo",
    durationWeeks: 18,
    isPublished: true
  },
  {
    title: "Análisis Literario 10°",
    description: "Análisis de textos literarios",
    competencyId: "comp-lectura",
    academicGrade: "decimo",
    durationWeeks: 22,
    isPublished: true
  },
  // Ciencias
  {
    title: "Física Fundamental 8°",
    description: "Conceptos básicos de física",
    competencyId: "comp-ciencias",
    academicGrade: "octavo",
    durationWeeks: 20,
    isPublished: true
  },
  {
    title: "Química Orgánica 11°",
    description: "Química orgánica avanzada",
    competencyId: "comp-ciencias",
    academicGrade: "once",
    durationWeeks: 24,
    isPublished: true
  },
  // Sociales
  {
    title: "Historia de Colombia 9°",
    description: "Historia nacional",
    competencyId: "comp-sociales",
    academicGrade: "noveno",
    durationWeeks: 16,
    isPublished: true
  },
  // Inglés
  {
    title: "English Basic 6°",
    description: "Inglés básico para principiantes",
    competencyId: "comp-ingles",
    academicGrade: "sexto",
    durationWeeks: 16,
    isPublished: true
  },
  {
    title: "Advanced English 11°",
    description: "Inglés avanzado",
    competencyId: "comp-ingles",
    academicGrade: "once",
    durationWeeks: 20,
    isPublished: true
  }
]

// Módulos por curso
const modules = [
  // Matemáticas Básicas 6°
  {
    title: "Números Naturales",
    description: "Operaciones con números naturales",
    courseId: null, // Se asignará dinámicamente
    orderIndex: 1,
    isPublished: true
  },
  {
    title: "Fracciones",
    description: "Conceptos y operaciones con fracciones",
    courseId: null,
    orderIndex: 2,
    isPublished: true
  },
  {
    title: "Geometría Básica",
    description: "Figuras geométricas y medición",
    courseId: null,
    orderIndex: 3,
    isPublished: true
  },
  // Álgebra Intermedia 9°
  {
    title: "Expresiones Algebraicas",
    description: "Manejo de variables y expresiones",
    courseId: null,
    orderIndex: 1,
    isPublished: true
  },
  {
    title: "Ecuaciones Lineales",
    description: "Resolución de ecuaciones de primer grado",
    courseId: null,
    orderIndex: 2,
    isPublished: true
  },
  {
    title: "Sistemas de Ecuaciones",
    description: "Métodos de resolución de sistemas",
    courseId: null,
    orderIndex: 3,
    isPublished: true
  }
]

// Lecciones por módulo
const lessons = [
  // Números Naturales
  {
    title: "Suma y Resta",
    content: "Aprende las operaciones básicas de suma y resta con números naturales.",
    theory: "<h2>Suma y Resta de Números Naturales</h2><p>Los números naturales son aquellos que usamos para contar: 1, 2, 3, 4, 5...</p><h3>Suma</h3><p>La suma es la operación que combina dos o más números para obtener un total.</p><h3>Resta</h3><p>La resta es la operación que encuentra la diferencia entre dos números.</p>",
    moduleId: null, // Se asignará dinámicamente
    orderIndex: 1,
    durationMinutes: 45,
    isPublished: true
  },
  {
    title: "Multiplicación",
    content: "Domina la multiplicación de números naturales.",
    theory: "<h2>Multiplicación de Números Naturales</h2><p>La multiplicación es una suma repetida del mismo número.</p><h3>Propiedades</h3><ul><li>Conmutativa: a × b = b × a</li><li>Asociativa: (a × b) × c = a × (b × c)</li><li>Distributiva: a × (b + c) = a × b + a × c</li></ul>",
    moduleId: null,
    orderIndex: 2,
    durationMinutes: 50,
    isPublished: true
  },
  {
    title: "División",
    content: "Aprende a dividir números naturales correctamente.",
    theory: "<h2>División de Números Naturales</h2><p>La división es la operación inversa de la multiplicación.</p><h3>Elementos</h3><ul><li>Dividendo: número que se divide</li><li>Divisor: número por el cual se divide</li><li>Cociente: resultado de la división</li><li>Residuo: lo que sobra</li></ul>",
    moduleId: null,
    orderIndex: 3,
    durationMinutes: 55,
    isPublished: true
  }
]

// Preguntas por lección
const questions = [
  // Suma y Resta
  {
    questionText: "¿Cuál es el resultado de 25 + 17?",
    context: "Resuelve la siguiente suma:",
    optionA: "32",
    optionB: "42",
    optionC: "52",
    optionD: "62",
    correctOption: "B",
    explanation: "25 + 17 = 42. Sumamos las unidades: 5 + 7 = 12, escribimos 2 y llevamos 1. Luego sumamos las decenas: 2 + 1 + 1 = 4.",
    difficultyLevel: "facil",
    lessonId: null, // Se asignará dinámicamente
    competencyId: "comp-matematicas"
  },
  {
    questionText: "Si tengo 48 manzanas y vendo 23, ¿cuántas me quedan?",
    context: "Resuelve el siguiente problema:",
    optionA: "15",
    optionB: "25",
    optionC: "35",
    optionD: "45",
    correctOption: "B",
    explanation: "48 - 23 = 25. Restamos las unidades: 8 - 3 = 5, y las decenas: 4 - 2 = 2.",
    difficultyLevel: "facil",
    lessonId: null,
    competencyId: "comp-matematicas"
  },
  {
    questionText: "¿Cuál es el resultado de 156 - 89?",
    context: "Calcula la siguiente resta:",
    optionA: "57",
    optionB: "67",
    optionC: "77",
    optionD: "87",
    correctOption: "B",
    explanation: "156 - 89 = 67. Restamos las unidades: 6 - 9 (necesitamos pedir prestado), 16 - 9 = 7. Restamos las decenas: 4 - 8 = 6.",
    difficultyLevel: "medio",
    lessonId: null,
    competencyId: "comp-matematicas"
  },
  // Multiplicación
  {
    questionText: "¿Cuánto es 7 × 8?",
    context: "Resuelve la multiplicación:",
    optionA: "48",
    optionB: "56",
    optionC: "64",
    optionD: "72",
    correctOption: "B",
    explanation: "7 × 8 = 56. Podemos pensarlo como 7 + 7 + 7 + 7 + 7 + 7 + 7 + 7 = 56.",
    difficultyLevel: "facil",
    lessonId: null,
    competencyId: "comp-matematicas"
  },
  {
    questionText: "Si un paquete tiene 12 lápices y compro 5 paquetes, ¿cuántos lápices tengo en total?",
    context: "Resuelve el problema:",
    optionA: "50",
    optionB: "55",
    optionC: "60",
    optionD: "65",
    correctOption: "C",
    explanation: "12 × 5 = 60. Multiplicamos 12 por 5: 10 × 5 = 50, 2 × 5 = 10, 50 + 10 = 60.",
    difficultyLevel: "medio",
    lessonId: null,
    competencyId: "comp-matematicas"
  },
  // División
  {
    questionText: "¿Cuánto es 84 ÷ 7?",
    context: "Resuelve la división:",
    optionA: "10",
    optionB: "11",
    optionC: "12",
    optionD: "13",
    correctOption: "C",
    explanation: "84 ÷ 7 = 12. Verificamos: 7 × 12 = 84.",
    difficultyLevel: "medio",
    lessonId: null,
    competencyId: "comp-matematicas"
  },
  {
    questionText: "Si reparto 96 caramelos entre 8 niños, ¿cuántos caramelos le tocan a cada niño?",
    context: "Resuelve el problema:",
    optionA: "10",
    optionB: "11",
    optionC: "12",
    optionD: "13",
    correctOption: "C",
    explanation: "96 ÷ 8 = 12. Cada niño recibe 12 caramelos.",
    difficultyLevel: "medio",
    lessonId: null,
    competencyId: "comp-matematicas"
  }
]

// Usuarios de prueba
const users = [
  {
    email: "admin@educasaber.com",
    password: "admin123",
    firstName: "Admin",
    lastName: "Sistema",
    role: "teacher_admin",
    schoolId: null
  },
  {
    email: "director@colegiosanjose.edu.co",
    password: "director123",
    firstName: "María",
    lastName: "González",
    role: "school_admin",
    schoolId: null // Se asignará dinámicamente
  },
  {
    email: "profesor@colegiosanjose.edu.co",
    password: "profesor123",
    firstName: "Carlos",
    lastName: "Rodríguez",
    role: "teacher_admin",
    schoolId: null
  },
  {
    email: "estudiante1@colegiosanjose.edu.co",
    password: "estudiante123",
    firstName: "Ana",
    lastName: "Martínez",
    role: "student",
    schoolId: null,
    academicGrade: "sexto"
  },
  {
    email: "estudiante2@colegiosanjose.edu.co",
    password: "estudiante123",
    firstName: "Luis",
    lastName: "Pérez",
    role: "student",
    schoolId: null,
    academicGrade: "noveno"
  }
]

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed de la base de datos...')

    // 1. Crear competencias
    console.log('📚 Creando competencias...')
    for (const comp of competencies) {
      await prisma.competency.upsert({
        where: { id: comp.id },
        update: comp,
        create: comp
      })
    }

    // 2. Crear colegios
    console.log('🏫 Creando colegios...')
    const createdSchools = []
    for (const school of schools) {
      const created = await prisma.school.upsert({
        where: { name: school.name },
        update: school,
        create: school
      })
      createdSchools.push(created)
    }

    // 3. Crear usuarios
    console.log('👥 Creando usuarios...')
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    // Admin del sistema
    await prisma.user.upsert({
      where: { email: users[0].email },
      update: { ...users[0], password: hashedPassword },
      create: { ...users[0], password: hashedPassword }
    })

    // Admin de colegio (asignar al primer colegio)
    await prisma.user.upsert({
      where: { email: users[1].email },
      update: { 
        ...users[1], 
        password: hashedPassword,
        schoolId: createdSchools[0].id
      },
      create: { 
        ...users[1], 
        password: hashedPassword,
        schoolId: createdSchools[0].id
      }
    })

    // Profesor admin
    await prisma.user.upsert({
      where: { email: users[2].email },
      update: { ...users[2], password: hashedPassword },
      create: { ...users[2], password: hashedPassword }
    })

    // Estudiantes
    for (let i = 3; i < users.length; i++) {
      await prisma.user.upsert({
        where: { email: users[i].email },
        update: { 
          ...users[i], 
          password: hashedPassword,
          schoolId: createdSchools[0].id
        },
        create: { 
          ...users[i], 
          password: hashedPassword,
          schoolId: createdSchools[0].id
        }
      })
    }

    // 4. Crear cursos
    console.log('📖 Creando cursos...')
    const createdCourses = []
    for (const course of courses) {
      const created = await prisma.course.create({
        data: course
      })
      createdCourses.push(created)
    }

    // 5. Crear módulos
    console.log('📚 Creando módulos...')
    const createdModules = []
    let moduleIndex = 0
    
    for (let i = 0; i < createdCourses.length; i++) {
      const course = createdCourses[i]
      const courseModules = modules.slice(moduleIndex, moduleIndex + 3) // 3 módulos por curso
      
      for (let j = 0; j < courseModules.length; j++) {
        const module = {
          ...courseModules[j],
          courseId: course.id,
          orderIndex: j + 1
        }
        const created = await prisma.module.create({
          data: module
        })
        createdModules.push(created)
      }
      moduleIndex += 3
    }

    // 6. Crear lecciones
    console.log('📝 Creando lecciones...')
    const createdLessons = []
    let lessonIndex = 0
    
    for (let i = 0; i < createdModules.length; i++) {
      const module = createdModules[i]
      const moduleLessons = lessons.slice(lessonIndex, lessonIndex + 3) // 3 lecciones por módulo
      
      for (let j = 0; j < moduleLessons.length; j++) {
        const lesson = {
          ...moduleLessons[j],
          moduleId: module.id,
          orderIndex: j + 1
        }
        const created = await prisma.lesson.create({
          data: lesson
        })
        createdLessons.push(created)
      }
      lessonIndex += 3
    }

    // 7. Crear preguntas
    console.log('❓ Creando preguntas...')
    let questionIndex = 0
    
    for (let i = 0; i < createdLessons.length; i++) {
      const lesson = createdLessons[i]
      const lessonQuestions = questions.slice(questionIndex, questionIndex + 2) // 2 preguntas por lección
      
      for (let j = 0; j < lessonQuestions.length; j++) {
        const question = {
          ...lessonQuestions[j],
          lessonId: lesson.id
        }
        await prisma.question.create({
          data: question
        })
      }
      questionIndex += 2
    }

    // 8. Crear exámenes de ejemplo
    console.log('📝 Creando exámenes...')
    const exam = await prisma.exam.create({
      data: {
        title: "Examen de Matemáticas Básicas",
        description: "Evaluación de conceptos fundamentales de matemáticas",
        examType: "por_competencia",
        competencyId: "comp-matematicas",
        academicGrade: "sexto",
        timeLimitMinutes: 60,
        passingScore: 70,
        difficultyLevel: "medio",
        isAdaptive: false,
        isPublished: true,
        openDate: new Date(),
        closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
      }
    })

    console.log('✅ Seed completado exitosamente!')
    console.log(`📊 Resumen:`)
    console.log(`   - ${competencies.length} competencias`)
    console.log(`   - ${schools.length} colegios`)
    console.log(`   - ${users.length} usuarios`)
    console.log(`   - ${courses.length} cursos`)
    console.log(`   - ${createdModules.length} módulos`)
    console.log(`   - ${createdLessons.length} lecciones`)
    console.log(`   - ${questions.length} preguntas`)
    console.log(`   - 1 examen`)

  } catch (error) {
    console.error('❌ Error durante el seed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedDatabase()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
