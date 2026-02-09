# Checklist de Cambios - Competency a Area

## ✅ Cambios Completados (Ya hechos automáticamente)

1. ✅ Schema de Prisma actualizado (`Competency` → `Area`)
2. ✅ API routes actualizadas (`prisma.competency` → `prisma.area`)
3. ✅ Cliente de Prisma regenerado
4. ✅ Código de guardado del campo `competencia` verificado y corregido
5. ✅ Formulario verificado (no necesita cambios)

## ⚠️ Cambio Requerido por Ti

### 1. Ejecutar Migración SQL en Supabase

**IMPORTANTE**: Debes ejecutar este SQL en el SQL Editor de Supabase para agregar la columna `competencia` a la tabla `ExamQuestion`:

```sql
ALTER TABLE "ExamQuestion" 
ADD COLUMN IF NOT EXISTS "competencia" TEXT;
```

**Pasos:**
1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Copia y pega el SQL de arriba
4. Ejecuta la consulta
5. Verifica que se ejecutó correctamente con:
   ```sql
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'ExamQuestion' 
   AND column_name = 'competencia';
   ```

**Nota**: Si ya ejecutaste esta migración antes, puedes saltarte este paso.

## 🧪 Verificación

Después de ejecutar la migración, verifica que todo funciona:

1. **Crear una pregunta nueva** en un simulacro manual
2. **Llenar el campo "Competencia"** (texto libre)
3. **Seleccionar un "Área"** del dropdown
4. **Guardar** y verificar que se guardó correctamente
5. **Editar la pregunta** y verificar que el campo `competencia` se carga correctamente

## 📝 Notas

- **No se requiere migración de Prisma**: El cambio de `Competency` a `Area` es solo en el código, la tabla en la BD sigue siendo `Competency`
- **El campo `competencia` es opcional**: Puede estar vacío, pero si lo llenas, se guardará correctamente
- **El campo `competencyId` es obligatorio**: Debes seleccionar un área del dropdown
