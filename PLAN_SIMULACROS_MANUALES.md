# 📋 Plan: Sistema de Simulacros Completos Manuales

## 🎯 Objetivo

Crear un sistema separado para exámenes de simulacro completo que:
- Se crean **manualmente** (no automáticamente)
- Son **predefinidos** por EducaSaber
- Se **asignan** a colegios/estudiantes específicos
- Tienen preguntas con **metadatos adicionales** (tema, subtema, componente)
- Generan **reportes específicos** organizados por estos metadatos

---

## 📊 FASE 1: Análisis del Estado Actual

### ✅ Lo que YA tenemos:

1. **Modelo `Exam`**:
   - ✅ `examType` (incluye 'simulacro_completo')
   - ✅ `isIcfesExam` (flag para identificar exámenes ICFES)
   - ✅ `courseId`, `competencyId` (relaciones opcionales)
   - ✅ `isPublished`, `openDate`, `closeDate`
   - ✅ `createdById` (quién lo creó)

2. **Modelo `ExamQuestion`**:
   - ✅ Contenido completo (pregunta, opciones, respuesta correcta)
   - ✅ `difficultyLevel` (facil, intermedio, dificil)
   - ✅ `competencyId` (a través de Exam)
   - ❌ **FALTA**: `tema`, `subtema`, `componente`

3. **Modelo `ExamResult`**:
   - ✅ Resultados completos (score, correctAnswers, etc.)
   - ✅ `resultsByCompetency` (JSON string)
   - ❌ **FALTA**: Resultados organizados por tema, subtema, componente

4. **Relaciones**:
   - ✅ Exam → Course (opcional)
   - ✅ Exam → Competency (opcional)
   - ❌ **FALTA**: Exam → School (asignación directa)
   - ❌ **FALTA**: Exam → User/Student (asignación directa)

---

## 🔧 FASE 2: Cambios en Base de Datos

### 2.1 Agregar Campos a `ExamQuestion`

**Campos a agregar:**
```prisma
model ExamQuestion {
  // ... campos existentes ...
  
  // Nuevos campos para simulacros manuales
  tema        String? // Tema de la pregunta
  subtema     String? // Subtema de la pregunta
  componente  String? // Componente ICFES (ej: "Lectura Crítica - Comprensión")
  
  // Nota: competencyId ya existe a través de Exam, pero podemos agregarlo directamente
  competencyId String? // Competencia directa (opcional, puede venir de Exam)
  competency   Competency? @relation(fields: [competencyId], references: [id])
}
```

### 2.2 Crear Tabla de Asignación a Colegios

