import { querySafe } from '../../config/db.js';

export const runAnalyticsQueries = async (tenantId, orderParams, singleOrdersWhere, dateWhereOrders) => {
  const [
    [todayRevRows], [summaryRows], [totalCustRows], [newCustRows], [repeatCustRows],
    [totalProdRows], [timelineRows], [statusRows], [bestSellerRows], [categoryRows],
    [recentOrderRows], [unavailableRows]
  ] = await Promise.all([
    querySafe(`SELECT COALESCE(SUM(amount), 0) as todayRevenue FROM orders WHERE restaurant_id = ? AND created_at >= CURDATE() AND status != 'Cancelled' AND payment_status NOT IN ('rejected', 'failed')`, [tenantId]),
    querySafe(`SELECT COUNT(id) as totalOrders, COALESCE(SUM(CASE WHEN status != 'Cancelled' AND payment_status NOT IN ('rejected', 'failed') THEN amount ELSE 0 END), 0) as totalRevenue, COALESCE(SUM(CASE WHEN status != 'Cancelled' AND payment_status NOT IN ('rejected', 'failed') THEN 1 ELSE 0 END), 0) as validOrdersCount, COALESCE(SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END), 0) as completedOrders, COALESCE(SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END), 0) as cancelledOrders, COALESCE(SUM(CASE WHEN status IN ('Pending', 'Food Processing', 'Confirmed', 'Preparing') THEN 1 ELSE 0 END), 0) as pendingOrders, COALESCE(SUM(CASE WHEN payment_status = 'verification_required' THEN 1 ELSE 0 END), 0) as pendingVerificationCount, COALESCE(SUM(CASE WHEN payment_method = 'upi' AND status != 'Cancelled' AND payment_status NOT IN ('rejected', 'failed') THEN amount ELSE 0 END), 0) as upiRevenue, COALESCE(SUM(CASE WHEN payment_method = 'cod' AND status != 'Cancelled' AND payment_status NOT IN ('rejected', 'failed') THEN amount ELSE 0 END), 0) as codRevenue FROM orders ${singleOrdersWhere}`, orderParams),
    querySafe("SELECT COUNT(DISTINCT user_id) as totalCustomers FROM orders WHERE restaurant_id = ?", [tenantId]),
    querySafe(`SELECT COUNT(DISTINCT user_id) as newCustomers FROM orders ${singleOrdersWhere}`, orderParams),
    querySafe(`SELECT COUNT(DISTINCT user_id) as repeatCustomers FROM orders WHERE restaurant_id = ? AND status != 'Cancelled' AND user_id IN (SELECT user_id FROM orders WHERE restaurant_id = ? AND status != 'Cancelled' GROUP BY user_id HAVING COUNT(id) > 1)`, [tenantId, tenantId]),
    querySafe("SELECT COUNT(id) as count FROM food_items WHERE restaurant_id = ?", [tenantId]),
    querySafe(`SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as dateStr, DATE_FORMAT(created_at, '%d %b') as dateLabel, COALESCE(SUM(CASE WHEN status != 'Cancelled' AND payment_status NOT IN ('rejected', 'failed') THEN amount ELSE 0 END), 0) as revenue, COUNT(id) as orders FROM orders ${singleOrdersWhere} GROUP BY dateStr, dateLabel ORDER BY dateStr ASC`, orderParams),
    querySafe(`SELECT status, COUNT(id) as count FROM orders ${singleOrdersWhere} GROUP BY status`, orderParams),
    querySafe(`SELECT oi.name as name, COALESCE(f.category, 'General') as category, SUM(oi.quantity) as quantitySold, SUM(oi.price * oi.quantity) as totalRevenue FROM order_items oi JOIN orders o ON o.id = oi.order_id LEFT JOIN food_items f ON f.id = oi.food_id ${dateWhereOrders} AND o.status != 'Cancelled' AND o.payment_status NOT IN ('rejected', 'failed') GROUP BY oi.name, f.category ORDER BY quantitySold DESC LIMIT 10`, orderParams),
    querySafe(`SELECT c.name as category, COUNT(DISTINCT o.id) as totalOrders, COALESCE(SUM(oi.price * oi.quantity), 0) as revenue FROM categories c LEFT JOIN food_items f ON (f.category_id = c.id OR f.category = c.name) AND f.restaurant_id = c.restaurant_id LEFT JOIN order_items oi ON oi.food_id = f.id LEFT JOIN orders o ON o.id = oi.order_id AND o.restaurant_id = c.restaurant_id AND o.status != 'Cancelled' AND o.payment_status NOT IN ('rejected', 'failed') WHERE c.restaurant_id = ? GROUP BY c.id, c.name ORDER BY revenue DESC`, [tenantId]),
    querySafe(`SELECT id, first_name, last_name, amount, status, payment_method, payment_status, created_at FROM orders WHERE restaurant_id = ? ORDER BY created_at DESC LIMIT 6`, [tenantId]),
    querySafe(`SELECT id, name, category, price, available FROM food_items WHERE restaurant_id = ? AND (available = FALSE OR available = 0)`, [tenantId])
  ]);
  return { todayRevRows, summaryRows, totalCustRows, newCustRows, repeatCustRows, totalProdRows, timelineRows, statusRows, bestSellerRows, categoryRows, recentOrderRows, unavailableRows };
};
