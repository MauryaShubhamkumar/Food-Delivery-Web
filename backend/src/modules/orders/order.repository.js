import { getPool } from '../../config/db.js';
import { logAuditEvent } from '../../utils/auditLogger.js';

export const findFoodItem = async (foodId) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT name, price, available, restaurant_id FROM food_items WHERE id = ?', [foodId]);
  return rows[0] || null;
};

export const findDuplicateUTR = async (utr) => {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT id FROM orders WHERE payment_method = 'upi' AND UPPER(payment_reference) = UPPER(?) AND payment_status NOT IN ('rejected', 'failed')",
    [utr]
  );
  return rows[0] || null;
};

export const findRestaurantSettings = async (restaurantId) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM restaurant_settings WHERE restaurant_id = ? LIMIT 1', [restaurantId]);
  return rows[0] || null;
};

export const findCoupon = async (restaurantId, code) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM coupons WHERE restaurant_id = ? AND UPPER(code) = ?', [restaurantId, code.toUpperCase()]);
  return rows[0] || null;
};

export const placeOrderTransaction = async (pool, { userId, restaurantId, address, calculatedTotal, discountAmount, appliedCouponCode, cleanPaymentMethod, initialPaymentStatus, cleanPaymentRef, itemsToInsert, couponId }) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (couponId) {
      await connection.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = ? AND restaurant_id = ?', [couponId, restaurantId]);
    }
    const [orderResult] = await connection.query(
      `INSERT INTO orders (restaurant_id, user_id, first_name, last_name, email, street, city, state, zip_code, country, phone, amount, discount_amount, coupon_code, status, payment, payment_method, payment_status, payment_reference) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'Pending',?,?,?,?)`,
      [restaurantId, userId, address.firstName||'', address.lastName||'', address.email||'', address.street||'', address.city||'', address.state||'', address.zipCode||'', address.country||'', address.phone||'', calculatedTotal, discountAmount, appliedCouponCode, false, cleanPaymentMethod, initialPaymentStatus, cleanPaymentRef]
    );
    const orderId = orderResult.insertId;
    for (const item of itemsToInsert) {
      await connection.query('INSERT INTO order_items (order_id, food_id, name, price, quantity) VALUES (?,?,?,?,?)', [orderId, item.foodId, item.name, item.price, item.quantity]);
      await connection.query('INSERT IGNORE INTO inventory (product_id, restaurant_id, quantity, minimum_stock) VALUES (?,?,50,5)', [item.foodId, restaurantId]);
      const [deductRes] = await connection.query('UPDATE inventory SET quantity = quantity - ? WHERE product_id = ? AND restaurant_id = ? AND quantity >= ?', [item.quantity, item.foodId, restaurantId, item.quantity]);
      if (deductRes.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        const e = new Error(`Sorry, "${item.name}" has insufficient stock available to complete this order.`);
        e.statusCode = 400;
        throw e;
      }
      const [invRows] = await connection.query('SELECT id, quantity FROM inventory WHERE product_id = ? AND restaurant_id = ? LIMIT 1', [item.foodId, restaurantId]);
      if (invRows.length > 0) {
        const invId = invRows[0].id;
        const newQty = Number(invRows[0].quantity);
        const prevQty = newQty + item.quantity;
        await connection.query(`INSERT INTO inventory_transactions (inventory_id, product_id, restaurant_id, type, quantity, previous_quantity, new_quantity, reason, order_id, user_id) VALUES (?,?,?,'ORDER_DEDUCTION',?,?,?,?,?,?)`, [invId, item.foodId, restaurantId, -item.quantity, prevQty, newQty, `Order #${orderId} Placed`, orderId, userId]);
        if (newQty === 0) await connection.query('UPDATE food_items SET available = FALSE WHERE id = ? AND restaurant_id = ?', [item.foodId, restaurantId]);
      }
    }
    await connection.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    await connection.commit();
    connection.release();
    return orderId;
  } catch (err) {
    try { await connection.rollback(); } catch (_) {}
    try { connection.release(); } catch (_) {}
    throw err;
  }
};

export const findUserOrders = async (userId) => {
  const pool = getPool();
  const [orders] = await pool.query(
    `SELECT o.*, r.name as restaurant_name, r.slug as restaurant_slug FROM orders o LEFT JOIN restaurants r ON o.restaurant_id = r.id WHERE o.user_id = ? ORDER BY o.created_at DESC`,
    [userId]
  );
  if (orders.length > 0) {
    const orderIds = orders.map(o => o.id);
    const [allItems] = await pool.query('SELECT id, order_id, food_id, name, price, quantity FROM order_items WHERE order_id IN (?)', [orderIds]);
    const itemsByOrderId = {};
    for (const item of allItems) {
      if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
      itemsByOrderId[item.order_id].push(item);
    }
    for (const order of orders) order.items = itemsByOrderId[order.id] || [];
  }
  return orders;
};

