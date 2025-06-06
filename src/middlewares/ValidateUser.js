import { z } from "zod";

export const signupSchema=z.object({
    email:z.string().email(),
    name:z.string().min(5,"Name must be atleast 5 characters!!"),
    password:z.string().min(6,"PAssword must be atleast 6 characters!!"),
    role:z.string("ADMIN" || "CUSTOMER")
})

export const signinSchema=z.object({
    email:z.string().email(),
    password:z.string().min(5)
})

export const updateSchema=signupSchema.partial()


export const productSchema=z.object({
    title:z.string().min(3, "Title too short"),
    description:z.string().min(10, "Description must be atleast 10 characters"),
    price:z.coerce.number().positive("Price must be positive"),
    imageUrl: z.string().url("Invalid image URL"),
    stock:z.number().int().nonnegative("Stock must be zero or more"),
    Category:z.string().min(3)
})

export const orderSchmea=z.object({
    total:z.number(),
    status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"])
})

export const orderitemsSchema=z.object({
    quantity:z.number().int().positive("quantity must be atleast 1")
})