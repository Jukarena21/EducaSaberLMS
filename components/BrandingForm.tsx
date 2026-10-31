"use client"

import React, { useEffect, useRef, useState } from "react"
import { SCHOOL_BRANDING_UPDATED_EVENT } from "@/hooks/useSchoolBranding"
import { BRANDING_LOGO_MAX_BYTES, EDUCASABER_BRANDING_DEFAULTS } from "@/lib/branding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, X } from "lucide-react"

interface BrandingFormProps {
  schoolId?: string
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]

function colorOrDefault(value: string, fallback: string) {
  return HEX_COLOR.test(value) ? value : fallback
}

export default function BrandingForm({ schoolId }: BrandingFormProps) {
  const [loading, setLoading] = useState(true)
  const [logoUrl, setLogoUrl] = useState<string>("")
  const [themePrimary, setThemePrimary] = useState<string>("")
  const [themeSecondary, setThemeSecondary] = useState<string>("")
  const [themeAccent, setThemeAccent] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [logoError, setLogoError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Se leen los valores guardados tal cual, sin los de la plataforma: si el
  // formulario arrancara con ellos, al guardar quedarían escritos en el colegio
  useEffect(() => {
    if (!schoolId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    setSuccess(null)
    fetch(`/api/schools/branding-simple?schoolId=${schoolId}&raw=1`)
      .then(async (res) => {
        if (!res.ok) throw new Error("No se pudo cargar el branding actual")
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setLogoUrl(data.logoUrl || "")
        setThemePrimary(data.themePrimary || "")
        setThemeSecondary(data.themeSecondary || "")
        setThemeAccent(data.themeAccent || "")
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Error desconocido")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [schoolId])

  useEffect(() => {
    setLogoError(false)
  }, [logoUrl])

  function handleLogoFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setError(null)

    if (!LOGO_TYPES.includes(file.type)) {
      setError("El logo debe ser PNG, JPG, WebP o SVG")
      return
    }
    if (file.size > BRANDING_LOGO_MAX_BYTES) {
      setError("El logo debe pesar máximo 500 KB. Prueba con una versión más liviana o en WebP.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") setLogoUrl(reader.result)
    }
    reader.onerror = () => setError("No se pudo leer el archivo del logo")
    reader.readAsDataURL(file)
  }

  function resetToDefaults() {
    setLogoUrl("")
    setThemePrimary("")
    setThemeSecondary("")
    setThemeAccent("")
    setSuccess(null)
    setError(null)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!schoolId) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/schools/branding-simple", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          logoUrl,
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
      window.dispatchEvent(
        new CustomEvent(SCHOOL_BRANDING_UPDATED_EVENT, { detail: { schoolId } })
      )
    } catch (err: any) {
      setError(err?.message || "Error desconocido")
    } finally {
      setSaving(false)
    }
  }

  if (!schoolId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-gray-500">
          Tu usuario no tiene un colegio asignado, así que no hay branding que configurar.
        </CardContent>
      </Card>
    )
  }

  const preview = {
    logoUrl: logoUrl || EDUCASABER_BRANDING_DEFAULTS.logoUrl,
    themePrimary: colorOrDefault(themePrimary, EDUCASABER_BRANDING_DEFAULTS.themePrimary),
    themeSecondary: colorOrDefault(themeSecondary, EDUCASABER_BRANDING_DEFAULTS.themeSecondary),
    themeAccent: colorOrDefault(themeAccent, EDUCASABER_BRANDING_DEFAULTS.themeAccent),
  }

  const headerGradient = `linear-gradient(120deg,
    ${preview.themePrimary} 0%,
    ${preview.themeSecondary} 45%,
    ${preview.themeAccent} 100%)`

  const tabsBarGradient = `linear-gradient(120deg,
    ${preview.themePrimary} 0%,
    ${preview.themeSecondary} 100%)`

  const colorFields = [
    {
      id: "themePrimary",
      label: "Color Primario",
      help: "Usado en encabezados y botones principales.",
      value: themePrimary,
      setValue: setThemePrimary,
      fallback: EDUCASABER_BRANDING_DEFAULTS.themePrimary,
    },
    {
      id: "themeSecondary",
      label: "Color Secundario",
      help: "Usado en textos y elementos secundarios.",
      value: themeSecondary,
      setValue: setThemeSecondary,
      fallback: EDUCASABER_BRANDING_DEFAULTS.themeSecondary,
    },
    {
      id: "themeAccent",
      label: "Color de Acento",
      help: "Usado en alertas y elementos que queremos resaltar.",
      value: themeAccent,
      setValue: setThemeAccent,
      fallback: EDUCASABER_BRANDING_DEFAULTS.themeAccent,
    },
  ]

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
            {loading ? (
              <p className="text-sm text-gray-500">Cargando branding actual...</p>
            ) : (
              <form onSubmit={onSubmit} className="space-y-6">
                {/* Logo */}
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo de la Institución</Label>
                  <div className="flex gap-2">
                    <Input
                      id="logoUrl"
                      placeholder="https://ejemplo.com/logo.png"
                      value={logoUrl.startsWith("data:") ? "Imagen subida desde tu equipo" : logoUrl}
                      readOnly={logoUrl.startsWith("data:")}
                      onChange={(e) => setLogoUrl(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </Button>
                    {logoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setLogoUrl("")}
                        title="Quitar logo"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={LOGO_TYPES.join(",")}
                    className="hidden"
                    onChange={handleLogoFile}
                  />
                  <p className="text-xs text-gray-500">
                    Sube una imagen (PNG, JPG, WebP o SVG, máximo 500 KB) o pega una URL pública.
                    Sin logo se usa el de EducaSaber.
                  </p>
                  {logoUrl && (
                    <div className="mt-2 p-2 border rounded bg-gray-50">
                      <p className="text-xs text-gray-600 mb-2">Vista previa del logo:</p>
                      {logoError ? (
                        <p className="text-xs text-red-500 text-center">
                          No se pudo cargar la imagen. Revisa que la URL sea pública y apunte
                          directamente a la imagen.
                        </p>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logoUrl}
                          alt="Vista previa del logo"
                          className="h-12 w-auto object-contain mx-auto"
                          onError={() => setLogoError(true)}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Colores */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Paleta de Colores</h3>
                  <p className="text-sm text-gray-600">
                    Selecciona los colores que representen a tu institución. Los campos vacíos
                    usan los colores de EducaSaber.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {colorFields.map((field) => {
                      const invalid = field.value !== "" && !HEX_COLOR.test(field.value)
                      return (
                        <div key={field.id} className="space-y-3">
                          <Label htmlFor={field.id}>{field.label}</Label>
                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              id={field.id}
                              value={colorOrDefault(field.value, field.fallback)}
                              onChange={(e) => field.setValue(e.target.value)}
                              className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                            />
                            <div className="flex-1">
                              <Input
                                value={field.value}
                                onChange={(e) => field.setValue(e.target.value.trim())}
                                placeholder={field.fallback}
                                className={`font-mono text-sm ${invalid ? "border-red-400" : ""}`}
                              />
                            </div>
                          </div>
                          <p className={`text-xs ${invalid ? "text-red-500" : "text-gray-500"}`}>
                            {invalid ? "Usa el formato #RRGGBB, por ejemplo #1E40AF." : field.help}
                          </p>
                        </div>
                      )
                    })}
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

                <div className="flex justify-between gap-2">
                  <Button type="button" variant="outline" onClick={resetToDefaults}>
                    Usar valores de EducaSaber
                  </Button>
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
                  <img
                    src={preview.logoUrl}
                    alt="Logo colegio"
                    className="h-10 w-10 object-contain"
                  />
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
                  style={{ background: preview.themePrimary }}
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
                  style={{ background: preview.themeAccent }}
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
