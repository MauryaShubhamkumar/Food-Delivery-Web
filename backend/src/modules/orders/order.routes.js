import express from 'express';
import {
  placeOrder, userOrders, getAdminOrders, getAdminOrderDetails,
  updateAdminOrderStatus, approveAdminPayment, rejectAdminPayment
} from './order.controller.js';
import authMiddleware, { requirePermission } from '../../middleware/auth.js';
import adminMiddleware from '../../middleware/adminAuth.js';
import { PERMISSIONS } from '../../config/permissions.js';

export const orderRouter = express.Router();
orderRouter.post('/place', authMiddleware, placeOrder);
orderRouter.get('/userorders', authMiddleware, userOrders);

export const adminOrderRouter = express.Router();
adminOrderRouter.get('/', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.VIEW_ORDERS), getAdminOrders);
adminOrderRouter.get('/:id', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.VIEW_ORDERS), getAdminOrderDetails);
adminOrderRouter.put('/:id/status', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.UPDATE_ORDER_STATUS), updateAdminOrderStatus);
adminOrderRouter.put('/:id/payment/approve', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.MANAGE_PAYMENT_SETTINGS), approveAdminPayment);
adminOrderRouter.put('/:id/payment/reject', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.MANAGE_PAYMENT_SETTINGS), rejectAdminPayment);
