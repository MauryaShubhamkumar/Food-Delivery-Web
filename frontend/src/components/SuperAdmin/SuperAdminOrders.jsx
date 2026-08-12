import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { Package, Search, ChevronLeft, ChevronRight, Loader2, Eye, X } from 'lucide-react';
import './SuperAdminDashboard.css';

const SuperAdminOrders = () => {
  const { url, token, formatCurrency } = useContext(StoreContext);

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 10,
        search: search.trim(),
        status: statusFilter
      });

      const response = await fetch(`${url}/api/super-admin/orders?${queryParams}`, {
        headers: { token }
      });
      const data = await response.json();

      if (data.success) {
        setOrders(data.data);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders(1);
    }
  }, [token, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders(1);
  };

  return (
    <div className="sa-dashboard-container">
      <div className="sa-header-hero">
        <div className="hero-text font-bold">
          <h1><Package size={24} color="#a78bfa" /> Platform Orders Management</h1>
          <p>Inspect customer orders across all platform restaurants ({totalCount} Orders).</p>
        </div>
      </div>

      <div className="sa-section-card">
        <div className="section-card-header flex-col-sm">
          <form onSubmit={handleSearchSubmit} className="sa-search-form">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by Order ID, customer, email, restaurant..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          <div className="status-filter-pills">
            {['all', 'Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'].map(st => (
              <button
                key={st}
                className={`filter-pill ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="sa-loading-box">
            <Loader2 size={32} className="spin-icon" />
            <p>Loading Platform Orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-stuck-box">
            <Package size={36} color="#6b7280" />
            <p>No orders found matching filter criteria.</p>
          </div>
        ) : (
          <div className="stuck-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Restaurant</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td><strong>#{o.id}</strong></td>
                    <td>
                      <div className="table-rest-cell">
                        <span>{o.restaurant_name || `Restaurant #${o.restaurant_id}`}</span>
                      </div>
                    </td>
                    <td>
                      <div className="table-user-cell">
                        <span>{o.first_name} {o.last_name}</span>
                        <small>{o.email}</small>
                      </div>
                    </td>
                    <td><strong>₹{Number(o.amount).toFixed(2)}</strong></td>
                    <td>
                      <span className="payment-pill">
                        {(o.payment_method || 'cod').toUpperCase()} ({o.payment_status})
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge-pill ${o.order_status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {o.order_status}
                      </span>
                    </td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn-action-view" onClick={() => setSelectedOrder(o)}>
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="sa-pagination">
            <button disabled={currentPage <= 1} onClick={() => fetchOrders(currentPage - 1)}>
              <ChevronLeft size={16} /> Prev
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage >= totalPages} onClick={() => fetchOrders(currentPage + 1)}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="sa-modal-card order-modal">
            <div className="modal-top-bar">
              <h3>Order #{selectedOrder.id} Details</h3>
              <button className="btn-close-modal" onClick={() => setSelectedOrder(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="order-modal-body">
              <p><strong>Restaurant:</strong> {selectedOrder.restaurant_name} (ID #{selectedOrder.restaurant_id})</p>
              <p><strong>Customer:</strong> {selectedOrder.first_name} {selectedOrder.last_name} ({selectedOrder.email})</p>
              <p><strong>Address:</strong> {selectedOrder.street}, {selectedOrder.city}, {selectedOrder.state} {selectedOrder.zip_code}</p>
              <p><strong>Payment:</strong> {(selectedOrder.payment_method || 'cod').toUpperCase()} ({selectedOrder.payment_status})</p>

              <h4>Ordered Items ({selectedOrder.items?.length || 0})</h4>
              <ul className="order-items-list">
                {selectedOrder.items?.map((it, idx) => (
                  <li key={idx}>
                    <span>{it.name} x {it.quantity}</span>
                    <span>₹{(Number(it.price) * Number(it.quantity)).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              <div className="order-modal-total">
                <span>Total Amount:</span>
                <strong>₹{Number(selectedOrder.amount).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminOrders;
