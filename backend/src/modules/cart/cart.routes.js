import express from 'express';
import { getCart, addToCart, removeFromCart } from './cart.controller.js';
import authMiddleware from '../../middleware/auth.js';

const cartRouter = express.Router();
cartRouter.get('/get', authMiddleware, getCart);
cartRouter.post('/add', authMiddleware, addToCart);
cartRouter.post('/remove', authMiddleware, removeFromCart);
export default cartRouter;
