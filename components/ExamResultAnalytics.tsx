"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from "recharts"
import type {
  AreaHierarchyNode,
  AreaRadarData,
  BreakdownItem,
  ExamAttemptAnalytics,
} from "@/lib/examPerformanceAnalytics"
import { AlertTriangle, BarChart3, ChevronRight, Target, TrendingUp } from "lucide-react"

type ExamResultAnalyticsProps = {
  score: number
  icfesGlobalScore?: number | null
  attemptBreakdown: ExamAttemptAnalytics
  radarComparison: AreaRadarData
  weakTopics: BreakdownItem[]
  performanceLevelsByArea?: Array<{
    areaLabel: string
    percent: number
    sharePercent: number
    level: { label: string; description: string } | null
  }>
  weakTopicsByArea?: Array<{ areaLabel: string; topics: BreakdownItem[] }>
}

function scoreForArea(scores: Array<{ id: string; score: number }>, areaId: string) {
  return scores.find((s) => s.id === areaId)?.score ?? 0
}

function buildRadarChartData(radar: AreaRadarData) {
  return radar.areas.map((area) => ({
    subject: area.displayName,
    "Este examen": scoreForArea(radar.attemptScores, area.id),
    "Tu promedio": scoreForArea(radar.studentScores, area.id),
    Colegio: scoreForArea(radar.schoolScores, area.id),
  }))
}

function StatsBadge({
  percent,
  correct,
  total,
}: {
  percent: number
  correct: number
  total: number
}) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <Badge variant="outline">{percent}% acierto</Badge>
      <span className="text-xs text-muted-foreground">
        {correct}/{total}
      </span>
    </div>
  )
}

function ComponenteList({ items }: { items: BreakdownItem[] }) {
  const visible = items.filter((c) => c.label !== "Sin clasificar" || c.total > 0)
  if (visible.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2 pl-4">
        Sin componentes clasificados en esta competencia.
      </p>
    )
  }
  return (
    <ul className="space-y-2 pl-4 border-l-2 border-indigo-100">
      {visible.map((item) => (
        <li key={item.label} className="rounded-lg border bg-slate-50/80 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-sm font-medium">{item.label}</span>
            <StatsBadge percent={item.percent} correct={item.correct} total={item.total} />
          </div>
          <Progress value={item.percent} className="h-1.5" />
        </li>
      ))}
    </ul>
  )
}

