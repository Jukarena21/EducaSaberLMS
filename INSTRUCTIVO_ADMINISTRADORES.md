# 📚 Instructivo para Administradores - EducaSaber LMS

## 🎯 **Roles y Permisos**

### 👨‍💼 **Profesor Administrador (teacher_admin)**
- **Acceso completo** a todas las funcionalidades
- Puede crear, editar y eliminar: lecciones, módulos, cursos, preguntas
- Puede gestionar múltiples colegios
- Puede crear y eliminar usuarios
- Acceso a configuración y carga masiva

### 🏫 **Administrador de Colegio (school_admin)**
- **Acceso limitado** a su institución
- Solo puede crear y gestionar **cursos**
- Puede **consultar** lecciones y módulos existentes
- Puede **editar** usuarios (no crear ni eliminar)
- **NO** puede crear lecciones, módulos o preguntas
- **NO** tiene acceso a configuración

---

## 📋 **Proceso de Creación de Contenido Educativo**

### 🔄 **Orden Correcto de Creación**

```
1️⃣ COMPETENCIAS (ya existen en el sistema)
   ↓
2️⃣ LECCIONES (crear contenido individual)
   ↓
3️⃣ MÓDULOS (agrupar lecciones por competencia)
   ↓
4️⃣ CURSOS (combinar módulos para un programa completo)
   ↓
5️⃣ PREGUNTAS (evaluar el aprendizaje)
   ↓
6️⃣ EXÁMENES (evaluaciones formales)
```

---

## 📖 **1. LECCIONES**

### 🎯 **¿Qué son las Lecciones?**
- **Unidad básica** de contenido educativo
- Contiene: video, teoría, ejercicios
- Se asigna a una **competencia específica**
- Tiempo estimado de estudio

### ✅ **Quién puede crear Lecciones:**
- **Solo Profesor Administrador (teacher_admin)**
- **NO** Administrador de Colegio

### 📝 **Proceso de Creación:**
1. Ir a pestaña **"📖 Lecciones"**
2. Hacer clic en **"Nueva Lección"**
3. Completar formulario:
   - **Título**: Nombre descriptivo
   - **Descripción**: Objetivos y contenido
   - **Competencia**: Seleccionar de la lista
   - **Tiempo estimado**: En minutos
   - **Video URL**: Enlace al video (opcional)
   - **Contenido teórico**: Texto explicativo
4. Guardar

### 🔍 **Para Administradores de Colegio:**
- **Solo pueden VER** las lecciones existentes
- **NO pueden crear, editar ni eliminar**
- Útil para **planificar cursos** con contenido disponible

---

## 📚 **2. MÓDULOS**

### 🎯 **¿Qué son los Módulos?**
- **Agrupación** de lecciones relacionadas
- Organizados por **competencia**
- Estructura lógica de aprendizaje
- Preparación para crear cursos

### ✅ **Quién puede crear Módulos:**
- **Solo Profesor Administrador (teacher_admin)**
- **NO** Administrador de Colegio

### 📝 **Proceso de Creación:**
1. Ir a pestaña **"📚 Módulos"**
2. Hacer clic en **"Nuevo Módulo"**
3. Completar formulario:
   - **Título**: Nombre del módulo
   - **Descripción**: Objetivos del módulo
   - **Competencia**: Seleccionar competencia
   - **Lecciones**: Agregar lecciones existentes
4. **Importante**: Solo aparecen lecciones de la competencia seleccionada
5. Guardar

### 🔍 **Para Administradores de Colegio:**
- **Solo pueden VER** los módulos existentes
- **NO pueden crear, editar ni eliminar**
- Útil para **seleccionar módulos** al crear cursos

---

## 🎓 **3. CURSOS**

### 🎯 **¿Qué son los Cursos?**
- **Programa completo** de aprendizaje
- Combina múltiples módulos
- Dirigido a un **grado académico específico**
- Asignado a una **institución**

### ✅ **Quién puede crear Cursos:**
- **Profesor Administrador**: Puede crear para cualquier colegio
- **Administrador de Colegio**: Solo para su institución

### 📝 **Proceso de Creación:**

#### **Para Profesor Administrador:**
1. Ir a pestaña **"🎓 Cursos"**
2. Hacer clic en **"Nuevo Curso"**
3. Completar formulario:
   - **Título**: Nombre del curso
   - **Descripción**: Objetivos y contenido
   - **Colegio**: Seleccionar institución
   - **Grado académico**: 6° a 11°
   - **Módulos**: Seleccionar módulos existentes
4. Guardar

#### **Para Administrador de Colegio:**
1. Ir a pestaña **"🎓 Cursos"**
2. Hacer clic en **"Nuevo Curso"**
3. Completar formulario:
   - **Título**: Nombre del curso
   - **Descripción**: Objetivos y contenido
   - **Colegio**: Se asigna automáticamente
   - **Grado académico**: 6° a 11°
   - **Módulos**: Seleccionar módulos existentes
4. Guardar

### 🔍 **Diferencias por Rol:**
- **Profesor Administrador**: Ve todos los cursos del sistema
- **Administrador de Colegio**: Solo ve cursos de su institución

