/**
 * Fuente única de verdad para las preguntas de emparejar (arrastrar).
 *
 * Hay dos formatos en circulación:
 *
 * - Heredado: cada campo optionA–D guarda una pareja "izquierda|derecha"
 *   (también se aceptan "→" y "->" como separador). Solo admite 4 parejas y
 *   obliga a que haya tantos destinos como fichas.
 * - Actual (v2): optionA guarda un JSON con todas las parejas y, opcionalmente,
 *   destinos adicionales que no corresponden a ninguna ficha. optionB–D quedan
 *   vacías. Permite cualquier número de parejas y columnas dispares.
 *
 * Todo el código debe pasar por `parseMatchingConfig` en lugar de leer los
 * campos directamente: la interfaz y los calificadores llegaron a interpretar
 * los datos de forma distinta y ninguna pregunta se calificaba bien.
 */

export const MATCHING_SEPARATORS = ['|', '→', '->'] as const

/** Límites del editor, pensados para que la pregunta siga siendo legible. */
export const MATCHING_MIN_PAIRS = 2
export const MATCHING_MAX_PAIRS = 10
export const MATCHING_MAX_EXTRA_TARGETS = 6

/** Separa el prefijo del identificador de su texto: "s0::Perro". */
const ID_SEPARATOR = '::'

export type MatchingPair = {
  left: string
  right: string
}

export type MatchingConfig = {
  pairs: MatchingPair[]
  /** Destinos sin ficha correspondiente: sirven como distractores. */
  extraTargets: string[]
}

export type MatchingItem = {
  id: string
  text: string
}

type OptionSource = {
  optionA?: string | null
  optionB?: string | null
  optionC?: string | null
  optionD?: string | null
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

function parseLegacyConfig(question: OptionSource): MatchingConfig {
  const pairs: MatchingPair[] = []

  for (const key of ['A', 'B', 'C', 'D'] as const) {
    const option = question[`option${key}` as keyof OptionSource]
    if (!option) continue
    const [left, right] = splitMatchingOption(option)
    if (left && right) pairs.push({ left, right })
  }

  return { pairs, extraTargets: [] }
}

function sanitizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0)
}

/** Lee la configuración de una pregunta, sea del formato nuevo o del heredado. */
export function parseMatchingConfig(question: OptionSource): MatchingConfig {
  const raw = question.optionA?.trim()

  if (raw && raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw)
      const pairs = Array.isArray(parsed?.pairs)
        ? parsed.pairs
            .map((pair: unknown) => {
              if (!pair || typeof pair !== 'object') return null
              const { left, right } = pair as Record<string, unknown>
              if (typeof left !== 'string' || typeof right !== 'string') return null
              return { left: left.trim(), right: right.trim() }
            })
            .filter((pair: MatchingPair | null): pair is MatchingPair =>
              Boolean(pair && pair.left && pair.right)
            )
        : []

      return { pairs, extraTargets: sanitizeStringList(parsed?.extraTargets) }
    } catch {
      // JSON corrupto: caemos al formato heredado en lugar de romper la vista
    }
  }

  return parseLegacyConfig(question)
}

/** Convierte la configuración a los campos que persiste la base de datos. */
export function serializeMatchingConfig(config: MatchingConfig): {
  optionA: string
  optionB: string
  optionC: string
  optionD: string
} {
  const payload = {
    v: 2,
    pairs: config.pairs
      .map((pair) => ({ left: pair.left.trim(), right: pair.right.trim() }))
      .filter((pair) => pair.left && pair.right),
    extraTargets: sanitizeStringList(config.extraTargets),
  }

  return {
    optionA: JSON.stringify(payload),
    optionB: '',
    optionC: '',
    optionD: '',
  }
}

/** True si la pregunta ya usa el formato nuevo. */
export function isMatchingV2(question: OptionSource): boolean {
  return Boolean(question.optionA?.trim().startsWith('{'))
}

export function buildMatchingItemId(prefix: string, text: string): string {
  return `${prefix}${ID_SEPARATOR}${text}`
}

/**
 * Fichas arrastrables y destinos derivados de la configuración.
 *
 * Los destinos incluyen los de las parejas más los distractores, de modo que
 * puede haber más destinos que fichas.
 */
