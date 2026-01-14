# 🔍 Revisión Completa: Analytics del Admin General

## 📊 Resumen Ejecutivo

### Componentes Analizados
1. **KPIs Principales** (3 tarjetas)
2. **Métricas de Engagement** (6 métricas)
3. **Gráficos de Calificaciones** (series, distribución, ranking)
4. **Actividad por Hora**
5. **Reportes de Competencias**
6. **Vista de Estudiantes** (tabla con métricas individuales)

---

## 1️⃣ KPIs PRINCIPALES

### 1.1 Estudiantes Activos (`kpis.activeStudents`)

**Fuente de Datos:**
- **API:** `/api/analytics/grades` (líneas 135-141)
- **Cálculo Actual:**
```typescript
const distinctUsers = await prisma.examResult.findMany({ 
  select: { userId: true }, 
  distinct: ['userId'] 
})
const activeStudents = distinctUsers.length
```

**⚠️ PROBLEMA IDENTIFICADO:**
- ❌ **Solo cuenta estudiantes que han presentado exámenes**
- ❌ **NO incluye estudiantes activos que solo han completado lecciones**
- ❌ **Los KPIs NO respetan los filtros aplicados** (línea 135-140: se calculan sobre TODOS los examResults, sin filtros)

**Cálculo Correcto Esperado:**
```typescript
// Debería incluir estudiantes que:
// 1. Han presentado exámenes (en el período)
// 2. Han completado lecciones (en el período)
// 3. Respetar los filtros aplicados (schoolId, courseId, etc.)
```

**Comparación con Engagement:**
- En `/api/analytics/engagement` (líneas 102-123), `activeUsers` SÍ incluye ambos casos:
  - Estudiantes con lecciones completadas
  - Estudiantes con exámenes realizados
- **Inconsistencia:** Los KPIs y Engagement calculan "activos" de forma diferente

---

### 1.2 Promedio General (`kpis.averageScore`)

**Fuente de Datos:**
- **API:** `/api/analytics/grades` (líneas 135-143)
- **Cálculo Actual:**
```typescript
const avgAgg = await prisma.examResult.aggregate({ _avg: { score: true } })
const avgScore = Number((avgAgg._avg.score || 0).toFixed(1))
```

**⚠️ PROBLEMA IDENTIFICADO:**
- ❌ **NO respeta los filtros aplicados** (se calcula sobre TODOS los examResults)
- ❌ **No considera el período de tiempo** (debería usar `filteredResults`)

**Cálculo Correcto Esperado:**
```typescript
// Debería calcularse sobre filteredResults (que ya tiene los filtros aplicados)
const avgScore = filteredResults.length > 0
  ? filteredResults.reduce((sum, r) => sum + r.score, 0) / filteredResults.length
  : 0
```

---

### 1.3 Exámenes Realizados (`kpis.examAttempts`)

**Fuente de Datos:**
- **API:** `/api/analytics/grades` (líneas 135-142)
- **Cálculo Actual:**
```typescript
const attemptsTotal = await prisma.examResult.count()
const attempts = attemptsTotal
```

**⚠️ PROBLEMA IDENTIFICADO:**
- ❌ **NO respeta los filtros aplicados** (cuenta TODOS los examResults)
- ❌ **No considera el período de tiempo**

**Cálculo Correcto Esperado:**
```typescript
const attempts = filteredResults.length
```

---

### 1.4 Instituciones (`kpis.institutions`)

**Fuente de Datos:**
- **API:** `/api/analytics/grades` (línea 139)
- **Cálculo Actual:**
```typescript
const institutions = await prisma.school.count()
```

**⚠️ PROBLEMA IDENTIFICADO:**
- ❌ **Cuenta TODAS las instituciones**, no solo las que tienen actividad en el período
- ❌ **No respeta el filtro de schoolId** (si se filtra por colegio, debería mostrar 1)

**Cálculo Correcto Esperado:**
```typescript
// Si hay filtro de schoolId, debería ser 1
// Si no, contar solo escuelas con actividad en el período
const institutions = schoolId 
  ? 1 
  : new Set(filteredResults.map(r => {
      const courseSchoolIds = r.exam?.course?.courseSchools?.map(cs => cs.schoolId) || []
      return courseSchoolIds[0] || r.user?.schoolId
    }).filter(Boolean)).size
```

---

## 2️⃣ MÉTRICAS DE ENGAGEMENT

### 2.1 Lecciones Completadas (`engagementMetrics.totalLessonsCompleted`)

**Fuente de Datos:**
- **API:** `/api/analytics/engagement` (líneas 45-63)
- **Cálculo:**
```typescript
prisma.studentLessonProgress.count({
  where: {
    status: 'completed',
    updatedAt: { gte: from, lte: to },
    lesson: {
      moduleLessons: {
        some: {
          module: {
            courseModules: {
              some: {
                course: whereCourse  // ✅ Respeta filtros de curso/colegio
              }
            }
          }
        }
      }
    }
  }
})
```