export const findAdminOrders = async (tenantId, { status, paymentStatus, search, page, limit }) => {
  const pool = getPool();
  let whereClause = ' WHERE restaurant_id = ?';
  const params = [tenantId];
  if (status && status !== 'All') {
    if (status === 'Pending') whereClause += " AND (status = 'Pending' OR status = 'Food Processing')";
    else { whereClause += ' AND status = ?'; params.push(status); }
  }
  if (paymentStatus && paymentStatus !== 'All') { whereClause += ' AND payment_status = ?'; params.push(paymentStatus); }
  if (search && search.trim() !== '') {
    const cleanSearch = search.trim().replace(/^#/, '');
    if (!isNaN(cleanSearch)) {
      whereClause += ' AND (id = ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ? OR payment_reference LIKE ?)';
      params.push(Number(cleanSearch), `%${cleanSearch}%`, `%${cleanSearch}%`, `%${cleanSearch}%`, `%${cleanSearch}%`, `%${cleanSearch}%`);
    } else {
      whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ? OR payment_reference LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`, `%${search.trim()}%`);
    }
  }
  const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM orders ${whereClause}`, params);
  const total = Number(countRows[0].total || 0);
  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit) || 1;
  const [orders] = await pool.query(`SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  if (orders.length > 0) {
    const orderIds = orders.map(o => o.id);
    const [allItems] = await pool.query('SELECT id, order_id, food_id, name, price, quantity FROM order_items WHERE order_id IN (?)', [orderIds]);
    const itemsByOrderId = {};
    for (const item of allItems) {
      if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
      itemsByOrderId[item.order_id].push(item);
    }
    for (const order of orders) order.items = itemsByOrderId[order.id] || [];
  }
  return { orders, total, totalPages, page, limit };
};

export const findAdminOrderById = async (id, tenantId) => {
  const pool = getPool();
  const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? AND restaurant_id = ?', [id, tenantId]);
  if (orders.length === 0) return null;
  const order = orders[0];
  const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
  order.items = items;
  return order;
};

export const updateOrderStatus = async (id, tenantId, status) => {
  const pool = getPool();
  await pool.query('UPDATE orders SET status = ? WHERE id = ? AND restaurant_id = ?', [status, id, tenantId]);
};

export const restoreStockOnCancellation = async (id, tenantId, userId) => {
  const pool = getPool();
  const [orderItems] = await pool.query('SELECT food_id, quantity FROM order_items WHERE order_id = ?', [id]);
  for (const item of orderItems) {
    const [invRows] = await pool.query('SELECT id, quantity FROM inventory WHERE product_id = ? AND restaurant_id = ? LIMIT 1', [item.food_id, tenantId]);
    if (invRows.length > 0) {
      const invId = invRows[0].id;
      const prevQty = Number(invRows[0].quantity);
      const newQty = prevQty + Number(item.quantity);
      await pool.query('UPDATE inventory SET quantity = quantity + ? WHERE id = ? AND restaurant_id = ?', [item.quantity, invId, tenantId]);
      await pool.query(`INSERT INTO inventory_transactions (inventory_id, product_id, restaurant_id, type, quantity, previous_quantity, new_quantity, reason, order_id, user_id) VALUES (?,?,?,'ORDER_CANCELLATION',?,?,?,?,?,?)`, [invId, item.food_id, tenantId, item.quantity, prevQty, newQty, `Order #${id} Cancelled`, id, userId || null]);
      await pool.query('UPDATE food_items SET available = TRUE WHERE id = ? AND restaurant_id = ?', [item.food_id, tenantId]);
    }
  }
};

export const approvePaymentRepo = async (id, tenantId, adminId, newOrderStatus) => {
  const pool = getPool();
  await pool.query(`UPDATE orders SET payment_status = 'paid', payment = TRUE, payment_verified_at = CURRENT_TIMESTAMP, payment_verified_by = ?, status = ? WHERE id = ? AND restaurant_id = ?`, [adminId, newOrderStatus, id, tenantId]);
  return findAdminOrderById(id, tenantId);
};

export const rejectPaymentRepo = async (id, tenantId, cleanReason) => {
  const pool = getPool();
  await pool.query(`UPDATE orders SET payment_status = 'rejected', payment_rejection_reason = ? WHERE id = ? AND restaurant_id = ?`, [cleanReason, id, tenantId]);
  return findAdminOrderById(id, tenantId);
};
