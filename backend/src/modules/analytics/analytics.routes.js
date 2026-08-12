import express from 'express';
import { getAnalyticsData } from './analytics.controller.js';
import authMiddleware, { requirePermission } from '../../middleware/auth.js';
import adminMiddleware from '../../middleware/adminAuth.js';
import { PERMISSIONS } from '../../config/permissions.js';

const analyticsRouter = express.Router();
analyticsRouter.get('/', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.VIEW_ANALYTICS), getAnalyticsData);
export default analyticsRouter;
