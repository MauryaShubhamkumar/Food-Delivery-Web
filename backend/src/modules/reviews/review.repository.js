import { getPool } from '../../config/db.js';

export const findProductInfo = async (productId) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT id, name, restaurant_id FROM food_items WHERE id = ?', [productId]);
  return rows[0] || null;
};

export const findOrderById = async (orderId) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT id, user_id, status FROM orders WHERE id = ?', [orderId]);
  return rows[0] || null;
};

export const findOrderItem = async (orderId, productId) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT id FROM order_items WHERE order_id = ? AND food_id = ?', [orderId, productId]);
  return rows[0] || null;
};

export const findExistingReview = async (userId, orderId, productId) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM reviews WHERE user_id = ? AND order_id = ? AND product_id = ?', [userId, orderId, productId]);
  return rows[0] || null;
};

export const findReviewById = async (reviewId) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM reviews WHERE id = ?', [reviewId]);
  return rows[0] || null;
};

export const createReviewRepo = async ({ restaurantId, userId, productId, orderId, rating, comment }) => {
  const pool = getPool();
  const [result] = await pool.query(
    `INSERT INTO reviews (restaurant_id, user_id, product_id, order_id, rating, comment, status) VALUES (?, ?, ?, ?, ?, ?, 'visible')`,
    [restaurantId, userId, productId, orderId, rating, comment]
  );
  const [rows] = await pool.query(
    `SELECT r.id, r.rating, r.comment, r.status, r.created_at, u.name as authorName FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.id = ?`,
    [result.insertId]
  );
  return rows[0];
};

export const updateReviewRepo = async (reviewId, rating, comment) => {
  const pool = getPool();
  await pool.query('UPDATE reviews SET rating = ?, comment = ? WHERE id = ?', [rating, comment, reviewId]);
  const [rows] = await pool.query(
    `SELECT r.id, r.rating, r.comment, r.status, r.created_at, r.updated_at, u.name as authorName FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.id = ?`,
    [reviewId]
  );
  return rows[0];
};

export const deleteReviewRepo = async (reviewId) => {
  const pool = getPool();
  await pool.query('DELETE FROM reviews WHERE id = ?', [reviewId]);
};

export const getProductReviewStats = async (productId) => {
  const pool = getPool();
  const [rows] = await pool.query(`
    SELECT COUNT(id) as totalReviews,
      COALESCE(ROUND(AVG(rating), 1), 0) as averageRating,
      COALESCE(SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END), 0) as count5,
      COALESCE(SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END), 0) as count4,
      COALESCE(SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END), 0) as count3,
      COALESCE(SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END), 0) as count2,
      COALESCE(SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END), 0) as count1
    FROM reviews WHERE product_id = ? AND status = 'visible'`, [productId]);
  return rows[0] || {};
};

export const getProductReviewsList = async (productId, { limit, offset, orderByClause }) => {
  const pool = getPool();
  const [rows] = await pool.query(`
    SELECT r.id, r.user_id, r.product_id, r.order_id, r.rating, r.comment, r.created_at, r.updated_at, u.name as authorName
    FROM reviews r JOIN users u ON u.id = r.user_id
    WHERE r.product_id = ? AND r.status = 'visible' ${orderByClause} LIMIT ? OFFSET ?`, [productId, limit, offset]);
  return rows;
};

export const getAdminReviewsList = async (tenantId, { search, status, page, limit }) => {
  const pool = getPool();
  let where = 'WHERE r.restaurant_id = ?';
  const params = [tenantId];
  if (search && search.trim() !== '') {
    where += ' AND (u.name LIKE ? OR r.comment LIKE ?)';
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }
  if (status && status !== 'All') {
    where += ' AND r.status = ?';
    params.push(status.toLowerCase());
  }
  const [countRows] = await pool.query(`SELECT COUNT(r.id) as total FROM reviews r JOIN users u ON r.user_id = u.id LEFT JOIN food_items f ON r.product_id = f.id ${where}`, params);
  const total = Number(countRows[0]?.total || 0);
  const offset = (page - 1) * limit;
  const [rows] = await pool.query(`
    SELECT r.*, u.name as customer_name, f.name as product_name
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    LEFT JOIN food_items f ON r.product_id = f.id
    ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  return { total, rows };
};

export const toggleReviewStatusRepo = async (reviewId, tenantId, newStatus) => {
  const pool = getPool();
  await pool.query('UPDATE reviews SET status = ?, is_visible = ? WHERE id = ? AND restaurant_id = ?', [newStatus, newStatus === 'visible' ? 1 : 0, reviewId, tenantId]);
};

export const deleteAdminReviewRepo = async (reviewId, tenantId) => {
  const pool = getPool();
  await pool.query('DELETE FROM reviews WHERE id = ? AND restaurant_id = ?', [reviewId, tenantId]);
};
