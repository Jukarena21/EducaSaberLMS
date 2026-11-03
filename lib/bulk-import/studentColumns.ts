/** Encabezados y hojas de la plantilla de estudiantes. Sirve en cliente y servidor. */

export function normalizeHeaderKey(header: string): string {
  return String(header || '')
    .replace(/\s*\*\s*$/, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_]+/g, '')
}

const ALIASES: Record<string, string> = {
  correo: 'email',
  email: 'email',
  nombres: 'firstname',
  firstname: 'firstname',
  nombre: 'firstname',
  apellidos: 'lastname',
  lastname: 'lastname',
  apellido: 'lastname',
  documento: 'documentnumber',
  documentnumber: 'documentnumber',
  numerodocumento: 'documentnumber',
  numerodedocumento: 'documentnumber',
  grado: 'academicgrade',
  academicgrade: 'academicgrade',
  colegio: 'colegio',
  school: 'colegio',
  schoolname: 'colegio',
  nombredelcolegio: 'colegio',
  schoolid: 'schoolid',
  tipodedocumento: 'documenttype',
  tipodocumento: 'documenttype',
  documenttype: 'documenttype',
  telefono: 'contactphone',
  tel: 'contactphone',
  contactphone: 'contactphone',
  phone: 'contactphone',
}

export function canonicalStudentField(header: string): string {
  const key = normalizeHeaderKey(header)
  return ALIASES[key] || key
}

const REQUIRED_COLUMNS = [
  { field: 'email', label: 'Correo' },
  { field: 'firstname', label: 'Nombres' },
  { field: 'lastname', label: 'Apellidos' },
  { field: 'documentnumber', label: 'Documento' },
  { field: 'academicgrade', label: 'Grado' },
]

export function missingStudentColumns(headers: string[]): string[] {
  const present = new Set(headers.map(canonicalStudentField))
  const missing = REQUIRED_COLUMNS.filter((item) => !present.has(item.field)).map((item) => item.label)
  if (!present.has('colegio') && !present.has('schoolid')) {
    missing.push('Colegio')
  }
  return missing
}

const SKIP_SHEETS = /^(c[oó]mo usar|como usar|instrucciones|colegios)$/i

export function pickStudentSheetName(sheetNames: string[]): string | undefined {
  if (!sheetNames.length) return undefined
  const exact = sheetNames.find((name) => {
    const key = name.trim().toLowerCase()
    return key === 'estudiantes' || key === 'datos'
  })
  if (exact) return exact
  return sheetNames.find((name) => !SKIP_SHEETS.test(name.trim())) || sheetNames[0]
}

export function schoolNameKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

export function normalizeDocumentType(raw: string): string {
  const value = raw.trim().toLowerCase()
  if (value === 'ti' || value === 'cc' || value === 'ce' || value === 'rc') return value
  return value
}

export function isRequiredStudentPreviewHeader(header: string): boolean {
  const field = canonicalStudentField(header)
  return REQUIRED_COLUMNS.some((item) => item.field === field) || field === 'colegio' || field === 'schoolid'
}

export function remapStudentRow(row: Record<string, string>): Record<string, string> {
  const next: Record<string, string> = {}
  for (const [key, raw] of Object.entries(row)) {
    if (normalizeHeaderKey(key) === 'esejemplo') continue
    const field = canonicalStudentField(key)
    const value = (raw ?? '').trim()
    if (!next[field] || value) {
      next[field] = value
    }
  }
  return next
}
