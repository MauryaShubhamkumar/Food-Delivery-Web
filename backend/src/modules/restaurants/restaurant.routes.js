import express from 'express';
import {
  createRestaurant,
  getMyRestaurant,
  updateOnboarding,
  uploadRestaurantLogo,
  launchRestaurant,
  getPublicRestaurantBySlug,
  listRestaurants
} from './restaurant.controller.js';
import authMiddleware, { requireRole } from '../../middleware/auth.js';
import upload from '../../middleware/upload.js';
import { ROLES } from '../../config/permissions.js';

const restaurantRouter = express.Router();

restaurantRouter.get('/list', listRestaurants);
restaurantRouter.get('/slug/:slug', getPublicRestaurantBySlug);
restaurantRouter.post('/create', authMiddleware, requireRole(ROLES.RESTAURANT_OWNER, ROLES.SUPER_ADMIN), createRestaurant);
restaurantRouter.get('/me', authMiddleware, getMyRestaurant);
restaurantRouter.put('/me/onboarding', authMiddleware, requireRole(ROLES.RESTAURANT_OWNER, ROLES.SUPER_ADMIN), updateOnboarding);
restaurantRouter.post('/me/logo', authMiddleware, requireRole(ROLES.RESTAURANT_OWNER, ROLES.SUPER_ADMIN), upload.single('logo'), uploadRestaurantLogo);
restaurantRouter.post('/me/launch', authMiddleware, requireRole(ROLES.RESTAURANT_OWNER, ROLES.SUPER_ADMIN), launchRestaurant);

export default restaurantRouter;
