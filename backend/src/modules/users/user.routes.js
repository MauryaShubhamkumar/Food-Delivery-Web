import express from 'express';
import {
  getProfile,
  updateProfile,
  updateAvatar,
  removeAvatar,
  getAdminUsers,
  getAdminUserDetails,
  getAdminUserOrders,
  updateAdminUserStatus
} from './user.controller.js';
import authMiddleware, { requirePermission } from '../../middleware/auth.js';
import adminMiddleware from '../../middleware/adminAuth.js';
import upload from '../../middleware/upload.js';
import { PERMISSIONS } from '../../config/permissions.js';

const userRouter = express.Router();

// Customer User Routes
userRouter.get("/me", authMiddleware, getProfile);
userRouter.post("/update", authMiddleware, updateProfile);
userRouter.post("/avatar", authMiddleware, upload.single('avatar'), updateAvatar);
userRouter.delete("/avatar", authMiddleware, removeAvatar);

// Admin User Management Routes (for index.js router mounting under /api/admin/users)
export const adminUserRouter = express.Router();

adminUserRouter.get('/', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.VIEW_CUSTOMERS), getAdminUsers);
adminUserRouter.get('/:id', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.VIEW_CUSTOMERS), getAdminUserDetails);
adminUserRouter.get('/:id/orders', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.VIEW_CUSTOMERS), getAdminUserOrders);
adminUserRouter.put('/:id/status', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.MANAGE_CUSTOMERS), updateAdminUserStatus);

export default userRouter;
