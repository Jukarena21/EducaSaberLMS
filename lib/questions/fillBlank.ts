/**
 * Preguntas de rellenar espacios.
 *
 * El enunciado marca cada hueco con tres o más guiones bajos (`___`) o con
 * `[BLANK]`. Cada hueco tiene su respuesta y, opcionalmente, distractores.
 *
 * Formato actual (v2): optionA guarda un JSON con todos los huecos. optionB–D
 * quedan vacías. El formato heredado (optionA = respuesta, B–D = distractores)
 * se sigue leyendo como un solo hueco.
 */

export const FILL_BLANK_TOKEN = '___'
export const FILL_BLANK_MAX_BLANKS = 8
export const FILL_BLANK_MAX_DISTRACTORS = 5

function blankTokenRegex(): RegExp {
  // Se crea en cada uso: un regex global reutilizado retiene lastIndex
  return /_{3,}|\[\s*(?:BLANK|espacio)\s*\]/gi
}

export type FillBlankItem = {
  answer: string
  distractors: string[]
}

export type FillBlankConfig = {
  blanks: FillBlankItem[]
}

type OptionSource = {
  optionA?: string | null
  optionB?: string | null
  optionC?: string | null
  optionD?: string | null
}

function sanitizeDistractors(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0)
}

function parseLegacyConfig(question: OptionSource): FillBlankConfig {
  const answer = (question.optionA || '').trim()
  const distractors = [question.optionB, question.optionC, question.optionD]
    .map((value) => (value || '').trim())
    .filter((value) => value.length > 0)

  return {
    blanks: answer ? [{ answer, distractors }] : [],
  }
}

/** Cuenta huecos en el enunciado, ignorando el HTML. */
export function countBlankTokens(questionText?: string | null): number {
  if (!questionText) return 0
  const plain = questionText.replace(/<[^>]+>/g, ' ')
  const matches = plain.match(blankTokenRegex())
  return matches ? matches.length : 0
}

export function splitQuestionByBlanks(questionText?: string | null): string[] {
  if (!questionText) return ['']
  return questionText.split(blankTokenRegex())
}

export function parseFillBlankConfig(question: OptionSource): FillBlankConfig {
  const raw = question.optionA?.trim()

  if (raw && raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw)
      const blanks = Array.isArray(parsed?.blanks)
        ? parsed.blanks
            .map((blank: unknown) => {
              if (!blank || typeof blank !== 'object') return null
              const { answer, distractors } = blank as Record<string, unknown>
              if (typeof answer !== 'string' || !answer.trim()) return null
              return {
                answer: answer.trim(),
                distractors: sanitizeDistractors(distractors),
              }
            })
            .filter((blank: FillBlankItem | null): blank is FillBlankItem => Boolean(blank))
        : []

      if (blanks.length > 0) return { blanks }
    } catch {
      // JSON corrupto: caemos al formato heredado
    }
  }

  return parseLegacyConfig(question)
}

export function serializeFillBlankConfig(config: FillBlankConfig): {
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: 'A'
} {
  const payload = {
    v: 2,
    blanks: config.blanks
      .map((blank) => ({
        answer: blank.answer.trim(),
        distractors: sanitizeDistractors(blank.distractors),
      }))
      .filter((blank) => blank.answer.length > 0),
  }

  return {
    optionA: JSON.stringify(payload),
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
  }
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Interpreta la respuesta del estudiante.
 *
 * Acepta un objeto `{ "0": "Bogotá" }`, un JSON string con esa forma, o un
 * string plano (formato heredado de un solo hueco).
 */
export function parseFillBlankAnswer(answer: unknown): Record<number, string> {
  if (answer == null) return {}

  if (typeof answer === 'string') {
    const trimmed = answer.trim()
    if (!trimmed) return {}
    if (trimmed.startsWith('{')) {
      try {
        return parseFillBlankAnswer(JSON.parse(trimmed))
      } catch {
        return { 0: trimmed }
      }
    }
    return { 0: trimmed }
  }

  if (typeof answer !== 'object' || Array.isArray(answer)) return {}

  const obj = answer as Record<string, unknown>
  if (typeof obj.text === 'string' && obj.text.trim()) {
    return parseFillBlankAnswer(obj.text)
  }
  if (typeof obj.optionId === 'string' && obj.optionId.trim() && !obj.text) {
    return { 0: obj.optionId }
  }

  const result: Record<number, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'optionId' || key === 'text' || key === 'answer' || key === 'isCorrect') continue
    const index = Number(key)
    if (!Number.isInteger(index) || index < 0) continue
    if (typeof value === 'string' && value.trim()) result[index] = value
  }
  return result
}

export function isFillBlankAnswerComplete(question: OptionSource, answer: unknown): boolean {
  const { blanks } = parseFillBlankConfig(question)
  if (blanks.length === 0) return false
  const answers = parseFillBlankAnswer(answer)
  return blanks.every((_, index) => Boolean(answers[index]?.trim()))
}

export function isFillBlankAnswerCorrect(question: OptionSource, answer: unknown): boolean {
  const { blanks } = parseFillBlankConfig(question)
  if (blanks.length === 0) return false
  const answers = parseFillBlankAnswer(answer)
  return blanks.every(
    (blank, index) => normalize(answers[index] || '') === normalize(blank.answer)
  )
}
