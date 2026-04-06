import express, {Request, Response, NextFunction, Router} from "express";
import {prisma} from "../../prisma.ts"
import {z} from "zod";
import { ScheduleType, HabitStatus } from "../../generated/prisma/enums.ts";

const router = Router();
router.use(express.json())
enum schedule {
  "DAILY",
  "WEEKLY",
  "CUSTOM"
}

enum status{
  "ACTIVE",
  "ARCHIVE"
}


const habitSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(3).optional(),
  ScheduleType: z.enum(ScheduleType),
  HabitStatus: z.enum(HabitStatus),
  targetPerPeriod: z.number().int().positive().default(1),
  endDate: z.iso.datetime().optional(),
});



router.get("/habits/:id", (req: Request, res: Response) => {
  // const 
});