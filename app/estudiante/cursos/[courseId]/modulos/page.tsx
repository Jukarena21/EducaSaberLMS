"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StudentHeader } from "@/components/StudentHeader"
import { 
  BookOpen, 
  Clock, 
  Play, 
  CheckCircle,
  Target,
  Users,
  Award
} from "lucide-react"

interface Module {
  id: string
  title: string
  description: string
  orderIndex: number
  totalLessons: number
  completedLessonsCount: number
  progressPercentage: number
  status: 'not_started' | 'in_progress' | 'completed'
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  description: string
  estimatedTimeMinutes: number
  status: 'not_started' | 'in_progress' | 'completed'
  progressPercentage: number
  totalTimeMinutes: number
  completedAt?: string
}

interface CourseData {
  course: {
    id: string
    title: string
    description: string
    competency: string
    academicGrade: string
  }
  modules: Module[]
}

export default function CourseModulesPage({ params }: { params: Promise<{ courseId: string }> }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [courseData, setCourseData] = useState<CourseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeModule, setActiveModule] = useState(0)

  useEffect(() => {
    if (status === "loading") return
    
    if (!session || session.user?.role !== "student") {
      router.push("/")
      return
    }

    loadCourseData()
  }, [session, status, router])

  const loadCourseData = async () => {
    try {
      const resolvedParams = await params
      const response = await fetch(`/api/student/courses/${resolvedParams.courseId}`)
      
      if (!response.ok) {
        throw new Error('Error al cargar el curso')
      }
      
      const data = await response.json()
      setCourseData(data)
    } catch (err) {
      setError('Error al cargar el curso')
      console.error('Error loading course:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <Play className="h-5 w-5 text-blue-500" />
      default:
        return <Lock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado'
      case 'in_progress':
        return 'En Progreso'
      default:
        return 'No Iniciado'
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando curso...</p>
        </div>
      </div>
    )
  }

  if (error || !courseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'No se pudo cargar el curso'}</p>
            <Button onClick={() => router.push('/estudiante')} className="w-full">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentModule = courseData.modules[activeModule]

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentHeader 
        title={courseData.course.title}
        subtitle={courseData.course.description}
        showBackButton={true}
        backUrl="/estudiante"
        rightContent={
          <div className="flex items-center space-x-4">
            <Badge className="bg-blue-100 text-blue-800">
              {courseData.course.competency}
            </Badge>
            <Badge variant="outline">
              {courseData.course.academicGrade}
            </Badge>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Module Navigation - Left Side */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Módulos del Curso</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {courseData.modules.map((module, index) => (
                  <button
                    key={module.id}
                    onClick={() => setActiveModule(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      activeModule === index
                        ? "bg-blue-50 border-2 border-blue-200"
                        : "hover:bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">Módulo {module.orderIndex}</div>
                      <div className="text-xs text-gray-500">
                        {module.completedLessonsCount}/{module.totalLessons}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">{module.title}</div>
                    <Progress 
                      value={module.progressPercentage} 
                      className="h-1" 
                    />
                    <div className="flex items-center justify-between mt-2">
                      <Badge className={getStatusColor(module.status)}>
                        {getStatusText(module.status)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {Math.round(module.progressPercentage)}%
                      </span>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Module Detail - Right Side */}
          <div className="lg:col-span-3">
            {currentModule ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                          Módulo {currentModule.orderIndex}
                        </span>
                        <span>{currentModule.title}</span>
                      </CardTitle>
                      <p className="text-gray-600 mt-2">{currentModule.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(currentModule.status)}
                        <Badge className={getStatusColor(currentModule.status)}>
                          {getStatusText(currentModule.status)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {currentModule.completedLessonsCount}/{currentModule.totalLessons} lecciones
                      </div>
                    </div>
                  </div>
                  <Progress value={currentModule.progressPercentage} className="mt-4" />
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="lessons" className="w-full">
                    <TabsList className="grid w-full grid-cols-1">
                      <TabsTrigger value="lessons">Lecciones del Módulo</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="lessons" className="space-y-3">
                      {currentModule.lessons.map((lesson, index) => (
                        <div 
                          key={lesson.id}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            lesson.status === 'completed' 
                              ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                              : lesson.status === 'in_progress'
                                ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => router.push(`/estudiante/cursos/${courseData.course.id}/leccion/${lesson.id}`)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(lesson.status)}
                              <div>
                                <h4 className="font-medium">{lesson.title}</h4>
                                <p className="text-sm text-gray-600">
                                  {lesson.estimatedTimeMinutes || 0} min
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <Badge className={getStatusColor(lesson.status)}>
                                  {getStatusText(lesson.status)}
                                </Badge>
                                {lesson.progressPercentage > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {Math.round(lesson.progressPercentage)}% completado
                                  </div>
                                )}
                              </div>
                              <Button size="sm" variant="outline">
                                {lesson.status === 'completed' ? 'Revisar' : 'Comenzar'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay módulos disponibles</h3>
                  <p className="text-gray-600">Este curso no tiene módulos configurados.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
