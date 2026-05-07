import { Request, Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.ts";
import { HabitStatus, HabitType, ScheduleType } from "../../generated/prisma/enums.ts";

const router = Router();

const fitnessImportSchema = z.object({
  muscle: z.string().trim().min(2).max(50),
});

type NinjaExercise = {
  name: string;
  instructions: string;
};

const NINJA_API_URL = "https://api.api-ninjas.com/v1/exercises";

const buildImportedFitnessHabitData = (exercise: NinjaExercise, userId: string) => ({
  name: exercise.name,
  description: exercise.instructions,
  scheduleType: ScheduleType.DAILY,
  habitType: HabitType.FITNESS,
  habitStatus: HabitStatus.ACTIVE,
  isPlatformCreated: false,
  isPublic: true,
  targetPerPeriod: 1,
  currentStreak: 0,
  userId,
});

router.post("/import", async (req: Request, res: Response) => {
  const result = fitnessImportSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ message: "A valid muscle type is required." });
  }

  const userId = req.user!.id;
  const apiKey = process.env.NINJA_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: "Ninja API key is not configured." });
  }

  try {
    const url = new URL(NINJA_API_URL);
    url.searchParams.set("muscle", result.data.muscle.toLowerCase());

    const apiResponse = await fetch(url.toString(), {
      headers: {
        "X-Api-Key": apiKey,
      },
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return res.status(502).json({
        message: errorText || "Failed to load exercises from the fitness provider.",
      });
    }

    const exercises = (await apiResponse.json()) as NinjaExercise[];

    if (exercises.length === 0) {
      return res.status(200).json({
        data: [],
        message: `No exercises were found for "${result.data.muscle}".`,
      });
    }

    const savedHabits = await Promise.all(
      exercises.map(async (exercise) => {
        const existingHabit = await prisma.habit.findFirst({
          where: {
            userId,
            habitType: HabitType.FITNESS,
            name: exercise.name,
            description: exercise.instructions,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        });

        if (existingHabit) {
          return existingHabit;
        }

        return prisma.habit.create({
          data: buildImportedFitnessHabitData(exercise, userId),
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        });
      }),
    );

    return res.status(201).json({
      data: savedHabits,
      message: `Imported ${savedHabits.length} fitness habit${savedHabits.length === 1 ? "" : "s"}.`,
    });
  } catch (error) {
    console.error("POST /api/fitness/import failed:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Error importing fitness habits.",
    });
  }
});

export default router;
