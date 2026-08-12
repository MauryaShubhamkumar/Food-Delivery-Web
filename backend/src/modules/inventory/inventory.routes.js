import express from 'express';
import { getAdminInventory, getInventorySummary, updateAdminStock, getInventoryHistory } from './inventory.controller.js';
import authMiddleware, { requirePermission } from '../../middleware/auth.js';
import adminMiddleware from '../../middleware/adminAuth.js';
import { PERMISSIONS } from '../../config/permissions.js';

export const adminInventoryRouter = express.Router();
adminInventoryRouter.get('/', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.VIEW_INVENTORY), getAdminInventory);
adminInventoryRouter.get('/summary', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.VIEW_INVENTORY), getInventorySummary);
adminInventoryRouter.get('/history', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.VIEW_INVENTORY), getInventoryHistory);
adminInventoryRouter.get('/:productId/history', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.VIEW_INVENTORY), getInventoryHistory);
adminInventoryRouter.put('/:productId', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.MANAGE_INVENTORY), updateAdminStock);
