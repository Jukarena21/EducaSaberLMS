-- Script SQL para actualizar la contraseña del admin en Supabase
-- Ejecuta este script en el SQL Editor de Supabase

UPDATE "User" 
SET 
  "passwordHash" = '$2a$12$4Qpz/mDTtYZQAvSN3Tup2.9bbOvB74k0jV2xvGEsHebfkxY4Vpu5a',
  "updatedAt" = NOW()
WHERE "email" = 'admin@educasaber.com';

-- Verificar que se actualizó
SELECT "email", "role", LEFT("passwordHash", 30) as "hashPreview" 
FROM "User" 
WHERE "email" = 'admin@educasaber.com';
