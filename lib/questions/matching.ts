/**
 * Fuente única de verdad para las preguntas de emparejar (arrastrar).
 *
 * Formato en base de datos: cada opción A–D guarda una pareja como
 * "elemento izquierdo|elemento derecho". También se aceptan las flechas
 * "→" y "->" como separador porque hay contenido creado con ellas.
 *
 * La interfaz identifica cada elemento con un id compuesto por la letra de su
 * pareja de origen y su texto ("A-Perro"). Los calificadores, en cambio,
 * históricamente buscaban las claves por texto plano ("Perro"), de modo que un
 * emparejamiento correcto nunca coincidía. Este módulo normaliza ambos lados
 * para que la interfaz y la calificación hablen el mismo idioma.
 */

export const MATCHING_SEPARATORS = ['|', '→', '->'] as const

export type MatchingPair = {
  /** Letra de la opción de origen (A–D) */
  key: string
  left: string
  right: string
}

/** Divide "izquierda|derecha" en sus dos lados. */
export function splitMatchingOption(option?: string | null): [string, string] {
  if (!option) return ['', '']
  for (const separator of MATCHING_SEPARATORS) {
    if (option.includes(separator)) {
      const [left = '', right = ''] = option.split(separator).map((part) => part.trim())
      return [left, right]
    }
  }
  return [option.trim(), '']
}

type OptionSource = {
  optionA?: string | null
  optionB?: string | null
  optionC?: string | null
  optionD?: string | null
}

/** Extrae las parejas válidas de una pregunta de emparejar. */
export function getMatchingPairs(question: OptionSource): MatchingPair[] {
  const pairs: MatchingPair[] = []

  for (const key of ['A', 'B', 'C', 'D'] as const) {
    const option = question[`option${key}` as keyof OptionSource]
    if (!option) continue
    const [left, right] = splitMatchingOption(option)
    if (left && right) pairs.push({ key, left, right })
  }

  return pairs
}

/** Id estable de un elemento dentro de la pregunta. */
export function buildMatchingItemId(key: string, text: string): string {
  return `${key}-${text}`
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Quita el prefijo de letra de un id compuesto ("A-Perro" -> "Perro").
 *
 * Solo se retira cuando el prefijo corresponde a una letra de opción, para no
 * mutilar textos que legítimamente empiecen por algo parecido.
 */
function stripKeyPrefix(value: string): string {
  const match = /^([A-D])-([\s\S]*)$/.exec(value.trim())
  return match ? match[2] : value
}

/**
 * Compara la respuesta del estudiante con las parejas correctas.
 *
 * Acepta tanto ids compuestos ("A-Perro") como texto plano ("Perro"), de modo
 * que funciona con respuestas guardadas antes y después de esta corrección.
 * La comparación es por TEXTO: si dos parejas comparten el mismo lado derecho,
 * cualquiera de ellas se considera válida, que es lo que el estudiante ve.
 */
export function isMatchingAnswerCorrect(
  question: OptionSource,
  answer: unknown
): boolean {
  const pairs = getMatchingPairs(question)
  if (pairs.length === 0) return false

  let parsed: unknown = answer
  if (typeof answer === 'string') {
    const trimmed = answer.trim()
    if (!trimmed.startsWith('{')) return false
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      return false
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false

  // Indexamos la respuesta por el texto del lado izquierdo
  const answersByLeft = new Map<string, string>()
  for (const [rawLeft, rawRight] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof rawRight !== 'string') continue
    answersByLeft.set(
      normalize(stripKeyPrefix(rawLeft)),
      normalize(stripKeyPrefix(rawRight))
    )
  }

  if (answersByLeft.size < pairs.length) return false

  return pairs.every((pair) => answersByLeft.get(normalize(pair.left)) === normalize(pair.right))
}
