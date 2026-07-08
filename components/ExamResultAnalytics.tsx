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
  AreaRadarData,
  BreakdownItem,
  ExamAttemptAnalytics,
} from "@/lib/examPerformanceAnalytics"
import { AlertTriangle, BarChart3, Target, TrendingUp } from "lucide-react"

type ExamResultAnalyticsProps = {
  score: number
  correctAnswers: number
  incorrectAnswers: number
  attemptBreakdown: ExamAttemptAnalytics
  radarComparison: AreaRadarData
  weakTopics: BreakdownItem[]
}

const PIE_COLORS = ["#22c55e", "#ef4444"]

function scoreForArea(scores: Array<{ id: string; score: number }>, areaId: string) {
  return scores.find((s) => s.id === areaId)?.score ?? 0
}

function buildRadarChartData(radar: AreaRadarData) {
  return radar.areas.map((area) => ({
    subject: area.displayName,
    "Este examen": scoreForArea(radar.attemptScores, area.id),
    Estudiante: scoreForArea(radar.studentScores, area.id),
    Colegio: scoreForArea(radar.schoolScores, area.id),
    Plataforma: scoreForArea(radar.platformScores, area.id),
  }))
}

function toBarData(items: BreakdownItem[], excludeUnclassified = true) {
  return items
    .filter((item) => (excludeUnclassified ? item.label !== "Sin clasificar" : true))
    .slice(0, 10)
    .map((item) => ({
      name: item.label.length > 22 ? `${item.label.slice(0, 20)}…` : item.label,
      fullName: item.label,
      acierto: item.percent,
    }))
}

function BreakdownBarCard({
  title,
  items,
  color,
}: {
  title: string
  items: BreakdownItem[]
  color: string
}) {
  const data = toBarData(items)
  if (data.length === 0) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [`${value}%`, "Acierto"]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ""}
              />
              <Bar dataKey="acierto" fill={color} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
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
              Desempeño por área (este examen)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attemptBreakdown.byArea.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={toBarData(attemptBreakdown.byArea, false)}
                    layout="vertical"
                    margin={{ left: 8, right: 16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, "Acierto"]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ""}
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
            Comparación por área ICFES
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
                    <Radar name="Este examen" dataKey="Este examen" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                    <Radar name="Tu promedio" dataKey="Estudiante" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    <Radar name="Colegio" dataKey="Colegio" stroke="#f97316" fill="#f97316" fillOpacity={0.12} />
                    <Radar name="Plataforma" dataKey="Plataforma" stroke="#10b981" fill="#10b981" fillOpacity={0.08} />
                    <Legend />
                    <Tooltip formatter={(value: any) => `${value}%`} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Área</th>
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
                El &quot;área&quot; es la materia ICFES (Matemáticas, Lectura Crítica, etc.). Los
                promedios históricos se calculan por exámenes presentados en cada área.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Aún no hay historial suficiente para la comparación.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BreakdownBarCard
          title="Desempeño por competencia (este examen)"
          items={attemptBreakdown.byCompetencia}
          color="#6366f1"
        />
        <BreakdownBarCard
          title="Desempeño por componente (este examen)"
          items={attemptBreakdown.byComponente}
          color="#0ea5e9"
        />
        <BreakdownBarCard
          title="Desempeño por tema (este examen)"
          items={attemptBreakdown.byTema}
          color="#f59e0b"
        />
        <BreakdownBarCard
          title="Desempeño por subtema (este examen)"
          items={attemptBreakdown.bySubtema}
          color="#ec4899"
        />
      </div>

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
              Temas y subtemas a reforzar
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
