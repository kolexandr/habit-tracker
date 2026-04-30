import {Request, Response, NextFunction, Router} from "express";
import {prisma} from "../../prisma.ts";
import {z} from "zod";
import { ScheduleType, HabitStatus, HabitType } from "../../generated/prisma/enums.ts";

const router = Router(); 

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

const habitSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(3).optional(),
  scheduleType: z.enum(ScheduleType),
  habitType: z.enum(HabitType),
  habitStatus: z.enum(HabitStatus),
  isPublic: z.boolean(),
  targetPerPeriod: z.number().int().positive().default(1),
  endDate: z.coerce.date().optional(),
});

const habitPatchSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().min(3).nullable().optional(),
  scheduleType: z.enum(ScheduleType).optional(),
  habitType: z.enum(HabitType).optional(),
  habitStatus: z.enum(HabitStatus).optional(),
  isPublic: z.boolean().optional(),
  targetPerPeriod: z.number().int().positive().optional(),
  endDate: z.coerce.date().nullable().optional(),
}).strict();


router.get("/", async (req: Request, res: Response) => {
  try {
    const habits = await prisma.habit.findMany({
      where: {
        isPublic: true,
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });
    res.status(200).json({data: habits}); 
  } catch (error) {
    console.error("GET /api/habits failed:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Error retrieving habits.",
    })
  } 
});

router.get("/mine", async (req: Request, res: Response) => {
  const userId = req.user!.id;

  try {
    const habits = await prisma.habit.findMany({
      where: { userId },
      include: {
        habitCompletions: {
          select: {
            id: true,
            completedAt: true,
          },
        },
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
    const habit = await prisma.habit.findUnique({where: {id: habitId, userId: userId}});

    if (!habit) {
      return res.status(404).json({message: "Habit is not found."});
    }

    res.json({data: habit});
  } catch (error) {
    res.status(500).json({message: "Error retrieving habit."});
  }
});

router.post("/", async (req: Request, res: Response) => {
  const result = habitSchema.safeParse(req.body);
  if (!result.success){
    return res.status(400).send("Invalid information.");
  }

  const userId = req.user!.id;

  try {
    const habit = await prisma.habit.create({
      data: {
        ...result.data,
        userId,
        isPlatformCreated: false,
      },
    });
    res.status(201).json({data: habit});
  } catch (error) {
    res.status(500).json({message: "Error creating the habit."});
  }
});

router.post("/:id/claim", async (req: Request, res: Response) => {
  const sourceHabitId = req.params.id as string;
  const userId = req.user!.id;

  try {
    const sourceHabit = await prisma.habit.findUnique({
      where: { id: sourceHabitId },
    });

    if (!sourceHabit || !sourceHabit.isPublic) {
      return res.status(404).json({ message: "Library habit was not found." });
    }

    const existingHabit = await prisma.habit.findFirst({
      where: {
        userId,
        name: sourceHabit.name,
      },
    });

    if (existingHabit) {
      return res.status(409).json({ message: "You already claimed this habit." });
    }

    const claimedHabit = await prisma.habit.create({
      data: {
        name: sourceHabit.name,
        description: sourceHabit.description,
        scheduleType: sourceHabit.scheduleType,
        habitType: sourceHabit.habitType,
        habitStatus: HabitStatus.ACTIVE,
        isPublic: false,
        isPlatformCreated: sourceHabit.isPlatformCreated,
        targetPerPeriod: sourceHabit.targetPerPeriod,
        endDate: sourceHabit.endDate,
        currentStreak: 0,
        userId,
      },
    });

    return res.status(201).json({
      data: claimedHabit,
      message: "Habit claimed successfully.",
    });
  } catch (error) {
    console.error("POST /api/habits/:id/claim failed:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Error claiming habit.",
    });
  }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  const habitId = req.params.id as string;
  const userId = req.user!.id;

  try {
    await prisma.habit.delete({where: {id: habitId, userId: userId}});

    res.status(204).json({message: "The habit was deleted successfully!"});
  } catch (error) {
    res.status(404).json({ message: "No habit was found."});
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  const habitId = req.params.id as string;
  const userId = req.user!.id;

  const result = habitPatchSchema.safeParse(req.body);
  if (!result.success){
    return res.status(400).json({message: "Invalid information."});
  }

  try {
    const updatedHabit = await prisma.habit.update({
      where: {id: habitId, userId: userId},
      data: {...result.data}
    });

    res.status(200).json({data: updatedHabit, message: "Habit was updated successfully!"});
  } catch (error) {
    res.status(500).json({message: "Error updating habit."})
  }
});

export default router;
