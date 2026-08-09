import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import {
  Calendar,
  RefreshCw,
  Zap,
  TrendingUp,
  ShoppingBag,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  QrCode,
  UtensilsCrossed,
  AlertTriangle,
  Flame,
  ArrowRight,
  UserCheck,
  UserPlus,
  CreditCard,
  Banknote,
  Search
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import './AdminAnalytics.css';

const PERIOD_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'This Month', value: 'month' },
  { label: 'Custom Range', value: 'custom' }
];

const STATUS_COLOR_PALETTE = {
  'Pending': '#f97316',
  'Food Processing': '#f97316',
  'Confirmed': '#3b82f6',
  'Preparing': '#eab308',
  'Out for Delivery': '#8b5cf6',
  'Delivered': '#22c55e',
  'Cancelled': '#ef4444'
};

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

const AdminAnalytics = () => {
  const { url, token, formatCurrency } = useContext(StoreContext);
  const navigate = useNavigate();

  const [period, setPeriod] = useState('7d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      let queryUrl = `${url}/api/admin/analytics?period=${period}`;
      if (period === 'custom') {
        if (!startDate || !endDate) {
          setError('Please select both Start Date and End Date for custom filter');
          setLoading(false);
          return;
        }
        queryUrl += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await fetch(queryUrl, {
        headers: { token }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setAnalyticsData(data.data);
      } else {
        setError(data.message || 'Failed to load restaurant analytics');
      }
    } catch (err) {
      setError('Network connection error while fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && period !== 'custom') {
      fetchAnalytics();
    }
  }, [token, period]);

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (token) {
      fetchAnalytics();
    }
  };

  const summary = analyticsData?.summary || {
    todayRevenue: 0,
    totalRevenue: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    avgOrderValue: 0,
    totalCustomers: 0,
    newCustomers: 0,
    repeatCustomers: 0,
    pendingPaymentVerifications: 0,
    upiRevenue: 0,
    codRevenue: 0
  };

  const timelineData = analyticsData?.timeline || [];
  const ordersByStatus = analyticsData?.ordersByStatus || [];
  const bestSellingProducts = analyticsData?.bestSellingProducts || [];

  // Pie chart data for Order Statuses
  const statusPieData = ordersByStatus.map(item => ({
    name: item.status,
    value: Number(item.count || 0),
    color: STATUS_COLOR_PALETTE[item.status] || '#6b7280'
  })).filter(item => item.value > 0);

  // Payment Breakdown Pie Data
  const paymentPieData = [
    { name: 'UPI Online', value: summary.upiRevenue, color: '#8b5cf6' },
    { name: 'Cash on Delivery', value: summary.codRevenue, color: '#10b981' }
  ].filter(p => p.value > 0);

  return (
    <div className="admin-analytics-container">
      {/* Top Header */}
      <div className="analytics-top-header">
        <div>
          <h1 className="analytics-title">Business Analytics & Insights</h1>
          <p className="analytics-subtitle">Real-time sales performance, revenue trends, customer metrics & menu statistics.</p>
        </div>

        <div className="analytics-header-controls">
          <button className="refresh-analytics-btn" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> {loading ? 'Updating...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="analytics-filter-card">
        <div className="filter-left-section">
          <span className="filter-label">
            <Calendar size={16} /> Date Range:
          </span>
          <div className="filter-chips">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.value}
                className={`filter-chip ${period === p.value ? 'active' : ''}`}
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {period === 'custom' && (
          <form className="custom-range-form" onSubmit={handleCustomSubmit}>
            <div className="date-input-group">
              <label htmlFor="startDate">From:</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="date-input-group">
              <label htmlFor="endDate">To:</label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-apply-filter" disabled={loading}>
              Apply Filter
            </button>
          </form>
        )}
      </div>

      {/* Error Alert */}
      {error ? (
        <div className="alert-banner alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
          <button className="btn-retry" onClick={fetchAnalytics}>Retry</button>
        </div>
      ) : null}

      {/* Loading Skeletons */}
      {loading ? (
        <div className="analytics-loading-wrapper">
          <div className="loading-spinner"></div>
          <p>Loading real-time restaurant analytics...</p>
        </div>
      ) : (
        <>
          {/* Summary Stat Cards Grid */}
          <div className="analytics-cards-grid">
            {/* Today's Revenue */}
            <div className="analytics-stat-card card-highlight-gold">
              <div className="card-top-row">
                <span className="stat-card-label">Today's Revenue</span>
                <div className="stat-icon-wrapper gold-bg"><DollarSign size={20} /></div>
              </div>
              <h2 className="stat-card-value">₹{summary.todayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
              <span className="stat-card-subtext">Completed / non-cancelled today</span>
            </div>

            {/* Selected Period Revenue */}
            <div className="analytics-stat-card card-revenue">
              <div className="card-top-row">
                <span className="stat-card-label">Period Revenue</span>
                <div className="stat-icon-wrapper green-bg"><TrendingUp size={20} /></div>
              </div>
              <h2 className="stat-card-value">₹{summary.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
              <span className="stat-card-subtext">Valid orders in selected range</span>
            </div>

            {/* Total Orders */}
            <div className="analytics-stat-card card-orders">
              <div className="card-top-row">
                <span className="stat-card-label">Total Orders</span>
                <div className="stat-icon-wrapper blue-bg"><ShoppingBag size={20} /></div>
              </div>
              <h2 className="stat-card-value">{summary.totalOrders}</h2>
              <span className="stat-card-subtext">Placed in timeframe</span>
            </div>

            {/* Average Order Value (AOV) */}
            <div className="analytics-stat-card card-aov">
              <div className="card-top-row">
                <span className="stat-card-label">Avg Order Value (AOV)</span>
                <div className="stat-icon-wrapper purple-bg"><Zap size={20} /></div>
              </div>
              <h2 className="stat-card-value">₹{summary.avgOrderValue.toFixed(2)}</h2>
              <span className="stat-card-subtext">Revenue per valid order</span>
            </div>

            {/* Completed Orders */}
            <div className="analytics-stat-card card-completed">
              <div className="card-top-row">
                <span className="stat-card-label">Completed / Delivered</span>
                <div className="stat-icon-wrapper teal-bg"><CheckCircle2 size={20} /></div>
              </div>
              <h2 className="stat-card-value">{summary.completedOrders}</h2>
              <span className="stat-card-subtext">Delivered orders</span>
            </div>

            {/* Pending Kitchen Orders */}
            <div
              className="analytics-stat-card card-pending clickable-card"
              onClick={() => navigate('/admin/orders')}
            >
              <div className="card-top-row">
                <span className="stat-card-label">Pending Orders</span>
                <div className="stat-icon-wrapper orange-bg"><Clock size={20} /></div>
              </div>
              <h2 className="stat-card-value text-orange">{summary.pendingOrders}</h2>
              <span className="stat-card-subtext">Requires kitchen action &rarr;</span>
            </div>

            {/* Cancelled Orders */}
            <div className="analytics-stat-card card-cancelled">
              <div className="card-top-row">
                <span className="stat-card-label">Cancelled Orders</span>
                <div className="stat-icon-wrapper red-bg"><XCircle size={20} /></div>
              </div>
              <h2 className="stat-card-value text-red">{summary.cancelledOrders}</h2>
              <span className="stat-card-subtext">Excluded from revenue</span>
            </div>

            {/* Pending Payment Verification */}
            <div
              className="analytics-stat-card card-upi clickable-card"
              onClick={() => navigate('/admin/orders')}
            >
              <div className="card-top-row">
                <span className="stat-card-label">Pending UPI Verification</span>
                <div className="stat-icon-wrapper indigo-bg"><QrCode size={20} /></div>
              </div>
              <h2 className="stat-card-value text-indigo">{summary.pendingPaymentVerifications}</h2>
              <span className="stat-card-subtext">Requires admin verification &rarr;</span>
            </div>
          </div>

          {/* Charts Section */}
          <div className="analytics-charts-grid">
            {/* Revenue Trend Area Chart */}
            <div className="analytics-card chart-card">
              <div className="chart-card-header">
                <h3><TrendingUp size={18} color="#10b981" /> Daily Revenue Trend</h3>
                <span className="chart-legend-pill">₹ Non-cancelled Orders</span>
              </div>
              {timelineData.length === 0 ? (
                <div className="chart-empty-state">No sales data recorded for this period.</div>
              ) : (
                <div className="chart-container-box">
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={timelineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                      <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip
                        formatter={(val) => [`₹${Number(val).toFixed(2)}`, 'Revenue']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Orders Trend Bar Chart */}
            <div className="analytics-card chart-card">
              <div className="chart-card-header">
                <h3><ShoppingBag size={18} color="#3b82f6" /> Daily Orders Trend</h3>
                <span className="chart-legend-pill blue-pill">Order Count</span>
              </div>
              {timelineData.length === 0 ? (
                <div className="chart-empty-state">No order volume recorded for this period.</div>
              ) : (
                <div className="chart-container-box">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={timelineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                      <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip
                        formatter={(val) => [`${val} orders`, 'Volume']}
                      />
                      <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Middle Section: Status Breakdown & Payment / Customer Insights */}
          <div className="analytics-middle-grid">
            {/* Order Status Pie Breakdown */}
            <div className="analytics-card">
              <h3 className="section-card-title"><Clock size={18} /> Order Status Distribution</h3>
              {statusPieData.length === 0 ? (
                <div className="chart-empty-state">No status data available.</div>
              ) : (
                <div className="pie-chart-wrapper">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => [`${val} orders`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Payment Summary */}
            <div className="analytics-card">
              <h3 className="section-card-title"><CreditCard size={18} /> Payment Methods Summary</h3>
              <div className="payment-summary-box">
                <div className="payment-method-row">
                  <div className="pm-info">
                    <div className="pm-icon purple-bg"><QrCode size={18} /></div>
                    <div>
                      <div className="pm-title">UPI Online Transfer</div>
                      <span className="pm-subtext">Verified digital payments</span>
                    </div>
                  </div>
                  <div className="pm-value">₹{summary.upiRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>

                <div className="payment-method-row">
                  <div className="pm-info">
                    <div className="pm-icon green-bg"><Banknote size={18} /></div>
                    <div>
                      <div className="pm-title">Cash on Delivery (COD)</div>
                      <span className="pm-subtext">Cash collected on delivery</span>
                    </div>
                  </div>
                  <div className="pm-value">₹{summary.codRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                </div>

                <div className="payment-method-row highlight-pending-row" onClick={() => navigate('/admin/orders')}>
                  <div className="pm-info">
                    <div className="pm-icon orange-bg"><Clock size={18} /></div>
                    <div>
                      <div className="pm-title">Pending Payment Verifications</div>
                      <span className="pm-subtext">Awaiting admin review</span>
                    </div>
                  </div>
                  <div className="pm-badge-count">{summary.pendingPaymentVerifications} orders</div>
                </div>
              </div>
            </div>

            {/* Customer Metrics */}
            <div className="analytics-card">
              <h3 className="section-card-title"><Users size={18} /> Customer Statistics</h3>
              <div className="customer-stats-list">
                <div className="cust-stat-item">
                  <div className="cust-icon blue-bg"><Users size={18} /></div>
                  <div>
                    <span className="cust-label">Total Accounts</span>
                    <h3 className="cust-val">{summary.totalCustomers}</h3>
                  </div>
                </div>

                <div className="cust-stat-item">
                  <div className="cust-icon teal-bg"><UserPlus size={18} /></div>
                  <div>
                    <span className="cust-label">New Accounts (In Period)</span>
                    <h3 className="cust-val">{summary.newCustomers}</h3>
                  </div>
                </div>

                <div className="cust-stat-item">
                  <div className="cust-icon purple-bg"><UserCheck size={18} /></div>
                  <div>
                    <span className="cust-label">Repeat Customers</span>
                    <h3 className="cust-val">{summary.repeatCustomers}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Selling Products Section */}
          <div className="analytics-card top-products-card">
            <div className="card-header-row">
              <h3><Flame size={18} color="#f97316" /> Top Selling Food Products</h3>
              <button className="link-btn" onClick={() => navigate('/admin/products')}>View Menu &rarr;</button>
            </div>

            {bestSellingProducts.length === 0 ? (
              <div className="chart-empty-state">No sales data recorded for this period.</div>
            ) : (
              <div className="table-responsive-box">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Quantity Sold</th>
                      <th>Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bestSellingProducts.map((item, idx) => (
                      <tr key={idx}>
                        <td><span className={`rank-badge rank-${idx + 1}`}>#{idx + 1}</span></td>
                        <td className="product-cell">
                          <Flame size={14} color="#f97316" /> <strong>{item.name}</strong>
                        </td>
                        <td><span className="category-tag">{item.category}</span></td>
                        <td><strong>{item.quantitySold}</strong> units</td>
                        <td className="amount-cell">₹{Number(item.totalRevenue).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;
