-- Script SQL para crear usuario admin y competencias ICFES en Supabase
-- Ejecuta este script en el SQL Editor de Supabase después de crear las tablas

-- ============================================
-- CREAR ADMIN GENERAL
-- ============================================
-- Contraseña: admin123
-- Hash bcrypt generado con: bcrypt.hash('admin123', 12)

INSERT INTO "User" (
  "id",
  "email",
  "passwordHash",
  "role",
  "firstName",
  "lastName",
  "status",
  "createdAt",
  "updatedAt"
) VALUES (
  'admin-general-001',
  'admin@educasaber.com',
  '$2a$12$4Qpz/mDTtYZQAvSN3Tup2.9bbOvB74k0jV2xvGEsHebfkxY4Vpu5a',
  'teacher_admin',
  'Admin',
  'General',
  'active',
  NOW(),
  NOW()
) ON CONFLICT ("email") DO UPDATE SET
  "passwordHash" = EXCLUDED."passwordHash",
  "updatedAt" = NOW();

-- ============================================
-- CREAR COMPETENCIAS ICFES
-- ============================================

INSERT INTO "Competency" ("id", "name", "displayName", "description", "colorHex", "iconName", "createdAt") VALUES
('comp-lectura-critica', 'lectura_critica', 'Lectura Crítica', 'Desarrollo de habilidades para comprender, analizar e interpretar textos de manera crítica.', '#3B82F6', 'book-open', NOW()),
('comp-razonamiento-cuantitativo', 'razonamiento_cuantitativo', 'Razonamiento Cuantitativo', 'Capacidad para resolver problemas matemáticos y aplicar el razonamiento cuantitativo.', '#10B981', 'calculator', NOW()),
('comp-competencias-ciudadanas', 'competencias_ciudadanas', 'Competencias Ciudadanas', 'Desarrollo de habilidades para la convivencia, participación democrática y construcción de paz.', '#EF4444', 'users', NOW()),
('comp-comunicacion-escrita', 'comunicacion_escrita', 'Comunicación Escrita', 'Habilidades para expresarse de manera escrita de forma clara, coherente y efectiva.', '#F59E0B', 'file-text', NOW()),
('comp-ingles', 'ingles', 'Inglés', 'Desarrollo de competencias comunicativas en inglés como lengua extranjera.', '#8B5CF6', 'globe', NOW())
ON CONFLICT ("name") DO NOTHING;

-- Verificar que se crearon correctamente
SELECT 'Usuario Admin creado:' as info, "email", "role" FROM "User" WHERE "email" = 'admin@educasaber.com';
SELECT 'Competencias creadas:' as info, COUNT(*) as total FROM "Competency";
