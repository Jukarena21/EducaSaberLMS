/*
  Warnings:

  - You are about to drop the column `schoolId` on the `Course` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ExamQuestionAnswer" ADD COLUMN "answerText" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "contactPhone" TEXT;

-- CreateTable
CREATE TABLE "CourseSchool" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courseId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CourseSchool_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CourseSchool_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "competencyId" TEXT NOT NULL,
    "academicGrade" TEXT,
    "durationHours" INTEGER,
    "difficultyLevel" TEXT NOT NULL DEFAULT 'intermedio',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isIcfesCourse" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "totalModules" INTEGER NOT NULL DEFAULT 0,
    "totalLessons" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Course_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Course_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Course" ("academicGrade", "competencyId", "createdAt", "createdById", "description", "difficultyLevel", "durationHours", "id", "isPublished", "thumbnailUrl", "title", "totalLessons", "totalModules", "updatedAt") SELECT "academicGrade", "competencyId", "createdAt", "createdById", "description", "difficultyLevel", "durationHours", "id", "isPublished", "thumbnailUrl", "title", "totalLessons", "totalModules", "updatedAt" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE TABLE "new_Exam" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "examType" TEXT NOT NULL,
    "courseId" TEXT,
    "competencyId" TEXT,
    "academicGrade" TEXT,
    "timeLimitMinutes" INTEGER,
    "passingScore" INTEGER NOT NULL DEFAULT 70,
    "difficultyLevel" TEXT NOT NULL DEFAULT 'intermedio',
    "isAdaptive" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isIcfesExam" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "openDate" DATETIME,
    "closeDate" DATETIME,
    "includedModules" TEXT,
    "questionsPerModule" INTEGER NOT NULL DEFAULT 5,
    "totalQuestions" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Exam_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Exam_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Exam_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Exam" ("academicGrade", "closeDate", "competencyId", "courseId", "createdAt", "createdById", "description", "difficultyLevel", "examType", "id", "includedModules", "isAdaptive", "isPublished", "openDate", "passingScore", "questionsPerModule", "timeLimitMinutes", "title", "totalQuestions", "updatedAt") SELECT "academicGrade", "closeDate", "competencyId", "courseId", "createdAt", "createdById", "description", "difficultyLevel", "examType", "id", "includedModules", "isAdaptive", "isPublished", "openDate", "passingScore", "questionsPerModule", "timeLimitMinutes", "title", "totalQuestions", "updatedAt" FROM "Exam";
DROP TABLE "Exam";
ALTER TABLE "new_Exam" RENAME TO "Exam";
CREATE TABLE "new_LessonQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lessonId" TEXT,
    "questionText" TEXT NOT NULL,
    "questionImage" TEXT,
    "questionType" TEXT NOT NULL DEFAULT 'multiple_choice',
    "usage" TEXT NOT NULL DEFAULT 'lesson',
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "optionAImage" TEXT,
    "optionBImage" TEXT,
    "optionCImage" TEXT,
    "optionDImage" TEXT,
    "correctOption" TEXT NOT NULL,
    "explanation" TEXT,
    "explanationImage" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "difficultyLevel" TEXT NOT NULL DEFAULT 'intermedio',
    "timeLimit" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LessonQuestion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LessonQuestion" ("correctOption", "createdAt", "difficultyLevel", "explanation", "explanationImage", "id", "lessonId", "optionA", "optionAImage", "optionB", "optionBImage", "optionC", "optionCImage", "optionD", "optionDImage", "orderIndex", "questionImage", "questionText", "questionType", "timeLimit", "updatedAt") SELECT "correctOption", "createdAt", "difficultyLevel", "explanation", "explanationImage", "id", "lessonId", "optionA", "optionAImage", "optionB", "optionBImage", "optionC", "optionCImage", "optionD", "optionDImage", "orderIndex", "questionImage", "questionText", "questionType", "timeLimit", "updatedAt" FROM "LessonQuestion";
DROP TABLE "LessonQuestion";
ALTER TABLE "new_LessonQuestion" RENAME TO "LessonQuestion";
CREATE TABLE "new_School" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "daneCode" TEXT,
    "type" TEXT NOT NULL DEFAULT 'school',
    "institutionType" TEXT NOT NULL,
    "academicCalendar" TEXT NOT NULL,
    "totalStudents" INTEGER,
    "numberOfCampuses" INTEGER NOT NULL DEFAULT 1,
    "yearsOfOperation" INTEGER,
    "qualityCertifications" TEXT,
    "logoUrl" TEXT,
    "themePrimary" TEXT,
    "themeSecondary" TEXT,
    "themeAccent" TEXT,
    "city" TEXT NOT NULL,
    "neighborhood" TEXT,
    "address" TEXT,
    "activeStudentsCount" INTEGER NOT NULL DEFAULT 0,
    "averageStudentUsageMinutes" INTEGER NOT NULL DEFAULT 0,
    "averageProgressByCompetency" TEXT,
    "studentRetentionRate" REAL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "website" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_School" ("academicCalendar", "activeStudentsCount", "address", "averageProgressByCompetency", "averageStudentUsageMinutes", "city", "contactEmail", "contactPhone", "createdAt", "daneCode", "id", "institutionType", "logoUrl", "name", "neighborhood", "numberOfCampuses", "qualityCertifications", "studentRetentionRate", "themeAccent", "themePrimary", "themeSecondary", "totalStudents", "updatedAt", "website", "yearsOfOperation") SELECT "academicCalendar", "activeStudentsCount", "address", "averageProgressByCompetency", "averageStudentUsageMinutes", "city", "contactEmail", "contactPhone", "createdAt", "daneCode", "id", "institutionType", "logoUrl", "name", "neighborhood", "numberOfCampuses", "qualityCertifications", "studentRetentionRate", "themeAccent", "themePrimary", "themeSecondary", "totalStudents", "updatedAt", "website", "yearsOfOperation" FROM "School";
DROP TABLE "School";
ALTER TABLE "new_School" RENAME TO "School";
CREATE UNIQUE INDEX "School_daneCode_key" ON "School"("daneCode");
CREATE TABLE "new_StudentLessonProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'no_iniciado',
    "progressPercentage" INTEGER NOT NULL DEFAULT 0,
    "videoCompleted" BOOLEAN NOT NULL DEFAULT false,
    "theoryCompleted" BOOLEAN NOT NULL DEFAULT false,
    "exercisesCompleted" BOOLEAN NOT NULL DEFAULT false,
    "totalTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentLessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentLessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StudentLessonProgress" ("completedAt", "createdAt", "exercisesCompleted", "id", "lessonId", "status", "theoryCompleted", "totalTimeMinutes", "updatedAt", "userId", "videoCompleted") SELECT "completedAt", "createdAt", "exercisesCompleted", "id", "lessonId", "status", "theoryCompleted", "totalTimeMinutes", "updatedAt", "userId", "videoCompleted" FROM "StudentLessonProgress";
DROP TABLE "StudentLessonProgress";
ALTER TABLE "new_StudentLessonProgress" RENAME TO "StudentLessonProgress";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CourseSchool_courseId_schoolId_key" ON "CourseSchool"("courseId", "schoolId");
