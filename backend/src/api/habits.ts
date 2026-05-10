import { Request, Response, Router } from "express";
import { prisma } from "../../prisma.js";
import { z } from "zod";
import { HabitStatus, HabitType, ScheduleType } from "../../generated/prisma/enums.js";

const router = Router();
const HABIT_NAME_MAX_LENGTH = 60;
const HABIT_DESCRIPTION_MAX_LENGTH = 240;

const habitSchema = z.object({
  name: z.string().trim().min(3).max(HABIT_NAME_MAX_LENGTH),
  description: z.string().trim().min(3).max(HABIT_DESCRIPTION_MAX_LENGTH).optional(),
  scheduleType: z.enum(ScheduleType),
  habitType: z.enum(HabitType),
  habitStatus: z.enum(HabitStatus),
  targetPerPeriod: z.number().int().positive().default(1),
  endDate: z.coerce.date().optional(),
  templateId: z.string().uuid().optional(),
});

const habitPatchSchema = z
  .object({
    name: z.string().trim().min(3).max(HABIT_NAME_MAX_LENGTH).optional(),
    description: z.string().trim().min(3).max(HABIT_DESCRIPTION_MAX_LENGTH).nullable().optional(),
    scheduleType: z.enum(ScheduleType).optional(),
    habitType: z.enum(HabitType).optional(),
    habitStatus: z.enum(HabitStatus).optional(),
    targetPerPeriod: z.number().int().positive().optional(),
    endDate: z.coerce.date().nullable().optional(),
  })
  .strict();

const getTodayRange = () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
};

const getCurrentPeriodRange = (scheduleType: ScheduleType) => {
  if (scheduleType === ScheduleType.WEEKLY) {
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    const dayOfWeek = startOfWeek.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return { startOfPeriod: startOfWeek, endOfPeriod: endOfWeek };
  }

  const { startOfDay, endOfDay } = getTodayRange();
  return { startOfPeriod: startOfDay, endOfPeriod: endOfDay };
};

router.get("/mine", async (req: Request, res: Response) => {
  const userId = req.user!.id;

  try {
    const habits = await prisma.userHabit.findMany({
      where: { userId },
      include: {
        habitCompletions: {
          select: {
            id: true,
            completedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const serializedHabits = habits.map((habit) => {
      const { startOfPeriod, endOfPeriod } = getCurrentPeriodRange(habit.scheduleType);

      return {
        ...habit,
        habitCompletions: habit.habitCompletions.filter((completion) => {
          return completion.completedAt >= startOfPeriod && completion.completedAt <= endOfPeriod;
        }),
      };
    });

    return res.status(200).json({ data: serializedHabits });
  } catch (error) {
    console.error("GET /api/habits/mine failed:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Error retrieving your habits.",
    });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  const habitId = req.params.id as string;
  const userId = req.user!.id;

  try {
    const habit = await prisma.userHabit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) {
      return res.status(404).json({ message: "Habit is not found." });
    }

    return res.json({ data: habit });
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving habit." });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const result = habitSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).send("Invalid information.");
  }

  const userId = req.user!.id;

  try {
    if (result.data.templateId) {
      const template = await prisma.habitTemplate.findFirst({
        where: {
          id: result.data.templateId,
          isPublic: true,
        },
      });

      if (!template) {
        return res.status(404).json({ message: "Template was not found." });
      }
    }

    const habit = await prisma.userHabit.create({
      data: {
        name: result.data.name,
        ...(result.data.description ? { description: result.data.description } : {}),
        scheduleType: result.data.scheduleType,
        habitType: result.data.habitType,
        habitStatus: result.data.habitStatus,
        targetPerPeriod: result.data.targetPerPeriod,
        ...(result.data.endDate ? { endDate: result.data.endDate } : {}),
        ...(result.data.templateId ? { templateId: result.data.templateId } : {}),
        userId,
      },
    });

    return res.status(201).json({ data: habit });
  } catch (error) {
    console.error("POST /api/habits failed:", error);
    return res.status(500).json({ message: "Error creating the habit." });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const habitId = req.params.id as string;
  const userId = req.user!.id;

  try {
    const habit = await prisma.userHabit.findFirst({
      where: {
        id: habitId,
        userId,
      },
    });

    if (!habit) {
      return res.status(404).json({ message: "No habit was found." });
    }

    await prisma.userHabit.delete({
      where: {
        id: habit.id,
      },
    });

    return res.status(204).json({ message: "The habit was deleted successfully!" });
  } catch (error) {
    return res.status(404).json({ message: "No habit was found." });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  const habitId = req.params.id as string;
  const userId = req.user!.id;

  const result = habitPatchSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Invalid information." });
  }

  try {
    const existingHabit = await prisma.userHabit.findFirst({
      where: {
        id: habitId,
        userId,
      },
    });

    if (!existingHabit) {
      return res.status(404).json({ message: "Habit is not found." });
    }

    const updatedHabit = await prisma.userHabit.update({
      where: {
        id: existingHabit.id,
      },
      data: {
        ...result.data,
      },
    });

    return res.status(200).json({
      data: updatedHabit,
      message: "Habit was updated successfully!",
    });
  } catch (error) {
    return res.status(500).json({ message: "Error updating habit." });
  }
});

export default router;
