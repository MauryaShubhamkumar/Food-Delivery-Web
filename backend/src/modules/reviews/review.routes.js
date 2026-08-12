import express from 'express';
import {
  createReview, updateReview, deleteReview, getProductReviews, getUserReviewForOrderProduct,
  getAdminReviews, toggleReviewStatus, deleteAdminReview
} from './review.controller.js';
import authMiddleware, { requirePermission } from '../../middleware/auth.js';
import adminMiddleware from '../../middleware/adminAuth.js';
import { PERMISSIONS } from '../../config/permissions.js';

export const publicReviewRouter = express.Router();
publicReviewRouter.get('/product/:productId', getProductReviews);
publicReviewRouter.get('/eligibility', authMiddleware, getUserReviewForOrderProduct);
publicReviewRouter.post('/', authMiddleware, createReview);
publicReviewRouter.put('/:id', authMiddleware, updateReview);
publicReviewRouter.delete('/:id', authMiddleware, deleteReview);

export const adminReviewRouter = express.Router();
adminReviewRouter.get('/', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.VIEW_REVIEWS), getAdminReviews);
adminReviewRouter.patch('/:id/status', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.MANAGE_REVIEWS), toggleReviewStatus);
adminReviewRouter.delete('/:id', authMiddleware, adminMiddleware, requirePermission(PERMISSIONS.MANAGE_REVIEWS), deleteAdminReview);
