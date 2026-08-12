import { getPool, querySafe } from '../../config/db.js';

export const findPublicCategories = async (tenantId) => {
  const [rows] = await querySafe(
    'SELECT id, restaurant_id, name, description, image, is_active FROM categories WHERE restaurant_id = ? AND is_active = TRUE ORDER BY name ASC',
    [tenantId]
  );
  return rows;
};

export const findAdminCategories = async (tenantId, search) => {
  let query = `SELECT c.*, COUNT(f.id) as product_count FROM categories c
    LEFT JOIN food_items f ON ((f.category_id = c.id OR f.category = c.name) AND f.restaurant_id = c.restaurant_id)
    WHERE c.restaurant_id = ?`;
  const params = [tenantId];
  if (search && search.trim() !== '') {
    query += ' AND (c.name LIKE ? OR c.description LIKE ?)';
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }
  query += ' GROUP BY c.id ORDER BY c.name ASC';
  const [rows] = await querySafe(query, params);
  return rows;
};

export const findCategoryById = async (id, tenantId) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM categories WHERE id = ? AND restaurant_id = ?', [id, tenantId]);
  return rows[0] || null;
};

export const findCategoryByName = async (tenantId, name, excludeId = null) => {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT id FROM categories WHERE restaurant_id = ? AND LOWER(name) = LOWER(?) AND (? IS NULL OR id != ?)',
    [tenantId, name, excludeId, excludeId]
  );
  return rows[0] || null;
};

export const createCategory = async (tenantId, { name, description, isActive }) => {
  const pool = getPool();
  const [result] = await pool.query(
    'INSERT INTO categories (restaurant_id, name, description, is_active) VALUES (?, ?, ?, ?)',
    [tenantId, name, description || '', isActive]
  );
  return result.insertId;
};

export const updateCategory = async (id, tenantId, { name, description, isActive }) => {
  const pool = getPool();
  await pool.query(
    'UPDATE categories SET name = ?, description = ?, is_active = ? WHERE id = ? AND restaurant_id = ?',
    [name, description || '', isActive, id, tenantId]
  );
};

export const syncFoodItemsCategory = async (tenantId, categoryId, oldName, newName) => {
  const pool = getPool();
  await pool.query(
    'UPDATE food_items SET category = ? WHERE restaurant_id = ? AND (category_id = ? OR category = ?)',
    [newName, tenantId, categoryId, oldName]
  );
};

export const getProductCountForCategory = async (tenantId, categoryId, categoryName) => {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT COUNT(*) as count FROM food_items WHERE restaurant_id = ? AND (category_id = ? OR category = ?)',
    [tenantId, categoryId, categoryName]
  );
  return Number(rows[0]?.count || 0);
};

export const deleteCategory = async (id, tenantId) => {
  const pool = getPool();
  await pool.query('DELETE FROM categories WHERE id = ? AND restaurant_id = ?', [id, tenantId]);
};

export const toggleCategoryStatusRepo = async (id, tenantId, newStatus) => {
  const pool = getPool();
  await pool.query('UPDATE categories SET is_active = ? WHERE id = ? AND restaurant_id = ?', [newStatus ? 1 : 0, id, tenantId]);
};

export const getRestaurantIdBySlug = async (slug) => {
  const pool = getPool();
  const clean = (slug || '').trim().toLowerCase();
  const normalized = clean.replace(/[-_\s]/g, '');

  let [rows] = await pool.query('SELECT id FROM restaurants WHERE LOWER(slug) = ?', [clean]);
  if (rows.length > 0) return rows[0].id;

  [rows] = await pool.query(`SELECT id FROM restaurants WHERE LOWER(REPLACE(REPLACE(slug, '-', ''), '_', '')) = ?`, [normalized]);
  if (rows.length > 0) return rows[0].id;

  if (clean.length >= 4) {
    const prefix = clean.substring(0, Math.min(6, clean.length));
    [rows] = await pool.query(`SELECT id FROM restaurants WHERE slug LIKE CONCAT(?, '%') OR LOWER(REPLACE(name, '_', '')) LIKE CONCAT(?, '%') LIMIT 1`, [prefix, prefix]);
    if (rows.length > 0) return rows[0].id;
  }

  return null;
};
