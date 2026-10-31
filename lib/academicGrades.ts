/**
 * Constantes y utilidades para años escolares
 * 
 * Los años escolares van del 1 al 11 (primaria y secundaria en Colombia)
 * Se almacenan como strings en la base de datos: 'primero', 'segundo', ..., 'once'
 */

export const ACADEMIC_GRADES = {
  // Primaria (1-5)
  1: 'primero',
  2: 'segundo',
  3: 'tercero',
  4: 'cuarto',
  5: 'quinto',
  // Secundaria (6-11)
  6: 'sexto',
  7: 'septimo',
  8: 'octavo',
  9: 'noveno',
  10: 'decimo',
  11: 'once'
} as const;

export const ACADEMIC_GRADE_TO_YEAR: Record<string, number> = {
  'primero': 1,
  'segundo': 2,
  'tercero': 3,
  'cuarto': 4,
  'quinto': 5,
  'sexto': 6,
  'septimo': 7,
  'octavo': 8,
  'noveno': 9,
  'decimo': 10,
  'once': 11
};

export const ACADEMIC_YEARS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

export const ACADEMIC_GRADE_NAMES = [
  'primero',
  'segundo',
  'tercero',
  'cuarto',
  'quinto',
  'sexto',
  'septimo',
  'octavo',
  'noveno',
  'decimo',
  'once'
] as const;

/** Grados que usa el LMS en secundaria (6° a 11°). */
export const SECONDARY_GRADES = [
  'sexto',
  'septimo',
  'octavo',
  'noveno',
  'decimo',
  'once',
] as const;

/**
 * Unifica “6”, “6°”, “sexto” o “Sexto” al nombre canónico de la BD.
 * Vacío, “all” o “none” → null.
 */
export function normalizeAcademicGrade(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const raw = String(value).trim().toLowerCase()
  if (!raw || raw === 'all' || raw === 'none' || raw === 'n/a') return null
  if (raw in ACADEMIC_GRADE_TO_YEAR) return raw
  const year = parseInt(raw.replace(/[^\d]/g, ''), 10)
  if (!Number.isNaN(year) && year in ACADEMIC_GRADES) {
    return ACADEMIC_GRADES[year as keyof typeof ACADEMIC_GRADES]
  }
  return null
}

/** Valores con los que puede estar guardado el mismo grado (sexto y 6). */
export function academicGradeAliases(value: unknown): string[] {
  const canonical = normalizeAcademicGrade(value)
  if (!canonical) return []
  const year = ACADEMIC_GRADE_TO_YEAR[canonical]
  return Array.from(new Set([canonical, String(year)]))
}

export function academicGradesEqual(a: unknown, b: unknown): boolean {
  const left = normalizeAcademicGrade(a)
  const right = normalizeAcademicGrade(b)
  return left !== null && left === right
}

/**
 * Convierte un número de año (1-11) a su nombre de grado académico
 */
export function yearToAcademicGrade(year: number): string | null {
  return ACADEMIC_GRADES[year as keyof typeof ACADEMIC_GRADES] || null;
}

/**
 * Convierte un nombre de grado académico a su número de año (1-11)
 */
export function academicGradeToYear(academicGrade: string): number | null {
  const canonical = normalizeAcademicGrade(academicGrade)
  return canonical ? ACADEMIC_GRADE_TO_YEAR[canonical] : null
}

/**
 * Obtiene el nombre en español para mostrar de un grado académico
 */
export function getAcademicGradeDisplayName(academicGrade: string): string {
  const year = academicGradeToYear(academicGrade)
  if (!year) return academicGrade
  return `${year}° Grado`
}

/**
 * Valida si un string es un grado académico válido
 */
export function isValidAcademicGrade(academicGrade: string): boolean {
  return normalizeAcademicGrade(academicGrade) !== null
}

