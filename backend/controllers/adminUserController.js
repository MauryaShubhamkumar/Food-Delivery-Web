import { getPool } from '../config/db.js';

// GET registered customers for Admin with search, status filter, pagination & aggregated stats
export const getAdminUsers = async (req, res, next) => {
  try {
    const { search, status, page: reqPage, limit: reqLimit } = req.query;
    const pool = getPool();

    let whereClause = " WHERE u.role = 'customer'";
    const params = [];

    if (search && search.trim() !== '') {
      const cleanSearch = `%${search.trim()}%`;
      whereClause += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
      params.push(cleanSearch, cleanSearch, cleanSearch);
    }

    if (status && status !== 'All') {
      if (status === 'Active') {
        whereClause += ' AND (u.is_active = TRUE OR u.is_active = 1 OR u.is_active IS NULL)';
      } else if (status === 'Inactive') {
        whereClause += ' AND (u.is_active = FALSE OR u.is_active = 0)';
      }
    }

    // 1. Total count query
    const [countRows] = await pool.query(`SELECT COUNT(DISTINCT u.id) as total FROM users u ${whereClause}`, params);
    const total = Number(countRows[0].total || 0);

    // 2. Pagination calculation
    const page = Math.max(1, parseInt(reqPage) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(reqLimit) || 20));
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit) || 1;

    // 3. Paginated user query
    const query = `
      SELECT 
        u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.phone, u.address,
        COUNT(o.id) as totalOrders,
        COALESCE(SUM(CASE WHEN o.status != 'Cancelled' THEN o.amount ELSE 0 END), 0) as totalSpent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      ${whereClause}
      GROUP BY u.id ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(query, [...params, limit, offset]);

    const formattedUsers = rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || 'customer',
      isActive: u.is_active === undefined || u.is_active === null ? true : Boolean(u.is_active),
      phone: u.phone || 'N/A',
      address: u.address || 'N/A',
      totalOrders: Number(u.totalOrders || 0),
      totalSpent: Number(u.totalSpent || 0),
      createdAt: u.created_at
    }));

    res.json({
      success: true,
      count: formattedUsers.length,
      page,
      limit,
      total,
      totalPages,
      data: formattedUsers
    });
  } catch (error) {
    next(error);
  }
};

// GET single customer details for Admin
export const getAdminUserDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const query = `
      SELECT 
        u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.phone, u.address, u.profession, u.dietary_preference, u.bio,
        COUNT(o.id) as totalOrders,
        COALESCE(SUM(CASE WHEN o.status != 'Cancelled' THEN o.amount ELSE 0 END), 0) as totalSpent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      WHERE u.id = ?
      GROUP BY u.id
    `;

    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const u = rows[0];
    const userDetail = {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || 'customer',
      isActive: u.is_active === undefined || u.is_active === null ? true : Boolean(u.is_active),
      phone: u.phone || 'N/A',
      address: u.address || 'N/A',
      profession: u.profession || 'N/A',
      dietaryPreference: u.dietary_preference || 'Non-Veg',
      bio: u.bio || '',
      totalOrders: Number(u.totalOrders || 0),
      totalSpent: Number(u.totalSpent || 0),
      createdAt: u.created_at
    };

    res.json({
      success: true,
      data: userDetail
    });
  } catch (error) {
    next(error);
  }
};

// GET customer order history
export const getAdminUserOrders = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [id]
    );

    if (orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      const [allItems] = await pool.query(
        'SELECT id, order_id, food_id, name, price, quantity FROM order_items WHERE order_id IN (?)',
        [orderIds]
      );

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
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE customer account status (Activate / Deactivate)
export const updateAdminUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, is_active } = req.body;

    const targetStatus = isActive !== undefined ? isActive : is_active;
    if (targetStatus === undefined) {
      return res.status(400).json({ success: false, message: "Account status boolean is required" });
    }

    // Security Check 1: Admin cannot deactivate their own account
    if (Number(req.userId) === Number(id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own admin account."
      });
    }

    const pool = getPool();
    const [rows] = await pool.query('SELECT id, name, role, is_active FROM users WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = rows[0];

    // Security Check 2: Protect admin accounts from accidental deactivation in customer section
    if (user.role === 'admin' && !targetStatus) {
      return res.status(400).json({
        success: false,
        message: "Admin accounts cannot be deactivated from customer management."
      });
    }

    const activeVal = targetStatus ? 1 : 0;
    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [activeVal, id]);

    res.json({
      success: true,
      message: `Customer account "${user.name}" ${targetStatus ? 'activated' : 'deactivated'} successfully.`,
      isActive: Boolean(targetStatus)
    });
  } catch (error) {
    next(error);
  }
};
