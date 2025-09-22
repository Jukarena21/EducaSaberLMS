export interface SchoolData {
  id?: string
  name: string
  city: string
  neighborhood: string
  address?: string
  institutionType: 'publica' | 'privada' | 'otro'
  academicCalendar: 'diurno' | 'nocturno' | 'ambos'
  totalStudents: number
  numberOfCampuses: number
  yearsOfOperation: number
  contactEmail: string
  contactPhone: string
  activeStudentsCount?: number
  averageStudentUsageMinutes?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface SchoolFormData {
  name: string
  city: string
  neighborhood: string
  address?: string
  institutionType: 'publica' | 'privada' | 'otro'
  academicCalendar: 'diurno' | 'nocturno' | 'ambos'
  totalStudents: number
  numberOfCampuses: number
  yearsOfOperation: number
  contactEmail: string
  contactPhone: string
}

export interface SchoolFormProps {
  school?: SchoolFormData | null
  onSubmit: (data: SchoolFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
} 