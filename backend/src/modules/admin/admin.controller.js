import { querySafe } from '../../config/db.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const tenantId = req.restaurantId || 1;
    const [[productsResult], [ordersResult], [customersResult], [pendingOrdersResult], [pendingPaymentsResult]] = await Promise.all([
      querySafe('SELECT COUNT(*) as count FROM food_items WHERE restaurant_id = ?', [tenantId]),
      querySafe('SELECT COUNT(*) as count FROM orders WHERE restaurant_id = ?', [tenantId]),
      querySafe('SELECT COUNT(DISTINCT user_id) as count FROM orders WHERE restaurant_id = ?', [tenantId]),
      querySafe("SELECT COUNT(*) as count FROM orders WHERE restaurant_id = ? AND (status = 'Food Processing' OR status = 'Pending' OR status = 'Preparing' OR status = 'Confirmed')", [tenantId]),
      querySafe("SELECT COUNT(*) as count FROM orders WHERE restaurant_id = ? AND payment_status = 'verification_required'", [tenantId])
    ]);
    res.json({ success: true, totalProducts: productsResult[0]?.count || 0, totalOrders: ordersResult[0]?.count || 0, totalCustomers: customersResult[0]?.count || 0, pendingOrders: pendingOrdersResult[0]?.count || 0, pendingPaymentVerifications: pendingPaymentsResult[0]?.count || 0 });
  } catch (error) { next(error); }
};
