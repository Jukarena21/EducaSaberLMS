# Fórmula ICFES Basada en Respuestas Individuales a Preguntas

## ⚠️ IMPORTANTE: Filtrado de Exámenes

**Solo se consideran:**
- ✅ `simulacro_completo`: Simulacros completos tipo ICFES (todas las competencias)
- ✅ `diagnostico`: Exámenes de diagnóstico inicial

**NO se consideran:**
- ❌ `por_competencia`: Exámenes de una sola competencia
- ❌ `por_modulo`: Exámenes por módulo
- ❌ `personalizado`: Exámenes personalizados

**Razón:** El puntaje ICFES debe basarse en evaluaciones completas que midan todas las competencias, no en exámenes parciales.

## Datos Disponibles

✅ **Tenemos acceso a:**
- `ExamQuestionAnswer.isCorrect` - Si acertó o falló cada pregunta
- `ExamQuestionAnswer.timeSpentSeconds` - Tiempo que tardó
- `ExamQuestion.difficultyLevel` - Dificultad de cada pregunta (facil, intermedio, dificil)
- `ExamQuestion.points` - Puntos de la pregunta
- `ExamQuestion.competencyId` - Competencia a la que pertenece
- `ExamResult.completedAt` - Fecha del examen (para considerar exámenes recientes)

---

## Fórmula Propuesta: Basada en Preguntas Individuales

### Paso 1: Calcular Puntaje Ponderado por Pregunta

Para cada pregunta respondida:

```
preguntaScore = baseScore × difficultyWeight × timeFactor × recencyFactor
```

Donde:
- `baseScore` = 1 si `isCorrect === true`, 0 si `isCorrect === false`
- `difficultyWeight` = Peso según dificultad:
  - `facil`: 0.7
  - `intermedio`: 1.0
  - `dificil`: 1.5
- `timeFactor` = Factor de tiempo (opcional, para penalizar respuestas muy rápidas que pueden ser al azar):
  - Si `timeSpentSeconds < 5`: 0.8 (posible al azar)
  - Si `timeSpentSeconds >= 5 && < 30`: 1.0 (normal)
  - Si `timeSpentSeconds >= 30`: 1.1 (reflexión profunda)
- `recencyFactor` = Factor de recencia (ajustado para procesos preICFES de 3-4 meses):
  - **Más reciente (0-30 días)**: 1.0 (peso completo, baseline)
  - 1-2 meses: 0.9 (ligeramente menos relevante)
  - 2-3 meses: 0.8 (menos relevante)
  - 3-4 meses: 0.7 (proceso completo, pero menos peso)
  - 4-6 meses: 0.6 (poco relevante)
  - 6-12 meses: 0.5 (muy poco relevante)
  - Más de 12 meses: 0.3 (casi sin relevancia)

### Paso 2: Agrupar por Competencia con Pesos ICFES

```
competencyScore_i = (Σ preguntaScore_j) / (Σ maxPossibleScore_j) × 100
```

Donde:
- `preguntaScore_j` = Puntaje de cada pregunta de la competencia `i`
- `maxPossibleScore_j` = Puntaje máximo posible de cada pregunta (difficultyWeight × timeFactor × recencyFactor)

### Paso 3: Aplicar Pesos ICFES y Calcular Puntaje Final

```
ICFES = Σ (competencyScore_i × weight_i) × 5
```

**Pesos por Competencia (ICFES Real):**
```
Matemáticas:          25% (0.25)
Lectura Crítica:      25% (0.25)
Ciencias Naturales:   20% (0.20)
Ciencias Sociales:    15% (0.15)
Inglés:               15% (0.15)
```

---

## Ejemplo Completo

### Estudiante responde un examen de Matemáticas (10 preguntas):

**Preguntas:**
1. Fácil, acertó, 8 segundos → `1 × 0.7 × 0.8 × 1.2 = 0.672`
2. Intermedio, acertó, 25 segundos → `1 × 1.0 × 1.0 × 1.2 = 1.2`
3. Difícil, acertó, 45 segundos → `1 × 1.5 × 1.1 × 1.2 = 1.98`
4. Intermedio, falló, 20 segundos → `0 × 1.0 × 1.0 × 1.2 = 0`
5. Fácil, acertó, 15 segundos → `1 × 0.7 × 1.0 × 1.2 = 0.84`
6. Difícil, acertó, 50 segundos → `1 × 1.5 × 1.1 × 1.2 = 1.98`
7. Intermedio, acertó, 3 segundos → `1 × 1.0 × 0.8 × 1.2 = 0.96`
8. Fácil, falló, 10 segundos → `0 × 0.7 × 1.0 × 1.2 = 0`
9. Intermedio, acertó, 30 segundos → `1 × 1.0 × 1.0 × 1.2 = 1.2`
10. Difícil, falló, 35 segundos → `0 × 1.5 × 1.0 × 1.2 = 0`

