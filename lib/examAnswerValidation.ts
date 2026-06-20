/**
 * Validación de respuestas de examen (cliente y servidor).
 */

export type ExamAnswerPayload = {
  selectedOption?: string | null
  answerText?: string | null
}

/** Respuesta en memoria del cliente (ExamInterface). */
export function isClientExamAnswerComplete(
  questionType: string | undefined,
  answer: unknown
): boolean {
  if (answer == null) return false

  const type = questionType || 'multiple_choice'

  if (typeof answer === 'string') {
    return answer.trim().length > 0
  }

  if (typeof answer === 'object' && answer !== null) {
    const obj = answer as Record<string, unknown>
    if (typeof obj.optionId === 'string' && obj.optionId.trim().length > 0) return true
    if (typeof obj.text === 'string' && obj.text.trim().length > 0) return true
    if (typeof obj.answer === 'string' && obj.answer.trim().length > 0) return true
    // matching: al menos un par
    if (Object.keys(obj).length > 0 && !obj.optionId && !obj.text) return true
  }

  if (type === 'essay') {
    return typeof answer === 'string' && answer.trim().length > 0
  }

  return false
}

/** Respuesta persistida en ExamQuestionAnswer. */
export function isStoredExamAnswerComplete(
  questionType: string | undefined,
  answer: ExamAnswerPayload | undefined
): boolean {
  if (!answer) return false

  const type = questionType || 'multiple_choice'

  switch (type) {
    case 'multiple_choice':
    case 'true_false':
      return !!(answer.selectedOption && answer.selectedOption.trim().length > 0)
    case 'fill_blank':
    case 'essay':
      return !!(answer.answerText && answer.answerText.trim().length > 0)
    case 'matching': {
      if (!answer.answerText || !answer.answerText.trim()) return false
      try {
        const parsed = JSON.parse(answer.answerText)
        return typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0
      } catch {
        return false
      }
    }
    default:
      return !!(
        (answer.selectedOption && answer.selectedOption.trim()) ||
        (answer.answerText && answer.answerText.trim())
      )
  }
}

export interface UnansweredExamQuestion {
  questionId: string
  orderIndex: number
  areaLabel: string
  displayNumberInArea: number
}

export function findUnansweredExamQuestions<
  Q extends {
    id: string
    orderIndex: number
    questionType?: string
    competency?: { displayName?: string | null; name?: string | null } | null
    competencyId?: string | null
  }
>(
  questions: Q[],
  answersByQuestionId: Map<string, ExamAnswerPayload>,
  areaLabels?: Map<string, string>
): UnansweredExamQuestion[] {
  const areaMaps = buildQuestionAreaNumberMaps(
    questions.map((q) => ({
      id: q.id,
      areaKey: q.competencyId || q.competency?.name || 'general',
      areaLabel:
        areaLabels?.get(q.id) ||
        q.competency?.displayName ||
        q.competency?.name ||
        'General',
    }))
  )

  const unanswered: UnansweredExamQuestion[] = []

  for (const q of questions) {
    const stored = answersByQuestionId.get(q.id)
    if (isStoredExamAnswerComplete(q.questionType, stored)) continue

    const numbering = areaMaps.get(q.id)
    unanswered.push({
      questionId: q.id,
      orderIndex: q.orderIndex,
      areaLabel: numbering?.areaLabel || 'General',
      displayNumberInArea: numbering?.numberInArea ?? q.orderIndex,
    })
  }

  return unanswered.sort((a, b) => a.orderIndex - b.orderIndex)
}

/** Numeración 1..N reiniciada por área. */
export function buildQuestionAreaNumberMaps(
  items: Array<{ id: string; areaKey: string; areaLabel: string }>
): Map<string, { areaLabel: string; numberInArea: number; areaKey: string }> {
  const byArea = new Map<string, Array<{ id: string; areaLabel: string }>>()

  for (const item of items) {
    const key = item.areaKey || 'general'
    if (!byArea.has(key)) byArea.set(key, [])
    byArea.get(key)!.push({ id: item.id, areaLabel: item.areaLabel })
  }

  const result = new Map<string, { areaLabel: string; numberInArea: number; areaKey: string }>()

  for (const [areaKey, group] of byArea) {
    group.forEach((item, index) => {
      result.set(item.id, {
        areaKey,
        areaLabel: item.areaLabel,
        numberInArea: index + 1,
      })
    })
  }

  return result
}
