import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import crypto from 'crypto';

import errorHandler from './middleware/errorHandler.js';
import { getPool } from './config/db.js';

// Module Routers
import authRouter from './modules/auth/auth.routes.js';
import userRouter, { adminUserRouter } from './modules/users/user.routes.js';
import { publicProductRouter, adminProductRouter } from './modules/products/product.routes.js';
import { publicCategoryRouter, adminCategoryRouter } from './modules/categories/category.routes.js';
import { orderRouter, adminOrderRouter } from './modules/orders/order.routes.js';
import cartRouter from './modules/cart/cart.routes.js';
import { publicCouponRouter, adminCouponRouter } from './modules/coupons/coupon.routes.js';
import { publicSettingsRouter, adminSettingsRouter } from './modules/settings/settings.routes.js';
import { publicReviewRouter, adminReviewRouter } from './modules/reviews/review.routes.js';
import { adminInventoryRouter } from './modules/inventory/inventory.routes.js';
import analyticsRouter from './modules/analytics/analytics.routes.js';
import adminDashboardRouter from './modules/admin/admin.routes.js';
import restaurantRouter from './modules/restaurants/restaurant.routes.js';
import superAdminRouter from './modules/super-admin/superAdmin.routes.js';

import { publicPlatformRouter, superAdminPlatformRouter } from './modules/platform/platformSettings.routes.js';

export const createApp = () => {
  const app = express();

  // 0. Trust Proxy — Required for Render/Vercel/Cloudflare reverse proxies & express-rate-limit
  app.set('trust proxy', 1);

  // 1. CORS Middleware mounted FIRST so all responses & preflights have Access-Control headers
  const getAllowedOrigins = () => {
    const envOrigins = [process.env.FRONTEND_URL, process.env.ALLOWED_ORIGINS]
      .filter(Boolean)
      .flatMap((url) => url.split(',').map((item) => item.trim()));

    const defaultOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ];

    return [...envOrigins, ...defaultOrigins].map((url) => url.replace(/\/+$/, ''));
  };

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowedOrigins = getAllowedOrigins();
        const normalizedOrigin = origin.replace(/\/+$/, '');

        if (
          allowedOrigins.includes('*') ||
          allowedOrigins.includes(normalizedOrigin) ||
          normalizedOrigin.startsWith('http://localhost:') ||
          normalizedOrigin.startsWith('http://127.0.0.1:')
        ) {
          return callback(null, true);
        } else {
          return callback(null, true);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'token', 'x-request-id']
    })
  );

  // 2. Request Correlation ID Middleware
  app.use((req, res, next) => {
    const reqId = req.headers['x-request-id'] || crypto.randomUUID();
    req.requestId = reqId;
    res.setHeader('X-Request-ID', reqId);
    next();
  });

  // 3. Gzip API Response Compression
  app.use(compression());

  // 4. Security Headers (Helmet) with Cloudinary & Unsplash Content Security Policy
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com', 'https://images.unsplash.com'],
          connectSrc: ["'self'", 'https://res.cloudinary.com', 'https://api.cloudinary.com']
        }
      }
    })
  );

  // 5. Express Rate Limiting (skipping OPTIONS preflight requests)
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2000,
    skip: (req) => req.method === 'OPTIONS',
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' }
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    skip: (req) => req.method === 'OPTIONS',
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
  });

  const orderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    skip: (req) => req.method === 'OPTIONS',
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many order submissions. Please try again in a few minutes.' }
  });

  app.use('/api', generalLimiter);
  app.use('/api/user/login', authLimiter);
  app.use('/api/user/register', authLimiter);
  app.use('/api/order/place', orderLimiter);

  // 6. Body Parser
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // 7. Static uploads directory
  app.use('/images', express.static('uploads'));

  // 8. Public & Domain Module Routes
  app.use('/api/food', publicProductRouter);
  app.use('/api/user', authRouter);
  app.use('/api/user', userRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/order', orderRouter);
  app.use('/api/categories', publicCategoryRouter);
  app.use('/api/coupon', publicCouponRouter);
  app.use('/api/settings', publicSettingsRouter);
  app.use('/api/platform', publicPlatformRouter);
  app.use('/api/reviews', publicReviewRouter);
  app.use('/api/restaurant', restaurantRouter);
  app.use('/api/super-admin', superAdminRouter);
  app.use('/api/super-admin', superAdminPlatformRouter);
  app.use('/api/inventory', adminInventoryRouter);

  // 9. Consolidated Admin Router
  const adminRouter = express.Router();
  adminRouter.use('/', adminDashboardRouter);
  adminRouter.use('/analytics', analyticsRouter);
  adminRouter.use('/products', adminProductRouter);
  adminRouter.use('/orders', adminOrderRouter);
  adminRouter.use('/categories', adminCategoryRouter);
  adminRouter.use('/users', adminUserRouter);
  adminRouter.use('/coupons', adminCouponRouter);
  adminRouter.use('/reviews', adminReviewRouter);
  adminRouter.use('/settings', adminSettingsRouter);
  adminRouter.use('/inventory', adminInventoryRouter);

  app.use('/api/admin', adminRouter);

  // 10. Health Check Endpoint
  app.get('/health', async (req, res) => {
    try {
      const pool = getPool();
      await pool.query('SELECT 1');
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected'
      });
    } catch (err) {
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        message: 'Database connectivity check failed'
      });
    }
  });

  app.get('/', (req, res) => {
    res.send('Food Delivery API Server is running!');
  });

  // 11. Centralized Error Handler
  app.use(errorHandler);

  return app;
};

export default createApp;
