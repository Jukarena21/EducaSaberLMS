import { useEffect, useState } from 'react'

/**
 * Retrasa la propagación de un valor hasta que deja de cambiar por `delayMs`.
 *
 * Pensado para campos de búsqueda que disparan peticiones al servidor: evita
 * una consulta por cada tecla y deja una sola cuando el usuario hace una pausa.
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timeout)
  }, [value, delayMs])

  return debounced
}
