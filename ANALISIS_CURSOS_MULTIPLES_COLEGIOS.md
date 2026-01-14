# Análisis: Cursos con Múltiples Colegios/Entidades

## 🎯 Objetivo del Cambio

Permitir que los cursos:
1. **No estén asignados a ningún colegio** (ya existe con `schoolId = null`)
2. **Puedan asignarse a múltiples colegios/entidades**
3. **Puedan asignarse a empresas o entidades del estado** (no solo colegios)

## 📊 Cambios Propuestos en el Esquema

### **Opción 1: Tabla Intermedia Simple (Recomendada)**

```prisma
// Eliminar de Course:
// schoolId String?
// school   School? @relation(...)

// Agregar nueva tabla intermedia:
model CourseSchool {
  id        String @id @default(cuid())
  courseId  String
  course    Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  schoolId  String
  school    School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  @@unique([courseId, schoolId])
  createdAt DateTime @default(now())
}

// En Course, agregar:
courseSchools CourseSchool[]
```

**Ventajas:**
- ✅ Simple y directo
- ✅ Mantiene compatibilidad con el concepto de "School"
- ✅ Fácil de migrar

**Desventajas:**
- ⚠️ No soporta directamente "empresas" o "entidades del estado" (solo colegios)
- ⚠️ Requiere extender el modelo `School` para incluir otros tipos

### **Opción 2: Modelo Genérico "Organization" (Más Flexible)**

```prisma
model Organization {
  id          String @id @default(cuid())
  name        String
  type        String // 'school', 'company', 'government_entity', 'other'
  // ... campos comunes (contactEmail, contactPhone, etc.)
  
  courseOrganizations CourseOrganization[]
  createdAt DateTime @default(now())
}

model CourseOrganization {
  id              String @id @default(cuid())
  courseId        String
  course          Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@unique([courseId, organizationId])
  createdAt DateTime @default(now())
}
```

**Ventajas:**
- ✅ Muy flexible, soporta cualquier tipo de entidad
- ✅ Escalable para futuros tipos de organizaciones
- ✅ Separación clara entre tipos de entidades

**Desventajas:**
- ⚠️ Cambio más grande (requiere migrar `School` a `Organization`)
- ⚠️ Más complejo de implementar
- ⚠️ Requiere migración de datos existentes

### **Opción 3: Híbrida - Extender School con Type (Balanceada)**

```prisma
// En School, agregar:
type String @default('school') // 'school', 'company', 'government_entity', 'other'

// Tabla intermedia:
model CourseSchool {
  id        String @id @default(cuid())
  courseId  String
  course    Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  schoolId  String
  school    School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  @@unique([courseId, schoolId])
  createdAt DateTime @default(now())
}
```

**Ventajas:**
- ✅ Reutiliza el modelo `School` existente
- ✅ Cambio mínimo en el esquema
- ✅ Soporta diferentes tipos de entidades
- ✅ Migración más simple

**Desventajas:**
- ⚠️ El nombre "School" puede ser confuso para empresas/entidades
- ⚠️ Algunos campos de `School` pueden no aplicar a empresas

## 🔍 Impacto en el Código Actual

### **1. Esquema de Base de Datos**

**Archivos afectados:**
- `prisma/schema.prisma` - Cambio principal
- Migraciones de Prisma

**Cambios necesarios:**
- Eliminar `schoolId` y `school` de `Course`
- Crear tabla intermedia `CourseSchool` o `CourseOrganization`
- Posiblemente agregar `type` a `School` si usamos Opción 3

### **2. API Endpoints**

**Archivos que usan `course.schoolId` o filtran por `schoolId`:**

1. **`app/api/courses/route.ts`** (GET, POST)
   - **Línea 30-34:** Filtra cursos por `schoolId` para `school_admin`
   - **Cambio:** Usar `courseSchools: { some: { schoolId: ... } }` o `OR` con `null`

2. **`app/api/courses/[id]/route.ts`** (GET, PUT, DELETE)
   - Probablemente incluye `school` en el response
   - **Cambio:** Incluir `courseSchools` con `school` en lugar de `school`

