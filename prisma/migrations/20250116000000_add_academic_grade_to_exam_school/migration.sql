-- AlterTable: Add academicGrade field to ExamSchool
ALTER TABLE "ExamSchool" ADD COLUMN "academicGrade" TEXT;

-- DropIndex: Remove old unique constraint
DROP INDEX IF EXISTS "ExamSchool_examId_schoolId_key";

-- CreateIndex: Create new unique constraint with academicGrade
CREATE UNIQUE INDEX "ExamSchool_examId_schoolId_academicGrade_key" ON "ExamSchool"("examId", "schoolId", "academicGrade");

