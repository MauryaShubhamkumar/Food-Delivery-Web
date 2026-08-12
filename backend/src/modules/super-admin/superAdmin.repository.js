import { getPool } from '../../config/db.js';

export const getPlatformStatsRepo = async () => {
  const pool = getPool();
  const [[restStats], [userStats], [orderStats], [onboardingStats]] = await Promise.all([
    pool.query(`SELECT COUNT(id) as total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeCount, SUM(CASE WHEN status = 'setup' OR onboarding_completed = FALSE THEN 1 ELSE 0 END) as setupCount, SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactiveCount FROM restaurants`),
    pool.query(`SELECT COUNT(id) as total, SUM(CASE WHEN role = 'customer' THEN 1 ELSE 0 END) as customersCount, SUM(CASE WHEN role = 'restaurant_owner' THEN 1 ELSE 0 END) as ownersCount FROM users`),
    pool.query(`SELECT COUNT(id) as totalOrders, COALESCE(SUM(CASE WHEN order_status != 'Cancelled' THEN amount ELSE 0 END), 0) as totalGMV FROM orders`),
    pool.query(`SELECT COUNT(id) as pendingOnboarding FROM restaurants WHERE onboarding_completed = FALSE OR status = 'setup'`)
  ]);
  return { restStats, userStats, orderStats, onboardingStats };
};

export const getPlatformRestaurantsRepo = async ({ search, status, page, limit }) => {
  const pool = getPool();
  let whereConditions = []; let params = [];
  if (status && status !== 'all') {
    if (status === 'setup') whereConditions.push("(r.status = 'setup' OR r.onboarding_completed = FALSE)");
    else { whereConditions.push('r.status = ?'); params.push(status); }
  }
  if (search && search.trim() !== '') {
    const term = `%${search.trim()}%`;
    whereConditions.push('(r.name LIKE ? OR r.slug LIKE ? OR r.email LIKE ? OR r.phone LIKE ? OR u.name LIKE ? OR u.email LIKE ?)');
    params.push(term, term, term, term, term, term);
  }
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;
  const [[countRows], [dataRows]] = await Promise.all([
    pool.query(`SELECT COUNT(DISTINCT r.id) as total FROM restaurants r LEFT JOIN users u ON (u.restaurant_id = r.id AND u.role = 'restaurant_owner') ${whereClause}`, params),
    pool.query(`SELECT r.id, r.name, r.slug, r.logo_url, r.email, r.phone, r.address, r.city, r.state, r.pincode, r.status, r.onboarding_step, r.onboarding_completed, r.created_at, u.name as owner_name, u.email as owner_email, u.phone as owner_phone, (SELECT COUNT(f.id) FROM food_items f WHERE f.restaurant_id = r.id) as product_count, (SELECT COUNT(o.id) FROM orders o WHERE o.restaurant_id = r.id) as order_count, COALESCE((SELECT SUM(o.amount) FROM orders o WHERE o.restaurant_id = r.id AND o.order_status != 'Cancelled'), 0) as gmv FROM restaurants r LEFT JOIN users u ON (u.restaurant_id = r.id AND u.role = 'restaurant_owner') ${whereClause} GROUP BY r.id ORDER BY r.created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset])
  ]);
  return { totalCount: Number(countRows[0]?.total || 0), dataRows };
};

export const getPlatformRestaurantDetailRepo = async (id) => {
  const pool = getPool();
  const [restRows] = await pool.query('SELECT * FROM restaurants WHERE id = ?', [id]);
  if (restRows.length === 0) return null;
  const restaurant = restRows[0];
  const [[ownerRows], [settingsRows], [prodCountRows], [orderStatsRows], [reviewStatsRows]] = await Promise.all([
    pool.query('SELECT id, name, email, phone, is_active, created_at FROM users WHERE restaurant_id = ? AND role = ? LIMIT 1', [id, 'restaurant_owner']),
    pool.query('SELECT * FROM restaurant_settings WHERE restaurant_id = ? LIMIT 1', [id]),
    pool.query('SELECT COUNT(id) as count FROM food_items WHERE restaurant_id = ?', [id]),
    pool.query('SELECT COUNT(id) as totalOrders, COALESCE(SUM(CASE WHEN order_status != "Cancelled" THEN amount ELSE 0 END), 0) as totalGMV FROM orders WHERE restaurant_id = ?', [id]),
    pool.query('SELECT AVG(rating) as avgRating, COUNT(id) as totalReviews FROM reviews WHERE restaurant_id = ? AND is_visible = TRUE', [id])
  ]);
  return { restaurant, owner: ownerRows[0] || null, settings: settingsRows[0] || null, prodCount: Number(prodCountRows[0]?.count || 0), orderStats: orderStatsRows[0] || {}, reviewStats: reviewStatsRows[0] || {} };
};

export const updateRestaurantStatusRepo = async (id, status) => {
  const pool = getPool();
  await pool.query('UPDATE restaurants SET status = ? WHERE id = ?', [status, id]);
};

export const findRestaurantById = async (id) => {
  const pool = getPool();
  const [rows] = await pool.query('SELECT id, name FROM restaurants WHERE id = ?', [id]);
  return rows[0] || null;
};

export const getPlatformUsersRepo = async ({ search, role, page, limit }) => {
  const pool = getPool();
  let whereConditions = []; let params = [];
  if (role && role !== 'all') { whereConditions.push('u.role = ?'); params.push(role); }
  if (search && search.trim() !== '') {
    const term = `%${search.trim()}%`;
    whereConditions.push('(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
    params.push(term, term, term);
  }
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;
  const [[countRows], [dataRows]] = await Promise.all([
    pool.query(`SELECT COUNT(u.id) as total FROM users u ${whereClause}`, params),
    pool.query(`SELECT u.id, u.name, u.email, u.phone, u.role, u.restaurant_id, u.is_active, u.created_at, r.name as restaurant_name, r.slug as restaurant_slug FROM users u LEFT JOIN restaurants r ON u.restaurant_id = r.id ${whereClause} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset])
  ]);
  return { totalCount: Number(countRows[0]?.total || 0), dataRows };
};

