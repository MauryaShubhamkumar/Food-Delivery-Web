import { getPool } from '../../config/db.js';

export const getCartItems = async (userId) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT food_id, quantity FROM cart_items WHERE user_id = ?', [userId]);
  return rows;
};

export const getFoodRestaurant = async (itemId) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT restaurant_id, name FROM food_items WHERE id = ?', [itemId]);
  return rows[0] || null;
};

export const getCartRestaurantConflict = async (userId) => {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT DISTINCT f.restaurant_id, r.name as restaurant_name FROM cart_items c JOIN food_items f ON c.food_id = f.id LEFT JOIN restaurants r ON f.restaurant_id = r.id WHERE c.user_id = ?',
    [userId]
  );
  return rows;
};

export const clearCart = async (userId) => {
  const pool = getPool();
  await pool.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
};

export const upsertCartItem = async (userId, itemId) => {
  const pool = getPool();
  await pool.query(
    'INSERT INTO cart_items (user_id, food_id, quantity) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE quantity = quantity + 1',
    [userId, itemId]
  );
};

export const getCartItemQty = async (userId, itemId) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT quantity FROM cart_items WHERE user_id = ? AND food_id = ?', [userId, itemId]);
  return rows[0]?.quantity || 0;
};

export const decrementCartItem = async (userId, itemId) => {
  const pool = getPool();
  await pool.query('UPDATE cart_items SET quantity = quantity - 1 WHERE user_id = ? AND food_id = ?', [userId, itemId]);
};

export const removeCartItem = async (userId, itemId) => {
  const pool = getPool();
  await pool.query('DELETE FROM cart_items WHERE user_id = ? AND food_id = ?', [userId, itemId]);
};
