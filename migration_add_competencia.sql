-- Migración para agregar el campo competencia a la tabla ExamQuestion
-- Ejecutar este SQL directamente en el SQL Editor de Supabase

ALTER TABLE "ExamQuestion" 
ADD COLUMN IF NOT EXISTS "competencia" TEXT;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ExamQuestion' 
AND column_name = 'competencia';
