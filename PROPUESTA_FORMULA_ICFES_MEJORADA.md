# Propuesta: Fórmula Mejorada para Cálculo de ICFES

## Análisis del Problema Actual

**Fórmula actual:**
```
ICFES = averageProgress × 5
```
Donde `averageProgress` solo considera lecciones completadas, **NO** las notas de exámenes.

**Problemas:**
1. ❌ No refleja el rendimiento real en evaluaciones
2. ❌ No considera la dificultad de las preguntas
3. ❌ No usa pesos por competencia (como el ICFES real)
4. ❌ Un estudiante puede tener 100% de progreso pero mal rendimiento en exámenes

---

## Propuesta: Fórmula Híbrida con Ponderación

### Opción 1: Basada en Rendimiento de Exámenes (RECOMENDADA)

```
ICFES = (Σ (competencyScore_i × weight_i × difficultyFactor_i)) × 5
```

Donde:
- `competencyScore_i` = Promedio de notas en exámenes de la competencia `i` (0-100)
- `weight_i` = Peso de la competencia según ICFES real
- `difficultyFactor_i` = Factor de ajuste por dificultad promedio de preguntas acertadas

#### Pesos por Competencia (ICFES Real):
```
Matemáticas:          25% (0.25)
Lectura Crítica:      25% (0.25)
Ciencias Naturales:   20% (0.20)
Ciencias Sociales:    15% (0.15)
Inglés:               15% (0.15)
```

#### Factor de Dificultad:
```
difficultyFactor = 1 + (difficultyBonus / 100)

donde:
difficultyBonus = (preguntas_dificiles_acertadas × 0.15) + 
                  (preguntas_intermedias_acertadas × 0.05) - 
                  (preguntas_faciles_falladas × 0.10)
```

**Ejemplo:**
- Matemáticas: 80 puntos, peso 0.25, dificultad +5% → `80 × 0.25 × 1.05 = 21`
- Lectura: 70 puntos, peso 0.25, dificultad +2% → `70 × 0.25 × 1.02 = 17.85`
- Ciencias: 75 puntos, peso 0.20, dificultad +3% → `75 × 0.20 × 1.03 = 15.45`
- Sociales: 65 puntos, peso 0.15, dificultad 0% → `65 × 0.15 × 1.00 = 9.75`
- Inglés: 85 puntos, peso 0.15, dificultad +1% → `85 × 0.15 × 1.01 = 12.88`

```
ICFES = (21 + 17.85 + 15.45 + 9.75 + 12.88) × 5 = 384 puntos
```

---

### Opción 2: Híbrida (Exámenes + Progreso)

Para estudiantes con pocos exámenes, combinar rendimiento con progreso:

```
ICFES = (examBasedScore × examWeight) + (progressBasedScore × progressWeight)
```

Donde:
- `examBasedScore` = Cálculo basado en exámenes (Opción 1)
- `progressBasedScore` = Progreso de lecciones × 5 (fórmula actual)
- `examWeight` = 0.7 si tiene ≥3 exámenes, 0.5 si tiene 1-2, 0.3 si tiene 0
- `progressWeight` = 1 - examWeight

**Ejemplo:**
- Estudiante con 5 exámenes: `examBasedScore = 384`, `progressBasedScore = 350`
- `ICFES = (384 × 0.7) + (350 × 0.3) = 268.8 + 105 = 374 puntos`

---

### Opción 3: Con Ponderación por Dificultad de Preguntas Individuales

La más precisa, pero requiere más datos:

```
ICFES = Σ (preguntaScore_i × difficultyWeight_i) × (500 / totalPointsPossible)
```

Donde:
- `preguntaScore_i` = 1 si acertó, 0 si falló
- `difficultyWeight_i` = Peso según dificultad:
  - Fácil: 0.8
  - Intermedio: 1.0
  - Difícil: 1.5
- `totalPointsPossible` = Suma de todos los `difficultyWeight_i` del examen

**Ejemplo:**
Examen con 10 preguntas:
- 3 fáciles acertadas: `3 × 0.8 = 2.4`
- 4 intermedias acertadas: `4 × 1.0 = 4.0`
- 2 difíciles acertadas: `2 × 1.5 = 3.0`
- 1 difícil fallada: `0`

Total puntos: `2.4 + 4.0 + 3.0 = 9.4`
Puntos posibles: `(3×0.8) + (4×1.0) + (3×1.5) = 2.4 + 4.0 + 4.5 = 10.9`

```
Score = (9.4 / 10.9) × 100 = 86.2%
ICFES = 86.2 × 5 = 431 puntos
```

---

## Recomendación: Implementar Opción 1 + Opción 2

### Fórmula Final Propuesta:

