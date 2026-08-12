import { getPool } from '../../config/db.js';

export const ensureInventoryRecords = async (tenantId) => {
  const pool = getPool();
  await pool.query('INSERT IGNORE INTO inventory (product_id, restaurant_id, quantity, minimum_stock) SELECT id, ?, 50, 5 FROM food_items WHERE restaurant_id = ?', [tenantId, tenantId]);
};

export const findInventoryList = async (tenantId, { search, status, sort, page, limit }) => {
  const pool = getPool();
  let whereConditions = ['f.restaurant_id = ?'];
  let params = [tenantId];
  if (search && search.trim() !== '') { whereConditions.push('f.name LIKE ?'); params.push(`%${search.trim()}%`); }
  if (status && status !== 'all') {
    if (status === 'out_of_stock') whereConditions.push('COALESCE(i.quantity, 0) = 0');
    else if (status === 'low_stock') whereConditions.push('COALESCE(i.quantity, 0) > 0 AND COALESCE(i.quantity, 0) <= COALESCE(i.minimum_stock, 5)');
    else if (status === 'in_stock') whereConditions.push('COALESCE(i.quantity, 0) > COALESCE(i.minimum_stock, 5)');
  }
  const whereClause = whereConditions.join(' AND ');
  let orderByClause = 'ORDER BY i.updated_at DESC';
  if (sort === 'qty_asc') orderByClause = 'ORDER BY i.quantity ASC';
  else if (sort === 'qty_desc') orderByClause = 'ORDER BY i.quantity DESC';
  else if (sort === 'name_asc') orderByClause = 'ORDER BY f.name ASC';
  const offset = (page - 1) * limit;
  const [[countRows], [rows]] = await Promise.all([
    pool.query(`SELECT COUNT(f.id) as total FROM food_items f LEFT JOIN inventory i ON f.id = i.product_id WHERE ${whereClause}`, params),
    pool.query(`SELECT f.id as productId, f.name as productName, f.category, f.image, f.price, f.available as manualAvailable, COALESCE(i.id, 0) as inventoryId, COALESCE(i.quantity, 0) as quantity, COALESCE(i.minimum_stock, 5) as minimumStock, i.updated_at as updatedAt FROM food_items f LEFT JOIN inventory i ON f.id = i.product_id WHERE ${whereClause} ${orderByClause} LIMIT ? OFFSET ?`, [...params, limit, offset])
  ]);
  return { totalCount: Number(countRows[0]?.total || 0), rows };
};

export const getInventorySummaryRepo = async (tenantId) => {
  const pool = getPool();
  const [rows] = await pool.query(`SELECT COUNT(f.id) as totalProducts, SUM(CASE WHEN COALESCE(i.quantity, 0) > COALESCE(i.minimum_stock, 5) THEN 1 ELSE 0 END) as inStock, SUM(CASE WHEN COALESCE(i.quantity, 0) > 0 AND COALESCE(i.quantity, 0) <= COALESCE(i.minimum_stock, 5) THEN 1 ELSE 0 END) as lowStock, SUM(CASE WHEN COALESCE(i.quantity, 0) = 0 THEN 1 ELSE 0 END) as outOfStock FROM food_items f LEFT JOIN inventory i ON f.id = i.product_id WHERE f.restaurant_id = ?`, [tenantId]);
  return rows[0] || {};
};

export const findInventoryByProduct = async (productId, tenantId) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT id, quantity, minimum_stock FROM inventory WHERE product_id = ? AND restaurant_id = ?', [productId, tenantId]);
  return rows[0] || null;
};

export const createInventory = async (productId, tenantId, qty, minStock) => {
  const pool = getPool();
  const [result] = await pool.query('INSERT INTO inventory (product_id, restaurant_id, quantity, minimum_stock) VALUES (?,?,?,?)', [productId, tenantId, qty, minStock]);
  return result.insertId;
};

export const updateInventory = async (invId, tenantId, qty, minStock) => {
  const pool = getPool();
  await pool.query('UPDATE inventory SET quantity = ?, minimum_stock = ? WHERE id = ? AND restaurant_id = ?', [qty, minStock, invId, tenantId]);
};

export const logInventoryTransaction = async ({ invId, productId, tenantId, txType, diff, prevQty, newQty, reason, userId }) => {
  const pool = getPool();
  await pool.query('INSERT INTO inventory_transactions (inventory_id, product_id, restaurant_id, type, quantity, previous_quantity, new_quantity, reason, user_id) VALUES (?,?,?,?,?,?,?,?,?)', [invId, productId, tenantId, txType, diff, prevQty, newQty, reason, userId]);
};

export const syncFoodItemAvailability = async (productId, tenantId, isAvail) => {
  const pool = getPool();
  await pool.query('UPDATE food_items SET available = ? WHERE id = ? AND restaurant_id = ?', [isAvail, productId, tenantId]);
};

export const findInventoryHistory = async (tenantId, productId, { page, limit }) => {
  const pool = getPool();
  let whereConditions = ['it.restaurant_id = ?'];
  let params = [tenantId];
  if (productId && productId !== 'all') { whereConditions.push('it.product_id = ?'); params.push(Number(productId)); }
  const whereClause = whereConditions.join(' AND ');
  const offset = (page - 1) * limit;
  const [[countRows], [rows]] = await Promise.all([
    pool.query(`SELECT COUNT(it.id) as total FROM inventory_transactions it WHERE ${whereClause}`, params),
    pool.query(`SELECT it.*, f.name as productName, u.name as userName, u.email as userEmail FROM inventory_transactions it LEFT JOIN food_items f ON it.product_id = f.id LEFT JOIN users u ON it.user_id = u.id WHERE ${whereClause} ORDER BY it.created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset])
  ]);
  return { totalCount: Number(countRows[0]?.total || 0), rows };
};

export const findFoodItemByIdAndTenant = async (productId, tenantId) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT id, name FROM food_items WHERE id = ? AND restaurant_id = ?', [productId, tenantId]);
  return rows[0] || null;
};
