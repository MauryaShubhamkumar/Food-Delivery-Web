import { runAnalyticsQueries } from './analytics.repository.js';

const formatDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const formatDateLabel = (d) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

export const getAnalyticsDataService = async (tenantId, { period = '7d', startDate: customStart, endDate: customEnd }) => {
  let dateWhereOrders = '';
  const orderParams = [tenantId];
  const now = new Date();
  let startDateObj = new Date(); let endDateObj = new Date();
  if (period === 'today') {
    startDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    endDateObj = new Date(startDateObj);
    dateWhereOrders = 'WHERE o.restaurant_id = ? AND o.created_at >= CURDATE()';
  } else if (period === 'yesterday') {
    startDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate()-1);
    endDateObj = new Date(startDateObj);
    dateWhereOrders = 'WHERE o.restaurant_id = ? AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND o.created_at < CURDATE()';
  } else if (period === '7d') {
    startDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate()-6);
    endDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    dateWhereOrders = 'WHERE o.restaurant_id = ? AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)';
  } else if (period === '30d') {
    startDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate()-29);
    endDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    dateWhereOrders = 'WHERE o.restaurant_id = ? AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)';
  } else if (period === 'month') {
    startDateObj = new Date(now.getFullYear(), now.getMonth(), 1);
    endDateObj = new Date(now.getFullYear(), now.getMonth()+1, 0);
    dateWhereOrders = 'WHERE o.restaurant_id = ? AND o.created_at >= DATE_FORMAT(NOW() ,"%Y-%m-01")';
  } else if (period === 'custom' && customStart && customEnd) {
    const s = new Date(customStart); const e = new Date(customEnd);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      startDateObj = s; endDateObj = e;
      dateWhereOrders = 'WHERE o.restaurant_id = ? AND o.created_at >= ? AND o.created_at <= ?';
      orderParams.push(`${formatDateStr(s)} 00:00:00`, `${formatDateStr(e)} 23:59:59`);
    } else {
      startDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate()-6);
      endDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateWhereOrders = 'WHERE o.restaurant_id = ? AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)';
    }
  } else {
    startDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate()-6);
    endDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    dateWhereOrders = 'WHERE o.restaurant_id = ? AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)';
  }
  const singleOrdersWhere = dateWhereOrders.replace(/o\./g, '');
  const { todayRevRows, summaryRows, totalCustRows, newCustRows, repeatCustRows, totalProdRows, timelineRows, statusRows, bestSellerRows, categoryRows, recentOrderRows, unavailableRows } = await runAnalyticsQueries(tenantId, orderParams, singleOrdersWhere, dateWhereOrders);
  const timelineMap = new Map();
  for (const row of timelineRows) timelineMap.set(row.dateStr, { date: row.dateStr, dateLabel: row.dateLabel, revenue: Number(row.revenue || 0), orders: Number(row.orders || 0) });
  const continuousTimeline = [];
  const curr = new Date(startDateObj); const endD = new Date(endDateObj);
  let iterations = 0;
  while (curr <= endD && iterations < 370) {
    const dStr = formatDateStr(curr); const dLabel = formatDateLabel(curr);
    continuousTimeline.push(timelineMap.has(dStr) ? timelineMap.get(dStr) : { date: dStr, dateLabel: dLabel, revenue: 0, orders: 0 });
    curr.setDate(curr.getDate() + 1); iterations++;
  }
  const sumData = summaryRows[0] || {};
  const totalRevenue = Number(sumData.totalRevenue || 0);
  const validOrdersCount = Number(sumData.validOrdersCount || 0);
  const avgOrderValue = validOrdersCount > 0 ? (totalRevenue / validOrdersCount) : 0;
  return {
    period, startDate: formatDateStr(startDateObj), endDate: formatDateStr(endDateObj),
    data: {
      summary: { todayRevenue: Number(todayRevRows[0]?.todayRevenue || 0), totalRevenue, totalOrders: Number(sumData.totalOrders || 0), completedOrders: Number(sumData.completedOrders || 0), pendingOrders: Number(sumData.pendingOrders || 0), cancelledOrders: Number(sumData.cancelledOrders || 0), avgOrderValue: Number(avgOrderValue.toFixed(2)), totalCustomers: Number(totalCustRows[0]?.totalCustomers || 0), newCustomers: Number(newCustRows[0]?.newCustomers || 0), repeatCustomers: Number(repeatCustRows[0]?.repeatCustomers || 0), totalProducts: Number(totalProdRows[0]?.count || 0), pendingPaymentVerifications: Number(sumData.pendingVerificationCount || 0), upiRevenue: Number(sumData.upiRevenue || 0), codRevenue: Number(sumData.codRevenue || 0) },
      timeline: continuousTimeline,
      ordersByStatus: statusRows.map(s => ({ status: s.status, count: Number(s.count || 0) })),
      bestSellingProducts: bestSellerRows.map(b => ({ ...b, quantitySold: Number(b.quantitySold || 0), totalRevenue: Number(b.totalRevenue || 0) })),
      categoryPerformance: categoryRows.map(c => ({ ...c, totalOrders: Number(c.totalOrders || 0), revenue: Number(c.revenue || 0) })),
      recentOrders: recentOrderRows,
      lowStockAlerts: unavailableRows
    }
  };
};
