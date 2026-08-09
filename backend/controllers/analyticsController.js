import { querySafe } from '../config/db.js';

// Helper to format Date objects to YYYY-MM-DD
const formatDateStr = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Helper to format Date objects to DD MMM (e.g. 05 Aug)
const formatDateLabel = (dateObj) => {
  return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export const getAnalyticsData = async (req, res, next) => {
  try {
    const { period = '7d', startDate: customStart, endDate: customEnd } = req.query;

    let dateWhereOrders = '';
    let dateWhereUsers = '';
    const orderParams = [];
    const userParams = [];

    const now = new Date();
    let startDateObj = new Date();
    let endDateObj = new Date();

    if (period === 'today') {
      startDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateWhereOrders = 'WHERE o.created_at >= CURDATE()';
      dateWhereUsers = 'WHERE u.created_at >= CURDATE()';
    } else if (period === 'yesterday') {
      startDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      endDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      dateWhereOrders = 'WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND o.created_at < CURDATE()';
      dateWhereUsers = 'WHERE u.created_at >= DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND u.created_at < CURDATE()';
    } else if (period === '7d') {
      startDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      endDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateWhereOrders = 'WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)';
      dateWhereUsers = 'WHERE u.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)';
    } else if (period === '30d') {
      startDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      endDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateWhereOrders = 'WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)';
      dateWhereUsers = 'WHERE u.created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)';
    } else if (period === 'month') {
      startDateObj = new Date(now.getFullYear(), now.getMonth(), 1);
      endDateObj = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateWhereOrders = 'WHERE o.created_at >= DATE_FORMAT(NOW() ,"%Y-%m-01")';
      dateWhereUsers = 'WHERE u.created_at >= DATE_FORMAT(NOW() ,"%Y-%m-01")';
    } else if (period === 'custom' && customStart && customEnd) {
      const s = new Date(customStart);
      const e = new Date(customEnd);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        startDateObj = s;
        endDateObj = e;
        dateWhereOrders = 'WHERE o.created_at >= ? AND o.created_at <= ?';
        dateWhereUsers = 'WHERE u.created_at >= ? AND u.created_at <= ?';
        orderParams.push(`${formatDateStr(s)} 00:00:00`, `${formatDateStr(e)} 23:59:59`);
        userParams.push(`${formatDateStr(s)} 00:00:00`, `${formatDateStr(e)} 23:59:59`);
      } else {
        startDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        endDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateWhereOrders = 'WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)';
        dateWhereUsers = 'WHERE u.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)';
      }
    } else {
      startDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      endDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateWhereOrders = 'WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)';
      dateWhereUsers = 'WHERE u.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)';
    }

    const singleOrdersWhere = dateWhereOrders.replace(/o\./g, '');
    const singleUsersWhere = dateWhereUsers.replace(/u\./g, '');

    // Execute queries using querySafe (with auto single-retry on ECONNRESET connection drops)
    const [
      [todayRevRows],
      [summaryRows],
      [totalCustRows],
      [newCustRows],
      [repeatCustRows],
      [totalProdRows],
      [timelineRows],
      [statusRows],
      [bestSellerRows],
      [categoryRows],
      [recentOrderRows],
      [unavailableRows]
    ] = await Promise.all([
      // 1. Today's Revenue
      querySafe(`
        SELECT COALESCE(SUM(amount), 0) as todayRevenue 
        FROM orders 
        WHERE created_at >= CURDATE() AND status != 'Cancelled' AND payment_status NOT IN ('rejected', 'failed')
      `),

      // 2. Summary & Payment stats for selected period (Combined single-pass SQL)
      querySafe(`
        SELECT 
          COUNT(id) as totalOrders,
          COALESCE(SUM(CASE WHEN status != 'Cancelled' AND payment_status NOT IN ('rejected', 'failed') THEN amount ELSE 0 END), 0) as totalRevenue,
          COALESCE(SUM(CASE WHEN status != 'Cancelled' AND payment_status NOT IN ('rejected', 'failed') THEN 1 ELSE 0 END), 0) as validOrdersCount,
          COALESCE(SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END), 0) as completedOrders,
          COALESCE(SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END), 0) as cancelledOrders,
          COALESCE(SUM(CASE WHEN status IN ('Pending', 'Food Processing', 'Confirmed', 'Preparing') THEN 1 ELSE 0 END), 0) as pendingOrders,
          COALESCE(SUM(CASE WHEN payment_status = 'verification_required' THEN 1 ELSE 0 END), 0) as pendingVerificationCount,
          COALESCE(SUM(CASE WHEN payment_method = 'upi' AND status != 'Cancelled' AND payment_status NOT IN ('rejected', 'failed') THEN amount ELSE 0 END), 0) as upiRevenue,
          COALESCE(SUM(CASE WHEN payment_method = 'cod' AND status != 'Cancelled' AND payment_status NOT IN ('rejected', 'failed') THEN amount ELSE 0 END), 0) as codRevenue
        FROM orders ${singleOrdersWhere}
      `, orderParams),

      // 3. Customer metrics
      querySafe("SELECT COUNT(id) as totalCustomers FROM users WHERE role = 'customer'"),
      querySafe(`SELECT COUNT(id) as newCustomers FROM users ${singleUsersWhere} AND role = 'customer'`, userParams),
      querySafe(`
        SELECT COUNT(DISTINCT user_id) as repeatCustomers 
        FROM orders 
        WHERE status != 'Cancelled' AND user_id IN (
          SELECT user_id FROM orders WHERE status != 'Cancelled' GROUP BY user_id HAVING COUNT(id) > 1
        )
      `),

      // 4. Products total
      querySafe("SELECT COUNT(id) as count FROM food_items"),

      // 5. Timeline daily breakdown (Revenue & Orders)
      querySafe(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m-%d') as dateStr,
          DATE_FORMAT(created_at, '%d %b') as dateLabel,
          COALESCE(SUM(CASE WHEN status != 'Cancelled' AND payment_status NOT IN ('rejected', 'failed') THEN amount ELSE 0 END), 0) as revenue,
          COUNT(id) as orders
        FROM orders
        ${singleOrdersWhere}
        GROUP BY dateStr, dateLabel
        ORDER BY dateStr ASC
      `, orderParams),

      // 6. Orders status breakdown
      querySafe(`
        SELECT status, COUNT(id) as count
        FROM orders
        ${singleOrdersWhere}
        GROUP BY status
      `, orderParams),

      // 7. Top selling products
      querySafe(`
        SELECT 
          oi.name as name,
          COALESCE(f.category, 'General') as category,
          SUM(oi.quantity) as quantitySold,
          SUM(oi.price * oi.quantity) as totalRevenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        LEFT JOIN food_items f ON f.id = oi.food_id
        ${dateWhereOrders} AND o.status != 'Cancelled' AND o.payment_status NOT IN ('rejected', 'failed')
        GROUP BY oi.name, f.category
        ORDER BY quantitySold DESC
        LIMIT 10
      `, orderParams),

      // 8. Category Performance
      querySafe(`
        SELECT 
          c.name as category,
          COUNT(DISTINCT o.id) as totalOrders,
          COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
        FROM categories c
        LEFT JOIN food_items f ON (f.category_id = c.id OR f.category = c.name)
        LEFT JOIN order_items oi ON oi.food_id = f.id
        LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'Cancelled' AND o.payment_status NOT IN ('rejected', 'failed')
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
      `),

      // 9. Recent Orders
      querySafe(`
        SELECT id, first_name, last_name, amount, status, payment_method, payment_status, created_at
        FROM orders
        ORDER BY created_at DESC
        LIMIT 6
      `),

      // 10. Low stock / Unavailable products
      querySafe(`
        SELECT id, name, category, price, available
        FROM food_items
        WHERE available = FALSE OR available = 0
      `)
    ]);

    // Build continuous daily timeline with zero-filling for missing dates
    const timelineMap = new Map();
    for (const row of timelineRows) {
      timelineMap.set(row.dateStr, {
        date: row.dateStr,
        dateLabel: row.dateLabel,
        revenue: Number(row.revenue || 0),
        orders: Number(row.orders || 0)
      });
    }

    const continuousTimeline = [];
    const curr = new Date(startDateObj);
    const end = new Date(endDateObj);

    let iterations = 0;
    while (curr <= end && iterations < 370) {
      const dStr = formatDateStr(curr);
      const dLabel = formatDateLabel(curr);

      if (timelineMap.has(dStr)) {
        continuousTimeline.push(timelineMap.get(dStr));
      } else {
        continuousTimeline.push({
          date: dStr,
          dateLabel: dLabel,
          revenue: 0,
          orders: 0
        });
      }

      curr.setDate(curr.getDate() + 1);
      iterations++;
    }

    const sumData = summaryRows[0] || {};
    const totalRevenue = Number(sumData.totalRevenue || 0);
    const validOrdersCount = Number(sumData.validOrdersCount || 0);
    const avgOrderValue = validOrdersCount > 0 ? (totalRevenue / validOrdersCount) : 0;

    const summary = {
      todayRevenue: Number(todayRevRows[0]?.todayRevenue || 0),
      totalRevenue,
      totalOrders: Number(sumData.totalOrders || 0),
      completedOrders: Number(sumData.completedOrders || 0),
      pendingOrders: Number(sumData.pendingOrders || 0),
      cancelledOrders: Number(sumData.cancelledOrders || 0),
      avgOrderValue: Number(avgOrderValue.toFixed(2)),
      totalCustomers: Number(totalCustRows[0]?.totalCustomers || 0),
      newCustomers: Number(newCustRows[0]?.newCustomers || 0),
      repeatCustomers: Number(repeatCustRows[0]?.repeatCustomers || 0),
      totalProducts: Number(totalProdRows[0]?.count || 0),
      pendingPaymentVerifications: Number(sumData.pendingVerificationCount || 0),
      upiRevenue: Number(sumData.upiRevenue || 0),
      codRevenue: Number(sumData.codRevenue || 0)
    };

    res.json({
      success: true,
      period,
      startDate: formatDateStr(startDateObj),
      endDate: formatDateStr(endDateObj),
      data: {
        summary,
        timeline: continuousTimeline,
        ordersByStatus: statusRows.map(s => ({
          status: s.status,
          count: Number(s.count || 0)
        })),
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
