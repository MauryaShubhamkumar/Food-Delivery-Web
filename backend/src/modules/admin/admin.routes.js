import express from 'express';
import { getDashboardStats } from './admin.controller.js';
import authMiddleware, { requirePermission } from '../../middleware/auth.js';
import adminMiddleware from '../../middleware/adminAuth.js';
import { PERMISSIONS } from '../../config/permissions.js';

const adminDashboardRouter = express.Router();
adminDashboardRouter.get('/dashboard', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.VIEW_DASHBOARD), getDashboardStats);
export default adminDashboardRouter;
