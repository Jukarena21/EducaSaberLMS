"use client"

import React, { useEffect, useState } from "react"
import { useSchoolBranding, SchoolBranding } from "@/hooks/useSchoolBranding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface BrandingFormProps {
  schoolId?: string
}

export default function BrandingForm({ schoolId }: BrandingFormProps) {
  const { branding, refresh, loading } = useSchoolBranding(schoolId)
  const [initialized, setInitialized] = useState(false)

  const [logoUrl, setLogoUrl] = useState<string>("")
  const [themePrimary, setThemePrimary] = useState<string>("")
  const [themeSecondary, setThemeSecondary] = useState<string>("")
  const [themeAccent, setThemeAccent] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Cargar valores actuales desde la DB cuando entra a la pestaña
  useEffect(() => {
    if (branding && !initialized) {
      setLogoUrl(branding.logoUrl || "")
      setThemePrimary(branding.themePrimary || "")
      setThemeSecondary(branding.themeSecondary || "")
      setThemeAccent(branding.themeAccent || "")
      setInitialized(true)
    }
  }, [branding, initialized])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/schools/branding-simple", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoUrl: logoUrl || undefined,
          themePrimary,
          themeSecondary,
          themeAccent,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "No se pudo guardar el branding")
      }
      setSuccess("Branding actualizado correctamente")
      await refresh()
    } catch (err: any) {
      setError(err?.message || "Error desconocido")
    } finally {
      setSaving(false)
    }
  }

  // Construir branding de vista previa sin tocar el CSS global
  const buildPreviewBranding = (): SchoolBranding => ({
    logoUrl: logoUrl || branding?.logoUrl || null,
    themePrimary: themePrimary || branding?.themePrimary || "#3B82F6",
    themeSecondary: themeSecondary || branding?.themeSecondary || "#6B7280",
    themeAccent: themeAccent || branding?.themeAccent || "#EF4444",
  })

  const preview = buildPreviewBranding()

  const headerGradient = `linear-gradient(120deg,
    ${preview.themePrimary || "#3B82F6"} 0%,
    ${preview.themeSecondary || "#6B7280"} 45%,
    ${preview.themeAccent || "#EF4444"} 100%)`

  const tabsBarGradient = `linear-gradient(120deg,
    ${preview.themePrimary || "#3B82F6"} 0%,
    ${preview.themeSecondary || "#6B7280"} 100%)`

  const primaryBg = preview.themePrimary || "#3B82F6"
  const accentBg = preview.themeAccent || "#EF4444"

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Columna izquierda: formulario */}
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Branding del Colegio</CardTitle>
            <CardDescription>
              Configura cómo se verá la plataforma para tus estudiantes y docentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !initialized ? (
              <p className="text-sm text-gray-500">Cargando branding actual...</p>
            ) : (
              <form onSubmit={onSubmit} className="space-y-6">
                {/* Logo */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo de la Institución</Label>
                    <Input
                      id="logoUrl"
                      placeholder="https://ejemplo.com/logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      URL pública del logo (PNG/SVG recomendado). Se mostrará en el encabezado de la
                      plataforma.
                    </p>
                    {(logoUrl || branding?.logoUrl) && (
                      <div className="mt-2 p-2 border rounded bg-gray-50">
                        <p className="text-xs text-gray-600 mb-2">Vista previa rápida del logo:</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logoUrl || branding?.logoUrl || ""}
                          alt="Vista previa del logo"
                          className="h-12 w-auto object-contain mx-auto"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                            const errorMsg = e.currentTarget.nextElementSibling as HTMLElement | null
                            if (errorMsg) errorMsg.classList.remove("hidden")
                          }}
                        />
                        <p className="hidden text-xs text-red-500 text-center mt-1">
                          Error al cargar la imagen
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Colores */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Paleta de Colores</h3>
                  <p className="text-sm text-gray-600">
                    Selecciona los colores que representen a tu institución. Los usaremos en fondos,
                    botones y secciones clave para tu colegio.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Primario */}
                    <div className="space-y-3">
                      <Label htmlFor="themePrimary">Color Primario</Label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          id="themePrimary"
                          value={themePrimary || branding?.themePrimary || "#3B82F6"}
                          onChange={(e) => setThemePrimary(e.target.value)}
                          className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                        />
                        <div className="flex-1">
                          <Input
                            value={themePrimary}
                            onChange={(e) => setThemePrimary(e.target.value)}
                            placeholder={branding?.themePrimary || "#3B82F6"}
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Usado en encabezados y botones principales.
                      </p>
                    </div>

                    {/* Secundario */}
                    <div className="space-y-3">
                      <Label htmlFor="themeSecondary">Color Secundario</Label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          id="themeSecondary"
                          value={themeSecondary || branding?.themeSecondary || "#6B7280"}
                          onChange={(e) => setThemeSecondary(e.target.value)}
                          className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                        />
                        <div className="flex-1">
                          <Input
                            value={themeSecondary}
                            onChange={(e) => setThemeSecondary(e.target.value)}
                            placeholder={branding?.themeSecondary || "#6B7280"}
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Usado en textos y elementos secundarios.
                      </p>
                    </div>

                    {/* Acento */}
                    <div className="space-y-3">
                      <Label htmlFor="themeAccent">Color de Acento</Label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          id="themeAccent"
                          value={themeAccent || branding?.themeAccent || "#EF4444"}
                          onChange={(e) => setThemeAccent(e.target.value)}
                          className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                        />
                        <div className="flex-1">
                          <Input
                            value={themeAccent}
                            onChange={(e) => setThemeAccent(e.target.value)}
                            placeholder={branding?.themeAccent || "#EF4444"}
                            className="font-mono text-sm"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Usado en alertas y elementos que queremos resaltar.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mensajes */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-600">
                    {success}
                  </div>
                )}

                {/* Botón */}
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving} className="min-w-[140px]">
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Columna derecha: vista previa contextual */}
        <Card className="flex-1 bg-slate-50/60 border-slate-200">
          <CardHeader>
            <CardTitle>Vista previa para tus estudiantes</CardTitle>
            <CardDescription>
              Así se verá aproximadamente el dashboard del estudiante con estos colores y logo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Header simulado */}
            <div
              className="rounded-2xl p-4 mb-2 text-white shadow-md flex items-center justify-between"
              style={{ background: headerGradient }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/90 rounded-xl p-2 flex items-center justify-center shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {preview.logoUrl ? (
                    <img
                      src={preview.logoUrl}
                      alt="Logo colegio"
                      className="h-10 w-10 object-contain"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-gray-200" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold">Nombre del Colegio</p>
                  <p className="text-xs text-white/80">Portal del Estudiante</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-white/90 text-xs text-gray-800">
                Estudiante
              </Badge>
            </div>

            {/* Barra de pestañas simulada */}
            <div className="rounded-2xl p-3 bg-white shadow-sm border border-gray-100">
              <div
                className="rounded-full p-1 flex items-center gap-1"
                style={{ background: tabsBarGradient }}
              >
                {["Inicio", "Cursos", "Exámenes", "Progreso", "Logros"].map((tab, idx) => (
                  <div
                    key={tab}
                    className={`px-3 py-1.5 text-xs md:text-[0.7rem] rounded-full cursor-default ${
                      idx === 0 ? "bg-white text-gray-900 shadow-sm" : "text-white/80"
                    }`}
                  >
                    {tab}
                  </div>
                ))}
              </div>

              {/* Tarjetas de ejemplo */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                  className="rounded-xl p-3 text-xs text-white shadow-sm"
                  style={{ background: primaryBg }}
                >
                  <p className="font-semibold text-sm mb-1">Cursos Activos</p>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-white/80 mt-1">Resumen de cursos inscritos</p>
                </div>
                <div className="rounded-xl p-3 text-xs border border-gray-200 bg-white">
                  <p className="font-semibold text-slate-800 mb-1 text-sm">Exámenes Completados</p>
                  <p className="text-2xl font-bold text-slate-900">8</p>
                  <p className="text-slate-500 mt-1">Historial de evaluaciones</p>
                </div>
                <div
                  className="rounded-xl p-3 text-xs text-white shadow-sm"
                  style={{ background: accentBg }}
                >
                  <p className="font-semibold text-sm mb-1">Aviso Importante</p>
                  <p className="text-xs text-white/90">
                    Los mensajes de alerta usarán este color de acento.
                  </p>
                </div>
              </div>

              <p className="mt-4 text-[0.7rem] text-gray-500">
                Esta vista es solo una aproximación. El diseño final se adapta automáticamente a
                diferentes tamaños de pantalla y se integra con el contenido real de tus cursos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


