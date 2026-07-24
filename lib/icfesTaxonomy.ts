/**
 * Taxonomía ICFES Saber 11 por área: competencias y componentes oficiales.
 * Listas independientes por área; al crear preguntas se seleccionan de aquí.
 * Incluye opción "Otro" para texto libre.
 */
import { ICFES_AREA_SLUGS } from '@/lib/icfesAreas'

export const OTRO_OPTION = 'Otro'

export type IcfesAreaTaxonomy = {
  areaSlug: string
  competencias: string[]
  componentes: string[]
}

export const ICFES_AREA_TAXONOMY: IcfesAreaTaxonomy[] = [
  {
    areaSlug: 'razonamiento_cuantitativo',
    competencias: [
      'Interpretación y representación',
      'Formulación y ejecución',
      'Argumentación',
    ],
    componentes: ['Estadística', 'Geometría', 'Álgebra y cálculo'],
  },
  {
    areaSlug: 'lectura_critica',
    competencias: ['Lectora'],
    componentes: [
      'Identificar y ubicar información local.',
      'Relacionar e interpretar información para dar sentido global.',
      'Evaluar y reflexionar sobre la forma y el contenido de los textos.',
    ],
  },
  {
    areaSlug: 'comunicacion_escrita',
    competencias: [
      'Explicación de fenómenos',
      'Uso comprensivo del conocimiento científico',
      'Indagación',
    ],
    componentes: [
      'Biológico',
      'Físico',
      'Químico',
      'Ciencia, Tecnología y Sociedad (CTS)',
    ],
  },
  {
    areaSlug: 'competencias_ciudadanas',
    competencias: [
      'Pensamiento social',
      'Interpretación y análisis de perspectivas',
      'Pensamiento reflexivo y sistémico',
    ],
    componentes: [
      'Capacidad para identificar y usar conceptos básicos de las ciencias sociales.',
      'Capacidad para identificar dimensiones temporales y espaciales de eventos y problemáticas sociales.',
      'Reconocimiento de diversas opiniones, posturas e intereses.',
      'Análisis crítico de fuentes y argumentos.',
      'Identificar modelos conceptuales que orientan decisiones sociales.',
      'Establecer relaciones entre dimensiones presentes en una situación problemática y sus posibles alternativas de solución.',
    ],
  },
  {
    areaSlug: 'ingles',
    competencias: ['Lingüística'],
    componentes: [
      'Conocimiento lexical (T1)',
      'Conocimiento pragmático (T2)',
      'Conocimiento comunicativo (T3)',
      'Conocimiento gramatical (T4)',
      'Comprensión de lectura literal (T5)',
      'Comprensión de lectura inferencial (T6)',
      'Conocimiento gramatical y lexical (T7)',
    ],
  },
]

export function getTaxonomyForAreaSlug(areaSlug?: string | null): IcfesAreaTaxonomy | undefined {
  if (!areaSlug) return undefined
  const normalized = areaSlug.toLowerCase()
  return ICFES_AREA_TAXONOMY.find((t) => t.areaSlug === normalized)
}

export function getComponentsForArea(areaSlug?: string | null): string[] {
  const tax = getTaxonomyForAreaSlug(areaSlug)
  if (!tax) return [OTRO_OPTION]
  return [...tax.componentes, OTRO_OPTION]
}

export function getCompetenciasForArea(areaSlug?: string | null): string[] {
  const tax = getTaxonomyForAreaSlug(areaSlug)
  if (!tax) return [OTRO_OPTION]
  return [...tax.competencias, OTRO_OPTION]
}

/** @deprecated Usar getCompetenciasForArea; las competencias ya no dependen del componente. */
export function getCompetenciasForComponent(
  areaSlug?: string | null,
  _componentName?: string | null
): string[] {
  return getCompetenciasForArea(areaSlug)
}

export function getAllCompetenciasForArea(areaSlug?: string | null): string[] {
  return getCompetenciasForArea(areaSlug)
}

export function isValidIcfesAreaSlug(slug: string): boolean {
  return ICFES_AREA_SLUGS.includes(slug.toLowerCase())
}
