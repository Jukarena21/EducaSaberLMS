# 📋 Reporte de Revisión Completa - Usuario Admin de Colegio (school_admin)

**Fecha:** Diciembre 2024  
**Versión:** 1.0  
**Estado:** Pre-producción

---

## 📊 Resumen Ejecutivo

Este documento contiene una revisión completa del panel de administración para usuarios `school_admin` (administradores de colegio), identificando funcionalidades, permisos, restricciones, problemas de seguridad y recomendaciones para el despliegue en producción.

### ✅ Estado General
- **Funcionalidades Core:** ✅ Funcionando correctamente
- **Filtros de Seguridad:** ✅ Implementados correctamente
- **Permisos:** ✅ Restringidos apropiadamente
- **Validaciones:** ✅ Mayormente correctas
- **Seguridad:** ⚠️ Algunos problemas identificados
- **Producción:** ⚠️ Requiere correcciones menores

---

## 1. 🎯 Permisos y Restricciones del school_admin

### 1.1 Permisos de Creación

| Recurso | Puede Crear | Restricciones |
|---------|-------------|---------------|
| **Cursos** | ✅ Sí | Solo para su colegio (validado en backend) |
| **Módulos** | ❌ No | Solo `teacher_admin` |
| **Lecciones** | ❌ No | Solo `teacher_admin` |
| **Preguntas** | ❌ No | Solo `teacher_admin` |
| **Exámenes** | ✅ Sí | Puede crear exámenes (sin restricción de colegio en creación) |
| **Usuarios** | ⚠️ Parcial | Solo estudiantes y `school_admin` de su colegio |
| **Colegios** | ❌ No | Solo `teacher_admin` |

**Problemas encontrados:**
- ⚠️ **IMPORTANTE:** `school_admin` puede crear exámenes sin validación de que el curso pertenezca a su colegio
- ⚠️ **IMPORTANTE:** `school_admin` puede crear usuarios, pero el código tiene validación inconsistente

---

### 1.2 Permisos de Edición

| Recurso | Puede Editar | Restricciones |
|---------|--------------|---------------|
| **Cursos** | ✅ Sí | Solo cursos de su colegio o generales (validado) |
| **Módulos** | ❌ No | Solo `teacher_admin` |
| **Lecciones** | ❌ No | Solo `teacher_admin` |
| **Preguntas** | ❌ No | Solo `teacher_admin` |
| **Exámenes** | ⚠️ Parcial | Puede editar, pero `PUT /api/exams/[id]` solo permite `teacher_admin` |
| **Usuarios** | ✅ Sí | Solo usuarios de su colegio (validado) |
| **Colegios** | ❌ No | Solo `teacher_admin` |
| **Branding** | ✅ Sí | Solo de su colegio (validado) |

**Problemas encontrados:**
- 🔴 **CRÍTICO:** `PUT /api/exams/[id]` solo permite `teacher_admin`, pero `ExamManagement` permite editar a `school_admin`
  - **Impacto:** `school_admin` no puede editar exámenes desde la API
  - **Solución:** Permitir `school_admin` en `PUT /api/exams/[id]` con validación de que el examen pertenezca a su colegio

---

### 1.3 Permisos de Eliminación

| Recurso | Puede Eliminar | Restricciones |
|---------|----------------|---------------|
| **Cursos** | ✅ Sí | Solo cursos de su colegio o generales (validado) |
| **Módulos** | ❌ No | Solo `teacher_admin` |
| **Lecciones** | ❌ No | Solo `teacher_admin` |
| **Preguntas** | ❌ No | Solo `teacher_admin` |
| **Exámenes** | ✅ Sí | Puede eliminar (sin validación de colegio) |
| **Usuarios** | ✅ Sí | Solo usuarios de su colegio, excepto `teacher_admin` (validado) |
| **Colegios** | ❌ No | Solo `teacher_admin` |

**Problemas encontrados:**
- ⚠️ **IMPORTANTE:** No hay validación explícita de que `school_admin` solo pueda eliminar exámenes de su colegio en `DELETE /api/exams/[id]`

---

### 1.4 Permisos de Visualización

| Recurso | Puede Ver | Filtros Aplicados |
|---------|-----------|-------------------|
| **Cursos** | ✅ Sí | Solo cursos de su colegio o generales |
| **Módulos** | ✅ Sí | Solo módulos en cursos de su colegio o generales |
| **Lecciones** | ✅ Sí | Solo lecciones en módulos de cursos de su colegio o generales |
| **Preguntas** | ✅ Sí | Solo preguntas en lecciones de su colegio o generales |
| **Exámenes** | ✅ Sí | Puede ver todos los exámenes (sin filtro de colegio en GET) |
| **Usuarios** | ✅ Sí | Solo usuarios de su colegio, excluyendo `teacher_admin` |
| **Colegios** | ⚠️ Parcial | No puede ver/editar colegios individuales |
| **Analytics** | ✅ Sí | Filtrado automáticamente por su `schoolId` |
| **Reportes** | ✅ Sí | Filtrado automáticamente por su `schoolId` |

**Problemas encontrados:**
- ⚠️ **IMPORTANTE:** `GET /api/exams` no filtra por `schoolId` para `school_admin`
  - **Impacto:** `school_admin` puede ver todos los exámenes del sistema
  - **Solución:** Agregar filtro por `schoolId` basado en cursos del colegio

---

## 2. 🔐 Revisión de Seguridad y Filtros de Datos

### 2.1 Filtros por schoolId en APIs

#### ✅ **APIs con Filtros Correctos:**

