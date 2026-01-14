export interface SchoolData {
  id?: string
  name: string
  type?: 'school' | 'company' | 'government_entity' | 'other'
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
  // Branding
  logoUrl?: string | null
  themePrimary?: string | null
  themeSecondary?: string | null
  themeAccent?: string | null
}

export interface SchoolFormData {
  name: string
  type?: 'school' | 'company' | 'government_entity' | 'other'
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
  daneCode?: string
  // Branding (editable in separate UI, but keep types handy)
  logoUrl?: string
  themePrimary?: string
  themeSecondary?: string
  themeAccent?: string
}

export interface SchoolFormProps {
  school?: SchoolFormData | null
  onSubmit: (data: SchoolFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
} 