**Cálculo:**
- Puntaje obtenido: `0.672 + 1.2 + 1.98 + 0 + 0.84 + 1.98 + 0.96 + 0 + 1.2 + 0 = 8.832`
- Puntaje máximo posible: `(0.7×0.8×1.2) + (1.0×1.0×1.2) + (1.5×1.1×1.2) + ... = 12.6`
- `competencyScore_Matematicas = (8.832 / 12.6) × 100 = 70.1%`

### Repetir para todas las competencias:

- Matemáticas: 70.1% × 0.25 = 17.525
- Lectura: 75.0% × 0.25 = 18.75
- Ciencias: 65.0% × 0.20 = 13.0
- Sociales: 80.0% × 0.15 = 12.0
- Inglés: 85.0% × 0.15 = 12.75

**Puntaje Final:**
```
ICFES = (17.525 + 18.75 + 13.0 + 12.0 + 12.75) × 5
     = 74.025 × 5
     = 370 puntos
```

---

## Implementación en Código

```typescript
interface QuestionAnswerData {
  isCorrect: boolean
  timeSpentSeconds?: number
  question: {
    difficultyLevel: string
    competencyId: string
    points: number
  }
  examResult: {
    completedAt: Date | null
    exam: {
      examType: string // 'simulacro_completo', 'diagnostico', 'por_competencia', etc.
    }
  }
}

function calculateIcfesScoreFromQuestions(
  allQuestionAnswers: QuestionAnswerData[]
): number {
  
  // FILTRAR: Solo exámenes completos (simulacros completos) y de diagnóstico
  // NO incluir exámenes de una sola competencia
  const validExamTypes = ['simulacro_completo', 'diagnostico']
  const filteredAnswers = allQuestionAnswers.filter(answer => {
    const examType = answer.examResult?.exam?.examType
    return examType && validExamTypes.includes(examType)
  })
  
  if (filteredAnswers.length === 0) {
    // Si no hay exámenes completos, retornar 0 o usar fallback
    return 0
  }
  
  // Pesos por competencia (ICFES real)
  const competencyWeights: Record<string, number> = {
    'matematicas': 0.25,
    'lectura_critica': 0.25,
    'ciencias_naturales': 0.20,
    'sociales_y_ciudadanas': 0.15,
    'ingles': 0.15
  }
  
  // Pesos por dificultad
  const difficultyWeights: Record<string, number> = {
    'facil': 0.7,
    'intermedio': 1.0,
    'dificil': 1.5
  }
  
  // Calcular recencia (días desde hoy)
  // Ajustado para procesos de preICFES (3-4 meses)
  // El más reciente tiene peso 1.0 (baseline), los anteriores tienen menos peso
  const now = new Date()
  const getRecencyFactor = (completedAt: Date | null): number => {
    if (!completedAt) return 1.0
    const daysDiff = (now.getTime() - new Date(completedAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff <= 30) return 1.0      // Más reciente (0-30 días): peso completo
    if (daysDiff <= 60) return 0.9      // 1-2 meses: ligeramente menos relevante
    if (daysDiff <= 90) return 0.8      // 2-3 meses: menos relevante
    if (daysDiff <= 120) return 0.7     // 3-4 meses: proceso completo, pero menos peso
    if (daysDiff <= 180) return 0.6     // 4-6 meses: poco relevante
    if (daysDiff <= 365) return 0.5     // 6-12 meses: muy poco relevante
    return 0.3                           // Más de 12 meses: casi sin relevancia
  }
  
  // Factor de tiempo
  const getTimeFactor = (timeSpentSeconds?: number): number => {
    if (!timeSpentSeconds) return 1.0
    if (timeSpentSeconds < 5) return 0.8      // Muy rápido, posible al azar
    if (timeSpentSeconds < 30) return 1.0     // Normal
    return 1.1                                 // Reflexión profunda
  }
  
  // Agrupar por competencia
  const competencyScores: Record<string, { obtained: number; maxPossible: number }> = {}
  
  for (const answer of filteredAnswers) {
    const competencyId = answer.question.competencyId
    if (!competencyId) continue
    
    // Calcular factores
    const baseScore = answer.isCorrect ? 1 : 0
    const difficultyWeight = difficultyWeights[answer.question.difficultyLevel] || 1.0
    const timeFactor = getTimeFactor(answer.timeSpentSeconds)
    const recencyFactor = getRecencyFactor(answer.examResult.completedAt)
    
    // Puntaje de esta pregunta
    const questionScore = baseScore * difficultyWeight * timeFactor * recencyFactor
    const maxQuestionScore = difficultyWeight * timeFactor * recencyFactor
    
    // Acumular por competencia
    if (!competencyScores[competencyId]) {
      competencyScores[competencyId] = { obtained: 0, maxPossible: 0 }
    }
    competencyScores[competencyId].obtained += questionScore
    competencyScores[competencyId].maxPossible += maxQuestionScore
  }
  
  // Calcular score ponderado por competencia
  let weightedSum = 0
  let totalWeight = 0
  
  // Obtener nombres de competencias para mapear
  const competencyMap: Record<string, string> = {} // Se llenaría con query a DB
  
  for (const [competencyId, scores] of Object.entries(competencyScores)) {
    if (scores.maxPossible === 0) continue
    
    // Calcular porcentaje de la competencia
    const competencyPercentage = (scores.obtained / scores.maxPossible) * 100
    
    // Obtener peso (necesitamos mapear competencyId a nombre)
    const competencyName = competencyMap[competencyId] || 'otra'
    const weight = competencyWeights[competencyName] || 0.20
    
    weightedSum += competencyPercentage * weight
    totalWeight += weight
  }
  
  // Si no hay datos, retornar 0
  if (totalWeight === 0) return 0
  
  // Normalizar y convertir a escala ICFES (0-500)
  const normalizedScore = weightedSum / totalWeight
  return Math.max(0, Math.min(500, Math.round(normalizedScore * 5)))
}
```

