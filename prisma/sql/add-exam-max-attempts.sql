-- Additive: intentos permitidos por examen. 1 = comportamiento actual.
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "maxAttempts" INTEGER NOT NULL DEFAULT 1;
