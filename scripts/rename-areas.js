/**
 * Renombra el displayName de las áreas ICFES a los nombres correctos de Saber 11.
 *
 * SEGURO: solo actualiza la columna `displayName`. NO cambia el slug `name`
 * ni el `id`, por lo que NO rompe cursos, exámenes ni preguntas ya ligados.
 *
 * ANTES de ejecutar:
 *   - Corre `node scripts/inspect-areas.js` y confirma los slugs reales.
 *   - Ajusta el mapa MAPPING si algún slug es distinto en producción.
 *
 * Uso:
 *   node scripts/rename-areas.js           (muestra qué haría, sin cambios)
 *   node scripts/rename-areas.js --apply   (aplica los cambios)
 */
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// slug (name) actual en BD  ->  nombre visible correcto (Saber 11)
const MAPPING = {
  lectura_critica: 'Lectura Crítica',
  razonamiento_cuantitativo: 'Matemáticas',
  competencias_ciudadanas: 'Ciencias Sociales',
  comunicacion_escrita: 'Ciencias Naturales',
  ingles: 'Inglés',
}

async function main() {
  const apply = process.argv.includes('--apply')
  console.log(apply ? '=== APLICANDO cambios ===' : '=== SIMULACIÓN (usa --apply para aplicar) ===\n')

  const areas = await prisma.area.findMany()

  for (const area of areas) {
    const target = MAPPING[area.name]
    if (!target) {
      console.log(`(sin cambio) ${area.name} -> "${area.displayName}"`)
      continue
    }
    if (area.displayName === target) {
      console.log(`(ya correcto) ${area.name} -> "${area.displayName}"`)
      continue
    }
    console.log(`${area.name}: "${area.displayName}" -> "${target}"`)
    if (apply) {
      await prisma.area.update({
        where: { id: area.id },
        data: { displayName: target },
      })
    }
  }

  console.log(apply ? '\nHecho.' : '\nNada aplicado (simulación).')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
