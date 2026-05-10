import { Request, Response, Router } from "express";
import { prisma } from "../../prisma.js";
import { z } from "zod";
import { HabitStatus, HabitType, ScheduleType, TemplateSource } from "../../generated/prisma/enums.js";

const router = Router();
const HABIT_NAME_MAX_LENGTH = 60;
const HABIT_DESCRIPTION_MAX_LENGTH = 240;

const baseTemplateSchema = z.object({
  name: z.string().trim().min(3).max(HABIT_NAME_MAX_LENGTH),
  description: z.string().trim().min(3).max(HABIT_DESCRIPTION_MAX_LENGTH).optional(),
  scheduleType: z.enum(ScheduleType),
  habitType: z.enum(HabitType),
  targetPerPeriod: z.number().int().positive().default(1),
  endDate: z.coerce.date().optional(),
  source: z.enum(TemplateSource).optional(),
});

const templateSchema = z
  .object({
    sourceUserHabitId: z.string().uuid().optional(),
    name: z.string().trim().min(3).max(HABIT_NAME_MAX_LENGTH).optional(),
    description: z.string().trim().min(3).max(HABIT_DESCRIPTION_MAX_LENGTH).optional(),
    scheduleType: z.enum(ScheduleType).optional(),
    habitType: z.enum(HabitType).optional(),
    targetPerPeriod: z.number().int().positive().optional(),
    endDate: z.coerce.date().optional(),
    source: z.enum(TemplateSource).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.sourceUserHabitId) {
      return;
    }

    if (!data.name || !data.scheduleType || !data.habitType) {
      ctx.addIssue({
        code: "custom",
        message: "Provide either sourceUserHabitId or full template data.",
      });
    }
  });

router.get("/", async (_req: Request, res: Response) => {
  try {
    const templates = await prisma.habitTemplate.findMany({
      where: {
        isPublic: true,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ data: templates });
  } catch (error) {
    console.error("GET /api/templates failed:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Error retrieving templates.",
    });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  const templateId = req.params.id as string;

  try {
    const template = await prisma.habitTemplate.findFirst({
      where: {
        id: templateId,
        isPublic: true,
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

    if (!template) {
      return res.status(404).json({ message: "Template was not found." });
    }

    return res.status(200).json({ data: template });
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving template." });
  }
});

router.post("/", async (req: Request, res: Response) => {
  const result = templateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: "Invalid information." });
  }

  const userId = req.user!.id;

  try {
    if (result.data.sourceUserHabitId) {
      const sourceHabit = await prisma.userHabit.findFirst({
        where: {
          id: result.data.sourceUserHabitId,
          userId,
        },
      });

      if (!sourceHabit) {
        return res.status(404).json({ message: "Source habit was not found." });
      }

      const existingTemplate = await prisma.habitTemplate.findFirst({
        where: {
          sourceUserHabitId: sourceHabit.id,
        },
      });

      if (existingTemplate) {
        return res.status(409).json({ message: "This habit is already published in the library." });
      }

      const template = await prisma.habitTemplate.create({
        data: {
          name: sourceHabit.name,
          description: sourceHabit.description,
          scheduleType: sourceHabit.scheduleType,
          habitType: sourceHabit.habitType,
          targetPerPeriod: sourceHabit.targetPerPeriod,
          endDate: sourceHabit.endDate,
          source: TemplateSource.USER,
          createdByUserId: userId,
          sourceUserHabitId: sourceHabit.id,
          isPublic: true,
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

      return res.status(201).json({ data: template });
    }

    const parsedTemplate = baseTemplateSchema.safeParse(result.data);
    if (!parsedTemplate.success) {
      return res.status(400).json({ message: "Invalid information." });
    }

    const template = await prisma.habitTemplate.create({
      data: {
        ...parsedTemplate.data,
        source: parsedTemplate.data.source ?? TemplateSource.USER,
        createdByUserId:
          (parsedTemplate.data.source ?? TemplateSource.USER) === TemplateSource.USER ? userId : null,
        isPublic: true,
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

    return res.status(201).json({ data: template });
  } catch (error) {
    console.error("POST /api/templates failed:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Error creating template.",
    });
  }
});

router.post("/:id/claim", async (req: Request, res: Response) => {
  const templateId = req.params.id as string;
  const userId = req.user!.id;

  try {
    const template = await prisma.habitTemplate.findFirst({
      where: {
        id: templateId,
        isPublic: true,
      },
    });

    if (!template) {
      return res.status(404).json({ message: "Library habit was not found." });
    }

    const existingHabit = await prisma.userHabit.findFirst({
      where: {
        userId,
        templateId: template.id,
      },
    });

    if (existingHabit) {
      return res.status(409).json({ message: "You already claimed this habit." });
    }

    const claimedHabit = await prisma.userHabit.create({
      data: {
        name: template.name,
        description: template.description,
        scheduleType: template.scheduleType,
        habitType: template.habitType,
        habitStatus: HabitStatus.ACTIVE,
        targetPerPeriod: template.targetPerPeriod,
        endDate: template.endDate,
        currentStreak: 0,
        userId,
        templateId: template.id,
      },
    });

    return res.status(201).json({
      data: claimedHabit,
      message: "Habit claimed successfully.",
    });
  } catch (error) {
    console.error("POST /api/templates/:id/claim failed:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Error claiming habit.",
    });
  }
});

export default router;
