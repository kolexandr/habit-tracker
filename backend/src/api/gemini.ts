import {Request, Response, NextFunction, Router} from "express";
import {prisma} from "../../prisma.ts";
import {z} from "zod"
import {GoogleGenAI} from "@google/genai"


const router = Router();
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API});

router.post("/", async (req:Request, res:Response) => {
  const {prompt}  = req.body.prompt;
  try {
   const responseAi = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt,
    }); 

    res.status(200).json({data: responseAi.text});
  } catch (error) {
    res.status(500).json({message: "Error contacting gemini API."})
  }
});

export default router;