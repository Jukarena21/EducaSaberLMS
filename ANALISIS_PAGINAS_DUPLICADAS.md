# Análisis de Páginas Duplicadas y No Utilizadas

## 📋 Resumen Ejecutivo

Este documento identifica todas las páginas en la plataforma, clasificándolas en:
- ✅ **Páginas Activas** (en uso)
- ⚠️ **Páginas Duplicadas/Obsoletas** (no se usan o tienen versiones nuevas)
- 🔄 **Páginas de Redirección** (solo redirigen)

---

## ✅ PÁGINAS ACTIVAS (En Uso)

### Páginas Públicas (Sin Autenticación)
1. **`/app/page.tsx`** - Landing page principal
   - ✅ **Estado**: Activa
   - **Uso**: Página principal con múltiples vistas (landing, cursos, otros-servicios, acerca, contacto, precios)
   - **Rutas**: `/`

2. **`/app/cursos/page.tsx`** - Página pública de cursos ICFES
   - ✅ **Estado**: Activa
   - **Uso**: Muestra todos los cursos ICFES disponibles públicamente
   - **Rutas**: `/cursos`

3. **`/app/auth/signin/page.tsx`** - Página de inicio de sesión
   - ✅ **Estado**: Activa
   - **Uso**: Formulario de login
   - **Rutas**: `/auth/signin`

4. **`/app/auth/signup/page.tsx`** - Página de registro
   - ✅ **Estado**: Activa
   - **Uso**: Formulario de registro
   - **Rutas**: `/auth/signup`

### Páginas del Estudiante (Autenticadas)
5. **`/app/estudiante/page.tsx`** - Dashboard del estudiante
   - ✅ **Estado**: Activa
   - **Uso**: Dashboard principal con tabs (inicio, cursos, exámenes, progreso, gamificación)
   - **Rutas**: `/estudiante`

6. **`/app/estudiante/cursos/[courseId]/page.tsx`** - Vista de curso individual
   - ✅ **Estado**: Activa
   - **Uso**: Muestra detalles de un curso específico del estudiante
   - **Rutas**: `/estudiante/cursos/[courseId]`

7. **`/app/estudiante/cursos/[courseId]/leccion/[lessonId]/page.tsx`** - Vista de lección
   - ✅ **Estado**: Activa
   - **Uso**: Muestra y permite completar una lección específica
   - **Rutas**: `/estudiante/cursos/[courseId]/leccion/[lessonId]`

8. **`/app/estudiante/cursos/[courseId]/modulos/page.tsx`** - Vista de módulos
   - ✅ **Estado**: Activa
   - **Uso**: Muestra todos los módulos de un curso
   - **Rutas**: `/estudiante/cursos/[courseId]/modulos`

9. **`/app/estudiante/examen/[examId]/page.tsx`** - Vista previa de examen
   - ✅ **Estado**: Activa
   - **Uso**: Muestra información del examen antes de iniciarlo
   - **Rutas**: `/estudiante/examen/[examId]`

10. **`/app/estudiante/examen/tomar/[attemptId]/page.tsx`** - Tomar examen
    - ✅ **Estado**: Activa
    - **Uso**: Interfaz para responder el examen
    - **Rutas**: `/estudiante/examen/tomar/[attemptId]`

11. **`/app/estudiante/examen/resultado/[resultId]/page.tsx`** - Resultados de examen
    - ✅ **Estado**: Activa
    - **Uso**: Muestra resultados detallados de un examen completado
    - **Rutas**: `/estudiante/examen/resultado/[resultId]`

### Páginas de Administración
12. **`/app/admin/page.tsx`** - Dashboard de administración
    - ✅ **Estado**: Activa
    - **Uso**: Panel de control para admins (teacher_admin y school_admin)
    - **Rutas**: `/admin`

---

## ⚠️ PÁGINAS DUPLICADAS/OBSOLETAS - TODAS CON DATOS HARDCODEADOS

**Todas estas páginas tienen datos hardcodeados y NO se conectan a la base de datos. Son páginas demo/ejemplo que ya no se necesitan.**

### 1. **`/app/examen/page.tsx`** - Página de examen (DEMO)
   - ⚠️ **Estado**: ❌ **ELIMINAR**
   - **Problema**: 
     - ✅ Tiene datos hardcodeados: Array `preguntas` con 20 preguntas de ejemplo (línea 43)
     - ✅ No se conecta a la base de datos
     - ✅ Es una versión demo/ejemplo
   - **Reemplazo**: `/app/estudiante/examen/tomar/[attemptId]/page.tsx` (versión funcional)
   - **Referencias encontradas**:
     - Footer de `/app/page.tsx` (línea 294)
     - Página de cursos `/app/cursos/page.tsx` (línea 264)
   - **Recomendación**: 
     - ❌ **ELIMINAR INMEDIATAMENTE** - Página demo que no se usa en producción
     - Actualizar los links en el footer y página de cursos

### 2. **`/app/examen/resultado/page.tsx`** - Resultados de examen (DEMO)
   - ⚠️ **Estado**: ❌ **ELIMINAR**
   - **Problema**:
     - ✅ Tiene datos hardcodeados: Objeto `resultadoExamen` con datos de ejemplo (línea 27)
     - ✅ No se conecta a la base de datos
     - ✅ Es una versión demo/ejemplo
   - **Reemplazo**: `/app/estudiante/examen/resultado/[resultId]/page.tsx` (versión funcional)
   - **Referencias encontradas**:
     - `/app/examen/page.tsx` (líneas 437, 685)
     - `/app/examen/resultado/page.tsx` (línea 487)
   - **Recomendación**:
     - ❌ **ELIMINAR INMEDIATAMENTE** - Página demo que no se usa en producción

