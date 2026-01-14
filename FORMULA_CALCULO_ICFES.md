# Fórmula de Cálculo del Puntaje ICFES

## Fórmula Principal

```
Puntaje ICFES = averageProgress × 5
```

Donde:
- `averageProgress` = Progreso promedio general del estudiante (0-100%)
- El resultado se redondea y se limita entre 0 y 500 puntos

---

## Cálculo del `averageProgress` (Progreso Promedio)

El `averageProgress` se calcula como el **promedio aritmético** del progreso porcentual de todos los cursos del estudiante:

```
averageProgress = (Σ progressPercentage_i) / n
```

Donde:
- `progressPercentage_i` = Progreso porcentual del curso `i` (0-100%)
- `n` = Número total de cursos del estudiante
- `Σ` = Sumatoria de todos los cursos

### Ejemplo:
Si un estudiante tiene 5 cursos con progresos: 80%, 60%, 90%, 70%, 50%

```
averageProgress = (80 + 60 + 90 + 70 + 50) / 5
                = 350 / 5
                = 70%
```

---

## Cálculo del `progressPercentage` por Curso

Para cada curso, el progreso se calcula como:

```
progressPercentage = (Lecciones Completadas / Total de Lecciones) × 100
```

Donde:
- **Lecciones Completadas** = Número de lecciones con `status === 'completed'`
- **Total de Lecciones** = Número total de lecciones en el curso

### Ejemplo:
Si un curso tiene 20 lecciones y el estudiante completó 15:

```
progressPercentage = (15 / 20) × 100
                  = 0.75 × 100
                  = 75%
```

---

## Ejemplo Completo de Cálculo

### Paso 1: Calcular progreso por curso

**Curso 1 - Matemáticas:**
- Total lecciones: 30
- Completadas: 24
- `progressPercentage_1 = (24/30) × 100 = 80%`

**Curso 2 - Lectura Crítica:**
- Total lecciones: 25
- Completadas: 20
- `progressPercentage_2 = (20/25) × 100 = 80%`

**Curso 3 - Ciencias Naturales:**
- Total lecciones: 28
- Completadas: 14
- `progressPercentage_3 = (14/28) × 100 = 50%`

**Curso 4 - Ciencias Sociales:**
- Total lecciones: 22
- Completadas: 11
- `progressPercentage_4 = (11/22) × 100 = 50%`

**Curso 5 - Inglés:**
- Total lecciones: 20
- Completadas: 18
- `progressPercentage_5 = (18/20) × 100 = 90%`

### Paso 2: Calcular promedio general

```
averageProgress = (80 + 80 + 50 + 50 + 90) / 5
                = 350 / 5
                = 70%
```

### Paso 3: Calcular puntaje ICFES

```
Puntaje ICFES = 70 × 5
              = 350 puntos
```

---

## Fórmula en Código

```typescript
function calculateIcfesScore(competencies: any[], averageProgress: number): number {
  // Fórmula: progreso promedio (0-100%) × 5 = ICFES (0-500 puntos)
  const icfesBase = Math.round(averageProgress * 5)
  return Math.max(0, Math.min(500, icfesBase))
}
```

**Límites:**
- Mínimo: 0 puntos (si `averageProgress = 0%`)
- Máximo: 500 puntos (si `averageProgress = 100%`)

---

## Tabla de Conversión

| Progreso Promedio | Puntaje ICFES | Interpretación |
|-------------------|---------------|----------------|
| 0% | 0 puntos | Sin progreso |
| 20% | 100 puntos | Muy bajo |
| 40% | 200 puntos | Bajo |
| 50% | 250 puntos | Medio-Bajo |
| 60% | 300 puntos | Medio (promedio nacional) |
| 70% | 350 puntos | Medio-Alto |
| 80% | 400 puntos | Alto |
| 90% | 450 puntos | Muy alto |
| 100% | 500 puntos | Excelente |

---

## Notas Importantes

1. **El cálculo NO considera directamente las notas de exámenes** para el puntaje ICFES general. Solo usa el progreso de lecciones completadas.

2. **Las notas de exámenes** se usan para:
   - Calcular `averageScore` por competencia (mostrado en gráficas radar)
   - Mostrar evolución temporal
   - Pero NO se incluyen en el cálculo del `averageProgress` general

3. **Si un estudiante no tiene cursos o lecciones:**
   - `averageProgress = 0%`
   - `Puntaje ICFES = 0 puntos`

4. **El redondeo** se hace con `Math.round()`, por lo que:
   - 69.5% → 70% → 350 puntos
   - 69.4% → 69% → 345 puntos

---

## Posibles Mejoras Futuras

Actualmente, la fórmula es simple y se basa solo en progreso de lecciones. Se podría mejorar considerando:

1. **Peso por competencia**: Dar más importancia a ciertas competencias
2. **Incluir notas de exámenes**: Combinar progreso de lecciones con rendimiento en exámenes
3. **Factor de dificultad**: Ajustar según la dificultad de los cursos
4. **Tiempo invertido**: Considerar el tiempo de estudio como factor adicional

---

## Referencias en el Código

- **Función principal**: `app/api/student/progress/export-puppeteer/route.ts` línea 95-102
- **Cálculo de averageProgress**: `app/api/student/progress/export-puppeteer/route.ts` línea 625-627
- **Cálculo de progressPercentage por curso**: `app/api/student/progress/export-puppeteer/route.ts` línea 526-528

