import express from 'express';
import { addFood, listFood, removeFood } from '../controllers/foodController.js';
import upload from '../middleware/upload.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/adminAuth.js';

const foodRouter = express.Router();

foodRouter.get("/list", listFood);
foodRouter.post("/add", authMiddleware, adminMiddleware, upload.single("image"), addFood);
foodRouter.post("/remove", authMiddleware, adminMiddleware, removeFood);

export default foodRouter;
