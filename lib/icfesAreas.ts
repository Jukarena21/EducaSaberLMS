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
