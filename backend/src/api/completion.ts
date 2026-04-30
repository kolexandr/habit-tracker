import { Request, Response, Router } from "express";
import { prisma } from "../../prisma.ts";

const router = Router();

const getTodayRange = () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return { startOfDay, endOfDay };
};

const getCurrentPeriodRange = (scheduleType: "DAILY" | "WEEKLY" | "CUSTOM") => {
    if (scheduleType === "WEEKLY") {
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

router.post("/:id/completions", async (req: Request, res: Response) => {
    const id = req.params.id as string; 
    const userId = req.user!.id;

    try {
        const habit = await prisma.habit.findUnique({ where: { id: id, userId: userId} });
        
        if (!habit) {
            return res.status(404).json({ message: "The habit does not exist." });
        }
        
        const { startOfPeriod } = getCurrentPeriodRange(habit.scheduleType);

        const alreadyDone = await prisma.habitCompletion.findFirst({
            where: {
                habitId: id,
                completedAt: { gte: startOfPeriod }
            }
        });

        if (alreadyDone) {
            return res.status(400).json({ message: "Habit already completed for the current period." });
        }

        const { completion, updatedHabit, updatedUser } = await prisma.$transaction(async (tx) => {
            const completion = await tx.habitCompletion.create({
                data: {
                    habitId: id,    
                }
            });

            const updatedHabit = await tx.habit.update({
                where: { id: habit.id },
                data: {
                    currentStreak: {
                        increment: 1,
                    },
                },
                select: {
                    id: true,
                    currentStreak: true,
                },
            });

            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    productivityScore: {
                        increment: 1,
                    },
                },
                select: {
                    productivityScore: true,
                },
            });

            return { completion, updatedHabit, updatedUser };
        });

        return res.status(201).json({
            data: completion,
            habit: updatedHabit,
            user: updatedUser,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

router.delete("/:id/completions", async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;

    const habit = await prisma.habit.findUnique({ where: {id: id, userId: userId} });
        
    if (!habit) {
        return res.status(404).json({ message: "The habit does not exist." });
    }
    
    try {
        const { startOfPeriod, endOfPeriod } = getCurrentPeriodRange(habit.scheduleType);

        const completionToDelete = await prisma.habitCompletion.findFirst({
            where: {
                habitId: id,
                completedAt: {
                    gte: startOfPeriod,
                    lte: endOfPeriod
                }
            }
        });

        if (!completionToDelete) {
            return res.status(404).json({ message: "No completion found for the current period to delete." });
        }

        // 3. Delete that specific completion record by ITS OWN ID
        const { updatedHabit, updatedUser } = await prisma.$transaction(async (tx) => {
            await tx.habitCompletion.delete({
                where: { id: completionToDelete.id }
            });

            const updatedHabit = await tx.habit.update({
                where: { id: habit.id },
                data: {
                    currentStreak: Math.max(habit.currentStreak - 1, 0),
                },
                select: {
                    id: true,
                    currentStreak: true,
                },
            });

            const updatedUser = await tx.user.update({
                where: { id: userId },
                data: {
                    productivityScore: {
                        decrement: 1,
                    },
                },
                select: {
                    productivityScore: true,
                },
            });

            return { updatedHabit, updatedUser };
        });

        return res.status(200).json({
            message: "Habit log was deleted successfully!",
            habit: updatedHabit,
            user: updatedUser,
        });
    } catch (error) {
        return res.status(500).json({message: "Internal server error."})
    }
});

export default router;
