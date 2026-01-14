import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Creando preguntas de ejemplo de todos los tipos...')

  // Buscar una lección existente o crear una de prueba
  let lesson = await prisma.lesson.findFirst({
    where: {
      title: {
        contains: 'Ejemplo'
      }
    }
  })

  // Si no existe, buscar cualquier lección
  if (!lesson) {
    lesson = await prisma.lesson.findFirst()
  }

  if (!lesson) {
    console.error('❌ No se encontró ninguna lección. Por favor crea una lección primero.')
    return
  }

  console.log(`📚 Usando lección: ${lesson.title} (ID: ${lesson.id})`)

  // Contar preguntas existentes para el orderIndex
  const existingQuestionsCount = await prisma.lessonQuestion.count({
    where: { lessonId: lesson.id }
  })

  let orderIndex = existingQuestionsCount + 1

  // 1. Pregunta de Opción Múltiple
  const multipleChoice = await prisma.lessonQuestion.create({
    data: {
      lessonId: lesson.id,
      questionText: '¿Cuál es el resultado de (x+2)(x+3)?',
      questionType: 'multiple_choice',
      optionA: 'x² + 5x + 6',
      optionB: 'x² + 6x + 5',
      optionC: 'x² + 3x + 2',
      optionD: 'x² + 5x + 3',
      correctOption: 'A',
      explanation: 'Se aplica la propiedad distributiva: (x+2)(x+3) = x² + 3x + 2x + 6 = x² + 5x + 6',
      difficultyLevel: 'intermedio',
      orderIndex: orderIndex++
    }
  })
  console.log('✅ Creada pregunta de Opción Múltiple')

  // 2. Pregunta de Verdadero/Falso
  const trueFalse = await prisma.lessonQuestion.create({
    data: {
      lessonId: lesson.id,
      questionText: 'La suma de dos números negativos siempre es negativa.',
      questionType: 'true_false',
      optionA: 'Verdadero',
      optionB: 'Falso',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      explanation: 'Al sumar dos números negativos, el resultado es siempre negativo. Por ejemplo: (-3) + (-5) = -8',
      difficultyLevel: 'facil',
      orderIndex: orderIndex++
    }
  })
  console.log('✅ Creada pregunta de Verdadero/Falso')

  // 3. Pregunta de Completar (con distractores)
  const fillBlank = await prisma.lessonQuestion.create({
    data: {
      lessonId: lesson.id,
      questionText: 'Completa: El resultado de 5 + 3 es _____',
      questionType: 'fill_blank',
      optionA: '8',
      optionB: '7',
      optionC: '9',
      optionD: '6',
      correctOption: 'A',
      explanation: 'La suma de 5 + 3 es igual a 8',
      difficultyLevel: 'facil',
      orderIndex: orderIndex++
    }
  })
  console.log('✅ Creada pregunta de Completar')

  // 4. Pregunta de Emparejar
  const matching = await prisma.lessonQuestion.create({
    data: {
      lessonId: lesson.id,
      questionText: 'Empareja cada concepto con su definición correcta:',
      questionType: 'matching',
      optionA: 'Fotosíntesis|Proceso por el cual las plantas convierten luz solar en energía química',
      optionB: 'Mitosis|División celular que produce dos células idénticas',
      optionC: 'ADN|Molécula que contiene la información genética de los organismos',
      optionD: 'ARN|Molécula que transporta información del ADN al citoplasma',
      correctOption: 'A',
      explanation: 'Cada concepto debe emparejarse con su definición correcta. La fotosíntesis convierte luz en energía, la mitosis divide células, el ADN almacena información genética y el ARN transporta información.',
      difficultyLevel: 'intermedio',
      orderIndex: orderIndex++
    }
  })
  console.log('✅ Creada pregunta de Emparejar')

  // 5. Pregunta de Ensayo
  const essay = await prisma.lessonQuestion.create({
    data: {
      lessonId: lesson.id,
      questionText: 'Explica en tus propias palabras qué es la fotosíntesis y por qué es importante para la vida en la Tierra. Incluye al menos tres puntos clave en tu respuesta.',
      questionType: 'essay',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: '',
      explanation: 'La respuesta debe incluir: 1) Definición de fotosíntesis (proceso por el cual las plantas convierten luz solar, agua y CO2 en glucosa y oxígeno), 2) Importancia para las plantas (producción de alimento), 3) Importancia para otros organismos (producción de oxígeno y base de la cadena alimentaria).',
      difficultyLevel: 'dificil',
      orderIndex: orderIndex++
    }
  })
  console.log('✅ Creada pregunta de Ensayo')

  // 6. Segunda pregunta de Opción Múltiple (para tener más ejemplos)
  const multipleChoice2 = await prisma.lessonQuestion.create({
    data: {
      lessonId: lesson.id,
      questionText: '¿Cuál de las siguientes es la capital de Colombia?',
      questionType: 'multiple_choice',
      optionA: 'Medellín',
      optionB: 'Bogotá',
      optionC: 'Cali',
      optionD: 'Barranquilla',
      correctOption: 'B',
      explanation: 'Bogotá es la capital y ciudad más grande de Colombia, ubicada en el centro del país.',
      difficultyLevel: 'facil',
      orderIndex: orderIndex++
    }
  })
  console.log('✅ Creada segunda pregunta de Opción Múltiple')

  // 7. Segunda pregunta de Verdadero/Falso
  const trueFalse2 = await prisma.lessonQuestion.create({
    data: {
      lessonId: lesson.id,
      questionText: 'El agua hierve a 100°C a nivel del mar.',
      questionType: 'true_false',
      optionA: 'Verdadero',
      optionB: 'Falso',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      explanation: 'A nivel del mar y bajo presión atmosférica estándar, el agua hierve a exactamente 100°C (212°F).',
      difficultyLevel: 'facil',
      orderIndex: orderIndex++
    }
  })
  console.log('✅ Creada segunda pregunta de Verdadero/Falso')

  // 8. Segunda pregunta de Completar (sin distractores, solo input)
  const fillBlank2 = await prisma.lessonQuestion.create({
    data: {
      lessonId: lesson.id,
      questionText: 'La fórmula química del agua es H_____O',
      questionType: 'fill_blank',
      optionA: '2',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      explanation: 'La fórmula química del agua es H₂O, lo que significa que contiene dos átomos de hidrógeno y un átomo de oxígeno.',
      difficultyLevel: 'facil',
      orderIndex: orderIndex++
    }
  })
  console.log('✅ Creada segunda pregunta de Completar (input libre)')

  // 9. Segunda pregunta de Emparejar
  const matching2 = await prisma.lessonQuestion.create({
    data: {
      lessonId: lesson.id,
      questionText: 'Empareja cada operación matemática con su resultado:',
      questionType: 'matching',
      optionA: '2 + 2|4',
      optionB: '3 × 3|9',
      optionC: '10 ÷ 2|5',
      optionD: '7 - 3|4',
      correctOption: 'A',
      explanation: '2+2=4, 3×3=9, 10÷2=5, 7-3=4',
      difficultyLevel: 'facil',
      orderIndex: orderIndex++
    }
  })
  console.log('✅ Creada segunda pregunta de Emparejar')

  // 10. Segunda pregunta de Ensayo
  const essay2 = await prisma.lessonQuestion.create({
    data: {
      lessonId: lesson.id,
      questionText: 'Describe el proceso de la respiración celular. Explica qué ocurre en cada etapa y por qué es importante para los organismos vivos.',
      questionType: 'essay',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: '',
      explanation: 'La respuesta debe incluir: 1) Definición de respiración celular (proceso por el cual las células convierten glucosa en ATP), 2) Etapas principales (glucólisis, ciclo de Krebs, cadena de transporte de electrones), 3) Importancia (producción de energía para las funciones celulares).',
      difficultyLevel: 'dificil',
      orderIndex: orderIndex++
    }
  })
  console.log('✅ Creada segunda pregunta de Ensayo')

  console.log('\n✨ ¡Todas las preguntas de ejemplo han sido creadas exitosamente!')
  console.log(`📊 Total de preguntas creadas: ${orderIndex - existingQuestionsCount - 1}`)
  console.log(`📚 Lección: ${lesson.title}`)
  console.log(`🔗 Puedes ver las preguntas en la lección con ID: ${lesson.id}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

