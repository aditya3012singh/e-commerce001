import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();
const prisma = new PrismaClient();

export const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(403).json({ message: "No token provided" });

    try {
        const decoded = jwt.verify(authHeader, process.env.JWT_SECRET || "secret");
        req.userId = decoded.id;

        const user = await prisma.user.findUnique({ 
            where: { 
                id: decoded.id 
            } 
        });
        if (!user) return res.status(404).json({ message: "User not found" });

        req.user = user;
        next();
    } catch (e) {
        console.error("JWT verification error:", e);
        res.status(403).json({ message: "Invalid token" });
    }
};
