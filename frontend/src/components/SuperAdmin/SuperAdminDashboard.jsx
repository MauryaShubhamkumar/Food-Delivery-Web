import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import {
  Building2,
  Users,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  ExternalLink,
  Crown
} from 'lucide-react';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const { url, token } = useContext(StoreContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [onboardingStuck, setOnboardingStuck] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, stuckRes] = await Promise.all([
        fetch(`${url}/api/super-admin/stats`, { headers: { token } }),
        fetch(`${url}/api/super-admin/onboarding-stuck`, { headers: { token } })
      ]);

      const statsData = await statsRes.json();
      const stuckData = await stuckRes.json();

      if (statsData.success) {
        setStats(statsData.data);
      } else {
        setError(statsData.message || "Failed to load platform stats.");
      }

      if (stuckData.success && stuckData.data) {
        setOnboardingStuck(stuckData.data);
      }
    } catch (err) {
      setError("Network error loading platform admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="sa-loading-box">
        <Loader2 size={36} className="spin-icon" />
        <p>Loading Platform Admin KPIs...</p>
      </div>
    );
  }

  return (
    <div className="sa-dashboard-container">
      {/* Top Banner Header */}
      <div className="sa-header-hero">
        <div className="hero-text font-bold">
          <h1><Crown size={24} color="#a78bfa" /> Platform Overview</h1>
          <p>Real-time platform metrics, restaurants, gross order volume (GMV), and onboarding tracking.</p>
        </div>
      </div>

      {error && (
        <div className="sa-alert error">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="sa-kpi-grid">
        <div className="kpi-card purple">
          <div className="kpi-header">
            <span className="kpi-label">Gross Order Volume (GMV)</span>
            <div className="kpi-icon"><TrendingUp size={20} /></div>
          </div>
          <div className="kpi-value">₹{Number(stats?.orders?.totalGMV || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <span className="kpi-subtext">Total Gross Order Revenue Across Platform</span>
        </div>

        <div className="kpi-card blue">
          <div className="kpi-header">
            <span className="kpi-label">Total Restaurants</span>
            <div className="kpi-icon"><Building2 size={20} /></div>
          </div>
          <div className="kpi-value">{stats?.restaurants?.total || 0}</div>
          <div className="kpi-breakdown">
            <span className="badge-active">{stats?.restaurants?.active || 0} Active</span>
            <span className="badge-setup">{stats?.restaurants?.setup || 0} Setup</span>
            <span className="badge-inactive">{stats?.restaurants?.inactive || 0} Inactive</span>
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-header">
            <span className="kpi-label">Total Platform Orders</span>
            <div className="kpi-icon"><ShoppingBag size={20} /></div>
          </div>
          <div className="kpi-value">{stats?.orders?.totalOrders || 0}</div>
          <span className="kpi-subtext">All-time Customer Orders Placed</span>
        </div>

        <div className="kpi-card orange">
          <div className="kpi-header">
            <span className="kpi-label">Platform Accounts</span>
            <div className="kpi-icon"><Users size={20} /></div>
          </div>
          <div className="kpi-value">{stats?.users?.total || 0}</div>
          <div className="kpi-breakdown">
            <span>{stats?.users?.customers || 0} Foodies</span>
            <span>{stats?.users?.owners || 0} Owners</span>
          </div>
        </div>
      </div>

      {/* Onboarding Monitor Section */}
      <div className="sa-section-card">
        <div className="section-card-header">
          <div>
            <h3><Clock size={18} /> Incomplete Restaurant Onboarding ({onboardingStuck.length})</h3>
            <p>Restaurants currently in setup mode requiring assistance to complete menu or payment setup.</p>
          </div>
          <button onClick={() => navigate('/super-admin/restaurants?status=setup')} className="btn-view-all">
            View All Setup Stores <ArrowRight size={14} />
          </button>
        </div>

        {onboardingStuck.length === 0 ? (
          <div className="empty-stuck-box">
            <CheckCircle2 size={32} color="#10b981" />
            <p>All registered restaurants have completed onboarding!</p>
          </div>
        ) : (
          <div className="stuck-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Restaurant</th>
                  <th>Owner</th>
                  <th>Current Step</th>
                  <th>Created Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {onboardingStuck.slice(0, 5).map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="table-rest-cell">
                        <strong>{r.name}</strong>
                        <code>{r.slug}</code>
                      </div>
                    </td>
                    <td>
                      <div className="table-user-cell">
                        <span>{r.owner_name || 'N/A'}</span>
                        <small>{r.owner_email || r.email || 'No email'}</small>
                      </div>
                    </td>
                    <td>
                      <span className="step-pill">Step {r.onboarding_step || 1} of 6</span>
                    </td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => navigate(`/super-admin/restaurants`)}
                        className="btn-action-view"
                      >
                        Manage
                      </button>
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

export default SuperAdminDashboard;
