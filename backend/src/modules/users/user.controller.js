import {
  getProfileService,
  updateProfileService,
  updateAvatarService,
  removeAvatarService,
  getAdminUsersService,
  updateAdminUserStatusService
} from './user.service.js';
import { getPool } from '../../config/db.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await getProfileService(req.userId);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await updateProfileService(req.userId, req.body);
    res.json({ success: true, message: "Profile updated successfully!", user });
  } catch (error) {
    next(error);
  }
};

export const updateAvatar = async (req, res, next) => {
  try {
    const user = await updateAvatarService(req.userId, req.file);
    res.json({ success: true, message: "Profile photo updated successfully!", user });
  } catch (error) {
    next(error);
  }
};

export const removeAvatar = async (req, res, next) => {
  try {
    const user = await removeAvatarService(req.userId);
    res.json({ success: true, message: "Profile photo removed successfully!", user });
  } catch (error) {
    next(error);
  }
};

export const getAdminUsers = async (req, res, next) => {
  try {
    const tenantId = req.restaurantId || 1;
    const result = await getAdminUsersService({
      tenantId,
      search: req.query.search,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getAdminUserDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.restaurantId || 1;
    const pool = getPool();

    const query = `
      SELECT 
        u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.phone, u.address, u.profession, u.dietary_preference, u.bio,
        COUNT(o.id) as totalOrders,
        COALESCE(SUM(CASE WHEN o.status != 'Cancelled' THEN o.amount ELSE 0 END), 0) as totalSpent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id AND o.restaurant_id = ?
      WHERE u.id = ?
      GROUP BY u.id
    `;

    const [rows] = await pool.query(query, [tenantId, id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const u = rows[0];
    res.json({
      success: true,
      data: {
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
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminUserOrders = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.restaurantId || 1;
    const pool = getPool();

    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? AND restaurant_id = ? ORDER BY created_at DESC',
      [id, tenantId]
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

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

export const updateAdminUserStatus = async (req, res, next) => {
  try {
    const role = req.userRole;
    if (role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only Super Admin has permission to activate or deactivate user accounts."
      });
    }

    const { id } = req.params;
    const targetStatus = req.body.isActive !== undefined ? req.body.isActive : req.body.is_active;

    const result = await updateAdminUserStatusService(req.userId, id, targetStatus);
    res.json({
      success: true,
      message: `Customer account "${result.userName}" ${result.isActive ? 'activated' : 'deactivated'} successfully.`,
      isActive: result.isActive
    });
  } catch (error) {
    next(error);
  }
};
