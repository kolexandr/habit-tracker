import {Request, Response, Router} from "express";
import {z} from "zod";
import {prisma} from "../../prisma.ts"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middleware/auth.ts";

const router = Router();

const RegisterSchema = z
  .object({
    username: z.string().min(3),
    email: z.email(),
    password: z.string().min(8).optional(),
    hashPassword: z.string().min(8).optional(),
  })
  .superRefine((data, ctx) => { //may be changed
    if (!data.password && !data.hashPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Password is required.",
        path: ["password"],
      });
    }
  });

const LoginSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8).optional(),
    hashPassword: z.string().min(8).optional(),
  })
  .superRefine((data, ctx) => { //may be changed
    if (!data.password && !data.hashPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Password is required.",
        path: ["password"],
      });
    }
  });

type RegisterDto = z.output<typeof RegisterSchema>;
type LoginDto = z.output<typeof LoginSchema>;

router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        email: true,
        productivityScore: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("GET /api/auth/me failed:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Could not load user profile.",
    });
  }
});

router.post("/logout", async (_req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.status(200).json({ message: "Logged out successfully." });
});

router.get("/profile-summary", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const [totalHabits, totalCompletions, bestHabit] = await Promise.all([
      prisma.habit.count({
        where: { userId },
      }),
      prisma.habitCompletion.count({
        where: {
          habit: {
            userId,
          },
        },
      }),
      prisma.habit.findFirst({
        where: { userId },
        orderBy: { currentStreak: "desc" },
        select: { currentStreak: true },
      }),
    ]);

    return res.status(200).json({
      stats: {
        totalHabits,
        totalCompletions,
        longestStreak: bestHabit?.currentStreak ?? 0,
      },
    });
  } catch (error) {
    console.error("GET /api/auth/profile-summary failed:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Could not load profile summary.",
    });
  }
});

router.post("/register", async (req:Request, res:Response) => {

  const result = RegisterSchema.safeParse(req.body)

  if (!result.success) {
    return res.status(400).json({message: "Invalid email or password."});
  }

  const rawPassword = result.data.password ?? result.data.hashPassword!; //may be changed
  const cryptPassword = await bcrypt.hash(rawPassword, 10);

  const hashedPassword = cryptPassword;
  
  try {
    const user = await prisma.user.create({
      data: {
        username: result.data.username,
        email: result.data.email,
        hashPassword: hashedPassword
      } 
    });


    res.status(201).json({message: "User created successfully"});        
  } catch (error) {
    console.log(error);
    res.status(500).json({message: "Internal server error"});  
  }
  
});

router.post("/login", async (req:Request, res:Response) => {

  const result = LoginSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({message: "Invalid email or password."});
  }

  try {
    const user = await prisma.user.findUnique({where: {email: result.data.email}});
    if (!user) {
      return res.status(400).json({message: "Invalid email or password."});
    }
    const rawPassword = result.data.password ?? result.data.hashPassword!; //may be changed
    const validatePassword = await (bcrypt.compare(rawPassword, user.hashPassword));
    if (!validatePassword) {
      return res.status(400).json({message: "Invalid email or password."});
    }

    let data_user = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    let jwtSecretKey = process.env.JWT_SECRET!;
    if (!jwtSecretKey) {
      return res.status(500).json({message: "JWT secret key is not configured."});
    }

    let token_jwt = jwt.sign(data_user, jwtSecretKey); 

    res.cookie('token', token_jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'strict',
      maxAge: 3600000,
    });

    // res.json({message: token_jwt);

    res.status(200).json({message: "Logged in successfully"});
  } catch (error) {
    res.status(500).json({message: "Something went wrong."});
  }  
});

export default router;
