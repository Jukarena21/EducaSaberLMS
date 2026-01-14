// Tipos específicos para simulacros manuales

import { ExamData, ExamQuestionData } from './exam'

// Formulario para crear/editar simulacro manual
export interface ManualSimulacroFormData {
  title: string
  description?: string
  timeLimitMinutes: number
  passingScore: number
  openDate?: string
  closeDate?: string
  isPredefined: boolean // Si es predefinido de EducaSaber
  isPublished: boolean
}

// Pregunta de simulacro manual con metadatos
export interface ManualSimulacroQuestionData extends ExamQuestionData {
  tema: string
  subtema: string
  componente: string
  competencyId: string
}

// Formulario para crear/editar pregunta de simulacro manual
export interface ManualSimulacroQuestionFormData {
  // Enunciado base (texto largo previo a la pregunta, propio del estilo ICFES)
  contextText: string
  // Pregunta específica que se formula sobre el enunciado
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
  // Metadatos específicos
  tema: string
  subtema: string
  componente: string
  competencyId: string
}

// Asignación a colegio
export interface ExamSchoolData {
  id: string
  examId: string
  schoolId: string
  academicGrade?: string // 'sexto', 'septimo', etc.
  openDate?: string
  closeDate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  school?: {
    id: string
    name: string
    daneCode?: string
  }
}

// Asignación a estudiante
export interface ExamAssignmentData {
  id: string
  examId: string
  userId: string
  openDate?: string
  closeDate?: string
  isActive: boolean
  assignedById?: string
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
    schoolId?: string
  }
  assignedBy?: {
    id: string
    firstName: string
    lastName: string
  }
}

// Datos completos de simulacro manual
export interface ManualSimulacroData extends ExamData {
  isManualSimulacro: true
  isPredefined: boolean
  examQuestions?: ManualSimulacroQuestionData[]
  examSchools?: ExamSchoolData[]
  examAssignments?: ExamAssignmentData[]
}

// Formulario de asignación
export interface SimulacroAssignmentFormData {
  schoolIds?: string[] // IDs de colegios a asignar
  userIds?: string[] // IDs de estudiantes a asignar
  openDate?: string // Fecha de apertura (opcional, puede ser específica por colegio/estudiante)
  closeDate?: string // Fecha de cierre (opcional, puede ser específica por colegio/estudiante)
}

// Resultados organizados por metadatos (para reportes)
export interface ResultsByMetadata {
  [key: string]: {
    correct: number
    total: number
    percentage: number
  }
}

// Reporte de simulacro manual
export interface ManualSimulacroReport {
  examId: string
  examTitle: string
  totalStudents: number
  totalAttempts: number
  averageScore: number
  passRate: number
  resultsByCompetency: ResultsByMetadata
  resultsByComponente: ResultsByMetadata
  resultsByTema: ResultsByMetadata
  resultsBySubtema: ResultsByMetadata
  resultsByDifficulty: ResultsByMetadata
  studentResults: Array<{
    userId: string
    userName: string
    score: number
    isPassed: boolean
    completedAt?: string
    resultsByCompetency?: ResultsByMetadata
    resultsByComponente?: ResultsByMetadata
    resultsByTema?: ResultsByMetadata
    resultsBySubtema?: ResultsByMetadata
  }>
}

// Filtros para simulacros manuales
export interface ManualSimulacroFilters {
  search?: string
  isPredefined?: boolean
  isPublished?: boolean
  createdById?: string
  openDateFrom?: string
  openDateTo?: string
  closeDateFrom?: string
  closeDateTo?: string
}

