import express from 'express';
import {
  getPlatformStats, getPlatformRestaurants, getPlatformRestaurantDetail,
  updateRestaurantStatus, getPlatformUsers, getPlatformOrders,
  getPlatformReviews, togglePlatformReviewVisibility, getPlatformAnalytics, getOnboardingStuck
} from './superAdmin.controller.js';
import authMiddleware, { requireRole } from '../../middleware/auth.js';
import { ROLES } from '../../config/permissions.js';

const superAdminRouter = express.Router();
const superAdminOnly = [authMiddleware, requireRole(ROLES.SUPER_ADMIN)];

superAdminRouter.get('/stats', ...superAdminOnly, getPlatformStats);
superAdminRouter.get('/restaurants', ...superAdminOnly, getPlatformRestaurants);
superAdminRouter.get('/restaurants/:id', ...superAdminOnly, getPlatformRestaurantDetail);
superAdminRouter.patch('/restaurants/:id/status', ...superAdminOnly, updateRestaurantStatus);
superAdminRouter.get('/users', ...superAdminOnly, getPlatformUsers);
superAdminRouter.get('/orders', ...superAdminOnly, getPlatformOrders);
superAdminRouter.get('/reviews', ...superAdminOnly, getPlatformReviews);
superAdminRouter.patch('/reviews/:id/visibility', ...superAdminOnly, togglePlatformReviewVisibility);
superAdminRouter.get('/analytics', ...superAdminOnly, getPlatformAnalytics);
superAdminRouter.get('/onboarding-stuck', ...superAdminOnly, getOnboardingStuck);

export default superAdminRouter;
