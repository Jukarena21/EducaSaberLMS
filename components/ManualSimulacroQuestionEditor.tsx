"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ManualSimulacroQuestionFormData, ManualSimulacroQuestionData } from '@/types/manual-simulacro'
import { useCompetencies } from '@/hooks/useCompetencies'
import { ImageUpload } from '@/components/ImageUpload'

interface ManualSimulacroQuestionEditorProps {
  simulacroId: string
  onClose: () => void
}

export function ManualSimulacroQuestionEditor({ 
  simulacroId, 
  onClose 
}: ManualSimulacroQuestionEditorProps) {
  const { toast } = useToast()
  const { competencies } = useCompetencies()
  const [questions, setQuestions] = useState<ManualSimulacroQuestionData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<ManualSimulacroQuestionData | null>(null)
  const [formData, setFormData] = useState<ManualSimulacroQuestionFormData>({
    contextText: '',
    questionText: '',
    questionImage: '',
    questionType: 'multiple_choice', // Siempre opción múltiple para simulacros manuales
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    optionAImage: '',
    optionBImage: '',
    optionCImage: '',
    optionDImage: '',
    correctOption: 'A',
    explanation: '',
    explanationImage: '',
    difficultyLevel: 'intermedio',
    points: 1,
    orderIndex: 0,
    tema: '',
    subtema: '',
    componente: '',
    competencyId: '',
  })

  useEffect(() => {
    fetchQuestions()
  }, [simulacroId])

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/manual-simulacros/${simulacroId}/questions`)
      if (response.ok) {
        const data = await response.json()
        setQuestions(data)
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar las preguntas",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar las preguntas",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingQuestion(null)
    setFormData({
      contextText: '',
      questionText: '',
      questionImage: '',
      questionType: 'multiple_choice', // Siempre opción múltiple
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      optionAImage: '',
      optionBImage: '',
      optionCImage: '',
      optionDImage: '',
      correctOption: 'A',
      explanation: '',
      explanationImage: '',
      difficultyLevel: 'intermedio',
      points: 1,
      orderIndex: questions.length,
      tema: '',
      subtema: '',
      componente: '',
      competencyId: '',
    })
    setShowForm(true)
  }

  const handleEdit = (question: ManualSimulacroQuestionData) => {
    setEditingQuestion(question)
    setFormData({
      contextText: (question as any).lessonUrl || '',
      questionText: question.questionText,
      questionImage: question.questionImage || '',
      questionType: 'multiple_choice' as any, // Siempre opción múltiple
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC || '',
      optionD: question.optionD || '',
      optionAImage: question.optionAImage || '',
      optionBImage: question.optionBImage || '',
      optionCImage: question.optionCImage || '',
      optionDImage: question.optionDImage || '',
      correctOption: question.correctOption,
      explanation: question.explanation || '',
      explanationImage: question.explanationImage || '',
      difficultyLevel: question.difficultyLevel as any,
      points: question.points,
      orderIndex: question.orderIndex,
      tema: question.tema || '',
      subtema: question.subtema || '',
      componente: question.componente || '',
      competencyId: question.competencyId || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!formData.contextText.trim()) {
      toast({
        title: "Error",
        description: "El enunciado es requerido",
        variant: "destructive"
      })
      return
    }

    if (!formData.questionText.trim()) {
      toast({
        title: "Error",
        description: "El texto de la pregunta es requerido",
        variant: "destructive"
      })
      return
    }

    if (!formData.optionA.trim() || !formData.optionB.trim() || !formData.optionC.trim() || !formData.optionD.trim()) {
      toast({
        title: "Error",
        description: "Todas las opciones (A, B, C, D) son requeridas para simulacros ICFES",
        variant: "destructive"
      })
      return
    }

    if (!formData.tema.trim() || !formData.subtema.trim() || !formData.componente.trim()) {
      toast({
        title: "Error",
        description: "Tema, subtema y componente son requeridos",
        variant: "destructive"
      })
      return
    }

    if (!formData.competencyId) {
      toast({
        title: "Error",
        description: "La competencia es requerida",
        variant: "destructive"
      })
      return
    }

    try {
      const url = editingQuestion
        ? `/api/manual-simulacros/${simulacroId}/questions/${editingQuestion.id}`
        : `/api/manual-simulacros/${simulacroId}/questions`
      
      const method = editingQuestion ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: editingQuestion ? "Pregunta actualizada" : "Pregunta creada"
        })
        setShowForm(false)
        setEditingQuestion(null)
        fetchQuestions()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Error al guardar la pregunta",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar la pregunta",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (questionId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta pregunta?")) {
      return
    }

    try {
      const response = await fetch(`/api/manual-simulacros/${simulacroId}/questions/${questionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Pregunta eliminada"
        })
        fetchQuestions()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Error al eliminar la pregunta",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar la pregunta",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Preguntas del Simulacro</h3>
          <p className="text-sm text-gray-500">
            Total: {questions.length} pregunta(s)
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Pregunta
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando preguntas...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay preguntas. Agrega la primera pregunta.
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">#{question.orderIndex + 1}</Badge>
                      <Badge>{question.difficultyLevel}</Badge>
                      {question.competency && (
                        <Badge variant="secondary">
                          {question.competency.displayName}
                        </Badge>
                      )}
                    </div>
                    {/* Enunciado + imagen */}
                    {((question as any).lessonUrl || question.questionImage) && (
                      <div className="mb-3">
                        {(question as any).lessonUrl && (
                          <p className="text-sm text-gray-800 whitespace-pre-line">
                            {(question as any).lessonUrl}
                          </p>
                        )}
                        {question.questionImage && (
                          <div className="mt-2">
                            <img 
                              src={question.questionImage} 
                              alt="Enunciado" 
                              className="max-w-full h-auto rounded border"
                              style={{ maxHeight: '200px' }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pregunta específica */}
                    <CardTitle className="text-base">{question.questionText}</CardTitle>
                    <div className="mt-3 text-sm text-gray-500 space-y-2">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <strong className="min-w-[60px]">Opción A:</strong>
                          <div className="flex-1">
                            <div>{question.optionA}</div>
                            {question.optionAImage && (
                              <img 
                                src={question.optionAImage} 
                                alt="Opción A" 
                                className="max-w-xs h-auto rounded border mt-1"
                                style={{ maxHeight: '100px' }}
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <strong className="min-w-[60px]">Opción B:</strong>
                          <div className="flex-1">
                            <div>{question.optionB}</div>
                            {question.optionBImage && (
                              <img 
                                src={question.optionBImage} 
                                alt="Opción B" 
                                className="max-w-xs h-auto rounded border mt-1"
                                style={{ maxHeight: '100px' }}
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <strong className="min-w-[60px]">Opción C:</strong>
                          <div className="flex-1">
                            <div>{question.optionC}</div>
                            {question.optionCImage && (
                              <img 
                                src={question.optionCImage} 
                                alt="Opción C" 
                                className="max-w-xs h-auto rounded border mt-1"
                                style={{ maxHeight: '100px' }}
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <strong className="min-w-[60px]">Opción D:</strong>
                          <div className="flex-1">
                            <div>{question.optionD}</div>
                            {question.optionDImage && (
                              <img 
                                src={question.optionDImage} 
                                alt="Opción D" 
                                className="max-w-xs h-auto rounded border mt-1"
                                style={{ maxHeight: '100px' }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t space-y-1">
                        {question.tema && <div><strong>Tema:</strong> {question.tema}</div>}
                        {question.subtema && <div><strong>Subtema:</strong> {question.subtema}</div>}
                        {question.componente && <div><strong>Componente:</strong> {question.componente}</div>}
                      </div>
                      {question.explanation && (
                        <div className="pt-2 border-t">
                          <strong>Explicación:</strong> {question.explanation}
                          {question.explanationImage && (
                            <img 
                              src={question.explanationImage} 
                              alt="Explicación" 
                              className="max-w-full h-auto rounded border mt-1"
                              style={{ maxHeight: '150px' }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(question)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(question.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para crear/editar pregunta */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Editar Pregunta" : "Nueva Pregunta"}
            </DialogTitle>
            <DialogDescription>
              Primero escribe el enunciado (texto base del ICFES) y luego la pregunta específica de opción múltiple.
              Los metadatos (tema, subtema, componente) son requeridos.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="contextText">Enunciado / Texto base *</Label>
                <Textarea
                  id="contextText"
                  value={formData.contextText}
                  onChange={(e) => setFormData({ ...formData, contextText: e.target.value })}
                  required
                  rows={4}
                  placeholder="Texto introductorio o situación problema sobre la cual se harán las preguntas (estilo ICFES)."
                />
              </div>

              <div className="md:col-span-2">
                <ImageUpload
                  value={formData.questionImage}
                  onChange={(url) => setFormData({ ...formData, questionImage: url })}
                  placeholder="Imagen asociada al enunciado (opcional)"
                  maxSize={3}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="questionText">Pregunta (enunciado de opción múltiple) *</Label>
                <Textarea
                  id="questionText"
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  required
                  rows={3}
                  placeholder="Ej: Según el texto anterior, ¿cuál de las siguientes opciones..."
                />
              </div>

              <div>
                <Label htmlFor="difficultyLevel">Dificultad *</Label>
                <Select
                  value={formData.difficultyLevel}
                  onValueChange={(value: any) => setFormData({ ...formData, difficultyLevel: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facil">Fácil</SelectItem>
                    <SelectItem value="intermedio">Intermedio</SelectItem>
                    <SelectItem value="dificil">Difícil</SelectItem>
                    <SelectItem value="variable">Variable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="competencyId">Competencia *</Label>
                <Select
                  value={formData.competencyId}
                  onValueChange={(value) => setFormData({ ...formData, competencyId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar competencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {competencies.map((comp) => (
                      <SelectItem key={comp.id} value={comp.id}>
                        {comp.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tema">Tema *</Label>
                <Input
                  id="tema"
                  value={formData.tema}
                  onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                  required
                  placeholder="Ej: Álgebra"
                />
              </div>

              <div>
                <Label htmlFor="subtema">Subtema *</Label>
                <Input
                  id="subtema"
                  value={formData.subtema}
                  onChange={(e) => setFormData({ ...formData, subtema: e.target.value })}
                  required
                  placeholder="Ej: Ecuaciones lineales"
                />
              </div>

              <div>
                <Label htmlFor="componente">Componente *</Label>
                <Input
                  id="componente"
                  value={formData.componente}
                  onChange={(e) => setFormData({ ...formData, componente: e.target.value })}
                  required
                  placeholder="Ej: Lectura Crítica - Comprensión"
                />
              </div>

              <div>
                <Label htmlFor="points">Puntos</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="md:col-span-2">
                <Label>Opciones de Respuesta *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="optionA" className="text-xs font-semibold">Opción A *</Label>
                    <Input
                      id="optionA"
                      value={formData.optionA}
                      onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                      required
                      placeholder="Texto de la opción A"
                    />
                    <ImageUpload
                      value={formData.optionAImage}
                      onChange={(url) => setFormData({ ...formData, optionAImage: url })}
                      placeholder="Imagen opción A (opcional)"
                      maxSize={2}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="optionB" className="text-xs font-semibold">Opción B *</Label>
                    <Input
                      id="optionB"
                      value={formData.optionB}
                      onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                      required
                      placeholder="Texto de la opción B"
                    />
                    <ImageUpload
                      value={formData.optionBImage}
                      onChange={(url) => setFormData({ ...formData, optionBImage: url })}
                      placeholder="Imagen opción B (opcional)"
                      maxSize={2}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="optionC" className="text-xs font-semibold">Opción C *</Label>
                    <Input
                      id="optionC"
                      value={formData.optionC}
                      onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                      required
                      placeholder="Texto de la opción C"
                    />
                    <ImageUpload
                      value={formData.optionCImage}
                      onChange={(url) => setFormData({ ...formData, optionCImage: url })}
                      placeholder="Imagen opción C (opcional)"
                      maxSize={2}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="optionD" className="text-xs font-semibold">Opción D *</Label>
                    <Input
                      id="optionD"
                      value={formData.optionD}
                      onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                      required
                      placeholder="Texto de la opción D"
                    />
                    <ImageUpload
                      value={formData.optionDImage}
                      onChange={(url) => setFormData({ ...formData, optionDImage: url })}
                      placeholder="Imagen opción D (opcional)"
                      maxSize={2}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="correctOption">Respuesta Correcta *</Label>
                <Select
                  value={formData.correctOption}
                  onValueChange={(value) => setFormData({ ...formData, correctOption: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="explanation">Explicación</Label>
                <Textarea
                  id="explanation"
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  rows={2}
                  placeholder="Explicación de la respuesta correcta (opcional)"
                />
              </div>

              <div className="md:col-span-2">
                <ImageUpload
                  value={formData.explanationImage}
                  onChange={(url) => setFormData({ ...formData, explanationImage: url })}
                  placeholder="Imagen de la explicación (opcional)"
                  maxSize={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => {
                setShowForm(false)
                setEditingQuestion(null)
              }}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                {editingQuestion ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

