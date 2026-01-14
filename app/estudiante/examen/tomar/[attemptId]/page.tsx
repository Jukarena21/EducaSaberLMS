"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ExamInterface } from "@/components/ExamInterface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { StudentHeader } from "@/components/StudentHeader"
import { AlertCircle } from "lucide-react"
import { BrandLoading } from "@/components/BrandLoading"

interface ExamTakingPageProps {
  params: Promise<{ attemptId: string }>
}

export default function ExamTakingPage({ params }: ExamTakingPageProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [examData, setExamData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    
    if (!session || session.user?.role !== "student") {
      router.push("/")
      return
    }

    loadExamData()
  }, [session, status, router])

  const loadExamData = async () => {
    try {
      const resolvedParams = await params
      
      // Obtener datos del intento de examen
      const response = await fetch(`/api/student/exams/attempt/${resolvedParams.attemptId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.exam || !data.questions) {
        throw new Error('Datos del examen incompletos')
      }
      
      setExamData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar el examen'
      setError(errorMessage)
      console.error('Error loading exam data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return <BrandLoading message="Cargando examen..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/estudiante')} className="w-full">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!examData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Datos del examen no encontrados</p>
            <Button onClick={() => router.push('/estudiante')} className="w-full mt-4">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ExamInterface
      exam={examData.exam}
      questions={examData.questions}
      attemptId={examData.attemptId}
      startedAt={examData.startedAt}
      existingAnswers={examData.existingAnswers}
    />
  )
}
