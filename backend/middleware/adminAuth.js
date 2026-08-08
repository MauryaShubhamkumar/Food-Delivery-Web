import { getPool } from '../config/db.js';

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
    const [rows] = await pool.query('SELECT role FROM users WHERE id = ?', [userId]);

    if (rows.length === 0 || rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Admin privileges required."
      });
    }

    req.userRole = rows[0].role;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during admin authorization check."
    });
  }
};

export default adminMiddleware;
