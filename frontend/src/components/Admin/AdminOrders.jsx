import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import OrderDetailsModal from './OrderDetailsModal';
import './AdminOrders.css';

const STATUS_OPTIONS = ['All', 'Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];
const PAYMENT_STATUS_OPTIONS = [
  { value: 'All', label: 'All Payments' },
  { value: 'verification_required', label: '🟡 Pending Verification' },
  { value: 'paid', label: '✓ Paid' },
  { value: 'rejected', label: '✕ Rejected' },
  { value: 'pending', label: '💵 Pending (COD)' }
];

const STATUS_COLOR_MAP = {
  'Pending': 'status-pending',
  'Food Processing': 'status-pending',
  'Confirmed': 'status-confirmed',
  'Preparing': 'status-preparing',
  'Out for Delivery': 'status-delivery',
  'Delivered': 'status-delivered',
  'Cancelled': 'status-cancelled'
};

const AdminOrders = () => {
  const { url, token } = useContext(StoreContext);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('All');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [approveModalOrder, setApproveModalOrder] = useState(null);
  const [rejectModalOrder, setRejectModalOrder] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdminOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = `${url}/api/admin/orders?search=${encodeURIComponent(searchQuery)}&status=${encodeURIComponent(selectedStatus)}&paymentStatus=${encodeURIComponent(selectedPaymentStatus)}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { token: token }
      });
      const data = await response.json();

      if (data.success) {
        setOrders(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch customer orders');
      }
    } catch (err) {
      setError('Network connection error while fetching orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminOrders();
    }
  }, [token, searchQuery, selectedStatus, selectedPaymentStatus]);

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (orderId, newStatus) => {
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
      throw new Error(data.message || 'Failed to update status');
    }

    triggerSuccess(data.message || 'Order status updated successfully');
    setSelectedOrder(data.data);
    await fetchAdminOrders();
  };

  const handleApprovePayment = async () => {
    if (!approveModalOrder) return;
    try {
      setActionLoading(true);
      const response = await fetch(`${url}/api/admin/orders/${approveModalOrder.id}/payment/approve`, {
        method: 'PUT',
        headers: { token: token }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        triggerSuccess(data.message || `Payment for Order #${approveModalOrder.id} approved!`);
        setApproveModalOrder(null);
        await fetchAdminOrders();
      } else {
        alert(data.message || 'Failed to approve payment');
      }
    } catch (err) {
      alert('Error connecting to backend server');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectModalOrder) return;
    try {
      setActionLoading(true);
      const response = await fetch(`${url}/api/admin/orders/${rejectModalOrder.id}/payment/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          token: token
        },
        body: JSON.stringify({ reason: rejectionReason })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        triggerSuccess(data.message || `Payment for Order #${rejectModalOrder.id} rejected.`);
        setRejectModalOrder(null);
        setRejectionReason('');
        await fetchAdminOrders();
      } else {
        alert(data.message || 'Failed to reject payment');
      }
    } catch (err) {
      alert('Error connecting to backend server');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-orders-page">
      {/* Top Header */}
      <div className="admin-orders-header">
        <div>
          <h1 className="admin-orders-title">Customer Order Management</h1>
          <p className="admin-orders-subtitle">Track, verify UPI payments, and manage live order delivery workflows.</p>
        </div>
        <button className="refresh-orders-btn" onClick={fetchAdminOrders} disabled={loading}>
          🔄 {loading ? 'Refreshing...' : 'Refresh Orders'}
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

      {/* Search & Filter Bar */}
      <div className="orders-controls-bar">
        <div className="search-input-group">
          <span className="search-icon-symbol">🔍</span>
          <input
            type="text"
            placeholder="Search by Order ID (#1045), UTR, name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="orders-search-input"
          />
          {searchQuery ? (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
          ) : null}
        </div>

        <div className="filter-dropdown-group">
          <label htmlFor="payment-status-filter">Payment:</label>
          <select
            id="payment-status-filter"
            value={selectedPaymentStatus}
            onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            className="filter-select"
          >
            {PAYMENT_STATUS_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          <label htmlFor="status-filter" style={{ marginLeft: '12px' }}>Order Status:</label>
          <select
            id="status-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>{st === 'All' ? 'All Statuses' : st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="table-responsive-container">
        {loading ? (
          <div className="table-loading-skeleton">
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="no-orders-found">
            <div className="empty-icon">📦</div>
            <h3>No Customer Orders Found</h3>
            <p>Try clearing your search or status filter parameters.</p>
          </div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Payment & UTR</th>
                <th>Items & Total</th>
                <th>Order Status</th>
                <th>Date & Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const customerName = `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Guest';
                const formattedDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                const currentStatus = order.status || 'Pending';
                const pStatus = order.payment_status || 'pending';
                const isUpiPending = pStatus === 'verification_required';

                const itemsSummary = order.items && order.items.length > 0
                  ? order.items.map(i => `${i.name} x${i.quantity}`).join(', ')
                  : 'Items details loading';

                return (
                  <tr key={order.id} className={isUpiPending ? 'row-pending-verification' : ''}>
                    <td>
                      <span className="order-id-badge">#{order.id}</span>
                      {isUpiPending && (
                        <div className="pending-badge-pulse" title="Requires Payment Verification">⚠️ Needs Verification</div>
                      )}
                    </td>
                    <td>
                      <div className="customer-name">{customerName}</div>
                      <div className="customer-email">{order.email || order.phone || 'N/A'}</div>
                    </td>
                    <td>
                      <div className="payment-info-cell">
                        <span className="payment-method-tag">
                          {order.payment_method === 'upi' ? '📲 UPI' : '💵 COD'}
                        </span>

                        {pStatus === 'paid' ? (
                          <span className="pay-status-pill pay-paid">✓ Paid</span>
                        ) : pStatus === 'verification_required' ? (
                          <span className="pay-status-pill pay-verify">🟡 Verification Pending</span>
                        ) : pStatus === 'rejected' ? (
                          <span className="pay-status-pill pay-rejected">✕ Rejected</span>
                        ) : (
                          <span className="pay-status-pill pay-pending">⏳ Pending (COD)</span>
                        )}

                        {order.payment_reference && (
                          <div className="utr-ref-box">
                            <span className="utr-label">UTR:</span>
                            <strong className="utr-code">{order.payment_reference}</strong>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="order-amount-text">₹{Number(order.amount).toFixed(2)}</div>
                      <div className="items-summary-text" title={itemsSummary}>
                        {itemsSummary}
                      </div>
                    </td>
                    <td>
                      <span className={`order-status-badge ${STATUS_COLOR_MAP[currentStatus] || 'status-pending'}`}>
                        ● {currentStatus}
                      </span>
                    </td>
                    <td>
                      <span className="order-date-text">{formattedDate}</span>
                    </td>
                    <td>
                      <div className="order-action-buttons">
                        {isUpiPending ? (
                          <>
                            <button
                              className="btn-approve-pay"
                              onClick={() => setApproveModalOrder(order)}
                            >
                              ✓ Approve
                            </button>
                            <button
                              className="btn-reject-pay"
                              onClick={() => {
                                setRejectModalOrder(order);
                                setRejectionReason('');
                              }}
                            >
                              ✕ Reject
                            </button>
                          </>
                        ) : null}

                        <button
                          className="btn-view-details"
                          onClick={() => handleOpenDetails(order)}
                        >
                          👁️ View
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

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        onStatusChange={handleStatusChange}
      />

      {/* Approve Payment Confirmation Modal */}
      {approveModalOrder && (
        <div className="modal-backdrop" onClick={() => setApproveModalOrder(null)}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Approve Payment for Order #{approveModalOrder.id}?</h3>
            <p>
              Confirm that <strong>₹{Number(approveModalOrder.amount).toFixed(2)}</strong> (UTR: <code>{approveModalOrder.payment_reference}</code>) was received in the restaurant bank/UPI account.
            </p>
            <p className="modal-note">Order status will automatically transition to <strong>Confirmed</strong>.</p>
            <div className="confirm-modal-actions">
              <button
                className="btn-modal-cancel"
                onClick={() => setApproveModalOrder(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn-modal-confirm-approve"
                onClick={handleApprovePayment}
                disabled={actionLoading}
              >
                {actionLoading ? 'Approving...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Confirmation Modal */}
      {rejectModalOrder && (
        <div className="modal-backdrop" onClick={() => setRejectModalOrder(null)}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Reject Payment for Order #{rejectModalOrder.id}</h3>
            <p>Order Amount: <strong>₹{Number(rejectModalOrder.amount).toFixed(2)}</strong> | UTR: <code>{rejectModalOrder.payment_reference || 'N/A'}</code></p>
            <div className="form-group" style={{ textAlign: 'left', marginTop: '12px' }}>
              <label htmlFor="rejectionReasonInput">Reason for Rejection (Optional):</label>
              <textarea
                id="rejectionReasonInput"
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. UTR not found in bank statement, invalid amount received"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            <div className="confirm-modal-actions">
              <button
                className="btn-modal-cancel"
                onClick={() => setRejectModalOrder(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn-modal-confirm-reject"
                onClick={handleRejectPayment}
                disabled={actionLoading}
              >
                {actionLoading ? 'Rejecting...' : 'Reject Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
