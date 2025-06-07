import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const prisma = new PrismaClient();
const router = express.Router();

router.use(authMiddleware);

router.post("/cart", async (req, res) => {
    const userId = req.userId;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity < 1) return res.status(400).json({ message: "Invalid input" });

    try {
        const existingCartItem = await prisma.cartItem.findFirst({ 
            where: { 
                userId, 
                productId 
            } 
        });

        if (existingCartItem) {
            const updateItem = await prisma.cartItem.update({
                where: { 
                    id: existingCartItem.id 
                },
                data: { 
                    quantity: existingCartItem.quantity + quantity
                }
            });
            return res.json({ 
                cartItem: updateItem 
            });
        }

        const newCartItem = await prisma.cartItem.create({ 
            data: { 
                userId, 
                productId, 
                quantity 
            } 
        });
        res.status(201).json({ 
            cartItem: newCartItem 
        });
    } catch (error) {
        console.error("Add to cart failed: ", error);
        res.status(500).json({ message: "Something went wrong" });
    }
});

router.get("/cart", async (req, res) => {
    const userId = req.userId;

    try {
        const cartItems = await prisma.cartItem.findMany({
            where: { 
                userId 
            },
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
        res.status(500).json({ message: "Server error" });
    }
});   

router.get("/cart/:id", async (req, res) => {
    const id = req.params.id;

    try {
        const cartItem = await prisma.cartItem.findUnique({
            where: { id },
            include: { product: true }
        });

        if (!cartItem) return res.status(404).json({ message: "Cart item not found" });

        const totalPrice = cartItem.product.price * cartItem.quantity;
        res.status(200).json({
            id: cartItem.id,
            quantity: cartItem.quantity,
            totalPrice,
            product: {
                id: cartItem.product.id,
                name: cartItem.product.name,
                price: cartItem.product.price,
                imageUrl: cartItem.product.imageUrl
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

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

export default router;
