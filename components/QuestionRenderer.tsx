'use client'

import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, AlertCircle, GripVertical } from 'lucide-react'
import { SafeImage } from '@/components/SafeImage'
import { decodeMaybeEscapedHtml } from '@/lib/htmlContent'
import {
  buildMatchingItems,
  describeMatchingAnswer,
  parseMatchingConfig,
} from '@/lib/questions/matching'
import {
  countBlankTokens,
  isFillBlankAnswerCorrect,
  parseFillBlankAnswer,
  parseFillBlankConfig,
  splitQuestionByBlanks,
} from '@/lib/questions/fillBlank'
import { seededShuffle } from '@/lib/questions/shuffle'

interface QuestionRendererProps {
  question: {
    id: string
    questionText: string
    questionType: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'essay'
    questionImage?: string
    optionA?: string
    optionB?: string
    optionC?: string
    optionD?: string
    optionAImage?: string
    optionBImage?: string
    optionCImage?: string
    optionDImage?: string
    correctOption?: string
    explanation?: string
    explanationImage?: string
  }
  selectedAnswer?: any
  onAnswerChange?: (answer: any) => void
  showCorrectAnswer?: boolean
  isSubmitted?: boolean
  disabled?: boolean
}

export function QuestionRenderer({
  question,
  selectedAnswer,
  onAnswerChange,
  showCorrectAnswer = false,
  isSubmitted = false,
  disabled = false
}: QuestionRendererProps) {
  // Inicializar estados desde selectedAnswer si existe
  const [matchingPairs, setMatchingPairs] = useState<Record<string, string>>(() => {
    if (question.questionType === 'matching' && selectedAnswer && typeof selectedAnswer === 'object') {
      return selectedAnswer as Record<string, string>
    }
    return {}
  })
  const [essayAnswer, setEssayAnswer] = useState<string>(() => {
    if (question.questionType === 'essay' && selectedAnswer && typeof selectedAnswer === 'string') {
      return selectedAnswer
    }
    return ''
  })
  const [fillBlankAnswers, setFillBlankAnswers] = useState<Record<number, string>>(() => {
    if (question.questionType === 'fill_blank') {
      return parseFillBlankAnswer(selectedAnswer)
    }
    return {}
  })

  // Estados para drag and drop de matching (siempre inicializados, pero solo usados para matching)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null)

  const handleMultipleChoiceSelect = (option: string) => {
    if (!disabled && onAnswerChange) {
      onAnswerChange(option)
    }
  }

  const handleTrueFalseSelect = (option: string) => {
    if (!disabled && onAnswerChange) {
      onAnswerChange(option)
    }
  }

  const handleFillBlankSlotChange = (index: number, value: string) => {
    const current =
      selectedAnswer !== undefined && selectedAnswer !== null
        ? parseFillBlankAnswer(selectedAnswer)
        : fillBlankAnswers
    const next = { ...current, [index]: value }
    setFillBlankAnswers(next)
    if (onAnswerChange) onAnswerChange(next)
  }

  // El componente puede recibir la respuesta desde fuera (examen en curso) o
  // gestionarla internamente (ejercicios de lección)
  const currentMatchingPairs: Record<string, string> =
    selectedAnswer && typeof selectedAnswer === 'object' && !Array.isArray(selectedAnswer)
      ? (selectedAnswer as Record<string, string>)
      : matchingPairs

  /** Asigna una ficha a un destino, o la retira si `targetId` es null. */
  const handleMatchingChange = (sourceId: string, targetId: string | null) => {
    const newPairs = { ...currentMatchingPairs }

    // Cada destino admite una sola ficha: si ya estaba ocupado, la anterior
    // vuelve a la columna de fichas disponibles
    if (targetId) {
      for (const [existingSource, existingTarget] of Object.entries(newPairs)) {
        if (existingTarget === targetId) delete newPairs[existingSource]
      }
      newPairs[sourceId] = targetId
    } else {
      delete newPairs[sourceId]
    }

    setMatchingPairs(newPairs)
    setDraggedItem(null)
    setDragOverTarget(null)
    if (onAnswerChange) {
      onAnswerChange(newPairs)
    }
  }

  const handleEssayChange = (value: string) => {
    setEssayAnswer(value)
    if (onAnswerChange) {
      onAnswerChange(value)
    }
  }

  // Renderizar imagen de pregunta
  const renderQuestionImage = () => {
    if (!question.questionImage) return null
    return (
      <div className="flex justify-center my-4">
        <SafeImage
          src={question.questionImage}
          alt="Imagen de la pregunta"
          className="max-w-full h-auto rounded-lg shadow-md border border-gray-200 object-contain"
          style={{ maxHeight: '260px' }}
        />
      </div>
    )
  }

  // Renderizar opción múltiple
  const renderMultipleChoice = () => {
    const options = [
      { key: 'A', text: question.optionA, image: question.optionAImage },
      { key: 'B', text: question.optionB, image: question.optionBImage },
      { key: 'C', text: question.optionC, image: question.optionCImage },
      { key: 'D', text: question.optionD, image: question.optionDImage }
    ].filter(opt => opt.text)

    // Obtener la respuesta seleccionada (puede venir como string directo o como objeto)
    const currentAnswer = typeof selectedAnswer === 'string' 
      ? selectedAnswer 
      : selectedAnswer?.optionId || selectedAnswer

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = currentAnswer === option.key
          const isCorrect = showCorrectAnswer && question.correctOption === option.key
          const isIncorrect = showCorrectAnswer && isSelected && question.correctOption !== option.key

          return (
            <button
              key={option.key}
              onClick={() => handleMultipleChoiceSelect(option.key)}
              disabled={disabled}
              className={`p-4 text-left rounded-lg border-2 transition-all duration-200 h-full ${
                isCorrect
                  ? 'border-green-500 bg-green-50'
                  : isIncorrect
                  ? 'border-red-500 bg-red-50'
                  : isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center mb-3">
                  <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                    isCorrect
                      ? 'border-green-500 bg-green-500'
                      : isIncorrect
                      ? 'border-red-500 bg-red-500'
                      : isSelected
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {(isSelected || isCorrect || isIncorrect) && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-gray-700 mr-2">{option.key}.</span>
                    <span 
                      className="text-gray-800 text-sm prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: decodeMaybeEscapedHtml(option.text) }}
                    />
                  </div>
                  {showCorrectAnswer && (
                    <div className="ml-2">
                      {isCorrect && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {isIncorrect && <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                  )}
                </div>
                {option.image && (
                  <div className="flex-1 flex items-center justify-center mt-2">
                    <SafeImage
                      src={option.image}
                      alt={`Opción ${option.key}`}
                      className="max-w-full h-auto max-h-40 object-contain rounded border border-gray-200 bg-gray-50"
                    />
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  // Renderizar verdadero/falso
  const renderTrueFalse = () => {
    const options = [
      { key: 'A', text: question.optionA || 'Verdadero' },
      { key: 'B', text: question.optionB || 'Falso' }
    ]

    // Obtener la respuesta seleccionada
    const currentAnswer = typeof selectedAnswer === 'string' 
      ? selectedAnswer 
      : selectedAnswer?.optionId || selectedAnswer

    return (
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = currentAnswer === option.key
          const isCorrect = showCorrectAnswer && question.correctOption === option.key
          const isIncorrect = showCorrectAnswer && isSelected && question.correctOption !== option.key

          return (
            <button
              key={option.key}
              onClick={() => handleTrueFalseSelect(option.key)}
              disabled={disabled}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                isCorrect
                  ? 'border-green-500 bg-green-50'
                  : isIncorrect
                  ? 'border-red-500 bg-red-50'
                  : isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                    isCorrect
                      ? 'border-green-500 bg-green-500'
                      : isIncorrect
                      ? 'border-red-500 bg-red-500'
                      : isSelected
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {(isSelected || isCorrect || isIncorrect) && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span 
                    className="font-medium text-gray-800 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: decodeMaybeEscapedHtml(option.text) }}
                  />
                </div>
                {showCorrectAnswer && (
                  <div>
                    {isCorrect && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {isIncorrect && <XCircle className="w-5 h-5 text-red-500" />}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  // Renderizar completar espacios en la posición correcta dentro del enunciado
  const renderFillBlank = () => {
    const { blanks } = parseFillBlankConfig(question)
    const parts = splitQuestionByBlanks(question.questionText)
    const tokenCount = countBlankTokens(question.questionText)
    const blankCount = Math.max(blanks.length, tokenCount, 1)
    const currentAnswers =
      selectedAnswer !== undefined && selectedAnswer !== null
        ? parseFillBlankAnswer(selectedAnswer)
        : fillBlankAnswers
    const allCorrect = showCorrectAnswer && isFillBlankAnswerCorrect(question, currentAnswers)

    const renderSlot = (index: number) => {
      const blank = blanks[index]
      const value = currentAnswers[index] || ''
      const isSlotCorrect =
        showCorrectAnswer && blank && value.trim().toLowerCase() === blank.answer.trim().toLowerCase()
      const isSlotIncorrect = showCorrectAnswer && Boolean(value) && !isSlotCorrect
      const options = blank
        ? seededShuffle([blank.answer, ...blank.distractors], `fill-${question.id}-${index}`)
        : []
      const hasChoices = options.length > 1
      const slotClass = showCorrectAnswer
        ? isSlotCorrect
          ? 'border-green-500 bg-green-50 text-green-800'
          : isSlotIncorrect
          ? 'border-red-500 bg-red-50 text-red-800'
          : 'border-gray-300 bg-white'
        : value
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-400 bg-white'

      return (
        <span key={`blank-${index}`} className="inline-flex items-center align-middle mx-1 my-1">
          {hasChoices ? (
            <select
              value={value}
              disabled={disabled}
              onChange={(e) => handleFillBlankSlotChange(index, e.target.value)}
              className={`min-w-[9rem] max-w-[16rem] rounded-md border-2 px-2 py-1 text-sm font-medium ${slotClass} ${
                disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
              }`}
            >
              <option value="">Selecciona…</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {option.replace(/<[^>]+>/g, '')}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={value}
              disabled={disabled}
              onChange={(e) => handleFillBlankSlotChange(index, e.target.value)}
              placeholder={`Espacio ${index + 1}`}
              className={`min-w-[7rem] w-32 rounded-md border-b-2 border-x-0 border-t-0 px-2 py-1 text-center text-sm font-medium ${slotClass} ${
                disabled ? 'cursor-not-allowed opacity-70' : ''
              }`}
            />
          )}
          {showCorrectAnswer && (
            <span className="ml-1">
              {isSlotCorrect ? (
                <CheckCircle className="inline w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="inline w-4 h-4 text-red-500" />
              )}
            </span>
          )}
        </span>
      )
    }

    return (
      <div className="space-y-4">
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-800">
            <strong>Instrucciones:</strong>{' '}
            {blankCount > 1
              ? `Completa los ${blankCount} espacios en el enunciado.`
              : 'Completa el espacio en el enunciado.'}
          </p>
        </div>

        <div className="text-lg font-medium leading-relaxed prose max-w-none">
          {tokenCount > 0 ? (
            parts.map((part, index) => (
              <span key={`part-${index}`}>
                <span dangerouslySetInnerHTML={{ __html: decodeMaybeEscapedHtml(part) }} />
                {index < tokenCount ? renderSlot(index) : null}
              </span>
            ))
          ) : (
            <>
              <span
                dangerouslySetInnerHTML={{
                  __html: decodeMaybeEscapedHtml(question.questionText),
                }}
              />
              <div className="mt-4 flex flex-wrap gap-3">
                {Array.from({ length: blankCount }, (_, index) => renderSlot(index))}
              </div>
            </>
          )}
        </div>

        {showCorrectAnswer && (
          <div
            className={`p-4 rounded-lg border ${
              allCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}
          >
            <p className="text-sm font-medium mb-2">
              {allCorrect ? '¡Correcto!' : 'Respuestas correctas:'}
            </p>
            {!allCorrect && (
              <ul className="space-y-1 text-sm text-gray-700">
                {blanks.map((blank, index) => (
                  <li key={`sol-${index}`}>
                    <strong>Espacio {index + 1}:</strong> {blank.answer}
                    {currentAnswers[index] &&
                    currentAnswers[index].trim().toLowerCase() !== blank.answer.trim().toLowerCase()
                      ? ` (tu respuesta: ${currentAnswers[index]})`
                      : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    )
  }

  // Renderizar emparejar con drag and drop
  const renderMatching = () => {
    const config = parseMatchingConfig(question)
    const { sources, targets, correctPairs } = buildMatchingItems(config)

    if (sources.length === 0) {
      return (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          Esta pregunta de emparejar no tiene parejas configuradas.
        </div>
      )
    }

    // Los destinos se barajan para que su orden no delate la correspondencia.
    // La semilla depende de la pregunta, así el orden es estable entre renders
    // y coincide con el que vio el estudiante al responder.
    const shuffledTargets = seededShuffle(targets, `match-${question.id}`)
    const shuffledSources = seededShuffle(sources, `match-src-${question.id}`)
    const currentPairs = currentMatchingPairs

    const handleDragStart = (sourceId: string) => {
      if (!disabled) setDraggedItem(sourceId)
    }

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
      e.preventDefault()
      if (!disabled) setDragOverTarget(targetId)
    }

    const handleDragLeave = () => setDragOverTarget(null)

    const handleDrop = (targetId: string) => {
      if (draggedItem && !disabled) {
        handleMatchingChange(draggedItem, targetId)
      }
    }

    const handleDragEnd = () => {
      setDraggedItem(null)
      setDragOverTarget(null)
    }

    const getSourceForTarget = (targetId: string) =>
      Object.keys(currentPairs).find((sourceId) => currentPairs[sourceId] === targetId) || null

    const getSourceText = (sourceId: string) =>
      sources.find((source) => source.id === sourceId)?.text || ''

    const getSourceIndex = (sourceId: string) =>
      sources.findIndex((source) => source.id === sourceId)

    const pendingSources = shuffledSources.filter((source) => currentPairs[source.id] === undefined)
    const placedCount = sources.length - pendingSources.length
    const hasExtraTargets = targets.length > sources.length

    return (
      <div className="space-y-4">
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            <strong>Instrucciones:</strong> arrastra cada ficha de la izquierda hasta la casilla
            que le corresponde.
          </p>
          <p className="text-xs text-orange-700 mt-1">
            {hasExtraTargets
              ? 'Hay más casillas que fichas: algunas se quedarán vacías.'
              : 'Cada casilla admite una sola ficha.'}
            {!disabled && ' Puedes retirar una ficha con el botón de la casilla.'}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Emparejadas <strong className="text-gray-900">{placedCount}</strong> de{' '}
            <strong className="text-gray-900">{sources.length}</strong>
          </span>
          {placedCount === sources.length && !showCorrectAnswer && (
            <span className="text-green-600 font-medium flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Completado
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fichas disponibles */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 text-sm">Fichas para arrastrar</h4>
            <div className="space-y-3">
              {pendingSources.length === 0 && (
                <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 text-center">
                  No quedan fichas por colocar
                </div>
              )}
              {pendingSources.map((source) => {
                const isDragging = draggedItem === source.id
                const index = getSourceIndex(source.id)

                return (
                  <div
                    key={source.id}
                    draggable={!disabled}
                    onDragStart={() => handleDragStart(source.id)}
                    onDragEnd={handleDragEnd}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      disabled ? 'cursor-not-allowed opacity-70' : 'cursor-move'
                    } ${
                      isDragging
                        ? 'opacity-50 border-blue-400 bg-blue-100'
                        : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      <span
                        className="font-medium text-gray-800 flex-1 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: decodeMaybeEscapedHtml(source.text) }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Casillas de destino: siempre muestran a qué corresponden */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 text-sm">Casillas de destino</h4>
            <div className="space-y-3">
              {shuffledTargets.map((target) => {
                const matchedSourceId = getSourceForTarget(target.id)
                const isCorrect = Boolean(
                  matchedSourceId && correctPairs[matchedSourceId] === target.id
                )
                const isDragOver = dragOverTarget === target.id

                return (
                  <div
                    key={target.id}
                    onDragOver={(e) => handleDragOver(e, target.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(target.id)}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      isDragOver
                        ? 'border-blue-500 bg-blue-100'
                        : matchedSourceId
                        ? showCorrectAnswer
                          ? isCorrect
                            ? 'border-green-500 bg-green-50'
                            : 'border-red-500 bg-red-50'
                          : 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {/* El enunciado de la casilla es siempre visible */}
                    <div className="flex items-start gap-2">
                      <span
                        className="font-medium text-gray-800 flex-1 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: decodeMaybeEscapedHtml(target.text) }}
                      />
                      {showCorrectAnswer && matchedSourceId && (
                        <div className="flex-shrink-0">
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Zona donde aterriza la ficha */}
                    <div className="mt-3">
                      {matchedSourceId ? (
                        <div className="flex items-center gap-2 rounded-md bg-white/70 border border-gray-200 px-3 py-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                            {getSourceIndex(matchedSourceId) + 1}
                          </div>
                          <span
                            className="text-sm text-gray-800 flex-1 prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: decodeMaybeEscapedHtml(getSourceText(matchedSourceId)),
                            }}
                          />
                          {!disabled && !showCorrectAnswer && (
                            <button
                              type="button"
                              onClick={() => handleMatchingChange(matchedSourceId, null)}
                              className="text-xs text-gray-500 hover:text-red-600 underline flex-shrink-0"
                            >
                              Quitar
                            </button>
                          )}
                        </div>
                      ) : (
                        <div
                          className={`rounded-md border-2 border-dashed px-3 py-2 text-sm text-center ${
                            isDragOver
                              ? 'border-blue-400 text-blue-600'
                              : 'border-gray-300 text-gray-400'
                          }`}
                        >
                          {isDragOver ? 'Suelta aquí' : 'Arrastra una ficha'}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {showCorrectAnswer && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Respuestas correctas:</p>
            <div className="space-y-2">
              {describeMatchingAnswer(question, currentPairs).map((row, index) => (
                <div key={`answer-${index}`} className="flex items-start gap-2 text-sm">
                  {row.isCorrect ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={row.isCorrect ? 'text-green-700' : 'text-red-700'}>
                    <strong>{index + 1}.</strong> {row.left} → {row.correct}
                    {!row.isCorrect && (
                      <span className="text-gray-600">
                        {row.chosen
                          ? ` (tu respuesta: ${row.chosen})`
                          : ' (sin responder)'}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Renderizar ensayo
  const renderEssay = () => {
    const answer = typeof selectedAnswer === 'string' 
      ? selectedAnswer 
      : selectedAnswer?.text || essayAnswer

    const wordCount = answer.trim().split(/\s+/).filter((word: string) => word.length > 0).length
    const charCount = answer.length

    return (
      <div className="space-y-4">
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-800 mb-2">
            <strong>Instrucciones:</strong> Escribe tu respuesta en el espacio proporcionado. 
            Sé claro y detallado en tu explicación.
          </p>
          <p className="text-xs text-purple-700">
            Esta pregunta requiere una respuesta escrita. Asegúrate de estructurar tu respuesta de manera clara y completa.
          </p>
        </div>
        <div className="relative">
          <Textarea
            value={answer}
            onChange={(e) => handleEssayChange(e.target.value)}
            disabled={disabled}
            placeholder="Escribe tu respuesta aquí... Sé específico y detallado en tu explicación."
            className="w-full min-h-[250px] resize-y text-base leading-relaxed"
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-500 bg-white px-2 py-1 rounded border">
            {wordCount} palabras • {charCount} caracteres
          </div>
        </div>
        {showCorrectAnswer && question.explanation && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Criterios de evaluación:</p>
            <p className="text-sm text-blue-800 whitespace-pre-line">{question.explanation}</p>
            {question.explanationImage && (
              <div className="mt-3">
                <SafeImage
                  src={question.explanationImage}
                  alt="Imagen de explicación"
                  className="max-w-full h-auto rounded border border-blue-200 object-contain"
                  style={{ maxHeight: '220px' }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Texto de la pregunta + imagen asociada: mismo orden que el gestor (imagen antes del enunciado de la pregunta cuando el enunciado base va aparte en lessonUrl) */}
      <div className="space-y-3">
        {renderQuestionImage()}
        {question.questionType !== 'fill_blank' && (
          <div 
            className="text-lg font-medium leading-relaxed prose max-w-none"
            dangerouslySetInnerHTML={{ __html: decodeMaybeEscapedHtml(question.questionText) }}
          />
        )}
      </div>

      {/* Renderizar según el tipo de pregunta */}
      <div className="mt-4">
        {question.questionType === 'multiple_choice' && renderMultipleChoice()}
        {question.questionType === 'true_false' && renderTrueFalse()}
        {question.questionType === 'fill_blank' && renderFillBlank()}
        {question.questionType === 'matching' && renderMatching()}
        {question.questionType === 'essay' && renderEssay()}
      </div>

      {/* Explicación si está disponible y se muestra */}
      {showCorrectAnswer && question.explanation && question.questionType !== 'essay' && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-2">Explicación:</p>
          <p className="text-sm text-blue-800">{question.explanation}</p>
          {question.explanationImage && (
            <div className="mt-3">
              <SafeImage
                src={question.explanationImage}
                alt="Imagen de explicación"
                className="max-w-full h-auto rounded object-contain"
                style={{ maxHeight: '220px' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