export const getPlatformOrdersRepo = async ({ search, status, page, limit }) => {
  const pool = getPool();
  let whereConditions = []; let params = [];
  if (status && status !== 'all') { whereConditions.push('o.order_status = ?'); params.push(status); }
  if (search && search.trim() !== '') {
    const term = `%${search.trim()}%`;
    whereConditions.push('(o.id LIKE ? OR o.first_name LIKE ? OR o.email LIKE ? OR r.name LIKE ?)');
    params.push(term, term, term, term);
  }
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;
  const [[countRows], [orders]] = await Promise.all([
    pool.query(`SELECT COUNT(o.id) as total FROM orders o LEFT JOIN restaurants r ON o.restaurant_id = r.id ${whereClause}`, params),
    pool.query(`SELECT o.*, r.name as restaurant_name, r.slug as restaurant_slug FROM orders o LEFT JOIN restaurants r ON o.restaurant_id = r.id ${whereClause} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset])
  ]);
  if (orders.length > 0) {
    const orderIds = orders.map(o => o.id);
    const pool2 = getPool();
    const [allItems] = await pool2.query('SELECT id, order_id, food_id, name, price, quantity FROM order_items WHERE order_id IN (?)', [orderIds]);
    const itemsByOrderId = {};
    for (const item of allItems) {
      if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
      itemsByOrderId[item.order_id].push(item);
    }
    for (const order of orders) order.items = itemsByOrderId[order.id] || [];
  }
  return { totalCount: Number(countRows[0]?.total || 0), orders };
};

export const getPlatformReviewsRepo = async ({ rating, search, page, limit }) => {
  const pool = getPool();
  let whereConditions = []; let params = [];
  if (rating && rating !== 'all') { whereConditions.push('rv.rating = ?'); params.push(Number(rating)); }
  if (search && search.trim() !== '') {
    const term = `%${search.trim()}%`;
    whereConditions.push('(rv.comment LIKE ? OR r.name LIKE ? OR f.name LIKE ? OR u.name LIKE ?)');
    params.push(term, term, term, term);
  }
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;
  const [[countRows], [rows]] = await Promise.all([
    pool.query(`SELECT COUNT(rv.id) as total FROM reviews rv LEFT JOIN restaurants r ON rv.restaurant_id = r.id LEFT JOIN food_items f ON (rv.food_id = f.id OR rv.product_id = f.id) LEFT JOIN users u ON rv.user_id = u.id ${whereClause}`, params),
    pool.query(`SELECT rv.*, r.name as restaurant_name, r.slug as restaurant_slug, f.name as food_name, u.name as user_name, u.email as user_email FROM reviews rv LEFT JOIN restaurants r ON rv.restaurant_id = r.id LEFT JOIN food_items f ON (rv.food_id = f.id OR rv.product_id = f.id) LEFT JOIN users u ON rv.user_id = u.id ${whereClause} ORDER BY rv.created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset])
  ]);
  return { totalCount: Number(countRows[0]?.total || 0), rows };
};

export const togglePlatformReviewVisibilityRepo = async (id) => {
  const pool = getPool();
  const [currentRows] = await pool.query('SELECT id, is_visible FROM reviews WHERE id = ?', [id]);
  if (currentRows.length === 0) return null;
  const newStatus = !Boolean(currentRows[0].is_visible);
  await pool.query('UPDATE reviews SET is_visible = ? WHERE id = ?', [newStatus ? 1 : 0, id]);
  return newStatus;
};

export const getPlatformAnalyticsRepo = async (dateFilter) => {
  const pool = getPool();
  const [[leaderboard], [timeline]] = await Promise.all([
    pool.query(`SELECT r.id, r.name, r.slug, r.status, COUNT(o.id) as totalOrders, COALESCE(SUM(CASE WHEN o.order_status != 'Cancelled' THEN o.amount ELSE 0 END), 0) as gmv FROM restaurants r LEFT JOIN orders o ON (o.restaurant_id = r.id ${dateFilter}) GROUP BY r.id ORDER BY gmv DESC LIMIT 15`),
    pool.query(`SELECT DATE(o.created_at) as date, COUNT(o.id) as ordersCount, COALESCE(SUM(CASE WHEN o.order_status != 'Cancelled' THEN o.amount ELSE 0 END), 0) as dailyGMV FROM orders o WHERE 1=1 ${dateFilter} GROUP BY DATE(o.created_at) ORDER BY date ASC`)
  ]);
  return { leaderboard, timeline };
};

export const getOnboardingStuckRepo = async () => {
  const pool = getPool();
  const [rows] = await pool.query(`SELECT r.id, r.name, r.slug, r.email, r.phone, r.onboarding_step, r.created_at, u.name as owner_name, u.email as owner_email, u.phone as owner_phone FROM restaurants r LEFT JOIN users u ON (u.restaurant_id = r.id AND u.role = 'restaurant_owner') WHERE r.onboarding_completed = FALSE OR r.status = 'setup' ORDER BY r.created_at DESC`);
  return rows;
};
