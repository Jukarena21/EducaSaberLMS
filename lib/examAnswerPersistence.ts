import { prisma } from '@/lib/prisma'
import type { AnswerSaveInput } from '@/lib/examAnswerValidation'

export async function upsertExamQuestionAnswer(
  examResultId: string,
  userId: string,
  input: AnswerSaveInput
) {
  const { questionId, selectedOptionId, answerText, timeSpentSeconds } = input

  let processedAnswerText: string | null = answerText ?? null
  if (processedAnswerText && typeof processedAnswerText === 'object') {
    processedAnswerText = JSON.stringify(processedAnswerText)
  }

  const existing = await prisma.examQuestionAnswer.findFirst({
    where: { examResultId, questionId },
  })

  // El cliente envía el acumulado total de la pregunta. Nos quedamos con el
  // mayor valor visto para que un reenvío tardío no reduzca el tiempo ya guardado.
  const reportedTime =
    typeof timeSpentSeconds === 'number' && Number.isFinite(timeSpentSeconds)
      ? Math.max(0, Math.round(timeSpentSeconds))
      : null

  const data = {
    selectedOption: selectedOptionId || null,
    answerText: processedAnswerText || null,
    isCorrect: false,
    timeSpentSeconds: reportedTime ?? 0,
  }

  if (existing) {
    await prisma.examQuestionAnswer.update({
      where: { id: existing.id },
      data: {
        ...data,
        timeSpentSeconds: Math.max(existing.timeSpentSeconds ?? 0, reportedTime ?? 0),
      },
    })
    return existing.id
  }

  const created = await prisma.examQuestionAnswer.create({
    data: {
      examResultId,
      questionId,
      userId,
      ...data,
    },
  })
  return created.id
}

export async function upsertExamQuestionAnswers(
  examResultId: string,
  userId: string,
  inputs: AnswerSaveInput[]
) {
  for (const input of inputs) {
    await upsertExamQuestionAnswer(examResultId, userId, input)
  }
}
