const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addExamQuestions() {
  try {
    console.log('📝 Agregando preguntas a los exámenes...')

    // Obtener todos los exámenes
    const exams = await prisma.exam.findMany()

    if (exams.length === 0) {
      console.log('❌ No hay exámenes en la base de datos')
      return
    }

    console.log(`📊 Encontrados ${exams.length} exámenes`)

    // Preguntas de ejemplo para cada examen
    const sampleQuestions = [
      {
        questionText: "¿Cuál es el resultado de 15 + 27?",
        questionType: "multiple_choice",
        optionA: "40",
        optionB: "42",
        optionC: "41",
        optionD: "43",
        correctAnswer: "B"
      },
      {
        questionText: "¿Cuál es la raíz cuadrada de 64?",
        questionType: "multiple_choice",
        optionA: "6",
        optionB: "7",
        optionC: "8",
        optionD: "9",
        correctAnswer: "C"
      },
      {
        questionText: "¿Cuánto es 12 × 8?",
        questionType: "multiple_choice",
        optionA: "94",
        optionB: "96",
        optionC: "98",
        optionD: "100",
        correctAnswer: "B"
      },
      {
        questionText: "¿Cuál es el perímetro de un cuadrado de lado 5 cm?",
        questionType: "multiple_choice",
        optionA: "15 cm",
        optionB: "20 cm",
        optionC: "25 cm",
        optionD: "30 cm",
        correctAnswer: "B"
      },
      {
        questionText: "¿Cuál es el área de un rectángulo de 6 cm de largo y 4 cm de ancho?",
        questionType: "multiple_choice",
        optionA: "20 cm²",
        optionB: "24 cm²",
        optionC: "28 cm²",
        optionD: "32 cm²",
        correctAnswer: "B"
      }
    ]

    // Agregar preguntas a cada examen
    for (const exam of exams) {
      console.log(`\n📝 Agregando preguntas al examen: ${exam.title}`)
      
      for (let i = 0; i < sampleQuestions.length; i++) {
        const question = sampleQuestions[i]
        
        try {
          await prisma.examQuestion.create({
            data: {
              examId: exam.id,
              questionText: question.questionText,
              questionType: question.questionType,
              optionA: question.optionA,
              optionB: question.optionB,
              optionC: question.optionC,
              optionD: question.optionD,
              correctOption: question.correctAnswer,
              explanation: `Explicación para la pregunta ${i + 1}`,
              difficultyLevel: 'intermedio',
              orderIndex: i + 1
            }
          })
          console.log(`  ✅ Pregunta ${i + 1} agregada`)
        } catch (error) {
          console.log(`  ❌ Error agregando pregunta ${i + 1}:`, error.message)
        }
      }
    }

    console.log('\n🎉 ¡Preguntas agregadas exitosamente!')

  } catch (error) {
    console.error('❌ Error agregando preguntas:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addExamQuestions()
