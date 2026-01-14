export interface QuestionData {
  id?: string
  lessonId: string
  
  // Contenido de la pregunta
  questionText: string
  questionImage?: string // URL de imagen en el enunciado
  questionType: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'essay'

  // Uso de la pregunta dentro del banco
  usage?: 'lesson' | 'exam' | 'both'
  
  // Opciones de respuesta
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  optionAImage?: string // URL de imagen para opción A
  optionBImage?: string // URL de imagen para opción B
  optionCImage?: string // URL de imagen para opción C
  optionDImage?: string // URL de imagen para opción D
  
  correctOption: string
  explanation?: string
  explanationImage?: string // URL de imagen en la explicación
  
  // Metadatos
  orderIndex: number
  difficultyLevel: 'facil' | 'medio' | 'dificil'
  timeLimit?: number // Tiempo límite en segundos (opcional)
  
  // Relación con lección
  lesson?: {
    id: string
    title: string
    academicGrade?: string
    year?: number
    modules: Array<{
      moduleId: string
      moduleTitle: string
      orderIndex: number
      course?: {
        id: string
        title: string
        isIcfesCourse?: boolean
        competency?: {
          id: string
          name: string
        }
      }
      competency?: {
        id: string
        name: string
      }
    }>
  }
  
  // Año escolar directo (si está disponible)
  academicGrade?: string
  year?: number
  
  createdAt?: Date
  updatedAt?: Date
}

export interface QuestionAnswer {
  id?: string
  text: string
  isCorrect: boolean
  order: number
}

export interface QuestionFormData {
  lessonId: string
  
  // Contenido de la pregunta
  questionText: string
  questionImage?: string
  questionType: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'essay'

  // Uso de la pregunta dentro del banco
  usage: 'lesson' | 'exam' | 'both'
  
  // Opciones de respuesta
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
  
  // Metadatos
  orderIndex: number
  difficultyLevel: 'facil' | 'medio' | 'dificil'
  timeLimit?: number
}

export interface QuestionFormProps {
  question?: QuestionFormData | null
  competencies: Array<{ id: string; name: string; displayName: string }>
  lessons: Array<{ 
    id: string; 
    title: string; 
    competencyId: string; 
    isIcfesCourse?: boolean;
    academicGrade?: string;
    year?: number;
  }>
  onSubmit: (data: QuestionFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
  onTypeSelected?: () => void
  questionTypeSelected?: boolean
  setQuestionTypeSelected?: (value: boolean) => void
  onQuestionTypeChange?: (type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'essay') => void
  initialQuestionType?: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'essay'
}

// Tipos para vistas previas
export interface QuestionPreviewProps {
  question: QuestionData
  mode: 'exam' | 'lesson' | 'admin'
  showCorrectAnswer?: boolean
  onAnswerSelect?: (option: string) => void
  selectedAnswer?: string
  isSubmitted?: boolean
}

export interface QuestionFilters {
  search?: string
  competencyId?: string
  difficultyLevel?: string
  questionType?: string
  lessonId?: string
  hasImages?: 'all' | 'yes' | 'no'
  isIcfesCourse?: boolean
} 