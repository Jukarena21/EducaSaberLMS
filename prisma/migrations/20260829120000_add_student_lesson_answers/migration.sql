-- CreateTable: respuestas de los ejercicios de una lección
CREATE TABLE "StudentLessonAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentLessonAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentLessonAnswer_userId_questionId_key" ON "StudentLessonAnswer"("userId", "questionId");

-- CreateIndex
CREATE INDEX "StudentLessonAnswer_userId_lessonId_idx" ON "StudentLessonAnswer"("userId", "lessonId");

-- AddForeignKey
ALTER TABLE "StudentLessonAnswer" ADD CONSTRAINT "StudentLessonAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentLessonAnswer" ADD CONSTRAINT "StudentLessonAnswer_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentLessonAnswer" ADD CONSTRAINT "StudentLessonAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "LessonQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
