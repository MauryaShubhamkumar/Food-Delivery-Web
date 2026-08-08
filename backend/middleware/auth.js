import jwt from 'jsonwebtoken';
import { getPool } from '../config/db.js';

const authMiddleware = async (req, res, next) => {
  const token = req.headers.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not Authorized. Please login again."
    });
  }

  try {
    const token_decode = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_food_del_jwt_key_2026');
    req.body.userId = token_decode.id;
    req.userId = token_decode.id;

    // Verify user is active in database
    const pool = getPool();
    const [rows] = await pool.query('SELECT is_active, role FROM users WHERE id = ?', [token_decode.id]);
    if (rows.length > 0 && (rows[0].is_active === false || rows[0].is_active === 0)) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact the administrator."
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid token. Please login again."
    });
  }
};

export default authMiddleware;
