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
    byCompetency: BreakdownItem[]
    byTema: BreakdownItem[]
    bySubtema: BreakdownItem[]
  }
  radarComparison: CompetencyRadarData
  weakTopics: BreakdownItem[]
}

const PIE_COLORS = ["#22c55e", "#ef4444"]

function scoreForCompetency(
  scores: Array<{ id: string; score: number }>,
  competencyId: string
) {
  return scores.find((s) => s.id === competencyId)?.score ?? 0
}

function buildRadarChartData(radar: CompetencyRadarData) {
  return radar.competencies.map((comp) => ({
    subject: comp.displayName,
    "Este examen": scoreForCompetency(radar.attemptScores, comp.id),
    Estudiante: scoreForCompetency(radar.studentScores, comp.id),
    Colegio: scoreForCompetency(radar.schoolScores, comp.id),
    Plataforma: scoreForCompetency(radar.platformScores, comp.id),
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
  const competencyBarData = attemptBreakdown.byCompetency.map((item) => ({
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

  const percentTooltip = (value: number | string | undefined) =>
    typeof value === "number" ? `${value}%` : `${value ?? 0}%`

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
                  <Tooltip formatter={(value: number) => [`${value}`, "Preguntas"]} />
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
              Desempeño por competencia (este examen)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {competencyBarData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={competencyBarData}
                    layout="vertical"
                    margin={{ left: 8, right: 16 }}
                  >
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
                No hay datos por competencia para este examen.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            Comparación por competencia ICFES
          </CardTitle>
        </CardHeader>
        <CardContent>
          {radarData.length > 0 ? (
            <>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="78%">
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Radar
                      name="Este examen"
                      dataKey="Este examen"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.2}
                    />
                    <Radar
                      name="Tu promedio"
                      dataKey="Estudiante"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                    />
                    <Radar
                      name="Colegio"
                      dataKey="Colegio"
                      stroke="#f97316"
                      fill="#f97316"
                      fillOpacity={0.12}
                    />
                    <Radar
                      name="Plataforma"
                      dataKey="Plataforma"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.08}
                    />
                    <Legend />
                    <Tooltip formatter={percentTooltip} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Competencia</th>
                      <th className="py-2 px-2 font-medium text-center">Este examen</th>
                      <th className="py-2 px-2 font-medium text-center">Tu promedio</th>
                      <th className="py-2 px-2 font-medium text-center">Colegio</th>
                      <th className="py-2 pl-2 font-medium text-center">Plataforma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {radarData.map((row) => (
                      <tr key={row.subject} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-medium">{row.subject}</td>
                        <td className="py-2 px-2 text-center">{row["Este examen"]}%</td>
                        <td className="py-2 px-2 text-center">{row.Estudiante}%</td>
                        <td className="py-2 px-2 text-center">{row.Colegio}%</td>
                        <td className="py-2 pl-2 text-center">{row.Plataforma}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-3">
                En el sistema, &quot;competencia&quot; corresponde al área ICFES (Matemáticas,
                Lectura Crítica, etc.). Los promedios históricos se calculan por exámenes
                presentados en cada competencia.
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
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={70}
                  />
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
            <CardTitle className="text-base">Detalle por competencia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {attemptBreakdown.byCompetency.map((item) => (
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
