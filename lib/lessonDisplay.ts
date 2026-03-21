import type { LessonData } from '@/types/lesson'

/** Etiqueta de área: prioriza el área de la lección y luego la del curso vía módulo. */
export function getLessonAreaLabel(lesson: LessonData): string {
  return (
    lesson.competency?.displayName ||
    lesson.competency?.name ||
    lesson.modules[0]?.competency?.displayName ||
    lesson.modules[0]?.competency?.name ||
    'Sin área'
  )
}

/** Devuelve URL de embed de YouTube si aplica, o null. */
export function getYoutubeEmbedUrl(url: string | undefined | null): string | null {
  if (!url?.trim()) return null
  const m = url.trim().match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}
