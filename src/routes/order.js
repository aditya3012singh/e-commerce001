import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/aurhMiddleware";
import { requireAdmin } from "../middlewares/roleMiddleware";

const prisma = new PrismaClient();
const router = express.Router();

router.use(authMiddleware)

router.post("/orderitems", async (req,res)=>{
    const userId=req.userId
    try{
        const cartItems=await prisma.cartItem.findMany({
            where:{
                userId
            },
            include:{
                product:true
            }
        })
        if(!cartItems){
            res.status(400).json({message:"cart is empty"})
        }
        const totalamout=cartItems.reduce((acc,item)=>{
            return acc + item.product.price*item.quantity
        },0)

        const order=await prisma.order.create({
            data:{
                userId,
                totalamout,
                orderItems:{
                    create: cartItems.map(item=>({
                        productId: item.productId,
                        quantity: item.quantity,
                        price:item.product.price
                    }))
                }
            },
            include:{
                orderItems:true
            }
        })
        await prisma.cartItem.deleteMany({
            where:{userId}
        })
        res.status(201).json({message:"Order placed",order})
    } catch (error) {
        console.error("Create order error:", error);
        res.status(500).json({ message: "Server error" });
    }
})

router.get("/orderitems", async (req,res) =>{
    const userId=req.userId
    try{
        const orders=await prisma.order.findMany({
            where:{
                userId
            },
            include:{
                product:true
            }
        })
        res.status(200).json({ orders });
    } catch (error) {
        console.error("Get orders error:", error);
        res.status(500).json({ message: "Server error" });
    }
})

router.put("/order/:id/status", requireAdmin, async (req,res)=>{
    const { id } = req.params;
    const { status } = req.body;

    const validStatus=["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]
    if(!validStatus.includes(status)){
        return res.status(400).json({ message: "Invalid order status" });
    }

    try{
        const order=await prisma.order.findUnique({
            where:{id}
        })

        const updateOrder=await prisma.order.update({
            where:{id},
            data:{status}
        })
        return res.status(200).json({
            message: "Order status updated successfully",
            order: updatedOrder
        });
    } catch (error) {
        console.error("Order status update error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
})

router.put("/order/:id/cancel", authMiddleware, async (req,res)=>{
    const {id}=req.params

    try{
        const order=await prisma.order.findUnique({where:id})
        if(!order || order.userId !== req.userId){
            return res.status(404).json({ message: "Order not found" });
        }
        if (order.status !== "PENDING") {
            return res.status(400).json({ message: "Only pending orders can be cancelled" });
        }
        const cancelledOrder = await prisma.order.update({
            where: { id },
            data: { status: "CANCELLED" }
        });
        return res.status(200).json({message:"Order Cancelled", order:cancelledOrder})
    }catch (error) {
        console.error("Cancel order error:", error);
        return res.status(500).json({ message: "Server error" });
    }
})

export default router