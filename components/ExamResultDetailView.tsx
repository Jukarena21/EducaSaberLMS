"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ExamResultAnalytics } from "@/components/ExamResultAnalytics"
import { SafeImage } from "@/components/SafeImage"
import { decodeMaybeEscapedHtml } from "@/lib/htmlContent"
import {
  CheckCircle,
  XCircle,
  Download,
  Target,
  Clock,
  ArrowRight,
  AlertCircle,
  Filter,
  FileText,
  Lock,
} from "lucide-react"
import type {
  AreaRadarData,
  BreakdownItem,
  ExamAttemptAnalytics,
} from "@/lib/examPerformanceAnalytics"

export interface ExamQuestionResult {
  id: string
  text: string
  questionImage?: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  optionAImage?: string
  optionBImage?: string
  optionCImage?: string
  optionDImage?: string
  userAnswer: string
  correctAnswer?: string
  isCorrect: boolean
  timeSpentSeconds?: number | null
  explanation?: string
  explanationImage?: string
  areaLabel?: string
  displayNumberInArea?: number
  competencia?: string | null
  componente?: string | null
  tema?: string | null
  subtema?: string | null
  lesson?: {
    id: string
    title: string
    courseId?: string
    courseTitle?: string
  } | null
}

export interface ExamResultData {
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
  releasedToStudent?: boolean
  student?: {
    id: string
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    schoolName?: string | null
  }
  exam: {
    id: string
    title: string
    description: string
    closeDate?: string | null
    area: {
      id?: string
      name?: string
      displayName?: string
    }
  }
  analytics?: {
    attemptBreakdown: ExamAttemptAnalytics
    radarComparison: AreaRadarData
    icfesGlobalScore?: number | null
    weakTopics: BreakdownItem[]
    performanceLevelsByArea?: Array<{
      areaLabel: string
      percent: number
      sharePercent: number
      level: { label: string; description: string } | null
    }>
    weakTopicsByArea?: Array<{ areaLabel: string; topics: BreakdownItem[] }>
  }
  questions?: ExamQuestionResult[]
}

const ALL = "all"

function getNivelRendimiento(puntaje: number) {
  if (puntaje >= 90) return { nivel: "Excelente", color: "text-green-600", bg: "bg-green-100" }
  if (puntaje >= 80) return { nivel: "Bueno", color: "text-blue-600", bg: "bg-blue-100" }
  if (puntaje >= 70) return { nivel: "Aceptable", color: "text-yellow-600", bg: "bg-yellow-100" }
  return { nivel: "Necesita Mejora", color: "text-red-600", bg: "bg-red-100" }
}

function formatTimeSpent(seconds?: number | null): string | null {
  if (seconds === null || seconds === undefined || seconds <= 0) return null
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest === 0 ? `${minutes}m` : `${minutes}m ${rest}s`
}

export interface ExamResultDetailViewProps {
  result: ExamResultData
  /** "student" muestra el enlace para estudiar la lección; "admin" identifica al estudiante */
  variant?: "student" | "admin"
  personLabel?: string
  downloadingReport?: boolean
  onDownloadReport?: () => void
  onStudyLesson?: (courseId: string, lessonId: string) => void
}

