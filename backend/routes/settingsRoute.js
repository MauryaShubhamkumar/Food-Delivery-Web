import express from 'express';
import { getPublicSettings } from '../controllers/settingsController.js';

const settingsRouter = express.Router();

settingsRouter.get('/', getPublicSettings);

export default settingsRouter;
