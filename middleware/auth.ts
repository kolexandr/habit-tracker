import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

const verifyToken = async (req: Request, res: Response, next:NextFunction) => {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) return res.status(401).send("No token provided.");
    
    try {
      // const decrypted = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      
    }
  };