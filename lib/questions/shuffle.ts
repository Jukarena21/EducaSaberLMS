/**
 * Barajado determinista para las opciones de una pregunta.
 *
 * Usa una semilla derivada del identificador de la pregunta en lugar de
 * Math.random para que el orden sea siempre el mismo: si cambiara entre
 * renders, las opciones saltarían al navegar y la vista de resultados no
 * coincidiría con lo que el estudiante vio al responder.
 */

function hashSeed(seed: string): number {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createRandom(seed: string): () => number {
  let state = hashSeed(seed) || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return state / 0xffffffff
  }
}

/** Fisher-Yates con semilla: mismo `seed` produce siempre el mismo orden. */
export function seededShuffle<T>(items: T[], seed: string): T[] {
  const result = [...items]
  const random = createRandom(seed)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
