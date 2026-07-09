/**
 * Taxonomía ICFES Saber 11: Área → Componentes (hasta 4) → Competencias (hasta 3 por componente).
 * Incluye opción "Otro" para texto libre.
 *
 * Fuente: marcos de referencia ICFES + reportes de referencia del cliente.
 * Editable en código por ahora; futuro: catálogo en BD por año escolar.
 */
import { ICFES_AREA_SLUGS } from '@/lib/icfesAreas'

export const OTRO_OPTION = 'Otro'

export type IcfesComponentDef = {
  name: string
  competencias: string[]
}

export type IcfesAreaTaxonomy = {
  areaSlug: string
  components: IcfesComponentDef[]
}

/** Competencias transversales cuando el área solo tiene una competencia global */
export const ICFES_AREA_TAXONOMY: IcfesAreaTaxonomy[] = [
  {
    areaSlug: 'lectura_critica',
    components: [
      {
        name: 'Comprensión e interpretación de textos',
        competencias: ['Competencia interpretativa', 'Competencia argumentativa', 'Competencia propositiva'],
      },
      {
        name: 'Reflexión sobre el contenido del texto',
        competencias: ['Comunicativa-Lectora', OTRO_OPTION],
      },
      {
        name: 'Uso eficiente del lenguaje',
        competencias: [OTRO_OPTION],
      },
      {
        name: 'Identificación de contenidos locales',
        competencias: [OTRO_OPTION],
      },
    ],
  },
  {
    areaSlug: 'razonamiento_cuantitativo',
    components: [
      {
        name: 'Álgebra y cálculo',
        competencias: [
          'Competencia de planteamiento y resolución de problemas',
          'Competencia de razonamiento y argumentación',
          'Competencia de comunicación, representación y modelación',
        ],
      },
      { name: 'Geometría y medida', competencias: [OTRO_OPTION] },
      { name: 'Estadística', competencias: [OTRO_OPTION] },
      { name: 'Probabilidad', competencias: [OTRO_OPTION] },
    ],
  },
  {
    areaSlug: 'competencias_ciudadanas',
    components: [
      {
        name: 'Competencias ciudadanas',
        competencias: ['Competencias Ciudadanas', OTRO_OPTION],
      },
      { name: 'Contextos sociales y políticos', competencias: [OTRO_OPTION] },
      { name: 'Perspectivas y argumentación', competencias: [OTRO_OPTION] },
      { name: 'Organizaciones sociales', competencias: [OTRO_OPTION] },
    ],
  },
  {
    areaSlug: 'comunicacion_escrita',
    components: [
      {
        name: 'Biología',
        competencias: ['Explicación de fenómenos', 'Uso comprensivo del conocimiento científico', 'Indagar'],
      },
      { name: 'Física', competencias: [OTRO_OPTION] },
      { name: 'Química', competencias: [OTRO_OPTION] },
      { name: 'Ciencia, tecnología y sociedad', competencias: [OTRO_OPTION] },
    ],
  },
  {
    areaSlug: 'ingles',
    components: [
      {
        name: 'Comprensión de lectura',
        competencias: ['Comunicativa', OTRO_OPTION],
      },
      { name: 'Uso del lenguaje', competencias: [OTRO_OPTION] },
      { name: 'Comprensión auditiva', competencias: [OTRO_OPTION] },
      { name: 'Interacción comunicativa', competencias: [OTRO_OPTION] },
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
  return [...tax.components.map((c) => c.name), OTRO_OPTION]
}

export function getCompetenciasForComponent(
  areaSlug?: string | null,
  componentName?: string | null
): string[] {
  const tax = getTaxonomyForAreaSlug(areaSlug)
  if (!tax || !componentName) return [OTRO_OPTION]
  const comp = tax.components.find((c) => c.name === componentName)
  if (!comp) return [OTRO_OPTION]
  const list = [...comp.competencias]
  if (!list.includes(OTRO_OPTION)) list.push(OTRO_OPTION)
  return list
}

/** Todas las competencias posibles de un área (aplanado, sin duplicados) */
export function getAllCompetenciasForArea(areaSlug?: string | null): string[] {
  const tax = getTaxonomyForAreaSlug(areaSlug)
  if (!tax) return [OTRO_OPTION]
  const set = new Set<string>()
  tax.components.forEach((c) => c.competencias.forEach((comp) => set.add(comp)))
  set.add(OTRO_OPTION)
  return Array.from(set)
}

export function isValidIcfesAreaSlug(slug: string): boolean {
  return ICFES_AREA_SLUGS.includes(slug.toLowerCase())
}
