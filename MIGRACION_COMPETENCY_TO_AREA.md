# Migración de Competency a Area

## Resumen de Cambios

Se ha renombrado el modelo `Competency` a `Area` en Prisma para reflejar mejor que representa las **Áreas ICFES** (Matemáticas, Ciencias Naturales, Ciencias Sociales, Inglés, Lectura Crítica), mientras que el campo `competencia` (texto libre) en `ExamQuestion` representa las competencias específicas ingresadas por el usuario.

## Cambios Realizados

### 1. Schema de Prisma (`prisma/schema.prisma`)
- ✅ Renombrado `model Competency` a `model Area`
- ✅ Agregado `@@map("Competency")` para mantener el nombre de tabla en la BD (compatibilidad)
- ✅ Actualizado el nombre de la relación `ExamQuestionCompetency` a `ExamQuestionArea`
- ✅ Actualizadas todas las referencias de `Competency` a `Area` en el schema
- ✅ Agregados comentarios claros indicando que `Area` representa Áreas ICFES

### 2. API Routes
- ✅ `app/api/competencies/route.ts` - Actualizado a `prisma.area`
- ✅ `app/api/student/progress/competencies/route.ts` - Actualizado a `prisma.area`
- ✅ `app/api/student/progress/export-puppeteer/route.ts` - Actualizado a `prisma.area`
- ✅ `app/api/courses/route.ts` - Actualizado a `prisma.area`
- ✅ `app/api/courses/[id]/route.ts` - Actualizado a `prisma.area`
- ✅ `app/api/admin/analytics/export-bulk-report/route.ts` - Actualizado a `prisma.area`
- ✅ `app/api/student/exams/result/[resultId]/certificate/route.ts` - Actualizado a `prisma.area`
- ✅ `app/api/student/progress/export-competency/route.ts` - Actualizado a `prisma.area`

### 3. Librerías y Seeds
- ✅ `lib/achievementService.ts` - Actualizado a `prisma.area`
- ✅ `prisma/seed.ts` - Actualizado a `prisma.area`
- ✅ `prisma/seed-complete.ts` - Actualizado a `prisma.area`

### 4. Campo `competencia` (texto libre)
- ✅ Verificado que se guarda correctamente en POST (`app/api/manual-simulacros/[id]/questions/route.ts`)
- ✅ Corregido el guardado en PUT para permitir valores vacíos y limpiar el campo si es necesario

## Cambios Pendientes

### Scripts (menos críticos, pueden actualizarse después)
Los siguientes scripts aún usan `prisma.competency` pero no afectan el funcionamiento principal:
- `scripts/reset-and-seed-demo.ts`
- `scripts/clean-competencies.js`
- `scripts/populate-real-data.js`
- `scripts/test-db.js`
- `scripts/basic-seed.js`
- `scripts/simple-seed.js`
- `scripts/seed-database.js`
- `scripts/test-module-creation.js`
- `scripts/check-modules.js`
- `scripts/update-modules-competencies.js`
- `scripts/check-competencies.js`

### Componentes Frontend
Los componentes frontend aún usan nombres como `competency` y `competencies` pero esto es solo nomenclatura de variables, no afecta la funcionalidad. Se puede actualizar gradualmente:
- `components/ManualSimulacroQuestionEditor.tsx`
- `components/ExamManagement.tsx`
- `components/LessonManagement.tsx`
- `components/CourseManagement.tsx`
- Y otros componentes que usan `useCompetencies()`

## Próximos Pasos

1. **Generar cliente de Prisma**: Ejecutar `npx prisma generate` para generar el cliente con el nuevo modelo `Area`
2. **Probar la aplicación**: Verificar que todo funcione correctamente después del cambio
3. **Actualizar scripts gradualmente**: Actualizar los scripts de utilidad cuando sea necesario
4. **Actualizar tipos TypeScript**: Los tipos en `types/` pueden mantener nombres como `CompetencyData` por compatibilidad, o actualizarse a `AreaData`

## Notas Importantes

- **No se requiere migración de base de datos**: El nombre de la tabla en PostgreSQL sigue siendo `Competency` gracias a `@@map("Competency")`
- **Compatibilidad**: El código existente que usa `competencyId` y relaciones sigue funcionando
- **Campo `competencia`**: El campo texto libre `competencia` en `ExamQuestion` ahora está claramente diferenciado de `Area` (que es el dropdown de áreas ICFES)

## Estructura Final

```
ExamQuestion
├── competencyId (String?) → Relación con Area (Área ICFES: Matemáticas, etc.)
├── competency (Area?) → Objeto Area relacionado
└── competencia (String?) → Texto libre ingresado por el usuario
```
