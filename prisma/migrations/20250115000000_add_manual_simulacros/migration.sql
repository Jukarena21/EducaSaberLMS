-- AlterTable: Add new fields to Exam model
ALTER TABLE "Exam" ADD COLUMN "isManualSimulacro" BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE "Exam" ADD COLUMN "isPredefined" BOOLEAN NOT NULL DEFAULT 0;

-- AlterTable: Add new fields to ExamQuestion model
ALTER TABLE "ExamQuestion" ADD COLUMN "tema" TEXT;
ALTER TABLE "ExamQuestion" ADD COLUMN "subtema" TEXT;
ALTER TABLE "ExamQuestion" ADD COLUMN "componente" TEXT;
ALTER TABLE "ExamQuestion" ADD COLUMN "competencyId" TEXT;

-- AlterTable: Add new fields to ExamResult model
ALTER TABLE "ExamResult" ADD COLUMN "resultsByTema" TEXT;
ALTER TABLE "ExamResult" ADD COLUMN "resultsBySubtema" TEXT;
ALTER TABLE "ExamResult" ADD COLUMN "resultsByComponente" TEXT;

-- CreateTable: ExamSchool (assignment of exams to schools)
CREATE TABLE "ExamSchool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "openDate" DATETIME,
    "closeDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExamSchool_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamSchool_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: ExamAssignment (assignment of exams to students)
CREATE TABLE "ExamAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "openDate" DATETIME,
    "closeDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT 1,
    "assignedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExamAssignment_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex: Unique constraint for ExamSchool
CREATE UNIQUE INDEX "ExamSchool_examId_schoolId_key" ON "ExamSchool"("examId", "schoolId");

-- CreateIndex: Unique constraint for ExamAssignment
CREATE UNIQUE INDEX "ExamAssignment_examId_userId_key" ON "ExamAssignment"("examId", "userId");

-- Note: Foreign key constraint for ExamQuestion.competencyId -> Competency.id
-- will be handled by Prisma when generating the client
-- SQLite doesn't enforce foreign keys by default, so we just add the column

