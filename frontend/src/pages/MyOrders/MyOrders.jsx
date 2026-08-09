import React, { useContext, useEffect, useState } from 'react';
import './MyOrders.css';
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';
import { Package, Lock, CheckCircle2, Clock, XCircle, Banknote, Check, Star } from 'lucide-react';
import ProductReviewsModal from '../../components/Reviews/ProductReviewsModal';

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'today'
  const navigate = useNavigate();

  // Review modal state
  const [selectedReviewProduct, setSelectedReviewProduct] = useState(null);
  const [selectedReviewOrderId, setSelectedReviewOrderId] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const handleOpenReview = (product, orderId) => {
    setSelectedReviewProduct({
      id: product.food_id || product.id,
      _id: product.food_id || product.id,
      name: product.name
    });
    setSelectedReviewOrderId(orderId);
    setIsReviewModalOpen(true);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${url}/api/order/userorders`, {
        method: "GET",
        headers: { token: token }
      });
      const resData = await response.json();
      if (resData.success) {
        setData(resData.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch user orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Helper to check if order was placed today
  const isToday = (dateString) => {
    if (!dateString) return false;
    const orderDate = new Date(dateString);
    const today = new Date();
    return (
      orderDate.getDate() === today.getDate() &&
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getFullYear() === today.getFullYear()
    );
  };

  const filteredOrders = data.filter(order => {
    if (activeTab === 'today') {
      return isToday(order.created_at);
    }
    return true;
  });

  const todayCount = data.filter(order => isToday(order.created_at)).length;

  const ORDER_STEPS = [
    { label: 'Placed' },
    { label: 'Confirmed' },
    { label: 'Preparing' },
    { label: 'Out for Delivery' },
    { label: 'Delivered' }
  ];

  const getStepIndex = (status) => {
    if (!status || status === 'Food Processing' || status === 'Pending') return 0;
    if (status === 'Confirmed') return 1;
    if (status === 'Preparing') return 2;
    if (status === 'Out for Delivery') return 3;
    if (status === 'Delivered') return 4;
    return -1;
  };

  return (
    <div className='my-orders'>
      <div className="my-orders-header">
        <h2>My Orders & Summary</h2>
        <div className="orders-tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Orders ({data.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            Today's Orders ({todayCount})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="orders-loading">
          <div className="spinner"></div>
          <p>Loading your orders...</p>
        </div>
      ) : !token ? (
        <div className="orders-empty">
          <div className="empty-icon"><Lock size={44} color="#94a3b8" /></div>
          <h3>Please log in to view your order summary</h3>
          <p>Your active and past order summaries will appear here once signed in.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="orders-empty">
          <div className="empty-icon"><Package size={44} color="#94a3b8" /></div>
          <h3>{activeTab === 'today' ? "No orders placed today" : "No orders found"}</h3>
          <p>Looks like you haven't placed any orders {activeTab === 'today' ? "today" : "yet"}. Browse our menu and treat yourself!</p>
          <button onClick={() => navigate('/')} className="explore-btn">Explore Menu</button>
        </div>
      ) : (
        <div className="my-orders-container">
          {filteredOrders.map((order, index) => {
            const currentStepIdx = getStepIndex(order.status);
            const isCancelled = order.status === 'Cancelled';
            const pStatus = order.payment_status || 'pending';

            return (
              <div key={order.id || index} className="my-orders-order-card">
                <div className="order-main-row">
                  <img src={assets.parcel_icon} alt="Parcel Icon" className="order-parcel-img" />

                  <div className="order-details">
                    <p className="order-items-text">
                      {order.items && order.items.map((item, idx) => {
                        if (idx === order.items.length - 1) {
                          return `${item.name} x ${item.quantity}`;
                        } else {
                          return `${item.name} x ${item.quantity}, `;
                        }
                      })}
                    </p>
                    <div className="order-meta">
                      <span className="order-id">Order #{order.id}</span>
                      <span className="order-date">
                        {new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {isToday(order.created_at) && <span className="today-badge">Today</span>}
                    </div>

                    {/* Customer Payment Status Badge */}
                    <div className="customer-pay-status-box">
                      {pStatus === 'paid' ? (
                        <span className="cust-pay-badge cust-pay-confirmed" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={13} /> Payment Confirmed
                        </span>
                      ) : pStatus === 'verification_required' ? (
                        <span className="cust-pay-badge cust-pay-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} /> Payment Verification Pending
                          {order.payment_reference ? ` (UTR: ${order.payment_reference})` : ''}
                        </span>
                      ) : pStatus === 'rejected' ? (
                        <span className="cust-pay-badge cust-pay-rejected" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={13} /> Payment Rejected
                          {order.payment_rejection_reason ? ` — ${order.payment_rejection_reason}` : ' (Please contact restaurant)'}
                        </span>
                      ) : (
                        <span className="cust-pay-badge cust-pay-cod" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Banknote size={13} /> Cash on Delivery
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="order-summary-info">
                    <p className="order-amount">₹{order.amount}</p>
                    <p className="order-count">Items: {order.items ? order.items.length : 0}</p>
                  </div>

                  <div className="order-status-wrapper">
                    <span className={`status-pill ${order.status ? order.status.toLowerCase().replace(/\s+/g, '-') : 'processing'}`}>
                      ● {order.status || "Pending"}
                    </span>
                    <button onClick={fetchOrders} className="track-btn">Refresh</button>
                  </div>
                </div>

                {/* Live Order Progress Tracker */}
                <div className="order-progress-tracker">
                  {isCancelled ? (
                    <div className="order-cancelled-notice" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <XCircle size={15} /> Order #{order.id} was Cancelled.
                    </div>
                  ) : (
                    <div className="tracker-steps-container">
                      {ORDER_STEPS.map((step, idx) => {
                        const isCompleted = currentStepIdx > idx;
                        const isCurrent = currentStepIdx === idx;
                        return (
                          <div
                            key={step.label}
                            className={`tracker-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
                          >
                            <div className="step-dot">
                              {isCompleted ? <Check size={14} /> : idx + 1}
                            </div>
                            <span className="step-label">{step.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Delivered Order Review Items Section */}
                {order.status === 'Delivered' && order.items && order.items.length > 0 && (
                  <div className="delivered-review-items-bar">
                    <span className="review-items-title"><Star size={14} fill="#f59e0b" color="#f59e0b" /> Rate Delivered Dishes:</span>
                    <div className="review-item-chips">
                      {order.items.map((item, idx) => (
                        <button
                          key={item.food_id || idx}
                          className="btn-review-chip"
                          onClick={() => handleOpenReview(item, order.id)}
                        >
                          <Star size={12} fill="#f59e0b" color="#f59e0b" /> Review {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedReviewProduct && (
        <ProductReviewsModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          product={selectedReviewProduct}
          initialOrderId={selectedReviewOrderId}
        />
      )}
    </div>
  );
};

export default MyOrders;
