/**
 * Utilidades isomórficas (cliente y servidor) para limpiar contenido de
 * preguntas/respuestas que llega "sucio" desde la base de datos.
 *
 * Problema típico: algunos textos se guardaron con HTML doble-escapado
 * (ej. "&lt;p&gt;Hola&lt;/p&gt;"), por lo que al renderizarlos como HTML
 * aparecen las etiquetas literales en lugar del texto formateado.
 */

const ENTITY_MAP: Record<string, string> = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&nbsp;': ' ',
  '&amp;': '&',
}

function decodeEntitiesOnce(input: string): string {
  let output = input
  // &amp; se decodifica al final para no re-introducir entidades ya resueltas.
  for (const [entity, char] of Object.entries(ENTITY_MAP)) {
    if (entity === '&amp;') continue
    output = output.split(entity).join(char)
  }
  output = output.split('&amp;').join('&')
  return output
}

/**
 * Detecta si el texto contiene etiquetas HTML escapadas (ej. "&lt;p&gt;")
 * y lo decodifica para que se pueda renderizar como HTML real.
 * Si el texto ya está limpio, lo devuelve sin cambios.
 */
export function decodeMaybeEscapedHtml(value?: string | null): string {
  if (!value || typeof value !== 'string') return ''

  let result = value
  let guard = 0
  // Repetir mientras se detecten etiquetas escapadas (cubre doble-escape).
  while (/&lt;\/?[a-zA-Z]|&amp;lt;|&amp;gt;/.test(result) && guard < 3) {
    result = decodeEntitiesOnce(result)
    guard += 1
  }

  return result
}

/**
 * Normaliza una URL de imagen. Devuelve undefined cuando la URL es inválida
 * o irrecuperable (ej. blob: temporales) para que la UI muestre un fallback.
 */
export function normalizeImageUrl(value?: string | null): string | undefined {
  if (!value || typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (trimmed === '') return undefined

  // Las blob: URLs son temporales del navegador y no se pueden recuperar.
  if (trimmed.startsWith('blob:')) return undefined

  if (/^(https?:|data:|\/)/i.test(trimmed)) return trimmed

  // Ruta relativa sin barra inicial: intentar servir desde la raíz pública.
  return `/${trimmed.replace(/^\.?\//, '')}`
}
