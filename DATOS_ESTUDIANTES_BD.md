# Datos de Estudiantes en la Base de Datos

## Resumen

El modelo `User` en Prisma almacena información completa de estudiantes. A continuación se detalla todos los campos disponibles, organizados por categorías.

---

## 📋 Campos Requeridos (Obligatorios)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String | ID único del usuario (generado automáticamente) |
| `email` | String | Correo electrónico (único, usado para login) |
| `passwordHash` | String | Hash de la contraseña (encriptado) |
| `role` | String | Rol del usuario: `'student'`, `'school_admin'`, `'teacher_admin'` |
| `firstName` | String | Nombre del estudiante |
| `lastName` | String | Apellido del estudiante |
| `createdAt` | DateTime | Fecha de creación (automático) |
| `updatedAt` | DateTime | Fecha de última actualización (automático) |

---

## 👤 Información Personal (Opcional)

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `avatarUrl` | String? | URL de la foto de perfil | `/avatars/student-123.jpg` |
| `dateOfBirth` | DateTime? | Fecha de nacimiento | `2005-03-15` |
| `gender` | String? | Género | `'M'`, `'F'`, `'Otro'` |
| `documentType` | String? | Tipo de documento | `'CC'`, `'TI'`, `'CE'` |
| `documentNumber` | String? | Número de documento | `'1234567890'` |
| `address` | String? | Dirección completa | `'Calle 123 #45-67'` |
| `neighborhood` | String? | Barrio | `'Centro'` |
| `city` | String? | Ciudad | `'Bogotá'` |
| `socioeconomicStratum` | Int? | Estrato socioeconómico (1-6) | `3` |
| `housingType` | String? | Tipo de vivienda | `'Casa'`, `'Apartamento'`, `'Finca'` |

---

## 🎓 Información Educativa (Opcional)

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `schoolId` | String? | ID del colegio al que pertenece | `'cmgvxw59t000711uo73pphme7'` |
| `schoolEntryYear` | Int? | Año de ingreso al colegio | `2020` |
| `academicAverage` | Float? | Promedio académico general | `85.5` |
| `areasOfDifficulty` | String? | Áreas de dificultad (JSON array) | `["Matemáticas", "Física"]` |
| `areasOfStrength` | String? | Áreas de fortaleza (JSON array) | `["Lectura", "Inglés"]` |
| `repetitionHistory` | Boolean | Historial de repetición de grado | `false` (default) |
| `schoolSchedule` | String? | Jornada escolar | `'diurno'`, `'nocturno'`, `'ambos'` |

**Nota:** El campo `academicGrade` (grado académico) **NO existe directamente en User**. Se obtiene a través de los cursos en los que está inscrito (`Course.academicGrade`).

---

## 🏥 Condiciones Especiales (Opcional)

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `disabilities` | String? | Discapacidades (JSON array) | `["Visual", "Auditiva"]` |
| `specialEducationalNeeds` | String? | Necesidades educativas especiales | `'TDAH'`, `'Dislexia'` |
| `medicalConditions` | String? | Condiciones médicas | `'Asma'`, `'Diabetes'` |
| `homeTechnologyAccess` | Boolean? | Acceso a tecnología en casa | `true` |
| `homeInternetAccess` | Boolean? | Acceso a internet en casa | `true` |

---

## 💻 Métricas de Plataforma (Automáticas)

Estos campos se actualizan automáticamente según el uso de la plataforma:

| Campo | Tipo | Descripción | Default |
|-------|------|-------------|---------|
| `totalPlatformTimeMinutes` | Int | Tiempo total en la plataforma (minutos) | `0` |
| `sessionsStarted` | Int | Número de sesiones iniciadas | `0` |
| `lastSessionAt` | DateTime? | Fecha de última sesión | `null` |
| `preferredDevice` | String? | Dispositivo preferido | `null` |
| `preferredBrowser` | String? | Navegador preferido | `null` |
| `averageSessionTimeMinutes` | Int | Tiempo promedio por sesión (minutos) | `0` |

---

## 🔗 Relaciones (Datos Relacionados)

A través de relaciones, también tenemos acceso a:

### Datos del Colegio
- `school.name` - Nombre del colegio
- `school.city` - Ciudad del colegio
- `school.institutionType` - Tipo de institución

### Progreso Académico
- `studentCourseProgress[]` - Progreso en cada curso
- `studentLessonProgress[]` - Progreso en lecciones
- `studentModuleProgress[]` - Progreso en módulos
- `studentContentProgress[]` - Progreso en contenido

### Evaluaciones
- `examResults[]` - Resultados de exámenes
- `examQuestionAnswers[]` - Respuestas a preguntas individuales

### Inscripciones
- `courseEnrollments[]` - Cursos en los que está inscrito

### Gamificación
- `userAchievements[]` - Logros desbloqueados
- `userStats` - Estadísticas de usuario

### Metas
- `goals[]` - Metas establecidas

---

## 📝 Formularios de Creación

### Componente: `UserForm.tsx` / `StudentForm.tsx`

El formulario permite capturar:

**Pestaña 1: Información Básica**
- ✅ Email (requerido)
- ✅ Contraseña (requerido al crear)
- ✅ Nombre (requerido)
- ✅ Apellido (requerido)
- ✅ Rol (requerido, para estudiantes: `'student'`)
- ✅ Colegio (requerido para estudiantes)

