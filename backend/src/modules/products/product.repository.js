import { getPool, querySafe } from '../../config/db.js';

export const findProductsByRestaurant = async (tenantId, { search, category, available } = {}) => {
  const pool = getPool();
  let query = 'SELECT * FROM food_items WHERE restaurant_id = ?';
  const params = [tenantId];
  if (search && search.trim()) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }
  if (category && category !== 'All') {
    query += ' AND category = ?';
    params.push(category);
  }
  if (available !== undefined && available !== 'All' && available !== '') {
    const isAvail = available === 'true' || available === '1';
    query += ' AND available = ?';
    params.push(isAvail ? 1 : 0);
  }
  query += ' ORDER BY id DESC';
  const [rows] = await pool.query(query, params);
  return rows;
};

export const findPublicProducts = async (tenantId) => {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT f.id, f.restaurant_id, f.name, f.description, f.price, f.category, f.category_id, f.image, f.available,
            r.name as restaurant_name, r.slug as restaurant_slug,
            COALESCE(i.quantity, 50) as quantity, COALESCE(i.minimum_stock, 5) as minimum_stock
     FROM food_items f
     LEFT JOIN restaurants r ON f.restaurant_id = r.id
     LEFT JOIN inventory i ON f.id = i.product_id
     WHERE f.restaurant_id = ? ORDER BY f.id ASC`,
    [tenantId]
  );
  return rows;
};

export const findProductById = async (id, tenantId) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM food_items WHERE id = ? AND restaurant_id = ?', [id, tenantId]);
  return rows[0] || null;
};

export const createProduct = async (tenantId, { name, description, price, category, image, cloudinaryPublicId, isAvailable }) => {
  const pool = getPool();
  const [result] = await pool.query(
    'INSERT INTO food_items (restaurant_id, name, description, price, category, image, cloudinary_public_id, available) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [tenantId, name, description || '', Number(price), category, image, cloudinaryPublicId, isAvailable]
  );
  return result.insertId;
};

export const createProductInventory = async (productId, tenantId, quantity, minimumStock) => {
  const pool = getPool();
  await pool.query(
    'INSERT INTO inventory (product_id, restaurant_id, quantity, minimum_stock) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), minimum_stock = VALUES(minimum_stock)',
    [productId, tenantId, quantity, minimumStock]
  );
};

export const updateProduct = async (id, tenantId, { name, description, price, category, image, cloudinaryPublicId, isAvailable }) => {
  const pool = getPool();
  await pool.query(
    'UPDATE food_items SET name = ?, description = ?, price = ?, category = ?, image = ?, cloudinary_public_id = ?, available = ? WHERE id = ? AND restaurant_id = ?',
    [name, description || '', Number(price), category, image, cloudinaryPublicId, isAvailable, id, tenantId]
  );
};

export const deleteProduct = async (id, tenantId) => {
  const pool = getPool();
  await pool.query('DELETE FROM food_items WHERE id = ? AND restaurant_id = ?', [id, tenantId]);
};

export const softDeleteProduct = async (id, tenantId) => {
  const pool = getPool();
  await pool.query('UPDATE food_items SET available = FALSE WHERE id = ? AND restaurant_id = ?', [id, tenantId]);
};

export const getOrderRefCount = async (productId) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT COUNT(*) as count FROM order_items WHERE food_id = ?', [productId]);
  return Number(rows[0]?.count || 0);
};

export const toggleProductAvailabilityRepo = async (id, tenantId, newAvailability) => {
  const pool = getPool();
  await pool.query('UPDATE food_items SET available = ? WHERE id = ? AND restaurant_id = ?', [newAvailability ? 1 : 0, id, tenantId]);
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
