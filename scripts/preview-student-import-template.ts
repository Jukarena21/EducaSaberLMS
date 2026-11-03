/**
 * Regenera previews/plantilla-estudiantes-propuesta.xlsx con la misma
 * plantilla que descarga Carga masiva.
 */
import path from 'path'
import fs from 'fs'
import { PrismaClient } from '@prisma/client'
import { buildStudentImportWorkbook } from '../lib/bulk-import/buildStudentImportWorkbook'

async function loadSchools() {
  const fallback = [
    { name: 'Colegio Norte', city: 'Bogotá' },
    { name: 'Institución Sur', city: 'Medellín' },
  ]
  try {
    const prisma = new PrismaClient()
    const rows = await prisma.school.findMany({
      where: { type: 'school' },
      select: { name: true, city: true },
      orderBy: { name: 'asc' },
      take: 200,
    })
    await prisma.$disconnect()
    return rows.length > 0 ? rows : fallback
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn('No pude leer colegios de la BD; uso ejemplos:', message)
    return fallback
  }
}

async function main() {
  const schools = await loadSchools()
  const workbook = await buildStudentImportWorkbook(schools)
  const outDir = path.join(__dirname, '..', 'previews')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'plantilla-estudiantes-propuesta.xlsx')
  await workbook.xlsx.writeFile(outPath)
  console.log('Plantilla escrita en:', outPath)
  console.log('Colegios:', schools.length)
  schools.slice(0, 8).forEach((school) => {
    console.log(` - ${school.name} (${school.city || 'sin ciudad'})`)
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
