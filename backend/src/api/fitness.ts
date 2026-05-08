import { Request, Response, Router } from "express";
import { z } from "zod";
import { prisma } from "../../prisma.ts";
import { HabitType, ScheduleType, TemplateSource } from "../../generated/prisma/enums.ts";

const router = Router();

const fitnessImportSchema = z.object({
  muscle: z.string().trim().min(2).max(50),
});

type NinjaExercise = {
  name: string;
  instructions: string;
};

const NINJA_API_URL = "https://api.api-ninjas.com/v1/exercises";

const buildImportedFitnessTemplateData = (exercise: NinjaExercise) => ({
  name: exercise.name,
  description: exercise.instructions,
  scheduleType: ScheduleType.DAILY,
  habitType: HabitType.FITNESS,
  targetPerPeriod: 1,
  source: TemplateSource.PLATFORM,
  isPublic: true,
});

router.post("/import", async (req: Request, res: Response) => {
  const result = fitnessImportSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({ message: "A valid muscle type is required." });
  }

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

    const savedTemplates = await Promise.all(
      exercises.map(async (exercise) => {
        const existingTemplate = await prisma.habitTemplate.findFirst({
          where: {
            habitType: HabitType.FITNESS,
            name: exercise.name,
            description: exercise.instructions,
            source: TemplateSource.PLATFORM,
          },
          include: {
            createdByUser: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        });

        if (existingTemplate) {
          return existingTemplate;
        }

        return prisma.habitTemplate.create({
          data: buildImportedFitnessTemplateData(exercise),
          include: {
            createdByUser: {
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
      data: savedTemplates,
      message: `Imported ${savedTemplates.length} fitness template${savedTemplates.length === 1 ? "" : "s"}.`,
    });
  } catch (error) {
    console.error("POST /api/fitness/import failed:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Error importing fitness habits.",
    });
  }
});

export default router;
