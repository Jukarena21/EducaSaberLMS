import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Buscar la lección "Operaciones Básicas"
  const lesson = await prisma.lesson.findFirst({
    where: {
      title: {
        contains: 'Operaciones'
      }
    }
  })

  if (!lesson) {
    console.log('No se encontró la lección')
    await prisma.$disconnect()
    return
  }

  console.log(`Lección encontrada: ${lesson.title} (ID: ${lesson.id})\n`)

  const questions = await prisma.lessonQuestion.findMany({
    where: {
      lessonId: lesson.id
    },
    select: {
      id: true,
      questionText: true,
      questionType: true,
      orderIndex: true
    },
    orderBy: {
      orderIndex: 'asc'
    }
  })

  console.log(`Total de preguntas: ${questions.length}\n`)
  console.log('Preguntas por tipo:')
  
  const byType: Record<string, number> = {}
  questions.forEach(q => {
    byType[q.questionType] = (byType[q.questionType] || 0) + 1
  })
  
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`)
  })

  console.log('\nDetalle de preguntas:')
  questions.forEach((q, i) => {
    console.log(`${i + 1}. [${q.questionType}] ${q.questionText.substring(0, 60)}...`)
  })

  await prisma.$disconnect()
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })

