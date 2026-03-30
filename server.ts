import { prisma } from "./prisma.ts";
import express from "express";
import Joi from "joi";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

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
  
  // const verifyToken = async (req, res, next) => {
  //   const token = req.headers["authorization"]
  //   const validatePassword = await bcrypt.compare(hashPassword_value, hashPassword_user)
  //     if (!validatePassword){
  //       return false;
  //     }
  //     else return true;
  // };

  const app = express()
  app.get("/", (req, res) => {
    res.send("Hello world");
  });

  app.use(express.json());

  app.get("/api/auth/register", (req, res) => {
    res.send("Hello from register tab");
  });

  app.post("/api/auth/register", async (req,res) => {
    const Schema = Joi.object({
      username: Joi.string().min(3).required(),
      email: Joi.string().email().required(),
      hashPassword: Joi.string().min(8).required()
    });

    const {error, value} = Schema.validate(req.body);
    if (error) {
      return res.status(400).send("Invalid email or password.");
    }
    
    const saltRounds = 10;

    const cryptPassword = await bcrypt.hash(req.body.hashPassword, saltRounds);

    console.log("Original: ", req.body.hashPassword)
    console.log("Hashed: ", cryptPassword)
    value.hashPassword = cryptPassword;
    
    try {
      const user = await prisma.user.create({
        data: {
          username: value.username,
          email: value.email,
          hashPassword: value.hashPassword
        } 
      });


      res.status(201).send({
        message: "User created successfully",
        data: value
      });        
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal server error");  
    }
    
  });

  app.post("/api/auth/login", async (req, res) => {
    
    const Schema = Joi.object({
      email: Joi.string().email().required,
      hashPassword: Joi.string().min(8).required
    });

    const {value, error } = Schema.validate(req.body);
    if (error) {
      return res.status(400).send("Invalid email or password.");
    }

    try {
      const user = await prisma.user.findUnique({where: {email: value.email}});
      if (!user) {
        return res.status(400).send("Invalid email or password.");
      }

      let data_user = {
        username: value.username,
        email: value.email,
        hashPassword: value.hashPassword
      };

      let jwtSecretKey = process.env.JWT_SECRET;
      if (!jwtSecretKey) {
        return res.status(500).send("JWT secret key is not configured.");
      }

      let token_jwt = jwt.sign(data_user, jwtSecretKey);

      res.send({token: token_jwt});
    } catch (error) {
      res.status(500).send("Something went wrong.");
    }

    
  })

  app.listen(PORT, () => console.log(`Server is running on localhost:${PORT}`));
}


main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
