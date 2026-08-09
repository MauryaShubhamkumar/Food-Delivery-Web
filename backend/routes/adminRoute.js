import express from 'express';
import { getDashboardStats } from '../controllers/adminController.js';
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  toggleProductAvailability
} from '../controllers/adminProductController.js';
import {
  getAdminOrders,
  getAdminOrderDetails,
  updateAdminOrderStatus,
  approveAdminPayment,
  rejectAdminPayment
} from '../controllers/adminOrderController.js';
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  toggleCategoryStatus
} from '../controllers/categoryController.js';
import {
  getAdminUsers,
  getAdminUserDetails,
  getAdminUserOrders,
  updateAdminUserStatus
} from '../controllers/adminUserController.js';
import {
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
  toggleCouponStatus
} from '../controllers/couponController.js';
import { getAnalyticsData } from '../controllers/analyticsController.js';
import { getAdminSettings, updateAdminSettings } from '../controllers/settingsController.js';
import {
  getAdminReviews,
  toggleReviewStatus,
  deleteAdminReview
} from '../controllers/adminReviewController.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/adminAuth.js';
import upload from '../middleware/upload.js';

const adminRouter = express.Router();

// Protected Admin Dashboard Stats & Analytics
adminRouter.get('/dashboard', authMiddleware, adminMiddleware, getDashboardStats);
adminRouter.get('/analytics', authMiddleware, adminMiddleware, getAnalyticsData);

// Protected Admin Product Management Endpoints
adminRouter.get('/products', authMiddleware, adminMiddleware, getAdminProducts);
adminRouter.post('/products', authMiddleware, adminMiddleware, upload.single('image'), createAdminProduct);
adminRouter.put('/products/:id', authMiddleware, adminMiddleware, upload.single('image'), updateAdminProduct);
adminRouter.delete('/products/:id', authMiddleware, adminMiddleware, deleteAdminProduct);
adminRouter.patch('/products/:id/availability', authMiddleware, adminMiddleware, toggleProductAvailability);

// Protected Admin Order & Payment Verification Management Endpoints
adminRouter.get('/orders', authMiddleware, adminMiddleware, getAdminOrders);
adminRouter.get('/orders/:id', authMiddleware, adminMiddleware, getAdminOrderDetails);
adminRouter.put('/orders/:id/status', authMiddleware, adminMiddleware, updateAdminOrderStatus);
adminRouter.put('/orders/:id/payment/approve', authMiddleware, adminMiddleware, approveAdminPayment);
adminRouter.put('/orders/:id/payment/reject', authMiddleware, adminMiddleware, rejectAdminPayment);

// Protected Admin Category Management Endpoints
adminRouter.get('/categories', authMiddleware, adminMiddleware, getAdminCategories);
adminRouter.post('/categories', authMiddleware, adminMiddleware, createAdminCategory);
adminRouter.put('/categories/:id', authMiddleware, adminMiddleware, updateAdminCategory);
adminRouter.delete('/categories/:id', authMiddleware, adminMiddleware, deleteAdminCategory);
adminRouter.patch('/categories/:id/status', authMiddleware, adminMiddleware, toggleCategoryStatus);

// Protected Admin User Management Endpoints
adminRouter.get('/users', authMiddleware, adminMiddleware, getAdminUsers);
adminRouter.get('/users/:id', authMiddleware, adminMiddleware, getAdminUserDetails);
adminRouter.get('/users/:id/orders', authMiddleware, adminMiddleware, getAdminUserOrders);
adminRouter.put('/users/:id/status', authMiddleware, adminMiddleware, updateAdminUserStatus);

// Protected Admin Coupon Management Endpoints
adminRouter.get('/coupons', authMiddleware, adminMiddleware, getAdminCoupons);
adminRouter.post('/coupons', authMiddleware, adminMiddleware, createAdminCoupon);
adminRouter.put('/coupons/:id', authMiddleware, adminMiddleware, updateAdminCoupon);
adminRouter.delete('/coupons/:id', authMiddleware, adminMiddleware, deleteAdminCoupon);
adminRouter.patch('/coupons/:id/status', authMiddleware, adminMiddleware, toggleCouponStatus);

// Protected Admin Review Moderation Endpoints
adminRouter.get('/reviews', authMiddleware, adminMiddleware, getAdminReviews);
adminRouter.patch('/reviews/:id/status', authMiddleware, adminMiddleware, toggleReviewStatus);
adminRouter.delete('/reviews/:id', authMiddleware, adminMiddleware, deleteAdminReview);

// Protected Admin Restaurant Settings Endpoints
adminRouter.get('/settings', authMiddleware, adminMiddleware, getAdminSettings);
adminRouter.put(
  '/settings',
  authMiddleware,
  adminMiddleware,
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'upiQr', maxCount: 1 }]),
  updateAdminSettings
);

export default adminRouter;
