// Tipos para el sistema de exámenes

export interface ExamData {
  id: string
  title: string
  description?: string
  examType: 'simulacro_completo' | 'por_competencia' | 'por_modulo' | 'personalizado' | 'diagnostico'
  courseId?: string
  competencyId?: string
  timeLimitMinutes?: number
  passingScore: number
  difficultyLevel: 'facil' | 'intermedio' | 'dificil' | 'variable'
  isAdaptive: boolean
  isPublished: boolean
  createdById?: string
  openDate?: string
  closeDate?: string
  includedModules?: string[] // Array de module_ids
  questionsPerModule: number
  totalQuestions?: number
  createdAt: string
  updatedAt: string
  
  // Relaciones
  course?: {
    id: string
    title: string
    competency: {
      id: string
      name: string
      displayName: string
    }
  }
  competency?: {
    id: string
    name: string
    displayName: string
  }
  createdBy?: {
    id: string
    firstName: string
    lastName: string
  }
  examQuestions?: ExamQuestionData[]
  examResults?: ExamResultData[]
}

export interface ExamFormData {
  title: string
  description: string
  examType: 'simulacro_completo' | 'por_competencia' | 'por_modulo' | 'personalizado' | 'diagnostico'
  courseId: string
  competencyId: string
  academicGrade: string
  timeLimitMinutes: number
  passingScore: number
  difficultyLevel: 'facil' | 'intermedio' | 'dificil' | 'variable'
  isAdaptive: boolean
  isPublished: boolean
  openDate: string
  closeDate: string
  includedModules: string[]
  questionsPerModule: number
}

export interface ExamQuestionData {
  id: string
  examId: string
  questionText: string
  questionImage?: string
  questionType: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'essay'
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
  timeLimit?: number
  lessonId?: string
  lessonUrl?: string
  createdAt: string
  updatedAt: string
  
  // Relaciones
  lesson?: {
    id: string
    title: string
    moduleLessons: {
      module: {
        id: string
        title: string
        courseModules: {
          course: {
            id: string
            title: string
            competency: {
              id: string
              name: string
              displayName: string
            }
          }
        }[]
      }
    }[]
  }
}

export interface ExamResultData {
  id: string
  userId: string
  examId: string
  score: number
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  timeTakenMinutes?: number
  startedAt: string
  completedAt?: string
  isPassed?: boolean
  averageTimePerQuestion?: number
  questionsWithVeryFastAnswers: number
  questionsWithIdenticalTiming: number
  fraudRiskScore: number
  resultsByCompetency?: string // JSON string
  createdAt: string
  
  // Relaciones
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  exam?: {
    id: string
    title: string
    examType: string
  }
  examQuestionAnswers?: ExamQuestionAnswerData[]
}

export interface ExamQuestionAnswerData {
  id: string
  examResultId: string
  questionId: string
  selectedOption?: string
  isCorrect?: boolean
  timeSpentSeconds?: number
  feedbackViewed: boolean
  feedbackViewedAt?: string
  createdAt: string
  
  // Relaciones
  question?: ExamQuestionData
}

export interface ExamFilters {
  search?: string
  examType?: string
  competencyId?: string
  courseId?: string
  difficultyLevel?: string
  isPublished?: boolean
  createdById?: string
  openDateFrom?: string
  openDateTo?: string
  closeDateFrom?: string
  closeDateTo?: string
}

export interface ExamPreviewProps {
  exam: ExamData
  mode: 'admin' | 'student' | 'preview'
  onAnswer?: (questionId: string, selectedOption: string) => void
  answers?: Record<string, string>
  isSubmitted?: boolean
  timeRemaining?: number
}

export interface ExamCreationData {
  exam: ExamFormData
  selectedModules: {
    moduleId: string
    moduleTitle: string
    courseTitle: string
    competencyName: string
    availableQuestions: number
  }[]
}

export interface ExamStatistics {
  totalExams: number
  publishedExams: number
  draftExams: number
  totalAttempts: number
  averageScore: number
  passRate: number
  examsByType: Record<string, number>
  examsByCompetency: Record<string, number>
  recentExams: ExamData[]
  topPerformingExams: ExamData[]
}
