import { findSettingsByRestaurant, upsertSettings, getRestaurantIdBySlug } from './settings.repository.js';
import { uploadImage, deleteImage } from '../../services/cloudinary.service.js';

const ALLOWED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

export const formatSettingsObj = (s) => ({
  restaurantName: s.restaurant_name || 'FastBite',
  logoUrl: s.logo_url || null,
  logoPublicId: s.logo_public_id || null,
  upiId: s.upi_id || 'shubhamkumarmaurya155@okaxis',
  upiQrUrl: s.upi_qr_url || null,
  upiQrPublicId: s.upi_qr_public_id || null,
  description: s.description || '',
  phone: s.phone || '',
  email: s.email || '',
  address: s.address || '',
  openingTime: s.opening_time || '10:00',
  closingTime: s.closing_time || '22:00',
  isOpen: Boolean(s.is_open),
  deliveryFee: Number(s.delivery_fee !== undefined ? s.delivery_fee : 40.0),
  minimumOrderAmount: Number(s.minimum_order_amount !== undefined ? s.minimum_order_amount : 199.0),
  currency: s.currency || 'INR',
  isActive: Boolean(s.is_active)
});

const DEFAULT_SETTINGS = {
  restaurantName: 'FastBite', logoUrl: null, upiId: 'shubhamkumarmaurya155@okaxis',
  upiQrUrl: null, description: 'Delicious food delivered to your doorstep.',
  phone: '', email: '', address: '', openingTime: '10:00', closingTime: '22:00',
  isOpen: true, deliveryFee: 40, minimumOrderAmount: 199, currency: 'INR', isActive: true
};

export const getPublicSettingsService = async ({ restaurantId, slug }) => {
  let targetId = restaurantId ? Number(restaurantId) : 1;
  if (slug && slug.trim()) {
    const found = await getRestaurantIdBySlug(slug);
    if (found) targetId = found;
  }
  const settings = await findSettingsByRestaurant(targetId);
  return settings ? formatSettingsObj(settings) : DEFAULT_SETTINGS;
};

export const getAdminSettingsService = async (tenantId) => {
  const settings = await findSettingsByRestaurant(tenantId);
  return settings ? formatSettingsObj(settings) : { ...DEFAULT_SETTINGS, restaurantName: 'Restaurant', upiId: '' };
};

export const updateAdminSettingsService = async (tenantId, body, files, file) => {
  const { restaurantName, description, phone, email, address, openingTime, closingTime, isOpen, deliveryFee, minimumOrderAmount, currency, isActive, upiId, logoUrl: providedLogoUrl, upiQrUrl: providedUpiQrUrl } = body;
  if (!restaurantName || restaurantName.trim() === '') { const e = new Error('Restaurant name is required'); e.statusCode = 400; throw e; }
  if (deliveryFee !== undefined && (isNaN(deliveryFee) || Number(deliveryFee) < 0)) { const e = new Error('Delivery fee must be a valid non-negative number'); e.statusCode = 400; throw e; }
  if (minimumOrderAmount !== undefined && (isNaN(minimumOrderAmount) || Number(minimumOrderAmount) < 0)) { const e = new Error('Minimum order amount must be a valid non-negative number'); e.statusCode = 400; throw e; }
  if (currency && !ALLOWED_CURRENCIES.includes(currency.toUpperCase())) { const e = new Error(`Unsupported currency '${currency}'. Allowed: ${ALLOWED_CURRENCIES.join(', ')}`); e.statusCode = 400; throw e; }

  const current = await findSettingsByRestaurant(tenantId);
  const isNew = !current;
  const cur = current || { logo_url: null, logo_public_id: null, upi_id: 'shubhamkumarmaurya155@okaxis', upi_qr_url: null, upi_qr_public_id: null, delivery_fee: 40.0, minimum_order_amount: 199.0 };

  let finalLogoUrl = cur.logo_url; let newLogoPublicId = cur.logo_public_id; let oldLogoPublicId = null;
  let finalUpiQrUrl = cur.upi_qr_url; let newUpiQrPublicId = cur.upi_qr_public_id; let oldUpiQrPublicId = null;

  const logoFile = files?.logo ? files.logo[0] : (file?.fieldname === 'logo' ? file : null);
  const upiQrFile = files?.upiQr ? files.upiQr[0] : (file?.fieldname === 'upiQr' ? file : null);

  if (logoFile) {
    const r = await uploadImage(logoFile.buffer, `FastBite/restaurant_${tenantId}/logo`, 'logo');
    finalLogoUrl = r.secure_url; oldLogoPublicId = cur.logo_public_id; newLogoPublicId = r.public_id;
  } else if (providedLogoUrl !== undefined) { finalLogoUrl = providedLogoUrl ? providedLogoUrl.trim() : null; }

  if (upiQrFile) {
    const r = await uploadImage(upiQrFile.buffer, `FastBite/restaurant_${tenantId}/payment`, 'upi_qr');
    finalUpiQrUrl = r.secure_url; oldUpiQrPublicId = cur.upi_qr_public_id; newUpiQrPublicId = r.public_id;
  } else if (providedUpiQrUrl !== undefined) { finalUpiQrUrl = providedUpiQrUrl ? providedUpiQrUrl.trim() : null; }

  const d = {
    cleanName: restaurantName.trim(), cleanPhone: phone ? phone.trim() : '', cleanEmail: email ? email.trim() : '',
    cleanAddress: address ? address.trim() : '', cleanDesc: description ? description.trim() : '',
    cleanOpenTime: openingTime ? openingTime.trim() : '10:00', cleanCloseTime: closingTime ? closingTime.trim() : '22:00',
    openVal: (isOpen === true || isOpen === 'true' || isOpen === 1) ? 1 : 0,
    activeVal: (isActive === false || isActive === 'false' || isActive === 0) ? 0 : 1,
    cleanCurrency: currency ? currency.toUpperCase() : 'INR',
    cleanUpiId: upiId ? upiId.trim() : (cur.upi_id || 'shubhamkumarmaurya155@okaxis'),
    finalLogoUrl, newLogoPublicId, finalUpiQrUrl, newUpiQrPublicId,
    deliveryFee: Number(deliveryFee !== undefined ? deliveryFee : cur.delivery_fee),
    minimumOrderAmount: Number(minimumOrderAmount !== undefined ? minimumOrderAmount : cur.minimum_order_amount)
  };

  await upsertSettings(tenantId, d, isNew);
  if (oldLogoPublicId) await deleteImage(oldLogoPublicId);
  if (oldUpiQrPublicId) await deleteImage(oldUpiQrPublicId);

  const updated = await findSettingsByRestaurant(tenantId);
  return formatSettingsObj(updated);
};
