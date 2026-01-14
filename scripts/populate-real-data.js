const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Datos de colegios realistas
const schools = [
  {
    name: "Colegio San José",
    daneCode: "123456789012",
    institutionType: "privada",
    academicCalendar: "diurno",
    totalStudents: 450,
    numberOfCampuses: 1,
    yearsOfOperation: 25,
    city: "Bogotá",
    neighborhood: "Chapinero",
    address: "Carrera 7 # 32-16",
    contactEmail: "info@colegiosanjose.edu.co",
    contactPhone: "601-234-5678",
    website: "www.colegiosanjose.edu.co"
  },
  {
    name: "Instituto La Salle",
    daneCode: "234567890123",
    institutionType: "privada",
    academicCalendar: "diurno",
    totalStudents: 380,
    numberOfCampuses: 1,
    yearsOfOperation: 30,
    city: "Medellín",
    neighborhood: "El Poblado",
    address: "Calle 50 # 45-23",
    contactEmail: "contacto@lasalle.edu.co",
    contactPhone: "604-345-6789",
    website: "www.lasalle.edu.co"
  },
  {
    name: "Colegio Santa María",
    daneCode: "345678901234",
    institutionType: "privada",
    academicCalendar: "diurno",
    totalStudents: 320,
    numberOfCampuses: 1,
    yearsOfOperation: 20,
    city: "Cali",
    neighborhood: "San Fernando",
    address: "Avenida 6N # 28-30",
    contactEmail: "info@santamaria.edu.co",
    contactPhone: "602-456-7890",
    website: "www.santamaria.edu.co"
  },
  {
    name: "Liceo Nacional",
    daneCode: "456789012345",
    institutionType: "publica",
    academicCalendar: "diurno",
    totalStudents: 600,
    numberOfCampuses: 1,
    yearsOfOperation: 40,
    city: "Barranquilla",
    neighborhood: "Centro",
    address: "Calle 72 # 45-12",
    contactEmail: "liceo@nacional.edu.co",
    contactPhone: "605-567-8901",
    website: "www.liceonacional.edu.co"
  },
  {
    name: "Colegio Moderno",
    daneCode: "567890123456",
    institutionType: "privada",
    academicCalendar: "diurno",
    totalStudents: 280,
    numberOfCampuses: 1,
    yearsOfOperation: 15,
    city: "Bucaramanga",
    neighborhood: "Cabecera",
    address: "Carrera 27 # 15-45",
    contactEmail: "info@moderno.edu.co",
    contactPhone: "607-678-9012",
    website: "www.moderno.edu.co"
  }
]

// Competencias educativas
const competencies = [
  { name: "Matemáticas", displayName: "Matemáticas", description: "Competencia en resolución de problemas matemáticos" },
  { name: "Lectura Crítica", displayName: "Lectura Crítica", description: "Análisis e interpretación de textos" },
  { name: "Ciencias Naturales", displayName: "Ciencias Naturales", description: "Comprensión de fenómenos naturales" },
  { name: "Ciencias Sociales", displayName: "Ciencias Sociales", description: "Análisis de fenómenos sociales" },
  { name: "Inglés", displayName: "Inglés", description: "Comunicación en lengua extranjera" },
  { name: "Arte", displayName: "Arte", description: "Expresión artística y creativa" },
  { name: "Educación Física", displayName: "Educación Física", description: "Desarrollo físico y deportivo" }
]

