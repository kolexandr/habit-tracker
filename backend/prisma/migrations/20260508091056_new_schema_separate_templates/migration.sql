/*
  Warnings:

  - You are about to drop the column `habitId` on the `HabitCompletion` table. All the data in the column will be lost.
  - You are about to drop the `Habit` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userHabitId` to the `HabitCompletion` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TemplateSource" AS ENUM ('PLATFORM', 'USER');

-- DropForeignKey
ALTER TABLE "Habit" DROP CONSTRAINT "Habit_userId_fkey";

-- DropForeignKey
ALTER TABLE "HabitCompletion" DROP CONSTRAINT "HabitCompletion_habitId_fkey";

-- AlterTable
ALTER TABLE "HabitCompletion" DROP COLUMN "habitId",
ADD COLUMN     "userHabitId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Habit";

-- CreateTable
CREATE TABLE "HabitTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scheduleType" "ScheduleType" NOT NULL,
    "habitType" "HabitType" NOT NULL DEFAULT 'OTHER',
    "targetPerPeriod" INTEGER NOT NULL DEFAULT 1,
    "endDate" TIMESTAMP(3),
    "source" "TemplateSource" NOT NULL DEFAULT 'USER',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" TEXT,
    "sourceUserHabitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HabitTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserHabit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scheduleType" "ScheduleType" NOT NULL,
    "habitType" "HabitType" NOT NULL DEFAULT 'OTHER',
    "habitStatus" "HabitStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "targetPerPeriod" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "UserHabit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HabitTemplate_sourceUserHabitId_key" ON "HabitTemplate"("sourceUserHabitId");

-- CreateIndex
CREATE INDEX "HabitTemplate_isPublic_createdAt_idx" ON "HabitTemplate"("isPublic", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserHabit_userId_templateId_key" ON "UserHabit"("userId", "templateId");

-- AddForeignKey
ALTER TABLE "HabitTemplate" ADD CONSTRAINT "HabitTemplate_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitTemplate" ADD CONSTRAINT "HabitTemplate_sourceUserHabitId_fkey" FOREIGN KEY ("sourceUserHabitId") REFERENCES "UserHabit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHabit" ADD CONSTRAINT "UserHabit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHabit" ADD CONSTRAINT "UserHabit_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "HabitTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitCompletion" ADD CONSTRAINT "HabitCompletion_userHabitId_fkey" FOREIGN KEY ("userHabitId") REFERENCES "UserHabit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
