import React, { useState } from 'react';
import { User, MapPin, CreditCard, UtensilsCrossed, Settings, AlertTriangle, X } from 'lucide-react';
import './OrderDetailsModal.css';

const VALID_TRANSITIONS = {
  'Pending': ['Confirmed', 'Cancelled'],
  'Food Processing': ['Confirmed', 'Preparing', 'Cancelled'],
  'Confirmed': ['Preparing', 'Cancelled'],
  'Preparing': ['Out for Delivery', 'Cancelled'],
  'Out for Delivery': ['Delivered', 'Cancelled'],
  'Delivered': [],
  'Cancelled': []
};

const STATUS_COLOR_MAP = {
  'Pending': 'status-pending',
  'Food Processing': 'status-pending',
  'Confirmed': 'status-confirmed',
  'Preparing': 'status-preparing',
  'Out for Delivery': 'status-delivery',
  'Delivered': 'status-delivered',
  'Cancelled': 'status-cancelled'
};

const OrderDetailsModal = ({ isOpen, onClose, order, onStatusChange }) => {
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !order) return null;

  const currentStatus = order.status || 'Pending';
  const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
  const pStatus = order.payment_status || 'pending';

  const handleUpdateStatus = async (targetStatus) => {
    setErrorMsg('');
    try {
      setUpdating(true);
      await onStatusChange(order.id, targetStatus);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const formattedDate = new Date(order.created_at || Date.now()).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const customerName = `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Guest Customer';

  return (
    <div className="order-modal-backdrop" onClick={onClose}>
      <div className="order-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="order-modal-header">
          <div>
            <div className="modal-title-row">
              <h3>Order #{order.id}</h3>
              <span className={`order-status-badge ${STATUS_COLOR_MAP[currentStatus] || 'status-pending'}`}>
                ● {currentStatus}
              </span>
            </div>
            <p className="order-modal-date">Placed on {formattedDate}</p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal"><X size={16} /></button>
        </div>

        {errorMsg ? (
          <div className="order-error-alert" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} /> {errorMsg}
          </div>
        ) : null}

        <div className="order-modal-body">
          {/* Customer & Address & Payment Details */}
          <div className="order-info-section">
            <div className="info-card">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={16} /> Customer Details</h4>
              <p><strong>Name:</strong> {customerName}</p>
              <p><strong>Email:</strong> {order.email || 'N/A'}</p>
              <p><strong>Phone:</strong> {order.phone || 'N/A'}</p>
            </div>

            <div className="info-card">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> Delivery Address</h4>
              <p>{order.street || 'No street address'}</p>
              <p>{order.city ? `${order.city}, ${order.state || ''} ${order.zip_code || ''}` : ''}</p>
              <p>{order.country || 'India'}</p>
            </div>

            <div className="info-card">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CreditCard size={16} /> Payment Information</h4>
              <p><strong>Method:</strong> {order.payment_method === 'upi' ? 'Instant UPI' : 'Cash on Delivery'}</p>
              <p>
                <strong>Status:</strong>{' '}
                <span className={`pay-status-pill ${pStatus === 'paid' ? 'pay-paid' : pStatus === 'verification_required' ? 'pay-verify' : pStatus === 'rejected' ? 'pay-rejected' : 'pay-pending'}`}>
                  {pStatus === 'paid' ? 'Paid' : pStatus === 'verification_required' ? 'Verification Pending' : pStatus === 'rejected' ? 'Rejected' : 'Pending (COD)'}
                </span>
              </p>
              {order.payment_reference && (
                <p><strong>UTR / Ref:</strong> <code>{order.payment_reference}</code></p>
              )}
              {order.payment_rejection_reason && (
                <p className="rejection-text"><strong>Rejection Reason:</strong> {order.payment_rejection_reason}</p>
              )}
            </div>
          </div>

          {/* Ordered Food Items */}
          <div className="order-items-section">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><UtensilsCrossed size={16} /> Ordered Food Items</h4>
            <table className="order-items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Unit Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="item-name-cell">{item.name}</td>
                      <td>₹{Number(item.price).toFixed(2)}</td>
                      <td>x {item.quantity}</td>
                      <td className="item-total-cell">₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No item details available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown */}
          <div className="order-total-summary">
            {order.coupon_code && (
              <div className="summary-row">
                <span>Applied Coupon ({order.coupon_code}):</span>
                <span>-₹{Number(order.discount_amount || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row total-row">
              <span>Grand Total:</span>
              <span className="total-amount">₹{Number(order.amount).toFixed(2)}</span>
            </div>
          </div>

          {/* Order Status Update Controls */}
          <div className="order-status-update-section">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Settings size={16} /> Update Order Status</h4>
            {allowedTransitions.length === 0 ? (
              <div className="terminal-status-notice">
                This order is in terminal state <strong>"{currentStatus}"</strong> and cannot be modified further.
              </div>
            ) : (
              <div className="status-buttons-group">
                {allowedTransitions.map((nextStatus) => (
                  <button
                    key={nextStatus}
                    className={`status-action-btn ${nextStatus === 'Cancelled' ? 'btn-cancel-order' : 'btn-advance-status'}`}
                    onClick={() => handleUpdateStatus(nextStatus)}
                    disabled={updating}
                  >
                    {updating ? 'Updating...' : `Mark as "${nextStatus}"`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="order-modal-footer">
          <button className="btn-close-modal" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