export function ExamResultDetailView({
  result,
  variant = "student",
  personLabel,
  downloadingReport = false,
  onDownloadReport,
  onStudyLesson,
}: ExamResultDetailViewProps) {
  const [activeTab, setActiveTab] = useState("resumen")
  const [filterArea, setFilterArea] = useState(ALL)
  const [filterCompetencia, setFilterCompetencia] = useState(ALL)
  const [filterComponente, setFilterComponente] = useState(ALL)
  const [filterTema, setFilterTema] = useState(ALL)
  const [filterSubtema, setFilterSubtema] = useState(ALL)
  const [filterStatus, setFilterStatus] = useState<"all" | "incorrect" | "correct">("all")

  const examArea = result.exam.area?.displayName || "General"
  const score = result.score ?? 0
  const nivel = getNivelRendimiento(score)
  const analytics = result.analytics
  const questions = result.questions || []

  const distinct = (getter: (q: ExamQuestionResult) => string | null | undefined) =>
    Array.from(
      new Set(
        questions
          .map((q) => getter(q))
          .filter((v): v is string => Boolean(v && String(v).trim()))
      )
    ).sort((a, b) => a.localeCompare(b, "es"))

  const areaOptions = distinct((q) => q.areaLabel)
  const competenciaOptions = distinct((q) => q.competencia)
  const componenteOptions = distinct((q) => q.componente)
  const temaOptions = distinct((q) => q.tema)
  const subtemaOptions = distinct((q) => q.subtema)

  const filteredQuestions = questions.filter((q) => {
    if (filterArea !== ALL && q.areaLabel !== filterArea) return false
    if (filterCompetencia !== ALL && q.competencia !== filterCompetencia) return false
    if (filterComponente !== ALL && q.componente !== filterComponente) return false
    if (filterTema !== ALL && q.tema !== filterTema) return false
    if (filterSubtema !== ALL && q.subtema !== filterSubtema) return false
    if (filterStatus === "incorrect" && q.isCorrect) return false
    if (filterStatus === "correct" && !q.isCorrect) return false
    return true
  })

  const groupedByArea = (() => {
    const groups = new Map<string, ExamQuestionResult[]>()
    filteredQuestions.forEach((q) => {
      const key = q.areaLabel || examArea
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(q)
    })
    return Array.from(groups.entries())
  })()

  const optionText = (q: ExamQuestionResult, option: string) => {
    switch (option) {
      case "A":
        return q.optionA
      case "B":
        return q.optionB
      case "C":
        return q.optionC
      case "D":
        return q.optionD
      default:
        return option
    }
  }
  const optionImage = (q: ExamQuestionResult, option: string) => {
    switch (option) {
      case "A":
        return q.optionAImage
      case "B":
        return q.optionBImage
      case "C":
        return q.optionCImage
      case "D":
        return q.optionDImage
      default:
        return undefined
    }
  }

  const isAdmin = variant === "admin"
  const answerLabel = isAdmin ? "Respuesta del estudiante:" : "Tu respuesta:"

  return (
    <>
      <div className="bg-gradient-to-r from-[#73A2D3] to-[#C00102] text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Resultados del Examen</h1>
              <p className="text-lg opacity-90">{result.exam.title}</p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm opacity-90">
                {personLabel && <span>Estudiante: {personLabel}</span>}
                {isAdmin && result.student?.schoolName && (
                  <span>Colegio: {result.student.schoolName}</span>
                )}
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
        {isAdmin && result.releasedToStudent === false && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <Lock className="h-4 w-4 text-amber-700" />
            <AlertDescription className="text-amber-900">
              El estudiante todavía no puede ver estos resultados. Se publican
              {result.exam.closeDate
                ? ` el ${new Date(result.exam.closeDate).toLocaleString("es-CO")}`
                : " cuando cierre el examen"}
              .
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="preguntas">Preguntas</TabsTrigger>
            <TabsTrigger value="reporte">Reporte PDF</TabsTrigger>
          </TabsList>

          <TabsContent value="resumen" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{score}%</div>
                  <div className="text-sm text-gray-600">Puntaje del intento</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">
                    {result.timeTakenMinutes ?? 0} min
                  </div>
                  <div className="text-sm text-gray-600">Tiempo total</div>
                </CardContent>
              </Card>
            </div>

            {analytics ? (
              <ExamResultAnalytics
                score={score}
                icfesGlobalScore={analytics.icfesGlobalScore}
                attemptBreakdown={analytics.attemptBreakdown}
                radarComparison={analytics.radarComparison}
                weakTopics={analytics.weakTopics}
                performanceLevelsByArea={analytics.performanceLevelsByArea}
                weakTopicsByArea={analytics.weakTopicsByArea}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay datos analíticos disponibles para este resultado.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="preguntas" className="space-y-6">
            {questions.length > 0 ? (
              <>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4 text-sm font-medium">
                      <Filter className="h-4 w-4" />
                      Filtrar preguntas
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <Select value={filterArea} onValueChange={setFilterArea}>
                        <SelectTrigger><SelectValue placeholder="Área" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>Todas las áreas</SelectItem>
                          {areaOptions.map((a) => (
                            <SelectItem key={a} value={a}>{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={filterCompetencia} onValueChange={setFilterCompetencia}>
                        <SelectTrigger><SelectValue placeholder="Competencia" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>Todas las competencias</SelectItem>
                          {competenciaOptions.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={filterComponente} onValueChange={setFilterComponente}>
                        <SelectTrigger><SelectValue placeholder="Componente" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>Todos los componentes</SelectItem>
                          {componenteOptions.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={filterTema} onValueChange={setFilterTema}>
                        <SelectTrigger><SelectValue placeholder="Tema" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>Todos los temas</SelectItem>
                          {temaOptions.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={filterSubtema} onValueChange={setFilterSubtema}>
                        <SelectTrigger><SelectValue placeholder="Subtema" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>Todos los subtemas</SelectItem>
                          {subtemaOptions.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
                        <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Correctas e incorrectas</SelectItem>
                          <SelectItem value="incorrect">Solo incorrectas</SelectItem>
                          <SelectItem value="correct">Solo correctas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Mostrando {filteredQuestions.length} de {questions.length} pregunta(s)
                    </p>
                  </CardContent>
                </Card>

                <Accordion
                  type="multiple"
                  defaultValue={groupedByArea.map(([area]) => area)}
                  className="space-y-2"
                >
                  {groupedByArea.map(([area, items]) => (
                    <AccordionItem key={area} value={area} className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <span className="font-medium">{area}</span>
                        <Badge variant="secondary" className="ml-2">{items.length}</Badge>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        {items.map((pregunta) => {
                          const hasOptionAnswer = ["A", "B", "C", "D"].includes(pregunta.userAnswer)
                          const userAnswerText = hasOptionAnswer
                            ? optionText(pregunta, pregunta.userAnswer)
                            : pregunta.userAnswer
                          const correctAnswerText = pregunta.correctAnswer
                            ? optionText(pregunta, pregunta.correctAnswer)
                            : ""
                          const userAnswerImage = hasOptionAnswer
                            ? optionImage(pregunta, pregunta.userAnswer)
                            : undefined
                          const correctAnswerImage = pregunta.correctAnswer
                            ? optionImage(pregunta, pregunta.correctAnswer)
                            : undefined
                          const timeSpent = formatTimeSpent(pregunta.timeSpentSeconds)

                          return (
                            <Card
                              key={pregunta.id}
                              className={`border-l-4 ${pregunta.isCorrect ? "border-l-green-500" : "border-l-red-500"}`}
                            >
                              <CardHeader>
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <Badge variant="outline">{pregunta.areaLabel || examArea}</Badge>
                                  {pregunta.competencia && <Badge variant="secondary">{pregunta.competencia}</Badge>}
                                  {pregunta.componente && <Badge variant="outline">{pregunta.componente}</Badge>}
                                  {pregunta.tema && <Badge variant="secondary">{pregunta.tema}</Badge>}
                                  {pregunta.subtema && <Badge variant="outline">{pregunta.subtema}</Badge>}
                                  {pregunta.isCorrect ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-red-500" />
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <CardTitle className="text-lg">
                                    Pregunta {pregunta.displayNumberInArea ?? "—"}
                                  </CardTitle>
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <span className="font-medium">Marcó:</span>
                                      {hasOptionAnswer ? (
                                        <Badge
                                          variant="outline"
                                          className={
                                            pregunta.isCorrect
                                              ? "border-green-300 text-green-700"
                                              : "border-red-300 text-red-700"
                                          }
                                        >
                                          {pregunta.userAnswer}
                                        </Badge>
                                      ) : (
                                        <span className="italic">Sin responder</span>
                                      )}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3.5 w-3.5" />
                                      {timeSpent ?? "Sin registro"}
                                    </span>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                {pregunta.questionImage && (
                                  <div className="flex justify-center">
                                    <SafeImage
                                      src={pregunta.questionImage}
                                      alt="Imagen de la pregunta"
                                      className="max-w-full h-auto max-h-64 object-contain rounded-lg border"
                                    />
                                  </div>
                                )}
                                <div
                                  className="text-gray-700 prose max-w-none"
                                  dangerouslySetInnerHTML={{ __html: decodeMaybeEscapedHtml(pregunta.text) }}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-sm font-medium text-gray-600">{answerLabel}</span>
                                    <div
                                      className={`mt-1 p-3 rounded ${pregunta.isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
                                    >
                                      {hasOptionAnswer && (
                                        <div className="font-semibold mb-1">Opción {pregunta.userAnswer}</div>
                                      )}
                                      <div dangerouslySetInnerHTML={{ __html: decodeMaybeEscapedHtml(userAnswerText) }} />
                                      {userAnswerImage && (
                                        <div className="mt-2">
                                          <SafeImage
                                            src={userAnswerImage}
                                            alt="Imagen de la respuesta"
                                            className="max-w-full h-auto max-h-40 object-contain rounded"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {pregunta.correctAnswer && (
                                    <div>
                                      <span className="text-sm font-medium text-gray-600">Respuesta correcta:</span>
                                      <div className="mt-1 p-3 rounded bg-green-50 text-green-800">
                                        <div className="font-semibold mb-1">Opción {pregunta.correctAnswer}</div>
                                        <div dangerouslySetInnerHTML={{ __html: decodeMaybeEscapedHtml(correctAnswerText) }} />
                                        {correctAnswerImage && (
                                          <div className="mt-2">
                                            <SafeImage
                                              src={correctAnswerImage}
                                              alt="Imagen de la respuesta correcta"
                                              className="max-w-full h-auto max-h-40 object-contain rounded"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {pregunta.explanation && pregunta.explanation !== "Sin explicación disponible" && (
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-800 mb-2">Explicación:</h4>
                                    <div
                                      className="text-blue-700 text-sm prose max-w-none"
                                      dangerouslySetInnerHTML={{ __html: decodeMaybeEscapedHtml(pregunta.explanation) }}
                                    />
                                    {pregunta.explanationImage && (
                                      <div className="mt-2">
                                        <SafeImage
                                          src={pregunta.explanationImage}
                                          alt="Imagen de explicación"
                                          className="max-w-full h-auto max-h-52 object-contain rounded"
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}

                                {!isAdmin && !pregunta.isCorrect && pregunta.lesson && (
                                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h4 className="font-semibold text-yellow-800 mb-1">¿Necesitas repasar este tema?</h4>
                                        <p className="text-yellow-700 text-sm">Accede al material de estudio relacionado</p>
                                        {pregunta.lesson.courseTitle && (
                                          <p className="text-yellow-600 text-xs mt-1">
                                            {pregunta.lesson.courseTitle} - {pregunta.lesson.title}
                                          </p>
                                        )}
                                      </div>
                                      {pregunta.lesson.courseId && pregunta.lesson.id && onStudyLesson && (
                                        <Button
                                          size="sm"
                                          className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                          onClick={() =>
                                            onStudyLesson(pregunta.lesson!.courseId!, pregunta.lesson!.id)
                                          }
                                        >
                                          Estudiar Tema
                                          <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {isAdmin && pregunta.lesson?.courseTitle && (
                                  <p className="text-xs text-muted-foreground">
                                    Lección asociada: {pregunta.lesson.courseTitle} — {pregunta.lesson.title}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay preguntas para mostrar en este resultado.
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
                  Descarga un PDF con {isAdmin ? "el" : "tu"} puntaje, estadísticas del intento y
                  desglose por área, competencia, componente, tema y subtema.
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>Puntaje y resultado del examen</li>
                  <li>Desempeño por área ICFES y niveles alcanzados</li>
                  <li>Desglose por competencia, componente, tema y subtema</li>
                </ul>
                <Button
                  className="bg-[#73A2D3] hover:bg-[#5a8bc4]"
                  disabled={downloadingReport || !result.reportAvailable || !onDownloadReport}
                  onClick={onDownloadReport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloadingReport ? "Generando reporte..." : "Descargar reporte PDF"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
