import express from "express";
import userRouter from "./routes/user.js";
import dotenv from "dotenv";
import productRouter from "./routes/product1.js"
import cartRoutes from "./routes/cart.js";
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json()); // Parse JSON bodies

app.get("/", (req, res) => {
  res.send("API running!");
});

app.use("/api/v1/", userRouter);
app.use("/api/v1/",productRouter)
app.use("/api/v1/",cartRoutes)
console.log('DATABASE_URL:', process.env.DATABASE_URL);


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

