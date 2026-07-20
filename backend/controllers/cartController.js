import { getPool } from '../config/db.js';

// Add item to user cart
export const addToCart = async (req, res, next) => {
  try {
    const { itemId } = req.body;
    const userId = req.userId;

    if (!itemId) {
      return res.status(400).json({ success: false, message: "Item ID is required" });
    }

    const pool = getPool();

    // MySQL Upsert pattern
    const query = `
      INSERT INTO cart_items (user_id, food_id, quantity)
      VALUES (?, ?, 1)
      ON DUPLICATE KEY UPDATE quantity = quantity + 1;
    `;

    await pool.query(query, [userId, itemId]);
    res.json({ success: true, message: "Added to cart successfully" });
  } catch (error) {
    next(error);
  }
};

// Remove item from user cart
export const removeFromCart = async (req, res, next) => {
  try {
    const { itemId } = req.body;
    const userId = req.userId;

    if (!itemId) {
      return res.status(400).json({ success: false, message: "Item ID is required" });
    }

    const pool = getPool();

    // Fetch current quantity
    const [rows] = await pool.query(
      'SELECT quantity FROM cart_items WHERE user_id = ? AND food_id = ?',
      [userId, itemId]
    );

    if (rows.length > 0) {
      const currentQty = rows[0].quantity;
      if (currentQty > 1) {
        await pool.query(
          'UPDATE cart_items SET quantity = quantity - 1 WHERE user_id = ? AND food_id = ?',
          [userId, itemId]
        );
      } else {
        await pool.query(
          'DELETE FROM cart_items WHERE user_id = ? AND food_id = ?',
          [userId, itemId]
        );
      }
    }

    res.json({ success: true, message: "Removed from cart" });
  } catch (error) {
    next(error);
  }
};

// Fetch user cart data
export const getCart = async (req, res, next) => {
  try {
    const userId = req.userId;
    const pool = getPool();

    const [rows] = await pool.query(
      'SELECT food_id, quantity FROM cart_items WHERE user_id = ?',
      [userId]
    );

    const cartData = {};
    rows.forEach(row => {
      cartData[row.food_id] = row.quantity;
    });

    res.json({ success: true, cartData });
  } catch (error) {
    next(error);
  }
};
