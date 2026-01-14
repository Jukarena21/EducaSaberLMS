# Plan de Acción: Mejoras de Vista de Estudiantes para Admin Colegio

## 🎨 Estilo Visual a Mantener

### Patrones de Diseño Identificados:

1. **Cards con Gradientes Suaves**:
   - `bg-gradient-to-br from-[color]-50 to-[color]-100`
   - `border-[color]-200`
   - `hover:shadow-lg transition-all duration-300`
   - `rounded-lg`

2. **Iconos en Círculos**:
   - `p-3 bg-[color]-200 rounded-full`
   - Iconos `h-6 w-6 text-[color]-700`

3. **Tipografía**:
   - Números grandes: `text-3xl font-bold text-[color]-700`
   - Labels: `text-sm text-[color]-600 font-medium`
   - Subtítulos: `text-xs text-[color]-500`

4. **Paleta de Colores**:
   - Azul: `blue-50/100/200/600/700` (información, cursos)
   - Verde: `green-50/100/200/600/700` (éxito, completado)
   - Púrpura: `purple-50/100/200/600/700` (tiempo, estadísticas)
   - Naranja: `orange-50/100/200/600/700` (promedios, alertas)
   - Rojo: `red-50/100/200/600/700` (atención, crítico)

5. **Headers de Secciones**:
   - `bg-gradient-to-r from-[color]-50 to-[color]-50 border-[color]-200`
   - Iconos `h-5 w-5 text-[color]-600`
   - Títulos con `flex items-center gap-2`

6. **Badges**:
   - `bg-[color]-100 text-[color]-800` (suaves)
   - `bg-[color]-500 text-white` (destacados)

---

## 📋 Fases de Implementación

### **FASE 1: API de Métricas Individuales** ⚡ PRIORITARIA

**Archivo**: `app/api/admin/students/metrics/route.ts`

**Endpoint**: `GET /api/admin/students/metrics?studentId=xxx&schoolId=xxx`

**Datos a Retornar**:
```typescript
{
  studentId: string
  studentName: string
  studentEmail: string
  academicGrade: string
  
  // Métricas de Exámenes
  totalExams: number
  averageScore: number
  passRate: number
  lastExamDate: string | null
  
  // Métricas de Progreso
  totalStudyTimeHours: number
  averageCourseProgress: number
  completedCourses: number
  activeCourses: number
  
  // Métricas por Competencia
  competencyPerformance: Array<{
    competencyId: string
    competencyName: string
    averageScore: number
    examsCount: number
    passRate: number
  }>
  
  // Evolución Temporal (últimos 6 meses)
  monthlyEvolution: Array<{
    month: string
    averageScore: number
    examsCount: number
  }>
  
  // Estado
  status: 'excelente' | 'bueno' | 'mejorable' | 'requiere_atencion'
  lastActivity: string | null
  riskFactors: string[]
}
```

**Lógica a Reutilizar**:
- De `export-puppeteer/route.ts`: Cálculo de promedios, evolución temporal
- De `progress/competencies/route.ts`: Progreso por competencia
- Consultas Prisma: `ExamResult`, `StudentLessonProgress`, `StudentCourseProgress`

---

### **FASE 2: Actualizar Vista de Estudiantes con Datos Reales**

**Archivo**: `app/admin/page.tsx` (sección Vista de Estudiantes)

**Cambios**:
1. Crear hook `useStudentMetrics(studentId)` que llame a la nueva API
2. Reemplazar placeholders en la tabla con datos reales
3. Agregar indicadores de estado visuales (badges con colores según rendimiento)
4. Implementar identificación real de estudiantes en riesgo:
   - `averageScore < 70`
   - `passRate < 50%`
   - `lastActivity > 30 días`
   - `totalExams < 3`

**Estilo Visual**:
- Tabla con hover effects
- Badges de estado: Verde (excelente), Azul (bueno), Amarillo (mejorable), Rojo (atención)
- Cards de estudiantes en riesgo con `bg-orange-50 border-orange-200`

---

### **FASE 3: Comparaciones Temporales**

**Archivo**: `app/admin/page.tsx` (nueva sección en Analytics)

**Gráficos a Agregar**:
1. **Evolución de Promedio Mensual** (Recharts LineChart)
   - Últimos 6 meses
   - Línea con promedio del estudiante
   - Opcional: Línea con promedio del colegio
   - Estilo: `stroke-[#73A2D3]` (azul principal)

2. **Comparación Período Actual vs Anterior**
   - Card con dos columnas
   - Badges con variación (+/- porcentaje)
   - Iconos TrendingUp/TrendingDown

3. **Tendencias por Competencia**
   - Gráfico de barras agrupadas
   - Comparar mes actual vs mes anterior por competencia

4. **Actividad Temporal**
   - Gráfico de área (AreaChart)
   - Exámenes realizados por mes
   - `fill="#73A2D3" fillOpacity={0.3}`