```typescript
function calculateIcfesScoreImproved(
  competencies: any[], 
  examResults: any[],
  examQuestionAnswers: any[]
): number {
  
  // Pesos por competencia (ICFES real)
  const competencyWeights: Record<string, number> = {
    'matematicas': 0.25,
    'lectura_critica': 0.25,
    'ciencias_naturales': 0.20,
    'sociales_y_ciudadanas': 0.15,
    'ingles': 0.15
  }
  
  // Calcular score por competencia
  let weightedSum = 0
  let totalWeight = 0
  
  for (const comp of competencies) {
    const weight = competencyWeights[comp.name] || 0.20 // Default 20% si no está en la lista
    
    // Obtener exámenes de esta competencia
    const compExams = examResults.filter(er => 
      er.exam?.competencyId === comp.id
    )
    
    if (compExams.length > 0) {
      // Calcular promedio de notas
      const avgScore = compExams.reduce((sum, er) => sum + er.score, 0) / compExams.length
      
      // Calcular factor de dificultad
      const difficultyFactor = calculateDifficultyFactor(compExams, examQuestionAnswers)
      
      // Aplicar peso y factor
      weightedSum += avgScore * weight * difficultyFactor
      totalWeight += weight
    }
  }
  
  // Si no hay exámenes, usar progreso como fallback
  if (totalWeight === 0) {
    const avgProgress = competencies.reduce((sum, c) => 
      sum + (c.progressPercentage || 0), 0
    ) / competencies.length
    return Math.round(avgProgress * 5)
  }
  
  // Normalizar y convertir a escala ICFES
  const normalizedScore = weightedSum / totalWeight
  return Math.max(0, Math.min(500, Math.round(normalizedScore * 5)))
}

function calculateDifficultyFactor(
  examResults: any[], 
  examQuestionAnswers: any[]
): number {
  let difficultyBonus = 0
  let totalQuestions = 0
  
  for (const result of examResults) {
    // Obtener respuestas de este examen
    const answers = examQuestionAnswers.filter(a => a.examResultId === result.id)
    
    for (const answer of answers) {
      // Obtener la pregunta para saber su dificultad
      const question = result.exam?.examQuestions?.find(
        q => q.id === answer.questionId
      )
      
      if (question) {
        totalQuestions++
        const isCorrect = answer.isCorrect
        
        if (question.difficultyLevel === 'dificil' && isCorrect) {
          difficultyBonus += 15 // Bonus por acertar pregunta difícil
        } else if (question.difficultyLevel === 'intermedio' && isCorrect) {
          difficultyBonus += 5
        } else if (question.difficultyLevel === 'facil' && !isCorrect) {
          difficultyBonus -= 10 // Penalización por fallar pregunta fácil
        }
      }
    }
  }
  
  // Convertir bonus a factor (0-20% de ajuste)
  const factor = 1 + (difficultyBonus / (totalQuestions * 100))
  return Math.max(0.8, Math.min(1.2, factor)) // Limitar entre 0.8 y 1.2
}
```

---

## Ventajas de la Nueva Fórmula

### ✅ **Más Realista**
- Usa notas reales de exámenes, no solo progreso
- Refleja mejor el rendimiento del estudiante

### ✅ **Considera Dificultad**
- Premia acertar preguntas difíciles
- Penaliza fallar preguntas fáciles
- Más justo y preciso

### ✅ **Pesos por Competencia**
- Alineado con el ICFES real
- Matemáticas y Lectura tienen más peso (25% cada una)

### ✅ **Fallback Inteligente**
- Si no hay exámenes, usa progreso (fórmula actual)
- Si hay pocos exámenes, combina ambos (Opción 2)

---

## Comparación: Fórmula Actual vs Propuesta

### Estudiante A: Mucho progreso, mal en exámenes
- **Actual**: 100% progreso → **500 puntos ICFES** ❌ (sobreestimado)
- **Propuesta**: 60% en exámenes → **300 puntos ICFES** ✅ (realista)

### Estudiante B: Poco progreso, excelente en exámenes
- **Actual**: 40% progreso → **200 puntos ICFES** ❌ (subestimado)
- **Propuesta**: 85% en exámenes → **425 puntos ICFES** ✅ (realista)

### Estudiante C: Bueno en ambos
- **Actual**: 80% progreso → **400 puntos ICFES**
- **Propuesta**: 80% en exámenes → **400 puntos ICFES** ✅ (similar, pero más preciso)

---

## Implementación Sugerida

### Fase 1: Implementar Opción 1 (Básica)
- Usar notas de exámenes con pesos por competencia
- Factor de dificultad simple (sin análisis detallado de preguntas)

### Fase 2: Agregar Análisis de Dificultad
- Implementar `calculateDifficultyFactor` completo
- Requiere cargar `examQuestionAnswers` en la consulta

### Fase 3: Opción Híbrida (Opcional)
- Combinar con progreso para estudiantes nuevos
- Solo si hay casos donde no hay suficientes exámenes

---

## Datos Necesarios para Implementar

✅ **Ya disponibles:**
- `competencies` con `averageScore` por competencia
- `examResults` con `score` por examen
- `exam.examQuestions` con `difficultyLevel`

⚠️ **Necesitamos cargar:**
- `examQuestionAnswers` para análisis detallado de dificultad
- Relación entre `examQuestionAnswers` y `examQuestions` para saber qué preguntas acertó

---

## ¿Cuál Prefieres Implementar?

1. **Opción 1 (Recomendada)**: Más simple, usa datos ya disponibles, mejora significativa
2. **Opción 2**: Híbrida, mejor para estudiantes nuevos
3. **Opción 3**: Más precisa pero requiere más datos y procesamiento

**Mi recomendación**: Empezar con **Opción 1**, que ya es una mejora significativa y usa datos que ya tenemos disponibles.

