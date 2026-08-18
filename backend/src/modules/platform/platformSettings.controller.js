import { getPublicPlatformSettingsService, updatePlatformSettingsService } from './platformSettings.service.js';

export const getPublicPlatformSettings = async (req, res, next) => {
  try {
    const data = await getPublicPlatformSettingsService();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const updatePlatformSettings = async (req, res, next) => {
  try {
    const data = await updatePlatformSettingsService(req.body);
    res.json({ success: true, message: 'Platform settings updated successfully!', data });
  } catch (err) {
    next(err);
  }
};
