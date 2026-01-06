'use client'

import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, AlertCircle, GripVertical } from 'lucide-react'

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
  const [fillBlankAnswer, setFillBlankAnswer] = useState<string>(() => {
    if (question.questionType === 'fill_blank' && selectedAnswer && typeof selectedAnswer === 'string') {
      return selectedAnswer
    }
    return ''
  })

  // Estados para drag and drop de matching (siempre inicializados, pero solo usados para matching)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null)

  // Helper para dividir opciones de matching
  const splitMatchingOption = (option: string): [string, string] => {
    if (!option) return ['', '']
    const separators = ['|', '→', '->']
    for (const sep of separators) {
      if (option.includes(sep)) {
        const parts = option.split(sep).map(s => s.trim())
        return [parts[0] || '', parts[1] || '']
      }
    }
    return [option, '']
  }

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

  const handleFillBlankChange = (value: string) => {
    setFillBlankAnswer(value)
    if (onAnswerChange) {
      onAnswerChange(value)
    }
  }

  const handleMatchingChange = (leftElement: string, rightElement: string) => {
    const newPairs = { ...matchingPairs, [leftElement]: rightElement }
    setMatchingPairs(newPairs)
    // Resetear estados de drag cuando se hace un match
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
        <img
          src={question.questionImage}
          alt="Imagen de la pregunta"
          className="max-w-full h-auto rounded-lg shadow-md border border-gray-200"
          style={{ maxHeight: '400px' }}
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
                    <span className="text-gray-800 text-sm">{option.text}</span>
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
                    <img
                      src={option.image}
                      alt={`Opción ${option.key}`}
                      className="w-full h-48 object-contain rounded border border-gray-200 bg-gray-50"
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
                  <span className="font-medium text-gray-800">{option.text}</span>
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

  // Renderizar completar espacios
  const renderFillBlank = () => {
    const correctAnswer = question.optionA || ''
    const distractors = [
      question.optionB,
      question.optionC,
      question.optionD
    ].filter(Boolean)
    
    const userAnswer = typeof selectedAnswer === 'string' 
      ? selectedAnswer 
      : selectedAnswer?.text || fillBlankAnswer
    const isCorrect = showCorrectAnswer && userAnswer?.toLowerCase().trim() === correctAnswer.toLowerCase().trim()

    // Si hay distractores, mostrar como opciones múltiples
    const hasDistractors = distractors.length > 0

    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 mb-3">
            <strong>Instrucciones:</strong> {hasDistractors 
              ? 'Selecciona la opción que completa correctamente el espacio en blanco.'
              : 'Completa el espacio en blanco con la respuesta correcta.'}
          </p>
        </div>

        {hasDistractors ? (
          // Mostrar como opciones múltiples si hay distractores
          <div className="space-y-3">
            {[correctAnswer, ...distractors].map((option, index) => {
              const optionKey = String.fromCharCode(65 + index) // A, B, C, D
              const isSelected = userAnswer?.toLowerCase().trim() === option.toLowerCase().trim()
              const isCorrectOption = option === correctAnswer
              const isIncorrect = showCorrectAnswer && isSelected && !isCorrectOption

              return (
                <button
                  key={index}
                  onClick={() => !disabled && handleFillBlankChange(option)}
                  disabled={disabled}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    showCorrectAnswer
                      ? isCorrectOption
                        ? 'border-green-500 bg-green-50'
                        : isIncorrect
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200'
                      : isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                        showCorrectAnswer
                          ? isCorrectOption
                            ? 'border-green-500 bg-green-500'
                            : isIncorrect
                            ? 'border-red-500 bg-red-500'
                            : 'border-gray-300'
                          : isSelected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {(isSelected || showCorrectAnswer) && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <span className="font-medium text-gray-700 mr-2">{optionKey}.</span>
                      <span className="text-gray-800">{option}</span>
                    </div>
                    {showCorrectAnswer && (
                      <div>
                        {isCorrectOption && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {isIncorrect && <XCircle className="w-5 h-5 text-red-500" />}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          // Mostrar como input de texto si no hay distractores
          <div className="space-y-3">
            <Input
              type="text"
              value={userAnswer}
              onChange={(e) => handleFillBlankChange(e.target.value)}
              disabled={disabled}
              placeholder="Escribe tu respuesta aquí..."
              className={`w-full text-lg ${
                showCorrectAnswer
                  ? isCorrect
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : ''
              }`}
            />
            {showCorrectAnswer && (
              <div className={`p-4 rounded-lg ${
                isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  {isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {isCorrect ? '¡Correcto!' : 'Respuesta incorrecta'}
                    </p>
                    {!isCorrect && (
                      <p className="text-sm text-gray-700 mt-1">
                        La respuesta correcta es: <strong className="text-green-700">{correctAnswer}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Renderizar emparejar con drag and drop
  const renderMatching = () => {
    const pairs = [
      { key: 'A', option: question.optionA },
      { key: 'B', option: question.optionB },
      { key: 'C', option: question.optionC },
      { key: 'D', option: question.optionD }
    ].filter(p => p.option)

    // Extraer elementos izquierdos y derechos
    // Usar el key (A, B, C, D) como parte del ID para garantizar unicidad
    const leftItems: Array<{ id: string; text: string; key: string }> = []
    const rightItems: Array<{ id: string; text: string; key: string }> = []
    const correctPairs: Record<string, string> = {}

    pairs.forEach((pair) => {
      const [leftElement, rightElement] = splitMatchingOption(pair.option || '')
      if (leftElement && rightElement) {
        // Usar key + texto para garantizar IDs únicos
        const leftId = `${pair.key}-${leftElement}`
        const rightId = `${pair.key}-${rightElement}`
        leftItems.push({ id: leftId, text: leftElement, key: pair.key })
        rightItems.push({ id: rightId, text: rightElement, key: pair.key })
        correctPairs[leftId] = rightId
      }
    })

    // Obtener los pares actuales
    const currentPairs = typeof selectedAnswer === 'object' && selectedAnswer !== null && !Array.isArray(selectedAnswer)
      ? selectedAnswer as Record<string, string>
      : matchingPairs

    const handleDragStart = (leftId: string) => {
      if (!disabled) {
        setDraggedItem(leftId)
      }
    }

    const handleDragOver = (e: React.DragEvent, rightId: string) => {
      e.preventDefault()
      if (!disabled) {
        setDragOverTarget(rightId)
      }
    }

    const handleDragLeave = () => {
      setDragOverTarget(null)
    }

    const handleDrop = (rightId: string) => {
      if (draggedItem && !disabled) {
        handleMatchingChange(draggedItem, rightId)
        setDraggedItem(null)
        setDragOverTarget(null)
      }
    }

    const handleDragEnd = () => {
      setDraggedItem(null)
      setDragOverTarget(null)
    }

    const getMatchedLeftId = (rightId: string) => {
      // Buscar el leftId que tiene este rightId como valor
      return Object.keys(currentPairs).find(leftId => currentPairs[leftId] === rightId) || null
    }
    
    // Función helper para obtener el texto del leftItem desde su ID
    const getLeftItemText = (leftId: string) => {
      return leftItems.find(l => l.id === leftId)?.text || ''
    }
    
    // Función helper para obtener el key del leftItem desde su ID
    const getLeftItemKey = (leftId: string) => {
      return leftItems.find(l => l.id === leftId)?.key || '?'
    }
    
    // Función helper para obtener el texto del rightItem desde su ID
    const getRightItemText = (rightId: string) => {
      return rightItems.find(r => r.id === rightId)?.text || ''
    }

    return (
      <div className="space-y-4">
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800 mb-2">
            <strong>Instrucciones:</strong> Arrastra cada elemento de la columna izquierda hacia su correspondiente en la columna derecha.
          </p>
          <p className="text-xs text-orange-700">
            Haz clic y arrastra desde el elemento izquierdo hasta soltarlo sobre el elemento correcto de la derecha.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna izquierda - Elementos a arrastrar */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700 mb-3 text-sm">Arrastra desde aquí:</h4>
            {leftItems.map((leftItem) => {
              const isMatched = currentPairs[leftItem.id] !== undefined
              const isDragging = draggedItem === leftItem.id
              
              return (
                <div
                  key={leftItem.id}
                  draggable={!disabled && !isMatched}
                  onDragStart={() => handleDragStart(leftItem.id)}
                  onDragEnd={handleDragEnd}
                  className={`p-4 border-2 rounded-lg cursor-move transition-all ${
                    isDragging
                      ? 'opacity-50 border-blue-400 bg-blue-100'
                      : isMatched
                      ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                      : showCorrectAnswer && currentPairs[leftItem.id] === correctPairs[leftItem.id]
                      ? 'border-green-500 bg-green-50'
                      : showCorrectAnswer && currentPairs[leftItem.id] !== correctPairs[leftItem.id]
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                  } ${disabled ? 'cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium flex-shrink-0">
                      {leftItem.key}
                    </div>
                    <span className="font-medium text-gray-800 flex-1">{leftItem.text}</span>
                    {isMatched && !isDragging && (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Columna derecha - Zonas de destino */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700 mb-3 text-sm">Suelta aquí:</h4>
            {rightItems.map((rightItem) => {
              const matchedLeftId = getMatchedLeftId(rightItem.id)
              const isCorrect = matchedLeftId && correctPairs[matchedLeftId] === rightItem.id
              const isDragOver = dragOverTarget === rightItem.id
              
              return (
                <div
                  key={rightItem.id}
                  onDragOver={(e) => handleDragOver(e, rightItem.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleDrop(rightItem.id)}
                  className={`p-4 border-2 rounded-lg transition-all min-h-[60px] flex items-center ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-100 scale-105'
                      : matchedLeftId
                      ? showCorrectAnswer
                        ? isCorrect
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                        : 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3 w-full">
                    {matchedLeftId ? (
                      <>
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium flex-shrink-0">
                          {getLeftItemKey(matchedLeftId)}
                        </div>
                        <span className="font-medium text-gray-800 flex-1">{rightItem.text}</span>
                        {showCorrectAnswer && (
                          <div className="flex-shrink-0">
                            {isCorrect ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-medium flex-shrink-0">
                          ?
                        </div>
                        <span className="text-gray-500 flex-1 italic">
                          {isDragOver ? 'Suelta aquí' : 'Arrastra un elemento aquí'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mostrar respuestas correctas si está en modo revisión */}
        {showCorrectAnswer && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Respuestas correctas:</p>
            <div className="space-y-2">
              {Object.entries(correctPairs).map(([leftId, rightId]) => {
                const userAnswer = currentPairs[leftId]
                const isCorrect = userAnswer === rightId
                const leftText = getLeftItemText(leftId)
                const rightText = getRightItemText(rightId)
                const userAnswerText = userAnswer ? getRightItemText(userAnswer) : ''
                return (
                  <div key={`answer-${leftId}-${rightId}`} className="flex items-center gap-2 text-sm">
                    {isCorrect ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>
                      <strong>{getLeftItemKey(leftId)}</strong> ({leftText}) → {rightText}
                      {!isCorrect && userAnswerText && (
                        <span className="text-gray-600"> (Tu respuesta: {userAnswerText})</span>
                      )}
                    </span>
                  </div>
                )
              })}
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

    const wordCount = answer.trim().split(/\s+/).filter(word => word.length > 0).length
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
                <img
                  src={question.explanationImage}
                  alt="Imagen de explicación"
                  className="max-w-full h-auto rounded border border-blue-200"
                  style={{ maxHeight: '300px' }}
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
      {/* Enunciado de la pregunta */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium leading-relaxed">
          {question.questionText}
        </h3>
        {renderQuestionImage()}
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
              <img
                src={question.explanationImage}
                alt="Imagen de explicación"
                className="max-w-full h-auto rounded"
                style={{ maxHeight: '300px' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

