"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  BookOpen, 
  Clock, 
  Users, 
  Play,
  Search,
  Filter,
  CheckCircle,
  Lock,
  Star,
  Target
} from "lucide-react"

interface Course {
  id: string
  title: string
  description: string
  competency: string
  competencyDisplayName: string
  academicGrade: string
  totalModules: number
  totalLessons: number
  estimatedTimeMinutes: number
  difficulty: string
  prerequisites: string[]
  canEnroll: boolean
  courseModules: Array<{
    id: string
    title: string
    description: string
    orderIndex: number
    lessonCount: number
    estimatedTime: number
  }>
}

interface CourseCatalogProps {
  onEnrollmentSuccess?: () => void
}

export function CourseCatalog({ onEnrollmentSuccess }: CourseCatalogProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompetency, setSelectedCompetency] = useState('all')
  const [selectedGrade, setSelectedGrade] = useState('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    filterCourses()
  }, [courses, searchTerm, selectedCompetency, selectedGrade])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/student/courses/available')
      
      if (!response.ok) {
        throw new Error('Error al cargar los cursos')
      }
      
      const data = await response.json()
      setCourses(data.available || [])
    } catch (err) {
      setError('Error al cargar los cursos disponibles')
      console.error('Error loading courses:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterCourses = () => {
    let filtered = courses

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.competencyDisplayName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por competencia
    if (selectedCompetency !== 'all') {
      filtered = filtered.filter(course => course.competency === selectedCompetency)
    }

    // Filtrar por grado
    if (selectedGrade !== 'all') {
      filtered = filtered.filter(course => course.academicGrade === selectedGrade)
    }

    setFilteredCourses(filtered)
  }

  const handleEnroll = async (courseId: string) => {
    try {
      setEnrolling(courseId)
      setError(null)

      const response = await fetch('/api/student/courses/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al inscribirse')
      }

      // Remover el curso de la lista de disponibles
      setCourses(prev => prev.filter(c => c.id !== courseId))
      
      if (onEnrollmentSuccess) {
        onEnrollmentSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al inscribirse')
      console.error('Error enrolling:', err)
    } finally {
      setEnrolling(null)
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facil':
        return 'bg-green-100 text-green-800'
      case 'intermedio':
        return 'bg-yellow-100 text-yellow-800'
      case 'dificil':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'facil':
        return 'Fácil'
      case 'intermedio':
        return 'Intermedio'
      case 'dificil':
        return 'Difícil'
      default:
        return 'Intermedio'
    }
  }

  // Obtener competencias únicas para el filtro
  const competencies = Array.from(new Set(courses.map(c => c.competencyDisplayName)))
  const grades = Array.from(new Set(courses.map(c => c.academicGrade)))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cursos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Catálogo de Cursos</h2>
        <p className="text-gray-600">
          Explora y inscríbete en los cursos disponibles para tu grado académico.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCompetency} onValueChange={setSelectedCompetency}>
              <SelectTrigger>
                <SelectValue placeholder="Competencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las competencias</SelectItem>
                {competencies.map(comp => (
                  <SelectItem key={comp} value={comp}>{comp}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger>
                <SelectValue placeholder="Grado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los grados</SelectItem>
                {grades.map(grade => (
                  <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setSelectedCompetency('all')
                setSelectedGrade('all')
              }}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Limpiar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {courses.length === 0 ? 'No hay cursos disponibles' : 'No se encontraron cursos'}
              </h3>
              <p className="text-gray-600">
                {courses.length === 0 
                  ? 'No hay cursos disponibles para tu grado académico en este momento.'
                  : 'Intenta ajustar los filtros de búsqueda.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{course.title}</CardTitle>
                    <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline">{course.competencyDisplayName}</Badge>
                  <Badge variant="outline">{course.academicGrade}</Badge>
                  <Badge className={getDifficultyColor(course.difficulty)}>
                    {getDifficultyLabel(course.difficulty)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Course Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-blue-600">{course.totalModules}</p>
                    <p className="text-xs text-gray-600">Módulos</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{course.totalLessons}</p>
                    <p className="text-xs text-gray-600">Lecciones</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-purple-600">
                      {formatTime(course.estimatedTimeMinutes)}
                    </p>
                    <p className="text-xs text-gray-600">Duración</p>
                  </div>
                </div>

                {/* Prerequisites */}
                {course.prerequisites.length > 0 && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Lock className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">Prerequisitos</span>
                    </div>
                    <p className="text-xs text-yellow-700">
                      Este curso requiere completar otros cursos primero.
                    </p>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  onClick={() => handleEnroll(course.id)}
                  disabled={!course.canEnroll || enrolling === course.id}
                  className="w-full"
                >
                  {enrolling === course.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Inscribiendo...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Inscribirse
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
