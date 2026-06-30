"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import type {
  BreakdownItem,
  CompetencyRadarData,
} from "@/lib/examPerformanceAnalytics"
import { AlertTriangle, BarChart3, Target, TrendingUp } from "lucide-react"

type ExamResultAnalyticsProps = {
  score: number
  correctAnswers: number
  incorrectAnswers: number
  attemptBreakdown: {
    byArea: BreakdownItem[]
    byTema: BreakdownItem[]
    bySubtema: BreakdownItem[]
  }
  radarComparison: CompetencyRadarData
  weakTopics: BreakdownItem[]
}

const PIE_COLORS = ["#22c55e", "#ef4444"]

function buildRadarChartData(radar: CompetencyRadarData) {
  return radar.competencies.map((comp) => ({
    subject: comp.displayName,
    Estudiante:
      radar.studentScores.find((s) => s.id === comp.id)?.score ?? 0,
    Colegio: radar.schoolScores.find((s) => s.id === comp.id)?.score ?? 0,
    Plataforma:
      radar.platformScores.find((s) => s.id === comp.id)?.score ?? 0,
  }))
}

export function ExamResultAnalytics({
  score,
  correctAnswers,
  incorrectAnswers,
  attemptBreakdown,
  radarComparison,
  weakTopics,
}: ExamResultAnalyticsProps) {
  const radarData = buildRadarChartData(radarComparison)
  const areaBarData = attemptBreakdown.byArea.map((item) => ({
    name: item.label.length > 18 ? `${item.label.slice(0, 16)}…` : item.label,
    fullName: item.label,
    acierto: item.percent,
    correctas: item.correct,
    total: item.total,
  }))

  const temaBarData = attemptBreakdown.byTema
    .filter((item) => item.label !== "Sin clasificar")
    .slice(0, 8)
    .map((item) => ({
      name: item.label.length > 22 ? `${item.label.slice(0, 20)}…` : item.label,
      fullName: item.label,
      acierto: item.percent,
    }))

  const pieData = [
    { name: "Correctas", value: correctAnswers },
    { name: "Incorrectas", value: incorrectAnswers },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Distribución de respuestas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Obtuviste {score}% en este intento ({correctAnswers} de{" "}
              {correctAnswers + incorrectAnswers} preguntas).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Desempeño por área en este examen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {areaBarData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={areaBarData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, "Acierto"]}
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.fullName || ""
                      }
                    />
                    <Bar dataKey="acierto" fill="#73A2D3" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No hay datos por área para este examen.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Comparación histórica por competencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          {radarData.length > 0 ? (
            <>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Estudiante"
                      dataKey="Estudiante"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.25}
                    />
                    <Radar
                      name="Colegio"
                      dataKey="Colegio"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.15}
                    />
                    <Radar
                      name="Plataforma"
                      dataKey="Plataforma"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.1}
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Promedios acumulados de tus exámenes frente al colegio y la plataforma.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Aún no hay historial suficiente para la comparación.
            </p>
          )}
        </CardContent>
      </Card>

      {temaBarData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Desempeño por tema (este examen)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={temaBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, "Acierto"]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.fullName || ""
                    }
                  />
                  <Bar dataKey="acierto" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalle por área</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {attemptBreakdown.byArea.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{item.label}</span>
                  <span>
                    {item.correct}/{item.total} ({item.percent}%)
                  </span>
                </div>
                <Progress value={item.percent} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Temas a reforzar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weakTopics.length > 0 ? (
              <ul className="space-y-3">
                {weakTopics.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between rounded-lg border p-3 bg-amber-50/50"
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                    <Badge variant="outline" className="text-amber-800 border-amber-300">
                      {item.percent}% acierto
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No se detectaron temas críticos en este intento. ¡Buen trabajo!
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              Por política del examen, no mostramos el enunciado ni las respuestas individuales.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
