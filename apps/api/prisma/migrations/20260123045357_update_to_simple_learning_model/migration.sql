/*
  Warnings:

  - You are about to drop the column `category` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedTime` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `totalQuestions` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Quiz` table. All the data in the column will be lost.
  - The primary key for the `QuizQuestion` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `codeLanguage` on the `QuizQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `QuizQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `QuizQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `explanation` on the `QuizQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `QuizQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `QuizQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `QuizQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `vulnerableCode` on the `QuizQuestion` table. All the data in the column will be lost.
  - The `id` column on the `QuizQuestion` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `UserQuizProgress` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `attemptCount` on the `UserQuizProgress` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `UserQuizProgress` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `UserQuizProgress` table. All the data in the column will be lost.
  - You are about to drop the column `currentQuestion` on the `UserQuizProgress` table. All the data in the column will be lost.
  - You are about to drop the column `marks` on the `UserQuizProgress` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `UserQuizProgress` table. All the data in the column will be lost.
  - You are about to drop the column `quizId` on the `UserQuizProgress` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `UserQuizProgress` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `UserQuizProgress` table. All the data in the column will be lost.
  - You are about to drop the column `totalMarks` on the `UserQuizProgress` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `UserQuizProgress` table. All the data in the column will be lost.
  - The `id` column on the `UserQuizProgress` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `QuizAnswer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserQuizAnswer` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `name` to the `Quiz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `correctIndex` to the `QuizQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `points` to the `QuizQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question` to the `QuizQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mark` to the `UserQuizProgress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questionId` to the `UserQuizProgress` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "QuizAnswer" DROP CONSTRAINT "QuizAnswer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "UserQuizAnswer" DROP CONSTRAINT "UserQuizAnswer_progressId_fkey";

-- DropForeignKey
ALTER TABLE "UserQuizAnswer" DROP CONSTRAINT "UserQuizAnswer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "UserQuizProgress" DROP CONSTRAINT "UserQuizProgress_quizId_fkey";

-- DropIndex
DROP INDEX "Quiz_category_idx";

-- DropIndex
DROP INDEX "Quiz_courseModuleId_idx";

-- DropIndex
DROP INDEX "Quiz_difficulty_idx";

-- DropIndex
DROP INDEX "Quiz_type_idx";

-- DropIndex
DROP INDEX "QuizQuestion_quizId_idx";

-- DropIndex
DROP INDEX "QuizQuestion_quizId_order_key";

-- DropIndex
DROP INDEX "UserQuizProgress_quizId_idx";

-- DropIndex
DROP INDEX "UserQuizProgress_status_idx";

-- DropIndex
DROP INDEX "UserQuizProgress_userId_idx";

-- DropIndex
DROP INDEX "UserQuizProgress_userId_quizId_key";

-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "category",
DROP COLUMN "createdAt",
DROP COLUMN "estimatedTime",
DROP COLUMN "tags",
DROP COLUMN "title",
DROP COLUMN "totalQuestions",
DROP COLUMN "type",
DROP COLUMN "updatedAt",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "QuizQuestion" DROP CONSTRAINT "QuizQuestion_pkey",
DROP COLUMN "codeLanguage",
DROP COLUMN "createdAt",
DROP COLUMN "description",
DROP COLUMN "explanation",
DROP COLUMN "order",
DROP COLUMN "title",
DROP COLUMN "updatedAt",
DROP COLUMN "vulnerableCode",
ADD COLUMN     "correctIndex" INTEGER NOT NULL,
ADD COLUMN     "points" INTEGER NOT NULL,
ADD COLUMN     "question" TEXT NOT NULL,
ADD COLUMN     "workflowCode" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "UserQuizProgress" DROP CONSTRAINT "UserQuizProgress_pkey",
DROP COLUMN "attemptCount",
DROP COLUMN "completedAt",
DROP COLUMN "createdAt",
DROP COLUMN "currentQuestion",
DROP COLUMN "marks",
DROP COLUMN "progress",
DROP COLUMN "quizId",
DROP COLUMN "startedAt",
DROP COLUMN "status",
DROP COLUMN "totalMarks",
DROP COLUMN "updatedAt",
ADD COLUMN     "mark" INTEGER NOT NULL,
ADD COLUMN     "questionId" INTEGER NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "UserQuizProgress_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "QuizAnswer";

-- DropTable
DROP TABLE "UserQuizAnswer";

-- AddForeignKey
ALTER TABLE "UserQuizProgress" ADD CONSTRAINT "UserQuizProgress_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
