-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "academicGrade" TEXT;

-- AlterTable
ALTER TABLE "LessonQuestion" ADD COLUMN "academicGrade" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Module" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimatedTimeMinutes" INTEGER,
    "orderIndex" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "competencyId" TEXT,
    "isIcfesModule" BOOLEAN NOT NULL DEFAULT false,
    "academicGrade" TEXT,
    "totalLessons" INTEGER NOT NULL DEFAULT 0,
    "completedLessonsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Module_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Module_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Module" ("competencyId", "completedLessonsCount", "createdAt", "createdById", "description", "estimatedTimeMinutes", "id", "isPublished", "orderIndex", "title", "totalLessons") SELECT "competencyId", "completedLessonsCount", "createdAt", "createdById", "description", "estimatedTimeMinutes", "id", "isPublished", "orderIndex", "title", "totalLessons" FROM "Module";
DROP TABLE "Module";
ALTER TABLE "new_Module" RENAME TO "Module";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
