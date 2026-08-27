"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ExamResultDetailView,
  type ExamResultData,
} from "@/components/ExamResultDetailView"
import { XCircle, ArrowLeft } from "lucide-react"

export default function AdminExamResultPage({
  params,
}: {
  params: Promise<{ resultId: string }>
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [result, setResult] = useState<ExamResultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingReport, setDownloadingReport] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    const role = session?.user?.role
    if (!session || (role !== "teacher_admin" && role !== "school_admin")) {
      router.push("/")
      return
    }
    loadResult()
  }, [session, status, router])

  const loadResult = async () => {
    try {
      const resolvedParams = await params
      const response = await fetch(`/api/admin/exams/result/${resolvedParams.resultId}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al cargar el resultado")
      }
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el resultado del examen")
      console.error("Error loading result:", err)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async () => {
    if (!result) return
    setDownloadingReport(true)
    try {
      const response = await fetch(`/api/admin/exams/result/${result.id}/report`, {
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
      const slug = [result.student?.firstName, result.student?.lastName]
        .filter(Boolean)
        .join("-")
        .replace(/\s+/g, "-")
        .toLowerCase()
      a.download = `reporte-${slug || "estudiante"}-${result.exam.title
        .replace(/\s+/g, "-")
        .toLowerCase()}.pdf`
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
            <Button onClick={() => router.push("/admin")} className="w-full">
              Volver al panel
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const studentName = [result.student?.firstName, result.student?.lastName]
    .filter(Boolean)
    .join(" ")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {studentName || "Estudiante"}
            </p>
            <p className="text-xs text-muted-foreground">{result.student?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push("/admin")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Panel de administración
          </Button>
        </div>
      </div>

      <ExamResultDetailView
        result={result}
        variant="admin"
        personLabel={studentName || undefined}
        downloadingReport={downloadingReport}
        onDownloadReport={downloadReport}
      />
    </div>
  )
}
