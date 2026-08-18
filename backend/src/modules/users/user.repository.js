import { getPool } from '../../config/db.js';

export const getUserById = async (id) => {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT id, name, first_name, last_name, email, role, restaurant_id, phone, address, street, city, state, zip_code, country, profession, dietary_preference, bio, avatar_url, avatar_public_id, created_at FROM users WHERE id = ?',
    [id]
  );
  if (!rows[0]) return null;
  const u = rows[0];

  // Backward compatibility fallback parsing
  const firstName = u.first_name || (u.name ? u.name.trim().split(' ')[0] : '');
  const lastName = u.last_name || (u.name ? u.name.trim().split(' ').slice(1).join(' ') : '');

  return {
    ...u,
    firstName,
    lastName,
    street: u.street || '',
    city: u.city || '',
    state: u.state || '',
    zipCode: u.zip_code || '',
    country: u.country || ''
  };
};

export const updateUserProfile = async (id, data) => {
  const pool = getPool();
  const {
    name,
    firstName,
    lastName,
    phone,
    street,
    city,
    state,
    zipCode,
    country,
    address,
    profession,
    dietary_preference,
    bio
  } = data;

  const cleanFirstName = (firstName !== undefined ? firstName : (data.first_name || '')).trim();
  const cleanLastName = (lastName !== undefined ? lastName : (data.last_name || '')).trim();
  
  let computedName = (name || '').trim();
  if (!computedName) {
    computedName = `${cleanFirstName} ${cleanLastName}`.trim();
  }
  if (!computedName && cleanFirstName) {
    computedName = cleanFirstName;
  }

  const cleanStreet = (street || '').trim();
  const cleanCity = (city || '').trim();
  const cleanState = (state || '').trim();
  const cleanZip = (zipCode !== undefined ? zipCode : (data.zip_code || '')).trim();
  const cleanCountry = (country || '').trim();

  let formattedAddress = (address || '').trim();
  if (!formattedAddress && (cleanStreet || cleanCity)) {
    formattedAddress = [cleanStreet, cleanCity, cleanState, cleanZip, cleanCountry].filter(Boolean).join(', ');
  }

  await pool.query(
    `UPDATE users SET 
      name = ?, 
      first_name = ?, 
      last_name = ?, 
      phone = ?, 
      street = ?, 
      city = ?, 
      state = ?, 
      zip_code = ?, 
      country = ?, 
      address = ?, 
      profession = ?, 
      dietary_preference = ?, 
      bio = ? 
     WHERE id = ?`,
    [
      computedName,
      cleanFirstName,
      cleanLastName,
      phone || '',
      cleanStreet,
      cleanCity,
      cleanState,
      cleanZip,
      cleanCountry,
      formattedAddress,
      profession || '',
      dietary_preference || 'Non-Veg',
      bio || '',
      id
    ]
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
