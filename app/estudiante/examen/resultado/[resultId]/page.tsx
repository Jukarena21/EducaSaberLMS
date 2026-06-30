"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { StudentHeader } from "@/components/StudentHeader"
import { ExamResultAnalytics } from "@/components/ExamResultAnalytics"
import {
  CheckCircle,
  XCircle,
  Download,
  Target,
  Clock,
  AlertCircle,
  FileText,
  Lock,
} from "lucide-react"
import { getPendingSubmissionMessage } from "@/lib/examFeedbackPolicy"
import type {
  BreakdownItem,
  CompetencyRadarData,
  ExamAttemptAnalytics,
} from "@/lib/examPerformanceAnalytics"

interface ExamResult {
  id: string
  score?: number
  correctAnswers?: number
  incorrectAnswers?: number
  totalQuestions?: number
  isPassed?: boolean
  timeTakenMinutes?: number
  completedAt?: string
  feedbackReleased?: boolean
  feedbackMessage?: string
  reportAvailable?: boolean
  exam: {
    id: string
    title: string
    description: string
    closeDate?: string | null
    competency: {
      id: string
      name: string
      displayName: string
    }
  }
  analytics?: {
    attemptBreakdown: ExamAttemptAnalytics
    radarComparison: CompetencyRadarData
    weakTopics: BreakdownItem[]
    areaLabels: string[]
  }
}

export default function ExamResultPage({ params }: { params: Promise<{ resultId: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [result, setResult] = useState<ExamResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("resumen")
  const [downloadingReport, setDownloadingReport] = useState(false)

  const downloadReport = async () => {
    if (!result) return
    setDownloadingReport(true)
    try {
      const response = await fetch(`/api/student/exams/result/${result.id}/certificate`, {
        method: "POST",
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Error al generar el reporte")
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `reporte-examen-${result.exam.title.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error("Error descargando reporte:", err)
      alert(err instanceof Error ? err.message : "Error al descargar el reporte.")
    } finally {
      setDownloadingReport(false)
    }
  }

  useEffect(() => {
    if (status === "loading") return

    if (!session || session.user?.role !== "student") {
      router.push("/")
      return
    }

    loadResult()
  }, [session, status, router])

  const loadResult = async () => {
    try {
      const resolvedParams = await params
      const response = await fetch(`/api/student/exams/result/${resolvedParams.resultId}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al cargar el resultado")
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError("Error al cargar el resultado del examen")
      console.error("Error loading result:", err)
    } finally {
      setLoading(false)
    }
  }

  const getNivelRendimiento = (puntaje: number) => {
    if (puntaje >= 90) return { nivel: "Excelente", color: "text-green-600", bg: "bg-green-100" }
    if (puntaje >= 80) return { nivel: "Bueno", color: "text-blue-600", bg: "bg-blue-100" }
    if (puntaje >= 70) return { nivel: "Aceptable", color: "text-yellow-600", bg: "bg-yellow-100" }
    return { nivel: "Necesita Mejora", color: "text-red-600", bg: "bg-red-100" }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando resultado...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || "No se pudo cargar el resultado"}</p>
            <Button onClick={() => router.push("/estudiante")} className="w-full">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const examCompetency = result.exam.competency?.displayName || "General"
  const feedbackReleased = result.feedbackReleased === true

  if (!feedbackReleased) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentHeader
          title={result.exam.title}
          subtitle={examCompetency}
          showBackButton={true}
          backUrl="/estudiante"
        />
        <div className="container mx-auto px-4 py-12 max-w-lg">
          <Card>
            <CardContent className="pt-10 pb-10 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-9 w-9 text-green-600" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">Prueba enviada</h1>
                <p className="text-gray-600">
                  Tu examen fue registrado correctamente el{" "}
                  {result.completedAt
                    ? new Date(result.completedAt).toLocaleString("es-CO", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : new Date().toLocaleString("es-CO")}
                  .
                </p>
              </div>
              <Alert className="text-left border-amber-200 bg-amber-50">
                <Lock className="h-4 w-4 text-amber-700" />
                <AlertDescription className="text-amber-900">
                  {result.feedbackMessage ||
                    getPendingSubmissionMessage(result.exam.closeDate)}
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                Hasta entonces no podrás ver el puntaje, estadísticas ni descargar el reporte.
              </p>
              <Button className="w-full" onClick={() => router.push("/estudiante")}>
                Volver al inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const score = result.score ?? 0
  const nivel = getNivelRendimiento(score)
  const analytics = result.analytics

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentHeader
        title={`Resultado: ${result.exam.title}`}
        subtitle={result.exam.competency?.displayName || "General"}
        showBackButton={true}
        backUrl="/estudiante"
      />

      <div className="bg-gradient-to-r from-[#73A2D3] to-[#C00102] text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Resultados del Examen</h1>
              <p className="text-lg opacity-90">{result.exam.title}</p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm opacity-90">
                <span>
                  Estudiante: {session?.user?.firstName} {session?.user?.lastName}
                </span>
                <span>
                  Fecha:{" "}
                  {result.completedAt
                    ? new Date(result.completedAt).toLocaleDateString("es-CO")
                    : new Date().toLocaleDateString("es-CO")}
                </span>
                <span>Duración: {result.timeTakenMinutes ?? 0} min</span>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-5xl font-bold mb-2">{score}%</div>
              <div className="text-lg">Puntaje General</div>
              <Badge className={`mt-2 ${nivel.bg} ${nivel.color}`}>{nivel.nivel}</Badge>
              {result.isPassed !== undefined && (
                <div className="mt-2 flex items-center justify-center md:justify-end gap-2 text-sm">
                  {result.isPassed ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Aprobado</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      <span>No aprobado</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="reporte">Reporte PDF</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {result.correctAnswers ?? 0}
                  </div>
                  <div className="text-sm text-gray-600">Respuestas Correctas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">
                    {result.incorrectAnswers ?? 0}
                  </div>
                  <div className="text-sm text-gray-600">Respuestas Incorrectas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {result.totalQuestions ?? 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Preguntas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">
                    {result.timeTakenMinutes ?? 0} min
                  </div>
                  <div className="text-sm text-gray-600">Tiempo Total</div>
                </CardContent>
              </Card>
            </div>

            {analytics ? (
              <ExamResultAnalytics
                score={score}
                correctAnswers={result.correctAnswers ?? 0}
                incorrectAnswers={result.incorrectAnswers ?? 0}
                attemptBreakdown={analytics.attemptBreakdown}
                radarComparison={analytics.radarComparison}
                weakTopics={analytics.weakTopics}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay datos analíticos disponibles para este resultado.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reporte" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Reporte del examen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Descarga un PDF con tu puntaje, estadísticas del intento y comparación de
                  desempeño por área (estudiante, colegio y plataforma).
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>Puntaje y resultado del examen</li>
                  <li>Gráfico de desempeño por competencias</li>
                  <li>Datos del estudiante y del colegio</li>
                </ul>
                <Button
                  className="bg-[#73A2D3] hover:bg-[#5a8bc4]"
                  disabled={downloadingReport || !result.reportAvailable}
                  onClick={downloadReport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloadingReport ? "Generando reporte..." : "Descargar reporte PDF"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
