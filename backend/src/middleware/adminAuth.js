import { getPool } from '../config/db.js';
import { normalizeRole, ROLES } from '../config/permissions.js';

const adminMiddleware = async (req, res, next) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Not Authorized. Please login again."
    });
  }

  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT role, restaurant_id FROM users WHERE id = ?', [userId]);

    if (rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Administrative privileges required."
      });
    }

    const userRole = normalizeRole(rows[0].role);
    if (userRole === ROLES.CUSTOMER) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Administrative privileges required."
      });
    }

    req.userRole = userRole;
    req.restaurantId = rows[0].restaurant_id || 1;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during admin authorization check."
    });
  }
};

export default adminMiddleware;
