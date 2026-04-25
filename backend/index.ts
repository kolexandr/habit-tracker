import "dotenv/config"
import express from "express";
import authRoute from "./src/api/auth.ts";
import habitsRoute from "./src/api/habits.ts"
import {requireAuth} from "./src/middleware/auth.ts";
import rateLimit from "express-rate-limit";
import geminiRoute from "./src/api/gemini.ts";

const PORT = process.env.PORT;


async function main() {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, try again later"
  });

  const app = express();
  app.use(express.json());
  app.use(limiter);
  
  app.use("/api/auth/", authRoute);
  app.use("/api/habits/", requireAuth, habitsRoute);
  app.use("/api/gemini/", requireAuth, geminiRoute);

  app.get("/", (req, res) => {
    res.send("Hello world");
  });
  app.listen(PORT, () => console.log(`Server is running on localhost:${PORT}`));

}


main();
