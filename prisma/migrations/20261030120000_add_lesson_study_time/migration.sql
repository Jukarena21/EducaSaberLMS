-- CreateTable: tiempo activo de estudio por lección, sección y día.
-- Solo agrega una tabla nueva; no modifica tablas existentes.
CREATE TABLE IF NOT EXISTS "LessonStudyTime" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "seconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonStudyTime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LessonStudyTime_userId_lessonId_section_day_key" ON "LessonStudyTime"("userId", "lessonId", "section", "day");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LessonStudyTime_day_idx" ON "LessonStudyTime"("day");

-- AddForeignKey
ALTER TABLE "LessonStudyTime" ADD CONSTRAINT "LessonStudyTime_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonStudyTime" ADD CONSTRAINT "LessonStudyTime_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
