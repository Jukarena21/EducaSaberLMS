# Estructura y Relaciones de los Cursos

## 📚 Modelo de Datos

### **Course (Curso)**
Un curso es la unidad principal de contenido educativo en el sistema.

**Campos principales:**
- `id`: Identificador único
- `title`: Título del curso
- `description`: Descripción del contenido
- `competencyId`: **Relación obligatoria** con una Competencia (Matemáticas, Lectura Crítica, etc.)
- `academicGrade`: Año escolar ('sexto', 'septimo', 'octavo', 'noveno', 'decimo', 'once')
- `schoolId`: **Opcional** - Si está presente, el curso es específico de un colegio. Si es `null`, el curso es general/plataforma
- `createdById`: Usuario que creó el curso (teacher_admin o school_admin)
- `isPublished`: Si el curso está publicado y disponible
- `totalModules`: Contador calculado de módulos
- `totalLessons`: Contador calculado de lecciones

## 🔗 Relaciones del Curso

### 1. **Curso → Competencia** (Muchos a Uno)
- **Relación:** Un curso **debe** pertenecer a una competencia
- **Ejemplo:** "Matemáticas 6to Grado" pertenece a la competencia "Matemáticas"
- **Restricción:** Un curso solo puede tener UNA competencia

### 2. **Curso → Colegio** (Muchos a Uno, Opcional)
- **Relación:** Un curso puede ser específico de un colegio o general
- **Si `schoolId` es `null`:** Curso general disponible para todos los colegios
- **Si `schoolId` tiene valor:** Curso específico solo para ese colegio
- **Uso:** Permite personalización por institución

### 3. **Curso → Módulos** (Muchos a Muchos)
- **Relación:** Un curso puede tener múltiples módulos, y un módulo puede estar en múltiples cursos
- **Tabla intermedia:** `CourseModule`
  - `courseId`: ID del curso
  - `moduleId`: ID del módulo
  - `orderIndex`: Orden del módulo dentro del curso
- **Ejemplo:** 
  - Curso "Matemáticas 6to" puede tener módulos: "Números Naturales", "Fracciones", "Geometría"
  - El módulo "Fracciones" puede estar en "Matemáticas 6to" y "Matemáticas 7mo"

### 4. **Curso → Estudiantes** (Muchos a Muchos)
- **Relación:** Un estudiante puede estar inscrito en múltiples cursos
- **Tabla intermedia:** `CourseEnrollment`
  - `userId`: ID del estudiante
  - `courseId`: ID del curso
  - `enrolledAt`: Fecha de inscripción
  - `completedAt`: Fecha de finalización (si aplica)
  - `isActive`: Si la inscripción está activa
- **Progreso:** Se guarda en `StudentCourseProgress`

### 5. **Curso → Exámenes** (Uno a Muchos)
- **Relación:** Un curso puede tener múltiples exámenes
- **Campo en Exam:** `courseId` (opcional)
- **Tipos de exámenes:**
  - Exámenes específicos del curso
  - Simulacros completos (pueden no tener `courseId`)

### 6. **Curso → Usuario Creador** (Muchos a Uno)
- **Relación:** Un curso fue creado por un usuario (teacher_admin o school_admin)
- **Campo:** `createdById`

## 📊 Jerarquía de Contenido

```
Curso
  └── Módulos (CourseModule)
      └── Lecciones (ModuleLesson)
          └── Preguntas (LessonQuestion)
```

**Flujo:**
1. **Curso** contiene **Módulos** (a través de `CourseModule`)
2. **Módulos** contienen **Lecciones** (a través de `ModuleLesson`)
3. **Lecciones** contienen **Preguntas** (a través de `LessonQuestion`)

**Nota importante:** Los módulos son **independientes** de los cursos. Un módulo puede existir sin estar en ningún curso, y puede ser reutilizado en múltiples cursos.

## 🎯 Reglas de Negocio

### **Creación de Cursos**

1. **Permisos:**
   - `teacher_admin`: Puede crear cursos para cualquier colegio o cursos generales
   - `school_admin`: Solo puede crear cursos para su propio colegio

2. **Requisitos:**
   - Debe tener al menos un módulo seleccionado
   - Debe tener una competencia asignada
   - Debe tener un año escolar

3. **Restricciones:**
   - Un curso debe tener al menos un módulo
   - Los módulos se seleccionan de una lista de módulos disponibles (creados previamente)

### **Inscripción de Estudiantes**