**Pestaña 2: Información Personal**
- 📅 Fecha de nacimiento
- 👤 Género
- 🆔 Tipo de documento
- 🆔 Número de documento
- 📍 Dirección
- 📍 Barrio
- 📍 Ciudad
- 💰 Estrato socioeconómico (1-6)
- 🏠 Tipo de vivienda

**Pestaña 3: Información Educativa**
- 📚 Año de ingreso al colegio
- 📊 Promedio académico
- ⚠️ Áreas de dificultad (múltiple selección)
- ✅ Áreas de fortaleza (múltiple selección)
- 🔄 Historial de repetición (checkbox)
- ⏰ Jornada escolar

**Pestaña 4: Condiciones Especiales**
- ♿ Discapacidades (múltiple selección)
- 🎓 Necesidades educativas especiales
- 🏥 Condiciones médicas
- 💻 Acceso a tecnología en casa (checkbox)
- 🌐 Acceso a internet en casa (checkbox)

---

## 🔍 Campos que NO Existen (pero podrían ser útiles)

Actualmente **NO** guardamos:
- ❌ `academicGrade` - Grado académico (se obtiene de cursos)
- ❌ `phone` / `contactPhone` - Teléfono de contacto
- ❌ `parentName` - Nombre del acudiente
- ❌ `parentEmail` - Email del acudiente
- ❌ `parentPhone` - Teléfono del acudiente
- ❌ `emergencyContact` - Contacto de emergencia
- ❌ `bloodType` - Tipo de sangre
- ❌ `allergies` - Alergias
- ❌ `medications` - Medicamentos
- ❌ `transportationMethod` - Medio de transporte
- ❌ `lunchProgram` - Programa de alimentación
- ❌ `scholarship` - Beca o subsidio

---

## 📊 Ejemplo de Datos Completos

```json
{
  "id": "cmgvxw59t000711uo73pphme7",
  "email": "estudiante@ejemplo.com",
  "role": "student",
  "firstName": "Juan",
  "lastName": "Pérez",
  "avatarUrl": "/avatars/juan-perez.jpg",
  
  "dateOfBirth": "2005-03-15T00:00:00.000Z",
  "gender": "M",
  "documentType": "TI",
  "documentNumber": "1234567890",
  "address": "Calle 123 #45-67",
  "neighborhood": "Centro",
  "city": "Bogotá",
  "socioeconomicStratum": 3,
  "housingType": "Apartamento",
  
  "schoolId": "school-123",
  "schoolEntryYear": 2020,
  "academicAverage": 85.5,
  "areasOfDifficulty": "[\"Matemáticas\", \"Física\"]",
  "areasOfStrength": "[\"Lectura\", \"Inglés\"]",
  "repetitionHistory": false,
  "schoolSchedule": "diurno",
  
  "disabilities": null,
  "specialEducationalNeeds": null,
  "medicalConditions": null,
  "homeTechnologyAccess": true,
  "homeInternetAccess": true,
  
  "totalPlatformTimeMinutes": 1250,
  "sessionsStarted": 45,
  "lastSessionAt": "2024-01-15T10:30:00.000Z",
  "preferredDevice": "Desktop",
  "preferredBrowser": "Chrome",
  "averageSessionTimeMinutes": 28,
  
  "createdAt": "2023-09-01T08:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## 🎯 Uso de los Datos

### Para Análisis y Reportes:
- **Edad**: Calculada desde `dateOfBirth`
- **Estrato**: `socioeconomicStratum` - usado en filtros y comparaciones
- **Género**: `gender` - usado en filtros y análisis
- **Grado**: Obtenido de `courseEnrollments[].course.academicGrade`

### Para Personalización:
- **Áreas de dificultad**: `areasOfDifficulty` - para recomendar contenido
- **Áreas de fortaleza**: `areasOfStrength` - para destacar logros
- **Necesidades especiales**: `specialEducationalNeeds` - para adaptar contenido

### Para Métricas:
- **Tiempo en plataforma**: `totalPlatformTimeMinutes`
- **Actividad**: `sessionsStarted`, `lastSessionAt`
- **Preferencias**: `preferredDevice`, `preferredBrowser`

---

## 📌 Notas Importantes

1. **Grado Académico**: No se guarda directamente en `User`. Se obtiene de los cursos inscritos (`Course.academicGrade`).

2. **Datos JSON**: Algunos campos como `areasOfDifficulty`, `areasOfStrength`, y `disabilities` se guardan como strings JSON que deben parsearse.

3. **Campos Opcionales**: La mayoría de campos son opcionales, permitiendo crear estudiantes con información mínima (email, nombre, apellido).

4. **Métricas Automáticas**: Los campos de métricas se actualizan automáticamente según el uso, no se editan manualmente.

5. **Relaciones**: Muchos datos adicionales están en tablas relacionadas (progreso, exámenes, logros, etc.).

---

## 🔄 Flujo de Creación

1. **Formulario** (`UserForm.tsx` / `StudentForm.tsx`) → Captura datos
2. **API** (`/api/users` POST) → Valida y crea usuario
3. **Base de Datos** → Almacena en tabla `users`
4. **Relaciones** → Se crean automáticamente cuando el estudiante:
   - Se inscribe en cursos
   - Completa lecciones
   - Presenta exámenes
   - Desbloquea logros

