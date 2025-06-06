import express from "express";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import dotenv from "dotenv";

import { PrismaClient } from "@prisma/client";

import { signinSchema, signupSchema } from "../middlewares/ValidateUser.js";


dotenv.config();

const router = express.Router();
const prisma = new PrismaClient()

router.post('/signup', async (req, res) => {
  try {
    const parsed = signupSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(403).json({ errors: parsed.error.errors });
    }
    console.log(parsed.data)
    const { email, name, password } = parsed.data;
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword
      }
    });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal server error" });
  }
});


router.post('/signin', async (req, res)=> {
  try {
    const parsed = signinSchema.safeParse(req.body);

    if (!parsed.success) {
       res.status(400).json({
        errors: parsed.error.errors,
        message: "Invalid credentials"
      });
      return
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email }
    });

    if (!user) {
       res.status(403).json({ error: "User not found" });
       return
    }

    const isPasswordValid = await bcrypt.compare(parsed.data.password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ error: "Incorrect password" });
      return 
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );
    const auth=jwt.verify(token,process.env.JWT_SECRET|| "secret") 
    console.log("auth", auth)
    console.log(auth.id)
    req.id=auth.id;
    console.log(req.id);
     res.json({
      message: "Login successful",
      jwt: token
    });
    return
  } catch (error) {
    console.error(error);
     res.status(500).json({ message: "Login failed due to server error" });
     return
  }
});

export default router;