**Estilo Visual**:
- Cards con `bg-gradient-to-br from-blue-50 to-indigo-50`
- Headers con iconos `BarChart3`, `TrendingUp`, `Activity`
- Gráficos dentro de Cards con padding adecuado

---

### **FASE 4: Exportación Avanzada**

**Archivo**: `app/admin/page.tsx` (función de exportación)

**Funcionalidad**:
- Botón "Exportar Lista de Estudiantes" en la sección de Vista de Estudiantes
- Exportar a CSV con todas las métricas
- Nombre de archivo: `estudiantes_metricas_[fecha].csv`

**Columnas CSV**:
```
Nombre, Email, Grado, Colegio, Total Exámenes, Promedio, Tasa Aprobación, 
Tiempo Estudio (h), Progreso Promedio, Última Actividad, Estado
```

**Estilo Visual**:
- Botón con `bg-gradient-to-r from-blue-600 to-purple-600`
- Icono `Download`
- Toast notification al completar

---

### **FASE 5: Modal de Detalles del Estudiante**

**Archivo**: `components/StudentDetailModal.tsx` (nuevo componente)

**Estructura del Modal**:
1. **Header**:
   - Nombre del estudiante
   - Badge de estado
   - Botón cerrar

2. **Tabs dentro del Modal**:
   - **Resumen**: KPIs principales (4 cards con gradientes)
   - **Evolución**: Gráfico de línea temporal
   - **Competencias**: Gráfico radar o barras
   - **Exámenes**: Tabla de historial
   - **Cursos**: Lista de cursos con progreso

3. **Acciones Rápidas**:
   - Botón "Generar Informe PDF" (reutilizar export-puppeteer)
   - Botón "Ver Progreso Completo"

**Estilo Visual**:
- Modal con `Dialog` de shadcn/ui
- Cards internos con mismo estilo de gradientes
- Tabs con estilo consistente
- Gráficos con colores de la paleta

**Datos**:
- Endpoint: `GET /api/admin/students/[studentId]/details`
- Reutilizar lógica de `export-puppeteer` para datos completos

---

### **FASE 6: Gráficos Individuales en Modal**

**Archivo**: `components/StudentDetailModal.tsx` (sección de gráficos)

**Gráficos a Implementar**:
1. **Evolución de Notas** (LineChart)
   - Eje X: Meses
   - Eje Y: Puntaje (0-100)
   - Línea azul `#73A2D3`
   - Puntos con hover tooltip

2. **Distribución de Calificaciones** (BarChart o Histograma)
   - Rangos: 0-59, 60-69, 70-79, 80-100
   - Colores: rojo, naranja, amarillo, verde

3. **Rendimiento por Competencia** (RadarChart o BarChart)
   - Similar al del reporte PDF
   - Comparar con promedio del colegio si está disponible

4. **Actividad Semanal** (AreaChart o BarChart)
   - Días de la semana
   - Tiempo de estudio o exámenes realizados

**Estilo Visual**:
- Contenedores con `ResponsiveContainer`
- Colores consistentes con la paleta
- Tooltips con información detallada
- Leyendas claras

---

## 🔄 Orden de Implementación Recomendado

1. ✅ **FASE 1**: API de métricas (base para todo)
2. ✅ **FASE 2**: Actualizar vista con datos reales
3. ✅ **FASE 5**: Modal de detalles (más valor inmediato)
4. ✅ **FASE 3**: Comparaciones temporales
5. ✅ **FASE 4**: Exportación
6. ✅ **FASE 6**: Gráficos individuales (mejora del modal)

---

## 📊 Datos Disponibles en DB (Verificado)

### User Model:
- Información personal, académica, métricas de plataforma
- `totalPlatformTimeMinutes`, `sessionsStarted`, `lastSessionAt`

### ExamResult Model:
- `score`, `totalQuestions`, `correctAnswers`, `timeTakenMinutes`
- `startedAt`, `completedAt`, `isPassed`
- Relación con `Exam` (que tiene `competencyId`)

### StudentLessonProgress Model:
- `status`, `totalTimeMinutes`, `completedAt`
- Relación con `Lesson` (que tiene módulo con competencia)

### StudentCourseProgress Model:
- `progressPercentage`, `totalTimeMinutes`, `completedAt`
- Relación con `Course`

### CourseEnrollment Model:
- `isActive`, `enrolledAt`
- Relación con `Course` y `User`

---

## 🎯 Criterios de Éxito

- ✅ Datos 100% reales de la base de datos
- ✅ Estilo visual consistente con dashboard estudiante
- ✅ Performance: Carga rápida (< 2s)
- ✅ Responsive: Funciona en móvil y desktop
- ✅ Accesibilidad: Navegación por teclado, contraste adecuado
- ✅ UX: Filtros intuitivos, información clara y accionable

---

## 🚀 Inicio de Implementación

¿Listo para comenzar con la FASE 1?

