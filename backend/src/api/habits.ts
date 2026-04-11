import {Request, Response, NextFunction, Router} from "express";
import {prisma} from "../../prisma.ts"
import {z} from "zod";
import { ScheduleType, HabitStatus } from "../../generated/prisma/enums.ts";

const router = Router();


const habitSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(3).optional(),
  scheduleType: z.enum(ScheduleType),
  habitStatus: z.enum(HabitStatus),
  targetPerPeriod: z.number().int().positive().default(1),
  endDate: z.coerce.date().optional(),
});

type HabitDto = z.output<typeof habitSchema>;

router.get("/", async (req: Request, res: Response) => {
  const userId = req.user!.id;

  try {
   const habits = await prisma.habit.findMany({
      where: {userId: userId}
    });
    res.json({data: habits}); 
  } catch (error) {
    return res.status(500).json({message: "Error retrieving error."})
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
    const habit = await prisma.habit.create({data: {...result.data, userId}});
    res.status(201).json({data: habit});
  } catch (error) {
    res.status(500).json({message: "Error creating the habit."});
  }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  const habitId = req.params.id as string;
  const userId = req.user!.id;

  try {
    await prisma.habit.delete({where: {id: habitId, userId: userId}});

    res.status(204).send();
  } catch (error) {
    res.status(404).json({ message: "No habit was found."});
  }
});