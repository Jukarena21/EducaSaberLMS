# 📝 Explicación: Cómo Funcionan los Exámenes

## 🎯 Resumen General

El sistema de exámenes permite crear, asignar y calificar exámenes para estudiantes. Los exámenes pueden ser de diferentes tipos (ICFES, por competencia, por módulo, etc.) y se generan automáticamente a partir de preguntas existentes en las lecciones.

---

## 📊 Estructura de Datos

### Modelos Principales:

1. **`Exam`** - El examen en sí
   - Información básica: título, descripción, tipo
   - Configuración: tiempo límite, puntaje de aprobación, dificultad
   - Fechas: `openDate`, `closeDate`
   - Estado: `isPublished`, `isIcfesExam`
   - Relaciones: `courseId`, `competencyId`, `createdById`
   - Configuración de módulos: `includedModules` (JSON con array de IDs)
   - Configuración de preguntas: `questionsPerModule`, `totalQuestions`

2. **`ExamQuestion`** - Preguntas del examen
   - Contenido: `questionText`, `questionImage`, opciones (A, B, C, D)
   - Respuesta correcta: `correctOption`
   - Metadatos: `difficultyLevel`, `points`, `orderIndex`
   - Relación: `lessonId` (de qué lección viene)

3. **`ExamResult`** - Resultado de un estudiante
   - Puntuación: `score`, `correctAnswers`, `incorrectAnswers`
   - Tiempo: `startedAt`, `completedAt`, `timeTakenMinutes`
   - Estado: `isPassed`
   - Métricas anti-trampa: `fraudRiskScore`, `averageTimePerQuestion`

4. **`ExamQuestionAnswer`** - Respuesta individual del estudiante
   - Respuesta: `selectedOption`, `answerText`
   - Resultado: `isCorrect`
   - Tiempo: `timeSpentSeconds`

---

## 🔄 Flujo Completo del Examen

### **FASE 1: Creación del Examen (Admin)**

1. **Admin crea el examen** (`POST /api/exams`)
   - Completa el formulario con:
     - Título, descripción
     - Tipo de examen (`simulacro_completo`, `por_competencia`, `por_modulo`, `personalizado`, `diagnostico`)
     - Asociación a curso o competencia
     - Tiempo límite, puntaje de aprobación
     - Fechas de apertura/cierre
     - Módulos incluidos (para exámenes personalizados)
     - Número de preguntas por módulo

2. **El examen se crea sin preguntas inicialmente**
   - Solo se guarda la configuración
   - `totalQuestions` puede estar vacío al inicio

3. **Generación automática de preguntas** (`POST /api/exams/[id]/generate-questions`)
   - El admin puede hacer clic en "Generar Preguntas"
   - El sistema:
     - Busca todas las preguntas de las lecciones de los módulos incluidos
     - Filtra preguntas elegibles:
       - Solo preguntas con `usage = 'exam'` o `usage = 'both'`
       - Si es examen ICFES: solo preguntas tipo `multiple_choice`
     - Selecciona aleatoriamente `questionsPerModule` preguntas por módulo
     - Crea registros `ExamQuestion` copiando el contenido de las preguntas originales
     - Actualiza `totalQuestions` del examen

**Nota importante:** Las preguntas se **copian** al examen, no se referencian. Esto permite que:
- El examen mantenga las preguntas originales aunque se modifiquen las lecciones
- Cada examen tenga su propio conjunto de preguntas

---

### **FASE 2: Publicación y Disponibilidad**

1. **Admin publica el examen**
   - Cambia `isPublished = true`
   - Opcionalmente configura `openDate` y `closeDate`

2. **El examen aparece para estudiantes**
   - Solo si está publicado
   - Solo si está dentro del rango de fechas (si está configurado)
   - Solo si el estudiante está inscrito en el curso relacionado (si aplica)

---

### **FASE 3: Inicio del Examen (Estudiante)**

1. **Estudiante hace clic en "Iniciar Examen"** (`POST /api/student/exams/start`)
   - El sistema verifica:
     - Que el examen existe y está publicado
     - Que está dentro del rango de fechas
     - Que el examen tiene preguntas asignadas
     - Si ya existe un intento en progreso (no completado)