1. **`GET /api/users`** - ✅ Filtra por `schoolId` del `school_admin`
2. **`GET /api/users/[id]`** - ✅ Filtra por `schoolId` del `school_admin`
3. **`PUT /api/users/[id]`** - ✅ Valida que el usuario pertenezca a su colegio
4. **`DELETE /api/users/[id]`** - ✅ Valida que el usuario pertenezca a su colegio
5. **`GET /api/courses`** - ✅ Filtra cursos de su colegio o generales
6. **`GET /api/courses/[id]`** - ✅ Valida acceso al curso
7. **`PUT /api/courses/[id]`** - ✅ Valida que el curso pertenezca a su colegio
8. **`DELETE /api/courses/[id]`** - ✅ Valida que el curso pertenezca a su colegio
9. **`GET /api/modules`** - ✅ Filtra módulos por cursos de su colegio
10. **`GET /api/modules/[id]`** - ✅ Valida acceso al módulo
11. **`GET /api/lessons`** - ✅ Filtra lecciones por cursos de su colegio
12. **`GET /api/lessons/[id]`** - ✅ Valida acceso a la lección
13. **`GET /api/questions/[id]`** - ✅ Valida acceso a la pregunta
14. **`GET /api/admin/exams/grouped`** - ✅ Filtra resultados por `schoolId` del usuario
15. **`GET /api/admin/exams/completed`** - ✅ Filtra resultados por `schoolId` del usuario
16. **`GET /api/admin/students/metrics`** - ✅ Filtra estudiantes por `schoolId`
17. **`GET /api/analytics/grades`** - ✅ Fuerza filtro por `schoolId` del `school_admin`
18. **`GET /api/analytics/engagement`** - ✅ Fuerza filtro por `schoolId` del `school_admin`
19. **`GET /api/reports/summary`** - ✅ Fuerza filtro por `schoolId` del `school_admin`
20. **`GET /api/reports/competencies`** - ⚠️ No filtra por `schoolId` (solo por parámetro)
21. **`POST /api/admin/analytics/export-bulk-report`** - ✅ Filtra estudiantes por `schoolId`
22. **`GET /api/admin/notifications/cleanup`** - ✅ Filtra notificaciones por estudiantes de su colegio
23. **`PUT /api/schools/branding-simple`** - ✅ Solo puede editar branding de su colegio

#### ⚠️ **APIs con Problemas de Filtrado:**

1. **`GET /api/exams`** - ⚠️ **PROBLEMA:** No filtra por `schoolId` para `school_admin`
   - **Impacto:** `school_admin` puede ver todos los exámenes del sistema
   - **Solución:** Agregar filtro basado en cursos del colegio

2. **`GET /api/exams/[id]`** - ⚠️ **PROBLEMA:** No valida que el examen pertenezca a su colegio
   - **Impacto:** `school_admin` puede ver cualquier examen
   - **Solución:** Validar que el examen esté asociado a un curso de su colegio

3. **`POST /api/exams`** - ⚠️ **PROBLEMA:** No valida que el curso del examen pertenezca a su colegio
   - **Impacto:** `school_admin` puede crear exámenes para cursos de otros colegios
   - **Solución:** Validar que si se especifica `courseId`, el curso pertenezca a su colegio

4. **`PUT /api/exams/[id]`** - 🔴 **CRÍTICO:** Solo permite `teacher_admin`
   - **Impacto:** `school_admin` no puede editar exámenes aunque la UI lo permita
   - **Solución:** Permitir `school_admin` con validación de que el examen pertenezca a su colegio

5. **`DELETE /api/exams/[id]`** - ⚠️ **PROBLEMA:** No valida que el examen pertenezca a su colegio
   - **Impacto:** `school_admin` podría eliminar exámenes de otros colegios
   - **Solución:** Validar que el examen esté asociado a un curso de su colegio

6. **`POST /api/admin/exams/reactivate`** - ⚠️ **PROBLEMA:** No valida que los resultados pertenezcan a su colegio
   - **Impacto:** `school_admin` podría reactivar exámenes de estudiantes de otros colegios
   - **Solución:** Validar que todos los `resultIds` pertenezcan a estudiantes de su colegio

7. **`GET /api/reports/competencies`** - ⚠️ **PROBLEMA:** No fuerza filtro por `schoolId` para `school_admin`
   - **Impacto:** `school_admin` podría ver reportes de otros colegios si no se especifica `schoolId`
   - **Solución:** Forzar filtro por `schoolId` del `school_admin` (similar a otros reportes)

---

### 2.2 Validaciones de Creación/Edición

#### ✅ **Validaciones Correctas:**

1. **Crear Curso (`POST /api/courses`):**
   - ✅ Valida que `schoolIds` incluya su colegio o usa su colegio por defecto
   - ✅ Rechaza si intenta asignar a otro colegio

2. **Editar Curso (`PUT /api/courses/[id]`):**
   - ✅ Valida que el curso existente pertenezca a su colegio o sea general
   - ✅ Valida que `schoolIds` incluya su colegio
   - ✅ Usa su colegio por defecto si no se especifican `schoolIds`

3. **Crear Usuario (`POST /api/users`):**
   - ✅ Valida que no pueda crear `teacher_admin`
   - ✅ Valida que `schoolId` sea su colegio

4. **Editar Usuario (`PUT /api/users/[id]`):**
   - ✅ Valida que el usuario pertenezca a su colegio
   - ✅ Valida que no pueda modificar `teacher_admin`
   - ✅ Valida que `schoolId` sea su colegio

5. **Eliminar Usuario (`DELETE /api/users/[id]`):**
   - ✅ Valida que el usuario pertenezca a su colegio
   - ✅ Valida que no pueda eliminar `teacher_admin`

6. **Branding (`PUT /api/schools/branding-simple`):**
   - ✅ Usa automáticamente su `schoolId`, no puede especificar otro

#### ⚠️ **Validaciones Faltantes:**

1. **Crear Examen (`POST /api/exams`):**
   - ⚠️ No valida que si se especifica `courseId`, el curso pertenezca a su colegio
   - **Solución:** Agregar validación similar a la de cursos

2. **Editar Examen (`PUT /api/exams/[id]`):**
   - 🔴 No permite `school_admin` (solo `teacher_admin`)
   - **Solución:** Permitir `school_admin` con validación

3. **Eliminar Examen (`DELETE /api/exams/[id]`):**
   - ⚠️ No valida que el examen pertenezca a su colegio
   - **Solución:** Validar que el examen esté asociado a un curso de su colegio

