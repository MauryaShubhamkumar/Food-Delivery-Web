import { getPool } from '../config/db.js';

export const getAnalyticsData = async (req, res, next) => {
  try {
    const { period } = req.query; // 'today', '7d', '30d', 'month', 'year'
    const pool = getPool();

    let dateCondition = "WHERE 1=1";
    const params = [];

    if (period === 'today') {
      dateCondition = "WHERE created_at >= CURDATE()";
    } else if (period === '7d') {
      dateCondition = "WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    } else if (period === '30d') {
      dateCondition = "WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    } else if (period === 'month') {
      dateCondition = "WHERE created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')";
    } else if (period === 'year') {
      dateCondition = "WHERE created_at >= DATE_FORMAT(NOW(), '%Y-01-01')";
    } else {
      // Default to last 30 days if unspecified
      dateCondition = "WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    }

    // 1. Overall Summary Cards
    const [revRows] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as totalRevenue, COUNT(id) as totalOrders FROM orders ${dateCondition} AND status != 'Cancelled'`
    );
    const [allOrdersCount] = await pool.query(`SELECT COUNT(id) as count FROM orders ${dateCondition}`);
    const [custRows] = await pool.query("SELECT COUNT(id) as count FROM users WHERE role = 'customer'");
    const [prodRows] = await pool.query("SELECT COUNT(id) as count FROM food_items");
    const [pendingRows] = await pool.query("SELECT COUNT(id) as count FROM orders WHERE status = 'Pending' OR status = 'Food Processing'");

    const totalRevenue = Number(revRows[0].totalRevenue || 0);
    const totalValidOrders = Number(revRows[0].totalOrders || 0);
    const totalOrdersPeriod = Number(allOrdersCount[0].count || 0);
    const avgOrderValue = totalValidOrders > 0 ? (totalRevenue / totalValidOrders) : 0;

    const summary = {
      totalRevenue,
      totalOrders: totalOrdersPeriod,
      totalCustomers: Number(custRows[0].count || 0),
      totalProducts: Number(prodRows[0].count || 0),
      pendingOrders: Number(pendingRows[0].count || 0),
      avgOrderValue: Number(avgOrderValue.toFixed(2))
    };

    // 2. Revenue Over Time (Daily timeline)
    const [timeSeriesRows] = await pool.query(`
      SELECT 
        DATE_FORMAT(created_at, '%d %b') as dateLabel,
        DATE(created_at) as rawDate,
        COALESCE(SUM(CASE WHEN status != 'Cancelled' THEN amount ELSE 0 END), 0) as revenue,
        COUNT(id) as orders
      FROM orders
      ${dateCondition}
      GROUP BY rawDate, dateLabel
      ORDER BY rawDate ASC
    `);

    // 3. Orders by Status
    const [statusRows] = await pool.query(`
      SELECT status, COUNT(id) as count
      FROM orders
      ${dateCondition}
      GROUP BY status
    `);

    // 4. Best Selling Products
    const [bestSellerRows] = await pool.query(`
      SELECT 
        oi.name as name,
        f.category as category,
        SUM(oi.quantity) as quantitySold,
        SUM(oi.price * oi.quantity) as totalRevenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN food_items f ON f.id = oi.food_id
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY) AND o.status != 'Cancelled'
      GROUP BY oi.name, f.category
      ORDER BY quantitySold DESC
      LIMIT 8
    `);

    // 5. Category Performance
    const [categoryRows] = await pool.query(`
      SELECT 
        c.name as category,
        COUNT(DISTINCT o.id) as totalOrders,
        COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
      FROM categories c
      LEFT JOIN food_items f ON (f.category_id = c.id OR f.category = c.name)
      LEFT JOIN order_items oi ON oi.food_id = f.id
      LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'Cancelled'
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `);

    // 6. Recent Orders (Latest 6)
    const [recentOrderRows] = await pool.query(`
      SELECT id, first_name, last_name, amount, status, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 6
    `);

    // 7. Low Stock / Unavailable Alerts
    const [unavailableRows] = await pool.query(`
      SELECT id, name, category, price, available
      FROM food_items
      WHERE available = FALSE OR available = 0
    `);

    res.json({
      success: true,
      period: period || '30d',
      data: {
        summary,
        revenueOverTime: timeSeriesRows,
        ordersByStatus: statusRows,
        bestSellingProducts: bestSellerRows.map(b => ({
          ...b,
          quantitySold: Number(b.quantitySold || 0),
          totalRevenue: Number(b.totalRevenue || 0)
        })),
        categoryPerformance: categoryRows.map(c => ({
          ...c,
          totalOrders: Number(c.totalOrders || 0),
          revenue: Number(c.revenue || 0)
        })),
        recentOrders: recentOrderRows,
        lowStockAlerts: unavailableRows
      }
    });
  } catch (error) {
    next(error);
  }
};
