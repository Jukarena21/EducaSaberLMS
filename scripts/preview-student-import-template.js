/**
 * Genera la plantilla propuesta de carga de estudiantes (no se conecta aún
 * a la carga masiva). Pestaña Colegios con los de la plataforma, pestaña
 * Estudiantes con columna colegio (nombre).
 */
const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx')

async function main() {
  let schools = [
    { id: 'ej_colegio_norte', name: 'Colegio Norte', city: 'Bogotá' },
    { id: 'ej_colegio_sur', name: 'Institución Sur', city: 'Medellín' },
  ]
  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    const rows = await prisma.school.findMany({
      where: { type: 'school' },
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
      take: 200,
    })
    await prisma.$disconnect()
    if (rows.length > 0) schools = rows
  } catch (error) {
    console.warn('No pude leer colegios de la BD; uso ejemplos:', error.message)
  }

  const wb = XLSX.utils.book_new()

  const instructions = [
    ['Plantilla de carga de estudiantes — propuesta (aún no está conectada)'],
    [''],
    ['Cómo usarla'],
    ['1. Abra la pestaña Colegios y copie el nombre exacto del colegio.'],
    ['2. En Estudiantes, pegue ese nombre en la columna colegio.'],
    ['3. No invente un código interno; el nombre es suficiente.'],
    ['4. La contraseña inicial del alumno será su número de documento.'],
    ['5. El grado se escribe como sexto, septimo, octavo, noveno, decimo u once.'],
    ['6. Género: male, female u other. Documento: TI, CC o CE.'],
    ['7. Fechas: AAAA-MM-DD (ejemplo 2008-03-15).'],
    [''],
    ['Si usted es admin de un colegio, no hace falta la columna colegio: todos quedan en su institución.'],
    ['Las filas con _ES_EJEMPLO = SI se ignoran al importar.'],
  ]
  const wsInstr = XLSX.utils.aoa_to_sheet(instructions)
  wsInstr['!cols'] = [{ wch: 100 }]
  XLSX.utils.book_append_sheet(wb, wsInstr, 'Instrucciones')

  const schoolRows = [
    ['nombre', 'ciudad', 'codigo'],
    ...schools.map((s) => [s.name, s.city || '', s.id]),
  ]
  const wsSchools = XLSX.utils.aoa_to_sheet(schoolRows)
  wsSchools['!cols'] = [{ wch: 40 }, { wch: 18 }, { wch: 28 }]
  XLSX.utils.book_append_sheet(wb, wsSchools, 'Colegios')

  const headers = [
    '_ES_EJEMPLO',
    'email',
    'nombres',
    'apellidos',
    'tipoDocumento',
    'documento',
    'telefono',
    'colegio',
    'grado',
    'fechaNacimiento',
    'genero',
    'ciudad',
    'barrio',
    'direccion',
    'anoIngreso',
    'promedio',
    'jornada',
  ]
  const exampleSchool = schools[0]?.name || 'Colegio Norte'
  const exampleSchool2 = schools[1]?.name || schools[0]?.name || 'Colegio Norte'
  const examples = [
    ['SI', 'juan.perez@colegio.edu', 'Juan', 'Pérez', 'TI', '1234567890', '3001234567', exampleSchool, 'septimo', '2008-03-15', 'male', 'Bogotá', 'Chapinero', 'Cra 7 # 45-23', '2022', '4.2', 'diurno'],
    ['SI', 'maria.garcia@colegio.edu', 'María', 'García', 'CC', '9876543210', '3009876543', exampleSchool2, 'octavo', '2009-07-20', 'female', 'Medellín', 'El Poblado', 'Cll 10 # 30-15', '2021', '4.5', 'diurno'],
  ]
  const wsStudents = XLSX.utils.aoa_to_sheet([headers, ...examples])
  wsStudents['!cols'] = headers.map((h) => ({ wch: Math.max(14, h.length + 2) }))
  XLSX.utils.book_append_sheet(wb, wsStudents, 'Estudiantes')

  const outDir = path.join(__dirname, '..', 'previews')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'plantilla-estudiantes-propuesta.xlsx')
  XLSX.writeFile(wb, outPath)
  console.log('Plantilla escrita en:', outPath)
  console.log('Colegios en la pestaña:', schools.length)
  schools.slice(0, 8).forEach((s) => console.log(` - ${s.name} (${s.city || 'sin ciudad'})`))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
