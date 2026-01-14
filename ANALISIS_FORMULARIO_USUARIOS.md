# Análisis: Formulario de Usuarios vs Base de Datos

## Resumen Ejecutivo

Este documento compara los campos solicitados en el formulario de creación de usuarios (`UserForm.tsx`) con los campos disponibles en la base de datos (`User` model en Prisma), identificando:
- ❌ **Campos que se piden pero NO se guardan**
- ⚠️ **Campos que existen en BD pero NO se piden en el formulario**

---

## 📊 Comparación por Tipo de Usuario

---

## 1️⃣ ESTUDIANTE (`student`)

### ✅ Campos que se piden Y se guardan correctamente

| Campo en Formulario | Campo en BD | Estado |
|---------------------|-------------|--------|
| `email` | `email` | ✅ Guardado |
| `password` | `passwordHash` | ✅ Guardado (hasheado) |
| `firstName` | `firstName` | ✅ Guardado |
| `lastName` | `lastName` | ✅ Guardado |
| `role` | `role` | ✅ Guardado |
| `schoolId` | `schoolId` | ✅ Guardado |
| `dateOfBirth` | `dateOfBirth` | ✅ Guardado |
| `gender` | `gender` | ✅ Guardado |
| `documentType` | `documentType` | ✅ Guardado |
| `documentNumber` | `documentNumber` | ✅ Guardado |
| `address` | `address` | ✅ Guardado |
| `neighborhood` | `neighborhood` | ✅ Guardado |
| `city` | `city` | ✅ Guardado |
| `socioeconomicStratum` | `socioeconomicStratum` | ✅ Guardado |
| `housingType` | `housingType` | ✅ Guardado |
| `schoolEntryYear` | `schoolEntryYear` | ✅ Guardado |
| `academicAverage` | `academicAverage` | ✅ Guardado |
| `areasOfDifficulty` | `areasOfDifficulty` | ✅ Guardado (JSON string) |
| `areasOfStrength` | `areasOfStrength` | ✅ Guardado (JSON string) |
| `repetitionHistory` | `repetitionHistory` | ✅ Guardado |
| `schoolSchedule` | `schoolSchedule` | ✅ Guardado |
| `disabilities` | `disabilities` | ✅ Guardado (JSON string) |
| `specialEducationalNeeds` | `specialEducationalNeeds` | ✅ Guardado |
| `medicalConditions` | `medicalConditions` | ✅ Guardado |
| `homeTechnologyAccess` | `homeTechnologyAccess` | ✅ Guardado |
| `homeInternetAccess` | `homeInternetAccess` | ✅ Guardado |

### ❌ Campos que se piden pero NO se guardan

| Campo en Formulario | Razón | Impacto |
|---------------------|-------|---------|
| **Ninguno** | - | ✅ Todos los campos solicitados se guardan correctamente |

### ⚠️ Campos que existen en BD pero NO se piden en el formulario

| Campo en BD | Tipo | Default/Valor | ¿Se debería pedir? | Notas |
|-------------|------|---------------|-------------------|-------|
| `avatarUrl` | `String?` | `null` | ⚪ Opcional | Se podría agregar un campo para subir foto de perfil |
| `totalPlatformTimeMinutes` | `Int` | `0` | ❌ No | Métrica automática, se actualiza con el uso |
| `sessionsStarted` | `Int` | `0` | ❌ No | Métrica automática |
| `lastSessionAt` | `DateTime?` | `null` | ❌ No | Métrica automática |
| `preferredDevice` | `String?` | `null` | ❌ No | Métrica automática, se detecta del navegador |
| `preferredBrowser` | `String?` | `null` | ❌ No | Métrica automática, se detecta del navegador |
| `averageSessionTimeMinutes` | `Int` | `0` | ❌ No | Métrica automática, se calcula |
| `createdAt` | `DateTime` | Auto | ❌ No | Timestamp automático |
| `updatedAt` | `DateTime` | Auto | ❌ No | Timestamp automático |

**Recomendación para Estudiantes:**
- ✅ El formulario está completo y correcto
- 💡 Se podría agregar un campo opcional para `avatarUrl` (subida de foto de perfil)

---

## 2️⃣ ADMINISTRADOR DE COLEGIO (`school_admin`)

### ✅ Campos que se piden Y se guardan correctamente

| Campo en Formulario | Campo en BD | Estado |
|---------------------|-------------|--------|
| `email` | `email` | ✅ Guardado |
| `password` | `passwordHash` | ✅ Guardado (hasheado) |
| `firstName` | `firstName` | ✅ Guardado |
| `lastName` | `lastName` | ✅ Guardado |
| `role` | `role` | ✅ Guardado |
| `schoolId` | `schoolId` | ✅ Guardado |
| `documentType` | `documentType` | ✅ Guardado |
| `documentNumber` | `documentNumber` | ✅ Guardado |
| `address` | `address` | ✅ Guardado |
| `city` | `city` | ✅ Guardado |

