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
    return 'La retroalimentación y el reporte del examen están disponibles.'
  }
  const dateStr = closeDate
    ? new Date(closeDate).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
    : null
  return dateStr
    ? `Tu prueba fue enviada correctamente. Podrás ver tus resultados, la retroalimentación y descargar el reporte cuando finalice el periodo de la prueba (${dateStr}).`
    : 'Tu prueba fue enviada correctamente. Podrás ver tus resultados cuando el docente cierre la evaluación.'
}

export function getPendingSubmissionMessage(closeDate?: Date | string | null): string {
  const dateStr = closeDate
    ? new Date(closeDate).toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' })
    : null
  if (dateStr) {
    return `Los resultados estarán disponibles a partir del ${dateStr}.`
  }
  return 'Los resultados estarán disponibles cuando el docente cierre la evaluación.'
}
