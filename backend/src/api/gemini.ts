import {Request, Response, NextFunction, Router} from "express";
import {prisma} from "../../prisma.ts";
import {z} from "zod"
import {GoogleGenAI} from "@google/genai"

const router = Router();
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API})

router.post("/", async (req:Request, res:Response) => {
  const prompt : string = req.body;
  try {
   const responseAi = await ai.models.generateContent({
      model: "Gemma 3 1B", 
      contents: prompt
    }); 

    res.status(200).json({data: responseAi});
  } catch (error) {
    res.status(500).json({message: "Error contacting gemini API."})
  }
});

export default router;