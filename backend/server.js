import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import foodRouter from './routes/foodRoute.js';
import userRouter from './routes/userRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import adminRouter from './routes/adminRoute.js';
import categoryRouter from './routes/categoryRoute.js';
import couponRouter from './routes/couponRoute.js';
import settingsRouter from './routes/settingsRoute.js';
import errorHandler from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// App config
const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(express.json());
app.use(cors());

// DB connection
connectDB();

// API Endpoints
app.use("/api/food", foodRouter);
app.use("/images", express.static('uploads'));
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/admin", adminRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/coupon", couponRouter);
app.use("/api/settings", settingsRouter);

app.get("/", (req, res) => {
  res.send("Food Delivery API Server is running!");
});

// Centralized Error Handler Middleware
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Express Backend Server listening on http://localhost:${port}`);
});
