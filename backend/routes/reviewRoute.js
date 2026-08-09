import express from 'express';
import {
  createReview,
  updateReview,
  deleteReview,
  getProductReviews,
  getUserReviewForOrderProduct
} from '../controllers/reviewController.js';
import authMiddleware from '../middleware/auth.js';

const reviewRouter = express.Router();

// Public route for product reviews & rating summary
reviewRouter.get('/product/:productId', getProductReviews);

// Protected Customer routes
reviewRouter.get('/eligibility', authMiddleware, getUserReviewForOrderProduct);
reviewRouter.post('/', authMiddleware, createReview);
reviewRouter.put('/:id', authMiddleware, updateReview);
reviewRouter.delete('/:id', authMiddleware, deleteReview);

export default reviewRouter;
