import {Request, Response, Router} from "express";
import {z} from "zod";
import {GoogleGenerativeAI} from "@google/generative-ai";


const router = Router();
const ai = new GoogleGenerativeAI(process.env.GEMINI_API as string);

const goalScheme = z.string().min(5).max(200);

router.post("/", async (req:Request, res:Response) => {
  const goal = goalScheme.safeParse(req.body.prompt);
  if (!goal.success){
    return res.status(400).json({messsage: "The prompt is invalid on your side"});
  }
  
  const prompt = `
    You are a professional Habit Coach. You only generate habits. If a user asks something unrelated to habits, health, or productivity, politely tell them you can only help with habits and return an empty habits array.
    The user goal is: "${goal.data}
    If the input is gibberish or harmful, return: {"commentary": "I can only help you build positive habits. Please try a different goal.", "habits": []}.
    

    Based on this, suggest 3-4 habits.
    Return a JSON object with this exact structure:
    {
      "commentary": "Encouraging text here",
      "habits": [
        { 
          "name": "Habit Name",
          "description": "Brief instruction",
          "scheduleType": "DAILY/WEEKLY/CUSTOM", 
          "habitType": "HEALTH/PRODUCTIVITY/MINDFULNESS/FITNESS",
          "targetPerPeriod": "How often they should do it (integer)",
          "endDate": "When should habit be stopped (optional)"
        }
      ]
    }
  `;

  try {
    const modelAI = ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {responseMimeType: "application/json"}
    });

   const resultAI = await modelAI.generateContent(prompt);
   const dataAI = await JSON.parse(resultAI.response.text());

    res.status(200).json({data: dataAI});
  } catch (error) {
    res.status(500).json({error: "Failed to parse AI habits."})
  }
});

export default router;