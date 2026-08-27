/**
 * Fuente única de verdad para el nombre visible de las ÁREAS ICFES (Saber 11).
 *
 * CONTEXTO: en la base de datos las áreas (tabla `Competency`, modelo `Area`)
 * se crearon originalmente con nombres de Saber Pro
 * (Razonamiento Cuantitativo, Competencias Ciudadanas, Comunicación Escrita).
 * El producto las usa como áreas de Saber 11, por eso se "traducen".
 *
 * Estos overrides son un puente temporal. Cuando se renombren los `displayName`
 * en la base de datos (ver scripts/rename-areas.js), este mapa puede quedar
 * vacío y todo seguirá funcionando usando el displayName real.
 */
const AREA_DISPLAY_OVERRIDES: Record<string, string> = {
  // Matemáticas
  'comp-razonamiento-cuantitativo': 'Matemáticas',
  razonamiento_cuantitativo: 'Matemáticas',
  matematicas: 'Matemáticas',
  // Ciencias Sociales
  'comp-competencias-ciudadanas': 'Ciencias Sociales',
  competencias_ciudadanas: 'Ciencias Sociales',
  ciencias_sociales: 'Ciencias Sociales',
  // Ciencias Naturales
  'comp-comunicacion-escrita': 'Ciencias Naturales',
  comunicacion_escrita: 'Ciencias Naturales',
  ciencias_naturales: 'Ciencias Naturales',
  // Lectura Crítica
  'comp-lectura-critica': 'Lectura Crítica',
  lectura_critica: 'Lectura Crítica',
  // Inglés
  'comp-ingles': 'Inglés',
  ingles: 'Inglés',
}

type AreaLike = {
  id?: string | null
  name?: string | null
  displayName?: string | null
}

/**
 * Devuelve el nombre visible correcto del área, aplicando overrides por id o
 * por slug (name). Si no hay override, usa displayName y luego name.
 */
export function resolveAreaDisplayName(
  area?: AreaLike | null,
  fallback = 'Área'
): string {
  if (!area) return fallback
  const byId = area.id ? AREA_DISPLAY_OVERRIDES[area.id] : undefined
  const byName = area.name
    ? AREA_DISPLAY_OVERRIDES[area.name.toLowerCase()]
    : undefined
  return byId || byName || area.displayName || area.name || fallback
}

/** Slugs de las 5 áreas ICFES que deben mostrarse en Saber 11. */
export const ICFES_AREA_SLUGS = [
  'lectura_critica',
  'razonamiento_cuantitativo',
  'competencias_ciudadanas',
  'comunicacion_escrita',
  'ingles',
]

/**
 * Identificadores que corresponden a las áreas oficiales de Saber.
 *
 * Se incluyen ids sembrados, slugs y nombres visibles (incluidas variantes
 * históricas) porque en la base conviven registros creados en distintos momentos.
 *
 * Cualquier área que NO esté aquí se considera de uso general: las áreas de
 * Saber y las generales nunca deben mezclarse entre sí.
 */
const ICFES_AREA_IDENTIFIERS = new Set(
  [
    // Ids sembrados
    'comp-lectura-critica',
    'comp-razonamiento-cuantitativo',
    'comp-competencias-ciudadanas',
    'comp-comunicacion-escrita',
    'comp-ingles',
    // Slugs internos
    ...ICFES_AREA_SLUGS,
    'matematicas',
    'ciencias_naturales',
    'ciencias_sociales',
    // Nombres visibles actuales e históricos
    'lectura crítica',
    'razonamiento cuantitativo',
    'competencias ciudadanas',
    'comunicación escrita',
    'inglés',
    'matemáticas',
    'ciencias naturales',
    'ciencias sociales',
    'ciencias sociales y ciudadanas',
  ].map((value) => value.toLowerCase())
)

/**
 * Indica si un área pertenece a la taxonomía oficial de Saber.
 *
 * Fuente única de verdad para separar áreas Saber de áreas generales.
 * Las áreas nuevas creadas por un administrador siempre resultan generales,
 * de modo que jamás aparecen en contextos Saber.
 */
export function isIcfesArea(area?: AreaLike | null): boolean {
  if (!area) return false
  const candidates = [area.id, area.name, area.displayName]
  return candidates.some(
    (value) => value && ICFES_AREA_IDENTIFIERS.has(value.trim().toLowerCase())
  )
}

/** Contrapartida de `isIcfesArea`: áreas de uso libre fuera de Saber. */
export function isGeneralArea(area?: AreaLike | null): boolean {
  return !isIcfesArea(area)
}

/**
 * Filtra una lista de áreas según el contexto.
 * `icfes` devuelve solo áreas Saber; `general` devuelve solo las demás.
 */
export function filterAreasByScope<T extends AreaLike>(
  areas: T[],
  scope: 'icfes' | 'general'
): T[] {
  return areas.filter((area) => (scope === 'icfes' ? isIcfesArea(area) : isGeneralArea(area)))
}

type QuestionAreaSource = {
  competency?: AreaLike | null
  componente?: string | null
}

/**
 * Etiqueta visible del área ICFES para una pregunta de examen.
 * Usa resolveAreaDisplayName cuando hay relación Area; mantiene fallback a
 * componente solo para simulacros legacy sin competencyId.
 */
export function getQuestionAreaLabel(
  question: QuestionAreaSource,
  fallback = 'General'
): string {
  if (question.competency) {
    return resolveAreaDisplayName(question.competency, fallback)
  }
  return question.componente?.trim() || fallback
}
