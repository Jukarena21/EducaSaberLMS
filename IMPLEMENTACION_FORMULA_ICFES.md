# Implementación: Fórmula ICFES Mejorada

## Resumen de Cambios

1. ✅ **Filtrado de exámenes**: Solo `simulacro_completo` y `diagnostico`
2. ✅ **RecencyFactor ajustado**: Para procesos preICFES de 3-4 meses
3. ✅ **Basado en preguntas individuales**: No en promedios
4. ✅ **Puntaje general por curso**: Basado en resultados de exámenes completos

---

## Verificación de Datos Disponibles

### ✅ Tenemos:
- `ExamQuestionAnswer.isCorrect` - Si acertó o falló
- `ExamQuestionAnswer.timeSpentSeconds` - Tiempo de respuesta
- `ExamQuestion.difficultyLevel` - Dificultad (facil, intermedio, dificil)
- `ExamQuestion.competencyId` - Competencia de la pregunta
- `Exam.examType` - Tipo de examen (para filtrar)
- `ExamResult.completedAt` - Fecha del examen

### ✅ Podemos obtener:
- Relación `ExamQuestionAnswer -> ExamQuestion -> Competency`
- Relación `ExamQuestionAnswer -> ExamResult -> Exam`

---

## Función Completa de Implementación

```typescript
interface QuestionAnswerWithExam {
  id: string
  isCorrect: boolean | null
  timeSpentSeconds: number | null
  question: {
    id: string
    difficultyLevel: string
    competencyId: string | null
    points: number
  }
  examResult: {
    id: string
    completedAt: Date | null
    exam: {
      id: string
      examType: string
    }
  }
}

/**
 * Calcula el puntaje ICFES basado en respuestas individuales a preguntas
 * Solo considera exámenes completos (simulacro_completo) y de diagnóstico
 */
async function calculateIcfesScoreFromQuestions(
  userId: string
): Promise<number> {
  
  // 1. Cargar todas las respuestas con sus relaciones
  const allAnswers = await prisma.examQuestionAnswer.findMany({
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
              id: true,
              examType: true
            }
          }
        }
      }
    }
  })
  
  if (allAnswers.length === 0) {
    // No hay exámenes completos, retornar 0 o usar fallback
    return 0
  }
  
  // 2. Pesos por competencia (ICFES real)
  const competencyWeights: Record<string, number> = {
    'matematicas': 0.25,
    'lectura_critica': 0.25,
    'ciencias_naturales': 0.20,
    'sociales_y_ciudadanas': 0.15,
    'ingles': 0.15
  }
  
  // 3. Pesos por dificultad
  const difficultyWeights: Record<string, number> = {
    'facil': 0.7,
    'intermedio': 1.0,
    'dificil': 1.5
  }
  
  // 4. Calcular recencia (ajustado para preICFES 3-4 meses)
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
  
  // 5. Factor de tiempo
  const getTimeFactor = (timeSpentSeconds: number | null): number => {
    if (!timeSpentSeconds) return 1.0
    if (timeSpentSeconds < 5) return 0.8      // Muy rápido, posible al azar
    if (timeSpentSeconds < 30) return 1.0      // Normal
    return 1.1                                 // Reflexión profunda
  }
  
  // 6. Agrupar por competencia
  const competencyScores: Record<string, { 
    obtained: number
    maxPossible: number
    competencyName: string
  }> = {}
  
  for (const answer of allAnswers) {
    // Validar que tenga competencia
    if (!answer.question.competencyId || !answer.question.competency) continue
    
    const competencyId = answer.question.competencyId
    const competencyName = answer.question.competency.name.toLowerCase()
    const isCorrect = answer.isCorrect === true
    
    // Calcular factores
    const baseScore = isCorrect ? 1 : 0
    const difficultyWeight = difficultyWeights[answer.question.difficultyLevel] || 1.0
    const timeFactor = getTimeFactor(answer.timeSpentSeconds)
    const recencyFactor = getRecencyFactor(answer.examResult.completedAt)
    
    // Puntaje de esta pregunta
    const questionScore = baseScore * difficultyWeight * timeFactor * recencyFactor
    const maxQuestionScore = difficultyWeight * timeFactor * recencyFactor
    
    // Acumular por competencia
    if (!competencyScores[competencyId]) {
      competencyScores[competencyId] = {
        obtained: 0,
        maxPossible: 0,
        competencyName
      }
    }
    competencyScores[competencyId].obtained += questionScore
    competencyScores[competencyId].maxPossible += maxQuestionScore
  }
  
  // 7. Calcular score ponderado por competencia
  let weightedSum = 0
  let totalWeight = 0
  
  for (const [competencyId, scores] of Object.entries(competencyScores)) {
    if (scores.maxPossible === 0) continue
    
    // Calcular porcentaje de la competencia
    const competencyPercentage = (scores.obtained / scores.maxPossible) * 100
    
    // Obtener peso según nombre de competencia
    const weight = competencyWeights[scores.competencyName] || 0.20
    
    weightedSum += competencyPercentage * weight
    totalWeight += weight
  }
  
  // 8. Si no hay datos suficientes, retornar 0
  if (totalWeight === 0) return 0
  
  // 9. Normalizar y convertir a escala ICFES (0-500)
  const normalizedScore = weightedSum / totalWeight
  return Math.max(0, Math.min(500, Math.round(normalizedScore * 5)))
}

/**
 * Calcula el puntaje general por curso basado en exámenes completos
 * Reemplaza el cálculo anterior basado solo en progreso de lecciones
 */
async function calculateCourseProgressFromExams(
  userId: string,
  courseId: string
): Promise<number> {
  
  // Obtener competencia del curso
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { competencyId: true }
  })
  
  if (!course?.competencyId) return 0
  
  // Obtener respuestas de exámenes completos de esta competencia
  const answers = await prisma.examQuestionAnswer.findMany({
    where: {
      userId,
      question: {
        competencyId: course.competencyId
      },
      examResult: {
        exam: {
          examType: {
            in: ['simulacro_completo', 'diagnostico']
          }
        }
      }
    },
    include: {
      question: true,
      examResult: {
        include: {
          exam: true
        }
      }
    }
  })
  
  if (answers.length === 0) return 0
  
  // Calcular porcentaje de aciertos ponderado por dificultad
  let totalScore = 0
  let maxScore = 0
  
  const difficultyWeights: Record<string, number> = {
    'facil': 0.7,
    'intermedio': 1.0,
    'dificil': 1.5
  }
  
  for (const answer of answers) {
    const weight = difficultyWeights[answer.question.difficultyLevel] || 1.0
    const isCorrect = answer.isCorrect === true
    
    totalScore += (isCorrect ? 1 : 0) * weight
    maxScore += weight
  }
  
  return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
}
```

