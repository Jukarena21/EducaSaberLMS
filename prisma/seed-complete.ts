import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ============================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================

const ACADEMIC_GRADES = {
  6: 'sexto', 7: 'septimo', 8: 'octavo', 9: 'noveno', 10: 'decimo', 11: 'once'
} as const

// Solo las 5 competencias ICFES para colegios
const ICFES_COMPETENCIES = [
  { 
    name: 'lectura_critica', 
    displayName: 'Lectura Crítica', 
    colorHex: '#3B82F6', 
    iconName: 'book-open',
    description: 'Desarrollo de habilidades para comprender, analizar e interpretar textos de manera crítica.'
  },
  { 
    name: 'razonamiento_cuantitativo', 
    displayName: 'Razonamiento Cuantitativo', 
    colorHex: '#10B981', 
    iconName: 'calculator',
    description: 'Capacidad para resolver problemas matemáticos y aplicar el razonamiento cuantitativo.'
  },
  { 
    name: 'competencias_ciudadanas', 
    displayName: 'Competencias Ciudadanas', 
    colorHex: '#EF4444', 
    iconName: 'users',
    description: 'Desarrollo de habilidades para la convivencia, participación democrática y construcción de paz.'
  },
  { 
    name: 'comunicacion_escrita', 
    displayName: 'Comunicación Escrita', 
    colorHex: '#F59E0B', 
    iconName: 'file-text',
    description: 'Habilidades para expresarse de manera escrita de forma clara, coherente y efectiva.'
  },
  { 
    name: 'ingles', 
    displayName: 'Inglés', 
    colorHex: '#8B5CF6', 
    iconName: 'globe',
    description: 'Desarrollo de competencias comunicativas en inglés como lengua extranjera.'
  },
]