// Cursos por competencia y grado
const courses = [
  // Matemáticas
  { title: "Matemáticas 6°", description: "Fundamentos de aritmética y geometría básica", year: 6, competencyName: "Matemáticas" },
  { title: "Matemáticas 7°", description: "Álgebra básica y geometría plana", year: 7, competencyName: "Matemáticas" },
  { title: "Matemáticas 8°", description: "Álgebra intermedia y trigonometría", year: 8, competencyName: "Matemáticas" },
  { title: "Matemáticas 9°", description: "Álgebra avanzada y geometría analítica", year: 9, competencyName: "Matemáticas" },
  { title: "Matemáticas 10°", description: "Cálculo diferencial básico", year: 10, competencyName: "Matemáticas" },
  { title: "Matemáticas 11°", description: "Cálculo integral y estadística", year: 11, competencyName: "Matemáticas" },
  
  // Lectura Crítica
  { title: "Lectura Crítica 6°", description: "Comprensión lectora básica", year: 6, competencyName: "Lectura Crítica" },
  { title: "Lectura Crítica 7°", description: "Análisis de textos narrativos", year: 7, competencyName: "Lectura Crítica" },
  { title: "Lectura Crítica 8°", description: "Análisis de textos argumentativos", year: 8, competencyName: "Lectura Crítica" },
  { title: "Lectura Crítica 9°", description: "Análisis crítico de textos", year: 9, competencyName: "Lectura Crítica" },
  { title: "Lectura Crítica 10°", description: "Análisis de textos académicos", year: 10, competencyName: "Lectura Crítica" },
  { title: "Lectura Crítica 11°", description: "Análisis crítico avanzado", year: 11, competencyName: "Lectura Crítica" },
  
  // Ciencias Naturales
  { title: "Ciencias Naturales 6°", description: "Introducción a las ciencias", year: 6, competencyName: "Ciencias Naturales" },
  { title: "Ciencias Naturales 7°", description: "Biología básica", year: 7, competencyName: "Ciencias Naturales" },
  { title: "Ciencias Naturales 8°", description: "Física básica", year: 8, competencyName: "Ciencias Naturales" },
  { title: "Ciencias Naturales 9°", description: "Química básica", year: 9, competencyName: "Ciencias Naturales" },
  { title: "Ciencias Naturales 10°", description: "Biología avanzada", year: 10, competencyName: "Ciencias Naturales" },
  { title: "Ciencias Naturales 11°", description: "Física y química avanzada", year: 11, competencyName: "Ciencias Naturales" },
  
  // Ciencias Sociales
  { title: "Ciencias Sociales 6°", description: "Historia de Colombia básica", year: 6, competencyName: "Ciencias Sociales" },
  { title: "Ciencias Sociales 7°", description: "Geografía de Colombia", year: 7, competencyName: "Ciencias Sociales" },
  { title: "Ciencias Sociales 8°", description: "Historia universal", year: 8, competencyName: "Ciencias Sociales" },
  { title: "Ciencias Sociales 9°", description: "Geografía mundial", year: 9, competencyName: "Ciencias Sociales" },
  { title: "Ciencias Sociales 10°", description: "Historia contemporánea", year: 10, competencyName: "Ciencias Sociales" },
  { title: "Ciencias Sociales 11°", description: "Análisis político y social", year: 11, competencyName: "Ciencias Sociales" },
  
  // Inglés
  { title: "Inglés 6°", description: "Inglés básico A1", year: 6, competencyName: "Inglés" },
  { title: "Inglés 7°", description: "Inglés básico A2", year: 7, competencyName: "Inglés" },
  { title: "Inglés 8°", description: "Inglés intermedio B1", year: 8, competencyName: "Inglés" },
  { title: "Inglés 9°", description: "Inglés intermedio B2", year: 9, competencyName: "Inglés" },
  { title: "Inglés 10°", description: "Inglés avanzado C1", year: 10, competencyName: "Inglés" },
  { title: "Inglés 11°", description: "Inglés avanzado C2", year: 11, competencyName: "Inglés" }
]

