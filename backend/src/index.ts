import { prisma } from "../prisma.ts";
import path from "path";
import express from "express";
import dotenv from "dotenv";
import AuthRoute from "./api/auth.ts";
import {requireAuth} from "./middleware/auth.ts";
import rateLimit from "express-rate-limit"

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const PORT = process.env.PORT;

// write middleware for jwt token verification

async function main() {
  // Fetch all users with their habits
  // const allUsers = await prisma.user.findMany({
  //   // include: {
  //   //   habits: true,
  //   // },
  // });
  // console.log("All users:", JSON.stringify(allUsers, null, 2));
  

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, try again later"
  });

  const app = express();
  app.use(express.json());
  app.use(limiter);
  
  app.use("/api/auth/", AuthRoute);

  app.get("/", (req, res) => {
    res.send("Hello world");
  });

  app.get("/api/auth/register", (req, res) => {
    res.send("Hello from register tab");
  });

  app.listen(PORT, () => console.log(`Server is running on localhost:${PORT}`));
}


main();
