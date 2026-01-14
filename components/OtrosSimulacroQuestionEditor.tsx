"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ImageUpload } from '@/components/ImageUpload'

type OtherQuestionFormData = {
  contextText: string
  questionText: string
  questionImage?: string
  area: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  optionAImage?: string
  optionBImage?: string
  optionCImage?: string
  optionDImage?: string
  correctOption: string
  explanation?: string
  explanationImage?: string
  difficultyLevel: 'facil' | 'intermedio' | 'dificil' | 'variable'
  points: number
  orderIndex: number
}

export function OtrosSimulacroQuestionEditor({
  simulacroId,
  onClose
}: {
  simulacroId: string
  onClose: () => void
}) {
  const { toast } = useToast()
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null)
  const [formData, setFormData] = useState<OtherQuestionFormData>({
    contextText: '',
    questionText: '',
    questionImage: '',
    area: '',
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
  })

  useEffect(() => {
    fetchQuestions()
  }, [simulacroId])

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/otros-simulacros/${simulacroId}/questions`)
      if (!response.ok) throw new Error()
      const data = await response.json()
      setQuestions(data)
    } catch {
      toast({ title: 'Error', description: 'No se pudieron cargar las preguntas', variant: 'destructive' })
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
      area: '',
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
    })
    setShowForm(true)
  }

  const handleEdit = (q: any) => {
    setEditingQuestion(q)
    setFormData({
      contextText: q.lessonUrl || '',
      questionText: q.questionText || '',
      questionImage: q.questionImage || '',
      area: q.componente || '',
      optionA: q.optionA || '',
      optionB: q.optionB || '',
      optionC: q.optionC || '',
      optionD: q.optionD || '',
      optionAImage: q.optionAImage || '',
      optionBImage: q.optionBImage || '',
      optionCImage: q.optionCImage || '',
      optionDImage: q.optionDImage || '',
      correctOption: q.correctOption || 'A',
      explanation: q.explanation || '',
      explanationImage: q.explanationImage || '',
      difficultyLevel: q.difficultyLevel || 'intermedio',
      points: q.points || 1,
      orderIndex: q.orderIndex ?? 0,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.contextText.trim()) {
      toast({ title: 'Error', description: 'El enunciado es requerido', variant: 'destructive' })
      return
    }
    if (!formData.questionText.trim()) {
      toast({ title: 'Error', description: 'La pregunta es requerida', variant: 'destructive' })
      return
    }
    if (!formData.area.trim()) {
      toast({ title: 'Error', description: 'El área es requerida', variant: 'destructive' })
      return
    }

    try {
      const url = editingQuestion
        ? `/api/otros-simulacros/${simulacroId}/questions/${editingQuestion.id}`
        : `/api/otros-simulacros/${simulacroId}/questions`

      const method = editingQuestion ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error || 'Error')
      }

      toast({ title: 'Éxito', description: editingQuestion ? 'Pregunta actualizada' : 'Pregunta creada' })
      setShowForm(false)
      setEditingQuestion(null)
      fetchQuestions()
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Error al guardar la pregunta', variant: 'destructive' })
    }
  }

  const handleDelete = async (questionId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta pregunta?')) return
    try {
      const response = await fetch(`/api/otros-simulacros/${simulacroId}/questions/${questionId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error()
      toast({ title: 'Éxito', description: 'Pregunta eliminada' })
      fetchQuestions()
    } catch {
      toast({ title: 'Error', description: 'Error al eliminar la pregunta', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Preguntas del Simulacro</h3>
          <p className="text-sm text-gray-500">Total: {questions.length} pregunta(s)</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar Pregunta
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando preguntas...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No hay preguntas. Agrega la primera pregunta.</div>
      ) : (
        <div className="space-y-2">
          {questions.map((q: any) => (
            <Card key={q.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">#{(q.orderIndex ?? 0) + 1}</Badge>
                      <Badge>{q.difficultyLevel}</Badge>
                      {q.componente && <Badge variant="secondary">{q.componente}</Badge>}
                    </div>
                    {q.lessonUrl && (
                      <p className="text-sm text-gray-800 whitespace-pre-line mb-2">{q.lessonUrl}</p>
                    )}
                    {q.questionImage && (
                      <img
                        src={q.questionImage}
                        alt="Enunciado"
                        className="max-w-full h-auto rounded border mb-2"
                        style={{ maxHeight: '200px' }}
                      />
                    )}
                    <CardTitle className="text-base">{q.questionText}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(q)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(q.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta'}</DialogTitle>
            <DialogDescription>
              En “Otros simulacros”, el campo <strong>Área</strong> es texto libre.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="contextText">Enunciado / Texto base *</Label>
                <Textarea
                  id="contextText"
                  value={formData.contextText}
                  onChange={(e) => setFormData({ ...formData, contextText: e.target.value })}
                  required
                  rows={4}
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

              <div className="md:col-span-2">
                <Label htmlFor="questionText">Pregunta (opción múltiple) *</Label>
                <Textarea
                  id="questionText"
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  required
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="area">Área *</Label>
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  required
                  placeholder="Ej: Matemáticas, Biología, Historia, etc."
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
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const key = `option${opt}` as const
                    const imgKey = `option${opt}Image` as const
                    return (
                      <div key={opt} className="space-y-2">
                        <Label htmlFor={key} className="text-xs font-semibold">{`Opción ${opt} *`}</Label>
                        <Input
                          id={key}
                          value={(formData as any)[key]}
                          onChange={(e) => setFormData({ ...(formData as any), [key]: e.target.value })}
                          required
                        />
                        <ImageUpload
                          value={(formData as any)[imgKey]}
                          onChange={(url) => setFormData({ ...(formData as any), [imgKey]: url })}
                          placeholder={`Imagen opción ${opt} (opcional)`}
                          maxSize={2}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="md:col-span-2">
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
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

