import express from 'express';
import { loginUser, registerUser, getProfile, updateProfile, updateAvatar, removeAvatar } from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/me", authMiddleware, getProfile);
userRouter.post("/update", authMiddleware, updateProfile);
userRouter.post("/avatar", authMiddleware, upload.single('avatar'), updateAvatar);
userRouter.delete("/avatar", authMiddleware, removeAvatar);

export default userRouter;
