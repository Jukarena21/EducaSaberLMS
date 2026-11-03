import ExcelJS from 'exceljs'

const NAVY = '1F4E79'
const NAVY_SOFT = '2E75B6'
const YELLOW = 'FFF2CC'
const GRAY = 'F3F3F3'
const WHITE = 'FFFFFF'
const HINT = '7F7F7F'
const GREEN_TAB = '548235'
const BLUE_TAB = '2E75B6'
const TITLE_SIZE = 16

const GRADES = ['sexto', 'septimo', 'octavo', 'noveno', 'decimo', 'once']
const DOC_TYPES = ['TI', 'CC', 'CE']
const EMPTY_ROWS = 80

export type TemplateSchool = { name: string; city?: string | null }

const STUDENT_COLUMNS = [
  { key: 'correo', header: 'Correo *', width: 32, required: true, note: 'Correo único. Con este entra el alumno.' },
  { key: 'nombres', header: 'Nombres *', width: 18, required: true, note: 'Nombre(s) del estudiante.' },
  { key: 'apellidos', header: 'Apellidos *', width: 18, required: true, note: 'Apellido(s) del estudiante.' },
  { key: 'documento', header: 'Documento *', width: 16, required: true, note: 'Número de documento. También es la contraseña inicial.' },
  { key: 'grado', header: 'Grado *', width: 14, required: true, note: 'sexto, septimo, octavo, noveno, decimo u once.' },
  { key: 'colegio', header: 'Colegio *', width: 36, required: true, note: 'Copie el nombre exacto de la pestaña Colegios. Si carga un admin de colegio, puede dejarlo vacío.' },
  { key: 'tipoDocumento', header: 'Tipo de documento', width: 20, required: false, note: 'Opcional. TI, CC o CE.' },
  { key: 'telefono', header: 'Teléfono', width: 16, required: false, note: 'Opcional. Se puede agregar después.' },
] as const

function fillHeader(cell: ExcelJS.Cell, text: string, required: boolean) {
  cell.value = text
  cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: WHITE } }
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: required ? NAVY : NAVY_SOFT },
  }
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  cell.border = {
    top: { style: 'thin', color: { argb: WHITE } },
    left: { style: 'thin', color: { argb: WHITE } },
    bottom: { style: 'thin', color: { argb: WHITE } },
    right: { style: 'thin', color: { argb: WHITE } },
  }
}

function styleDataCell(cell: ExcelJS.Cell, required: boolean) {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: required ? YELLOW : GRAY },
  }
  cell.border = {
    top: { style: 'hair', color: { argb: 'D0D0D0' } },
    left: { style: 'hair', color: { argb: 'D0D0D0' } },
    bottom: { style: 'hair', color: { argb: 'D0D0D0' } },
    right: { style: 'hair', color: { argb: 'D0D0D0' } },
  }
  cell.font = { name: 'Calibri', size: 11 }
  cell.alignment = { vertical: 'middle' }
}

function addTitle(sheet: ExcelJS.Worksheet, range: string, text: string) {
  sheet.mergeCells(range)
  const title = sheet.getCell(range.split(':')[0])
  title.value = text
  title.font = { name: 'Calibri', size: TITLE_SIZE, bold: true, color: { argb: NAVY } }
  title.alignment = { vertical: 'middle' }
}

