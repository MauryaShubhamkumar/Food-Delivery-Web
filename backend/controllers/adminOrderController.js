import { getPool } from '../config/db.js';

// Valid status transitions
const VALID_TRANSITIONS = {
  'Pending': ['Confirmed', 'Cancelled'],
  'Food Processing': ['Confirmed', 'Preparing', 'Cancelled'], // Legacy support for existing orders
  'Confirmed': ['Preparing', 'Cancelled'],
  'Preparing': ['Out for Delivery', 'Cancelled'],
  'Out for Delivery': ['Delivered', 'Cancelled'],
  'Delivered': [],
  'Cancelled': []
};

const VALID_STATUS_LIST = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

// GET all orders for Admin with optional status, paymentStatus, search filter & pagination
export const getAdminOrders = async (req, res, next) => {
  try {
    const { status, paymentStatus, search, page: reqPage, limit: reqLimit } = req.query;
    const pool = getPool();

    let whereClause = ' WHERE 1=1';
    const params = [];

    if (status && status !== 'All') {
      if (status === 'Pending') {
        whereClause += " AND (status = 'Pending' OR status = 'Food Processing')";
      } else {
        whereClause += ' AND status = ?';
        params.push(status);
      }
    }

    if (paymentStatus && paymentStatus !== 'All') {
      whereClause += ' AND payment_status = ?';
      params.push(paymentStatus);
    }

    if (search && search.trim() !== '') {
      const cleanSearch = search.trim().replace(/^#/, '');
      if (!isNaN(cleanSearch)) {
        whereClause += ' AND (id = ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ? OR payment_reference LIKE ?)';
        params.push(Number(cleanSearch), `%${cleanSearch}%`, `%${cleanSearch}%`, `%${cleanSearch}%`, `%${cleanSearch}%`, `%${cleanSearch}%`);
      } else {
        whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ? OR payment_reference LIKE ?)';
        params.push(`%${cleanSearch}%`, `%${cleanSearch}%`, `%${cleanSearch}%`, `%${cleanSearch}%`, `%${cleanSearch}%`);
      }
    }

    // 1. Get total matching count
    const [countRows] = await pool.query(`SELECT COUNT(*) as total FROM orders ${whereClause}`, params);
    const total = Number(countRows[0].total || 0);

    // 2. Pagination calculation
    const page = Math.max(1, parseInt(reqPage) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(reqLimit) || 20));
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit) || 1;

    // 3. Fetch paginated orders
    const query = `SELECT * FROM orders ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const [orders] = await pool.query(query, [...params, limit, offset]);

    if (orders.length > 0) {
      // 4. Single batch query for order items to eliminate N+1 query problem
      const orderIds = orders.map(o => o.id);
      const [allItems] = await pool.query(
        `SELECT id, order_id, food_id, name, price, quantity FROM order_items WHERE order_id IN (?)`,
        [orderIds]
      );

      // Group items by order_id
      const itemsByOrderId = {};
      for (const item of allItems) {
        if (!itemsByOrderId[item.order_id]) {
          itemsByOrderId[item.order_id] = [];
        }
        itemsByOrderId[item.order_id].push(item);
      }

      for (const order of orders) {
        order.items = itemsByOrderId[order.id] || [];
      }
    }

    res.json({
      success: true,
      count: orders.length,
      page,
      limit,
      total,
      totalPages,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// GET single order details for Admin
export const getAdminOrderDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = orders[0];
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    order.items = items;

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE order status with transition validation
export const updateAdminOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !VALID_STATUS_LIST.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status specified. Valid choices are: ${VALID_STATUS_LIST.join(', ')}`
      });
    }

    const pool = getPool();
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const currentOrder = orders[0];
    const currentStatus = currentOrder.status || 'Pending';

    if (currentStatus === status) {
      return res.json({
        success: true,
        message: `Order #${id} status is already "${status}"`,
        data: currentOrder
      });
    }

    const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from "${currentStatus}" to "${status}". Allowed options: ${allowedNext.length > 0 ? allowedNext.join(', ') : 'None (Terminal state)'}`
      });
    }

    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    const [updatedRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    const updatedOrder = updatedRows[0];
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    updatedOrder.items = items;

    res.json({
      success: true,
      message: `Order #${id} status updated to "${status}"`,
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// APPROVE payment for an order
export const approveAdminPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.userId;
    const pool = getPool();

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = orders[0];
    if (order.payment_status === 'paid') {
      return res.status(400).json({ success: false, message: "Payment for this order is already marked as Paid." });
    }

    // Set payment_status = 'paid', payment = true, payment_verified_at = NOW, payment_verified_by = adminId
    // If order status is Pending, transition to Confirmed
    let newOrderStatus = order.status;
    if (order.status === 'Pending' || order.status === 'Food Processing') {
      newOrderStatus = 'Confirmed';
    }

    await pool.query(
      `UPDATE orders SET
        payment_status = 'paid',
        payment = TRUE,
        payment_verified_at = CURRENT_TIMESTAMP,
        payment_verified_by = ?,
        status = ?
      WHERE id = ?`,
      [adminId, newOrderStatus, id]
    );

    const [updatedRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    const updatedOrder = updatedRows[0];
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    updatedOrder.items = items;

    res.json({
      success: true,
      message: `Payment for Order #${id} approved successfully! Order status set to "${newOrderStatus}".`,
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};

// REJECT payment for an order
export const rejectAdminPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const pool = getPool();

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const order = orders[0];
    const cleanReason = reason && typeof reason === 'string' ? reason.trim() : 'Payment reference could not be verified by restaurant.';

    await pool.query(
      `UPDATE orders SET
        payment_status = 'rejected',
        payment_rejection_reason = ?
      WHERE id = ?`,
      [cleanReason, id]
    );

    const [updatedRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    const updatedOrder = updatedRows[0];
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    updatedOrder.items = items;

    res.json({
      success: true,
      message: `Payment for Order #${id} rejected.`,
      data: updatedOrder
    });
  } catch (error) {
    next(error);
  }
};