---

## Cambios en `export-puppeteer/route.ts`

### Reemplazar función `calculateIcfesScore`:

```typescript
// ANTES:
function calculateIcfesScore(competencies: any[], averageProgress: number): number {
  const icfesBase = Math.round(averageProgress * 5)
  return Math.max(0, Math.min(500, icfesBase))
}

// DESPUÉS:
async function calculateIcfesScore(userId: string): Promise<number> {
  return await calculateIcfesScoreFromQuestions(userId)
}
```

### Actualizar llamada en el código:

```typescript
// ANTES:
estimatedIcfesScore: calculateIcfesScore(finalCompetenciesData || [], averageProgress)

// DESPUÉS:
estimatedIcfesScore: await calculateIcfesScore(userId)
```

---

## Verificación Final

✅ **Datos disponibles**: Todos los datos necesarios están en la base de datos
✅ **Filtrado correcto**: Solo exámenes completos y diagnóstico
✅ **RecencyFactor ajustado**: Para procesos de 3-4 meses
✅ **Puntaje por curso**: Basado en exámenes, no solo progreso

---

## Próximos Pasos

1. Implementar función `calculateIcfesScoreFromQuestions`
2. Actualizar `calculateIcfesScore` en `export-puppeteer/route.ts`
3. Actualizar cálculo de `averageProgress` para usar `calculateCourseProgressFromExams`
4. Probar con datos reales
5. Verificar que los resultados sean coherentes

