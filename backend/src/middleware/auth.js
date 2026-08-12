import jwt from 'jsonwebtoken';
import { getPool } from '../config/db.js';
import { hasPermission, normalizeRole } from '../config/permissions.js';

const authMiddleware = async (req, res, next) => {
  const token = req.headers.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not Authorized. Please login again."
    });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("❌ JWT_SECRET environment variable is not defined!");
      return res.status(500).json({ success: false, message: "Server configuration error." });
    }

    const token_decode = jwt.verify(token, jwtSecret);
    req.userId = token_decode.id;

    const pool = getPool();
    const [rows] = await pool.query('SELECT is_active, role, restaurant_id FROM users WHERE id = ?', [token_decode.id]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists."
      });
    }

    if (rows[0].is_active === false || rows[0].is_active === 0) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact the administrator."
      });
    }

    req.userRole = normalizeRole(rows[0].role);
    req.restaurantId = rows[0].restaurant_id || null;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid token. Please login again."
    });
  }
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized. Authentication required."
      });
    }

    if (!hasPermission(req.userRole, permission)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You do not have permission (${permission}) to perform this action.`
      });
    }

    next();
  };
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized. Authentication required."
      });
    }

    const normAllowed = allowedRoles.map(r => normalizeRole(r));
    if (!normAllowed.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Access denied for your user role."
      });
    }

    next();
  };
};

export default authMiddleware;