---

## ❓ **4. PREGUNTAS**

### 🎯 **¿Qué son las Preguntas?**
- **Evaluaciones** del contenido
- Diferentes tipos: opción múltiple, verdadero/falso, ensayo
- Asignadas a lecciones específicas
- Base para crear exámenes

### ✅ **Quién puede crear Preguntas:**
- **Solo Profesor Administrador (teacher_admin)**
- **NO** Administrador de Colegio

### 📝 **Proceso de Creación:**
1. Ir a pestaña **"❓ Preguntas"**
2. Hacer clic en **"Nueva Pregunta"**
3. Completar formulario:
   - **Tipo**: Opción múltiple, verdadero/falso, ensayo
   - **Enunciado**: Texto de la pregunta
   - **Opciones**: A, B, C, D (si aplica)
   - **Respuesta correcta**: Seleccionar
   - **Explicación**: Por qué es correcta
   - **Lección**: Asignar a lección específica
4. Guardar

### 🔍 **Para Administradores de Colegio:**
- **Solo pueden VER** las preguntas existentes
- **NO pueden crear, editar ni eliminar**
- Útil para **consultar** preguntas disponibles al crear exámenes

---

## 📝 **5. EXÁMENES**

### 🎯 **¿Qué son los Exámenes?**
- **Evaluaciones formales** para estudiantes
- Combinan preguntas de diferentes lecciones
- Configurables por tiempo y puntaje
- Generan resultados y estadísticas

### ✅ **Quién puede crear Exámenes:**
- **Profesor Administrador**: Puede crear para cualquier colegio
- **Administrador de Colegio**: Solo para su institución

### 📝 **Proceso de Creación:**
1. Ir a pestaña **"📝 Exámenes"**
2. Hacer clic en **"Nuevo Examen"**
3. Completar formulario:
   - **Título**: Nombre del examen
   - **Tipo**: Por competencia, por módulo, completo
   - **Tiempo límite**: En minutos
   - **Puntaje mínimo**: Para aprobar
   - **Preguntas**: Seleccionar cantidad por módulo
4. Guardar

---

## 👥 **6. GESTIÓN DE USUARIOS**

### 🎯 **Diferencias por Rol:**

#### **Profesor Administrador:**
- ✅ **Crear** nuevos usuarios (estudiantes, admins)
- ✅ **Editar** información de usuarios
- ✅ **Eliminar** usuarios
- ✅ **Ver** usuarios de todas las instituciones

#### **Administrador de Colegio:**
- ❌ **NO puede crear** usuarios
- ✅ **Editar** información de usuarios existentes
- ❌ **NO puede eliminar** usuarios
- ✅ **Ver** solo usuarios de su institución

---

## 🔄 **Flujo de Trabajo Recomendado**

### **Para Profesor Administrador:**
```
1. Crear Competencias (si no existen)
2. Crear Lecciones por competencia
3. Crear Módulos agrupando lecciones
4. Crear Preguntas para evaluar
5. Crear Cursos combinando módulos
6. Crear Exámenes para evaluar
7. Gestionar usuarios del sistema
```

### **Para Administrador de Colegio:**
```
1. Consultar Lecciones disponibles
2. Consultar Módulos disponibles
3. Crear Cursos para su institución
4. Crear Exámenes para sus estudiantes
5. Editar información de usuarios
6. Supervisar progreso de estudiantes
```

---

## 📊 **7. ANALYTICS Y REPORTES**

### 🎯 **Funcionalidades Disponibles:**
- **KPIs**: Estudiantes activos, exámenes realizados, promedios
- **Gráficos**: Evolución por materia, distribución de calificaciones
- **Filtros**: Por colegio, curso, grado, competencia
- **Exportación**: Reportes en CSV

### ✅ **Acceso:**
- **Ambos roles** tienen acceso completo a analytics
- **Filtros automáticos** según el rol:
  - Profesor Administrador: Ve todo el sistema
  - Administrador de Colegio: Solo su institución

---

## ⚠️ **Consideraciones Importantes**

### 🔒 **Restricciones de Seguridad:**
- Los Administradores de Colegio **NO pueden** acceder a datos de otras instituciones
- Las lecciones y módulos son **compartidos** entre instituciones
- Los cursos son **específicos** por institución

### 📈 **Mejores Prácticas:**
1. **Planificar** antes de crear contenido
2. **Reutilizar** lecciones y módulos existentes
3. **Asignar competencias** correctamente
4. **Crear preguntas** variadas y de calidad
5. **Probar exámenes** antes de publicarlos

### 🆘 **Soporte:**
- Para dudas técnicas, contactar al Profesor Administrador
- Para contenido educativo, coordinar con el equipo académico
- Revisar analytics regularmente para mejorar el contenido

---

## 📞 **Contacto y Soporte**

- **Profesor Administrador**: Acceso completo al sistema
- **Administrador de Colegio**: Soporte limitado a su institución
- **Estudiantes**: Acceso solo a cursos asignados

---

*Este instructivo está actualizado según las funcionalidades actuales del sistema EducaSaber LMS.*