**✅ CORRECTO:**
- Respeta filtros de curso y colegio
- Respeta período de tiempo
- Solo cuenta lecciones completadas

---

### 2.2 Tiempo Total de Estudio (`engagementMetrics.totalStudyTimeHours`)

**Fuente de Datos:**
- **API:** `/api/analytics/engagement` (líneas 66-86)
- **Cálculo:**
```typescript
prisma.studentLessonProgress.aggregate({
  where: { /* filtros similares */ },
  _sum: { totalTimeMinutes: true }
})
const totalStudyTimeHours = Math.round((totalStudyTime._sum.totalTimeMinutes || 0) / 60 * 10) / 10
```

**✅ CORRECTO:**
- Respeta filtros
- Convierte correctamente a horas

**⚠️ OBSERVACIÓN:**
- El redondeo `* 10) / 10` deja 1 decimal, pero podría ser más preciso

---

### 2.3 Duración Promedio de Sesión (`engagementMetrics.averageSessionDurationMinutes`)

**Fuente de Datos:**
- **API:** `/api/analytics/engagement` (líneas 89-99)
- **Cálculo:**
```typescript
prisma.examResult.aggregate({
  where: {
    createdAt: { gte: from, lte: to },
    exam: { course: whereCourse }
  },
  _avg: { timeTakenMinutes: true }
})
```

**⚠️ PROBLEMA POTENCIAL:**
- ❌ **Solo considera tiempo de exámenes**, no tiempo de lecciones
- ❌ **No incluye sesiones de estudio sin exámenes**

**Mejora Sugerida:**
- Considerar también `totalTimeMinutes` de `studentLessonProgress`
- Calcular promedio combinado de sesiones de estudio y exámenes

---

### 2.4 Usuarios Activos (`engagementMetrics.activeUsers`)

**Fuente de Datos:**
- **API:** `/api/analytics/engagement` (líneas 102-123)
- **Cálculo:**
```typescript
prisma.user.count({
  where: {
    role: 'student',
    OR: [
      {
        studentLessonProgress: {
          some: {
            status: 'completed',
            updatedAt: { gte: from, lte: to }
          }
        }
      },
      {
        examResults: {
          some: {
            createdAt: { gte: from, lte: to }
          }
        }
      }
    ]
  }
})
```

**✅ CORRECTO:**
- Incluye estudiantes con lecciones completadas O exámenes realizados
- Respeta período de tiempo

**⚠️ INCONSISTENCIA:**
- Este cálculo es diferente al de `kpis.activeStudents` (que solo cuenta por exámenes)
- **Deberían usar la misma lógica**

---

### 2.5 Cursos Completados (`engagementMetrics.courseCompletions`)

**Fuente de Datos:**
- **API:** `/api/analytics/engagement` (líneas 126-132)
- **Cálculo:**
```typescript
prisma.courseEnrollment.count({
  where: {
    completedAt: { not: null },
    updatedAt: { gte: from, lte: to },
    course: whereCourse
  }
})
```

**✅ CORRECTO:**
- Respeta filtros y período

---

### 2.6 Progreso Promedio y Tasa de Finalización

**Fuente de Datos:**
- **API:** `/api/analytics/engagement` (líneas 135-171)
- **Cálculo:**
```typescript
// Solo considera últimas 7 días (hardcoded)
const lessonProgress = await prisma.studentLessonProgress.findMany({
  where: {
    updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    // ...
  }
})

const averageProgress = lessonProgress.length > 0 
  ? lessonProgress.reduce((sum, lp) => sum + (lp.status === 'completed' ? 100 : 0), 0) / lessonProgress.length
  : 0
```

**⚠️ PROBLEMAS IDENTIFICADOS:**
1. ❌ **Período hardcoded a 7 días** (no respeta el filtro `from/to`)
2. ❌ **Cálculo simplificado:** Solo considera "completado" (100%) o "no completado" (0%)
   - No considera progreso parcial (por ejemplo, 50% completado)
3. ❌ **No respeta filtros de curso/colegio** en el cálculo de progreso

**Mejora Sugerida:**
```typescript
// Usar el período from/to en lugar de hardcoded 7 días
// Considerar progreso parcial si existe en el modelo
// Aplicar filtros de curso/colegio correctamente
```

---

## 3️⃣ GRÁFICOS DE CALIFICACIONES

### 3.1 Serie Mensual (`gradeSeries`)

