import express from "express";
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { productSchema } from "../middlewares/ValidateUser.js";



dotenv.config()
const router = express.Router();
const prisma = new PrismaClient()



/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
const authMiddleware = (req,res, next) => {
    console.log("hello from auth middlewRE")
    const authHeader=req.headers["authorization"]
    console.log(authHeader)
    if(!authHeader){
        return res.status(403).json({message:"no token provided"})
    }
    try{
        const decoded= jwt.verify(authHeader, process.env.JWT_SECRET || "secret")
        console.log("Decoded token:", decoded);
        console.log(decoded.id);
        req.userId=decoded.id;
        console.log("user",req.userId)
        console.log("authentiaction complete")
        next()
    }catch(e){
        console.error("JWT verification error:", e);
        return res.status(403).json({message:"invalid token"})
    }
}
router.use(authMiddleware)
router.post("/postproduct", async (req,res)=>{
    try{
        const parsed=productSchema.safeParse(req.body)
        console.log(parsed)
        if(!parsed.success){
            return res.status(403).json({message:"inputs are not correct"})
        }

        const userId = req.userId // Assuming your authMiddleware sets req.user
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        console.log(parsed.data)
        const id=req.userId
        console.log(id)
        const {title, price ,stock, description, imageUrl, Category}=parsed.data
        const product=await prisma.product.create({
            data:{
                title: title,
                description: description,
                price: price,
                imageUrl: imageUrl,
                stock: stock,
                Category: Category             
            }
        })
        return res.status(201).json({
            product:product
    })
    }catch(error){
        console.error(error)
        return res.status(406).json({message:"something went wrong"})
    }
})

router.get("/product/bulk", async(req,res)=>{
    const products=await prisma.product.findMany({
        select:{
            id:true,
            title:true,
            description:true,
            price:true,
            imageUrl:true,
            stock:true,
            Category:true
        }
    })
    return res.json({
        products
    })
})

router.get("/product/:id", async (req,res)=>{//get a product by id

})



router.put("/product/:id", async (req,res)=>{//update a product by id

})


router.delete("/product/:id", async (req,res)=>{//delete a product by id

})


router.post("/cart", async (req,res)=>{
    try{
        const userId=req.userId
        const{productId, quantity}=req.body

        if(!productId || !quantity || quantity<1){
            return res.status(400).json({message:"invalid input"})
        }
    

    const existingCartItem= await prisma.cartItem.findFirst({
        where:{
            userId,
            productId
        }
    })
    if(existingCartItem){
        const updateItem=await prisma.cartItem.update({
            where:{
                id:existingCartItem.id
            },
            data:{
                quantity: existingCartItem.quantity + quantity
            }
        })
        return res.json({cartItem:updateItem})
    }
    const newCartItem=await prisma.cartItem.create({
        data:{
            userId,
            productId,
            quantity
        }
    })
    res.status(201).json({cartItem:newCartItem})
    }catch(error){
        console.error("Add to cart failed: ",error)
        res.status(500).json({message:"something went wrong"})
    }
})

router.get("/cart", async (req,res)=>{
    const cartItems= await prisma.cartItem.findMany({
        select:{
            id:true,
            userId :true,
            productId:true,
            quantity:true
        }
    })
    return res.json({
        cartItems
    })
})

router.put("/cart/:id", async (req,res)=>{//to update the quantity

})



router.delete("/cart/:id", async (req,res)=>{//to remove an item from the cart

})



export default router