// Módulos por curso
const modules = [
  // Matemáticas 6°
  { title: "Números Naturales", description: "Operaciones básicas con números naturales", order: 1, courseTitle: "Matemáticas 6°" },
  { title: "Fracciones", description: "Conceptos básicos de fracciones", order: 2, courseTitle: "Matemáticas 6°" },
  { title: "Geometría Básica", description: "Figuras geométricas elementales", order: 3, courseTitle: "Matemáticas 6°" },
  
  // Matemáticas 7°
  { title: "Álgebra Básica", description: "Expresiones algebraicas simples", order: 1, courseTitle: "Matemáticas 7°" },
  { title: "Ecuaciones Lineales", description: "Resolución de ecuaciones de primer grado", order: 2, courseTitle: "Matemáticas 7°" },
  { title: "Geometría Plana", description: "Propiedades de figuras planas", order: 3, courseTitle: "Matemáticas 7°" },
  
  // Lectura Crítica 6°
  { title: "Comprensión Literal", description: "Lectura y comprensión básica", order: 1, courseTitle: "Lectura Crítica 6°" },
  { title: "Vocabulario", description: "Ampliación del vocabulario", order: 2, courseTitle: "Lectura Crítica 6°" },
  { title: "Textos Narrativos", description: "Análisis de cuentos y relatos", order: 3, courseTitle: "Lectura Crítica 6°" },
  
  // Ciencias Naturales 6°
  { title: "Método Científico", description: "Introducción al método científico", order: 1, courseTitle: "Ciencias Naturales 6°" },
  { title: "Seres Vivos", description: "Características de los seres vivos", order: 2, courseTitle: "Ciencias Naturales 6°" },
  { title: "Materia y Energía", description: "Conceptos básicos de materia", order: 3, courseTitle: "Ciencias Naturales 6°" }
]

// Lecciones por módulo
const lessons = [
  // Números Naturales
  { title: "Suma y Resta", description: "Operaciones básicas de suma y resta", order: 1, moduleTitle: "Números Naturales", estimatedTimeMinutes: 45 },
  { title: "Multiplicación", description: "Tablas de multiplicar y operaciones", order: 2, moduleTitle: "Números Naturales", estimatedTimeMinutes: 50 },
  { title: "División", description: "División básica y problemas", order: 3, moduleTitle: "Números Naturales", estimatedTimeMinutes: 55 },
  
  // Fracciones
  { title: "Concepto de Fracción", description: "Qué es una fracción", order: 1, moduleTitle: "Fracciones", estimatedTimeMinutes: 40 },
  { title: "Fracciones Equivalentes", description: "Fracciones que representan la misma cantidad", order: 2, moduleTitle: "Fracciones", estimatedTimeMinutes: 45 },
  { title: "Suma de Fracciones", description: "Suma de fracciones con igual denominador", order: 3, moduleTitle: "Fracciones", estimatedTimeMinutes: 50 },
  
  // Geometría Básica
  { title: "Puntos y Líneas", description: "Elementos básicos de geometría", order: 1, moduleTitle: "Geometría Básica", estimatedTimeMinutes: 35 },
  { title: "Triángulos", description: "Tipos de triángulos", order: 2, moduleTitle: "Geometría Básica", estimatedTimeMinutes: 40 },
  { title: "Cuadriláteros", description: "Cuadrados, rectángulos y paralelogramos", order: 3, moduleTitle: "Geometría Básica", estimatedTimeMinutes: 45 }
]

// Preguntas por lección
const questions = [
  // Suma y Resta
  { 
    questionText: "¿Cuánto es 15 + 23?", 
    questionType: "multiple_choice", 
    options: ["38", "35", "40", "42"], 
    correctAnswer: "38", 
    explanation: "15 + 23 = 38", 
    difficultyLevel: "basico", 
    lessonTitle: "Suma y Resta" 
  },
  { 
    questionText: "Si tengo 45 manzanas y regalo 12, ¿cuántas me quedan?", 
    questionType: "multiple_choice", 
    options: ["33", "32", "34", "31"], 
    correctAnswer: "33", 
    explanation: "45 - 12 = 33", 
    difficultyLevel: "basico", 
    lessonTitle: "Suma y Resta" 
  },
  
  // Multiplicación
  { 
    questionText: "¿Cuánto es 7 × 8?", 
    questionType: "multiple_choice", 
    options: ["56", "54", "58", "60"], 
    correctAnswer: "56", 
    explanation: "7 × 8 = 56", 
    difficultyLevel: "basico", 
    lessonTitle: "Multiplicación" 
  },
  { 
    questionText: "Si cada caja tiene 6 lápices y tengo 9 cajas, ¿cuántos lápices tengo en total?", 
    questionType: "multiple_choice", 
    options: ["54", "52", "56", "58"], 
    correctAnswer: "54", 
    explanation: "6 × 9 = 54", 
    difficultyLevel: "intermedio", 
    lessonTitle: "Multiplicación" 
  },
  
  // Concepto de Fracción
  { 
    questionText: "¿Qué fracción representa la parte sombreada en un círculo dividido en 4 partes iguales con 3 partes sombreadas?", 
    questionType: "multiple_choice", 
    options: ["3/4", "1/4", "2/4", "4/4"], 
    correctAnswer: "3/4", 
    explanation: "3 de 4 partes están sombreadas, por lo tanto 3/4", 
    difficultyLevel: "basico", 
    lessonTitle: "Concepto de Fracción" 
  }
]

