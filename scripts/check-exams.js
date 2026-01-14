const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkExams() {
  try {
    console.log('🔍 Verificando exámenes en la base de datos...')

    const exams = await prisma.exam.findMany({
      include: {
        examQuestions: true
      }
    })

    console.log(`📊 Total de exámenes: ${exams.length}`)

    exams.forEach((exam, index) => {
      console.log(`\n📝 Examen ${index + 1}:`)
      console.log(`  - ID: ${exam.id}`)
      console.log(`  - Título: ${exam.title}`)
      console.log(`  - Publicado: ${exam.isPublished}`)
      console.log(`  - Preguntas: ${exam.examQuestions.length}`)
      
      if (exam.examQuestions.length > 0) {
        const firstQuestion = exam.examQuestions[0]
        console.log(`  - Primera pregunta: ${firstQuestion.questionText.substring(0, 50)}...`)
        console.log(`  - Tipo: ${firstQuestion.questionType}`)
        console.log(`  - Opciones: A, B, C, D`)
      }
    })

    if (exams.length === 0) {
      console.log('\n❌ No hay exámenes en la base de datos')
      console.log('💡 Necesitas crear exámenes primero')
    }

  } catch (error) {
    console.error('❌ Error verificando exámenes:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkExams()
