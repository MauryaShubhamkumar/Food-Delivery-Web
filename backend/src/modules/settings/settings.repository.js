import { getPool } from '../../config/db.js';

export const findSettingsByRestaurant = async (tenantId) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM restaurant_settings WHERE restaurant_id = ? LIMIT 1', [tenantId]);
  return rows[0] || null;
};

export const upsertSettings = async (tenantId, data, isNew) => {
  const pool = getPool();
  if (isNew) {
    await pool.query(
      `INSERT INTO restaurant_settings (restaurant_id, restaurant_name, logo_url, logo_public_id, upi_id, upi_qr_url, upi_qr_public_id, description, phone, email, address, opening_time, closing_time, is_open, delivery_fee, minimum_order_amount, currency, is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [tenantId, data.cleanName, data.finalLogoUrl, data.newLogoPublicId, data.cleanUpiId, data.finalUpiQrUrl, data.newUpiQrPublicId, data.cleanDesc, data.cleanPhone, data.cleanEmail, data.cleanAddress, data.cleanOpenTime, data.cleanCloseTime, data.openVal, data.deliveryFee, data.minimumOrderAmount, data.cleanCurrency, data.activeVal]
    );
  } else {
    await pool.query(
      `UPDATE restaurant_settings SET restaurant_name=?,logo_url=?,logo_public_id=?,upi_id=?,upi_qr_url=?,upi_qr_public_id=?,description=?,phone=?,email=?,address=?,opening_time=?,closing_time=?,is_open=?,delivery_fee=?,minimum_order_amount=?,currency=?,is_active=? WHERE restaurant_id=?`,
      [data.cleanName, data.finalLogoUrl, data.newLogoPublicId, data.cleanUpiId, data.finalUpiQrUrl, data.newUpiQrPublicId, data.cleanDesc, data.cleanPhone, data.cleanEmail, data.cleanAddress, data.cleanOpenTime, data.cleanCloseTime, data.openVal, data.deliveryFee, data.minimumOrderAmount, data.cleanCurrency, data.activeVal, tenantId]
    );
  }
};

export const getRestaurantIdBySlug = async (slug) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT id FROM restaurants WHERE LOWER(slug) = LOWER(?)', [slug.trim()]);
  return rows[0]?.id || null;
};
