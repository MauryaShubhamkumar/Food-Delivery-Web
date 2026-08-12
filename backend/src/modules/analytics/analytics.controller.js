import { getAnalyticsDataService } from './analytics.service.js';

export const getAnalyticsData = async (req, res, next) => {
  try {
    const result = await getAnalyticsDataService(req.restaurantId || 1, req.query);
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
};
