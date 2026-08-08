import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
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

// Gzip API Response Compression
app.use(compression());

// Security Headers (Helmet)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Express Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // max 300 requests per 15 min window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // max 30 login/register attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login/registration attempts. Please try again after 15 minutes." }
});

app.use('/api', generalLimiter);
app.use('/api/user/login', authLimiter);
app.use('/api/user/register', authLimiter);

// CORS configuration supporting dynamic env vars, multiple comma-separated origins, and trailing slash normalization
const getAllowedOrigins = () => {
  const envOrigins = [process.env.FRONTEND_URL, process.env.ALLOWED_ORIGINS]
    .filter(Boolean)
    .flatMap(url => url.split(',').map(item => item.trim()));

  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ];

  return [...envOrigins, ...defaultOrigins].map(url => url.replace(/\/+$/, ''));
};

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, Curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    const allowedOrigins = getAllowedOrigins();
    const normalizedOrigin = origin.replace(/\/+$/, '');

    if (allowedOrigins.includes('*') || allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Request origin "${origin}" is not allowed. Configured allowed origins:`, allowedOrigins);
      return callback(new Error(`CORS Policy restriction: Origin "${origin}" is not allowed.`));
    }
  },
  credentials: true
}));

// Body Parser Middleware with size limits
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

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
