import express from 'express';
import {
  getPublicCategories, getAdminCategories, createAdminCategory,
  updateAdminCategory, deleteAdminCategory, toggleCategoryStatus
} from './category.controller.js';
import authMiddleware, { requirePermission } from '../../middleware/auth.js';
import adminMiddleware from '../../middleware/adminAuth.js';
import { PERMISSIONS } from '../../config/permissions.js';

// Public category route (mounted at /api/categories)
export const publicCategoryRouter = express.Router();
publicCategoryRouter.get('/', getPublicCategories);

// Admin category routes (for /api/admin/categories)
export const adminCategoryRouter = express.Router();
adminCategoryRouter.get('/', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.VIEW_CATEGORIES), getAdminCategories);
adminCategoryRouter.post('/', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.MANAGE_CATEGORIES), createAdminCategory);
adminCategoryRouter.put('/:id', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.MANAGE_CATEGORIES), updateAdminCategory);
adminCategoryRouter.delete('/:id', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.MANAGE_CATEGORIES), deleteAdminCategory);
adminCategoryRouter.patch('/:id/status', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.MANAGE_CATEGORIES), toggleCategoryStatus);