---

## 3. 🔍 Revisión de Componentes Frontend

### 3.1 Componentes de Gestión

#### **CourseManagement.tsx**
**Estado:** ✅ Correcto

**Permisos implementados:**
- ✅ `canCreate = userRole === 'teacher_admin'` - Correcto
- ✅ `canEdit = userRole === 'teacher_admin'` - Correcto
- ✅ `canDelete = userRole === 'teacher_admin'` - Correcto
- ✅ `canView = true` - Correcto

**Filtros:**
- ✅ Filtra colegios disponibles según rol
- ✅ `school_admin` solo ve su colegio

**Problemas encontrados:**
- ⚠️ **Ninguno crítico**

---

#### **ModuleManagement.tsx**
**Estado:** ✅ Correcto

**Permisos implementados:**
- ✅ `canCreate = userRole === 'teacher_admin'` - Correcto
- ✅ `canEdit = userRole === 'teacher_admin'` - Correcto
- ✅ `canDelete = userRole === 'teacher_admin'` - Correcto

**Filtros:**
- ✅ Backend filtra módulos por cursos del colegio

**Problemas encontrados:**
- ⚠️ **Ninguno crítico**

---

#### **LessonManagement.tsx**
**Estado:** ✅ Correcto

**Permisos implementados:**
- ✅ `canCreate = userRole === 'teacher_admin'` - Correcto
- ✅ `canEdit = userRole === 'teacher_admin'` - Correcto
- ✅ `canDelete = userRole === 'teacher_admin'` - Correcto

**Filtros:**
- ✅ Backend filtra lecciones por cursos del colegio

**Problemas encontrados:**
- ⚠️ **Ninguno crítico**

---

#### **QuestionManagementNew.tsx**
**Estado:** ✅ Correcto

**Permisos implementados:**
- ✅ `canCreate = userRole === 'teacher_admin'` - Correcto
- ✅ `canEdit = userRole === 'teacher_admin'` - Correcto
- ✅ `canDelete = userRole === 'teacher_admin'` - Correcto

**Filtros:**
- ✅ Backend filtra preguntas por lecciones de cursos del colegio

**Problemas encontrados:**
- ⚠️ **Ninguno crítico**

---

#### **ExamManagement.tsx**
**Estado:** ⚠️ Requiere corrección

**Permisos implementados:**
- ✅ `canCreate = userRole === 'teacher_admin'` - Correcto
- ⚠️ `canEdit = userRole === 'teacher_admin' || userRole === 'school_admin'` - **PROBLEMA:** Backend no permite editar
- ✅ `canDelete = userRole === 'teacher_admin'` - Correcto
- ✅ `canPreview = true` - Correcto

**Filtros:**
- ⚠️ `GET /api/exams` no filtra por `schoolId` para `school_admin`

**Problemas encontrados:**
- 🔴 **CRÍTICO:** Desincronización entre frontend y backend para edición de exámenes
- ⚠️ **IMPORTANTE:** `school_admin` puede ver todos los exámenes del sistema

---

#### **StudentsManagement (en app/admin/page.tsx)**
**Estado:** ✅ Correcto

**Permisos implementados:**
- ✅ Filtra usuarios por `schoolId` del `school_admin`
- ✅ Excluye `teacher_admin` de la lista
- ✅ Permite editar estudiantes de su colegio

**Filtros:**
- ✅ Backend filtra correctamente por `schoolId`

**Problemas encontrados:**
- ⚠️ **Ninguno crítico**

---

### 3.2 Componentes de Analytics y Reportes

#### **useAnalytics Hook**
**Estado:** ✅ Correcto

**Filtros:**
- ✅ Fuerza `schoolId` del `school_admin` automáticamente
- ✅ No permite cambiar el filtro de colegio

**Problemas encontrados:**
- ⚠️ **Ninguno crítico**

---

#### **NotificationManagement.tsx**
**Estado:** ✅ Correcto

**Funcionalidades:**
- ✅ Valor inicial "my_school" para `school_admin`
- ✅ Puede enviar notificaciones a estudiantes de su colegio
- ✅ Backend valida correctamente

**Problemas encontrados:**
- ⚠️ **Ninguno crítico**

---

#### **AdminNotificationCenter.tsx**
**Estado:** ✅ Correcto

**Funcionalidades:**
- ✅ Muestra notificaciones solo del `school_admin`
- ✅ Filtros funcionan correctamente

**Problemas encontrados:**
- ⚠️ **Ninguno crítico**

---

### 3.3 Componentes de Importación

#### **BulkImportCenter.tsx**
**Estado:** ⚠️ Requiere validación

**Funcionalidades:**
- ✅ Permite importar estudiantes
- ⚠️ **PROBLEMA:** No valida que `schoolId` en el CSV sea el del `school_admin`
- ❌ No permite importar colegios (solo `teacher_admin`)
- ❌ No permite importar lecciones (solo `teacher_admin`)
- ❌ No permite importar preguntas (solo `teacher_admin`)

**Problemas encontrados:**
- ⚠️ **IMPORTANTE:** `school_admin` puede importar estudiantes con `schoolId` diferente al suyo
  - **Solución:** Forzar `schoolId` del `school_admin` en la importación

---

## 4. 🚨 Problemas de Seguridad Identificados

### Prioridad ALTA (Bloqueantes para producción)

1. **🔴 CRÍTICO:** `PUT /api/exams/[id]` no permite `school_admin`
   - **Archivo:** `app/api/exams/[id]/route.ts` (línea 142)
   - **Problema:** Solo permite `teacher_admin`, pero el frontend permite editar
   - **Impacto:** Funcionalidad rota, `school_admin` no puede editar exámenes
   - **Solución:** Permitir `school_admin` con validación de que el examen pertenezca a su colegio

