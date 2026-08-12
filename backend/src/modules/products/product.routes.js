import express from 'express';
import {
  listFood, getAdminProducts, createAdminProduct,
  updateAdminProduct, deleteAdminProduct, toggleProductAvailability
} from './product.controller.js';
import authMiddleware, { requirePermission } from '../../middleware/auth.js';
import adminMiddleware from '../../middleware/adminAuth.js';
import upload from '../../middleware/upload.js';
import { PERMISSIONS } from '../../config/permissions.js';

// Public storefront routes (mounted at /api/food)
export const publicProductRouter = express.Router();
publicProductRouter.get('/list', listFood);

// Admin product management routes (for /api/admin/products)
export const adminProductRouter = express.Router();
adminProductRouter.get('/', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.VIEW_PRODUCTS), getAdminProducts);
adminProductRouter.post('/', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.MANAGE_PRODUCTS), upload.single('image'), createAdminProduct);
adminProductRouter.put('/:id', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.MANAGE_PRODUCTS), upload.single('image'), updateAdminProduct);
adminProductRouter.delete('/:id', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.MANAGE_PRODUCTS), deleteAdminProduct);
adminProductRouter.patch('/:id/availability', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.MANAGE_PRODUCTS), toggleProductAvailability);
