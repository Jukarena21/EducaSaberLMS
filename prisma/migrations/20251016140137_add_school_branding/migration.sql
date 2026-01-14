/*
  Warnings:

  - Added the required column `updatedAt` to the `Exam` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ExamQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `LessonQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "School" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "School" ADD COLUMN "themeAccent" TEXT;
ALTER TABLE "School" ADD COLUMN "themePrimary" TEXT;
ALTER TABLE "School" ADD COLUMN "themeSecondary" TEXT;

-- CreateTable
CREATE TABLE "CourseEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CourseEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "metadata" TEXT,
    "actionUrl" TEXT,
    "scheduledAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "criteria" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "deadline" DATETIME,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "currentLevelPoints" INTEGER NOT NULL DEFAULT 0,
    "pointsToNextLevel" INTEGER NOT NULL DEFAULT 100,
    "totalLessonsCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalExamsTaken" INTEGER NOT NULL DEFAULT 0,
    "totalExamsPassed" INTEGER NOT NULL DEFAULT 0,
    "totalStudyTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "currentStreakDays" INTEGER NOT NULL DEFAULT 0,
    "longestStreakDays" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" DATETIME,
    "averageExamScore" REAL NOT NULL DEFAULT 0,
    "bestExamScore" INTEGER NOT NULL DEFAULT 0,
    "totalAchievements" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
INSERT INTO "new_Exam" ("competencyId", "courseId", "createdAt", "createdById", "description", "difficultyLevel", "examType", "id", "includedModules", "isAdaptive", "isPublished", "passingScore", "timeLimitMinutes", "title") SELECT "competencyId", "courseId", "createdAt", "createdById", "description", "difficultyLevel", "examType", "id", "includedModules", "isAdaptive", "isPublished", "passingScore", "timeLimitMinutes", "title" FROM "Exam";
DROP TABLE "Exam";
ALTER TABLE "new_Exam" RENAME TO "Exam";
CREATE TABLE "new_ExamQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionImage" TEXT,
    "questionType" TEXT NOT NULL DEFAULT 'multiple_choice',
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
    "difficultyLevel" TEXT NOT NULL DEFAULT 'intermedio',
    "points" INTEGER NOT NULL DEFAULT 1,
    "orderIndex" INTEGER NOT NULL,
    "timeLimit" INTEGER,
    "lessonId" TEXT,
    "lessonUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExamQuestion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ExamQuestion" ("correctOption", "createdAt", "difficultyLevel", "examId", "explanation", "id", "lessonId", "lessonUrl", "optionA", "optionB", "optionC", "optionD", "orderIndex", "points", "questionText") SELECT "correctOption", "createdAt", "difficultyLevel", "examId", "explanation", "id", "lessonId", "lessonUrl", "optionA", "optionB", "optionC", "optionD", "orderIndex", "points", "questionText" FROM "ExamQuestion";
DROP TABLE "ExamQuestion";
ALTER TABLE "new_ExamQuestion" RENAME TO "ExamQuestion";
CREATE TABLE "new_Lesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimatedTimeMinutes" INTEGER,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "videoUrl" TEXT,
    "videoDescription" TEXT,
    "theoryContent" TEXT,
    "competencyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lesson_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lesson" ("createdAt", "description", "estimatedTimeMinutes", "id", "isPublished", "theoryContent", "title", "videoDescription", "videoUrl") SELECT "createdAt", "description", "estimatedTimeMinutes", "id", "isPublished", "theoryContent", "title", "videoDescription", "videoUrl" FROM "Lesson";
DROP TABLE "Lesson";
ALTER TABLE "new_Lesson" RENAME TO "Lesson";
CREATE TABLE "new_LessonQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lessonId" TEXT,
    "questionText" TEXT NOT NULL,
    "questionImage" TEXT,
    "questionType" TEXT NOT NULL DEFAULT 'multiple_choice',
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
INSERT INTO "new_LessonQuestion" ("correctOption", "createdAt", "difficultyLevel", "explanation", "id", "lessonId", "optionA", "optionB", "optionC", "optionD", "orderIndex", "questionText") SELECT "correctOption", "createdAt", "difficultyLevel", "explanation", "id", "lessonId", "optionA", "optionB", "optionC", "optionD", "orderIndex", "questionText" FROM "LessonQuestion";
DROP TABLE "LessonQuestion";
ALTER TABLE "new_LessonQuestion" RENAME TO "LessonQuestion";
CREATE TABLE "new_Module" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimatedTimeMinutes" INTEGER,
    "orderIndex" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "competencyId" TEXT,
    "totalLessons" INTEGER NOT NULL DEFAULT 0,
    "completedLessonsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Module_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Module_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Module" ("completedLessonsCount", "createdAt", "createdById", "description", "estimatedTimeMinutes", "id", "isPublished", "orderIndex", "title", "totalLessons") SELECT "completedLessonsCount", "createdAt", "createdById", "description", "estimatedTimeMinutes", "id", "isPublished", "orderIndex", "title", "totalLessons" FROM "Module";
DROP TABLE "Module";
ALTER TABLE "new_Module" RENAME TO "Module";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CourseEnrollment_userId_courseId_key" ON "CourseEnrollment"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_name_key" ON "Achievement"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "UserStats_userId_key" ON "UserStats"("userId");