// Función para generar nombres aleatorios
function generateRandomName() {
  const firstNames = [
    "Ana", "Carlos", "María", "José", "Laura", "Diego", "Sofía", "Andrés", "Camila", "Santiago",
    "Valentina", "Nicolás", "Isabella", "Sebastián", "Valeria", "Mateo", "Gabriela", "Samuel", "Natalia", "Daniel",
    "Alejandra", "David", "Paula", "Alejandro", "Mariana", "Felipe", "Daniela", "Juan", "Carolina", "Miguel"
  ]
  const lastNames = [
    "García", "Rodríguez", "Martínez", "Hernández", "López", "González", "Pérez", "Sánchez", "Ramírez", "Cruz",
    "Flores", "Rivera", "Gómez", "Díaz", "Reyes", "Morales", "Jiménez", "Álvarez", "Ruiz", "Torres"
  ]
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  return { firstName, lastName }
}

// Función para generar email único
function generateEmail(firstName, lastName) {
  const domains = ["gmail.com", "hotmail.com", "yahoo.com", "outlook.com"]
  const domain = domains[Math.floor(Math.random() * domains.length)]
  const timestamp = Date.now()
  const randomNum = Math.floor(Math.random() * 1000)
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${timestamp}.${randomNum}@${domain}`
}

// Función para generar fecha de nacimiento (entre 12 y 18 años)
function generateBirthDate() {
  const currentYear = new Date().getFullYear()
  const age = Math.floor(Math.random() * 7) + 12 // Entre 12 y 18 años
  const birthYear = currentYear - age
  const month = Math.floor(Math.random() * 12) + 1
  const day = Math.floor(Math.random() * 28) + 1
  return new Date(birthYear, month - 1, day)
}

async function populateDatabase() {
  try {
    console.log('🚀 Iniciando población de base de datos...')

    // 1. Crear competencias (si no existen)
    console.log('📚 Creando competencias...')
    const createdCompetencies = []
    for (const comp of competencies) {
      let competency = await prisma.competency.findUnique({
        where: { name: comp.name }
      })
      
      if (!competency) {
        competency = await prisma.competency.create({
          data: comp
        })
        console.log(`✅ Competencia creada: ${competency.name}`)
      } else {
        console.log(`ℹ️ Competencia ya existe: ${competency.name}`)
      }
      createdCompetencies.push(competency)
    }

    // 2. Crear colegios (si no existen)
    console.log('🏫 Creando colegios...')
    const createdSchools = []
    for (const schoolData of schools) {
      let school = await prisma.school.findUnique({
        where: { daneCode: schoolData.daneCode }
      })
      
      if (!school) {
        school = await prisma.school.create({
          data: schoolData
        })
        console.log(`✅ Colegio creado: ${school.name}`)
      } else {
        console.log(`ℹ️ Colegio ya existe: ${school.name}`)
      }
      createdSchools.push(school)
    }

    // 3. Crear profesores (1 por colegio)
    console.log('👨‍🏫 Creando profesores...')
    const createdProfessors = []
    for (const school of createdSchools) {
      // Verificar si ya existe un profesor para este colegio
      let professor = await prisma.user.findFirst({
        where: {
          role: 'school_admin',
          school: { id: school.id }
        }
      })
      
      if (!professor) {
        const { firstName, lastName } = generateRandomName()
        const email = `profesor@${school.name.toLowerCase().replace(/\s+/g, '')}.edu.co`
        
        professor = await prisma.user.create({
          data: {
            email,
            passwordHash: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJapJjJpJjJpJjJpJjJp', // password: "password123"
            role: 'school_admin',
            firstName,
            lastName,
            schoolId: school.id,
            dateOfBirth: generateBirthDate(),
            gender: Math.random() > 0.5 ? 'masculino' : 'femenino',
            socioeconomicStratum: Math.floor(Math.random() * 3) + 3 // Estratos 3-5
          }
        })
        console.log(`✅ Profesor creado: ${professor.firstName} ${professor.lastName} para ${school.name}`)
      } else {
        console.log(`ℹ️ Profesor ya existe para ${school.name}: ${professor.firstName} ${professor.lastName}`)
      }
      createdProfessors.push(professor)
    }

    // 4. Crear estudiantes (20-50 por colegio)
    console.log('👨‍🎓 Creando estudiantes...')
    const createdStudents = []
    for (const school of createdSchools) {
      const studentCount = Math.floor(Math.random() * 31) + 20 // Entre 20 y 50 estudiantes
      
      for (let i = 0; i < studentCount; i++) {
        const { firstName, lastName } = generateRandomName()
        const email = generateEmail(firstName, lastName)
        
        const student = await prisma.user.create({
          data: {
            email,
            passwordHash: '$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJapJjJpJjJpJjJpJjJp', // password: "password123"
            role: 'student',
            firstName,
            lastName,
            schoolId: school.id,
            dateOfBirth: generateBirthDate(),
            gender: Math.random() > 0.5 ? 'masculino' : 'femenino',
            socioeconomicStratum: Math.floor(Math.random() * 6) + 1, // Estratos 1-6
            academicAverage: Math.random() * 2 + 3 // Entre 3.0 y 5.0
          }
        })
        createdStudents.push(student)
      }
      console.log(`✅ ${studentCount} estudiantes creados para ${school.name}`)
    }

    // 5. Crear cursos
    console.log('📖 Creando cursos...')
    const createdCourses = []
    for (const courseData of courses) {
      const competency = createdCompetencies.find(c => c.name === courseData.competencyName)
      if (!competency) continue
      
      // Crear curso para cada colegio
      for (const school of createdSchools) {
        const course = await prisma.course.create({
          data: {
            title: courseData.title,
            description: courseData.description,
            academicGrade: ['sexto', 'septimo', 'octavo', 'noveno', 'decimo', 'once'][courseData.year - 6],
            competencyId: competency.id,
            schoolId: school.id,
            createdById: createdProfessors.find(p => p.school?.id === school.id)?.id
          }
        })
        createdCourses.push(course)
      }
    }
    console.log(`✅ ${createdCourses.length} cursos creados`)

    // 6. Crear módulos
    console.log('📚 Creando módulos...')
    const createdModules = []
    for (const moduleData of modules) {
      const course = createdCourses.find(c => c.title === moduleData.courseTitle)
      if (!course) continue
      
      const module = await prisma.module.create({
        data: {
          title: moduleData.title,
          description: moduleData.description,
          orderIndex: moduleData.order,
          createdById: createdProfessors.find(p => p.school?.id === course.schoolId)?.id
        }
      })
      
      // Crear la relación entre curso y módulo
      await prisma.courseModule.create({
        data: {
          courseId: course.id,
          moduleId: module.id,
          orderIndex: moduleData.order
        }
      })
      createdModules.push(module)
    }
    console.log(`✅ ${createdModules.length} módulos creados`)

    // 7. Crear lecciones
    console.log('📝 Creando lecciones...')
    const createdLessons = []
    for (const lessonData of lessons) {
      const module = createdModules.find(m => m.title === lessonData.moduleTitle)
      if (!module) continue
      
      const lesson = await prisma.lesson.create({
        data: {
          title: lessonData.title,
          description: lessonData.description,
          estimatedTimeMinutes: lessonData.estimatedTimeMinutes
        }
      })
      
      // Crear la relación entre módulo y lección
      await prisma.moduleLesson.create({
        data: {
          moduleId: module.id,
          lessonId: lesson.id,
          orderIndex: lessonData.order
        }
      })
      createdLessons.push(lesson)
    }
    console.log(`✅ ${createdLessons.length} lecciones creadas`)

    // 8. Crear preguntas
    console.log('❓ Creando preguntas...')
    const createdQuestions = []
    for (const questionData of questions) {
      const lesson = createdLessons.find(l => l.title === questionData.lessonTitle)
      if (!lesson) continue
      
      const question = await prisma.lessonQuestion.create({
        data: {
          questionText: questionData.questionText,
          questionType: questionData.questionType,
          optionA: questionData.options[0],
          optionB: questionData.options[1],
          optionC: questionData.options[2],
          optionD: questionData.options[3],
          correctOption: questionData.correctAnswer,
          explanation: questionData.explanation,
          difficultyLevel: questionData.difficultyLevel,
          lessonId: lesson.id,
          orderIndex: 1
        }
      })
      createdQuestions.push(question)
    }
    console.log(`✅ ${createdQuestions.length} preguntas creadas`)

    // 9. Crear exámenes
    console.log('📋 Creando exámenes...')
    const createdExams = []
    for (const course of createdCourses.slice(0, 10)) { // Solo algunos cursos
      const exam = await prisma.exam.create({
        data: {
          title: `Examen de ${course.title}`,
          description: `Evaluación de conocimientos en ${course.title}`,
          examType: 'por_competencia',
          courseId: course.id,
          competencyId: course.competencyId,
          academicGrade: ['sexto', 'septimo', 'octavo', 'noveno', 'decimo', 'once'][course.year - 6],
          timeLimitMinutes: 60,
          passingScore: 70,
          difficultyLevel: 'intermedio',
          isAdaptive: false,
          isPublished: true,
          openDate: new Date(),
          closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días desde ahora
          createdById: createdProfessors.find(p => p.school?.id === course.school?.id)?.id
        }
      })
      createdExams.push(exam)
    }
    console.log(`✅ ${createdExams.length} exámenes creados`)

    // 10. Asignar preguntas a exámenes
    console.log('🔗 Asignando preguntas a exámenes...')
    for (const exam of createdExams) {
      const courseQuestions = createdQuestions.filter(q => 
        q.lesson?.module?.course?.competencyId === exam.competencyId
      )
      
      // Asignar 3-5 preguntas aleatorias a cada examen
      const questionsToAssign = courseQuestions.slice(0, Math.min(5, courseQuestions.length))
      
      for (const question of questionsToAssign) {
        await prisma.examQuestion.create({
          data: {
            examId: exam.id,
            questionId: question.id,
            order: Math.floor(Math.random() * 10) + 1
          }
        })
      }
    }
    console.log(`✅ Preguntas asignadas a exámenes`)

    console.log('🎉 ¡Base de datos poblada exitosamente!')
    console.log(`📊 Resumen:`)
    console.log(`   - ${createdSchools.length} colegios`)
    console.log(`   - ${createdProfessors.length} profesores`)
    console.log(`   - ${createdStudents.length} estudiantes`)
    console.log(`   - ${createdCourses.length} cursos`)
    console.log(`   - ${createdModules.length} módulos`)
    console.log(`   - ${createdLessons.length} lecciones`)
    console.log(`   - ${createdQuestions.length} preguntas`)
    console.log(`   - ${createdExams.length} exámenes`)

  } catch (error) {
    console.error('❌ Error al poblar la base de datos:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar el script
populateDatabase()
  .then(() => {
    console.log('✅ Script completado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error en el script:', error)
    process.exit(1)
  })
