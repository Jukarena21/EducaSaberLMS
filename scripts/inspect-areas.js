/**
 * Script de SOLO LECTURA para inspeccionar las áreas (tabla `Competency`) y
 * cómo están asociadas a cursos, exámenes y preguntas.
 *
 * No modifica nada. Úsalo para decidir el mapeo seguro de nombres de áreas.
 *
 * Uso:
 *   1) Trae las variables de entorno de producción, por ejemplo:
 *        vercel env pull .env
 *      (o crea un .env con DATABASE_URL apuntando a producción, solo lectura)
 *   2) Ejecuta:
 *        node scripts/inspect-areas.js
 */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('==============================================')
  console.log('  INSPECCIÓN DE ÁREAS (solo lectura)')
  console.log('==============================================\n')

  const areas = await prisma.area.findMany({
    orderBy: { name: 'asc' },
  })

  console.log(`Total de áreas: ${areas.length}\n`)

  for (const area of areas) {
    const [courses, exams, questions, modules, lessons] = await Promise.all([
      prisma.course.count({ where: { competencyId: area.id } }),
      prisma.exam.count({ where: { competencyId: area.id } }),
      prisma.examQuestion.count({ where: { competencyId: area.id } }),
      prisma.module.count({ where: { competencyId: area.id } }),
      prisma.lesson.count({ where: { competencyId: area.id } }),
    ])

    console.log('----------------------------------------------')
    console.log(`Área: ${area.displayName}`)
    console.log(`  name (slug): ${area.name}`)
    console.log(`  id:          ${area.id}`)
    console.log(`  Ligados -> cursos:${courses} examenes:${exams} preguntas:${questions} modulos:${modules} lecciones:${lessons}`)
  }

  console.log('\n==============================================')
  console.log('  VALORES DE CLASIFICACIÓN EN PREGUNTAS')
  console.log('  (campos de texto libre en ExamQuestion)')
  console.log('==============================================\n')

  const fields = ['competencia', 'componente', 'tema', 'subtema']
  for (const field of fields) {
    const grouped = await prisma.examQuestion.groupBy({
      by: [field],
      _count: { _all: true },
    })
    const nonEmpty = grouped
      .filter((g) => g[field] !== null && String(g[field]).trim() !== '')
      .sort((a, b) => b._count._all - a._count._all)

    console.log(`Campo "${field}": ${nonEmpty.length} valores distintos`)
    nonEmpty.slice(0, 40).forEach((g) => {
      console.log(`   - ${g[field]}  (${g._count._all})`)
    })
    if (nonEmpty.length > 40) console.log(`   ... y ${nonEmpty.length - 40} más`)
    console.log('')
  }

  console.log('==============================================')
  console.log('  DIAGNÓSTICO RÁPIDO DE DATOS "SUCIOS"')
  console.log('==============================================\n')

  const questionsSample = await prisma.examQuestion.findMany({
    select: {
      id: true,
      questionText: true,
      questionImage: true,
      optionAImage: true,
      optionBImage: true,
      optionCImage: true,
      optionDImage: true,
    },
    take: 2000,
  })

  const looksDoubleEscaped = (t) =>
    typeof t === 'string' && /&lt;\/?[a-z]|&amp;lt;|&gt;/.test(t)
  const badImage = (u) =>
    typeof u === 'string' &&
    u.trim() !== '' &&
    !/^https?:\/\//.test(u) &&
    !u.startsWith('data:') &&
    !u.startsWith('/')

  const escaped = questionsSample.filter((q) => looksDoubleEscaped(q.questionText))
  const brokenImgs = questionsSample.filter(
    (q) =>
      badImage(q.questionImage) ||
      badImage(q.optionAImage) ||
      badImage(q.optionBImage) ||
      badImage(q.optionCImage) ||
      badImage(q.optionDImage)
  )

  console.log(`Preguntas con HTML posiblemente doble-escapado: ${escaped.length}`)
  escaped.slice(0, 10).forEach((q) =>
    console.log(`   - ${q.id}: ${String(q.questionText).slice(0, 80)}...`)
  )
  console.log('')
  console.log(`Preguntas con URLs de imagen sospechosas (no http/data//): ${brokenImgs.length}`)
  brokenImgs.slice(0, 10).forEach((q) => {
    const urls = [q.questionImage, q.optionAImage, q.optionBImage, q.optionCImage, q.optionDImage]
      .filter((u) => typeof u === 'string' && u.trim() !== '')
    console.log(`   - ${q.id}: ${urls.map((u) => String(u).slice(0, 50)).join(' | ')}`)
  })

  console.log('\nListo. Copia esta salida y compártela para decidir el mapeo de áreas.')
}

main()
  .catch((e) => {
    console.error('Error en inspección:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