**Fuente de Datos:**
- **API:** `/api/analytics/grades` (líneas 146-195)
- **Cálculo:**
```typescript
// Agrupa por mes y competencia
filteredResults.forEach(r => {
  const dateToUse = r.completedAt || r.startedAt
  const key = monthKey(new Date(dateToUse))
  const comp = r.exam?.competency?.displayName || 'General'
  // ...
})
```

**✅ CORRECTO:**
- Usa `filteredResults` (respeta filtros)
- Agrupa correctamente por mes y competencia
- Calcula promedio, tasa de aprobación e intentos por período

**⚠️ OBSERVACIÓN:**
- Usa `completedAt || startedAt` como fallback (correcto para exámenes en progreso)

---

### 3.2 Distribución de Calificaciones (`gradeDistribution`)

**Fuente de Datos:**
- **API:** `/api/analytics/grades` (líneas 201-207)
- **Cálculo:**
```typescript
const buckets = [
  { label: '0-40', min: 0, max: 40 },
  { label: '41-60', min: 41, max: 60 },
  { label: '61-80', min: 61, max: 80 },
  { label: '81-100', min: 81, max: 100 },
]
const distribution = buckets.map(b => ({ 
  rango: b.label, 
  estudiantes: filteredResults.filter(r => r.score >= b.min && r.score <= b.max).length 
}))
```

**✅ CORRECTO:**
- Usa `filteredResults`
- Buckets razonables

---

### 3.3 Ranking por Institución (`schoolRanking`)

**Fuente de Datos:**
- **API:** `/api/analytics/grades` (líneas 210-225)
- **Cálculo:**
```typescript
filteredResults.forEach(r => {
  const courseSchoolIds = r.exam?.course?.courseSchools?.map(cs => cs.schoolId) || []
  const sid = courseSchoolIds[0] || (r.user as any)?.schoolId
  // ...
})
```

**⚠️ PROBLEMA POTENCIAL:**
- ❌ **Usa `courseSchoolIds[0]`** (primer colegio del curso)
  - Si un curso está asociado a múltiples colegios, solo cuenta el primero
  - Podría duplicar o perder datos si un estudiante pertenece a un colegio diferente

**Mejora Sugerida:**
- Priorizar `user.schoolId` sobre `course.courseSchools[0]`
- O considerar todos los colegios asociados al curso

---

### 3.4 Actividad por Hora (`hourlyActivity`)

**Fuente de Datos:**
- **API:** `/api/analytics/grades` (líneas 228-234)
- **Cálculo:**
```typescript
const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }))
filteredResults.forEach(r => {
  const dateToUse = r.completedAt || r.startedAt
  const h = new Date(dateToUse).getHours()
  hourly[h].count += 1
})
```

**✅ CORRECTO:**
- Usa `filteredResults`
- Distribuye correctamente por hora (0-23)

---

## 4️⃣ REPORTES DE COMPETENCIAS

### 4.1 Reporte por Competencia (`compReportRows`)

**Fuente de Datos:**
- **API:** `/api/reports/competencies` (líneas 28-79)
- **Cálculo:**
```typescript
const results = await prisma.examResult.findMany({
  where: whereER,
  include: { exam: { include: { competency: true, course: whereCourse } } }
})

const filtered = results.filter(r => {
  // Filtros aplicados después del query
  if (courseId && r.exam?.courseId !== courseId) return false
  if (competencyId && r.exam?.competencyId !== competencyId) return false
  // ...
})
```

**⚠️ PROBLEMA IDENTIFICADO:**
- ❌ **Filtrado post-query** (ineficiente)
- ❌ **No respeta filtro de schoolId correctamente** (línea 43: lógica incompleta)
- ❌ **Filtro de academicGrade no se aplica** (línea 26: se define pero no se usa en el where)

**Mejora Sugerida:**
- Aplicar filtros directamente en el `where` de Prisma
- Corregir lógica de filtro por schoolId (usar `courseSchools`)

---

## 5️⃣ VISTA DE ESTUDIANTES

### 5.1 Tabla de Estudiantes con Métricas

**Fuente de Datos:**
- **API:** `/api/admin/students/metrics` (no revisada en detalle, pero se usa en el componente)

**Observaciones:**
- Muestra métricas individuales por estudiante
- Permite filtros y búsqueda
- Exportación a Excel disponible

---

## 6️⃣ PROBLEMAS CRÍTICOS IDENTIFICADOS

### 🔴 CRÍTICO 1: KPIs NO respetan filtros
**Archivo:** `app/api/analytics/grades/route.ts` (líneas 135-143)
- Los KPIs se calculan sobre TODOS los datos, ignorando filtros
- Deberían calcularse sobre `filteredResults`

### 🔴 CRÍTICO 2: Inconsistencia en "Estudiantes Activos"
- `kpis.activeStudents`: Solo cuenta por exámenes
- `engagementMetrics.activeUsers`: Cuenta por lecciones O exámenes
- **Deberían usar la misma definición**

