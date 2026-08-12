import express from 'express';
import {
  getAdminCoupons, createAdminCoupon, updateAdminCoupon,
  deleteAdminCoupon, toggleCouponStatus, validateCouponPublic
} from './coupon.controller.js';
import authMiddleware, { requirePermission } from '../../middleware/auth.js';
import adminMiddleware from '../../middleware/adminAuth.js';
import { PERMISSIONS } from '../../config/permissions.js';

export const publicCouponRouter = express.Router();
publicCouponRouter.post('/validate', validateCouponPublic);

export const adminCouponRouter = express.Router();
adminCouponRouter.get('/', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.VIEW_COUPONS), getAdminCoupons);
adminCouponRouter.post('/', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.MANAGE_COUPONS), createAdminCoupon);
adminCouponRouter.put('/:id', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.MANAGE_COUPONS), updateAdminCoupon);
adminCouponRouter.delete('/:id', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.MANAGE_COUPONS), deleteAdminCoupon);
adminCouponRouter.patch('/:id/status', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.MANAGE_COUPONS), toggleCouponStatus);
