/**
 * Política de retroalimentación sin campos nuevos en BD.
 * Usa closeDate del examen: mientras la ventana está abierta, feedback limitado.
 */

export function isExamFeedbackReleased(exam: {
  closeDate?: Date | string | null
}): boolean {
  if (!exam.closeDate) {
    // Exámenes sin fecha de cierre: comportamiento anterior (feedback inmediato)
    return true
  }
  return new Date() >= new Date(exam.closeDate)
}

export function getFeedbackStatusMessage(released: boolean, closeDate?: Date | string | null): string {
  if (released) {
    return 'La retroalimentación completa está disponible.'
  }
  const dateStr = closeDate
    ? new Date(closeDate).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
    : null
  return dateStr
    ? `Tu prueba fue enviada. La retroalimentación completa estará disponible cuando finalice el periodo de la prueba (${dateStr}) o cuando el docente cierre la evaluación.`
    : 'Tu prueba fue enviada. La retroalimentación completa estará disponible cuando el docente cierre la evaluación.'
}
