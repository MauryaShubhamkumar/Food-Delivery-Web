import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import CouponModal from './CouponModal';
import './AdminCoupons.css';

const AdminCoupons = () => {
  const { url, token } = useContext(StoreContext);

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const fetchAdminCoupons = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = `${url}/api/admin/coupons?search=${encodeURIComponent(searchQuery)}&status=${encodeURIComponent(selectedStatus)}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { token: token }
      });
      const data = await response.json();

      if (data.success) {
        setCoupons(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch coupons');
      }
    } catch (err) {
      setError('Network connection error while fetching coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminCoupons();
    }
  }, [token, searchQuery, selectedStatus]);

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleOpenAddModal = () => {
    setEditingCoupon(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cp) => {
    setEditingCoupon(cp);
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (cpData, cpId) => {
    let endpoint = `${url}/api/admin/coupons`;
    let method = 'POST';

    if (cpId) {
      endpoint += `/${cpId}`;
      method = 'PUT';
    }

    const response = await fetch(endpoint, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        token: token
      },
      body: JSON.stringify(cpData)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Error saving coupon');
    }

    triggerSuccess(data.message || 'Coupon saved successfully!');
    await fetchAdminCoupons();
  };

  const handleToggleStatus = async (cpId) => {
    try {
      const response = await fetch(`${url}/api/admin/coupons/${cpId}/status`, {
        method: 'PATCH',
        headers: { token: token }
      });
      const data = await response.json();
      if (data.success) {
        triggerSuccess(data.message);
        await fetchAdminCoupons();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to update coupon status');
    }
  };

  const handleDeleteCoupon = async (cp) => {
    if (!window.confirm(`Are you sure you want to delete coupon code "${cp.code}"?`)) {
      return;
    }
    setError('');
    try {
      const response = await fetch(`${url}/api/admin/coupons/${cp.id}`, {
        method: 'DELETE',
        headers: { token: token }
      });
      const data = await response.json();

      if (data.success) {
        triggerSuccess(data.message);
        await fetchAdminCoupons();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to delete coupon');
    }
  };

  return (
    <div className="admin-coupons-page">
      {/* Top Header */}
      <div className="admin-coupons-header">
        <div>
          <h1 className="admin-coupons-title">Coupons & Discount Management</h1>
          <p className="admin-coupons-subtitle">Create promotional codes, set minimum order requirements, and track usage limits.</p>
        </div>
        <button className="add-coupon-btn" onClick={handleOpenAddModal}>
          ➕ Create Coupon
        </button>
      </div>

      {/* Success Alert */}
      {successMsg ? (
        <div className="alert-banner alert-success">
          <span>✅ {successMsg}</span>
          <button className="alert-close" onClick={() => setSuccessMsg('')}>✕</button>
        </div>
      ) : null}

      {/* Error Alert */}
      {error ? (
        <div className="alert-banner alert-error">
          <span>⚠️ {error}</span>
          <button className="alert-close" onClick={() => setError('')}>✕</button>
        </div>
      ) : null}

      {/* Controls Bar */}
      <div className="coupons-controls-bar">
        <div className="search-input-group">
          <span className="search-icon-symbol">🔍</span>
          <input
            type="text"
            placeholder="Search coupons by code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="coupons-search-input"
          />
          {searchQuery ? (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
          ) : null}
        </div>

        <div className="filter-dropdown-group">
          <label htmlFor="coupon-status-filter">Status:</label>
          <select
            id="coupon-status-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Coupons</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Coupons Table Container */}
      <div className="table-responsive-container">
        {loading ? (
          <div className="table-loading-skeleton">
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
          </div>
        ) : coupons.length === 0 ? (
          <div className="no-coupons-found">
            <div className="empty-icon">🏷️</div>
            <h3>No Coupons Found</h3>
            <p>Click "+ Create Coupon" to add promotional codes for your customers.</p>
          </div>
        ) : (
          <table className="coupons-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min Order</th>
                <th>Max Discount</th>
                <th>Usage</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((cp) => {
                const isExpired = cp.expires_at && new Date(cp.expires_at) <= new Date();
                const expiryText = cp.expires_at
                  ? new Date(cp.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'No Expiry';

                const discountDisplay = cp.discount_type === 'percentage'
                  ? `${cp.discount_value}% OFF`
                  : `₹${cp.discount_value} OFF`;

                const usageText = cp.usage_limit
                  ? `${cp.used_count} / ${cp.usage_limit}`
                  : `${cp.used_count} (Unlimited)`;

                return (
                  <tr key={cp.id} className={!cp.is_active || isExpired ? 'row-inactive' : ''}>
                    <td>
                      <span className="coupon-code-badge">🏷️ {cp.code}</span>
                    </td>
                    <td>
                      <span className="discount-value-tag">{discountDisplay}</span>
                    </td>
                    <td>₹{Number(cp.minimum_order_amount).toFixed(2)}</td>
                    <td>{cp.maximum_discount ? `₹${Number(cp.maximum_discount).toFixed(2)}` : 'Unlimited'}</td>
                    <td>{usageText}</td>
                    <td>
                      <span className={isExpired ? 'expired-text' : ''}>{expiryText}</span>
                    </td>
                    <td>
                      <button
                        className={`status-toggle-btn ${cp.is_active && !isExpired ? 'available' : 'unavailable'}`}
                        onClick={() => handleToggleStatus(cp.id)}
                        title="Click to toggle coupon availability"
                      >
                        <span className="status-dot"></span>
                        {isExpired ? 'Expired' : cp.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleOpenEditModal(cp)}
                          title="Edit coupon"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteCoupon(cp)}
                          title="Delete coupon"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Coupon Modal */}
      <CouponModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCoupon}
        coupon={editingCoupon}
      />
    </div>
  );
};

export default AdminCoupons;
