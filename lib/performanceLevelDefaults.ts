/**
 * Niveles de desempeño por defecto (Saber 11 / estilo ICFES).
 * Se usan cuando no hay perfil en BD o como plantilla al crear perfiles.
 */
import { ICFES_AREA_SLUGS } from '@/lib/icfesAreas'

export type DefaultBand = {
  areaSlug: string
  label: string
  minScore: number
  maxScore: number
  description: string
  sortOrder: number
}

const STANDARD_LEVELS: Omit<DefaultBand, 'areaSlug'>[] = [
  {
    label: 'Insuficiente',
    minScore: 0,
    maxScore: 35,
    description:
      'Requiere reforzar habilidades básicas del área. Se recomienda repasar contenidos fundamentales y practicar con ejercicios guiados.',
    sortOrder: 1,
  },
  {
    label: 'Mínimo',
    minScore: 36,
    maxScore: 50,
    description:
      'Demuestra algunas habilidades del área, pero aún presenta dificultades importantes. Conviene trabajar temas específicos identificados en el reporte.',
    sortOrder: 2,
  },
  {
    label: 'Satisfactorio',
    minScore: 51,
    maxScore: 70,
    description:
      'Desarrolla las habilidades esperadas para este nivel. Puede consolidar fortalezas y atender los aspectos pendientes señalados en competencias y componentes.',
    sortOrder: 3,
  },
  {
    label: 'Avanzado',
    minScore: 71,
    maxScore: 100,
    description:
      'Demuestra un desempeño sólido en las habilidades del área. Se sugiere mantener la práctica y abordar retos de mayor complejidad.',
    sortOrder: 4,
  },
]

const ENGLISH_LEVELS: Omit<DefaultBand, 'areaSlug'>[] = [
  {
    label: 'A-',
    minScore: 0,
    maxScore: 36,
    description:
      'Nivel inicial. Puede comprender frases muy básicas y expresiones cotidianas con apoyo.',
    sortOrder: 1,
  },
  {
    label: 'A1',
    minScore: 37,
    maxScore: 44,
    description: 'Nivel elemental. Comprende expresiones familiares y frases sencillas.',
    sortOrder: 2,
  },
  {
    label: 'A2',
    minScore: 45,
    maxScore: 57,
    description:
      'Nivel preintermedio. Comprende oraciones y textos frecuentes sobre temas conocidos.',
    sortOrder: 3,
  },
  {
    label: 'B1',
    minScore: 58,
    maxScore: 70,
    description:
      'Comprende los puntos principales de textos claros sobre temas conocidos. Puede desenvolverse en situaciones de viaje y producir textos sencillos.',
    sortOrder: 4,
  },
  {
    label: 'B+',
    minScore: 71,
    maxScore: 100,
    description:
      'Nivel intermedio alto. Comprende textos más complejos y se expresa con mayor fluidez.',
    sortOrder: 5,
  },
]

export function getDefaultBandsForArea(areaSlug: string): DefaultBand[] {
  const levels = areaSlug === 'ingles' ? ENGLISH_LEVELS : STANDARD_LEVELS
  return levels.map((l) => ({ ...l, areaSlug }))
}

export function getAllDefaultBands(): DefaultBand[] {
  return ICFES_AREA_SLUGS.flatMap((slug) => getDefaultBandsForArea(slug))
}
