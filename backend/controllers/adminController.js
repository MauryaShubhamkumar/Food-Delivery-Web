import { querySafe } from '../config/db.js';

// Get Admin Dashboard Summary Statistics
export const getDashboardStats = async (req, res, next) => {
  try {
    const [productsResult] = await querySafe('SELECT COUNT(*) as count FROM food_items');
    const [ordersResult] = await querySafe('SELECT COUNT(*) as count FROM orders');
    const [customersResult] = await querySafe("SELECT COUNT(*) as count FROM users WHERE role = 'customer' OR role IS NULL");
    const [pendingOrdersResult] = await querySafe("SELECT COUNT(*) as count FROM orders WHERE status = 'Food Processing' OR status = 'Pending'");
    const [pendingPaymentsResult] = await querySafe("SELECT COUNT(*) as count FROM orders WHERE payment_status = 'verification_required'");

    const totalProducts = productsResult[0]?.count || 0;
    const totalOrders = ordersResult[0]?.count || 0;
    const totalCustomers = customersResult[0]?.count || 0;
    const pendingOrders = pendingOrdersResult[0]?.count || 0;
    const pendingPaymentVerifications = pendingPaymentsResult[0]?.count || 0;

    res.json({
      success: true,
      totalProducts,
      totalOrders,
      totalCustomers,
      pendingOrders,
      pendingPaymentVerifications
    });
  } catch (error) {
    next(error);
  }
};