### 3. **`/app/leccion/[materia]/[modulo]/[leccion]/page.tsx`** - Lección (Ruta Antigua)
   - ⚠️ **Estado**: ❌ **ELIMINAR**
   - **Problema**:
     - ✅ Tiene datos hardcodeados: Objeto `leccionData` con contenido completo hardcodeado (línea 26)
     - ✅ Usa parámetros antiguos: `[materia]/[modulo]/[leccion]`
     - ✅ No se conecta a la base de datos real
   - **Reemplazo**: `/app/estudiante/cursos/[courseId]/leccion/[lessonId]/page.tsx` (versión funcional)
   - **Referencias encontradas**:
     - `/app/curso/[materia]/modulos/page.tsx` (línea 1104)
     - `/app/leccion/[materia]/[modulo]/[leccion]/page.tsx` (líneas 196, 232, 760)
   - **Recomendación**:
     - ❌ **ELIMINAR INMEDIATAMENTE** - Ruta antigua con datos hardcodeados

### 4. **`/app/curso/[materia]/page.tsx`** - Curso público (Ruta Antigua)
   - ⚠️ **Estado**: ❌ **ELIMINAR**
   - **Problema**:
     - ✅ Tiene datos hardcodeados: Objeto `curriculumData` con todo el currículo hardcodeado (línea 31)
     - ✅ Usa parámetro `[materia]` en lugar de `[courseId]`
     - ✅ No se conecta a la base de datos
     - ⚠️ Se referencia desde páginas públicas, pero muestra información estática
   - **Referencias encontradas**:
     - `/app/page.tsx` (líneas 796, 835, 874, 913, 952)
     - `/app/cursos/page.tsx` (línea 212)
   - **Recomendación**:
     - ❌ **ELIMINAR** - Página con datos hardcodeados
     - Actualizar referencias para que apunten a `/cursos` o redirigir a la página de cursos públicos

### 5. **`/app/curso/[materia]/modulos/page.tsx`** - Módulos de curso (Ruta Antigua)
   - ⚠️ **Estado**: ❌ **ELIMINAR**
   - **Problema**:
     - ✅ Tiene datos hardcodeados: Objeto `modulosData` con todos los módulos hardcodeados (línea 24)
     - ✅ Usa parámetro `[materia]` en lugar de `[courseId]`
     - ✅ No se conecta a la base de datos
   - **Reemplazo**: `/app/estudiante/cursos/[courseId]/modulos/page.tsx` (versión funcional)
   - **Referencias encontradas**:
     - `/app/leccion/[materia]/[modulo]/[leccion]/page.tsx` (línea 232) - que también se elimina
   - **Recomendación**:
     - ❌ **ELIMINAR INMEDIATAMENTE** - Ruta antigua con datos hardcodeados

---

## 🔄 PÁGINAS DE REDIRECCIÓN

### 1. **`/app/dashboard/page.tsx`** - Dashboard genérico
   - 🔄 **Estado**: Solo redirige
   - **Uso**: Redirige automáticamente según el rol del usuario
   - **Rutas**: `/dashboard`
   - **Recomendación**:
     - ✅ **MANTENER** - Útil como ruta genérica que redirige según el rol
     - O eliminar si no se usa en ningún lugar

---

## 📊 Resumen de Recomendaciones

### ❌ ELIMINAR INMEDIATAMENTE (Todas con datos hardcodeados):
1. ❌ `/app/examen/page.tsx` - Página demo de examen (datos hardcodeados)
2. ❌ `/app/examen/resultado/page.tsx` - Página demo de resultados (datos hardcodeados)
3. ❌ `/app/leccion/[materia]/[modulo]/[leccion]/page.tsx` - Ruta antigua de lecciones (datos hardcodeados)
4. ❌ `/app/curso/[materia]/page.tsx` - Curso público (datos hardcodeados)
5. ❌ `/app/curso/[materia]/modulos/page.tsx` - Módulos de curso (datos hardcodeados)

**Total: 5 páginas a eliminar** - Todas tienen datos hardcodeados y no se conectan a la base de datos.

### ✅ Mantener:
- `/app/dashboard/page.tsx` - Útil como redirección genérica según rol

---

## 🔗 Referencias a Actualizar

Si se eliminan las páginas obsoletas, actualizar:

1. **`/app/page.tsx`**:
   - Línea 294: Link a `/examen` en el footer
   - Líneas 796, 835, 874, 913, 952: Links a `/curso/[materia]`

2. **`/app/cursos/page.tsx`**:
   - Línea 212: Link a `/curso/${curso.id}`
   - Línea 264: Link a `/examen`

3. **`/app/curso/[materia]/modulos/page.tsx`**:
   - Línea 1104: Link a `/leccion/[materia]/[modulo]/[leccion]`

---

## 📝 Notas Adicionales

- Las páginas en `/app/estudiante/*` son las versiones modernas y activas que se conectan a la base de datos
- Las páginas en `/app/curso/*` y `/app/leccion/*` son rutas antiguas con datos hardcodeados
- Las páginas en `/app/examen/*` son demos/ejemplos que no se usan en producción
- El middleware no protege las rutas públicas antiguas, por lo que técnicamente son accesibles pero no deberían usarse

---

**Fecha de análisis**: 2024
**Total de páginas analizadas**: 18
**Páginas activas**: 12
**Páginas a eliminar**: 5 (TODAS con datos hardcodeados)
**Páginas de redirección**: 1

## ✅ CONFIRMACIÓN FINAL

**Todas las páginas identificadas como obsoletas tienen datos hardcodeados y NO se conectan a la base de datos. Son páginas demo/ejemplo que ya no se necesitan porque existen versiones funcionales en `/estudiante/*` que sí se conectan a la base de datos.**

