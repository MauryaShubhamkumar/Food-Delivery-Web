import React, { useContext, useEffect, useState } from 'react';
import './MyOrders.css';
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'today'
  const navigate = useNavigate();

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
          <div className="empty-icon">🔒</div>
          <h3>Please log in to view your order summary</h3>
          <p>Your active and past order summaries will appear here once signed in.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="orders-empty">
          <div className="empty-icon">📦</div>
          <h3>{activeTab === 'today' ? "No orders placed today" : "No orders found"}</h3>
          <p>Looks like you haven't placed any orders {activeTab === 'today' ? "today" : "yet"}. Browse our menu and treat yourself!</p>
          <button onClick={() => navigate('/')} className="explore-btn">Explore Menu</button>
        </div>
      ) : (
        <div className="my-orders-container">
          {filteredOrders.map((order, index) => (
            <div key={order.id || index} className="my-orders-order">
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
              </div>

              <div className="order-summary-info">
                <p className="order-amount">₹{order.amount}</p>
                <p className="order-count">Items: {order.items ? order.items.length : 0}</p>
              </div>

              <div className="order-status-wrapper">
                <span className={`status-pill ${order.status ? order.status.toLowerCase().replace(/\s+/g, '-') : 'processing'}`}>
                  ● {order.status || "Food Processing"}
                </span>
                <button onClick={fetchOrders} className="track-btn">Track Order</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
