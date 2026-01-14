# 🔍 Diagnóstico: Simulacros Manuales No Aparecen en Dashboard del Estudiante

## ✅ Verificaciones Realizadas

### 1. **Filtro de Preguntas**
- ✅ Agregado filtro para excluir exámenes sin preguntas
- ✅ Verificación en queries de Prisma: `examQuestions: { some: {} }`

### 2. **Verificación de Asignaciones**
- ✅ Verifica asignaciones directas (`ExamAssignment`)
- ✅ Verifica asignaciones por colegio (`ExamSchool`)
- ✅ Filtra por `isActive: true`
- ✅ Filtra por `isPublished: true`

### 3. **Logs de Depuración**
- ✅ Agregados logs en desarrollo para debugging

## 🔍 Posibles Causas del Problema

### Causa 1: El examen no está publicado
**Solución:** Verificar que `isPublished: true` en el simulacro

### Causa 2: El examen no tiene preguntas
**Solución:** Asegurarse de que el simulacro tenga al menos una pregunta

### Causa 3: La asignación no está activa
**Solución:** Verificar que `isActive: true` en la asignación

### Causa 4: Fechas bloqueando el acceso
**Solución:** Verificar que las fechas `openDate` y `closeDate` permitan acceso

### Causa 5: Filtro por año escolar
**Solución:** Si asignaste por colegio, verificar que el año escolar del estudiante coincida

## 🛠️ Pasos para Diagnosticar

1. **Verificar en la consola del navegador (F12):**
   - Buscar logs que empiecen con `[Student Exams Debug]`
   - Verificar cuántos exámenes se encontraron

2. **Verificar en la base de datos:**
   ```sql
   -- Verificar que el examen esté publicado
   SELECT id, title, isPublished, isManualSimulacro 
   FROM Exam 
   WHERE isManualSimulacro = true;
   
   -- Verificar asignaciones directas
   SELECT ea.*, e.title, e.isPublished 
   FROM ExamAssignment ea
   JOIN Exam e ON e.id = ea.examId
   WHERE ea.userId = 'ID_DEL_ESTUDIANTE';
   
   -- Verificar que tenga preguntas
   SELECT COUNT(*) as total 
   FROM ExamQuestion 
   WHERE examId = 'ID_DEL_EXAMEN';
   ```

3. **Verificar en el código:**
   - El examen debe tener `isPublished: true`
   - El examen debe tener al menos una pregunta
   - La asignación debe tener `isActive: true`

## 📝 Checklist de Verificación

- [ ] El simulacro está publicado (`isPublished: true`)
- [ ] El simulacro tiene al menos una pregunta
- [ ] La asignación está activa (`isActive: true`)
- [ ] Si asignaste por colegio, el año escolar coincide
- [ ] Las fechas no están bloqueando el acceso
- [ ] El estudiante tiene el rol correcto (`role: 'student'`)

## 🔧 Cambios Realizados

1. ✅ Agregado filtro para excluir exámenes sin preguntas
2. ✅ Agregados logs de depuración en desarrollo
3. ✅ Verificación de que el examen tenga preguntas en las queries

