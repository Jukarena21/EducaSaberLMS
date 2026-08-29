'use client';

import { useEffect, useRef } from 'react';
import renderMathInElement from 'katex/contrib/auto-render';
import 'katex/dist/katex.min.css';
import 'katex/contrib/mhchem';

interface LessonContentViewerProps {
  content: string;
  className?: string;
}

/**
 * Renderiza HTML de teoría y convierte las fórmulas `$...$` / `$$...$$`
 * (y `\ce{...}` de química vía mhchem) en KaTeX.
 */
export function LessonContentViewer({ content, className = '' }: LessonContentViewerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    try {
      renderMathInElement(element, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
        ],
        throwOnError: false,
      })
    } catch (error) {
      console.warn('No se pudo renderizar una fórmula:', error)
    }
  }, [content])

  return (
    <div
      ref={ref}
      className={`prose prose-lg max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
