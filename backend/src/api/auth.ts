import {Request, Response, Router} from "express";
import {z} from "zod";
import {prisma} from "../../prisma.ts"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = Router();

const RegisterSchema = z.object({
  username: z.string().min(3),
  email: z.email(),
  hashPassword: z.string().min(8)
});

const LoginSchema = z.object({
  email: z.email(),
  hashPassword: z.string().min(8)
});

type RegisterDto = z.output<typeof RegisterSchema>;
type LoginDto = z.output<typeof LoginSchema>;

router.post("/register", async (req:Request, res:Response) => {

  const result = RegisterSchema.safeParse(req.body)

  if (!result.success) {
    return res.status(400).send("Invalid email or password.");
  }
  const data : RegisterDto = result.data;

  const cryptPassword = await bcrypt.hash(data.hashPassword, 10);

  console.log("Original: ", data.hashPassword)
  console.log("Hashed: ", cryptPassword)
  const hashedPassword = cryptPassword;
  
  try {
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
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

  const data : LoginDto = result.data;
  try {
    const user = await prisma.user.findUnique({where: {email: data.email}});
    if (!user) {
      return res.status(400).send("Invalid email or password.");
    }
    const validatePassword = await (bcrypt.compare(data.hashPassword, user.hashPassword));
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