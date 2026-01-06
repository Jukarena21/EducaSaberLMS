"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Award,
  Clock,
  BookOpen,
  TrendingUp,
  BarChart3,
  FileText,
  X,
  Download,
  Target,
  CheckCircle,
  AlertTriangle,
  Calendar,
} from "lucide-react"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

interface StudentDetailModalProps {
  studentId: string | null
  isOpen: boolean
  onClose: () => void
}

export function StudentDetailModal({ studentId, isOpen, onClose }: StudentDetailModalProps) {
  const [studentMetrics, setStudentMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("resumen")

  useEffect(() => {
    if (isOpen && studentId) {
      console.log('Modal opened, loading details for student:', studentId)
      
      const loadStudentDetails = async () => {
        if (!studentId) {
          console.error('No studentId provided')
          return
        }

        try {
          setLoading(true)
          setError(null)
          console.log('Loading student details for:', studentId)

          const response = await fetch(`/api/admin/students/metrics?studentId=${studentId}`)
          console.log('Response status:', response.status)
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
          }

          const data = await response.json()
          console.log('Student metrics loaded:', data)
          setStudentMetrics(data)
        } catch (err: any) {
          console.error('Error loading student details:', err)
          setError(err.message || 'Error al cargar detalles del estudiante')
        } finally {
          setLoading(false)
        }
      }

      loadStudentDetails()
    } else {
      setStudentMetrics(null)
      setError(null)
      setActiveTab("resumen")
    }
  }, [isOpen, studentId])

  const handleExportPDF = async () => {
    if (!studentId || !studentMetrics) return

    try {
      // Mostrar indicador de carga
      setExportingPDF(true)
      
      // Llamar a la API de exportación de Puppeteer
      // Esta API ahora acepta studentId para admins
      const response = await fetch('/api/student/progress/export-puppeteer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'complete',
          proposal: 'proposal-1',
          studentId: studentId // Pasar el ID del estudiante para que la API pueda generar el reporte
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error al generar el PDF')
      }

      // Obtener el PDF como blob
      const blob = await response.blob()
      
      // Crear URL temporal y descargar
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const fileName = `informe_${studentMetrics.studentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      setExportingPDF(false)
    } catch (error: any) {
      console.error('Error exporting PDF:', error)
      setExportingPDF(false)
      alert(`Error al generar el PDF: ${error.message || 'Por favor intenta nuevamente'}`)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose()
    }}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-800">
              {studentMetrics ? studentMetrics.studentName : 'Cargando...'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {studentMetrics && (
                <Badge className={
                  studentMetrics.status === 'excelente' ? 'bg-green-500 text-white' :
                  studentMetrics.status === 'bueno' ? 'bg-blue-500 text-white' :
                  studentMetrics.status === 'mejorable' ? 'bg-yellow-500 text-white' :
                  'bg-red-500 text-white'
                }>
                  {studentMetrics.status === 'excelente' ? 'Excelente' :
                   studentMetrics.status === 'bueno' ? 'Bueno' :
                   studentMetrics.status === 'mejorable' ? 'Mejorable' :
                   'Requiere Atención'}
                </Badge>
              )}
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#73A2D3] mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando detalles del estudiante...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">
            {error}
          </div>
        ) : studentMetrics ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="evolucion">Evolución</TabsTrigger>
              <TabsTrigger value="competencias">Competencias</TabsTrigger>
              <TabsTrigger value="examenes">Exámenes</TabsTrigger>
              <TabsTrigger value="cursos">Cursos</TabsTrigger>
            </TabsList>

            {/* Tab: Resumen */}
            <TabsContent value="resumen" className="space-y-4 mt-4">
              {/* KPIs Principales */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-blue-200 rounded-lg">
                        <Award className="h-6 w-6 text-blue-700" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-blue-700 mb-1">
                      {(studentMetrics.averageScore || 0).toFixed(1)}
                    </div>
                    <div className="text-sm font-medium text-blue-600">Promedio General</div>
                    <div className="text-xs text-blue-500 mt-1">Rendimiento académico</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-green-200 rounded-lg">
                        <FileText className="h-6 w-6 text-green-700" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-green-700 mb-1">
                      {studentMetrics.totalExams || 0}
                    </div>
                    <div className="text-sm font-medium text-green-600">Exámenes Realizados</div>
                    <div className="text-xs text-green-500 mt-1">Total de evaluaciones</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-purple-200 rounded-lg">
                        <Clock className="h-6 w-6 text-purple-700" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-purple-700 mb-1">
                      {(studentMetrics.totalStudyTimeHours || 0).toFixed(1)}h
                    </div>
                    <div className="text-sm font-medium text-purple-600">Tiempo de Estudio</div>
                    <div className="text-xs text-purple-500 mt-1">Horas totales</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-orange-200 rounded-lg">
                        <BookOpen className="h-6 w-6 text-orange-700" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-orange-700 mb-1">
                      {(studentMetrics.averageCourseProgress || 0).toFixed(1)}%
                    </div>
                    <div className="text-sm font-medium text-orange-600">Progreso Promedio</div>
                    <div className="text-xs text-orange-500 mt-1">En cursos activos</div>
                  </CardContent>
                </Card>
              </div>

              {/* Información Adicional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      <span>Métricas de Rendimiento</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tasa de Aprobación</span>
                      <Badge className={
                        (studentMetrics.passRate || 0) >= 70 ? 'bg-green-500 text-white' :
                        (studentMetrics.passRate || 0) >= 50 ? 'bg-yellow-500 text-white' :
                        'bg-red-500 text-white'
                      }>
                        {(studentMetrics.passRate || 0).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cursos Completados</span>
                      <span className="font-semibold">{studentMetrics.completedCourses || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cursos Activos</span>
                      <span className="font-semibold">{studentMetrics.activeCourses || 0}</span>
                    </div>
                    {studentMetrics.lastActivity && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Última Actividad</span>
                        <span className="text-xs text-gray-500">
                          {new Date(studentMetrics.lastActivity).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {studentMetrics.riskFactors && studentMetrics.riskFactors.length > 0 && (
                  <Card className="border-2 border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2 text-red-800">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <span>Factores de Riesgo</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {studentMetrics.riskFactors.map((factor: string, idx: number) => (
                          <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Acciones Rápidas */}
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base">Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleExportPDF}
                      disabled={exportingPDF}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {exportingPDF ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generando PDF...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Generar Informe PDF
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Evolución */}
            <TabsContent value="evolucion" className="space-y-4 mt-4">
              {studentMetrics.monthlyEvolution && studentMetrics.monthlyEvolution.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <span>Evolución Mensual de Rendimiento</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <RechartsLineChart data={studentMetrics.monthlyEvolution}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="month"
                              tick={{ fontSize: 11 }}
                              tickFormatter={(value) => {
                                const [year, month] = value.split('-')
                                const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
                                return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`
                              }}
                            />
                            <YAxis 
                              domain={[0, 100]}
                              tick={{ fontSize: 11 }}
                              tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip 
                              formatter={(value: any) => [`${value}`, 'Promedio']}
                              labelFormatter={(label) => {
                                const [year, month] = label.split('-')
                                const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
                                return `${monthNames[parseInt(month) - 1]} ${year}`
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="averageScore" 
                              name="Promedio" 
                              stroke="#73A2D3" 
                              strokeWidth={2.5}
                              dot={{ fill: '#73A2D3', r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No hay datos de evolución disponibles</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab: Competencias */}
            <TabsContent value="competencias" className="space-y-4 mt-4">
              {studentMetrics.competencyPerformance && studentMetrics.competencyPerformance.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Gráfico Radar */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Rendimiento por Competencia</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={studentMetrics.competencyPerformance.map((comp: any) => ({
                          subject: comp.competencyName || 'Sin nombre',
                          A: comp.averageScore || 0,
                          fullMark: 100
                        }))}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Radar 
                            name="Promedio" 
                            dataKey="A" 
                            stroke="#73A2D3" 
                            fill="#73A2D3" 
                            fillOpacity={0.6} 
                          />
                          <Tooltip formatter={(value: any) => `${value}`} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Lista de Competencias */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Detalle por Competencia</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {studentMetrics.competencyPerformance.map((comp: any) => (
                          <div key={comp.competencyId} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-800">{comp.competencyName}</span>
                              <Badge className={
                                comp.averageScore >= 80 ? 'bg-green-500 text-white' :
                                comp.averageScore >= 70 ? 'bg-blue-500 text-white' :
                                comp.averageScore >= 60 ? 'bg-yellow-500 text-white' :
                                'bg-red-500 text-white'
                              }>
                                {comp.averageScore.toFixed(1)}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                              <div>Exámenes: {comp.examsCount}</div>
                              <div>Aprobación: {comp.passRate.toFixed(1)}%</div>
                            </div>
                            <Progress 
                              value={comp.averageScore} 
                              className="mt-2 h-2"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No hay datos de competencias disponibles</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab: Exámenes */}
            <TabsContent value="examenes" className="space-y-4 mt-4">
              {studentMetrics.examHistory && studentMetrics.examHistory.length > 0 ? (
                <div className="space-y-3">
                  {studentMetrics.examHistory.map((exam: any) => (
                    <Card 
                      key={exam.id} 
                      className={`border-2 hover:shadow-md transition-all duration-300 ${
                        exam.isPassed 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-800">{exam.examTitle}</h4>
                              <Badge className={
                                exam.isPassed 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-red-500 text-white'
                              }>
                                {exam.isPassed ? 'Aprobado' : 'No Aprobado'}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Competencia:</span> {exam.competencyName}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-gray-500">Calificación:</span>
                                <div className={`font-bold text-lg ${
                                  exam.score >= 80 ? 'text-green-600' :
                                  exam.score >= 70 ? 'text-blue-600' :
                                  exam.score >= 60 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {exam.score.toFixed(1)}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Correctas:</span>
                                <div className="font-semibold text-gray-800">
                                  {exam.correctAnswers} / {exam.totalQuestions}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Fecha:</span>
                                <div className="text-xs text-gray-600">
                                  {new Date(exam.completedAt).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Porcentaje:</span>
                                <div className="font-semibold text-gray-800">
                                  {exam.totalQuestions > 0 
                                    ? Math.round((exam.correctAnswers / exam.totalQuestions) * 100) 
                                    : 0}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No hay exámenes registrados</p>
                    <p className="text-xs text-gray-400 mt-1">El estudiante aún no ha realizado exámenes</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab: Cursos */}
            <TabsContent value="cursos" className="space-y-4 mt-4">
              {studentMetrics.coursesDetail && studentMetrics.coursesDetail.length > 0 ? (
                <div className="space-y-3">
                  {studentMetrics.coursesDetail.map((course: any) => (
                    <Card 
                      key={course.courseId} 
                      className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 hover:shadow-md transition-all duration-300"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-800 text-lg">{course.courseTitle}</h4>
                              {course.isActive ? (
                                <Badge className="bg-green-500 text-white">Activo</Badge>
                              ) : (
                                <Badge variant="outline">Inactivo</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mb-3">
                              <span className="font-medium">Competencia:</span> {course.competencyName}
                            </div>
                            
                            {/* Barra de progreso */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">Progreso del Curso</span>
                                <span className="text-sm font-bold text-blue-600">{course.progressPercentage.toFixed(1)}%</span>
                              </div>
                              <Progress value={course.progressPercentage} className="h-3" />
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-gray-500">Lecciones:</span>
                                <div className="font-semibold text-gray-800">
                                  {course.completedLessons} / {course.totalLessons}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Tiempo:</span>
                                <div className="font-semibold text-gray-800">
                                  {course.timeSpentHours.toFixed(1)}h
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Inscripción:</span>
                                <div className="text-xs text-gray-600">
                                  {new Date(course.enrollmentDate).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500">Completado:</span>
                                <div className="font-semibold text-gray-800">
                                  {course.progressPercentage >= 100 ? (
                                    <span className="text-green-600">✓ Completado</span>
                                  ) : (
                                    <span className="text-blue-600">En progreso</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No hay cursos inscritos</p>
                    <p className="text-xs text-gray-400 mt-1">El estudiante aún no está inscrito en ningún curso</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

