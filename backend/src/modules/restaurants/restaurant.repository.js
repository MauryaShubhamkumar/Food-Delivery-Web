import { getPool } from '../../config/db.js';

export const getRestaurantById = async (id) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT * FROM restaurants WHERE id = ?', [id]);
  return rows[0] || null;
};

export const getRestaurantBySlug = async (slug) => {
  const pool = getPool();
  const cleanSlug = (slug || '').trim().toLowerCase();
  const normalized = cleanSlug.replace(/[-_\s]/g, '');

  // 1. Direct case-insensitive match
  let [rows] = await pool.query(
    'SELECT id, name, slug, logo_url, email, phone, address, city, state, pincode, status FROM restaurants WHERE LOWER(slug) = ?',
    [cleanSlug]
  );
  if (rows.length > 0) return rows[0];

  // 2. Normalized without hyphens/underscores
  [rows] = await pool.query(
    `SELECT id, name, slug, logo_url, email, phone, address, city, state, pincode, status FROM restaurants 
     WHERE LOWER(REPLACE(REPLACE(slug, '-', ''), '_', '')) = ?`,
    [normalized]
  );
  if (rows.length > 0) return rows[0];

  // 3. Fallback by restaurant ID if slug is numeric
  if (!isNaN(cleanSlug) && Number(cleanSlug) > 0) {
    [rows] = await pool.query(
      'SELECT id, name, slug, logo_url, email, phone, address, city, state, pincode, status FROM restaurants WHERE id = ?',
      [Number(cleanSlug)]
    );
    if (rows.length > 0) return rows[0];
  }

  // 4. Typo-tolerant prefix fallback (e.g. skmreslaurant -> skmrestaurant)
  if (cleanSlug.length >= 4) {
    const prefix = cleanSlug.substring(0, Math.min(6, cleanSlug.length));
    [rows] = await pool.query(
      `SELECT id, name, slug, logo_url, email, phone, address, city, state, pincode, status FROM restaurants 
       WHERE slug LIKE CONCAT(?, '%') OR LOWER(REPLACE(name, '_', '')) LIKE CONCAT(?, '%') LIMIT 1`,
      [prefix, prefix]
    );
    if (rows.length > 0) return rows[0];
  }

  return null;
};

export const createRestaurantRepo = async ({ name, slug, email, phone, address, city, state, pincode }) => {
  const pool = getPool();
  const [result] = await pool.query(
    `INSERT INTO restaurants (
      name, slug, email, phone, address, city, state, pincode, status, onboarding_step, onboarding_completed
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'setup', 1, FALSE)`,
    [name, slug, email, phone, address, city, state, pincode]
  );
  return result.insertId;
};

export const associateOwnerRepo = async (userId, restaurantId) => {
  const pool = getPool();
  await pool.query('UPDATE users SET restaurant_id = ?, role = ? WHERE id = ?', [restaurantId, 'restaurant_owner', userId]);
};

export const getPublicRestaurants = async () => {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT r.id, r.name, r.slug, r.logo_url, r.email, r.phone, r.address, r.city, r.state, r.status,
            s.opening_time, s.closing_time, s.is_open, s.delivery_fee, s.minimum_order_amount,
            COUNT(DISTINCT f.id) as product_count,
            COALESCE(AVG(rev.rating), 4.8) as rating,
            COUNT(DISTINCT rev.id) as review_count
     FROM restaurants r
     LEFT JOIN restaurant_settings s ON r.id = s.restaurant_id
     LEFT JOIN food_items f ON r.id = f.restaurant_id AND f.available = 1
     LEFT JOIN reviews rev ON r.id = rev.restaurant_id
     WHERE r.status = 'active'
     GROUP BY r.id, s.id
     ORDER BY r.id ASC`
  );
  return rows;
};
