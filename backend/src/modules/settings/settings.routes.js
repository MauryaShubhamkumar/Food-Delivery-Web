import express from 'express';
import { getPublicSettings, getAdminSettings, updateAdminSettings } from './settings.controller.js';
import authMiddleware, { requirePermission } from '../../middleware/auth.js';
import adminMiddleware from '../../middleware/adminAuth.js';
import upload from '../../middleware/upload.js';
import { PERMISSIONS } from '../../config/permissions.js';

export const publicSettingsRouter = express.Router();
publicSettingsRouter.get('/', getPublicSettings);

export const adminSettingsRouter = express.Router();
adminSettingsRouter.get('/', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.MANAGE_RESTAURANT_SETTINGS), getAdminSettings);
adminSettingsRouter.put('/', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.MANAGE_RESTAURANT_SETTINGS), upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'upiQr', maxCount: 1 }]), updateAdminSettings);
