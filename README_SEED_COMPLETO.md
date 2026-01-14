# 🌱 Seed Completo de Base de Datos

Este script genera una base de datos completa con datos de prueba para realizar testing exhaustivo de la plataforma.

## 📋 Contenido del Seed

### ✅ Competencias
- **5 Competencias ICFES:**
  - Lectura Crítica
  - Matemáticas
  - Ciencias Naturales
  - Ciencias Sociales y Ciudadanas
  - Inglés
- **4 Competencias Generales:**
  - Programación
  - Diseño Gráfico
  - Marketing Digital
  - Otros (reservada para cursos no-ICFES)

### 🏫 Instituciones (6 total)
- **3 Colegios:**
  - Colegio San José (Bogotá) - Privada
  - Instituto Técnico Industrial (Medellín) - Pública
  - Colegio de Prueba (Cali) - Privada
- **1 Empresa:**
  - TechSolutions S.A.S. (Bogotá)
- **1 Entidad Gubernamental:**
  - Secretaría de Educación Municipal (Bogotá)
- **1 Otro:**
  - Fundación Educativa Futuro (Barranquilla)

### 👥 Usuarios
- **3 Usuarios de Prueba Principales:**
  - `estudiante@test.com` / `123456` (Estudiante)
  - `admin@colegio.com` / `123456` (Admin Colegio)
  - `profesor@admin.com` / `123456` (Profesor Admin)
- **20 Estudiantes Adicionales:**
  - `estudiante1@test.com` a `estudiante20@test.com` / `123456`

### 📦 Módulos
- **Módulos ICFES:** ~90 módulos (15 tipos × 6 años escolares)
  - Distribuidos por competencia y año escolar (6-11)
- **Módulos Generales:** 2 módulos de programación

### 📖 Lecciones
- **~300-400 lecciones** distribuidas en todos los módulos
- Cada módulo tiene 3-5 lecciones con contenido completo
- Lecciones incluyen teoría y están listas para preguntas

### ❓ Preguntas
- **~1200-1500 preguntas** distribuidas en todas las lecciones
- Cada lección tiene 3-5 preguntas de opción múltiple
- Preguntas incluyen explicaciones y diferentes niveles de dificultad

### 📚 Cursos
- **Cursos ICFES:** ~30 cursos (5 competencias × 6 años)
  - Cursos publicados y asignados a colegios
  - Módulos correctamente relacionados
- **Cursos Generales:** 1 curso de programación
  - Asignado a empresa

### 📝 Exámenes
- **Simulacros Completos:** 2 exámenes (10° y 11°)
- **Exámenes por Competencia:** ~9 exámenes
- **Exámenes de Diagnóstico:** 3 exámenes (6°, 7°, 8°)
- Todos publicados y con fechas de apertura/cierre

### 📋 Inscripciones
- **~60-80 inscripciones** de estudiantes a cursos
- Cada estudiante inscrito en 2-4 cursos aleatorios

### 📊 Progreso
- **~40-60 registros de progreso** de lecciones
- Estudiantes con diferentes niveles de avance
- Algunas lecciones completadas, otras en progreso

### 📊 Resultados de Exámenes
- **~10-15 resultados** de exámenes completados
- Puntajes variados (50-90%)
- Fechas distribuidas en los últimos 7 días

## 🚀 Cómo Ejecutar

### Opción 1: Usando npm
```bash
npm run db:seed:complete
```

### Opción 2: Directamente con tsx
```bash
npx tsx prisma/seed-complete.ts
```

### Opción 3: Con Prisma
```bash
npx prisma db seed -- --file prisma/seed-complete.ts
```

## ⚠️ Advertencias

1. **Este script NO elimina datos existentes** - Usa `upsert` para evitar duplicados
2. **Puede tomar varios minutos** - Genera una gran cantidad de datos
3. **Recomendado para desarrollo/testing** - No usar en producción

## 🔄 Limpiar Base de Datos (Opcional)

Si quieres empezar desde cero, puedes ejecutar:

```bash
npx prisma migrate reset
```

Y luego ejecutar el seed completo.

## 📊 Estadísticas Esperadas

Después de ejecutar el seed, deberías tener aproximadamente:

- ✅ 9 Competencias (5 ICFES + 4 Generales)
- ✅ 6 Instituciones
- ✅ 23 Usuarios (20 estudiantes + 3 admins)
- ✅ ~90 Módulos ICFES + 2 Generales
- ✅ ~300-400 Lecciones
- ✅ ~1200-1500 Preguntas
- ✅ ~31 Cursos
- ✅ ~14 Exámenes
- ✅ ~60-80 Inscripciones
- ✅ ~40-60 Registros de Progreso
- ✅ ~10-15 Resultados de Exámenes

## 🎯 Casos de Uso para Testing

Con estos datos podrás probar:

1. ✅ **Panel de Administración:**
   - Ver todos los tipos de instituciones
   - Gestionar cursos ICFES y generales
   - Ver módulos y lecciones por competencia y año
   - Crear y gestionar exámenes
   - Ver reportes y analytics

2. ✅ **Panel del Estudiante:**
   - Ver cursos inscritos
   - Completar lecciones
   - Tomar exámenes
   - Ver progreso por competencia
   - Ver logros y gamificación
   - Exportar informes

3. ✅ **Filtros y Búsquedas:**
   - Filtrar por competencia
   - Filtrar por año escolar
   - Filtrar por tipo de institución
   - Búsqueda de contenido

4. ✅ **Relaciones y Navegación:**
   - Navegación curso → módulo → lección
   - Asignación de cursos a colegios
   - Inscripciones de estudiantes
   - Progreso acumulado

## 🔑 Credenciales de Acceso

Después de ejecutar el seed, puedes usar:

- **Estudiante:** `estudiante@test.com` / `123456`
- **Admin Colegio:** `admin@colegio.com` / `123456`
- **Profesor Admin:** `profesor@admin.com` / `123456`
- **Estudiantes adicionales:** `estudiante1@test.com` a `estudiante20@test.com` / `123456`

## 📝 Notas

- Todos los años escolares (1-11) están representados en los módulos
- Las competencias ICFES están correctamente relacionadas
- Los cursos generales no tienen año escolar asignado
- Los exámenes tienen fechas de apertura y cierre configuradas
- El progreso de estudiantes es variado para simular diferentes niveles de avance

## 🐛 Solución de Problemas

Si encuentras errores:

1. **Verifica que la base de datos esté migrada:**
   ```bash
   npx prisma migrate dev
   ```

2. **Verifica que Prisma Client esté generado:**
   ```bash
   npx prisma generate
   ```

3. **Revisa los logs** - El script muestra el progreso paso a paso

4. **Si hay errores de relaciones** - Asegúrate de que las competencias existan antes de crear módulos/cursos

---

**¡Listo para testing! 🚀**