export async function buildStudentImportWorkbook(schools: TemplateSchool[]): Promise<ExcelJS.Workbook> {
  const list = schools.length > 0
    ? schools
    : [
        { name: 'Colegio Norte', city: 'Bogotá' },
        { name: 'Institución Sur', city: 'Medellín' },
      ]

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'EducaSaber LMS'
  workbook.created = new Date()

  const how = workbook.addWorksheet('Cómo usar', {
    views: [{ showGridLines: false }],
    properties: { tabColor: { argb: NAVY } },
  })
  how.columns = [{ width: 28 }, { width: 42 }, { width: 28 }, { width: 22 }]
  addTitle(how, 'A1:D1', 'Carga de estudiantes')
  how.getRow(1).height = 28

  how.getCell('A3').value = 'Qué hace este archivo'
  how.getCell('A3').font = { bold: true, size: 12, color: { argb: NAVY } }
  how.mergeCells('A4:D4')
  how.getCell('A4').value =
    'Crea las cuentas. El alumno entra con su correo y, como contraseña, su número de documento. Dirección, género, jornada y el resto se pueden completar después, uno por uno, en Estudiantes.'
  how.getCell('A4').alignment = { wrapText: true }
  how.getRow(4).height = 36

  how.getCell('A6').value = 'Pasos'
  how.getCell('A6').font = { bold: true, size: 12, color: { argb: NAVY } }
  const steps = [
    '1. Abra la pestaña Colegios y copie el nombre exacto (no lo escriba de memoria).',
    '2. En Estudiantes, una fila por alumno. Las columnas amarillas son obligatorias.',
    '3. Grado: elija de la lista (sexto … once). Colegio: elija de la lista o péguelo.',
    '4. Si usted es admin de un colegio, puede dejar Colegio vacío: todos quedan en el suyo.',
    '5. No ponga una fila de ejemplo. Empiece a escribir en la fila 2.',
    '6. Guarde el archivo y súbalo en Carga masiva → Estudiantes.',
  ]
  steps.forEach((step, i) => {
    how.mergeCells(`A${7 + i}:D${7 + i}`)
    how.getCell(`A${7 + i}`).value = step
  })

  how.getCell('A14').value = 'Columnas'
  how.getCell('A14').font = { bold: true, size: 12, color: { argb: NAVY } }
  ;['Campo', '¿Obligatorio?', 'Para qué sirve', 'Ejemplo'].forEach((h, i) => {
    fillHeader(how.getCell(15, i + 1), h, true)
  })
  how.getRow(15).height = 22
  const fieldGuide = [
    ['Correo', 'Sí', 'Inicio de sesión. Debe ser único.', 'juan.perez@colegio.edu'],
    ['Nombres', 'Sí', 'Nombre del estudiante.', 'Juan Camilo'],
    ['Apellidos', 'Sí', 'Apellido del estudiante.', 'Pérez Gómez'],
    ['Documento', 'Sí', 'Identificación y contraseña inicial.', '1234567890'],
    ['Grado', 'Sí', 'Para asignar cursos y simulacros ICFES.', 'septimo'],
    ['Colegio', 'Sí *', 'A qué institución pertenece.', 'Colegio Norte'],
    ['Tipo de documento', 'No', 'TI, CC o CE. Se puede agregar después.', 'TI'],
    ['Teléfono', 'No', 'Contacto. Se puede agregar después.', '3001234567'],
  ]
  fieldGuide.forEach((row, i) => {
    row.forEach((value, col) => {
      const cell = how.getCell(16 + i, col + 1)
      cell.value = value
      cell.font = { name: 'Calibri', size: 11 }
      cell.alignment = { vertical: 'middle', wrapText: true }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: col === 1 && value === 'Sí' ? YELLOW : WHITE },
      }
      cell.border = { bottom: { style: 'hair', color: { argb: 'D0D0D0' } } }
    })
    how.getRow(16 + i).height = 20
  })
  how.mergeCells('A24:D24')
  how.getCell('A24').value = '* Si carga un admin de colegio, Colegio no es obligatorio: el sistema usa el suyo.'
  how.getCell('A24').font = { italic: true, color: { argb: HINT }, size: 10 }

  how.getCell('A26').value = 'Qué no va en este Excel'
  how.getCell('A26').font = { bold: true, size: 12, color: { argb: NAVY } }
  how.mergeCells('A27:D27')
  how.getCell('A27').value =
    'Fecha de nacimiento, género, ciudad, barrio, dirección, año de ingreso, promedio, jornada, condiciones especiales. Esos datos existen en la ficha del alumno y se llenan a mano cuando hagan falta.'
  how.getCell('A27').alignment = { wrapText: true }
  how.getRow(27).height = 36

  how.getCell('A29').value = 'Valores de grado'
  how.getCell('A29').font = { bold: true, size: 12, color: { argb: NAVY } }
  GRADES.forEach((g, i) => {
    const cell = how.getCell(30, i + 1)
    cell.value = g
    cell.alignment = { horizontal: 'center' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: YELLOW } }
    cell.font = { bold: true }
  })

  const schoolsSheet = workbook.addWorksheet('Colegios', {
    views: [{ state: 'frozen', ySplit: 1 }],
    properties: { tabColor: { argb: BLUE_TAB } },
  })
  schoolsSheet.columns = [{ width: 42 }, { width: 22 }]
  fillHeader(schoolsSheet.getCell('A1'), 'Colegio', true)
  fillHeader(schoolsSheet.getCell('B1'), 'Ciudad', false)
  schoolsSheet.getRow(1).height = 22
  list.forEach((school, i) => {
    const row = i + 2
    schoolsSheet.getCell(`A${row}`).value = school.name
    schoolsSheet.getCell(`B${row}`).value = school.city || ''
    styleDataCell(schoolsSheet.getCell(`A${row}`), true)
    styleDataCell(schoolsSheet.getCell(`B${row}`), false)
  })
  const schoolListEnd = Math.max(list.length + 1, 2)
  schoolsSheet.getCell('A1').note =
    'Copie este nombre y péguelo en la columna Colegio de Estudiantes, o elíjalo de la lista.'

  const students = workbook.addWorksheet('Estudiantes', {
    views: [{ state: 'frozen', ySplit: 1 }],
    properties: { tabColor: { argb: GREEN_TAB } },
  })
  students.columns = STUDENT_COLUMNS.map((col) => ({ width: col.width }))
  students.getRow(1).height = 28
  STUDENT_COLUMNS.forEach((col, i) => {
    const cell = students.getCell(1, i + 1)
    fillHeader(cell, col.header, col.required)
    cell.note = col.note
  })

  for (let r = 2; r <= EMPTY_ROWS + 1; r++) {
    STUDENT_COLUMNS.forEach((col, i) => {
      const cell = students.getCell(r, i + 1)
      styleDataCell(cell, col.required)
      if (col.key === 'grado') {
        cell.dataValidation = {
          type: 'list',
          allowBlank: false,
          formulae: [`"${GRADES.join(',')}"`],
          showErrorMessage: true,
          errorTitle: 'Grado no válido',
          error: 'Elija sexto, septimo, octavo, noveno, decimo u once.',
        }
      }
      if (col.key === 'colegio') {
        cell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`Colegios!$A$2:$A$${schoolListEnd}`],
          showErrorMessage: true,
          errorTitle: 'Colegio no válido',
          error: 'Elija un colegio de la pestaña Colegios o déjelo vacío si es admin de colegio.',
        }
      }
      if (col.key === 'tipoDocumento') {
        cell.dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`"${DOC_TYPES.join(',')}"`],
          showErrorMessage: true,
          errorTitle: 'Tipo no válido',
          error: 'Use TI, CC o CE, o déjelo vacío.',
        }
      }
    })
  }

  students.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: STUDENT_COLUMNS.length },
  }

  workbook.views = [{ activeTab: 2, x: 0, y: 0, width: 12000, height: 8000 }]
  return workbook
}
