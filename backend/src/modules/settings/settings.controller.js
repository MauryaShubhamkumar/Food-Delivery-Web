import { getPublicSettingsService, getAdminSettingsService, updateAdminSettingsService } from './settings.service.js';

export const getPublicSettings = async (req, res, next) => {
  try {
    const data = await getPublicSettingsService({ restaurantId: req.query.restaurant_id, slug: req.query.slug });
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const getAdminSettings = async (req, res, next) => {
  try {
    const data = await getAdminSettingsService(req.restaurantId || 1);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

export const updateAdminSettings = async (req, res, next) => {
  try {
    const data = await updateAdminSettingsService(req.restaurantId || 1, req.body, req.files, req.file);
    res.json({ success: true, message: 'Restaurant settings updated successfully!', data });
  } catch (e) { next(e); }
};