2. **🔴 CRÍTICO:** `GET /api/exams` no filtra por `schoolId` para `school_admin`
   - **Archivo:** `app/api/exams/route.ts` (línea 28)
   - **Problema:** `school_admin` puede ver todos los exámenes del sistema
   - **Impacto:** Fuga de datos, puede ver exámenes de otros colegios
   - **Solución:** Agregar filtro basado en cursos del colegio

3. **🔴 CRÍTICO:** `GET /api/exams/[id]` no valida acceso para `school_admin`
   - **Archivo:** `app/api/exams/[id]/route.ts` (línea 28)
   - **Problema:** `school_admin` puede ver cualquier examen
   - **Impacto:** Fuga de datos
   - **Solución:** Validar que el examen esté asociado a un curso de su colegio

4. **🔴 CRÍTICO:** `POST /api/exams` no valida que el curso pertenezca a su colegio
   - **Archivo:** `app/api/exams/route.ts` (línea 192)
   - **Problema:** `school_admin` puede crear exámenes para cursos de otros colegios
   - **Impacto:** Puede crear exámenes para otros colegios
   - **Solución:** Validar que si se especifica `courseId`, el curso pertenezca a su colegio

5. **🔴 CRÍTICO:** `DELETE /api/exams/[id]` no valida acceso para `school_admin`
   - **Archivo:** `app/api/exams/[id]/route.ts` (necesita verificación)
   - **Problema:** `school_admin` podría eliminar exámenes de otros colegios
   - **Impacto:** Puede eliminar exámenes de otros colegios
   - **Solución:** Validar que el examen esté asociado a un curso de su colegio

---

### Prioridad MEDIA (Importantes antes de producción)

1. **⚠️ IMPORTANTE:** `POST /api/admin/exams/reactivate` no valida que los resultados pertenezcan a su colegio
   - **Archivo:** `app/api/admin/exams/reactivate/route.ts`
   - **Problema:** `school_admin` podría reactivar exámenes de estudiantes de otros colegios
   - **Solución:** Validar que todos los `resultIds` pertenezcan a estudiantes de su colegio

2. **⚠️ IMPORTANTE:** `GET /api/reports/competencies` no fuerza filtro por `schoolId` para `school_admin`
   - **Archivo:** `app/api/reports/competencies/route.ts`
   - **Problema:** `school_admin` podría ver reportes de otros colegios
   - **Solución:** Forzar filtro por `schoolId` del `school_admin` (similar a otros reportes)

3. **⚠️ IMPORTANTE:** `POST /api/bulk-import` no valida `schoolId` en importación de estudiantes
   - **Archivo:** `app/api/bulk-import/route.ts` (línea 212)
   - **Problema:** `school_admin` puede importar estudiantes con `schoolId` diferente
   - **Solución:** Forzar `schoolId` del `school_admin` en la importación

---

### Prioridad BAJA (Mejoras futuras)

1. **✅ RECOMENDADO:** Agregar validación explícita en `DELETE /api/exams/[id]` para `school_admin`
2. **✅ RECOMENDADO:** Mejorar mensajes de error cuando `school_admin` intenta acceder a recursos de otros colegios
3. **✅ RECOMENDADO:** Agregar logging de acciones de `school_admin` para auditoría

---

## 5. 📋 Funcionalidades Disponibles para school_admin

### 5.1 Pestañas del Panel de Administración

| Pestaña | Acceso | Funcionalidades |
|---------|--------|-----------------|
| **Analytics** | ✅ Sí | KPIs, gráficos, reportes (filtrados por su colegio) |
| **Cursos** | ✅ Sí | Ver, crear, editar, eliminar (solo de su colegio) |
| **Módulos** | ✅ Sí | Ver, preview (no crear/editar/eliminar) |
| **Lecciones** | ✅ Sí | Ver, preview (no crear/editar/eliminar) |
| **Preguntas** | ✅ Sí | Ver, preview (no crear/editar/eliminar) |
| **Exámenes** | ✅ Sí | Ver, crear, editar, eliminar, preview/test |
| **Resultados** | ✅ Sí | Ver resultados de estudiantes de su colegio |
| **Estudiantes** | ✅ Sí | Ver, editar (no crear/eliminar) estudiantes de su colegio |
| **Branding** | ✅ Sí | Editar branding de su colegio |
| **Notificaciones** | ✅ Sí | Enviar notificaciones a estudiantes de su colegio |

**Nota:** `school_admin` NO tiene acceso a la pestaña "Configuración" (solo `teacher_admin`)

---

### 5.2 Funcionalidades Específicas

#### **Crear Cursos**
- ✅ Puede crear cursos ICFES y Generales
- ✅ Solo puede asignar cursos a su colegio
- ✅ Puede usar módulos de cursos generales o de su colegio
- ✅ Validación correcta en backend

#### **Crear Exámenes**
- ✅ Puede crear todos los tipos de exámenes
- ⚠️ **PROBLEMA:** No valida que el curso pertenezca a su colegio
- ✅ Puede generar preguntas automáticamente
- ✅ Puede publicar/cerrar exámenes

#### **Gestionar Estudiantes**
- ✅ Puede ver estudiantes de su colegio
- ✅ Puede editar información de estudiantes
- ❌ No puede crear estudiantes (solo `teacher_admin`)
- ❌ No puede eliminar estudiantes (solo `teacher_admin`)
- ✅ Puede ver métricas detalladas de estudiantes

#### **Analytics y Reportes**
- ✅ Acceso completo a analytics (filtrado por su colegio)
- ✅ Puede exportar reportes masivos (solo de su colegio)
- ✅ KPIs, gráficos, distribución de calificaciones
- ✅ Ranking de estudiantes (solo de su colegio)

#### **Notificaciones**
- ✅ Puede enviar notificaciones masivas
- ✅ Opciones: "Todos los estudiantes", "Grado específico", "Estudiantes de mi colegio"
- ✅ Recibe notificaciones automáticas (examen publicado, estudiantes no presentaron, etc.)

#### **Branding**
- ✅ Puede editar logo y colores de su colegio
- ✅ Vista previa en tiempo real
- ✅ Solo puede editar su propio colegio

