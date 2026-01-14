import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const lessonId = process.argv[2] || 'cmh8xp9tx00mn13781bmpj9kh'
  
  console.log(`🚀 Agregando preguntas de ejemplo a la lección: ${lessonId}`)

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId }
  })

  if (!lesson) {
    console.error(`❌ No se encontró la lección con ID: ${lessonId}`)
    await prisma.$disconnect()
    return
  }

  console.log(`📚 Lección encontrada: ${lesson.title}`)

  // Contar preguntas existentes
  const existingCount = await prisma.lessonQuestion.count({
    where: { lessonId }
  })
  console.log(`📊 Preguntas existentes: ${existingCount}`)

  let orderIndex = existingCount + 1

  // 1. Pregunta de Verdadero/Falso
  await prisma.lessonQuestion.create({
    data: {
      lessonId,
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

  // 2. Pregunta de Completar (con distractores)
  await prisma.lessonQuestion.create({
    data: {
      lessonId,
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

  // 3. Pregunta de Emparejar
  await prisma.lessonQuestion.create({
    data: {
      lessonId,
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

  // 4. Segunda pregunta de Verdadero/Falso
  await prisma.lessonQuestion.create({
    data: {
      lessonId,
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

  // 5. Segunda pregunta de Completar (input libre)
  await prisma.lessonQuestion.create({
    data: {
      lessonId,
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

  // 6. Segunda pregunta de Emparejar
  await prisma.lessonQuestion.create({
    data: {
      lessonId,
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

  console.log(`\n✨ ¡Se agregaron ${orderIndex - existingCount - 1} preguntas de ejemplo!`)
  console.log(`📊 Total de preguntas en la lección: ${await prisma.lessonQuestion.count({ where: { lessonId } })}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

