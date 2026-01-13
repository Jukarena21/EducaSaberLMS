-- Script para habilitar extensiones necesarias en Supabase
-- Ejecuta este script en el SQL Editor de Supabase

-- Habilitar extensión para búsquedas case-insensitive (si es necesario)
-- Nota: Prisma debería manejar esto automáticamente, pero si hay problemas, 
-- puedes ejecutar esto

-- Verificar extensiones disponibles
SELECT * FROM pg_available_extensions WHERE name LIKE '%trgm%' OR name LIKE '%citext%';

-- Habilitar pg_trgm si está disponible (para búsquedas de texto mejoradas)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Habilitar citext si está disponible (para tipos case-insensitive)
-- CREATE EXTENSION IF NOT EXISTS citext;

-- Nota: En Supabase, estas extensiones pueden estar ya habilitadas o no estar disponibles.
-- Si Prisma está dando errores con mode: 'insensitive', el problema podría ser otro.
