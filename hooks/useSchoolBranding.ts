"use client"
import { useEffect, useState, useCallback } from 'react'

export interface SchoolBranding {
  logoUrl?: string | null
  themePrimary?: string | null
  themeSecondary?: string | null
  themeAccent?: string | null
}

export const SCHOOL_BRANDING_UPDATED_EVENT = 'school-branding-updated'

export function useSchoolBranding(schoolId?: string) {
  // Inicializar desde localStorage si existe para evitar parpadeo
  const getCachedBranding = (): SchoolBranding | null => {
    if (typeof window === 'undefined' || !schoolId) return null
    try {
      const cached = localStorage.getItem(`school-branding-${schoolId}`)
      if (cached) {
        const parsed = JSON.parse(cached)
        // Verificar que el cache no sea muy viejo (1 hora)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 3600000) {
          return parsed.branding
        }
      }
    } catch (e) {
      console.error('Error reading cached branding:', e)
    }
    return null
  }

  const [branding, setBranding] = useState<SchoolBranding | null>(getCachedBranding())
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const hexToHsl = (hex: string) => {
    // Convertir hex a RGB
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
  }

  const applyBrandingToCSS = useCallback((input: SchoolBranding) => {
    if (typeof document === 'undefined') return
    const root = document.documentElement

    // Un valor que no sea #RRGGBB produciría NaN en las variables y dejaría
    // los botones sin color, así que se trata como si no estuviera definido
    const validHex = (value?: string | null) =>
      value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : null
    const b: SchoolBranding = {
      ...input,
      themePrimary: validHex(input.themePrimary),
      themeSecondary: validHex(input.themeSecondary),
      themeAccent: validHex(input.themeAccent),
    }

    // Con un primario claro (amarillo, por ejemplo) el texto blanco de los
    // botones dejaría de leerse
    const primaryForeground = (hex?: string | null) => {
      if (!hex) return '0 0% 98%'
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const bl = parseInt(hex.slice(5, 7), 16)
      const luminance = (0.299 * r + 0.587 * g + 0.114 * bl) / 255
      return luminance > 0.62 ? '0 0% 9%' : '0 0% 98%'
    }
    root.style.setProperty('--primary-foreground', primaryForeground(b.themePrimary))
    
    // Valores por defecto de EducaSaber (en HSL)
    const EDUCASABER_DEFAULTS = {
      primary: '262 83% 58%',
      secondary: '158 64% 52%',
      accent: '38 92% 50%'
    }
    
    // Si no hay colores definidos, usar valores por defecto de EducaSaber
    if (!b.themePrimary && !b.themeSecondary && !b.themeAccent) {
      root.style.setProperty('--school-primary', EDUCASABER_DEFAULTS.primary)
      root.style.setProperty('--school-secondary', EDUCASABER_DEFAULTS.secondary)
      root.style.setProperty('--school-accent', EDUCASABER_DEFAULTS.accent)
      root.style.setProperty('--primary', EDUCASABER_DEFAULTS.primary)
      root.style.setProperty('--secondary', EDUCASABER_DEFAULTS.secondary)
      root.style.setProperty('--accent', EDUCASABER_DEFAULTS.accent)
      return
    }

    if (b.themePrimary) {
      const hsl = hexToHsl(b.themePrimary)
      root.style.setProperty('--school-primary', hsl)
      // También actualizar el primary principal para botones principales
      root.style.setProperty('--primary', hsl)
    } else {
      // Si no hay themePrimary, usar el por defecto
      root.style.setProperty('--school-primary', EDUCASABER_DEFAULTS.primary)
      root.style.setProperty('--primary', EDUCASABER_DEFAULTS.primary)
    }
    
    if (b.themeSecondary) {
      const hsl = hexToHsl(b.themeSecondary)
      root.style.setProperty('--school-secondary', hsl)
      // También actualizar el secondary principal
      root.style.setProperty('--secondary', hsl)
    } else {
      // Si no hay themeSecondary, usar el por defecto
      root.style.setProperty('--school-secondary', EDUCASABER_DEFAULTS.secondary)
      root.style.setProperty('--secondary', EDUCASABER_DEFAULTS.secondary)
    }
    
    if (b.themeAccent) {
      const hsl = hexToHsl(b.themeAccent)
      root.style.setProperty('--school-accent', hsl)
      // También actualizar el accent principal
      root.style.setProperty('--accent', hsl)
    } else {
      // Si no hay themeAccent, usar el por defecto
      root.style.setProperty('--school-accent', EDUCASABER_DEFAULTS.accent)
      root.style.setProperty('--accent', EDUCASABER_DEFAULTS.accent)
    }
  }, [])

  const fetchBranding = useCallback(async () => {
    // Solo aplicar branding si el usuario tiene un colegio asignado.
    // Si no hay colegio (por ejemplo, admin general), restablecer colores por defecto.
    if (!schoolId) {
      setBranding(null)
      setLoading(false)
      // Resetear variables CSS a los valores por defecto definidos en globals.css
      applyBrandingToCSS({})
      return
    }

    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/schools/branding-simple?schoolId=${schoolId}`)
      if (!res.ok) throw new Error('Error al cargar branding')
      const data = (await res.json()) as SchoolBranding
      setBranding(data)
      applyBrandingToCSS(data)
      
      // Cachear en localStorage para evitar parpadeo en navegación
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`school-branding-${schoolId}`, JSON.stringify({
            branding: data,
            timestamp: Date.now()
          }))
        } catch (e) {
          console.error('Error caching branding:', e)
        }
      }
    } catch (e: any) {
      console.error('Error fetching branding:', e)
      setError(e?.message || 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [applyBrandingToCSS, schoolId])

  useEffect(() => {
    fetchBranding()
  }, [fetchBranding])

  // El formulario de branding avisa al guardar para que el encabezado y los
  // colores se actualicen sin recargar la página
  useEffect(() => {
    if (typeof window === 'undefined' || !schoolId) return
    const onUpdated = (event: Event) => {
      const updatedId = (event as CustomEvent<{ schoolId?: string }>).detail?.schoolId
      if (updatedId === schoolId) fetchBranding()
    }
    window.addEventListener(SCHOOL_BRANDING_UPDATED_EVENT, onUpdated)
    return () => window.removeEventListener(SCHOOL_BRANDING_UPDATED_EVENT, onUpdated)
  }, [fetchBranding, schoolId])

  return { branding, loading, error, refresh: fetchBranding }
}


