import express from "express";
import { PrismaClient } from "@prisma/client";
import { productSchema } from "../middlewares/ValidateUser.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { requireAdmin } from "../middlewares/roleMiddleware.js";

const prisma = new PrismaClient();
const router = express.Router();

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
router.use(authMiddleware);


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

export default router;