### ❌ Campos que se piden pero NO se guardan

| Campo en Formulario | Línea en Formulario | Campo en BD | Impacto | Solución |
|---------------------|---------------------|-------------|---------|----------|
| **`contactPhone`** | Línea 637-644 | ❌ No existe | 🔴 **CRÍTICO**: Se pide el teléfono pero no se guarda | Agregar campo `contactPhone` al schema o remover del formulario |

**Detalle del problema:**
```typescript
// En UserForm.tsx (línea 637-644)
<Label htmlFor="contactPhone">Teléfono de Contacto</Label>
<Input
  id="contactPhone"
  type="tel"
  value={formData.contactPhone || ''}
  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
/>
```

```typescript
// En app/api/users/route.ts - NO se procesa contactPhone
const {
  email,
  password,
  // ... otros campos
  // ❌ contactPhone NO está en la desestructuración
} = body
```

### ⚠️ Campos que existen en BD pero NO se piden en el formulario

| Campo en BD | Tipo | ¿Se debería pedir? | Notas |
|-------------|------|-------------------|-------|
| `avatarUrl` | `String?` | ⚪ Opcional | Foto de perfil |
| `dateOfBirth` | `DateTime?` | ⚪ Opcional | Fecha de nacimiento |
| `gender` | `String?` | ⚪ Opcional | Género |
| `neighborhood` | `String?` | ⚪ Opcional | Barrio (ya se pide `address` y `city`) |
| `socioeconomicStratum` | `Int?` | ❌ No | No relevante para admin |
| `housingType` | `String?` | ❌ No | No relevante para admin |
| `schoolEntryYear` | `Int?` | ❌ No | No relevante para admin |
| `academicAverage` | `Float?` | ❌ No | No relevante para admin |
| `areasOfDifficulty` | `String?` | ❌ No | No relevante para admin |
| `areasOfStrength` | `String?` | ❌ No | No relevante para admin |
| `repetitionHistory` | `Boolean` | ❌ No | No relevante para admin |
| `schoolSchedule` | `String?` | ❌ No | No relevante para admin |
| `disabilities` | `String?` | ❌ No | No relevante para admin |
| `specialEducationalNeeds` | `String?` | ❌ No | No relevante para admin |
| `medicalConditions` | `String?` | ❌ No | No relevante para admin |
| `homeTechnologyAccess` | `Boolean?` | ❌ No | No relevante para admin |
| `homeInternetAccess` | `Boolean?` | ❌ No | No relevante para admin |
| Métricas de plataforma | Varios | ❌ No | Automáticas |

**Recomendación para Administradores de Colegio:**
- 🔴 **URGENTE**: Resolver el campo `contactPhone` (agregar a BD o remover del formulario)
- ⚪ Opcional: Agregar campos para `dateOfBirth`, `gender`, `avatarUrl` si se considera necesario

---

## 3️⃣ PROFESOR ADMINISTRADOR (`teacher_admin`)

### ✅ Campos que se piden Y se guardan correctamente

| Campo en Formulario | Campo en BD | Estado |
|---------------------|-------------|--------|
| `email` | `email` | ✅ Guardado |
| `password` | `passwordHash` | ✅ Guardado (hasheado) |
| `firstName` | `firstName` | ✅ Guardado |
| `lastName` | `lastName` | ✅ Guardado |
| `role` | `role` | ✅ Guardado |

### ❌ Campos que se piden pero NO se guardan

| Campo en Formulario | Estado |
|---------------------|--------|
| **Ninguno** | ✅ No hay campos adicionales solicitados |

### ⚠️ Campos que existen en BD pero NO se piden en el formulario

| Campo en BD | Tipo | ¿Se debería pedir? | Notas |
|-------------|------|-------------------|-------|
| `schoolId` | `String?` | ⚪ Opcional | Un `teacher_admin` podría estar asociado a un colegio específico |
| `avatarUrl` | `String?` | ⚪ Opcional | Foto de perfil |
| `dateOfBirth` | `DateTime?` | ⚪ Opcional | Fecha de nacimiento |
| `gender` | `String?` | ⚪ Opcional | Género |
| `documentType` | `String?` | ⚪ Opcional | Tipo de documento |
| `documentNumber` | `String?` | ⚪ Opcional | Número de documento |
| `address` | `String?` | ⚪ Opcional | Dirección |
| `neighborhood` | `String?` | ⚪ Opcional | Barrio |
| `city` | `String?` | ⚪ Opcional | Ciudad |
| Todos los campos educativos | Varios | ❌ No | No relevantes para `teacher_admin` |
| Métricas de plataforma | Varios | ❌ No | Automáticas |