2. **Se crea un `ExamResult`**
   - Si ya existe un intento en progreso, se reanuda ese
   - Si no, se crea uno nuevo
   - `startedAt` se registra
   - `completedAt` es `null` (aún no completado)

3. **El estudiante ve la interfaz del examen** (`ExamInterface.tsx`)
   - Muestra todas las preguntas del examen
   - Timer con tiempo restante
   - Navegación entre preguntas
   - Guardado automático de respuestas

---

### **FASE 4: Durante el Examen**

1. **El estudiante responde preguntas**
   - Cada respuesta se guarda automáticamente (`POST /api/student/exams/[attemptId]/answer`)
   - Se crea/actualiza un `ExamQuestionAnswer`:
     - `selectedOption`: Para opción múltiple (A, B, C, D)
     - `answerText`: Para fill_blank, essay, matching (JSON string)
     - `timeSpentSeconds`: Tiempo en cada pregunta

2. **El timer cuenta hacia atrás**
   - Basado en `startedAt` y `timeLimitMinutes`
   - No hay auto-submit cuando se acaba el tiempo (solo muestra advertencia)

3. **El estudiante puede:**
   - Navegar entre preguntas
   - Marcar preguntas para revisar después
   - Ver progreso (X/Y preguntas respondidas)

---

### **FASE 5: Envío y Calificación**

1. **Estudiante hace clic en "Enviar Examen"** (`POST /api/student/exams/[attemptId]/submit`)

2. **El sistema califica automáticamente:**
   - Para cada respuesta en `ExamQuestionAnswer`:
     - Busca la pregunta correspondiente en `ExamQuestion`
     - Compara la respuesta según el tipo:
       - **Opción múltiple/True-False**: Compara `selectedOption` con `correctOption`
       - **Fill Blank**: Compara texto (case-insensitive)
       - **Matching**: Parsea JSON y valida cada par
       - **Essay**: Solo verifica que haya respuesta (no se califica automáticamente)
     - Actualiza `isCorrect` en `ExamQuestionAnswer`
     - Cuenta `correctAnswers` e `incorrectAnswers`

3. **Calcula el puntaje:**
   ```typescript
   score = (correctAnswers / totalQuestions) * 100
   isPassed = score >= passingScore (default 70%)
   ```

4. **Actualiza `ExamResult`:**
   - `score`, `correctAnswers`, `incorrectAnswers`
   - `completedAt` = ahora
   - `timeTakenMinutes` = tiempo transcurrido (limitado al tiempo límite)
   - `isPassed`

5. **Crea notificación:**
   - Si aprobó: Notificación de éxito
   - Si no aprobó: Notificación de fallo con opción de reintentar

6. **Verifica logros:**
   - Llama a `AchievementService.checkAndUnlockAllAchievements()`
   - Desbloquea logros si el estudiante cumple criterios

---

## 🎨 Tipos de Examen

### 1. **Simulacro Completo** (`simulacro_completo`)
- Simula un examen ICFES completo
- Incluye preguntas de múltiples competencias
- Generalmente más largo (120+ minutos)

### 2. **Por Competencia** (`por_competencia`)
- Enfocado en una competencia específica
- Asociado a `competencyId`

### 3. **Por Módulo** (`por_modulo`)
- Enfocado en un módulo específico
- Puede generarse automáticamente cuando un estudiante completa un módulo

### 4. **Personalizado** (`personalizado`)
- El admin selecciona módulos específicos
- Configura `includedModules` con array de IDs
- Control total sobre qué contenido evaluar

### 5. **Diagnóstico** (`diagnostico`)
- Para evaluar conocimiento inicial
- Generalmente sin tiempo límite estricto

---

## 🔍 Selección de Preguntas

### Criterios de Elegibilidad:

1. **Campo `usage` de la pregunta:**
   - `'exam'`: Solo para exámenes
   - `'lesson'`: Solo para lecciones (no elegible)
   - `'both'`: Para ambos (elegible)

2. **Tipo de pregunta:**
   - Si `isIcfesExam = true`: Solo `multiple_choice`
   - Si no: Cualquier tipo

3. **Origen:**
   - Las preguntas deben estar en lecciones de los módulos incluidos
   - Se buscan en: `Course -> CourseModules -> Module -> ModuleLessons -> Lesson -> LessonQuestions`

### Proceso de Selección:

