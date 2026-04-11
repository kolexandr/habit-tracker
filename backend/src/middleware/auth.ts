import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const requireAuth = async (req: Request, res: Response, next:NextFunction) => {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) return res.status(401).send("No token provided.");
    
    try {
      if (!process.env.JWT_SECRET) {
        return res.status(401).send("No JWT secret provided.");
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (typeof decoded === "string"){
        return res.status(401).send("Invalid token.");
      }

      req.user = decoded as {id: string; email: string};
      next();
    } catch (error) {
      return res.status(401).send("Invalid or expired token.")
    }
  };