export function buildMatchingItems(config: MatchingConfig): {
  sources: MatchingItem[]
  targets: MatchingItem[]
  /** id de ficha -> id del destino correcto */
  correctPairs: Record<string, string>
} {
  const sources: MatchingItem[] = []
  const targets: MatchingItem[] = []
  const correctPairs: Record<string, string> = {}

  config.pairs.forEach((pair, index) => {
    const sourceId = buildMatchingItemId(`s${index}`, pair.left)
    const targetId = buildMatchingItemId(`t${index}`, pair.right)
    sources.push({ id: sourceId, text: pair.left })
    targets.push({ id: targetId, text: pair.right })
    correctPairs[sourceId] = targetId
  })

  config.extraTargets.forEach((text, index) => {
    targets.push({
      id: buildMatchingItemId(`t${config.pairs.length + index}`, text),
      text,
    })
  })

  return { sources, targets, correctPairs }
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Devuelve el texto de un identificador de ficha o destino.
 *
 * Admite el formato actual ("s0::Perro") y el heredado ("A-Perro"), porque en
 * base hay respuestas guardadas con ambos.
 */
export function extractMatchingItemText(value: string): string {
  const trimmed = value.trim()

  const separatorIndex = trimmed.indexOf(ID_SEPARATOR)
  if (separatorIndex > 0) {
    return trimmed.slice(separatorIndex + ID_SEPARATOR.length)
  }

  const legacy = /^([A-D])-([\s\S]*)$/.exec(trimmed)
  return legacy ? legacy[2] : trimmed
}

/**
 * Compara la respuesta del estudiante con las parejas correctas.
 *
 * La comparación es por TEXTO y no por identificador: así sigue siendo válida
 * aunque la pregunta se reordene o se edite después de responderla, y funciona
 * con las respuestas guardadas en el formato antiguo.
 */
export function isMatchingAnswerCorrect(question: OptionSource, answer: unknown): boolean {
  const { pairs } = parseMatchingConfig(question)
  if (pairs.length === 0) return false
  const answersByLeft = parseMatchingAnswerMap(answer)
  if (answersByLeft.size < pairs.length) return false
  return pairs.every((pair) => answersByLeft.get(normalize(pair.left)) === normalize(pair.right))
}

function parseMatchingAnswerMap(answer: unknown): Map<string, string> {
  let parsed: unknown = answer
  if (typeof answer === 'string') {
    const trimmed = answer.trim()
    if (!trimmed.startsWith('{')) return new Map()
    try {
      parsed = JSON.parse(trimmed)
    } catch {
      return new Map()
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return new Map()

  const answersByLeft = new Map<string, string>()
  for (const [rawLeft, rawRight] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof rawRight !== 'string' || !rawRight.trim()) continue
    answersByLeft.set(
      normalize(extractMatchingItemText(rawLeft)),
      normalize(extractMatchingItemText(rawRight))
    )
  }
  return answersByLeft
}

/** True cuando todas las fichas tienen un destino, no solo alguna. */
export function isMatchingAnswerComplete(question: OptionSource, answer: unknown): boolean {
  const { pairs } = parseMatchingConfig(question)
  if (pairs.length === 0) return false
  const answersByLeft = parseMatchingAnswerMap(answer)
  return pairs.every((pair) => answersByLeft.has(normalize(pair.left)))
}

/**
 * Representación legible de la respuesta del estudiante, para la vista de
 * resultados y los reportes, donde hasta ahora se mostraba el JSON crudo.
 */
export function describeMatchingAnswer(
  question: OptionSource,
  answer: unknown
): Array<{ left: string; chosen: string | null; correct: string; isCorrect: boolean }> {
  const { pairs } = parseMatchingConfig(question)

  let parsed: unknown = answer
  if (typeof answer === 'string') {
    try {
      parsed = JSON.parse(answer)
    } catch {
      parsed = null
    }
  }

  const answersByLeft = new Map<string, string>()
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    for (const [rawLeft, rawRight] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof rawRight !== 'string') continue
      answersByLeft.set(
        normalize(extractMatchingItemText(rawLeft)),
        extractMatchingItemText(rawRight)
      )
    }
  }

  return pairs.map((pair) => {
    const chosen = answersByLeft.get(normalize(pair.left)) ?? null
    return {
      left: pair.left,
      chosen,
      correct: pair.right,
      isCorrect: chosen !== null && normalize(chosen) === normalize(pair.right),
    }
  })
}
