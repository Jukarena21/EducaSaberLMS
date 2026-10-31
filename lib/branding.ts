import { z } from 'zod'

export const EDUCASABER_BRANDING_DEFAULTS = {
  logoUrl: '/logo-educasaber.png',
  themePrimary: '#8B5CF6',
  themeSecondary: '#10B981',
  themeAccent: '#F59E0B',
}

/** Los logos subidos se guardan como data URL en la base y viajan en cada carga de página. */
export const BRANDING_LOGO_MAX_BYTES = 500 * 1024

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

const PLACEHOLDER_LOGOS = ['https://example.com/logo.png']

export function isPlaceholderLogo(url?: string | null): boolean {
  if (!url) return false
  return PLACEHOLDER_LOGOS.includes(url) || url.includes('via.placeholder.com')
}

function isValidLogo(value: string): boolean {
  if (value.startsWith('/')) return true
  if (value.startsWith('data:image/')) return value.length <= BRANDING_LOGO_MAX_BYTES * 1.4
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

const optionalColor = z
  .string()
  .trim()
  .transform((value) => value || null)
  .refine((value) => value === null || HEX_COLOR.test(value), {
    message: 'Los colores deben tener el formato #RRGGBB',
  })
  .nullable()
  .optional()

export const brandingUpdateSchema = z.object({
  logoUrl: z
    .string()
    .trim()
    .transform((value) => value || null)
    .refine((value) => value === null || isValidLogo(value), {
      message: 'El logo debe ser una URL http(s) o una imagen subida de máximo 500 KB',
    })
    .nullable()
    .optional(),
  themePrimary: optionalColor,
  themeSecondary: optionalColor,
  themeAccent: optionalColor,
  schoolId: z.string().optional(),
})
