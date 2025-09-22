'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { QuestionPreviewProps } from '@/types/question';
import { 
  Clock, 
  Image as ImageIcon, 
  CheckCircle, 
  XCircle, 
  Eye,
  EyeOff,
  Timer
} from 'lucide-react';

export function QuestionPreview({ 
  question, 
  mode, 
  showCorrectAnswer = false, 
  onAnswerSelect,
  selectedAnswer,
  isSubmitted = false 
}: QuestionPreviewProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'facil': return 'bg-green-100 text-green-700';
      case 'medio': return 'bg-yellow-100 text-yellow-700';
      case 'dificil': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'facil': return 'Fácil';
      case 'medio': return 'Medio';
      case 'dificil': return 'Difícil';
      default: return level;
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'Opción Múltiple';
      case 'true_false': return 'Verdadero/Falso';
      case 'fill_blank': return 'Completar';
      case 'matching': return 'Emparejar';
      case 'essay': return 'Ensayo';
      default: return type;
    }
  };

  const isCorrect = selectedAnswer === question.correctOption;
  const showResult = isSubmitted && showCorrectAnswer;

  // Renderizado específico para modo examen
  if (mode === 'exam') {
    return (
      <div className="bg-white rounded-lg p-6 h-full flex flex-col max-w-4xl mx-auto">
        <div className="flex-1">
          <div className="mb-6">
            <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-line">
              {question.questionText}
            </p>
          </div>

          {/* Imagen de la pregunta si existe */}
          {question.questionImage && (
            <div className="mb-6">
              <img 
                src={question.questionImage} 
                alt="Imagen de la pregunta"
                className="max-w-full h-auto rounded-lg border"
                style={{ maxHeight: '400px' }}
              />
            </div>
          )}

          {/* Opciones de respuesta */}
          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map((option) => {
              const optionText = question[`option${option}` as keyof typeof question] as string;
              const optionImage = question[`option${option}Image` as keyof typeof question] as string | undefined;
              const isSelected = selectedAnswer === option;
              
              return (
                <div
                  key={option}
                  className={`
                    p-4 rounded-lg border cursor-pointer transition-all flex items-start space-x-3
                    ${
                      isSelected
                        ? "border-[#73A2D3] bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }
                  `}
                  onClick={() => onAnswerSelect?.(option)}
                >
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm
                      ${
                        isSelected
                          ? "bg-[#73A2D3] text-white"
                          : "bg-gray-100 text-gray-700"
                      }
                    `}
                  >
                    {option}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <span className="text-gray-800">{optionText}</span>
                    
                    {optionImage && (
                      <div className="border rounded p-2 bg-white">
                        <img 
                          src={optionImage} 
                          alt={`Opción ${option}`}
                          className="max-w-full h-auto rounded"
                          style={{ maxHeight: '200px' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Información de la materia y tema */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-800">
                {question.lesson?.modules?.[0]?.competency?.name || 'Competencia'}
              </div>
              <div className="text-sm text-gray-600">
                {question.lesson?.title || 'Lección'}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Pregunta de ejemplo
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl">
              {mode === 'lesson' ? 'Ejercicio de la Lección' : 'Vista Previa de Pregunta'}
            </CardTitle>
            <Badge className={getDifficultyColor(question.difficultyLevel)}>
              {getDifficultyLabel(question.difficultyLevel)}
            </Badge>
            <Badge variant="outline">
              {getQuestionTypeLabel(question.questionType)}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {question.timeLimit && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Timer className="w-4 h-4" />
                {question.timeLimit}s
              </div>
            )}
            {question.questionImage && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <ImageIcon className="w-4 h-4" />
                Con imagen
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Enunciado de la pregunta */}
        <div className="space-y-4">
          <div className="prose max-w-none">
            <p className="text-lg font-medium leading-relaxed">
              {question.questionText}
            </p>
          </div>
          
          {question.questionImage && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <img 
                src={question.questionImage} 
                alt="Imagen de la pregunta"
                className="max-w-full h-auto rounded"
                style={{ maxHeight: '400px' }}
              />
            </div>
          )}
        </div>

        {/* Opciones de respuesta */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Opciones de respuesta:</Label>
          
          <RadioGroup 
            value={selectedAnswer || ''} 
            onValueChange={onAnswerSelect}
            disabled={isSubmitted}
            className="space-y-3"
          >
            {['A', 'B', 'C', 'D'].map((option) => {
              const optionText = question[`option${option}` as keyof typeof question] as string;
              const optionImage = question[`option${option}Image` as keyof typeof question] as string | undefined;
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === question.correctOption;
              
              return (
                <div 
                  key={option}
                  className={`flex items-start space-x-3 p-4 border rounded-lg transition-colors ${
                    showResult 
                      ? isCorrectOption 
                        ? 'border-green-500 bg-green-50' 
                        : isSelected && !isCorrectOption
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200'
                      : isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${option}`} />
                    <Label 
                      htmlFor={`option-${option}`} 
                      className={`font-medium ${
                        showResult && isCorrectOption ? 'text-green-700' : ''
                      }`}
                    >
                      {option}
                    </Label>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <p className={`text-sm ${
                      showResult && isCorrectOption ? 'text-green-700 font-medium' : ''
                    }`}>
                      {optionText}
                    </p>
                    
                    {optionImage && (
                      <div className="border rounded p-2 bg-white">
                        <img 
                          src={optionImage} 
                          alt={`Opción ${option}`}
                          className="max-w-full h-auto rounded"
                          style={{ maxHeight: '200px' }}
                        />
                      </div>
                    )}
                  </div>
                  
                  {showResult && (
                    <div className="flex-shrink-0">
                      {isCorrectOption ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : isSelected && !isCorrectOption ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {/* Explicación */}
        {question.explanation && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Explicación:</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center gap-2"
              >
                {showExplanation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showExplanation ? 'Ocultar' : 'Mostrar'} explicación
              </Button>
            </div>
            
            {showExplanation && (
              <div className="space-y-3">
                <div className="prose max-w-none p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    {question.explanation}
                  </p>
                </div>
                
                {question.explanationImage && (
                  <div className="border rounded-lg p-4 bg-white">
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
        )}

        {/* Información adicional para modo admin */}
        {mode === 'admin' && (
          <div className="pt-4 border-t space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Lección:</span> {question.lesson?.title || 'Sin lección'}
              </div>
              <div>
                <span className="font-medium">Competencia:</span> {question.lesson?.modules?.[0]?.competency?.name || 'Sin competencia'}
              </div>
              <div>
                <span className="font-medium">Orden:</span> {question.orderIndex}
              </div>
              <div>
                <span className="font-medium">Respuesta correcta:</span> {question.correctOption}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
