import express, {Request, Response, NextFunction, Router} from "express";
import {prisma} from "../../prisma.ts"
import {z} from "zod";
import { ScheduleType, HabitStatus } from "../../generated/prisma/enums.ts";
import { id } from "zod/locales";

const router = Router();


const habitSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(3).optional(),
  scheduleType: z.enum(ScheduleType),
  habitStatus: z.enum(HabitStatus),
  targetPerPeriod: z.number().int().positive().default(1),
  endDate: z.string().datetime().optional(),
  userId: z.string(),
});

type HabitDto = z.output<typeof habitSchema>;

router.get("/:id", async (req: Request, res: Response) => {
  const id_habits = req.params.id;
  try {
    const habit = await prisma.habit.findUnique({where: {id: id_habits}});
    res.json(habit);
  } catch (error) {
    res.status(500).send("Error retrieving habit.");
  }
});

router.post("/:id", async (req: Request, res: Response) => {
  const result = habitSchema.safeParse(req.body);
  if (!result.success){
    return res.status(400).send("Invalid information.");
  }

  const dataHabit : HabitDto = result.data;


  try {
    const habit = await prisma.habit.create({data: dataHabit});
    res.status(201).json(habit);
  } catch (error) {
    
  }
});