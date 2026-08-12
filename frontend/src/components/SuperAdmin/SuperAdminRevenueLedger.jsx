import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Percent,
  Search,
  Loader2,
  Building2,
  Edit3,
  Save,
  X,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import './SuperAdminDashboard.css';

const SuperAdminRevenueLedger = () => {
  const { url, token, formatCurrency } = useContext(StoreContext);

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [search, setSearch] = useState('');

  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalGMV: 0,
    totalPlatformEarnings: 0,
    netStorePayouts: 0,
    avgCommissionRate: 5.0
  });

  const [stores, setStores] = useState([]);
  const [editingStore, setEditingStore] = useState(null);
  const [newCommissionRate, setNewCommissionRate] = useState('');
  const [submittingRate, setSubmittingRate] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  const fetchLedger = async () => {
    setLoading(true);
    setAlertMsg('');
    try {
      const response = await fetch(`${url}/api/super-admin/revenue-ledger?period=${period}`, {
        headers: { token }
      });
      const data = await response.json();

      if (data.success && data.data) {
        setSummary(data.data.summary || {});
        setStores(Array.isArray(data.data.stores) ? data.data.stores : []);
      } else {
        setStores([]);
      }
    } catch (err) {
      console.error("Error loading revenue ledger:", err);
      setAlertMsg("Failed to load revenue ledger statistics.");
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLedger();
    }
  }, [token, period]);

  const handleUpdateCommission = async (e) => {
    e.preventDefault();
    if (!editingStore) return;

    const rateNum = Number(newCommissionRate);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      setAlertMsg("Commission rate must be between 0% and 100%.");
      return;
    }

    setSubmittingRate(true);
    try {
      const response = await fetch(`${url}/api/super-admin/restaurants/${editingStore.id}/commission`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          token
        },
        body: JSON.stringify({ commissionRate: rateNum })
      });
      const data = await response.json();

      if (data.success) {
        setEditingStore(null);
        await fetchLedger();
      } else {
        setAlertMsg(data.message || "Failed to update commission rate.");
      }
    } catch (err) {
      setAlertMsg("Error updating commission rate.");
    } finally {
      setSubmittingRate(false);
    }
  };

  const filteredStores = stores.filter(s =>
    (s.name || '').toLowerCase().includes(search.toLowerCase().trim()) ||
    (s.slug || '').toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div className="sa-dashboard-container">
      {/* Header Hero */}
      <div className="sa-header-hero">
        <div className="hero-text">
          <h1><DollarSign size={24} color="#10b981" /> Platform Revenue & Commission Ledger</h1>
          <p>Real-time calculation of FastBite net earnings vs gross merchandise sales (GMV) and store payouts.</p>
        </div>
      </div>

      {alertMsg && (
        <div className="sa-alert error">
          {alertMsg}
        </div>
      )}

      {/* Financial KPI Summary Grid */}
      <div className="sa-kpi-grid">
        <div className="kpi-card green">
          <div className="kpi-header">
            <span className="kpi-label">Gross Merchandise Sales (GMV)</span>
            <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="kpi-value">{formatCurrency(summary.totalGMV)}</div>
          <div className="kpi-subtext">Total sales processed across all partner stores</div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-header">
            <span className="kpi-label">FastBite Net Revenue</span>
            <div className="kpi-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#a78bfa' }}>{formatCurrency(summary.totalPlatformEarnings)}</div>
          <div className="kpi-subtext">Actual platform commission earnings</div>
        </div>

        <div className="kpi-card blue">
          <div className="kpi-header">
            <span className="kpi-label">Net Restaurant Payouts</span>
            <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <Wallet size={20} />
            </div>
          </div>
          <div className="kpi-value">{formatCurrency(summary.netStorePayouts)}</div>
          <div className="kpi-subtext">Total sales disbursed to restaurant bank accounts</div>
        </div>

        <div className="kpi-card orange">
          <div className="kpi-header">
            <span className="kpi-label">Avg Commission Rate</span>
            <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <Percent size={20} />
            </div>
          </div>
          <div className="kpi-value">{Number(summary.avgCommissionRate || 5.0).toFixed(2)}%</div>
          <div className="kpi-subtext">Platform-wide average take rate</div>
        </div>
      </div>

      {/* Main Ledger Table Card */}
      <div className="sa-section-card">
        <div className="section-card-header flex-col-sm">
          <div className="sa-search-form">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search store by name or slug..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="status-filter-pills">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'This Year' },
              { id: 'all', label: 'All Time' }
            ].map(p => (
              <button
                key={p.id}
                className={`filter-pill ${period === p.id ? 'active' : ''}`}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="sa-loading-box">
            <Loader2 size={32} className="spin-icon" />
            <p>Calculating Financial Ledger...</p>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="empty-stuck-box">
            <Building2 size={36} color="#6b7280" />
            <p>No restaurant revenue data found for selected criteria.</p>
          </div>
        ) : (
          <div className="stuck-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Restaurant</th>
                  <th>Status</th>
                  <th>Orders</th>
                  <th>Gross Sales (GMV)</th>
                  <th>Commission Rate %</th>
                  <th>FastBite Revenue</th>
                  <th>Net Store Payout</th>
                  <th>Rate Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStores.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="table-rest-cell">
                        <strong>{s.name}</strong>
                        <code>{s.slug}</code>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge-pill ${s.status || 'setup'}`}>
                        {String(s.status || 'setup').toUpperCase()}
                      </span>
                    </td>
                    <td><strong>{s.completedOrders}</strong> orders</td>
                    <td><strong>{formatCurrency(s.storeGMV)}</strong></td>
                    <td>
                      <span className="step-pill" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
                        {Number(s.commission_rate).toFixed(2)}%
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#a78bfa' }}>{formatCurrency(s.platformEarnings)}</strong>
                    </td>
                    <td>
                      <strong style={{ color: '#10b981' }}>{formatCurrency(s.netStorePayout)}</strong>
                    </td>
                    <td>
                      <button
                        className="btn-action-view"
                        onClick={() => {
                          setEditingStore(s);
                          setNewCommissionRate(s.commission_rate);
                        }}
                        title="Edit Commission Percentage"
                      >
                        <Edit3 size={13} /> Edit %
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Commission Rate Modal */}
      {editingStore && (
        <div className="modal-overlay">
          <div className="sa-modal-card">
            <div className="modal-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Set Commission Rate</h3>
              <button className="btn-close-modal" onClick={() => setEditingStore(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateCommission} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                Configure FastBite platform fee percentage for <strong>{editingStore.name}</strong>.
              </p>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-dark)' }}>
                  Commission Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={newCommissionRate}
                  onChange={e => setNewCommissionRate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-dark)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div className="modal-actions-row" style={{ marginTop: '8px' }}>
                <button
                  type="submit"
                  className="btn-confirm-action activate"
                  disabled={submittingRate}
                >
                  {submittingRate ? <Loader2 size={16} className="spin-icon" /> : <Save size={16} />}
                  Save Commission Rate
                </button>
                <button
                  type="button"
                  className="btn-cancel-modal"
                  onClick={() => setEditingStore(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminRevenueLedger;
