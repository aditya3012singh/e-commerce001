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
const authMiddleware = async(req,res, next) => {
    console.log("hello from auth middlewRE")
    const authHeader=req.headers["authorization"]
    console.log(authHeader)
    if(!authHeader){
        return res.status(403).json({message:"no token provided"})
    }
    try{
        const decoded= jwt.verify(authHeader, process.env.JWT_SECRET || "secret")
        req.userId=decoded.id;

        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        req.user=user
        next()
    }catch(e){
        console.error("JWT verification error:", e);
        return res.status(403).json({message:"invalid token"})
    }
}

const requireAdmin = (req, res, next) => {
    if (req.user.role != "ADMIN") {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
};


router.get("/product/:id", async (req,res)=>{//get a product by id
    const id=req.params.id
    try{
        const productItem= await prisma.product.findUnique({
            where:{id}
        })
        if(!productItem){
            return res.status(404).json({message:"Product item not found"})
        }
        return res.status(201).json({
            id:productItem.id,
            title:productItem.title,
            description:productItem.description,
            price:productItem.price,
            imageUrl:productItem.imageUrl,
            stock:productItem.stock,
            Category:productItem.Category,
            createdAt:productItem.createdAt
        })
    }catch(error){
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
})

router.get("/probulk", async(req,res)=>{
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


router.use(authMiddleware)


router.post("/postproduct",requireAdmin, async (req,res)=>{
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



router.put("/product/:id", requireAdmin, async (req, res) => {
    const id = req.params.id;

    try {
        const parsed = productSchema.partial().safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
        }

        const dataToUpdate = parsed.data;

        const existingProduct = await prisma.product.findUnique({
            where: { id }
        });

        if (!existingProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: dataToUpdate
        });

        return res.status(200).json({
            message: "Product updated successfully",
            product: updatedProduct
        });

    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: "Internal server error" })
    }
});



router.delete("/product/:id",requireAdmin, async (req,res)=>{//delete a product by id
    const id=req.params.id
    try{
        const existingProductItem=await prisma.product.findUnique({
            where:{id}
        })
        if(!existingProductItem){
            return res.status(404).json({message:"Product not found"})
        }
        const deletedProductItem=await prisma.product.delete({
            where:{id}
        })
        return res.status(201).json({message:"Product item deleted",deletedProductItem})
    }catch(error){
        console.error(error)
        return res.status(500).json({message:"Server error"})
    }
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

router.get("/cart", async (req, res) => {
    try {
        const userId = req.userId;
        const cartItems = await prisma.cartItem.findMany({
            where: { userId },
            include: {
                product: true
            }
        });

        const formattedItems = cartItems.map(item => ({
            id: item.id,
            quantity: item.quantity,
            totalPrice: item.product.price * item.quantity,
            product: {
                id: item.product.id,
                name: item.product.name,
                price: item.product.price,
                imageUrl: item.product.imageUrl
            }
        }));

        return res.status(200).json({ cartItems: formattedItems });
    } catch (error) {
        console.error("Get cart failed:", error);
        return res.status(500).json({ message: "Server error" });
    }
});

router.get("/cart/:id",async (req,res)=>{//to get the cart item
    const id=req.params.id

    try{
        const cartItem= await prisma.cartItem.findUnique({
            where:{id},
            include:{
                product:true
            }
        })

        if(!cartItem){
            return res.status(404).json({message:"Cart item not found"})
        }

        const totalPrice = cartItem.product.price*cartItem.quantity;
        return res.status(200).json({
            id:cartItem.id,
            product:{
                id: cartItem.product.id,
                name:cartItem.product.name,
                price: cartItem.product.price,
                imageUrl: cartItem.product.imageUrl
            },
            quantity: cartItem.quantity,
            totalPrice
        })
    }catch(error){
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
})

router.put("/cart/:id", async (req,res)=>{//to update the quantity
    const id=req.params.id
    const {quantity}=req.body

    if(!quantity || quantity<1){
        return res.status(400).json({message:"Invalid quantity"})
    }
    try{
        const existingCartItem=await prisma.cartItem.findUnique({
            where:{id}
        })

        if(!existingCartItem){
            return res.status(404).json({message:"Cart item not found"})
        }

        const updatedCartItem=await prisma.cartItem.update({
            where:{id},
            data:{quantity}
        })

        return res.status(200).json({message:"Cart item updated", cartItem:updatedCartItem})
    }catch(error){
        console.error(error)
        return res.status(500).json({message:"Server error"})
    }
})



router.delete("/cart/:id", async (req,res)=>{//to remove an item from the cart
    const id=req.params.id
    try{
        const existingCartItem=await prisma.cartItem.findUnique({
            where:{id}
        })
        if(!existingCartItem){
            return res.status(404).json({message:"cart item not found"})
        }
        const deletedCartItem=await prisma.cartItem.delete({
            where:{id}
        })
        return res.status(201).json({message:"cart deleted",deletedCartItem})
    }catch(error){
        console.error(error)
        return res.status(500).json({message:"Server error"})
    }
})



export default router