1. **Proceso:**
   - El estudiante busca cursos disponibles
   - Puede filtrar por competencia, grado, colegio
   - Al inscribirse, se crea un registro en `CourseEnrollment`
   - Se crean registros de progreso iniciales para todas las lecciones del curso

2. **Validaciones:**
   - El curso debe estar publicado (`isPublished = true`)
   - El estudiante no debe estar ya inscrito
   - Si el curso tiene prerequisitos, el estudiante debe haberlos completado

3. **Progreso:**
   - Se crea `StudentCourseProgress` para el curso
   - Se crean `StudentModuleProgress` para cada módulo
   - Se crean `StudentLessonProgress` para cada lección

### **Visibilidad de Cursos**

1. **Para estudiantes:**
   - Ven cursos disponibles según su colegio
   - Cursos generales (`schoolId = null`) están disponibles para todos
   - Cursos específicos de colegio solo para estudiantes de ese colegio

2. **Para administradores:**
   - `school_admin`: Solo ve cursos de su colegio
   - `teacher_admin`: Ve todos los cursos, puede filtrar por colegio

## 🔄 Flujo de Trabajo Típico

### **Crear un Curso (Admin)**

1. **Profesor Admin crea módulos:**
   - Crea módulos independientes con lecciones y preguntas
   - Los módulos pueden tener una competencia asociada (opcional)

2. **Admin crea curso:**
   - Selecciona competencia, año escolar, colegio (opcional)
   - Selecciona módulos existentes para incluir en el curso
   - Define el orden de los módulos en el curso

3. **Publicar curso:**
   - Marca `isPublished = true`
   - El curso queda disponible para inscripción

### **Estudiante se Inscribe**

1. **Explorar catálogo:**
   - Ve cursos disponibles filtrados por su colegio
   - Puede filtrar por competencia, grado

2. **Inscribirse:**
   - Selecciona un curso
   - Se crea `CourseEnrollment`
   - Se inicializan todos los registros de progreso

3. **Estudiar:**
   - Accede a módulos del curso en orden
   - Completa lecciones dentro de cada módulo
   - El progreso se actualiza automáticamente

## 📈 Progreso y Métricas

### **Progreso del Curso**
- Se calcula basado en el progreso de los módulos
- `StudentCourseProgress.progressPercentage`: Porcentaje de completitud
- `StudentCourseProgress.completedModulesCount`: Módulos completados

### **Progreso del Módulo**
- Se calcula basado en el progreso de las lecciones
- `StudentModuleProgress.progressPercentage`: Porcentaje de completitud
- `StudentModuleProgress.completedLessonsCount`: Lecciones completadas

### **Progreso de la Lección**
- Se calcula basado en contenido completado (video, teoría, ejercicios)
- `StudentLessonProgress.progressPercentage`: Porcentaje de completitud
- `StudentLessonProgress.videoCompleted`, `theoryCompleted`, `exercisesCompleted`: Flags booleanos

## 🎓 Ejemplo Práctico

**Curso: "Matemáticas 6to Grado - Colegio ABC"**

```
Curso:
  - id: "course-123"
  - title: "Matemáticas 6to Grado"
  - competencyId: "matematicas"
  - academicGrade: "sexto"
  - schoolId: "school-abc"
  
  Módulos (CourseModule):
    1. Módulo "Números Naturales" (orderIndex: 1)
       - Lecciones:
         - "Introducción a números naturales"
         - "Operaciones básicas"
         - "Problemas con números naturales"
    
    2. Módulo "Fracciones" (orderIndex: 2)
       - Lecciones:
         - "Concepto de fracción"
         - "Suma y resta de fracciones"
         - "Multiplicación y división de fracciones"
    
    3. Módulo "Geometría Básica" (orderIndex: 3)
       - Lecciones:
         - "Figuras planas"
         - "Perímetro y área"
         - "Volumen"

Estudiantes inscritos (CourseEnrollment):
  - Estudiante "Juan Pérez" (enrolledAt: 2024-01-15)
  - Estudiante "María García" (enrolledAt: 2024-01-20)
```

## ⚠️ Puntos Importantes

1. **Módulos son reutilizables:** Un módulo puede estar en múltiples cursos
2. **Cursos pueden ser generales o específicos:** Depende de si tienen `schoolId`
3. **El orden importa:** Los módulos tienen `orderIndex` dentro del curso
4. **Progreso en cascada:** El progreso del curso depende del progreso de módulos y lecciones
5. **Un curso = una competencia:** Un curso solo puede pertenecer a una competencia
6. **Un curso puede tener múltiples exámenes:** Los exámenes pueden estar asociados a un curso específico

