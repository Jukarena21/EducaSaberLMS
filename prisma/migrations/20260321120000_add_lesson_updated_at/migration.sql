-- AlterTable: track last update on lessons
ALTER TABLE "Lesson" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Initialize from createdAt for existing rows
UPDATE "Lesson" SET "updatedAt" = "createdAt";