// Competencias generales para empresas (no ICFES)
const GENERAL_COMPETENCIES = [
  { 
    name: 'programacion', 
    displayName: 'Programación', 
    colorHex: '#6366F1', 
    iconName: 'code',
    description: 'Desarrollo de habilidades en programación y desarrollo de software.'
  },
  { 
    name: 'diseno_grafico', 
    displayName: 'Diseño Gráfico', 
    colorHex: '#EC4899', 
    iconName: 'palette',
    description: 'Habilidades en diseño gráfico y comunicación visual.'
  },
]

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Normaliza nombres para usarlos en correos (sin tildes ni espacios)
function slugifyName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function main() {
  console.log('🌱 Iniciando seed completo de base de datos...\n')
  console.log('⚠️  Este proceso limpiará y recreará todos los datos.\n')

  const passwordHash = await bcrypt.hash('123456', 12)

  // ============================================
  // PASO 1: LIMPIAR BASE DE DATOS
  // ============================================
  console.log('🧹 Limpiando base de datos...')
  
  // Eliminar en orden inverso de dependencias
  await prisma.examQuestionAnswer.deleteMany()
  await prisma.examResult.deleteMany()
  await prisma.examQuestion.deleteMany()
  await prisma.exam.deleteMany()
  await prisma.liveClassInvitation.deleteMany()
  await prisma.liveClass.deleteMany()
  await prisma.studentContentProgress.deleteMany()
  await prisma.studentLessonProgress.deleteMany()
  await prisma.studentModuleProgress.deleteMany()
  await prisma.studentCourseProgress.deleteMany()
  await prisma.courseEnrollment.deleteMany()
  await prisma.moduleLesson.deleteMany()
  await prisma.lessonQuestion.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.courseModule.deleteMany()
  await prisma.module.deleteMany()
  await prisma.courseSchool.deleteMany()
  await prisma.course.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.userAchievement.deleteMany()
  await prisma.userStats.deleteMany()
  await prisma.goal.deleteMany()
  await prisma.user.deleteMany()
  await prisma.school.deleteMany()
  await prisma.area.deleteMany()
  
  console.log('  ✅ Base de datos limpiada\n')

  // ============================================
  // PASO 2: CREAR COMPETENCIAS
  // ============================================
  console.log('📚 Creando competencias ICFES...')
  const competencies: any[] = []

  for (const comp of ICFES_COMPETENCIES) {
    const created = await prisma.area.create({
      data: {
        name: comp.name,
        displayName: comp.displayName,
        description: comp.description,
        colorHex: comp.colorHex,
        iconName: comp.iconName,
      },
    })
    competencies.push(created)
    console.log(`  ✅ ${comp.displayName}`)
  }

  // Competencias generales para empresas
  console.log('\n📚 Creando competencias generales...')
  for (const comp of GENERAL_COMPETENCIES) {
    const created = await prisma.area.create({
      data: {
        name: comp.name,
        displayName: comp.displayName,
        description: comp.description,
        colorHex: comp.colorHex,
        iconName: comp.iconName,
      },
    })
    competencies.push(created)
    console.log(`  ✅ ${comp.displayName} (General)`)
  }

  const lecturaCritica = competencies.find(c => c.name === 'lectura_critica')!
  const razonamientoCuantitativo = competencies.find(c => c.name === 'razonamiento_cuantitativo')!
  const competenciasCiudadanas = competencies.find(c => c.name === 'competencias_ciudadanas')!
  const comunicacionEscrita = competencies.find(c => c.name === 'comunicacion_escrita')!
  const ingles = competencies.find(c => c.name === 'ingles')!
  const programacion = competencies.find(c => c.name === 'programacion')!
  const disenoGrafico = competencies.find(c => c.name === 'diseno_grafico')!

  // ============================================
  // PASO 3: CREAR INSTITUCIONES
  // ============================================
  console.log('\n🏫 Creando instituciones...')
  
  const schools: any[] = []

  // Colegio 1: Privado en Bogotá
  const school1 = await prisma.school.create({
    data: {
      name: 'Colegio San José',
      type: 'school',
      daneCode: '123456789012',
      institutionType: 'privada',
      academicCalendar: 'diurno',
      totalStudents: 850,
      numberOfCampuses: 1,
      yearsOfOperation: 25,
      qualityCertifications: JSON.stringify(['ISO 9001', 'Certificación de Calidad Educativa']),
      city: 'Bogotá',
      neighborhood: 'Chapinero',
      address: 'Calle 63 #10-20',
      contactEmail: 'contacto@colegiosanjose.edu.co',
      contactPhone: '601-234-5678',
      website: 'https://www.colegiosanjose.edu.co',
      logoUrl: null,
      themePrimary: '#1E40AF',
      themeSecondary: '#3B82F6',
      themeAccent: '#60A5FA',
    },
  })
  schools.push(school1)
  console.log(`  ✅ ${school1.name}`)

  // Colegio 2: Público en Medellín
  const school2 = await prisma.school.create({
    data: {
      name: 'Instituto Técnico Industrial',
      type: 'school',
      daneCode: '234567890123',
      institutionType: 'publica',
      academicCalendar: 'diurno',
      totalStudents: 1200,
      numberOfCampuses: 2,
      yearsOfOperation: 40,
      qualityCertifications: JSON.stringify(['Certificación de Calidad']),
      city: 'Medellín',
      neighborhood: 'La Candelaria',
      address: 'Carrera 52 #45-30',
      contactEmail: 'contacto@iti.edu.co',
      contactPhone: '604-567-8901',
      website: 'https://www.iti.edu.co',
      logoUrl: null,
      themePrimary: '#059669',
      themeSecondary: '#10B981',
      themeAccent: '#34D399',
    },
  })
  schools.push(school2)
  console.log(`  ✅ ${school2.name}`)

  // Colegio 3: Privado en Cali
  const school3 = await prisma.school.create({
    data: {
      name: 'Colegio Los Andes',
      type: 'school',
      daneCode: '345678901234',
      institutionType: 'privada',
      academicCalendar: 'ambos',
      totalStudents: 650,
      numberOfCampuses: 1,
      yearsOfOperation: 15,
      qualityCertifications: JSON.stringify([]),
      city: 'Cali',
      neighborhood: 'San Fernando',
      address: 'Avenida 6N #28-50',
      contactEmail: 'info@colegiolosandes.edu.co',
      contactPhone: '602-345-6789',
      website: null,
      logoUrl: null,
      themePrimary: '#7C3AED',
      themeSecondary: '#8B5CF6',
      themeAccent: '#A78BFA',
    },
  })
  schools.push(school3)
  console.log(`  ✅ ${school3.name}`)

  // Empresa 1: TechSolutions - Programación Python
  const company1 = await prisma.school.create({
    data: {
      name: 'TechSolutions S.A.S.',
      type: 'company',
      daneCode: null,
      institutionType: 'privada',
      academicCalendar: 'diurno',
      totalStudents: null,
      numberOfCampuses: 1,
      yearsOfOperation: 8,
      qualityCertifications: JSON.stringify(['ISO 9001']),
      city: 'Bogotá',
      neighborhood: 'Zona T',
      address: 'Calle 70 #5-30',
      contactEmail: 'contacto@techsolutions.co',
      contactPhone: '601-987-6543',
      website: 'https://www.techsolutions.co',
      logoUrl: null,
      themePrimary: '#DC2626',
      themeSecondary: '#EF4444',
      themeAccent: '#F87171',
    },
  })
  schools.push(company1)
  console.log(`  ✅ ${company1.name} (Empresa)`)

  // Empresa 2: Diseño Creativo - Diseño Gráfico
  const company2 = await prisma.school.create({
    data: {
      name: 'Diseño Creativo Ltda.',
      type: 'company',
      daneCode: null,
      institutionType: 'privada',
      academicCalendar: 'diurno',
      totalStudents: null,
      numberOfCampuses: 1,
      yearsOfOperation: 5,
      qualityCertifications: JSON.stringify([]),
      city: 'Medellín',
      neighborhood: 'El Poblado',
      address: 'Carrera 43A #1-50',
      contactEmail: 'info@disenocreativo.co',
      contactPhone: '604-123-4567',
      website: 'https://www.disenocreativo.co',
      logoUrl: null,
      themePrimary: '#EC4899',
      themeSecondary: '#F472B6',
      themeAccent: '#F9A8D4',
    },
  })
  schools.push(company2)
  console.log(`  ✅ ${company2.name} (Empresa)`)

  // ============================================
  // PASO 4: CREAR USUARIOS
  // ============================================
  console.log('\n👥 Creando usuarios...')

  // Teacher Admin
  const teacherAdmin = await prisma.user.create({
    data: {
      email: 'profesor@admin.com',
      passwordHash: passwordHash,
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      role: 'teacher_admin',
      schoolId: null,
      contactPhone: '601-111-1111',
      dateOfBirth: new Date('1980-05-15'),
      gender: 'masculino',
      documentType: 'cedula',
      documentNumber: '1234567890',
      address: 'Calle 100 #50-30',
      neighborhood: 'Usaquén',
      city: 'Bogotá',
      socioeconomicStratum: 5,
      housingType: 'apartamento',
      schoolEntryYear: 1995,
      academicAverage: 4.5,
      areasOfDifficulty: JSON.stringify(['matematicas']),
      areasOfStrength: JSON.stringify(['lectura', 'ciencias']),
      repetitionHistory: false,
      schoolSchedule: 'diurno',
      disabilities: JSON.stringify([]),
      specialEducationalNeeds: null,
      medicalConditions: null,
      homeTechnologyAccess: true,
      homeInternetAccess: true,
    },
  })
  console.log(`  ✅ Teacher Admin: ${teacherAdmin.email}`)

  // School Admins (uno por colegio)
  const schoolAdmins: any[] = []
  for (let i = 0; i < schools.length; i++) {
    const school = schools[i]
    const admin = await prisma.user.create({
      data: {
        email: `admin@${slugifyName(school.name)}.com`,
        passwordHash: passwordHash,
        firstName: i === 0 ? 'María' : i === 1 ? 'José' : i === 2 ? 'Ana' : i === 3 ? 'Luis' : 'Patricia',
        lastName: i === 0 ? 'González' : i === 1 ? 'Martínez' : i === 2 ? 'López' : i === 3 ? 'Fernández' : 'Ramírez',
        role: 'school_admin',
        schoolId: school.id,
        contactPhone: `601-${200 + i}-${1000 + i}`,
        dateOfBirth: new Date(`198${i}-03-${10 + i}`),
        gender: i % 2 === 0 ? 'femenino' : 'masculino',
        documentType: 'cedula',
        documentNumber: `${1000000000 + i}`,
        address: `${school.address}`,
        city: school.city,
      },
    })
    schoolAdmins.push(admin)
    console.log(`  ✅ School Admin: ${admin.email} (${school.name})`)
  }

  // Estudiantes (10 por colegio)
  const students: any[] = []
  const firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Laura', 'Diego', 'Sofía', 'Andrés', 'Valentina']
  const lastNames = ['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores']
  
  for (let schoolIdx = 0; schoolIdx < schools.length; schoolIdx++) {
    const school = schools[schoolIdx]
    // Solo crear estudiantes para colegios (no empresas)
    if (school.type !== 'school') continue

    for (let i = 0; i < 10; i++) {
      const studentIdx = schoolIdx * 10 + i
      const academicGrade = Object.values(ACADEMIC_GRADES)[studentIdx % 6] // Distribuir entre grados 6-11
      
      // Calcular año de nacimiento basado en el grado académico
      // Grado 6 (sexto): ~11-12 años → 2012-2013
      // Grado 7 (septimo): ~12-13 años → 2011-2012
      // Grado 8 (octavo): ~13-14 años → 2010-2011
      // Grado 9 (noveno): ~14-15 años → 2009-2010
      // Grado 10 (decimo): ~15-16 años → 2008-2009
      // Grado 11 (once): ~16-17 años → 2007-2008
      const gradeIndex = studentIdx % 6
      const baseYear = 2025 // Año actual aproximado
      const age = 11 + gradeIndex + getRandomInt(0, 1) // Edad entre 11-17 años
      const birthYear = baseYear - age // Años 2007-2014
      const birthMonth = getRandomInt(1, 12)
      const birthDay = getRandomInt(1, 28)
      
      const student = await prisma.user.create({
        data: {
          email: `estudiante${studentIdx + 1}@${slugifyName(school.name)}.com`,
          passwordHash: passwordHash,
          firstName: firstNames[i],
          lastName: lastNames[i],
          role: 'student',
          schoolId: school.id,
          academicGrade,
          contactPhone: `601-${300 + studentIdx}-${2000 + studentIdx}`,
          dateOfBirth: new Date(`${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`),
          gender: i % 2 === 0 ? 'masculino' : 'femenino',
          documentType: 'tarjeta_identidad',
          documentNumber: `${1000000000 + studentIdx}`,
          address: `${school.address}`,
          neighborhood: school.neighborhood,
          city: school.city,
          socioeconomicStratum: getRandomInt(1, 6),
          housingType: getRandomElement(['casa', 'apartamento', 'finca']),
          schoolEntryYear: 2015 + (studentIdx % 5),
          academicAverage: Number((3.0 + Math.random() * 2.0).toFixed(1)),
          areasOfDifficulty: JSON.stringify(getRandomElement([['matematicas'], ['lectura'], ['ingles'], []])),
          areasOfStrength: JSON.stringify(getRandomElement([['matematicas', 'ciencias'], ['lectura'], ['ingles'], ['artes']])),
          repetitionHistory: Math.random() > 0.8,
          schoolSchedule: school.academicCalendar === 'ambos' ? getRandomElement(['diurno', 'nocturno']) : school.academicCalendar,
          disabilities: JSON.stringify([]),
          specialEducationalNeeds: null,
          medicalConditions: null,
          homeTechnologyAccess: Math.random() > 0.2,
          homeInternetAccess: Math.random() > 0.15,
        },
      })
      students.push({ ...student, academicGrade })
      console.log(`  ✅ Estudiante ${studentIdx + 1}: ${student.email} (Grado ${academicGrade})`)
    }
  }

  // ============================================
  // PASO 5: CREAR MÓDULOS
  // ============================================
  console.log('\n📦 Creando módulos ICFES...')
  
  const modules: any[] = []
  const moduleTitles = {
    lectura_critica: [
      'Comprensión Lectora Básica',
      'Análisis de Textos Narrativos',
      'Interpretación de Textos Informativos',
      'Análisis Crítico de Textos',
      'Estrategias de Lectura Avanzada'
    ],
    razonamiento_cuantitativo: [
      'Operaciones Básicas',
      'Álgebra y Ecuaciones',
      'Geometría y Medidas',
      'Estadística y Probabilidad',
      'Razonamiento Lógico Matemático'
    ],
    competencias_ciudadanas: [
      'Convivencia y Paz',
      'Participación y Responsabilidad Democrática',
      'Pluralidad, Identidad y Valoración de las Diferencias',
      'Derechos Humanos',
      'Pensamiento Ciudadano'
    ],
    comunicacion_escrita: [
      'Expresión Escrita Básica',
      'Coherencia y Cohesión',
      'Tipos de Textos',
      'Ortografía y Gramática',
      'Redacción Académica'
    ],
    ingles: [
      'Vocabulario Básico',
      'Gramática Fundamental',
      'Comprensión de Lectura',
      'Expresión Oral',
      'Comprensión Auditiva'
    ]
  }

  // Crear módulos para cada competencia y grado académico
  for (const comp of ICFES_COMPETENCIES) {
    for (const grade of Object.values(ACADEMIC_GRADES)) {
      const titles = moduleTitles[comp.name as keyof typeof moduleTitles] || moduleTitles.lectura_critica
      for (let i = 0; i < 3; i++) { // 3 módulos por competencia/grado
        const module = await prisma.module.create({
          data: {
            title: `${titles[i % titles.length]} - ${grade.charAt(0).toUpperCase() + grade.slice(1)}`,
            description: `Módulo de ${comp.displayName} para grado ${grade}. ${titles[i % titles.length]}.`,
            estimatedTimeMinutes: getRandomInt(120, 180),
            orderIndex: i + 1,
            isPublished: true,
            competencyId: comp.name === 'lectura_critica' ? lecturaCritica.id :
                          comp.name === 'razonamiento_cuantitativo' ? razonamientoCuantitativo.id :
                          comp.name === 'competencias_ciudadanas' ? competenciasCiudadanas.id :
                          comp.name === 'comunicacion_escrita' ? comunicacionEscrita.id : ingles.id,
            isIcfesModule: true,
            academicGrade: grade,
            createdById: teacherAdmin.id,
          },
        })
        modules.push({ ...module, competencyName: comp.name, academicGrade: grade })
      }
    }
  }

  console.log(`  ✅ ${modules.length} módulos ICFES creados`)

  // Módulos para empresas
  console.log('\n📦 Creando módulos para empresas...')
  
  // Módulos de Programación Python
  const pythonModules = [
    { title: 'Introducción a Python', description: 'Fundamentos de Python y sintaxis básica' },
    { title: 'Estructuras de Datos', description: 'Listas, diccionarios, tuplas y sets' },
    { title: 'Programación Orientada a Objetos', description: 'Clases, objetos y herencia' },
    { title: 'Manejo de Archivos y APIs', description: 'Lectura/escritura de archivos y consumo de APIs' },
  ]

  for (let i = 0; i < pythonModules.length; i++) {
    const module = await prisma.module.create({
      data: {
        title: pythonModules[i].title,
        description: pythonModules[i].description,
        estimatedTimeMinutes: getRandomInt(180, 240),
        orderIndex: i + 1,
        isPublished: true,
        competencyId: programacion.id,
        isIcfesModule: false,
        academicGrade: null,
        createdById: teacherAdmin.id,
      },
    })
    modules.push({ ...module, competencyName: 'programacion', academicGrade: null })
  }

  // Módulos de Diseño Gráfico
  const disenoModules = [
    { title: 'Fundamentos del Diseño', description: 'Principios básicos de diseño gráfico' },
    { title: 'Herramientas Digitales', description: 'Uso de software de diseño' },
    { title: 'Tipografía y Composición', description: 'Tipografía y composición visual' },
    { title: 'Branding y Identidad Visual', description: 'Creación de marcas e identidad visual' },
  ]

  for (let i = 0; i < disenoModules.length; i++) {
    const module = await prisma.module.create({
      data: {
        title: disenoModules[i].title,
        description: disenoModules[i].description,
        estimatedTimeMinutes: getRandomInt(150, 210),
        orderIndex: i + 1,
        isPublished: true,
        competencyId: disenoGrafico.id,
        isIcfesModule: false,
        academicGrade: null,
        createdById: teacherAdmin.id,
      },
    })
    modules.push({ ...module, competencyName: 'diseno_grafico', academicGrade: null })
  }

  console.log(`  ✅ ${pythonModules.length + disenoModules.length} módulos de empresas creados`)

  // ============================================
  // PASO 6: CREAR LECCIONES
  // ============================================
  console.log('\n📖 Creando lecciones...')
  
  const lessons: any[] = []
  const lessonTitles = {
    lectura_critica: [
      'Tipos de Textos',
      'Estrategias de Comprensión',
      'Análisis de Ideas Principales',
      'Inferencia y Deducción',
      'Crítica Literaria'
    ],
    razonamiento_cuantitativo: [
      'Operaciones Básicas',
      'Problemas de Aplicación',
      'Geometría Plana',
      'Estadística Descriptiva',
      'Razonamiento Lógico'
    ],
    competencias_ciudadanas: [
      'Derechos y Deberes',
      'Participación Ciudadana',
      'Resolución de Conflictos',
      'Diversidad Cultural',
      'Democracia y Estado'
    ],
    comunicacion_escrita: [
      'Estructura de Textos',
      'Coherencia Textual',
      'Ortografía y Acentuación',
      'Tipos de Redacción',
      'Expresión Escrita'
    ],
    ingles: [
      'Vocabulario Básico',
      'Gramática: Verbos',
      'Comprensión de Lectura',
      'Expresión Oral',
      'Listening Comprehension'
    ],
    programacion: [
      'Sintaxis de Python',
      'Variables y Tipos de Datos',
      'Estructuras de Control',
      'Funciones y Módulos',
      'Programación Orientada a Objetos'
    ],
    diseno_grafico: [
      'Principios del Diseño',
      'Teoría del Color',
      'Tipografía',
      'Composición Visual',
      'Herramientas Digitales'
    ]
  }

  // Crear lecciones para cada módulo
  for (const module of modules) {
    const compName = module.competencyName
    const titles = lessonTitles[compName as keyof typeof lessonTitles] || lessonTitles.lectura_critica
    
    // 4-5 lecciones por módulo
    const numLessons = getRandomInt(4, 5)
    for (let i = 0; i < numLessons; i++) {
      const lesson = await prisma.lesson.create({
        data: {
          title: `${titles[i % titles.length]} - ${module.title.split(' - ')[0]}`,
          description: `Lección sobre ${titles[i % titles.length]} en el contexto de ${module.title}.`,
          estimatedTimeMinutes: getRandomInt(30, 60),
          isPublished: true,
          videoUrl: `https://example.com/videos/${module.id}-${i}.mp4`,
          videoDescription: `Video explicativo sobre ${titles[i % titles.length]}`,
          theoryContent: `<h2>${titles[i % titles.length]}</h2><p>Contenido teórico completo sobre ${titles[i % titles.length]}. Esta lección cubre los conceptos fundamentales y ejemplos prácticos.</p><h3>Conceptos Clave</h3><ul><li>Concepto 1: Descripción detallada</li><li>Concepto 2: Ejemplos y aplicaciones</li><li>Concepto 3: Ejercicios prácticos</li></ul>`,
          competencyId: module.competencyId,
          academicGrade: module.academicGrade,
        },
      })
      lessons.push({ ...lesson, moduleId: module.id, orderIndex: i + 1 })
    }
  }

  console.log(`  ✅ ${lessons.length} lecciones creadas`)

  // ============================================
  // PASO 7: CREAR PREGUNTAS
  // ============================================
  console.log('\n❓ Creando preguntas...')
  
  let questionCount = 0
  const difficultyLevels = ['facil', 'intermedio', 'dificil']
  
  for (const lesson of lessons) {
    // 4-6 preguntas por lección
    const numQuestions = getRandomInt(4, 6)
    for (let i = 0; i < numQuestions; i++) {
      const difficulty = getRandomElement(difficultyLevels)
      const usage = getRandomElement(['lesson', 'both']) // Algunas para quices también
      
      await prisma.lessonQuestion.create({
        data: {
          lessonId: lesson.id,
          questionText: `Pregunta ${i + 1} sobre ${lesson.title}: ¿Cuál es la respuesta correcta?`,
          questionType: 'multiple_choice',
          optionA: 'Opción A: Respuesta incorrecta',
          optionB: 'Opción B: Respuesta correcta',
          optionC: 'Opción C: Respuesta incorrecta',
          optionD: 'Opción D: Respuesta incorrecta',
          correctOption: 'B',
          explanation: `La respuesta correcta es B porque... Esta explicación detalla por qué esta es la opción correcta y cómo llegar a ella.`,
          orderIndex: i + 1,
          difficultyLevel: difficulty,
          usage: usage,
          academicGrade: lesson.academicGrade,
        },
      })
      questionCount++
    }
  }

  console.log(`  ✅ ${questionCount} preguntas creadas`)

  // ============================================
  // PASO 8: ASOCIAR LECCIONES A MÓDULOS
  // ============================================
  console.log('\n🔗 Asociando lecciones a módulos...')
  
  let associationCount = 0
  const lessonsByModule = new Map<string, any[]>()
  
  for (const lesson of lessons) {
    if (!lessonsByModule.has(lesson.moduleId)) {
      lessonsByModule.set(lesson.moduleId, [])
    }
    lessonsByModule.get(lesson.moduleId)!.push(lesson)
  }

  for (const [moduleId, moduleLessons] of lessonsByModule.entries()) {
    for (let i = 0; i < moduleLessons.length; i++) {
      await prisma.moduleLesson.create({
        data: {
          moduleId,
          lessonId: moduleLessons[i].id,
          orderIndex: i + 1,
        },
      })
      associationCount++
    }
  }

  console.log(`  ✅ ${associationCount} asociaciones creadas`)

  // ============================================
  // PASO 9: CREAR CURSOS
  // ============================================
  console.log('\n📚 Creando cursos ICFES...')
  
  const courses: any[] = []

  // Cursos ICFES: una competencia por grado académico
  for (const comp of ICFES_COMPETENCIES) {
    for (const grade of Object.values(ACADEMIC_GRADES)) {
      const course = await prisma.course.create({
        data: {
          title: `${comp.displayName} - ${grade.charAt(0).toUpperCase() + grade.slice(1)}`,
          description: `Curso completo de ${comp.displayName} para estudiantes de ${grade} grado. Preparación para pruebas Saber.`,
          thumbnailUrl: null,
          competencyId: comp.name === 'lectura_critica' ? lecturaCritica.id :
                        comp.name === 'razonamiento_cuantitativo' ? razonamientoCuantitativo.id :
                        comp.name === 'competencias_ciudadanas' ? competenciasCiudadanas.id :
                        comp.name === 'comunicacion_escrita' ? comunicacionEscrita.id : ingles.id,
          academicGrade: grade,
          durationHours: getRandomInt(40, 60),
          difficultyLevel: grade === 'once' ? 'dificil' : grade === 'decimo' ? 'intermedio' : 'facil',
          isPublished: true,
          isIcfesCourse: true,
          createdById: teacherAdmin.id,
          totalModules: 3,
          totalLessons: 12, // 3 módulos × 4 lecciones promedio
        },
      })
      courses.push({ ...course, competencyName: comp.name, academicGrade: grade })
    }
  }

  console.log(`  ✅ ${courses.length} cursos ICFES creados`)

  // Cursos para empresas
  console.log('\n📚 Creando cursos para empresas...')
  
  // Curso de Python
  const pythonCourse = await prisma.course.create({
    data: {
      title: 'Programación en Python',
      description: 'Curso completo de programación en Python desde cero hasta nivel intermedio.',
      thumbnailUrl: null,
      competencyId: programacion.id,
      academicGrade: null,
      durationHours: 80,
      difficultyLevel: 'intermedio',
      isPublished: true,
      isIcfesCourse: false,
      createdById: teacherAdmin.id,
      totalModules: pythonModules.length,
      totalLessons: pythonModules.length * 4,
    },
  })
  courses.push({ ...pythonCourse, competencyName: 'programacion', academicGrade: null })

  // Curso de Diseño Gráfico
  const disenoCourse = await prisma.course.create({
    data: {
      title: 'Diseño Gráfico Profesional',
      description: 'Aprende diseño gráfico desde los fundamentos hasta técnicas avanzadas.',
      thumbnailUrl: null,
      competencyId: disenoGrafico.id,
      academicGrade: null,
      durationHours: 60,
      difficultyLevel: 'intermedio',
      isPublished: true,
      isIcfesCourse: false,
      createdById: teacherAdmin.id,
      totalModules: disenoModules.length,
      totalLessons: disenoModules.length * 4,
    },
  })
  courses.push({ ...disenoCourse, competencyName: 'diseno_grafico', academicGrade: null })

  console.log(`  ✅ 2 cursos de empresas creados`)

  // ============================================
  // PASO 10: ASOCIAR MÓDULOS A CURSOS
  // ============================================
  console.log('\n🔗 Asociando módulos a cursos...')
  
  let courseModuleCount = 0
  
  // Asociar módulos ICFES a cursos
  for (const course of courses.filter(c => c.isIcfesCourse)) {
    const courseModules = modules.filter(
      m => m.competencyName === course.competencyName && 
           m.academicGrade === course.academicGrade &&
           m.isIcfesModule
    )
    
    for (let i = 0; i < courseModules.length; i++) {
      await prisma.courseModule.create({
        data: {
          courseId: course.id,
          moduleId: courseModules[i].id,
          orderIndex: i + 1,
        },
      })
      courseModuleCount++
    }
  }

  // Asociar módulos de Python al curso de Python
  const pythonCourseModules = modules.filter(m => m.competencyName === 'programacion')
  for (let i = 0; i < pythonCourseModules.length; i++) {
    await prisma.courseModule.create({
      data: {
        courseId: pythonCourse.id,
        moduleId: pythonCourseModules[i].id,
        orderIndex: i + 1,
      },
    })
    courseModuleCount++
  }

  // Asociar módulos de Diseño al curso de Diseño
  const disenoCourseModules = modules.filter(m => m.competencyName === 'diseno_grafico')
  for (let i = 0; i < disenoCourseModules.length; i++) {
    await prisma.courseModule.create({
      data: {
        courseId: disenoCourse.id,
        moduleId: disenoCourseModules[i].id,
        orderIndex: i + 1,
      },
    })
    courseModuleCount++
  }

  console.log(`  ✅ ${courseModuleCount} asociaciones curso-módulo creadas`)

  // ============================================
  // PASO 11: ASOCIAR CURSOS A COLEGIOS
  // ============================================
  console.log('\n🔗 Asociando cursos a colegios...')
  
  let courseSchoolCount = 0

  // Asociar cursos ICFES a colegios
  for (const school of schools.filter(s => s.type === 'school')) {
    for (const course of courses.filter(c => c.isIcfesCourse)) {
      await prisma.courseSchool.create({
        data: {
          courseId: course.id,
          schoolId: school.id,
        },
      })
      courseSchoolCount++
    }
  }

  // Asociar curso de Python a TechSolutions
  await prisma.courseSchool.create({
    data: {
      courseId: pythonCourse.id,
      schoolId: company1.id,
    },
  })
  courseSchoolCount++

  // Asociar curso de Diseño a Diseño Creativo
  await prisma.courseSchool.create({
    data: {
      courseId: disenoCourse.id,
      schoolId: company2.id,
    },
  })
  courseSchoolCount++

  console.log(`  ✅ ${courseSchoolCount} asociaciones curso-colegio creadas`)

  // ============================================
  // PASO 12: INSCRIBIR ESTUDIANTES EN CURSOS
  // ============================================
  console.log('\n📋 Inscribiendo estudiantes en cursos...')
  
  let enrollmentCount = 0

  for (const student of students) {
    const grade = student.academicGrade
    // Inscribir en todos los cursos ICFES de su grado
    const studentCourses = courses.filter(
      c => c.isIcfesCourse && c.academicGrade === grade
    )
    
    for (const course of studentCourses) {
      await prisma.courseEnrollment.create({
        data: {
          userId: student.id,
          courseId: course.id,
          isActive: true,
          enrolledAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Últimos 90 días
        },
      })
      enrollmentCount++
    }
  }

  console.log(`  ✅ ${enrollmentCount} inscripciones creadas`)

  // ============================================
  // PASO 13: CREAR EXÁMENES
  // ============================================
  console.log('\n📝 Creando exámenes...')
  
  const exams: any[] = []

  // Simulacros completos para grado 11
  const grado11Courses = courses.filter(c => c.academicGrade === 'once' && c.isIcfesCourse)
  for (let i = 0; i < 2; i++) {
    const exam = await prisma.exam.create({
      data: {
        title: `Simulacro ICFES ${i + 1} - Grado 11`,
        description: `Simulacro completo del examen ICFES para grado 11. Incluye todas las competencias.`,
        examType: 'simulacro_completo',
        academicGrade: 'once',
        timeLimitMinutes: 240,
        passingScore: 60,
        difficultyLevel: 'dificil',
        isAdaptive: false,
        isPublished: true,
        isIcfesExam: true,
        createdById: teacherAdmin.id,
        openDate: new Date(),
        closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalQuestions: 120,
        questionsPerModule: 5,
      },
    })
    exams.push(exam)
  }

  // Exámenes por competencia
  for (const course of courses.filter(c => c.isIcfesCourse && c.academicGrade === 'once')) {
    const exam = await prisma.exam.create({
      data: {
        title: `Examen ${course.title}`,
        description: `Examen de ${course.title} para evaluar el conocimiento adquirido.`,
        examType: 'por_competencia',
        courseId: course.id,
        competencyId: course.competencyId,
        academicGrade: course.academicGrade,
        timeLimitMinutes: 60,
        passingScore: 70,
        difficultyLevel: 'intermedio',
        isAdaptive: false,
        isPublished: true,
        isIcfesExam: true,
        createdById: teacherAdmin.id,
        openDate: new Date(),
        closeDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        totalQuestions: 20,
        questionsPerModule: 5,
      },
    })
    exams.push(exam)
  }

  console.log(`  ✅ ${exams.length} exámenes creados`)

  // ============================================
  // PASO 14: CREAR CLASES EN VIVO
  // ============================================
  console.log('\n🎥 Creando clases en vivo...')
  
  const liveClasses: any[] = []

  // Crear clases en vivo para cada colegio
  const schoolList = schools.filter(s => s.type === 'school')
  for (let i = 0; i < schoolList.length; i++) {
    const school = schoolList[i]
    const schoolCourses = courses.filter(c => c.isIcfesCourse)
    
    // Encontrar el admin correspondiente a este colegio
    const schoolAdmin = schoolAdmins.find(admin => admin.schoolId === school.id)
    if (!schoolAdmin) continue
    
    // 3 clases por colegio
    for (let j = 0; j < 3; j++) {
      const course = getRandomElement(schoolCourses)
      const startDate = new Date(Date.now() + (j + 1) * 7 * 24 * 60 * 60 * 1000) // Próximas 3 semanas
      
      const liveClass = await prisma.liveClass.create({
        data: {
          title: `Clase de ${course.title}`,
          description: `Clase en vivo sobre ${course.title}. Revisión de conceptos clave y resolución de dudas.`,
          meetingUrl: `https://zoom.us/j/${Math.random().toString(36).substring(7)}`,
          provider: getRandomElement(['zoom', 'meet', 'teams']),
          startDateTime: startDate,
          endDateTime: new Date(startDate.getTime() + 60 * 60 * 1000), // 1 hora después
          schoolId: school.id,
          competencyId: course.competencyId,
          academicGrade: course.academicGrade,
          createdById: teacherAdmin.id,
        },
      })
      liveClasses.push(liveClass)

      // Crear invitaciones para estudiantes del colegio
      const schoolStudents = students.filter(s => s.schoolId === school.id)
      for (const student of schoolStudents) {
        await prisma.liveClassInvitation.create({
          data: {
            liveClassId: liveClass.id,
            userId: student.id,
          },
        })
      }

      // Invitar también al school_admin
      await prisma.liveClassInvitation.create({
        data: {
          liveClassId: liveClass.id,
          userId: schoolAdmin.id,
        },
      })
    }
  }

  console.log(`  ✅ ${liveClasses.length} clases en vivo creadas`)

  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log('\n' + '='.repeat(60))
  console.log('✅ SEED COMPLETO FINALIZADO')
  console.log('='.repeat(60))
  console.log(`📚 Competencias ICFES: ${ICFES_COMPETENCIES.length}`)
  console.log(`📚 Competencias Generales: ${GENERAL_COMPETENCIES.length}`)
  console.log(`🏫 Instituciones: ${schools.length} (${schools.filter(s => s.type === 'school').length} colegios + ${schools.filter(s => s.type === 'company').length} empresas)`)
  console.log(`👥 Usuarios: ${students.length + schoolAdmins.length + 1} (${students.length} estudiantes + ${schoolAdmins.length} admins + 1 teacher_admin)`)
  console.log(`📦 Módulos: ${modules.length}`)
  console.log(`📖 Lecciones: ${lessons.length}`)
  console.log(`❓ Preguntas: ${questionCount}`)
  console.log(`📚 Cursos: ${courses.length}`)
  console.log(`📝 Exámenes: ${exams.length}`)
  console.log(`📋 Inscripciones: ${enrollmentCount}`)
  console.log(`🎥 Clases en Vivo: ${liveClasses.length}`)
  console.log('\n🔑 Credenciales de acceso (todos con contraseña: 123456):')
  console.log(`   Teacher Admin: profesor@admin.com`)
  for (let i = 0; i < schoolAdmins.length; i++) {
    console.log(`   School Admin ${i + 1}: ${schoolAdmins[i].email}`)
  }
  console.log(`   Estudiante ejemplo: ${students[0]?.email || 'N/A'}`)
  console.log('='.repeat(60))
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

