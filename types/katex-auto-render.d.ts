declare module 'katex/contrib/auto-render' {
  interface AutoRenderOptions {
    delimiters?: Array<{ left: string; right: string; display: boolean }>
    throwOnError?: boolean
    errorColor?: string
    macros?: Record<string, string>
    ignoredTags?: string[]
  }

  function renderMathInElement(element: HTMLElement, options?: AutoRenderOptions): void
  export default renderMathInElement
}

declare module 'katex/contrib/mhchem'
