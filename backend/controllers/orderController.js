import { getPool } from '../config/db.js';

// Place user order
export const placeOrder = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { items, amount, address } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Order items cannot be empty" });
    }

    if (!address || !amount) {
      return res.status(400).json({ success: false, message: "Delivery address and total amount are required" });
    }

    const pool = getPool();

    // 1. Insert order into MySQL orders table
    const orderQuery = `
      INSERT INTO orders (
        user_id, first_name, last_name, email, street, city, state, zip_code, country, phone, amount, payment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const [orderResult] = await pool.query(orderQuery, [
      userId,
      address.firstName || '',
      address.lastName || '',
      address.email || '',
      address.street || '',
      address.city || '',
      address.state || '',
      address.zipCode || '',
      address.country || '',
      address.phone || '',
      amount,
      true // Mark payment completed for demo order
    ]);

    const orderId = orderResult.insertId;

    // 2. Insert line items into order_items table
    const itemQuery = `
      INSERT INTO order_items (order_id, food_id, name, price, quantity)
      VALUES (?, ?, ?, ?, ?);
    `;

    for (const item of items) {
      await pool.query(itemQuery, [
        orderId,
        item._id || item.id,
        item.name,
        item.price,
        item.quantity
      ]);
    }

    // 3. Clear user's cart in MySQL
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      orderId
    });
  } catch (error) {
    next(error);
  }
};

// Fetch orders for current logged-in user
export const userOrders = async (req, res, next) => {
  try {
    const userId = req.userId;
    const pool = getPool();

    const [orders] = await pool.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);

    for (let order of orders) {
      const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};
