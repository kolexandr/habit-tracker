import {Request, Response, Router} from "express";
import {z} from "zod";
import {prisma} from "../../prisma.ts"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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

router.post("/register", async (req:Request, res:Response) => {

  const result = RegisterSchema.safeParse(req.body)

  if (!result.success) {
    return res.status(400).send("Invalid email or password.");
  }

  const rawPassword = result.data.password ?? result.data.hashPassword!; //may be changed
  const cryptPassword = await bcrypt.hash(rawPassword, 10);

  console.log("Original: ", rawPassword)
  console.log("Hashed: ", cryptPassword)
  const hashedPassword = cryptPassword;
  
  try {
    const user = await prisma.user.create({
      data: {
        username: result.data.username,
        email: result.data.email,
        hashPassword: hashedPassword
      } 
    });


    res.status(201).send({
      message: "User created successfully",
    });        
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");  
  }
  
});

router.post("/login", async (req:Request, res:Response) => {

  const result = LoginSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).send("Invalid email or password.");
  }

  try {
    const user = await prisma.user.findUnique({where: {email: result.data.email}});
    if (!user) {
      return res.status(400).send("Invalid email or password.");
    }
    const rawPassword = result.data.password ?? result.data.hashPassword!; //may be changed
    const validatePassword = await (bcrypt.compare(rawPassword, user.hashPassword));
    if (!validatePassword) {
      return res.status(400).send("Invalid email or password.");
    }

    let data_user = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    let jwtSecretKey = process.env.JWT_SECRET!;
    if (!jwtSecretKey) {
      return res.status(500).send("JWT secret key is not configured.");
    }

    let token_jwt = jwt.sign(data_user, jwtSecretKey, {expiresIn: "7d"}); 

    res.send({token: token_jwt});
  } catch (error) {
    res.status(500).send("Something went wrong.");
  }  
});

export default router;
