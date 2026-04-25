import {Request, Response, NextFunction, Router} from "express";
import {prisma} from "../../prisma.ts";
import {z} from "zod";
import { ScheduleType, HabitStatus, HabitType } from "../../generated/prisma/enums.ts";

const router = Router(); 


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
  description: z.string().min(3).optional(),
  scheduleType: z.enum(ScheduleType).optional(),
  habitStatus: z.enum(HabitStatus).optional(),
  targetPerPeriod: z.number().int().positive().optional(),
}).strict();


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
    res.status(400).json({message: "Invalid information."});
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