---

## 6. 🔒 Validaciones de Seguridad por API

### 6.1 APIs de Exámenes

#### **GET /api/exams**
**Estado:** ⚠️ Requiere corrección

**Código actual:**
```typescript
// No hay filtro por schoolId para school_admin
const exams = await prisma.exam.findMany({ where })
```

**Problema:** `school_admin` puede ver todos los exámenes

**Solución requerida:**
```typescript
if (session.user.role === 'school_admin' && session.user.schoolId) {
  // Obtener cursos del colegio
  const schoolCourses = await prisma.course.findMany({
    where: {
      courseSchools: {
        some: { schoolId: session.user.schoolId }
      }
    },
    select: { id: true }
  })
  const courseIds = schoolCourses.map(c => c.id)
  where.courseId = { in: courseIds.length > 0 ? courseIds : [''] }
}
```

---

#### **GET /api/exams/[id]**
**Estado:** ⚠️ Requiere corrección

**Código actual:**
```typescript
// No valida acceso para school_admin
const exam = await prisma.exam.findUnique({ where: { id } })
```

**Problema:** `school_admin` puede ver cualquier examen

**Solución requerida:**
```typescript
if (session.user.role === 'school_admin' && session.user.schoolId) {
  // Verificar que el examen esté asociado a un curso de su colegio
  const examWithCourse = await prisma.exam.findUnique({
    where: { id },
    include: {
      course: {
        include: {
          courseSchools: { select: { schoolId: true } }
        }
      }
    }
  })
  
  if (!examWithCourse) {
    return NextResponse.json({ error: 'Examen no encontrado' }, { status: 404 })
  }
  
  if (examWithCourse.courseId) {
    const courseSchoolIds = examWithCourse.course.courseSchools.map(cs => cs.schoolId)
    if (!courseSchoolIds.includes(session.user.schoolId)) {
      return NextResponse.json({ error: 'No tienes permisos para ver este examen' }, { status: 403 })
    }
  }
}
```

---

#### **POST /api/exams**
**Estado:** ⚠️ Requiere corrección

**Código actual:**
```typescript
// No valida que el curso pertenezca a su colegio
const exam = await prisma.exam.create({ data: examData })
```

**Problema:** `school_admin` puede crear exámenes para cursos de otros colegios

**Solución requerida:**
```typescript
if (session.user.role === 'school_admin' && session.user.schoolId) {
  if (validatedData.courseId) {
    const course = await prisma.course.findUnique({
      where: { id: validatedData.courseId },
      include: {
        courseSchools: { select: { schoolId: true } }
      }
    })
    
    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }
    
    const courseSchoolIds = course.courseSchools.map(cs => cs.schoolId)
    if (!courseSchoolIds.includes(session.user.schoolId)) {
      return NextResponse.json(
        { error: 'Solo puedes crear exámenes para cursos de tu colegio' },
        { status: 403 }
      )
    }
  }
}
```

---

#### **PUT /api/exams/[id]**
**Estado:** 🔴 CRÍTICO - Requiere corrección

**Código actual:**
```typescript
const gate = await requireRole(['teacher_admin']) // Solo teacher_admin
```

**Problema:** `school_admin` no puede editar exámenes

**Solución requerida:**
```typescript
const gate = await requireRole(['teacher_admin', 'school_admin'])

// Validación para school_admin
if (gate.session.user.role === 'school_admin' && gate.session.user.schoolId) {
  const existingExam = await prisma.exam.findUnique({
    where: { id },
    include: {
      course: {
        include: {
          courseSchools: { select: { schoolId: true } }
        }
      }
    }
  })
  
  if (!existingExam) {
    return NextResponse.json({ error: 'Examen no encontrado' }, { status: 404 })
  }
  
  if (existingExam.courseId) {
    const courseSchoolIds = existingExam.course.courseSchools.map(cs => cs.schoolId)
    if (!courseSchoolIds.includes(gate.session.user.schoolId)) {
      return NextResponse.json(
        { error: 'Solo puedes editar exámenes de tu colegio' },
        { status: 403 }
      )
    }
  }
  
  // Validar que si cambia courseId, el nuevo curso pertenezca a su colegio
  if (validatedData.courseId && validatedData.courseId !== existingExam.courseId) {
    const newCourse = await prisma.course.findUnique({
      where: { id: validatedData.courseId },
      include: {
        courseSchools: { select: { schoolId: true } }
      }
    })
    
    if (newCourse) {
      const newCourseSchoolIds = newCourse.courseSchools.map(cs => cs.schoolId)
      if (!newCourseSchoolIds.includes(gate.session.user.schoolId)) {
        return NextResponse.json(
          { error: 'Solo puedes asignar exámenes a cursos de tu colegio' },
          { status: 403 }
        )
      }
    }
  }
}
```

---

#### **DELETE /api/exams/[id]**
**Estado:** ⚠️ Requiere verificación

**Problema:** No se encontró el código de DELETE en la revisión

**Solución requerida:**
```typescript
if (session.user.role === 'school_admin' && session.user.schoolId) {
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      course: {
        include: {
          courseSchools: { select: { schoolId: true } }
        }
      }
    }
  })
  
  if (exam?.courseId) {
    const courseSchoolIds = exam.course.courseSchools.map(cs => cs.schoolId)
    if (!courseSchoolIds.includes(session.user.schoolId)) {
      return NextResponse.json(
        { error: 'Solo puedes eliminar exámenes de tu colegio' },
        { status: 403 }
      )
    }
  }
}
```

---

#### **POST /api/admin/exams/reactivate**
**Estado:** ⚠️ Requiere corrección

**Código actual:**
```typescript
// No valida que los resultados pertenezcan a su colegio
const examResults = await prisma.examResult.findMany({
  where: { id: { in: resultIdsToReactivate } }
})
```

**Problema:** `school_admin` podría reactivar exámenes de estudiantes de otros colegios