function AreaDrillDown({ areas }: { areas: AreaHierarchyNode[] }) {
  const [selectedArea, setSelectedArea] = useState<string | undefined>(
    areas.length === 1 ? areas[0].areaSlug : undefined
  )
  const [selectedCompetencia, setSelectedCompetencia] = useState<string | undefined>()

  if (areas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No hay datos por área para este examen.
      </p>
    )
  }

  const activeArea = areas.find((a) => a.areaSlug === selectedArea)
  const activeCompetencia = activeArea?.competencias.find((c) => c.label === selectedCompetencia)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          1. Selecciona un área
        </p>
        <div className="flex flex-wrap gap-2">
          {areas.map((area) => (
            <button
              key={area.areaSlug}
              type="button"
              onClick={() => {
                setSelectedArea(area.areaSlug)
                setSelectedCompetencia(undefined)
              }}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors text-left ${
                selectedArea === area.areaSlug
                  ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                  : "hover:bg-muted/60"
              }`}
            >
              <span className="font-medium block">{area.areaLabel}</span>
              <span className="text-xs text-muted-foreground">
                {area.percent}% · {area.correct}/{area.total}
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeArea && activeArea.competencias.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            2. Competencias en {activeArea.areaLabel}
          </p>
          <Accordion
            type="single"
            collapsible
            value={selectedCompetencia}
            onValueChange={setSelectedCompetencia}
            className="rounded-lg border px-3"
          >
            {activeArea.competencias.map((comp) => (
              <AccordionItem key={comp.label} value={comp.label}>
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex flex-1 flex-wrap items-center justify-between gap-2 pr-2 text-left">
                    <span className="font-medium text-sm">{comp.label}</span>
                    <StatsBadge percent={comp.percent} correct={comp.correct} total={comp.total} />
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />
                    Componentes
                  </p>
                  <ComponenteList items={comp.componentes} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {activeArea && activeArea.competencias.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay competencias clasificadas para {activeArea.areaLabel}.
        </p>
      )}

      {activeCompetencia && activeCompetencia.componentes.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Esta competencia no tiene componentes clasificados.
        </p>
      )}
    </div>
  )
}

export function ExamResultAnalytics({
  score,
  icfesGlobalScore = null,
  attemptBreakdown,
  radarComparison,
  weakTopics,
  performanceLevelsByArea = [],
  weakTopicsByArea = [],
}: ExamResultAnalyticsProps) {
  const radarData = buildRadarChartData(radarComparison)

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-indigo-200">
        <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-800 text-white px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Resultado del examen</p>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-5xl font-bold">{score}</span>
                <span className="text-xl text-indigo-100">/ 100 pts</span>
              </div>
              <p className="text-indigo-100/90 text-sm mt-1">Calificación porcentual del intento</p>
            </div>
            {icfesGlobalScore != null && (
              <div className="rounded-xl bg-white/10 backdrop-blur px-5 py-4 border border-white/20">
                <p className="text-indigo-100 text-xs uppercase tracking-wide">Puntaje ICFES estimado</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-bold">{icfesGlobalScore}</span>
                  <span className="text-indigo-100">/ 500</span>
                </div>
                <p className="text-indigo-100/80 text-xs mt-1 max-w-xs">
                  Ponderación Saber 11 según las áreas presentes en esta prueba
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {performanceLevelsByArea.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600" />
              Nivel de desempeño por área
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {performanceLevelsByArea.map((row) => (
              <div key={row.areaLabel} className="border rounded-lg p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="font-medium">{row.areaLabel}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{row.percent}/100 pts</Badge>
                    {row.level && (
                      <Badge className="bg-indigo-100 text-indigo-800">{row.level.label}</Badge>
                    )}
                  </div>
                </div>
                <Progress value={row.percent} className="h-2 mb-2" />
                {row.level?.description && (
                  <p className="text-sm text-muted-foreground">{row.level.description}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
                      tickFormatter={(v) => `${v}`}
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
                      dataKey="Tu promedio"
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
                    <Legend />
                    <Tooltip formatter={(value: number) => [`${value}/100`, "Puntaje"]} />
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
                      <th className="py-2 pl-2 font-medium text-center">Colegio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {radarData.map((row) => (
                      <tr key={row.subject} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-medium">{row.subject}</td>
                        <td className="py-2 px-2 text-center">{row["Este examen"]}/100</td>
                        <td className="py-2 px-2 text-center">{row["Tu promedio"]}/100</td>
                        <td className="py-2 pl-2 text-center">{row.Colegio}/100</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-3">
                Solo se muestran las áreas evaluadas en este examen. Escala 0–100 por área.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Aún no hay historial suficiente para la comparación.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            Detalle por área
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AreaDrillDown areas={attemptBreakdown.areaHierarchy} />
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
          {weakTopicsByArea.length > 0 ? (
            <div className="space-y-4">
              {weakTopicsByArea.map((group) => (
                <div key={group.areaLabel}>
                  <p className="font-medium text-sm mb-2">{group.areaLabel}</p>
                  <ul className="space-y-2">
                    {group.topics.map((item) => (
                      <li
                        key={`${group.areaLabel}-${item.label}`}
                        className="flex items-center justify-between rounded-lg border p-2 bg-amber-50/50 text-sm"
                      >
                        <span>{item.label}</span>
                        <Badge variant="outline" className="text-amber-800 border-amber-300">
                          {item.percent}% · {item.correct}/{item.total}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : weakTopics.length > 0 ? (
            <ul className="space-y-3">
              {weakTopics.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border p-3 bg-amber-50/50"
                >
                  <span className="text-sm font-medium">{item.label}</span>
                  <Badge variant="outline" className="text-amber-800 border-amber-300">
                    {item.percent}% · {item.correct}/{item.total}
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
  )
}
