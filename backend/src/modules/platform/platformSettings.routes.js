import express from 'express';
import { getPublicPlatformSettings, updatePlatformSettings } from './platformSettings.controller.js';
import authMiddleware, { requireRole } from '../../middleware/auth.js';
import { ROLES } from '../../config/permissions.js';

export const publicPlatformRouter = express.Router();
publicPlatformRouter.get('/settings', getPublicPlatformSettings);

export const superAdminPlatformRouter = express.Router();
superAdminPlatformRouter.put('/platform-settings', authMiddleware, requireRole(ROLES.SUPER_ADMIN), updatePlatformSettings);