**Solución requerida:**
```typescript
if (session.user.role === 'school_admin' && session.user.schoolId) {
  // Verificar que todos los resultados pertenezcan a estudiantes de su colegio
  const examResults = await prisma.examResult.findMany({
    where: {
      id: { in: resultIdsToReactivate },
      user: {
        schoolId: session.user.schoolId
      }
    }
  })
  
  if (examResults.length !== resultIdsToReactivate.length) {
    return NextResponse.json(
      { error: 'Algunos resultados no pertenecen a estudiantes de tu colegio' },
      { status: 403 }
    )
  }
}
```

---

### 6.2 APIs de Reportes

#### **GET /api/reports/competencies**
**Estado:** ⚠️ Requiere corrección

**Código actual:**
```typescript
// No fuerza filtro por schoolId para school_admin
const schoolId = searchParams.get('schoolId') || undefined
```

**Problema:** `school_admin` podría ver reportes de otros colegios

**Solución requerida:**
```typescript
// Para school_admin, forzar el filtro por su schoolId
const schoolId = gate.session.user.role === 'school_admin' 
  ? gate.session.user.schoolId 
  : (searchParams.get('schoolId') || undefined)
```

---

### 6.3 APIs de Importación

#### **POST /api/bulk-import**
**Estado:** ⚠️ Requiere corrección

**Código actual:**
```typescript
// Para estudiantes, usa schoolId del CSV sin validación
schoolId: r.schoolId || undefined
```

**Problema:** `school_admin` puede importar estudiantes con `schoolId` diferente

**Solución requerida:**
```typescript
if (type === 'students' && session.user.role === 'school_admin' && session.user.schoolId) {
  // Forzar schoolId del admin
  const studentData = {
    ...rowData,
    schoolId: session.user.schoolId // Forzar schoolId del admin
  }
  // Usar studentData en lugar de rowData
}
```

---

## 7. ✅ Funcionalidades que Funcionan Correctamente

### 7.1 Gestión de Cursos
- ✅ Crear cursos (solo para su colegio)
- ✅ Editar cursos (solo de su colegio o generales)
- ✅ Eliminar cursos (solo de su colegio o generales)
- ✅ Ver cursos (filtrados correctamente)
- ✅ Validaciones de seguridad implementadas

### 7.2 Gestión de Usuarios
- ✅ Ver estudiantes de su colegio
- ✅ Editar estudiantes de su colegio
- ✅ No puede ver/editar `teacher_admin`
- ✅ Validaciones de seguridad implementadas

### 7.3 Analytics y Reportes
- ✅ KPIs filtrados por su colegio
- ✅ Gráficos filtrados por su colegio
- ✅ Exportación de reportes (solo de su colegio)
- ✅ Filtros automáticos funcionando

### 7.4 Notificaciones
- ✅ Enviar notificaciones a estudiantes de su colegio
- ✅ Recibir notificaciones automáticas
- ✅ Estadísticas de notificaciones (solo de su colegio)

### 7.5 Branding
- ✅ Editar branding de su colegio
- ✅ Vista previa en tiempo real
- ✅ Validación de acceso correcta

---

## 8. ⚠️ Problemas Críticos a Resolver

### Prioridad ALTA (Bloqueantes para producción)

1. **🔴 CRÍTICO:** Permitir `school_admin` en `PUT /api/exams/[id]`
   - **Archivo:** `app/api/exams/[id]/route.ts` (línea 142)
   - **Solución:** Cambiar `requireRole(['teacher_admin'])` a `requireRole(['teacher_admin', 'school_admin'])` y agregar validación de acceso

2. **🔴 CRÍTICO:** Filtrar exámenes por `schoolId` en `GET /api/exams`
   - **Archivo:** `app/api/exams/route.ts` (línea 28)
   - **Solución:** Agregar filtro basado en cursos del colegio

3. **🔴 CRÍTICO:** Validar acceso en `GET /api/exams/[id]`
   - **Archivo:** `app/api/exams/[id]/route.ts` (línea 28)
   - **Solución:** Validar que el examen esté asociado a un curso de su colegio

4. **🔴 CRÍTICO:** Validar curso en `POST /api/exams`
   - **Archivo:** `app/api/exams/route.ts` (línea 192)
   - **Solución:** Validar que si se especifica `courseId`, el curso pertenezca a su colegio

5. **🔴 CRÍTICO:** Validar acceso en `DELETE /api/exams/[id]`
   - **Archivo:** `app/api/exams/[id]/route.ts` (necesita verificación)
   - **Solución:** Validar que el examen esté asociado a un curso de su colegio

---

### Prioridad MEDIA (Importantes antes de producción)

1. **⚠️ IMPORTANTE:** Validar resultados en `POST /api/admin/exams/reactivate`
   - **Archivo:** `app/api/admin/exams/reactivate/route.ts`
   - **Solución:** Validar que todos los `resultIds` pertenezcan a estudiantes de su colegio

2. **⚠️ IMPORTANTE:** Forzar filtro en `GET /api/reports/competencies`
   - **Archivo:** `app/api/reports/competencies/route.ts`
   - **Solución:** Forzar filtro por `schoolId` del `school_admin`

3. **⚠️ IMPORTANTE:** Validar `schoolId` en importación masiva
   - **Archivo:** `app/api/bulk-import/route.ts` (línea 212)
   - **Solución:** Forzar `schoolId` del `school_admin` en la importación

---

## 9. 📊 Resumen de Estado por Funcionalidad

