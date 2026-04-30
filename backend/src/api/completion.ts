import { Request, Response, Router } from "express";
import { prisma } from "../../prisma.ts";

const router = Router();

router.post("/:id/completions", async (req: Request, res: Response) => {
    const id = req.params.id as string; 
    const userId = req.user!.id;

    try {
        const habit = await prisma.habit.findUnique({ where: { id: id, userId: userId} });
        
        if (!habit) {
            return res.status(404).json({ message: "The habit does not exist." });
        }
        
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const alreadyDone = await prisma.habitCompletion.findFirst({
            where: {
                habitId: id,
                completedAt: { gte: startOfToday }
            }
        });

        if (alreadyDone) {
            return res.status(400).json({ message: "Habit already completed today." });
        }

        const completion = await prisma.habitCompletion.create({
            data: {
                habitId: id,    
            }
        });

        return res.status(201).json({ data: completion });

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
       const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const completionToDelete = await prisma.habitCompletion.findFirst({
            where: {
                habitId: id,
                completedAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        if (!completionToDelete) {
            return res.status(404).json({ message: "No completion found for today to delete." });
        }

        // 3. Delete that specific completion record by ITS OWN ID
        await prisma.habitCompletion.delete({
            where: { id: completionToDelete.id }
        });
        return res.status(200).json({message: "Habit log was deleted successfully!"});
    } catch (error) {
        return res.status(500).json({message: "Internal server error."})
    }
});

export default router;