**Nueva tabla `ExamSchool`:**
```prisma
model ExamSchool {
  id        String   @id @default(cuid())
  examId    String
  exam      Exam     @relation(fields: [examId], references: [id], onDelete: Cascade)
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  // Configuración específica por colegio
  openDate  DateTime? // Fecha de apertura específica para este colegio
  closeDate DateTime? // Fecha de cierre específica para este colegio
  isActive  Boolean  @default(true) // Si está activo para este colegio
  
  @@unique([examId, schoolId])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Agregar a `Exam`:**
```prisma
model Exam {
  // ... campos existentes ...
  
  examSchools ExamSchool[] // Nueva relación
}
```

**Agregar a `School`:**
```prisma
model School {
  // ... campos existentes ...
  
  examSchools ExamSchool[] // Nueva relación
}
```

### 2.3 Crear Tabla de Asignación a Estudiantes

**Nueva tabla `ExamAssignment`:**
```prisma
model ExamAssignment {
  id        String   @id @default(cuid())
  examId    String
  exam      Exam     @relation(fields: [examId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Configuración específica por estudiante
  openDate  DateTime? // Fecha de apertura específica para este estudiante
  closeDate DateTime? // Fecha de cierre específica para este estudiante
  isActive  Boolean  @default(true) // Si está activo para este estudiante
  
  assignedById String? // Quién asignó el examen
  assignedBy   User?   @relation("ExamAssigner", fields: [assignedById], references: [id])
  
  @@unique([examId, userId])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Agregar a `Exam`:**
```prisma
model Exam {
  // ... campos existentes ...
  
  examAssignments ExamAssignment[] // Nueva relación
}
```

**Agregar a `User`:**
```prisma
model User {
  // ... campos existentes ...
  
  examAssignments ExamAssignment[] // Exámenes asignados
  assignedExams   ExamAssignment[] @relation("ExamAssigner") // Exámenes que asignó (si es admin)
}
```

### 2.4 Agregar Flag para Simulacros Manuales

**Agregar a `Exam`:**
```prisma
model Exam {
  // ... campos existentes ...
  
  isManualSimulacro Boolean @default(false) // Si es simulacro creado manualmente
  isPredefined      Boolean @default(false) // Si es un examen predefinido de EducaSaber
}
```

### 2.5 Extender `ExamResult` para Reportes Detallados

**Agregar a `ExamResult`:**
```prisma
model ExamResult {
  // ... campos existentes ...
  
  // Resultados organizados por metadatos (para reportes)
  resultsByTema       String? // JSON: { "tema1": { correct: 5, total: 10 }, ... }
  resultsBySubtema    String? // JSON: { "subtema1": { correct: 3, total: 5 }, ... }
  resultsByComponente String? // JSON: { "componente1": { correct: 8, total: 12 }, ... }
  resultsByCompetency String? // Ya existe, pero mejorarlo
}
```

---

## 🎨 FASE 3: Nueva Sección de Administración

### 3.1 Componente Principal: `ManualSimulacroManagement.tsx`

**Ubicación:** `components/ManualSimulacroManagement.tsx`

**Funcionalidades:**
- Lista de simulacros predefinidos
- Crear nuevo simulacro manual
- Editar simulacro existente
- Asignar simulacro a colegios/estudiantes
- Vista previa del simulacro
- Gestión de preguntas (agregar, editar, eliminar)

### 3.2 Formulario de Creación: `ManualSimulacroForm.tsx`

**Campos del formulario:**
- Título
- Descripción
- Tiempo límite
- Puntaje de aprobación
- Fechas de apertura/cierre (opcionales)
- Flag: "Es predefinido de EducaSaber"

### 3.3 Editor de Preguntas: `ManualSimulacroQuestionEditor.tsx`

**Funcionalidades:**
- Agregar pregunta manualmente
- Editar pregunta existente
- Eliminar pregunta
- Campos por pregunta:
  - Texto de la pregunta
  - Opciones (A, B, C, D)
  - Respuesta correcta
  - Explicación
  - **Tema** (nuevo)
  - **Subtema** (nuevo)
  - **Competencia** (selector)
  - **Componente** (nuevo)
  - **Dificultad** (ya existe)

### 3.4 Asignación a Colegios/Estudiantes: `SimulacroAssignment.tsx`

**Funcionalidades:**
- Buscar colegios
- Seleccionar múltiples colegios
- Configurar fechas específicas por colegio
- Buscar estudiantes
- Seleccionar múltiples estudiantes
- Configurar fechas específicas por estudiante
- Ver asignaciones actuales

---

## 🔌 FASE 4: APIs Backend

### 4.1 API de Simulacros Manuales

**`app/api/manual-simulacros/route.ts`**
- `GET`: Listar simulacros manuales (filtros: isPredefined, isPublished)
- `POST`: Crear nuevo simulacro manual

**`app/api/manual-simulacros/[id]/route.ts`**
- `GET`: Obtener simulacro con preguntas
- `PUT`: Actualizar simulacro
- `DELETE`: Eliminar simulacro

### 4.2 API de Preguntas de Simulacro

**`app/api/manual-simulacros/[id]/questions/route.ts`**
- `GET`: Listar preguntas del simulacro
- `POST`: Agregar pregunta al simulacro
- `PUT`: Actualizar pregunta
- `DELETE`: Eliminar pregunta

### 4.3 API de Asignaciones

**`app/api/manual-simulacros/[id]/assign-schools/route.ts`**
- `POST`: Asignar simulacro a múltiples colegios
- `DELETE`: Remover asignación

**`app/api/manual-simulacros/[id]/assign-students/route.ts`**
- `POST`: Asignar simulacro a múltiples estudiantes
- `DELETE`: Remover asignación

**`app/api/manual-simulacros/[id]/assignments/route.ts`**
- `GET`: Obtener todas las asignaciones (colegios + estudiantes)

### 4.4 API de Disponibilidad para Estudiantes

**`app/api/student/manual-simulacros/route.ts`**
- `GET`: Listar simulacros disponibles para el estudiante
  - Filtra por:
    - Asignación directa (`ExamAssignment`)
    - Asignación a su colegio (`ExamSchool`)
    - Fechas de apertura/cierre
    - Estado activo

---

## 📊 FASE 5: Reportes Específicos

### 5.1 Componente de Reporte: `ManualSimulacroReport.tsx`

**Vista de Reporte Individual (por estudiante):**
- Puntaje general
- Resultados por **Competencia**
- Resultados por **Componente**
- Resultados por **Tema**
- Resultados por **Subtema**
- Resultados por **Dificultad**
- Gráficas de barras/torta para cada categoría
- Tabla detallada pregunta por pregunta

**Vista de Reporte Agregado (por colegio/grupo):**
- Promedio general
- Distribución de puntajes
- Resultados agregados por competencia/componente/tema/subtema
- Comparación entre estudiantes
- Exportar a PDF/Excel

### 5.2 API de Reportes

**`app/api/manual-simulacros/[id]/report/route.ts`**
- `GET`: Generar reporte del simulacro
  - Parámetros: `studentId?`, `schoolId?`, `groupId?`
  - Retorna datos organizados por metadatos

**`app/api/manual-simulacros/[id]/report/export/route.ts`**
- `GET`: Exportar reporte a PDF
  - Usa Puppeteer (ya existe en el proyecto)

---

## 🔄 FASE 6: Integración con Sistema Existente

### 6.1 Modificar Lógica de Disponibilidad

**En `app/api/student/exams/route.ts`:**
- Agregar lógica para incluir simulacros manuales asignados
- Verificar `ExamAssignment` y `ExamSchool`

**En `app/api/student/exams/start/route.ts`:**
- Verificar que el estudiante tenga acceso (asignación directa o a través de colegio)

### 6.2 Modificar Calificación

**En `app/api/student/exams/[attemptId]/submit/route.ts`:**
- Al calificar, calcular resultados por tema, subtema, componente
- Guardar en `resultsByTema`, `resultsBySubtema`, `resultsByComponente`

### 6.3 Separar Vistas

- **Exámenes normales**: Siguen funcionando como antes
- **Simulacros manuales**: Nueva sección separada
- Los estudiantes ven ambos en su lista, pero claramente diferenciados

---

## 📝 FASE 7: Migración de Datos

### 7.1 Script de Migración

**`prisma/migrations/XXXX_add_manual_simulacros/migration.sql`**
- Agregar campos a `ExamQuestion`
- Crear tablas `ExamSchool` y `ExamAssignment`
- Agregar campos a `Exam` y `ExamResult`
- Migrar datos existentes si es necesario

### 7.2 Seed de Datos de Ejemplo

Crear algunos simulacros predefinidos de ejemplo con preguntas completas.

---

## ✅ Checklist de Implementación

### Base de Datos:
- [ ] Agregar campos `tema`, `subtema`, `componente` a `ExamQuestion`
- [ ] Agregar `competencyId` directo a `ExamQuestion` (opcional)
- [ ] Crear tabla `ExamSchool`
- [ ] Crear tabla `ExamAssignment`
- [ ] Agregar campos `isManualSimulacro`, `isPredefined` a `Exam`
- [ ] Agregar campos de resultados detallados a `ExamResult`
- [ ] Crear migración
- [ ] Ejecutar migración

### Backend APIs:
- [ ] `GET/POST /api/manual-simulacros`
- [ ] `GET/PUT/DELETE /api/manual-simulacros/[id]`
- [ ] `GET/POST/PUT/DELETE /api/manual-simulacros/[id]/questions`
- [ ] `POST/DELETE /api/manual-simulacros/[id]/assign-schools`
- [ ] `POST/DELETE /api/manual-simulacros/[id]/assign-students`
- [ ] `GET /api/manual-simulacros/[id]/assignments`
- [ ] `GET /api/student/manual-simulacros`
- [ ] Modificar lógica de calificación para calcular resultados por metadatos
- [ ] `GET /api/manual-simulacros/[id]/report`
- [ ] `GET /api/manual-simulacros/[id]/report/export`

### Frontend:
- [ ] Crear `ManualSimulacroManagement.tsx`
- [ ] Crear `ManualSimulacroForm.tsx`
- [ ] Crear `ManualSimulacroQuestionEditor.tsx`
- [ ] Crear `SimulacroAssignment.tsx`
- [ ] Crear `ManualSimulacroReport.tsx`
- [ ] Agregar ruta en admin panel
- [ ] Integrar con vista de estudiantes
- [ ] Agregar tipos TypeScript

### Testing:
- [ ] Probar creación de simulacro
- [ ] Probar agregar/editar preguntas
- [ ] Probar asignación a colegios
- [ ] Probar asignación a estudiantes
- [ ] Probar toma de examen por estudiante
- [ ] Probar calificación y resultados
- [ ] Probar reportes

---

## 🎯 Próximos Pasos Inmediatos

1. **Revisar y aprobar el plan**
2. **Crear migración de base de datos**
3. **Implementar modelos y relaciones**
4. **Crear APIs básicas**
5. **Crear componentes de UI**
6. **Integrar con sistema existente**

---

¿Quieres que empecemos con la FASE 2 (cambios en base de datos) o prefieres revisar/ajustar algo del plan primero?

