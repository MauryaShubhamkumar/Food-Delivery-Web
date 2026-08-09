import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import ProductModal from './ProductModal';
import OrderDetailsModal from './OrderDetailsModal';
import {
  Calendar,
  RefreshCw,
  Zap,
  Plus,
  FolderPlus,
  Tag,
  Package,
  QrCode,
  Users,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  UtensilsCrossed,
  Clock,
  BarChart3,
  Star,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Eye,
  ArrowRight
} from 'lucide-react';
import './AdminDashboard.css';

const PERIOD_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' }
];

const AdminDashboard = () => {
  const { url, token, user } = useContext(StoreContext);
  const navigate = useNavigate();

  const [period, setPeriod] = useState('30d');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Quick Action Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${url}/api/admin/analytics?period=${period}`, {
        headers: { token }
      });
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      } else {
        setError(data.message || 'Failed to load restaurant analytics');
      }
    } catch (err) {
      setError('Network error while loading analytics dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [token, period]);

  const handleSaveProduct = async (productData) => {
    const response = await fetch(`${url}/api/admin/products`, {
      method: 'POST',
      headers: { token },
      body: productData
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to create product');
    }
    await fetchAnalytics();
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    const response = await fetch(`${url}/api/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        token: token
      },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to update order status');
    }
    setSelectedOrder(data.data);
    await fetchAnalytics();
  };

  const summary = analytics?.summary || {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    pendingPaymentVerifications: 0,
    avgOrderValue: 0
  };

  const maxRevenue = analytics?.revenueOverTime?.length > 0
    ? Math.max(...analytics.revenueOverTime.map(r => Number(r.revenue)))
    : 1;

  return (
    <div className="admin-dashboard-container">
      {/* Top Header */}
      <div className="dashboard-top-header">
        <div>
          <h1 className="dashboard-title">Restaurant Management Analytics</h1>
          <p className="dashboard-subtitle">Real-time performance metrics, orders, revenue trends & menu insights.</p>
        </div>

        <div className="header-controls">
          <div className="period-filter-wrapper">
            <label htmlFor="period-select" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={15} /> Timeframe:
            </label>
            <select
              id="period-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="period-dropdown"
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <button className="refresh-analytics-btn" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} /> {loading ? 'Updating...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {error ? <div className="alert-banner alert-error"><AlertTriangle size={16} /> {error}</div> : null}

      {/* Quick Actions Bar */}
      <div className="quick-actions-bar">
        <span className="quick-actions-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Zap size={15} /> Quick Actions:
        </span>
        <button className="action-chip" onClick={() => setIsProductModalOpen(true)}>
          <Plus size={14} /> Add Product
        </button>
        <button className="action-chip" onClick={() => navigate('/admin/categories')}>
          <FolderPlus size={14} /> Add Category
        </button>
        <button className="action-chip" onClick={() => navigate('/admin/coupons')}>
          <Tag size={14} /> Create Coupon
        </button>
        <button className="action-chip highlight-chip" onClick={() => navigate('/admin/orders')}>
          <Package size={14} /> View Pending Orders ({summary.pendingOrders})
        </button>
        <button className="action-chip upi-chip" onClick={() => navigate('/admin/orders')}>
          <QrCode size={14} /> Pending Payments ({summary.pendingPaymentVerifications || 0})
        </button>
        <button className="action-chip" onClick={() => navigate('/admin/users')}>
          <Users size={14} /> View Customers
        </button>
      </div>

      {/* Summary Cards Grid */}
      <div className="summary-cards-grid">
        <div className="stat-card card-revenue">
          <div className="card-icon"><DollarSign size={22} /></div>
          <div className="card-content">
            <span className="card-label">Total Revenue</span>
            <h2 className="card-value">₹{summary.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
            <span className="card-subtext">Non-cancelled orders</span>
          </div>
        </div>

        <div className="stat-card card-orders">
          <div className="card-icon"><ShoppingBag size={22} /></div>
          <div className="card-content">
            <span className="card-label">Total Orders</span>
            <h2 className="card-value">{summary.totalOrders}</h2>
            <span className="card-subtext">Placements in timeframe</span>
          </div>
        </div>

        <div className="stat-card card-aov">
          <div className="card-icon"><TrendingUp size={22} /></div>
          <div className="card-content">
            <span className="card-label">Avg Order Value (AOV)</span>
            <h2 className="card-value">₹{summary.avgOrderValue.toFixed(2)}</h2>
            <span className="card-subtext">Average per order</span>
          </div>
        </div>

        <div className="stat-card card-customers">
          <div className="card-icon"><Users size={22} /></div>
          <div className="card-content">
            <span className="card-label">Registered Customers</span>
            <h2 className="card-value">{summary.totalCustomers}</h2>
            <span className="card-subtext">Total active accounts</span>
          </div>
        </div>

        <div className="stat-card card-products">
          <div className="card-icon"><UtensilsCrossed size={22} /></div>
          <div className="card-content">
            <span className="card-label">Total Menu Products</span>
            <h2 className="card-value">{summary.totalProducts}</h2>
            <span className="card-subtext">Active food items</span>
          </div>
        </div>

        <div className="stat-card card-pending" onClick={() => navigate('/admin/orders')} style={{ cursor: 'pointer' }}>
          <div className="card-icon"><Clock size={22} /></div>
          <div className="card-content">
            <span className="card-label">Pending Orders</span>
            <h2 className="card-value urgent">{summary.pendingOrders}</h2>
            <span className="card-subtext">Requires kitchen action</span>
          </div>
        </div>

        <div className="stat-card card-upi-verify" onClick={() => navigate('/admin/orders')} style={{ cursor: 'pointer' }}>
          <div className="card-icon"><QrCode size={22} /></div>
          <div className="card-content">
            <span className="card-label">Pending Payment Verification</span>
            <h2 className="card-value urgent-yellow">{summary.pendingPaymentVerifications || 0}</h2>
            <span className="card-subtext">Payments awaiting verification &rarr;</span>
          </div>
        </div>
      </div>

      {/* Visual Charts & Performance Section */}
      <div className="dashboard-charts-grid">
        {/* Revenue Over Time Chart */}
        <div className="dashboard-card chart-card">
          <div className="card-header-row">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={18} /> Revenue Trend ({PERIOD_OPTIONS.find(p => p.value === period)?.label})
            </h3>
            <span className="chart-legend">₹ Total Daily Sales</span>
          </div>
          {analytics?.revenueOverTime?.length === 0 ? (
            <div className="chart-empty-state">No revenue data available for selected period.</div>
          ) : (
            <div className="custom-bar-chart">
              {analytics?.revenueOverTime?.map((bar, idx) => {
                const heightPct = Math.max(10, Math.round((Number(bar.revenue) / (maxRevenue || 1)) * 100));
                return (
                  <div key={idx} className="bar-column" title={`${bar.dateLabel}: ₹${Number(bar.revenue).toFixed(2)} (${bar.orders} orders)`}>
                    <div className="bar-val-text">₹{Number(bar.revenue) > 1000 ? `${(Number(bar.revenue) / 1000).toFixed(1)}k` : Number(bar.revenue)}</div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ height: `${heightPct}%` }}></div>
                    </div>
                    <span className="bar-label">{bar.dateLabel}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Orders by Status Breakdown */}
        <div className="dashboard-card status-distribution-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart3 size={18} /> Orders Status Breakdown
          </h3>
          <div className="status-progress-list">
            {analytics?.ordersByStatus?.length === 0 ? (
              <div className="chart-empty-state">No orders recorded in this period.</div>
            ) : (
              analytics?.ordersByStatus?.map((st) => {
                const count = Number(st.count);
                const pct = summary.totalOrders > 0 ? Math.round((count / summary.totalOrders) * 100) : 0;
                return (
                  <div key={st.status} className="status-progress-item">
                    <div className="status-info-row">
                      <span className="status-name">● {st.status}</span>
                      <span className="status-count-val">{count} ({pct}%)</span>
                    </div>
                    <div className="status-progress-bar-track">
                      <div
                        className={`status-progress-fill fill-${st.status.toLowerCase().replace(/\s+/g, '-')}`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Best Sellers & Menu Alerts Section */}
      <div className="dashboard-middle-grid">
        {/* Best Selling Products */}
        <div className="dashboard-card">
          <div className="card-header-row">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Star size={18} color="#f59e0b" /> Best Selling Food Products
            </h3>
            <button className="link-btn" onClick={() => navigate('/admin/products')}>View All Menu</button>
          </div>
          <div className="table-responsive-box">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Qty Sold</th>
                  <th>Revenue (₹)</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.bestSellingProducts?.length === 0 ? (
                  <tr><td colSpan="4" className="empty-table-cell">No sales data recorded yet</td></tr>
                ) : (
                  analytics?.bestSellingProducts?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="product-name-cell" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Flame size={14} color="#f97316" /> {item.name}
                      </td>
                      <td>{item.category || 'General'}</td>
                      <td><strong>{item.quantitySold}</strong> units</td>
                      <td className="amount-cell">₹{Number(item.totalRevenue).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Menu Alerts / Out of Stock */}
        <div className="dashboard-card alerts-card">
          <div className="card-header-row">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={18} color="#ef4444" /> Out-of-Stock Menu Alerts
            </h3>
            <button className="link-btn" onClick={() => navigate('/admin/products')}>Manage Products</button>
          </div>

          {analytics?.lowStockAlerts?.length === 0 ? (
            <div className="no-alerts-box">
              <CheckCircle2 size={18} className="success-icon" />
              <p>All menu products are currently available for ordering!</p>
            </div>
          ) : (
            <div className="alerts-list">
              <div className="alert-count-banner">
                {analytics?.lowStockAlerts?.length} product{analytics?.lowStockAlerts?.length > 1 ? 's are' : ' is'} currently marked unavailable:
              </div>
              {analytics?.lowStockAlerts?.map((item) => (
                <div key={item.id} className="alert-item-row">
                  <div>
                    <div className="alert-item-name">{item.name}</div>
                    <span className="alert-item-category">{item.category} • ₹{item.price}</span>
                  </div>
                  <span className="out-of-stock-pill">Unavailable</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="dashboard-card recent-orders-card">
        <div className="card-header-row">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Package size={18} /> Recent Customer Orders
          </h3>
          <button className="link-btn primary-link" onClick={() => navigate('/admin/orders')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            View All Orders <ArrowRight size={14} />
          </button>
        </div>

        <div className="table-responsive-box">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date & Time</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.recentOrders?.length === 0 ? (
                <tr><td colSpan="6" className="empty-table-cell">No recent customer orders</td></tr>
              ) : (
                analytics?.recentOrders?.map((order) => {
                  const customerName = `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Guest';
                  const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={order.id}>
                      <td><span className="order-id-badge">#{order.id}</span></td>
                      <td><strong>{customerName}</strong></td>
                      <td>{orderDate}</td>
                      <td className="amount-cell">₹{Number(order.amount).toFixed(2)}</td>
                      <td>
                        <span className={`status-pill pill-${order.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                          ● {order.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn-table-action" onClick={() => handleViewOrder(order)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Add Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        order={selectedOrder}
        onStatusChange={handleOrderStatusUpdate}
      />
    </div>
  );
};

export default AdminDashboard;
