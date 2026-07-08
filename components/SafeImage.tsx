'use client'

import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { normalizeImageUrl } from '@/lib/htmlContent'

interface SafeImageProps {
  src?: string | null
  alt?: string
  className?: string
  style?: React.CSSProperties
  fallbackLabel?: string
}

/**
 * Imagen robusta: normaliza la URL y, si no existe o falla la carga,
 * muestra un placeholder en lugar del ícono de imagen rota.
 */
export function SafeImage({
  src,
  alt = '',
  className,
  style,
  fallbackLabel = 'Imagen no disponible',
}: SafeImageProps) {
  const url = normalizeImageUrl(src)
  const [errored, setErrored] = useState(false)

  if (!url || errored) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-400 p-4 text-xs"
        style={style}
      >
        <ImageOff className="h-5 w-5" />
        <span>{fallbackLabel}</span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  )
}
