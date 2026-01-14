# 📋 Revisión de Campos para Carga Masiva

## 🔍 Análisis por Tipo

### 1. ESTUDIANTES (User)

#### ✅ Campos Requeridos (Mínimos):
- `email` - Correo electrónico único
- `firstName` - Nombre
- `lastName` - Apellido

#### 📝 Campos Opcionales Útiles (Agrupar por sección):
**Información Personal:**
- `dateOfBirth` - Fecha de nacimiento (YYYY-MM-DD)
- `gender` - Género (male/female/other)
- `documentType` - Tipo de documento (TI/CC/CE)
- `documentNumber` - Número de documento
- `address` - Dirección
- `neighborhood` - Barrio
- `city` - Ciudad
- `contactPhone` - Teléfono de contacto
- `socioeconomicStratum` - Estrato (1-6)
- `housingType` - Tipo de vivienda

**Información Académica:**
- `schoolId` - ID del colegio (se puede buscar después)
- `schoolEntryYear` - Año de ingreso al colegio
- `academicAverage` - Promedio académico (0.0-5.0)
- `areasOfDifficulty` - Áreas de dificultad (separadas por punto y coma)
- `areasOfStrength` - Áreas de fortaleza (separadas por punto y coma)
- `repetitionHistory` - Historial de repetición (sí/no)
- `schoolSchedule` - Jornada escolar (diurno/nocturno)

**Condiciones Especiales:**
- `disabilities` - Discapacidades (separadas por punto y coma)
- `specialEducationalNeeds` - Necesidades educativas especiales
- `medicalConditions` - Condiciones médicas
- `homeTechnologyAccess` - Acceso a tecnología en casa (sí/no)
- `homeInternetAccess` - Acceso a internet en casa (sí/no)

**❌ NO incluir en plantilla:**
- `role` - Siempre será 'student'
- `passwordHash` - Se genera automáticamente
- `totalPlatformTimeMinutes` - Se calcula automáticamente
- `sessionsStarted` - Se calcula automáticamente
- Métricas de plataforma (se generan automáticamente)

---

### 2. COLEGIOS (School)

#### ✅ Campos Requeridos (Mínimos):
- `name` - Nombre del colegio
- `city` - Ciudad

#### 📝 Campos Opcionales Útiles:
**Información Básica:**
- `daneCode` - Código DANE (único)
- `institutionType` - Tipo de institución (publica/privada/otro)
- `academicCalendar` - Calendario académico (diurno/nocturno/ambos)
- `neighborhood` - Barrio
- `address` - Dirección

**Información de Contacto:**
- `contactEmail` - Correo de contacto
- `contactPhone` - Teléfono de contacto
- `website` - Sitio web

**❌ NO incluir en plantilla:**
- `type` - Siempre será 'school' por defecto
- `totalStudents` - Se calcula automáticamente
- `numberOfCampuses` - Tiene valor por defecto
- `yearsOfOperation` - No es crítico para carga inicial
- `qualityCertifications` - JSON complejo, mejor desde UI
- `logoUrl` - Se sube desde UI
- `themePrimary/Secondary/Accent` - Se configura desde UI
- Métricas de uso (se calculan automáticamente)

---

### 3. LECCIONES (Lesson)

#### ✅ Campos Requeridos (Mínimos):
- `title` - Título de la lección

#### 📝 Campos Opcionales Útiles:
**Contenido:**
- `description` - Descripción breve
- `estimatedTimeMinutes` - Tiempo estimado en minutos
- `videoUrl` - URL del video (YouTube, Vimeo, etc.)
- `videoDescription` - Descripción del video
- `theoryContent` - Contenido teórico (HTML permitido)
- `competencyId` - ID de competencia (opcional, se puede asociar después)

**❌ NO incluir en plantilla:**
- `isPublished` - Se configura desde UI
- `id` - Se genera automáticamente
- Relaciones con módulos (se hacen desde UI)

**⚠️ PROBLEMA ACTUAL:**
La API actualmente requiere `description`, `estimatedTimeMinutes` y `theoryContent`, pero esto es muy restrictivo. Debería ser más flexible.

---

### 4. PREGUNTAS (LessonQuestion)

#### ✅ Campos Requeridos (Mínimos):
- `questionText` - Texto de la pregunta
- `optionA` - Opción A
- `optionB` - Opción B
- `optionC` - Opción C
- `optionD` - Opción D
- `correctOption` - Respuesta correcta (A/B/C/D)

#### 📝 Campos Opcionales Útiles:
**Contenido:**
- `lessonId` - ID de lección (opcional, se puede asociar después)
- `questionType` - Tipo de pregunta (multiple_choice/true_false/fill_blank/matching/essay)
- `explanation` - Explicación de la respuesta
- `difficultyLevel` - Nivel de dificultad (facil/medio/dificil)
- `orderIndex` - Orden dentro de la lección
- `timeLimit` - Tiempo límite en segundos

**Imágenes (URLs):**
- `questionImage` - URL de imagen en el enunciado
- `optionAImage` - URL de imagen para opción A
- `optionBImage` - URL de imagen para opción B
- `optionCImage` - URL de imagen para opción C
- `optionDImage` - URL de imagen para opción D
- `explanationImage` - URL de imagen en la explicación

**❌ NO incluir en plantilla inicial:**
- Imágenes (son opcionales y complejas para CSV)

---

## 🎯 Mejoras Propuestas

### 1. Simplificar Plantillas
- Agrupar campos por sección con comentarios
- Incluir solo campos más comunes/usados
- Agregar ejemplos claros y realistas
- Incluir instrucciones en la primera fila (comentarios)

### 2. Flexibilizar Validación
- **Lecciones**: Solo requerir `title`, hacer el resto opcional
- **Estudiantes**: Mantener solo email, nombre, apellido como requeridos
- **Colegios**: Mantener solo nombre y ciudad como requeridos

### 3. Mejorar Ejemplos
- Usar datos realistas pero genéricos
- Incluir múltiples ejemplos cuando sea útil
- Agregar notas explicativas

### 4. Organización Visual
- Agrupar campos relacionados
- Usar nombres de columnas claros y descriptivos
- Incluir fila de instrucciones (comentada o visible)