1. Se obtienen todas las preguntas de los módulos incluidos
2. Se filtran por elegibilidad
3. Se mezclan aleatoriamente (`sort(() => 0.5 - Math.random())`)
4. Se seleccionan las primeras `questionsPerModule` por módulo
5. Se copian a `ExamQuestion` con `orderIndex` secuencial

---

## ⚙️ Configuraciones Importantes

### Tiempo Límite:
- `timeLimitMinutes`: Tiempo total del examen
- El timer se calcula desde `startedAt`
- Si el estudiante sale y vuelve, el tiempo continúa desde donde lo dejó
- Al enviar, `timeTakenMinutes` se limita al tiempo límite

### Puntaje de Aprobación:
- `passingScore`: Por defecto 70%
- Se calcula como: `(correctAnswers / totalQuestions) * 100`
- Si `score >= passingScore` → `isPassed = true`

### Fechas:
- `openDate`: Fecha/hora de apertura (opcional)
- `closeDate`: Fecha/hora de cierre (opcional)
- Si no están configuradas, el examen está siempre disponible (si está publicado)

---

## 🛡️ Características de Seguridad

### Detección de Trampa (Métricas):
- `averageTimePerQuestion`: Tiempo promedio por pregunta
- `questionsWithVeryFastAnswers`: Preguntas respondidas muy rápido
- `questionsWithIdenticalTiming`: Preguntas con tiempo idéntico (posible copia)
- `fraudRiskScore`: Puntaje de riesgo calculado

**Nota:** Estas métricas se calculan pero no bloquean el examen. Son para análisis posterior.

### Reanudación de Examen:
- Si un estudiante cierra el navegador, puede volver y continuar
- El sistema busca `ExamResult` con `completedAt = null`
- Las respuestas guardadas se restauran automáticamente

---

## 📈 Resultados y Reportes

### Vista de Resultados (Admin):
- `ExamManagement` muestra exámenes agrupados con estudiantes
- Muestra: puntaje, tiempo, aprobado/no aprobado
- Permite reactivar exámenes para que estudiantes los vuelvan a tomar

### Vista de Resultados (Estudiante):
- Puede ver sus resultados después de completar
- Ve qué preguntas acertó/falló
- Puede ver explicaciones de las preguntas

---

## 🔄 Flujo de Reactivación

Si un admin reactiva un examen:
1. Se elimina el `ExamResult` anterior
2. El estudiante puede iniciar un nuevo intento
3. Se crea un nuevo `ExamResult` con `startedAt` actualizado

---

## ⚠️ Puntos Importantes

1. **Las preguntas se copian, no se referencian:**
   - Si cambias una pregunta en una lección, los exámenes ya creados no se afectan
   - Esto es intencional para mantener la integridad histórica

2. **Un estudiante puede tener múltiples intentos:**
   - Si el examen se reactiva, puede volver a tomarlo
   - Cada intento genera un nuevo `ExamResult`

3. **El tiempo se calcula desde `startedAt`:**
   - Si un estudiante inicia a las 10:00 y el examen dura 60 minutos
   - A las 11:00 el tiempo se acaba (aunque no haya estado activo todo el tiempo)

4. **Las respuestas se guardan automáticamente:**
   - No hay riesgo de perder respuestas si se cierra el navegador
   - Cada cambio se guarda inmediatamente

5. **Los exámenes ICFES solo usan opción múltiple:**
   - Esto es una restricción del sistema
   - Las preguntas de otros tipos no se incluyen en exámenes ICFES

---

## 🐛 Problemas Comunes

### "El examen no tiene preguntas asignadas"
- **Causa:** El examen se creó pero no se generaron las preguntas
- **Solución:** Ir a "Generar Preguntas" en el admin panel

### "Examen aún no está abierto" / "Examen ya cerró"
- **Causa:** Las fechas `openDate`/`closeDate` están configuradas
- **Solución:** Verificar fechas o ajustarlas en el admin panel

### "No hay preguntas disponibles"
- **Causa:** Los módulos incluidos no tienen preguntas con `usage = 'exam'` o `'both'`
- **Solución:** Verificar que las lecciones tengan preguntas marcadas para examen

---

¿Hay algún aspecto específico de los exámenes que quieras modificar o mejorar?