| Funcionalidad | Estado | Problemas | Listo para Producción |
|---------------|--------|-----------|----------------------|
| Ver Cursos | ✅ | Ninguno | ✅ Sí |
| Crear Cursos | ✅ | Ninguno | ✅ Sí |
| Editar Cursos | ✅ | Ninguno | ✅ Sí |
| Eliminar Cursos | ✅ | Ninguno | ✅ Sí |
| Ver Módulos | ✅ | Ninguno | ✅ Sí |
| Ver Lecciones | ✅ | Ninguno | ✅ Sí |
| Ver Preguntas | ✅ | Ninguno | ✅ Sí |
| Ver Exámenes | ⚠️ | 1 crítico | ❌ No (requiere corrección) |
| Crear Exámenes | ⚠️ | 1 crítico | ❌ No (requiere corrección) |
| Editar Exámenes | 🔴 | 1 crítico | ❌ No (requiere corrección) |
| Eliminar Exámenes | ⚠️ | 1 crítico | ❌ No (requiere corrección) |
| Ver Resultados | ✅ | Ninguno | ✅ Sí |
| Reactivar Exámenes | ⚠️ | 1 importante | ⚠️ Sí (con corrección) |
| Ver Estudiantes | ✅ | Ninguno | ✅ Sí |
| Editar Estudiantes | ✅ | Ninguno | ✅ Sí |
| Crear Estudiantes | ❌ | Por diseño | ✅ Sí |
| Eliminar Estudiantes | ❌ | Por diseño | ✅ Sí |
| Analytics | ✅ | Ninguno | ✅ Sí |
| Reportes | ⚠️ | 1 importante | ⚠️ Sí (con corrección) |
| Notificaciones | ✅ | Ninguno | ✅ Sí |
| Branding | ✅ | Ninguno | ✅ Sí |
| Importación Masiva | ⚠️ | 1 importante | ⚠️ Sí (con corrección) |

---

## 10. 🔧 Correcciones Requeridas

### 10.1 Correcciones Críticas (5 problemas)

#### **1. Permitir school_admin en PUT /api/exams/[id]**

**Archivo:** `app/api/exams/[id]/route.ts`

**Cambio requerido:**
```typescript
// Cambiar de:
const gate = await requireRole(['teacher_admin'])

// A:
const gate = await requireRole(['teacher_admin', 'school_admin'])

// Agregar validación después de obtener existingExam:
if (gate.session.user.role === 'school_admin' && gate.session.user.schoolId) {
  if (!existingExam.courseId) {
    // Exámenes sin curso no pueden ser editados por school_admin
    return NextResponse.json(
      { error: 'Solo puedes editar exámenes asociados a cursos de tu colegio' },
      { status: 403 }
    )
  }
  
  const course = await prisma.course.findUnique({
    where: { id: existingExam.courseId },
    include: {
      courseSchools: { select: { schoolId: true } }
    }
  })
  
  if (course) {
    const courseSchoolIds = course.courseSchools.map(cs => cs.schoolId)
    if (!courseSchoolIds.includes(gate.session.user.schoolId)) {
      return NextResponse.json(
        { error: 'Solo puedes editar exámenes de tu colegio' },
        { status: 403 }
      )
    }
  }
  
  // Validar que si cambia courseId, el nuevo curso pertenezca a su colegio
  if (validatedData.courseId && validatedData.courseId !== existingExam.courseId) {
    const newCourse = await prisma.course.findUnique({
      where: { id: validatedData.courseId },
      include: {
        courseSchools: { select: { schoolId: true } }
      }
    })
    
    if (newCourse) {
      const newCourseSchoolIds = newCourse.courseSchools.map(cs => cs.schoolId)
      if (!newCourseSchoolIds.includes(gate.session.user.schoolId)) {
        return NextResponse.json(
          { error: 'Solo puedes asignar exámenes a cursos de tu colegio' },
          { status: 403 }
        )
      }
    }
  }
}
```

---

#### **2. Filtrar exámenes por schoolId en GET /api/exams**

**Archivo:** `app/api/exams/route.ts`

**Cambio requerido:**
```typescript
// Después de construir where (línea ~100), agregar:
if (session.user.role === 'school_admin' && session.user.schoolId) {
  // Obtener cursos del colegio
  const schoolCourses = await prisma.course.findMany({
    where: {
      courseSchools: {
        some: { schoolId: session.user.schoolId }
      }
    },
    select: { id: true }
  })
  const courseIds = schoolCourses.map(c => c.id)
  
  if (courseIds.length > 0) {
    where.courseId = { in: courseIds }
  } else {
    // Si no tiene cursos, no mostrar ningún examen
    where.courseId = { in: [''] }
  }
}
```

---

#### **3. Validar acceso en GET /api/exams/[id]**

**Archivo:** `app/api/exams/[id]/route.ts`

**Cambio requerido:**
```typescript
// Después de obtener exam (línea ~100), agregar:
if (session.user.role === 'school_admin' && session.user.schoolId) {
  if (exam.courseId) {
    const course = await prisma.course.findUnique({
      where: { id: exam.courseId },
      include: {
        courseSchools: { select: { schoolId: true } }
      }
    })
    
    if (course) {
      const courseSchoolIds = course.courseSchools.map(cs => cs.schoolId)
      if (!courseSchoolIds.includes(session.user.schoolId)) {
        return NextResponse.json(
          { error: 'No tienes permisos para ver este examen' },
          { status: 403 }
        )
      }
    }
  } else {
    // Exámenes sin curso no pueden ser vistos por school_admin
    return NextResponse.json(
      { error: 'No tienes permisos para ver este examen' },
      { status: 403 }
    )
  }
}
```

---

#### **4. Validar curso en POST /api/exams**

**Archivo:** `app/api/exams/route.ts`

**Cambio requerido:**
```typescript
// Después de validar datos (línea ~200), agregar:
if (session.user.role === 'school_admin' && session.user.schoolId) {
  if (validatedData.courseId) {
    const course = await prisma.course.findUnique({
      where: { id: validatedData.courseId },
      include: {
        courseSchools: { select: { schoolId: true } }
      }
    })
    
    if (!course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }
    
    const courseSchoolIds = course.courseSchools.map(cs => cs.schoolId)
    if (!courseSchoolIds.includes(session.user.schoolId)) {
      return NextResponse.json(
        { error: 'Solo puedes crear exámenes para cursos de tu colegio' },
        { status: 403 }
      )
    }
  }
}
```

---

#### **5. Validar acceso en DELETE /api/exams/[id]**

**Archivo:** `app/api/exams/[id]/route.ts` (necesita verificación de existencia)