---

## Ventajas de Esta Fórmula

### ✅ **Precisión Máxima**
- Usa cada respuesta individual, no promedios
- Considera dificultad real de cada pregunta

### ✅ **Justicia**
- Premia acertar preguntas difíciles más que fáciles
- Penaliza respuestas muy rápidas (posible al azar)
- Da más peso a exámenes recientes

### ✅ **Alineado con ICFES Real**
- Usa los mismos pesos por competencia
- Similar a Teoría de Respuesta al Ítem (TRI) que usa ICFES

### ✅ **Considera Múltiples Factores**
- Dificultad de pregunta
- Tiempo de respuesta
- Recencia del examen
- Rendimiento real en evaluaciones

---

## Factores Opcionales Adicionales

Podríamos agregar:

1. **Factor de Consistencia**: Si un estudiante acerta consistentemente preguntas difíciles de una competencia, dar bonus
2. **Factor de Mejora**: Si el rendimiento mejora con el tiempo, dar bonus
3. **Factor de Completitud**: Si ha respondido suficientes preguntas de cada competencia
4. **Factor de Variabilidad**: Penalizar si hay mucha variabilidad (inconsistencia)

---

## Comparación con Fórmula Actual

| Aspecto | Actual (Progreso) | Nueva (Preguntas) |
|---------|------------------|-------------------|
| Base de datos | Lecciones completadas | Respuestas a preguntas |
| Precisión | Baja | Alta |
| Considera dificultad | ❌ | ✅ |
| Considera tiempo | ❌ | ✅ |
| Considera recencia | ❌ | ✅ |
| Pesos ICFES | ❌ | ✅ |
| Refleja rendimiento real | ❌ | ✅ |

---

## Requisitos de Implementación

1. **Cargar datos necesarios (SOLO exámenes completos y diagnóstico):**
   ```typescript
   const examQuestionAnswers = await prisma.examQuestionAnswer.findMany({
     where: { 
       userId,
       examResult: {
         exam: {
           examType: {
             in: ['simulacro_completo', 'diagnostico']
           }
         }
       }
     },
     include: {
       question: {
         include: {
           competency: true
         }
       },
       examResult: {
         include: {
           exam: {
             select: {
               examType: true
             }
           }
         },
         select: {
           completedAt: true,
           exam: {
             select: {
               examType: true
             }
           }
         }
       }
     }
   })
   ```
   
   **Nota importante:** Esto filtra automáticamente los exámenes de una sola competencia (`por_competencia`), solo incluyendo:
   - `simulacro_completo`: Simulacros completos tipo ICFES
   - `diagnostico`: Exámenes de diagnóstico inicial

2. **Mapear competencyId a nombre** para aplicar pesos

3. **Implementar función de cálculo** (código arriba)

4. **Fallback**: Si no hay exámenes completos/diagnóstico:
   - Retornar 0 si no hay ningún examen
   - O usar fórmula basada en progreso de cursos (fórmula anterior) como respaldo

5. **Puntaje General por Curso**: Mantener el cálculo basado en cursos, pero ahora usando resultados de exámenes completos:
   - Agrupar preguntas por curso/competencia
   - Calcular promedio por curso basado en exámenes completos
   - Esto reemplaza el cálculo anterior basado solo en progreso de lecciones

---

## ¿Implementamos Esta Fórmula?

Esta es la más precisa y justa. Requiere cargar `examQuestionAnswers` con sus relaciones, pero tenemos todos los datos necesarios.

