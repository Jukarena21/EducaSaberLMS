-- Migración: tablas de niveles de desempeño + campo resultsByCompetencia en ExamResult
-- Ejecutar en producción: npx prisma migrate deploy (o aplicar este SQL manualmente)

-- Perfiles de niveles de desempeño
CREATE TABLE IF NOT EXISTS "PerformanceLevelProfile" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "academicGrade" TEXT,
  "areaSlug" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PerformanceLevelProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PerformanceLevelBand" (
  "id" TEXT NOT NULL,
  "profileId" TEXT NOT NULL,
  "areaSlug" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "minScore" INTEGER NOT NULL,
  "maxScore" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PerformanceLevelBand_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PerformanceLevelBand_profileId_areaSlug_idx"
  ON "PerformanceLevelBand"("profileId", "areaSlug");

ALTER TABLE "PerformanceLevelBand"
  ADD CONSTRAINT "PerformanceLevelBand_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "PerformanceLevelProfile"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Examen: perfil de niveles opcional
ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "performanceLevelProfileId" TEXT;

ALTER TABLE "Exam"
  ADD CONSTRAINT "Exam_performanceLevelProfileId_fkey"
  FOREIGN KEY ("performanceLevelProfileId") REFERENCES "PerformanceLevelProfile"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Resultado: desglose por competencia (texto)
ALTER TABLE "ExamResult" ADD COLUMN IF NOT EXISTS "resultsByCompetencia" TEXT;
