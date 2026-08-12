import { getPool } from '../../config/db.js';

export const findAdminCoupons = async (tenantId, { search, status } = {}) => {
  const pool = getPool();
  let query = 'SELECT * FROM coupons WHERE restaurant_id = ?';
  const params = [tenantId];
  if (search && search.trim() !== '') {
    query += ' AND code LIKE ?';
    params.push(`%${search.trim().toUpperCase()}%`);
  }
  if (status && status !== 'All') {
    if (status === 'Active') query += ' AND is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())';
    else if (status === 'Inactive') query += ' AND is_active = FALSE';
    else if (status === 'Expired') query += ' AND expires_at IS NOT NULL AND expires_at <= NOW()';
  }
  query += ' ORDER BY created_at DESC';
  const [rows] = await pool.query(query, params);
  return rows;
};

export const findCouponById = async (id, tenantId) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM coupons WHERE id = ? AND restaurant_id = ?', [id, tenantId]);
  return rows[0] || null;
};

export const findCouponByCode = async (tenantId, code, excludeId = null) => {
  const pool = getPool();
  let q = 'SELECT id FROM coupons WHERE restaurant_id = ? AND UPPER(code) = ?';
  const p = [tenantId, code.toUpperCase()];
  if (excludeId) { q += ' AND id != ?'; p.push(excludeId); }
  const [rows] = await pool.query(q, p);
  return rows[0] || null;
};

export const findPublicCouponByCode = async (tenantId, code) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM coupons WHERE restaurant_id = ? AND UPPER(code) = ?', [tenantId, code.toUpperCase()]);
  return rows[0] || null;
};

export const createCouponRepo = async (tenantId, data) => {
  const pool = getPool();
  const [result] = await pool.query(
    `INSERT INTO coupons (restaurant_id, code, discount_type, discount_value, minimum_order_amount, maximum_discount, usage_limit, expires_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [tenantId, data.code, data.type, data.discountValue, data.minOrder, data.maxDiscount, data.usageLimit, data.expiresAt, data.activeVal]
  );
  return result.insertId;
};

export const updateCouponRepo = async (id, tenantId, data) => {
  const pool = getPool();
  await pool.query(
    `UPDATE coupons SET code=?,discount_type=?,discount_value=?,minimum_order_amount=?,maximum_discount=?,usage_limit=?,expires_at=?,is_active=? WHERE id=? AND restaurant_id=?`,
    [data.code, data.type, data.discountValue, data.minOrder, data.maxDiscount, data.usageLimit, data.expiresAt, data.activeVal, id, tenantId]
  );
};

export const deleteCouponRepo = async (id, tenantId) => {
  const pool = getPool();
  await pool.query('DELETE FROM coupons WHERE id = ? AND restaurant_id = ?', [id, tenantId]);
};

export const toggleCouponStatusRepo = async (id, tenantId, newStatus) => {
  const pool = getPool();
  await pool.query('UPDATE coupons SET is_active = ? WHERE id = ? AND restaurant_id = ?', [newStatus ? 1 : 0, id, tenantId]);
};
