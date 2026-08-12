import { getPool } from '../config/db.js';

export const logAuditEvent = async ({
  restaurantId = null,
  userId = null,
  action,
  entityType,
  entityId = null,
  details = null,
  req = null
}) => {
  try {
    const pool = getPool();
    const cleanDetails = typeof details === 'object' ? JSON.stringify(details) : (details ? String(details) : null);
    
    let ipAddress = null;
    if (req) {
      ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null;
    }

    const tenantId = restaurantId || req?.restaurantId || null;
    const actorId = userId || req?.userId || null;

    await pool.query(
      `INSERT INTO audit_logs (restaurant_id, user_id, action, entity_type, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, actorId, action, entityType, entityId ? String(entityId) : null, cleanDetails, ipAddress]
    );
  } catch (err) {
    console.warn("⚠️ Audit logging failed:", err.message);
  }
};