**Recomendación para Profesores Administradores:**
- ⚪ El formulario actual solo pide lo mínimo necesario (email, password, nombre, apellido, rol)
- 💡 Se podría agregar una pestaña opcional con información personal básica (documento, dirección, teléfono) si se considera necesario para el perfil completo

---

## 📋 Resumen de Problemas Críticos

### 🔴 Problema 1: `contactPhone` para `school_admin`

**Descripción:**
- El formulario solicita "Teléfono de Contacto" para administradores de colegio
- Este campo NO existe en el schema de Prisma
- El valor se captura pero NO se guarda en la base de datos

**Ubicación:**
- Formulario: `components/UserForm.tsx` (líneas 637-644)
- API: `app/api/users/route.ts` (NO procesa `contactPhone`)

**Opciones de solución:**

**Opción A: Agregar campo a la BD** (Recomendado)
```prisma
// En prisma/schema.prisma
model User {
  // ... campos existentes
  contactPhone String? // Agregar este campo
}
```
Luego ejecutar migración:
```bash
npx prisma migrate dev --name add_contact_phone
```

Y actualizar la API:
```typescript
// En app/api/users/route.ts
const {
  // ... otros campos
  contactPhone, // Agregar aquí
} = body

// En el create:
contactPhone: contactPhone || null,
```

**Opción B: Remover del formulario**
- Eliminar el campo `contactPhone` del formulario para `school_admin`
- Eliminar `contactPhone` del `UserFormData` interface

---

## 📊 Tabla Comparativa Completa

| Campo | Estudiante | Admin Colegio | Profesor Admin | En BD | Se Guarda |
|-------|-----------|---------------|----------------|-------|-----------|
| `email` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `password` | ✅ | ✅ | ✅ | ✅ | ✅ (hasheado) |
| `firstName` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `lastName` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `role` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `schoolId` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `dateOfBirth` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `gender` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `documentType` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `documentNumber` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `address` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `neighborhood` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `city` | ✅ | ✅ | ❌ | ✅ | ✅ |
| `socioeconomicStratum` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `housingType` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `schoolEntryYear` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `academicAverage` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `areasOfDifficulty` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `areasOfStrength` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `repetitionHistory` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `schoolSchedule` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `disabilities` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `specialEducationalNeeds` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `medicalConditions` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `homeTechnologyAccess` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `homeInternetAccess` | ✅ | ❌ | ❌ | ✅ | ✅ |
| `contactPhone` | ❌ | ✅ **⚠️** | ❌ | ❌ | ❌ **NO SE GUARDA** |
| `avatarUrl` | ❌ | ❌ | ❌ | ✅ | ❌ (no se pide) |

---

## 🎯 Recomendaciones Finales

### Prioridad Alta 🔴
1. **Resolver `contactPhone` para `school_admin`**: Agregar al schema o remover del formulario

### Prioridad Media 🟡
2. **Agregar `avatarUrl` opcional**: Permitir subir foto de perfil para todos los tipos de usuario
3. **Agregar información básica para `teacher_admin`**: Documento, dirección, teléfono (opcional)

### Prioridad Baja 🟢
4. **Revisar campos opcionales**: Evaluar si `neighborhood` debería pedirse para `school_admin`
5. **Considerar `schoolId` para `teacher_admin`**: Si un profesor puede estar asociado a un colegio específico

---

## 📝 Notas Adicionales

1. **Campos automáticos**: Los campos de métricas de plataforma (`totalPlatformTimeMinutes`, `sessionsStarted`, etc.) NO deben pedirse en el formulario, se actualizan automáticamente.

2. **Campos JSON**: `areasOfDifficulty`, `areasOfStrength`, y `disabilities` se guardan como strings JSON. El formulario maneja esto correctamente convirtiendo arrays a JSON.

3. **Validación de roles**: El formulario muestra diferentes pestañas según el rol seleccionado, lo cual es correcto.

4. **Campos requeridos vs opcionales**: La mayoría de campos son opcionales, lo cual permite crear usuarios con información mínima si es necesario.

---

## 🔍 Verificación de Código

### Archivos Revisados:
- ✅ `components/UserForm.tsx` - Formulario completo
- ✅ `app/api/users/route.ts` - API de creación de usuarios
- ✅ `prisma/schema.prisma` - Schema de base de datos

### Campos procesados en API:
```typescript
// app/api/users/route.ts (líneas 137-164)
const {
  email, password, firstName, lastName, role, schoolId,
  dateOfBirth, gender, documentType, documentNumber,
  address, neighborhood, city, socioeconomicStratum,
  housingType, schoolEntryYear, academicAverage,
  areasOfDifficulty, areasOfStrength, repetitionHistory,
  schoolSchedule, disabilities, specialEducationalNeeds,
  medicalConditions, homeTechnologyAccess, homeInternetAccess,
  // ❌ contactPhone NO está aquí
} = body
```

---

**Última actualización:** 2024-01-15
**Autor:** Análisis automático del código

