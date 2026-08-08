import express from 'express';
import { getPublicCategories } from '../controllers/categoryController.js';

const categoryRouter = express.Router();

categoryRouter.get('/', getPublicCategories);

export default categoryRouter;
