import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { TrendingUp, Calendar, Building2, ShoppingBag, Loader2, Trophy } from 'lucide-react';
import './SuperAdminDashboard.css';

const SuperAdminAnalytics = () => {
  const { url, token } = useContext(StoreContext);

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${url}/api/super-admin/analytics?period=${period}`, {
        headers: { token }
      });
      const data = await response.json();

      if (data.success) {
        setAnalyticsData(data.data);
      }
    } catch (err) {
      console.error("Error fetching platform analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [token, period]);

  const leaderboard = analyticsData?.leaderboard || [];

  return (
    <div className="sa-dashboard-container">
      <div className="sa-header-hero">
        <div className="hero-text font-bold">
          <h1><TrendingUp size={24} color="#a78bfa" /> Platform GMV & Revenue Analytics</h1>
          <p>Gross Order Volume (GMV) revenue leaderboards and order volume analytics by restaurant.</p>
        </div>
      </div>

      <div className="sa-section-card">
        <div className="section-card-header">
          <div>
            <h3><Trophy size={18} /> Top Restaurants by GMV Revenue</h3>
            <p>Leaderboard ranking stores by total order volume and revenue generation.</p>
          </div>

          <div className="period-filter-wrapper sa-period-filter">
            <Calendar size={15} /> Timeframe:
            <select value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="sa-loading-box">
            <Loader2 size={32} className="spin-icon" />
            <p>Calculating GMV Analytics...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="empty-stuck-box">
            <Building2 size={36} color="#6b7280" />
            <p>No order transactions recorded for selected timeframe.</p>
          </div>
        ) : (
          <div className="stuck-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Restaurant</th>
                  <th>Total Orders</th>
                  <th>Gross Order Value (GMV)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((r, idx) => (
                  <tr key={r.id}>
                    <td>
                      <span className={`rank-badge rank-${idx + 1}`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td>
                      <div className="table-rest-cell">
                        <strong>{r.name}</strong>
                        <code>{r.slug}</code>
                      </div>
                    </td>
                    <td>{r.totalOrders} orders</td>
                    <td><strong style={{ color: '#10b981' }}>₹{Number(r.gmv).toFixed(2)}</strong></td>
                    <td>
                      <span className={`status-badge-pill ${r.status || 'setup'}`}>
                        {String(r.status || 'setup').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminAnalytics;
