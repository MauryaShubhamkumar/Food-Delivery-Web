import { getPlatformSettingsRepo, updatePlatformSettingsRepo } from './platformSettings.repository.js';

export const DEFAULT_PLATFORM_SETTINGS = {
  platformName: 'FastBite',
  tagline: 'Food Express',
  logoUrl: null,
  supportEmail: 'support@fastbite.in',
  supportPhone: '+91 6387252549',
  supportAddress: 'FastBite HQ, Tech Hub, Varanasi, Uttar Pradesh, India',
  description: 'FastBite is your premier multi-restaurant food delivery marketplace connecting you with top-rated restaurants.'
};

export const formatPlatformSettings = (row) => {
  if (!row) return DEFAULT_PLATFORM_SETTINGS;
  return {
    platformName: row.platform_name || 'FastBite',
    tagline: row.tagline || 'Food Express',
    logoUrl: row.logo_url || null,
    supportEmail: row.support_email || 'support@fastbite.in',
    supportPhone: row.support_phone || '+91 6387252549',
    supportAddress: row.support_address || 'FastBite HQ, Tech Hub, Varanasi, Uttar Pradesh, India',
    description: row.description || DEFAULT_PLATFORM_SETTINGS.description
  };
};

export const getPublicPlatformSettingsService = async () => {
  const row = await getPlatformSettingsRepo();
  return formatPlatformSettings(row);
};

export const updatePlatformSettingsService = async (body) => {
  const { platformName, tagline, logoUrl, supportEmail, supportPhone, supportAddress, description } = body;
  const updated = await updatePlatformSettingsRepo({
    platformName: platformName?.trim() || 'FastBite',
    tagline: tagline?.trim() || 'Food Express',
    logoUrl: logoUrl || null,
    supportEmail: supportEmail?.trim() || 'support@fastbite.in',
    supportPhone: supportPhone?.trim() || '+91 6387252549',
    supportAddress: supportAddress?.trim() || 'FastBite HQ, Tech Hub, Varanasi, Uttar Pradesh, India',
    description: description?.trim() || DEFAULT_PLATFORM_SETTINGS.description
  });
  return formatPlatformSettings(updated);
};
