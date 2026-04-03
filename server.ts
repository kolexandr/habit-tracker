import { prisma } from "./prisma.ts";
import express from "express";
import dotenv from "dotenv";
import AuthRoute from "./api/auth.ts"

dotenv.config();
const PORT = process.env.PORT;

// write middleware for jwt token verification

async function main() {
  // Fetch all users with their habits
  const allUsers = await prisma.user.findMany({
    include: {
      habits: true,
    },
  });
  console.log("All users:", JSON.stringify(allUsers, null, 2));
  

  const app = express();
  app.use(express.json());
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
