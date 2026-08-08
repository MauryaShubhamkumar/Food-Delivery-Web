import express from 'express';
import { validateCouponPublic } from '../controllers/couponController.js';

const couponRouter = express.Router();

couponRouter.post('/validate', validateCouponPublic);

export default couponRouter;