### 🟡 MEDIO 1: Progreso Promedio hardcoded a 7 días
**Archivo:** `app/api/analytics/engagement/route.ts` (línea 137)
- No respeta el período `from/to` del filtro
- Debería usar el período seleccionado

### 🟡 MEDIO 2: Filtrado post-query en Competencias
**Archivo:** `app/api/reports/competencies/route.ts`
- Ineficiente: trae todos los datos y luego filtra
- Debería aplicar filtros en el query de Prisma

### 🟡 MEDIO 3: Ranking por Institución usa primer colegio
**Archivo:** `app/api/analytics/grades/route.ts` (línea 214)
- Si un curso tiene múltiples colegios, solo cuenta el primero
- Debería priorizar `user.schoolId`

---

## 7️⃣ MEJORAS SUGERIDAS

### 7.1 Correcciones Urgentes

1. **Corregir cálculo de KPIs para respetar filtros:**
```typescript
// En app/api/analytics/grades/route.ts
// Reemplazar líneas 135-143 con:
const activeStudents = new Set(filteredResults.map(r => r.userId)).size
const attempts = filteredResults.length
const avgScore = filteredResults.length > 0
  ? Number((filteredResults.reduce((sum, r) => sum + r.score, 0) / filteredResults.length).toFixed(1))
  : 0
const institutions = schoolId 
  ? 1 
  : new Set(filteredResults.map(r => {
      const courseSchoolIds = r.exam?.course?.courseSchools?.map(cs => cs.schoolId) || []
      return courseSchoolIds[0] || r.user?.schoolId
    }).filter(Boolean)).size
```

2. **Unificar definición de "Estudiantes Activos":**
   - Usar la misma lógica en KPIs y Engagement
   - Incluir estudiantes con lecciones completadas O exámenes realizados

3. **Corregir período en Progreso Promedio:**
```typescript
// En app/api/analytics/engagement/route.ts
// Reemplazar línea 137 con:
updatedAt: { gte: from, lte: to },  // Usar from/to en lugar de 7 días hardcoded
```

### 7.2 Optimizaciones

1. **Aplicar filtros en queries de Prisma** (no post-query)
2. **Agregar índices en campos frecuentemente filtrados:**
   - `examResult.completedAt`
   - `examResult.startedAt`
   - `studentLessonProgress.updatedAt`
   - `examResult.userId`
   - `exam.courseId`
   - `exam.competencyId`

3. **Cache más inteligente:**
   - Invalidar cache cuando cambian datos relevantes
   - Cache separado por tipo de filtro

### 7.3 Mejoras de UX

1. **Indicadores de carga por sección** (no solo general)
2. **Tooltips explicativos** en todas las métricas (ya implementado parcialmente)
3. **Exportación de datos filtrados** (no solo todos los datos)

---

## 8️⃣ VERIFICACIÓN DE USO DE BASE DE DATOS

### ✅ Correcto:
- Uso de Prisma ORM (seguro y type-safe)
- Relaciones correctamente definidas
- Filtros de RBAC aplicados (school_admin solo ve su colegio)

### ⚠️ Mejorable:
- Algunos filtros se aplican post-query (ineficiente)
- Falta de índices en campos filtrados frecuentemente
- Cache básico (10 minutos) pero no se invalida automáticamente

### ❌ Problemas:
- KPIs no respetan filtros (crítico)
- Inconsistencias en definiciones de métricas
- Períodos hardcoded en algunos cálculos

---

## 📝 CONCLUSIÓN

**Estado General:** ✅ **CORREGIDO - Problemas críticos resueltos**

**Cambios Aplicados:**
1. ✅ **CORREGIDO:** KPIs ahora respetan filtros aplicados
2. ✅ **CORREGIDO:** Definición de "Estudiantes Activos" unificada (incluye lecciones O exámenes)
3. ✅ **CORREGIDO:** Período en progreso promedio ahora usa from/to en lugar de hardcoded 7 días
4. ✅ **CORREGIDO:** Filtros optimizados en `/api/reports/competencies` (aplicados en Prisma)
5. ✅ **CORREGIDO:** Ranking por institución prioriza `user.schoolId` sobre `course.courseSchools[0]`
6. ✅ **CORREGIDO:** Cálculo de instituciones respeta filtros y cuenta solo escuelas con actividad

**Archivos Modificados:**
- `app/api/analytics/grades/route.ts` - KPIs corregidos, activeStudents unificado
- `app/api/analytics/engagement/route.ts` - Período corregido
- `app/api/reports/competencies/route.ts` - Filtros optimizados

**Mejoras Pendientes (Opcionales):**
- 🟢 Agregar índices en campos filtrados frecuentemente
- 🟢 Cache más inteligente con invalidación automática
- 🟢 Indicadores de carga por sección

