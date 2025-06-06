
import { OrderStatus, PrismaClient, Role } from "@prisma/client"


const prisma=new PrismaClient()

async function main(){
    const admin=await prisma.user.create({
        data:{
            email: "admin@gmail.com",
            name: "Admin User",
            password:"adminpass",
            role: Role.ADMIN,
        }
    });

    const customer= await prisma.user.create({
        data:{
            email:"customer@example.com",
            name:"Customer1",
            password:"cutomerpass",
            role:Role.CUSTOMER,
        }
    })

    const product1= await prisma.product.create({
        data:{
            title:"Wireless Headphones",
            description:"Electronic device",
            price:2000.00,
            imageUrl:"https://example.com/headphone.jpg",
            stock:100,
            Category:"Accessories"
        }
    })

    const product2= await prisma.product.create({
        data:{
            title:"Wireless Mouse",
            description:"Electronic device",
            price:1000.00,
            imageUrl:"https://example2.com/mouse.jpg",
            stock:50,
            Category:"Accessories"
        }
    })

    // creayting order with order items
    const order = await prisma.order.create({
        data: {
        userId: customer.id,
        total: product1.price + product2.price,
        status: OrderStatus.PAID,
        orderItems: {
            create: [
            {
                productId: product1.id,
                quantity: 1,
            },
            {
                productId: product2.id,
                quantity: 1,
            },
            ],
        },
        },
    });


    // adding item to cart
    await prisma.cartItem.create({
        data:{
            userId: customer.id,
            productId:product2.id
        }
        
    })
   console.log("'🌱 Seed complete'")
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
