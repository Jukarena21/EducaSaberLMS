"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { StudentHeader } from "@/components/StudentHeader"
import {
  ExamResultDetailView,
  type ExamResultData,
} from "@/components/ExamResultDetailView"
import { CheckCircle, XCircle, Lock } from "lucide-react"
import { getPendingSubmissionMessage } from "@/lib/examFeedbackPolicy"

interface ExamResult extends ExamResultData {
  submissionSummary?: {
    totalQuestions: number
    correctAnswers: number
    incorrectAnswers: number
    answeredQuestions: number
    unansweredQuestions: number
    timeTakenMinutes?: number | null
    startedAt?: string | null
  }
}

export default function ExamResultPage({ params }: { params: Promise<{ resultId: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [result, setResult] = useState<ExamResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingReport, setDownloadingReport] = useState(false)

  const downloadReport = async () => {
    if (!result) return
    setDownloadingReport(true)
    try {
      const response = await fetch(`/api/student/exams/result/${result.id}/report`, {
        method: "POST",
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(
          [data.error, data.detail].filter(Boolean).join(": ") || "Error al generar el reporte"
        )
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

  const examArea = result.exam.area?.displayName || "General"
  const feedbackReleased = result.feedbackReleased === true
  const summary = result.submissionSummary

  if (!feedbackReleased) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentHeader
          title={result.exam.title}
          subtitle={examArea}
          showBackButton={true}
          backUrl="/estudiante"
        />
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <Card>
            <CardContent className="pt-10 pb-10 space-y-6">
              <div className="text-center space-y-4">
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
              </div>

              {summary && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                      <div className="text-3xl font-bold text-green-700">
                        {summary.correctAnswers}
                      </div>
                      <div className="text-xs font-medium text-green-800 mt-1">Correctas</div>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                      <div className="text-3xl font-bold text-red-700">
                        {summary.incorrectAnswers}
                      </div>
                      <div className="text-xs font-medium text-red-800 mt-1">Incorrectas</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                      <div className="text-3xl font-bold text-slate-700">
                        {summary.totalQuestions}
                      </div>
                      <div className="text-xs font-medium text-slate-700 mt-1">Preguntas</div>
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
                      <div className="text-3xl font-bold text-blue-700">
                        {summary.timeTakenMinutes ?? "—"}
                      </div>
                      <div className="text-xs font-medium text-blue-800 mt-1">Minutos</div>
                    </div>
                  </div>

                  {summary.unansweredQuestions > 0 && (
                    <p className="text-sm text-center text-muted-foreground">
                      Dejaste {summary.unansweredQuestions} pregunta
                      {summary.unansweredQuestions === 1 ? "" : "s"} sin responder.
                    </p>
                  )}
                </div>
              )}

              <Alert className="text-left border-amber-200 bg-amber-50">
                <Lock className="h-4 w-4 text-amber-700" />
                <AlertDescription className="text-amber-900">
                  {result.feedbackMessage || getPendingSubmissionMessage(result.exam.closeDate)}
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground text-center">
                Hasta entonces no podrás ver el puntaje, las respuestas ni descargar el reporte.
                Puedes volver a esta página cuando quieras desde tus exámenes presentados.
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

  const studentName = [
    (session?.user as any)?.firstName,
    (session?.user as any)?.lastName,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentHeader
        title={`Resultado: ${result.exam.title}`}
        subtitle={examArea}
        showBackButton={true}
        backUrl="/estudiante"
      />
      <ExamResultDetailView
        result={result}
        variant="student"
        personLabel={studentName || undefined}
        downloadingReport={downloadingReport}
        onDownloadReport={downloadReport}
        onStudyLesson={(courseId, lessonId) =>
          router.push(`/estudiante/cursos/${courseId}/leccion/${lessonId}`)
        }
      />
    </div>
  )
}
