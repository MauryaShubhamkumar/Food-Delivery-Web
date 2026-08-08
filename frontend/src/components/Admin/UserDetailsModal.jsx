import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import OrderDetailsModal from './OrderDetailsModal';
import { User, X, AlertTriangle, Package, Eye, CheckCircle2, XCircle } from 'lucide-react';
import './UserDetailsModal.css';

const UserDetailsModal = ({ isOpen, onClose, userId, onStatusChange }) => {
  const { url, token } = useContext(StoreContext);

  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [updating, setUpdating] = useState(false);

  // Nested Order Details Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const fetchCustomerDetailsAndOrders = async () => {
    if (!userId) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const [userRes, ordersRes] = await Promise.all([
        fetch(`${url}/api/admin/users/${userId}`, { headers: { token } }),
        fetch(`${url}/api/admin/users/${userId}/orders`, { headers: { token } })
      ]);

      const userDataJson = await userRes.json();
      const ordersDataJson = await ordersRes.json();

      if (userDataJson.success) {
        setUserData(userDataJson.data);
      } else {
        setErrorMsg(userDataJson.message || 'Failed to load customer profile');
      }

      if (ordersDataJson.success) {
        setOrders(ordersDataJson.data || []);
      }
    } catch (err) {
      setErrorMsg('Network error while loading customer details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchCustomerDetailsAndOrders();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleToggleAccountStatus = async () => {
    if (!userData) return;
    const targetStatus = !userData.isActive;
    const actionText = targetStatus ? 'activate' : 'deactivate';

    if (!window.confirm(`Are you sure you want to ${actionText} ${userData.name}'s account?\n${!targetStatus ? 'The customer will not be able to log in while the account is inactive.' : ''}`)) {
      return;
    }

    try {
      setUpdating(true);
      setErrorMsg('');
      await onStatusChange(userData.id, targetStatus);
      setUserData(prev => ({ ...prev, isActive: targetStatus }));
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update account status');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleOrderStatusUpdateInModal = async (orderId, newStatus) => {
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
    await fetchCustomerDetailsAndOrders();
  };

  const joinedDate = userData?.createdAt
    ? new Date(userData.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';

  return (
    <div className="user-modal-backdrop" onClick={onClose}>
      <div className="user-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="user-modal-header">
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={18} /> Customer Profile Details</h3>
            <p className="user-modal-subtitle">View profile information, total spending, and order history.</p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal"><X size={16} /></button>
        </div>

        {errorMsg ? (
          <div className="user-error-alert" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} /> {errorMsg}
          </div>
        ) : null}

        {loading ? (
          <div className="user-modal-loading">
            <div className="spinner"></div>
            <p>Loading customer profile...</p>
          </div>
        ) : userData ? (
          <div className="user-modal-body">
            {/* Top Cards Grid */}
            <div className="user-info-grid">
              <div className="user-profile-card">
                <h4>Customer Details</h4>
                <div className="info-field"><strong>Name:</strong> <span>{userData.name}</span></div>
                <div className="info-field"><strong>Email:</strong> <span>{userData.email}</span></div>
                <div className="info-field"><strong>Phone:</strong> <span>{userData.phone}</span></div>
                <div className="info-field"><strong>Joined:</strong> <span>{joinedDate}</span></div>
              </div>

              <div className="user-stats-card">
                <h4>Account Summary</h4>
                <div className="stat-row">
                  <span>Total Orders Placed:</span>
                  <span className="stat-val">{userData.totalOrders}</span>
                </div>
                <div className="stat-row">
                  <span>Total Spent:</span>
                  <span className="stat-val highlight">₹{userData.totalSpent.toFixed(2)}</span>
                </div>
                <div className="stat-row">
                  <span>Account Status:</span>
                  <span className={`status-badge ${userData.isActive ? 'active' : 'inactive'}`}>
                    ● {userData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <button
                  className={`btn-status-toggle ${userData.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                  onClick={handleToggleAccountStatus}
                  disabled={updating}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}
                >
                  {updating ? 'Updating...' : userData.isActive ? <><XCircle size={14} /> Deactivate Account</> : <><CheckCircle2 size={14} /> Activate Account</>}
                </button>
              </div>
            </div>

            {/* Customer Orders Section */}
            <div className="user-orders-section">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Package size={16} /> Order History ({orders.length})</h4>
              {orders.length === 0 ? (
                <div className="no-user-orders">This customer has not placed any orders yet.</div>
              ) : (
                <table className="user-orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });

                      return (
                        <tr key={order.id}>
                          <td><span className="order-id-tag">#{order.id}</span></td>
                          <td>{orderDate}</td>
                          <td>{order.items ? order.items.length : 0} items</td>
                          <td className="amount-cell">₹{Number(order.amount).toFixed(2)}</td>
                          <td>
                            <span className="mini-status-pill">{order.status}</span>
                          </td>
                          <td>
                            <button className="btn-view-order" onClick={() => handleViewOrder(order)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Eye size={13} /> Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : null}

        {/* Modal Footer */}
        <div className="user-modal-footer">
          <button className="btn-close-modal" onClick={onClose}>Close</button>
        </div>
      </div>

      {/* Nested Order Details Modal */}
      <OrderDetailsModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        order={selectedOrder}
        onStatusChange={handleOrderStatusUpdateInModal}
      />
    </div>
  );
};

export default UserDetailsModal;
