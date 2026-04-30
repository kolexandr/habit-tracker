-- CreateEnum
CREATE TYPE "HabitType" AS ENUM (
    'HEALTH',
    'PRODUCTIVITY',
    'MINDFULNESS',
    'FITNESS',
    'LEARNING',
    'OTHER'
);

-- AlterTable
ALTER TABLE "Habit"
ADD COLUMN "habitType" "HabitType" NOT NULL DEFAULT 'OTHER';
