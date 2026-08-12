import { getPool } from '../../config/db.js';

export const getUserById = async (id) => {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT id, name, email, role, restaurant_id, phone, address, profession, dietary_preference, bio, avatar_url, avatar_public_id, created_at FROM users WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

export const updateUserProfile = async (id, { name, phone, address, profession, dietary_preference, bio }) => {
  const pool = getPool();
  await pool.query(
    `UPDATE users SET name = ?, phone = ?, address = ?, profession = ?, dietary_preference = ?, bio = ? WHERE id = ?`,
    [name, phone || '', address || '', profession || '', dietary_preference || 'Non-Veg', bio || '', id]
  );
  return await getUserById(id);
};

export const updateUserAvatar = async (id, avatarUrl, publicId) => {
  const pool = getPool();
  await pool.query('UPDATE users SET avatar_url = ?, avatar_public_id = ? WHERE id = ?', [avatarUrl, publicId, id]);
  return await getUserById(id);
};

export const removeUserAvatar = async (id) => {
  const pool = getPool();
  await pool.query('UPDATE users SET avatar_url = NULL, avatar_public_id = NULL WHERE id = ?', [id]);
  return await getUserById(id);
};

export const getAdminUsersRepo = async ({ tenantId, search, status, page, limit }) => {
  const pool = getPool();
  let whereClause = " WHERE u.role = 'customer'";
  const params = [tenantId];

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

  const [countRows] = await pool.query(`SELECT COUNT(DISTINCT u.id) as total FROM users u ${whereClause}`, params.slice(1));
  const total = Number(countRows[0]?.total || 0);

  const offset = (page - 1) * limit;
  const query = `
    SELECT 
      u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.phone, u.address,
      COUNT(o.id) as totalOrders,
      COALESCE(SUM(CASE WHEN o.status != 'Cancelled' THEN o.amount ELSE 0 END), 0) as totalSpent
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id AND o.restaurant_id = ?
    ${whereClause}
    GROUP BY u.id ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [rows] = await pool.query(query, [...params, limit, offset]);
  return { total, rows };
};

export const updateUserStatusRepo = async (id, isActive) => {
  const pool = getPool();
  await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
};
