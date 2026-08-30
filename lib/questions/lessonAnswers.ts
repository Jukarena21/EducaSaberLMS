/**
 * Respuestas de los ejercicios de una lección.
 *
 * El estudiante puede salir y volver a entrar, así que las respuestas se
 * guardan por pregunta. Como cada tipo de pregunta usa una forma distinta
 * (una letra, un mapa de huecos, un mapa de parejas) se serializa a texto:
 * las cadenas se guardan tal cual y el resto como JSON.
 */

import { isMatchingAnswerCorrect } from './matching'
import { isFillBlankAnswerCorrect } from './fillBlank'

export type GradableQuestion = {
  questionType: string
  correctOption?: string | null
  optionA?: string | null
  optionB?: string | null
  optionC?: string | null
  optionD?: string | null
}

export function serializeLessonAnswer(answer: unknown): string {
  if (answer === undefined || answer === null) return ''
  if (typeof answer === 'string') return answer
  try {
    return JSON.stringify(answer)
  } catch {
    return ''
  }
}

export function parseLessonAnswer(stored: string | null | undefined): unknown {
  if (!stored) return undefined
  const trimmed = stored.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return stored
  try {
    return JSON.parse(trimmed)
  } catch {
    return stored
  }
}

export function gradeLessonAnswer(question: GradableQuestion, answer: unknown): boolean {
  switch (question.questionType) {
    case 'multiple_choice':
    case 'true_false':
      return Boolean(question.correctOption) && answer === question.correctOption
    case 'fill_blank':
      return isFillBlankAnswerCorrect(question, answer)
    case 'matching':
      return isMatchingAnswerCorrect(question, answer)
    case 'essay':
      // Los ensayos se revisan a mano; basta con que haya texto
      return typeof answer === 'string' && answer.trim().length > 0
    default:
      return false
  }
}
