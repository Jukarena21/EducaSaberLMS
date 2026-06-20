# Plan de acción — Mejoras preguntas y exámenes

Documento de seguimiento. **Restricción:** no se modificó el esquema Prisma; se reutilizan campos existentes (`closeDate`, `orderIndex`, `tema`, `subtema`, etc.).

---

## Fases y estado

| # | Requerimiento | Enfoque (sin migración BD) | Estado |
|---|---------------|----------------------------|--------|
| 1 | Formulario no cierra al clic fuera | `FormDialog` + `hideCloseButton` en `DialogContent` | ✅ Hecho |
| 2 | Navegación por áreas + numeración 1..N por área | `buildQuestionAreaNumberMaps` en UI (examen, simulacros, resultados) + pestañas rápidas en gestión de preguntas | ✅ Hecho |
| 3 | Bloqueo envío hasta responder todo | `ExamInterface` + validación en `POST .../submit` | ✅ Hecho |
| 4 | Retroalimentación diferida | `closeDate` del examen: mientras la ventana está abierta → solo incorrectas sin respuesta correcta/explicación | ✅ Hecho |
| 5 | Filtros y vista menos saturada en resultados | Filtros área/tema/subtema/estado + acordeón por área | ✅ Hecho |
| 6 | Plantilla cargue masivo | Excel con `lessonId`, `usage`, `orderInLesson` + auto `orderIndex` por lección | ✅ Hecho |

---

## Archivos principales tocados

- `components/FormDialog.tsx` — diálogo de formulario seguro
- `components/ui/dialog.tsx` — prop `hideCloseButton`
- `components/QuestionManagementNew.tsx`, `ManualSimulacroQuestionEditor.tsx`, `OtrosSimulacroQuestionEditor.tsx`
- `lib/examAnswerValidation.ts`, `lib/examFeedbackPolicy.ts`
- `components/ExamInterface.tsx`
- `app/api/student/exams/[attemptId]/submit/route.ts`
- `app/api/student/exams/result/[resultId]/route.ts`
- `app/estudiante/examen/resultado/[resultId]/page.tsx`
- `components/BulkImportCenter.tsx`, `app/api/bulk-import/route.ts`

---

## Cómo funciona la retroalimentación (punto 4)

- Si el examen **no tiene** `closeDate` → comportamiento anterior (feedback completo de inmediato).
- Si tiene `closeDate` y **aún no ha pasado** → el estudiante ve puntaje + **solo preguntas incorrectas** (su respuesta, sin clave ni explicación).
- Cuando **`now >= closeDate`** → feedback completo (correcta, explicación, enlace a lección).

**Para el admin:** cerrar la prueba = ajustar la **fecha de cierre** del examen al momento deseado (campo ya existente en formulario de examen).

---

## Mejoras propuestas para una siguiente iteración

1. **Campo dedicado `feedbackReleasedAt`** (requeriría migración) — cierre manual de retroalimentación **independiente** de `closeDate`.
2. **Confirmación “¿Descartar cambios?”** en formularios largos si hay texto sin guardar (`isDirty`).
3. **Pestañas por área en simulacros** (estilo tabs) además del selector actual.
4. **Renumerar `orderIndex` en BD por área** al mover preguntas entre áreas (hoy la numeración visual es en capa de presentación).
5. **Columnas `tema`/`subtema` en cargue masivo de simulacros manuales** (requiere flujo de import distinto al de `LessonQuestion`).
6. **Documentar en admin** un tooltip: “La retroalimentación completa se publica al llegar la fecha de cierre”.

---

## Verificación manual sugerida

1. Crear/editar pregunta → clic fuera del modal → no debe cerrarse.
2. Tomar examen multi-área → numeración reinicia por área en barra lateral.
3. Intentar enviar con preguntas vacías → botón deshabilitado + modal de pendientes.
4. Examen con `closeDate` futuro → tras enviar, solo incorrectas sin clave.
5. Tras pasar `closeDate` → recargar resultado → feedback completo.
6. Descargar plantilla preguntas → columnas `lessonId`, `usage`, `orderInLesson`.