3. **`app/api/student/courses/available/route.ts`**
   - **Línea 45-72:** Filtra cursos disponibles por `schoolId` del estudiante
   - **Cambio:** Verificar si el curso tiene `schoolId = null` (general) O si el estudiante pertenece a algún `schoolId` del curso

4. **`app/api/reports/summary/route.ts`**
   - **Línea 34:** Filtra por `schoolId` en `whereCourse`
   - **Cambio:** Usar `courseSchools: { some: { schoolId: ... } }`

5. **`app/api/analytics/engagement/route.ts`**
   - Probablemente filtra por `schoolId`
   - **Cambio:** Similar a reports/summary

6. **`app/api/analytics/grades/route.ts`**
   - Probablemente filtra por `schoolId`
   - **Cambio:** Similar a reports/summary

7. **`app/api/admin/students/metrics/route.ts`**
   - Filtra estudiantes por `schoolId`
   - **Cambio:** Menor impacto, pero puede necesitar ajustes en filtros de cursos

8. **`app/api/admin/analytics/export-bulk-report/route.ts`**
   - Filtra cursos por `schoolId`
   - **Cambio:** Usar relación `courseSchools`

### **3. Componentes Frontend**

**Archivos afectados:**

1. **`components/CourseForm.tsx`**
   - **Línea 46, 59, 203-224:** Maneja `schoolId` como campo único
   - **Cambio:** Cambiar a selección múltiple (checkboxes o multi-select)
   - Agregar opción "Sin asignar" o "Curso general"

2. **`components/CourseManagement.tsx`**
   - **Línea 78, 261-280:** Filtra por `selectedSchool`
   - **Cambio:** El filtro puede seguir funcionando, pero mostrar cursos que tengan ese colegio asignado

3. **`components/CourseCatalog.tsx`** (si existe)
   - Muestra cursos disponibles para estudiantes
   - **Cambio:** Lógica de visibilidad debe considerar múltiples `schoolId`

### **4. Hooks Personalizados**

1. **`hooks/useCourses.ts`**
   - Probablemente filtra por `schoolId`
   - **Cambio:** Ajustar filtros

2. **`hooks/useCoursesBySchool.ts`**
   - Específicamente para filtrar por colegio
   - **Cambio:** Cambiar nombre o lógica para manejar múltiples colegios

### **5. Lógica de Visibilidad para Estudiantes**

**Reglas actuales:**
- Estudiante ve cursos donde `course.schoolId = null` (generales) O `course.schoolId = student.schoolId`

**Reglas nuevas:**
- Estudiante ve cursos donde:
  - `courseSchools` está vacío (curso sin asignar = general para todos) O
  - Existe `CourseSchool` con `schoolId = student.schoolId`

### **6. Lógica de Permisos para Admins**

**`school_admin`:**
- Actualmente: Solo ve/crea cursos con `schoolId = su colegio`
- Nuevo: Ve/crea cursos que tengan su colegio en `courseSchools` O cursos sin asignar

**`teacher_admin`:**
- Actualmente: Ve todos los cursos, puede crear para cualquier colegio
- Nuevo: Ve todos los cursos, puede asignar a múltiples colegios

## 📋 Plan de Implementación (Opción 3 Recomendada)

### **Fase 1: Cambios en el Esquema**

1. Agregar `type` a `School`:
   ```prisma
   type String @default('school') // 'school', 'company', 'government_entity', 'other'
   ```

2. Crear tabla intermedia:
   ```prisma
   model CourseSchool {
     id        String @id @default(cuid())
     courseId  String
     course    Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
     schoolId  String
     school    School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
     
     @@unique([courseId, schoolId])
     createdAt DateTime @default(now())
   }
   ```

3. Eliminar de `Course`:
   ```prisma
   // Eliminar:
   schoolId String?
   school   School? @relation(...)
   
   // Agregar:
   courseSchools CourseSchool[]
   ```

4. Migración de datos:
   - Script para migrar `course.schoolId` existentes a `CourseSchool`
   - Cursos con `schoolId = null` quedan sin registros en `CourseSchool` (generales)

