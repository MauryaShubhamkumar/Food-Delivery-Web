import { getAdminInventoryService, getInventorySummaryService, updateAdminStockService, getInventoryHistoryService } from './inventory.service.js';

export const getAdminInventory = async (req, res, next) => {
  try {
    const result = await getAdminInventoryService(req.restaurantId || 1, req.query);
    res.json({ success: true, ...result });
  } catch (e) { next(e); }
};

export const getInventorySummary = async (req, res, next) => {
  try {
    const data = await getInventorySummaryService(req.restaurantId || 1);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const updateAdminStock = async (req, res, next) => {
  try {
    const data = await updateAdminStockService(req.restaurantId || 1, req.params.productId, req.body, req.userId || null);
    res.json({ success: true, message: `Stock for "${data.productName}" updated to ${data.quantity} units.`, data });
  } catch (e) { next(e); }
};

export const getInventoryHistory = async (req, res, next) => {
  try {
    const productId = req.params.productId || 'all';
    const result = await getInventoryHistoryService(req.restaurantId || 1, productId, req.query);
    res.json({ success: true, ...result });
  } catch (e) { next(e); }
};
