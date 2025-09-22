"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useSession } from 'next-auth/react'
import { X, Save, Plus, Trash2 } from 'lucide-react'
import { QuestionFormData, QuestionFormProps, QuestionAnswer } from '@/types/question'

export default function QuestionForm({ question, competencies, lessons, onSubmit, onCancel, loading = false }: QuestionFormProps) {
  const { data: session } = useSession()
  const [formData, setFormData] = useState<QuestionFormData>({
    statement: '',
    competencyId: '',
    lessonId: '',
    difficultyLevel: 'medio',
    status: 'activa',
    explanation: '',
    answers: [
      { text: '', isCorrect: false, order: 1 },
      { text: '', isCorrect: false, order: 2 },
      { text: '', isCorrect: false, order: 3 },
      { text: '', isCorrect: false, order: 4 },
    ],
  })

  const isEditing = !!question

  useEffect(() => {
    if (question) {
      setFormData(question)
    }
  }, [question])

  const handleInputChange = (field: keyof QuestionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAnswerChange = (index: number, field: keyof QuestionAnswer, value: any) => {
    setFormData(prev => ({
      ...prev,
      answers: prev.answers.map((answer, i) => 
        i === index ? { ...answer, [field]: value } : answer
      )
    }))
  }

  const handleCorrectAnswerChange = (index: number) => {
    setFormData(prev => ({
      ...prev,
      answers: prev.answers.map((answer, i) => ({
        ...answer,
        isCorrect: i === index
      }))
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Question form submitted with data:', formData)
    
    // Validation
    if (!formData.statement || !formData.competencyId) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    // Check if at least one answer is correct
    const hasCorrectAnswer = formData.answers.some(answer => answer.isCorrect)
    if (!hasCorrectAnswer) {
      alert('Debe seleccionar al menos una respuesta correcta')
      return
    }

    // Check if all answers have text
    const hasEmptyAnswers = formData.answers.some(answer => !answer.text.trim())
    if (hasEmptyAnswers) {
      alert('Todas las respuestas deben tener texto')
      return
    }

    try {
      await onSubmit(formData)
      console.log('Question form submission successful')
    } catch (error) {
      console.error('Question form submission error:', error)
    }
  }

  const getDifficultyDisplayName = (level: string) => {
    switch (level) {
      case 'facil': return 'Fácil'
      case 'medio': return 'Medio'
      case 'dificil': return 'Difícil'
      default: return level
    }
  }

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'activa': return 'Activa'
      case 'revision': return 'En Revisión'
      case 'inactiva': return 'Inactiva'
      default: return status
    }
  }

  // Filter lessons by selected competency
  const filteredLessons = lessons.filter(lesson => lesson.competencyId === formData.competencyId)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {isEditing ? 'Editar Pregunta' : 'Crear Nueva Pregunta'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Información Básica</TabsTrigger>
                <TabsTrigger value="answers">Respuestas</TabsTrigger>
                <TabsTrigger value="details">Detalles</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label htmlFor="statement">Enunciado de la Pregunta *</Label>
                  <Textarea
                    id="statement"
                    value={formData.statement}
                    onChange={(e) => handleInputChange('statement', e.target.value)}
                    placeholder="Escriba el enunciado de la pregunta..."
                    className="min-h-[100px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="competencyId">Competencia *</Label>
                    <Select value={formData.competencyId} onValueChange={(value) => handleInputChange('competencyId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar competencia" />
                      </SelectTrigger>
                      <SelectContent>
                        {competencies.map(competency => (
                          <SelectItem key={competency.id} value={competency.id}>
                            {competency.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="lessonId">Lección (Opcional)</Label>
                    <Select value={formData.lessonId || 'none'} onValueChange={(value) => handleInputChange('lessonId', value === 'none' ? '' : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar lección" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {filteredLessons.map(lesson => (
                          <SelectItem key={lesson.id} value={lesson.id}>
                            {lesson.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="difficultyLevel">Nivel de Dificultad</Label>
                    <Select value={formData.difficultyLevel} onValueChange={(value) => handleInputChange('difficultyLevel', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facil">Fácil</SelectItem>
                        <SelectItem value="medio">Medio</SelectItem>
                        <SelectItem value="dificil">Difícil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Estado</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activa">Activa</SelectItem>
                        <SelectItem value="revision">En Revisión</SelectItem>
                        <SelectItem value="inactiva">Inactiva</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              {/* Answers Tab */}
              <TabsContent value="answers" className="space-y-4">
                <div>
                  <Label>Respuestas</Label>
                  <div className="space-y-3">
                    {formData.answers.map((answer, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <RadioGroup
                          value={formData.answers.findIndex(a => a.isCorrect).toString()}
                          onValueChange={() => handleCorrectAnswerChange(index)}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={index.toString()} id={`correct-${index}`} />
                            <Label htmlFor={`correct-${index}`} className="text-sm font-medium">
                              Correcta
                            </Label>
                          </div>
                        </RadioGroup>
                        <Input
                          value={answer.text}
                          onChange={(e) => handleAnswerChange(index, 'text', e.target.value)}
                          placeholder={`Respuesta ${index + 1}`}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-500">Opción {index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <div>
                  <Label htmlFor="explanation">Explicación de la Respuesta Correcta</Label>
                  <Textarea
                    id="explanation"
                    value={formData.explanation}
                    onChange={(e) => handleInputChange('explanation', e.target.value)}
                    placeholder="Explique por qué la respuesta es correcta..."
                    className="min-h-[100px]"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 