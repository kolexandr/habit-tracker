import "dotenv/config";
import express from "express";
import {requireAuth} from "./src/middleware/auth.ts";
import rateLimit from "express-rate-limit";
import authRoute from "./src/api/auth.ts";
import habitsRoute from "./src/api/habits.ts";
import habitCompletionRoute from "./src/api/completion.ts";
import geminiRoute from "./src/api/gemini.ts";
import cors from "cors";
import cookieParser from "cookie-parser";

const PORT = process.env.PORT;


async function main() {
  const allowedOrigins = [
    "http://localhost:5173",
  ];

  const corsOptions = {
    origin: allowedOrigins,
    optionsSuccessStatus: 200,
    credentials: true
  };
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, try again later"
  });

  const app = express();
  app.use(express.json());
  app.use(limiter);
  app.use(cookieParser())
  app.use(cors(corsOptions));
  
  app.use("/api/auth/", authRoute);
  app.use("/api/habits/", requireAuth, habitsRoute);
  app.use("/api/habits/", requireAuth, habitCompletionRoute);
  app.use("/api/gemini/", requireAuth, geminiRoute);

  app.get("/", (req, res) => {
    res.send("Hello world");
  });
  app.listen(PORT, () => console.log(`Server is running on localhost:${PORT}`));

}


main();
