"use client"

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { CalendarIcon, Plus, X, Eye, Save, AlertCircle, Clock, BookOpen, Target, Info, FileText, GraduationCap, Layers, Settings, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ExamFormData, ExamData } from '@/types/exam'
import { useCourses } from '@/hooks/useCourses'
import { useCompetencies } from '@/hooks/useCompetencies'
import { useModules } from '@/hooks/useModules'
import { ExamPreview } from '@/components/ExamPreview'
import { useToast } from '@/hooks/use-toast'
import { academicGradeToYear } from '@/lib/academicGrades'

interface ExamFormProps {
  exam?: ExamData
  onSubmit: (data: ExamFormData) => void
  onCancel: () => void
  loading?: boolean
}

export function ExamForm({ exam, onSubmit, onCancel, loading = false }: ExamFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<ExamFormData>({
    title: '',
    description: '',
    examType: 'por_competencia',
    courseId: '',
    competencyId: '',
    academicGrade: '',
    timeLimitMinutes: 60,
    passingScore: 70,
    difficultyLevel: 'intermedio',
    isAdaptive: false,
    isPublished: false,
    isIcfesExam: false,
    openDate: '',
    closeDate: '',
    includedModules: [],
    questionsPerModule: 5,
  })

  const [selectedModules, setSelectedModules] = useState<Array<{
    moduleId: string
    moduleTitle: string
    courseTitle: string
    competencyName: string
    availableQuestions: number
  }>>([])

  const [openDate, setOpenDate] = useState<Date>()
  const [closeDate, setCloseDate] = useState<Date>()
  const [openTime, setOpenTime] = useState('09:00')
  const [closeTime, setCloseTime] = useState('17:00')
  const [activeTab, setActiveTab] = useState('form')
  const [isIcfesForced, setIsIcfesForced] = useState(false)
  const [examTypeSelected, setExamTypeSelected] = useState(!!exam) // Si está editando, ya tiene tipo seleccionado

  // Hooks para obtener datos
  const { courses, loading: coursesLoading } = useCourses()
  const { competencies, loading: competenciesLoading } = useCompetencies()
  const { modules, loading: modulesLoading } = useModules(true) // forCourseCreation = true

  // Años escolares disponibles
  const academicGrades = [
    { value: 'sexto', label: 'Sexto' },
    { value: 'septimo', label: 'Séptimo' },
    { value: 'octavo', label: 'Octavo' },
    { value: 'noveno', label: 'Noveno' },
    { value: 'decimo', label: 'Décimo' },
    { value: 'once', label: 'Once' }
  ]

  // Inicializar datos del formulario
  useEffect(() => {
    if (exam) {
      setFormData({
        title: exam.title,
        description: exam.description || '',
        examType: exam.examType,
        courseId: exam.courseId || '',
        competencyId: exam.competencyId || '',
        academicGrade: exam.course?.competency?.name || '',
        timeLimitMinutes: exam.timeLimitMinutes || 60,
        passingScore: exam.passingScore,
        difficultyLevel: exam.difficultyLevel,
        isAdaptive: exam.isAdaptive,
        isPublished: exam.isPublished,
        isIcfesExam: exam.isIcfesExam ?? false,
        openDate: exam.openDate || '',
        closeDate: exam.closeDate || '',
        includedModules: exam.includedModules || [],
        questionsPerModule: exam.questionsPerModule,
      })

      if (exam.openDate) {
        setOpenDate(new Date(exam.openDate))
      }
      if (exam.closeDate) {
        setCloseDate(new Date(exam.closeDate))
      }
      setExamTypeSelected(true) // Si está editando, ya tiene tipo seleccionado
    } else {
      setExamTypeSelected(false) // Si está creando, necesita seleccionar tipo primero
    }
  }, [exam])

  // Cargar módulos seleccionados
  useEffect(() => {
    if (formData.includedModules.length > 0) {
      const selectedModulesData = formData.includedModules.map(moduleId => {
        const module = modules.find(m => m.id === moduleId)
        if (module) {
          // Encontrar el curso del módulo
          const course = courses.find(c => 
            c.modules?.some(m => m.id === moduleId)
          )
          const competency = competencies.find(comp => comp.id === course?.competencyId)
          
          return {
            moduleId: module.id,
            moduleTitle: module.title,
            courseTitle: course?.title || 'Curso no encontrado',
            competencyName: competency?.displayName || 'Competencia no encontrada',
            availableQuestions: 0 // Se calculará después
          }
        }
        return null
      }).filter(Boolean) as Array<{
        moduleId: string
        moduleTitle: string
        courseTitle: string
        competencyName: string
        availableQuestions: number
      }>

      setSelectedModules(selectedModulesData)
    }
  }, [formData.includedModules, modules, courses, competencies])

  useEffect(() => {
    const selectedCourse = courses.find(c => c.id === formData.courseId)
    const shouldForceIcfes = Boolean(selectedCourse?.isIcfesCourse) || ['simulacro_completo', 'diagnostico'].includes(formData.examType)
    setIsIcfesForced(shouldForceIcfes)
    if (shouldForceIcfes && !formData.isIcfesExam) {
      setFormData(prev => ({ ...prev, isIcfesExam: true }))
    }
  }, [formData.courseId, formData.examType, courses, formData.isIcfesExam])

  const handleInputChange = (field: keyof ExamFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Limpiar campos cuando cambie el tipo de examen
  useEffect(() => {
    if (formData.examType === 'simulacro_completo') {
      setFormData(prev => ({
        ...prev,
        courseId: '',
        competencyId: '',
        academicGrade: '',
        includedModules: []
      }))
    } else if (formData.examType === 'por_competencia') {
      setFormData(prev => ({
        ...prev,
        courseId: '',
        academicGrade: '',
        includedModules: []
      }))
    } else if (formData.examType === 'por_modulo') {
      setFormData(prev => ({
        ...prev,
        competencyId: '',
        academicGrade: '',
        includedModules: []
      }))
    } else if (formData.examType === 'diagnostico') {
      setFormData(prev => ({
        ...prev,
        courseId: '',
        competencyId: '',
        academicGrade: '',
        difficultyLevel: 'variable',
        includedModules: []
      }))
    }
  }, [formData.examType])

  const handleModuleToggle = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      includedModules: prev.includedModules.includes(moduleId)
        ? prev.includedModules.filter(id => id !== moduleId)
        : [...prev.includedModules, moduleId]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar fechas
    if (openDate && closeDate) {
      const openDateTime = new Date(`${openDate.toISOString().split('T')[0]}T${openTime}`)
      const closeDateTime = new Date(`${closeDate.toISOString().split('T')[0]}T${closeTime}`)
      
      if (openDateTime >= closeDateTime) {
        toast({
          title: 'Error de validación',
          description: 'La fecha de cierre debe ser posterior a la fecha de apertura',
          variant: 'destructive',
        })
        return
      }
    }
    
    const submitData = {
      ...formData,
      openDate: openDate ? `${openDate.toISOString().split('T')[0]}T${openTime}:00.000Z` : '',
      closeDate: closeDate ? `${closeDate.toISOString().split('T')[0]}T${closeTime}:00.000Z` : '',
    }
    
    onSubmit(submitData)
  }

  // Calcular estadísticas para las tarjetas de resumen
  const examStats = useMemo(() => {
    const totalQuestions = selectedModules.length * formData.questionsPerModule
    const totalTime = formData.timeLimitMinutes || 0
    return {
      totalQuestions,
      totalModules: selectedModules.length,
      totalTime,
    }
  }, [selectedModules.length, formData.questionsPerModule, formData.timeLimitMinutes])

  // Filtrar módulos según el tipo de examen
  const availableModules = modules.filter(module => {
    switch (formData.examType) {
      case 'simulacro_completo':
        // Para simulacro completo, mostrar módulos del año escolar seleccionado
        if (!formData.academicGrade) return false
        // Convertir academicGrade a year para comparar
        const targetYear = academicGradeToYear(formData.academicGrade) || undefined
        // Filtrar por cursos del año escolar seleccionado y que sean ICFES (excluir "otros")
        const simulacroCourses = courses.filter(c => 
          c.year === targetYear && 
          c.competency?.name !== 'otros' &&
          c.isIcfesCourse !== false
        )
        return simulacroCourses.some(course => 
          course.modules?.some(m => m.id === module.id)
        )
      
      case 'por_competencia':
        if (!formData.competencyId || !formData.academicGrade) return false
        // Convertir academicGrade a year para comparar
        const targetYear2 = academicGradeToYear(formData.academicGrade) || undefined
        // Para por_competencia, mostrar módulos de esa competencia y año escolar
        const competenciaCourses = courses.filter(c => 
          c.competencyId === formData.competencyId && c.year === targetYear2
        )
        return competenciaCourses.some(course => 
          course.modules?.some(m => m.id === module.id)
        )
      
      case 'por_modulo':
        if (!formData.courseId) return false
        // Para por_modulo, mostrar solo módulos del curso seleccionado
        const course = courses.find(c => c.id === formData.courseId)
        return course?.modules?.some(m => m.id === module.id) || false
      
      case 'personalizado':
      case 'diagnostico':
        // Para personalizado y diagnóstico, mostrar todos los módulos
        return true
      
      default:
        return false
    }
  })

  // Seleccionar automáticamente todos los módulos disponibles para simulacro completo
  useEffect(() => {
    if (formData.examType === 'simulacro_completo' && formData.academicGrade && availableModules.length > 0) {
      const availableModuleIds = availableModules.map(m => m.id)
      // Solo actualizar si los módulos incluidos no coinciden con los disponibles
      if (formData.includedModules.length !== availableModuleIds.length || 
          !availableModuleIds.every(id => formData.includedModules.includes(id))) {
        setFormData(prev => ({
          ...prev,
          includedModules: availableModuleIds
        }))
      }
    }
  }, [formData.examType, formData.academicGrade, availableModules, formData.includedModules])

  // Renderizar campos específicos según el tipo de examen
  const renderExamTypeSpecificFields = () => {
    switch (formData.examType) {
      case 'simulacro_completo':
        return (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Simulacro Completo</h4>
            <p className="text-sm text-blue-700">
              Este examen incluirá preguntas de todas las competencias ICFES. 
              Se seleccionarán automáticamente preguntas de diferentes módulos para crear un examen completo.
            </p>
          </div>
        )
      
      case 'por_competencia':
        return (
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Examen por Competencia</h4>
            <p className="text-sm text-green-700">
              Este examen se enfoca en una competencia específica. 
              Selecciona los módulos que quieres incluir de la competencia elegida.
            </p>
          </div>
        )
      
      case 'por_modulo':
        return (
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Examen por Módulo</h4>
            <p className="text-sm text-yellow-700">
              Este examen se enfoca en módulos específicos. 
              Ideal para evaluar el progreso en temas particulares.
            </p>
          </div>
        )
      
      case 'personalizado':
        return (
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Examen Personalizado</h4>
            <p className="text-sm text-purple-700">
              Crea un examen completamente personalizado seleccionando módulos específicos 
              de diferentes cursos y competencias.
            </p>
          </div>
        )
      
      case 'diagnostico':
        return (
          <div className="p-4 bg-orange-50 rounded-lg">
            <h4 className="font-medium text-orange-900 mb-2">Examen Diagnóstico</h4>
            <p className="text-sm text-orange-700">
              Este examen evalúa el nivel inicial del estudiante. 
              Incluye preguntas de diferentes dificultades para determinar el punto de partida.
            </p>
          </div>
        )
      
      default:
        return null
    }
  }

  // Renderizar contenido de módulos según el tipo de examen
  const renderModulesContent = () => {
    switch (formData.examType) {
      case 'simulacro_completo':
        if (!formData.academicGrade) {
          return (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p>Selecciona un año escolar en el formulario para ver los módulos disponibles</p>
            </div>
          )
        }
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Simulacro Completo - {academicGrades.find(g => g.value === formData.academicGrade)?.label}</h4>
              <p className="text-sm text-blue-700 mb-3">
                Este examen incluirá automáticamente preguntas de todas las competencias ICFES para {academicGrades.find(g => g.value === formData.academicGrade)?.label}:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {competencies.map((competency) => (
                  <div key={competency.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: competency.colorHex || '#73A2D3' }}
                    />
                    <span className="text-sm font-medium">{competency.displayName}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Configuración automática:</strong> Se seleccionarán preguntas de todos los módulos 
                disponibles de cada competencia para {academicGrades.find(g => g.value === formData.academicGrade)?.label} y crear un examen completo y representativo.
              </p>
            </div>
            {availableModules.length > 0 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Módulos disponibles:</strong> {availableModules.length} módulos encontrados para {academicGrades.find(g => g.value === formData.academicGrade)?.label}
                </p>
              </div>
            )}
          </div>
        )

      case 'por_competencia':
        if (!formData.competencyId || !formData.academicGrade) {
          return (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p>Selecciona una competencia y año escolar en el formulario para ver los módulos disponibles</p>
            </div>
          )
        }
        return renderModuleSelection()

      case 'por_modulo':
        if (!formData.courseId) {
          return (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4" />
              <p>Selecciona un curso en el formulario para ver los módulos disponibles</p>
            </div>
          )
        }
        return renderModuleSelection()

      case 'personalizado':
        return renderCustomModuleSelection()

      case 'diagnostico':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2">Examen Diagnóstico</h4>
              <p className="text-sm text-orange-700 mb-3">
                Este examen evaluará el nivel inicial del estudiante. Puedes seleccionar módulos 
                de diferentes competencias para crear una evaluación completa.
              </p>
            </div>
            {renderCustomModuleSelection()}
          </div>
        )

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p>Selecciona un tipo de examen para configurar los módulos</p>
          </div>
        )
    }
  }

  // Renderizar selección de módulos estándar (por competencia o por módulo)
  const renderModuleSelection = () => {
    if (availableModules.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <p>No hay módulos disponibles para la configuración actual</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="grid gap-4">
          {availableModules.map((module) => (
            <div
              key={module.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                formData.includedModules.includes(module.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleModuleToggle(module.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{module.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {module.description || 'Sin descripción'}
                  </p>
                  {module.competency && (
                    <p className="text-xs text-blue-600 mt-1">
                      Competencia: {module.competency.displayName}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {module.lessons?.length || 0} lecciones
                  </Badge>
                  {formData.includedModules.includes(module.id) && (
                    <Badge variant="default">Seleccionado</Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedModules.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-3">Módulos Seleccionados</h3>
            <div className="space-y-2">
              {selectedModules.map((module) => {
                const moduleData = modules.find(m => m.id === module.moduleId)
                return (
                  <div key={module.moduleId} className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{module.moduleTitle}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({moduleData?.competency?.displayName || 'Sin competencia'})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleModuleToggle(module.moduleId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium">
                Total de preguntas estimadas: {examStats.totalQuestions}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedModules.length} módulos × {formData.questionsPerModule} preguntas por módulo
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Renderizar selección personalizada de módulos (para personalizado y diagnóstico)
  const renderCustomModuleSelection = () => {
    // Agrupar módulos por competencia
    const modulesByCompetency = competencies.map(competency => {
      const competencyModules = modules.filter(module => 
        module.competencyId === competency.id
      )
      
      return {
        competency,
        modules: competencyModules
      }
    }).filter(group => group.modules.length > 0)

    return (
      <div className="space-y-6">
        {modulesByCompetency.map(({ competency, modules: competencyModules }) => (
          <div key={competency.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: competency.colorHex || '#73A2D3' }}
              />
              <h3 className="font-medium text-lg">{competency.displayName}</h3>
              <Badge variant="outline">{competencyModules.length} módulos</Badge>
            </div>
            
            <div className="grid gap-3">
              {competencyModules.map((module) => (
                <div
                  key={module.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.includedModules.includes(module.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleModuleToggle(module.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{module.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {module.lessons?.length || 0} lecciones
                      </p>
                    </div>
                    {formData.includedModules.includes(module.id) && (
                      <Badge variant="default">Seleccionado</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {selectedModules.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-3">Módulos Seleccionados ({selectedModules.length})</h3>
            <div className="space-y-2">
              {selectedModules.map((module) => {
                const moduleData = modules.find(m => m.id === module.moduleId)
                return (
                  <div key={module.moduleId} className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{module.moduleTitle}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({moduleData?.competency?.displayName || 'Sin competencia'})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleModuleToggle(module.moduleId)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium">
                Total de preguntas estimadas: {examStats.totalQuestions}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedModules.length} módulos × {formData.questionsPerModule} preguntas por módulo
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Tipos de examen disponibles
  const examTypes = [
    { 
      value: 'simulacro_completo', 
      label: 'Simulacro Completo', 
      icon: GraduationCap, 
      color: 'blue',
      description: 'Examen completo con todas las competencias ICFES. Ideal para evaluaciones integrales.'
    },
    { 
      value: 'por_competencia', 
      label: 'Por Competencia', 
      icon: Target, 
      color: 'green',
      description: 'Examen enfocado en una competencia específica. Perfecto para evaluaciones temáticas.'
    },
    { 
      value: 'por_modulo', 
      label: 'Por Módulo', 
      icon: BookOpen, 
      color: 'purple',
      description: 'Examen basado en módulos específicos de un curso. Ideal para evaluar temas particulares.'
    },
    { 
      value: 'personalizado', 
      label: 'Personalizado', 
      icon: Settings, 
      color: 'orange',
      description: 'Crea un examen completamente personalizado seleccionando módulos de diferentes cursos.'
    },
    { 
      value: 'diagnostico', 
      label: 'Diagnóstico', 
      icon: FileText, 
      color: 'pink',
      description: 'Evalúa el nivel inicial del estudiante con preguntas de diferentes dificultades.'
    },
  ]

  const handleExamTypeSelect = (type: string) => {
    const examType = type as 'simulacro_completo' | 'por_competencia' | 'por_modulo' | 'personalizado' | 'diagnostico'
    setFormData(prev => ({ ...prev, examType }))
    setExamTypeSelected(true)
  }

  const handleBackToTypeSelection = () => {
    setExamTypeSelected(false)
    setFormData(prev => ({ ...prev, examType: 'por_competencia' }))
  }

  // Pantalla de selección de tipo de examen (solo para creación, no para edición)
  if (!exam && !examTypeSelected) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Selecciona el tipo de examen</DialogTitle>
            <DialogDescription className="text-center">
              Elige el tipo de examen que deseas crear
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {examTypes.map((type) => {
                const IconComponent = type.icon
                const colorClasses = {
                  blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
                  green: 'bg-green-100 text-green-600 group-hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400',
                  purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400',
                  orange: 'bg-orange-100 text-orange-600 group-hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
                  pink: 'bg-pink-100 text-pink-600 group-hover:bg-pink-200 dark:bg-pink-900/20 dark:text-pink-400',
                }
                
                return (
                  <button
                    key={type.value}
                    onClick={() => handleExamTypeSelect(type.value)}
                    className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer text-left group h-full flex flex-col"
                  >
                    <div className="flex flex-col items-center space-y-4 flex-1">
                      <div className={`p-4 rounded-full transition-colors ${colorClasses[type.color as keyof typeof colorClasses]}`}>
                        <IconComponent className="h-10 w-10" />
                      </div>
                      <div className="text-center space-y-2 flex-1">
                        <h3 className="font-semibold text-lg">{type.label}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {type.description}
                        </p>
                      </div>
                      <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors mt-2" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                {exam ? 'Editar Examen' : 'Crear Nuevo Examen'}
              </DialogTitle>
              <DialogDescription>
                {exam 
                  ? 'Modifica la información del examen'
                  : 'Completa la información para crear un nuevo examen'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {examTypes.find(t => t.value === formData.examType)?.label || formData.examType}
              </Badge>
              {!exam && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToTypeSelection}
                  className="text-xs"
                >
                  Cambiar Tipo
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-4">
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Módulos seleccionados</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {examStats.totalModules}
                    </p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Preguntas estimadas</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                      {examStats.totalQuestions}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tiempo límite</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {examStats.totalTime} min
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="form">Información básica</TabsTrigger>
              <TabsTrigger value="modules">Módulos</TabsTrigger>
              <TabsTrigger value="preview">Vista previa</TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="space-y-6 mt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Datos del examen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Información básica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="title">Título del Examen *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="Ej: Simulacro de Matemáticas - Grado 6"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="examType">Tipo de Examen *</Label>
                        <Select
                          value={formData.examType}
                          onValueChange={(value) => handleInputChange('examType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="simulacro_completo">Simulacro Completo</SelectItem>
                            <SelectItem value="por_competencia">Por Competencia</SelectItem>
                            <SelectItem value="por_modulo">Por Módulo</SelectItem>
                            <SelectItem value="personalizado">Personalizado</SelectItem>
                            <SelectItem value="diagnostico">Diagnóstico</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe el propósito y contenido del examen..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Información específica del tipo de examen */}
                {renderExamTypeSpecificFields() && (
                  <Card>
                    <CardContent className="pt-6">
                      {renderExamTypeSpecificFields()}
                    </CardContent>
                  </Card>
                )}

                {/* Configuración del examen */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Configuración del examen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Año escolar - Para simulacro completo y por competencia */}
                    {(formData.examType === 'simulacro_completo' || formData.examType === 'por_competencia') && (
                      <div className="space-y-2">
                        <Label htmlFor="academicGrade">Año Escolar *</Label>
                        <Select
                          value={formData.academicGrade}
                          onValueChange={(value) => handleInputChange('academicGrade', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar año escolar" />
                          </SelectTrigger>
                          <SelectContent>
                            {academicGrades.map((grade) => (
                              <SelectItem key={grade.value} value={grade.value}>
                                {grade.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Campos dinámicos según tipo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Curso - Solo para tipos que no sean simulacro_completo */}
                  {formData.examType !== 'simulacro_completo' && (
                    <div className="space-y-2">
                      <Label htmlFor="courseId">
                        Curso {formData.examType === 'por_competencia' ? '*' : ''}
                      </Label>
                      <Select
                        value={formData.courseId}
                        onValueChange={(value) => handleInputChange('courseId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar curso" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title} - {course.competency?.displayName || course.competency?.name || 'Sin competencia'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Competencia - Solo para por_competencia */}
                  {formData.examType === 'por_competencia' && (
                    <div className="space-y-2">
                      <Label htmlFor="competencyId">Competencia *</Label>
                      <Select
                        value={formData.competencyId}
                        onValueChange={(value) => handleInputChange('competencyId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar competencia" />
                        </SelectTrigger>
                        <SelectContent>
                          {competencies.map((competency) => (
                            <SelectItem key={competency.id} value={competency.id}>
                              {competency.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                    </div>
                  </CardContent>
                </Card>

                {/* Configuración de tiempo y puntuación */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tiempo y puntuación</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="timeLimitMinutes">Tiempo Límite (minutos)</Label>
                        <Input
                          id="timeLimitMinutes"
                          type="number"
                          value={formData.timeLimitMinutes}
                          onChange={(e) => handleInputChange('timeLimitMinutes', parseInt(e.target.value) || 60)}
                          min="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="passingScore">Puntuación Mínima (%)</Label>
                        <Input
                          id="passingScore"
                          type="number"
                          value={formData.passingScore}
                          onChange={(e) => handleInputChange('passingScore', parseInt(e.target.value) || 70)}
                          min="0"
                          max="100"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="difficultyLevel">Nivel de Dificultad</Label>
                        <Select
                          value={formData.difficultyLevel}
                          onValueChange={(value) => handleInputChange('difficultyLevel', value)}
                          disabled={formData.examType === 'diagnostico'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar nivel" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="facil">Fácil</SelectItem>
                            <SelectItem value="intermedio">Intermedio</SelectItem>
                            <SelectItem value="dificil">Difícil</SelectItem>
                            <SelectItem value="variable">Variable (Todas las dificultades)</SelectItem>
                          </SelectContent>
                        </Select>
                        {formData.examType === 'diagnostico' && (
                          <p className="text-xs text-muted-foreground">
                            La dificultad se establece automáticamente como "Variable" para exámenes de diagnóstico
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fechas de apertura y cierre */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Disponibilidad</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha de Apertura</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {openDate ? format(openDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={openDate}
                        onSelect={setOpenDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                        locale={es}
                        weekStartsOn={1}
                        className="rounded-md border"
                      />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Fecha de Cierre</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {closeDate ? format(closeDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={closeDate}
                        onSelect={setCloseDate}
                        initialFocus
                        disabled={(date) => {
                          if (!openDate) return date < new Date()
                          return date < openDate || date < new Date()
                        }}
                        locale={es}
                        weekStartsOn={1}
                        className="rounded-md border"
                      />
                        </PopoverContent>
                      </Popover>
                    </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="openTime">Hora de Apertura</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="openTime"
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      className="pl-10 focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="closeTime">Hora de Cierre</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="closeTime"
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      className="pl-10 focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                      </div>
                    </div>
                  </div>

                    {/* Validación de fechas */}
                    {openDate && closeDate && (
                      <div className="p-3 rounded-lg border">
                        {new Date(`${openDate.toISOString().split('T')[0]}T${openTime}`) >= 
                         new Date(`${closeDate.toISOString().split('T')[0]}T${closeTime}`) ? (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">La fecha de cierre debe ser posterior a la fecha de apertura</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-green-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">
                              Examen disponible desde {format(openDate, "PPP", { locale: es })} a las {openTime} 
                              hasta {format(closeDate, "PPP", { locale: es })} a las {closeTime}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Configuración de preguntas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Configuración de preguntas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="questionsPerModule">Preguntas por Módulo</Label>
                      <Input
                        id="questionsPerModule"
                        type="number"
                        value={formData.questionsPerModule}
                        onChange={(e) => handleInputChange('questionsPerModule', parseInt(e.target.value) || 5)}
                        min="1"
                        max="20"
                      />
                      <p className="text-sm text-muted-foreground">
                        Número de preguntas que se seleccionarán aleatoriamente de cada módulo
                      </p>
                    </div>

                    {/* Configuración ICFES */}
                    <div className="space-y-2">
                      <Label htmlFor="isIcfesExam">Modo ICFES</Label>
                      <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/30">
                        <div className="space-y-1 pr-4">
                          <p className="font-medium text-sm">
                            {isIcfesForced ? 'Examen marcado automáticamente como ICFES' : 'Limitar a preguntas tipo ICFES'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isIcfesForced
                              ? 'Este examen hereda la configuración ICFES del curso o del tipo de examen seleccionado.'
                              : 'Activa esta opción para que solo se utilicen preguntas de opción múltiple compatibles con simulacros ICFES.'}
                          </p>
                        </div>
                        <Switch
                          id="isIcfesExam"
                          checked={formData.isIcfesExam}
                          disabled={isIcfesForced}
                          onCheckedChange={(checked) => handleInputChange('isIcfesExam', checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Opciones avanzadas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Opciones avanzadas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="isAdaptive">Examen Adaptativo</Label>
                        <p className="text-xs text-muted-foreground">
                          El examen se ajusta según el rendimiento del estudiante
                        </p>
                      </div>
                      <Switch
                        id="isAdaptive"
                        checked={formData.isAdaptive}
                        onCheckedChange={(checked) => handleInputChange('isAdaptive', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="isPublished">Publicar Examen</Label>
                        <p className="text-xs text-muted-foreground">
                          Hacer el examen visible para los estudiantes
                        </p>
                      </div>
                      <Switch
                        id="isPublished"
                        checked={formData.isPublished}
                        onCheckedChange={(checked) => handleInputChange('isPublished', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Recordatorios */}
                <Card className="bg-muted/50 border-muted">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">Recordatorios importantes:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>El tipo de examen determina cómo se seleccionan las preguntas</li>
                          <li>Los simulacros completos incluyen todas las competencias ICFES</li>
                          <li>Las fechas de apertura y cierre controlan la disponibilidad del examen</li>
                          <li>El modo ICFES limita las preguntas a opción múltiple</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Botones de acción */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : exam ? 'Actualizar' : 'Crear'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="modules" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {formData.examType === 'simulacro_completo' ? 'Configuración del Simulacro' : 
                     formData.examType === 'por_competencia' ? 'Módulos de la Competencia' :
                     formData.examType === 'por_modulo' ? 'Seleccionar Módulos Específicos' :
                     formData.examType === 'personalizado' ? 'Módulos Personalizados' :
                     'Configuración de Módulos'}
                  </CardTitle>
                  <CardDescription>
                    Selecciona los módulos que formarán parte de este examen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderModulesContent()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Vista Previa del Examen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {formData.title ? (
                    <ExamPreview
                      exam={{
                        id: 'preview',
                        title: formData.title,
                        description: formData.description,
                        examType: formData.examType,
                        courseId: formData.courseId,
                        competencyId: formData.competencyId,
                        timeLimitMinutes: formData.timeLimitMinutes,
                        passingScore: formData.passingScore,
                        difficultyLevel: formData.difficultyLevel,
                        isAdaptive: formData.isAdaptive,
                        isPublished: formData.isPublished,
                        isIcfesExam: formData.isIcfesExam,
                        createdById: '',
                        openDate: formData.openDate,
                        closeDate: formData.closeDate,
                        includedModules: formData.includedModules,
                        questionsPerModule: formData.questionsPerModule,
                        totalQuestions: examStats.totalQuestions,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      }}
                      mode="preview"
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                      <p>Completa el formulario para ver la vista previa del examen</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