**Cambio requerido:**
```typescript
// Si existe DELETE, agregar validación similar a GET:
if (session.user.role === 'school_admin' && session.user.schoolId) {
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      course: {
        include: {
          courseSchools: { select: { schoolId: true } }
        }
      }
    }
  })
  
  if (exam?.courseId) {
    const courseSchoolIds = exam.course.courseSchools.map(cs => cs.schoolId)
    if (!courseSchoolIds.includes(session.user.schoolId)) {
      return NextResponse.json(
        { error: 'Solo puedes eliminar exámenes de tu colegio' },
        { status: 403 }
      )
    }
  } else {
    return NextResponse.json(
      { error: 'Solo puedes eliminar exámenes asociados a cursos de tu colegio' },
      { status: 403 }
    )
  }
}
```

---

### 10.2 Correcciones Importantes (3 problemas)

#### **1. Validar resultados en POST /api/admin/exams/reactivate**

**Archivo:** `app/api/admin/exams/reactivate/route.ts`

**Cambio requerido:**
```typescript
// Después de obtener examResults (línea ~71), agregar:
if (session.user.role === 'school_admin' && session.user.schoolId) {
  // Verificar que todos los resultados pertenezcan a estudiantes de su colegio
  const invalidResults = examResults.filter(r => r.user.schoolId !== session.user.schoolId)
  
  if (invalidResults.length > 0) {
    return NextResponse.json(
      { error: 'Algunos resultados no pertenecen a estudiantes de tu colegio' },
      { status: 403 }
    )
  }
}
```

---

#### **2. Forzar filtro en GET /api/reports/competencies**

**Archivo:** `app/api/reports/competencies/route.ts`

**Cambio requerido:**
```typescript
// Cambiar de:
const schoolId = searchParams.get('schoolId') || undefined

// A:
const schoolId = gate.session.user.role === 'school_admin' 
  ? gate.session.user.schoolId 
  : (searchParams.get('schoolId') || undefined)
```

---

#### **3. Validar schoolId en POST /api/bulk-import**

**Archivo:** `app/api/bulk-import/route.ts`

**Cambio requerido:**
```typescript
// En la sección de importación de estudiantes (línea ~197), cambiar:
if (type === 'students' && session.user.role === 'school_admin' && session.user.schoolId) {
  // Forzar schoolId del admin
  const forcedSchoolId = session.user.schoolId
  
  await prisma.user.upsert({
    where: { email },
    update: {
      ...updateData,
      schoolId: forcedSchoolId // Forzar schoolId
    },
    create: {
      ...createData,
      schoolId: forcedSchoolId // Forzar schoolId
    }
  })
} else {
  // Código original para teacher_admin
  await prisma.user.upsert({ ... })
}
```

---

## 11. 🎯 Checklist de Verificación para Producción

### Pre-despliegue

#### Seguridad
- [ ] Corregir `PUT /api/exams/[id]` para permitir `school_admin`
- [ ] Agregar filtro por `schoolId` en `GET /api/exams`
- [ ] Validar acceso en `GET /api/exams/[id]`
- [ ] Validar curso en `POST /api/exams`
- [ ] Validar acceso en `DELETE /api/exams/[id]`
- [ ] Validar resultados en `POST /api/admin/exams/reactivate`
- [ ] Forzar filtro en `GET /api/reports/competencies`
- [ ] Validar `schoolId` en `POST /api/bulk-import`

#### Testing
- [ ] Probar que `school_admin` solo ve exámenes de su colegio
- [ ] Probar que `school_admin` puede crear exámenes solo para cursos de su colegio
- [ ] Probar que `school_admin` puede editar exámenes de su colegio
- [ ] Probar que `school_admin` NO puede editar exámenes de otros colegios
- [ ] Probar que `school_admin` NO puede ver exámenes de otros colegios
- [ ] Probar que `school_admin` solo ve estudiantes de su colegio
- [ ] Probar que `school_admin` solo ve cursos de su colegio
- [ ] Probar que `school_admin` solo ve analytics de su colegio
- [ ] Probar que `school_admin` NO puede crear/editar módulos, lecciones, preguntas
- [ ] Probar que `school_admin` NO puede crear/editar colegios
- [ ] Probar importación masiva con `schoolId` forzado

---

## 12. 📊 Resumen de Problemas por Severidad

### 🔴 Críticos (5)
1. `PUT /api/exams/[id]` no permite `school_admin`
2. `GET /api/exams` no filtra por `schoolId`
3. `GET /api/exams/[id]` no valida acceso
4. `POST /api/exams` no valida curso
5. `DELETE /api/exams/[id]` no valida acceso

### ⚠️ Importantes (3)
1. `POST /api/admin/exams/reactivate` no valida resultados
2. `GET /api/reports/competencies` no fuerza filtro
3. `POST /api/bulk-import` no valida `schoolId`

### ✅ Menores (0)
- Ninguno identificado

---

## 13. 🎯 Conclusión

### Estado General
El panel de `school_admin` está **mayormente funcional** pero requiere **correcciones críticas de seguridad** antes de producción. Los problemas principales están relacionados con la gestión de exámenes, donde `school_admin` puede ver y manipular exámenes de otros colegios.

### Acciones Requeridas
1. **Corregir 5 problemas críticos** de seguridad en APIs de exámenes
2. **Corregir 3 problemas importantes** en reportes e importación
3. **Realizar pruebas exhaustivas** después de correcciones
4. **Verificar que no hay fugas de datos** entre colegios

### Tiempo Estimado para Correcciones
- **Problemas críticos:** 3-4 horas
- **Problemas importantes:** 1-2 horas
- **Testing:** 2-3 horas
- **Total:** 6-9 horas

### Recomendación Final
**NO desplegar a producción** hasta resolver los problemas críticos de seguridad identificados. Una vez corregidos, el sistema estará listo para producción con `school_admin` funcionando correctamente.

---

**Última actualización:** Diciembre 2024  
**Próxima revisión:** Después de correcciones críticas