### **Fase 2: Cambios en Backend (APIs)**

1. **Actualizar queries de Prisma:**
   - Reemplazar `where: { schoolId: ... }` por `where: { courseSchools: { some: { schoolId: ... } } }`
   - Para cursos generales: `where: { courseSchools: { none: {} } }`

2. **Actualizar includes:**
   - Reemplazar `include: { school: true }` por `include: { courseSchools: { include: { school: true } } }`

3. **Actualizar creación de cursos:**
   - En lugar de `schoolId`, recibir `schoolIds: string[]`
   - Crear registros en `CourseSchool` para cada `schoolId`

### **Fase 3: Cambios en Frontend**

1. **CourseForm:**
   - Cambiar selector de colegio único a multi-select
   - Agregar opción "Curso general (sin asignar a colegios)"
   - Mostrar lista de colegios seleccionados

2. **CourseManagement:**
   - Actualizar filtros para mostrar cursos que tengan el colegio seleccionado
   - Mostrar badges con todos los colegios asignados a cada curso

3. **Lógica de visibilidad:**
   - Actualizar `CourseCatalog` para estudiantes
   - Considerar cursos generales y cursos con múltiples colegios

### **Fase 4: Testing**

1. **Migración de datos:**
   - Verificar que todos los cursos existentes se migren correctamente
   - Verificar que cursos generales (`schoolId = null`) funcionen

2. **Funcionalidad:**
   - Crear curso sin colegios (general)
   - Crear curso con un colegio
   - Crear curso con múltiples colegios
   - Verificar visibilidad para estudiantes
   - Verificar permisos para admins

3. **Regresiones:**
   - Verificar que filtros existentes sigan funcionando
   - Verificar que reportes y analytics funcionen
   - Verificar que inscripciones de estudiantes funcionen

## ⚠️ Riesgos y Consideraciones

### **Riesgos Altos:**
1. **Migración de datos:** Si hay muchos cursos, la migración debe ser cuidadosa
2. **Queries complejas:** Algunas queries pueden volverse más complejas con `some`/`none`
3. **Performance:** Queries con `some` pueden ser más lentas, considerar índices

### **Riesgos Medios:**
1. **UI/UX:** El cambio de selector único a múltiple requiere diseño cuidadoso
2. **Validaciones:** Asegurar que no se asignen cursos a colegios inexistentes
3. **Filtros:** Los filtros existentes pueden necesitar ajustes

### **Riesgos Bajos:**
1. **Nomenclatura:** "School" para empresas puede ser confuso, pero aceptable
2. **Campos opcionales:** Algunos campos de `School` pueden no aplicar a empresas

## 💡 Recomendación Final

**Recomiendo la Opción 3 (Híbrida)** porque:

1. ✅ **Balance entre flexibilidad y simplicidad**
2. ✅ **Reutiliza infraestructura existente** (modelo School)
3. ✅ **Migración más simple** que crear un modelo completamente nuevo
4. ✅ **Soporta el caso de uso** (empresas, entidades del estado)
5. ✅ **Cambios incrementales** - podemos empezar con colegios y extender después

**Pasos sugeridos:**
1. Implementar Opción 3 para múltiples colegios
2. Agregar `type` a `School` para diferenciar tipos
3. Si en el futuro necesitamos más flexibilidad, podemos migrar a `Organization`

## 📊 Estimación de Esfuerzo

- **Esquema y migración:** 2-3 horas
- **Backend (APIs):** 4-6 horas
- **Frontend (Componentes):** 3-4 horas
- **Testing y ajustes:** 2-3 horas
- **Total:** ~12-16 horas de desarrollo

## ❓ Preguntas para Decidir

1. ¿Necesitamos soportar empresas/entidades del estado **ahora** o podemos hacerlo después?
2. ¿Hay muchos cursos existentes que necesiten migración?
3. ¿Los filtros actuales por colegio son críticos para el negocio?
4. ¿Preferimos un cambio más simple ahora (Opción 1) o más flexible (Opción 3)?

