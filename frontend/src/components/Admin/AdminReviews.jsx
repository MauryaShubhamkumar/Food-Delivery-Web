import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import {
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Star,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  User,
  ShoppingBag
} from 'lucide-react';
import './AdminReviews.css';

const RATING_FILTER_OPTIONS = [
  { label: 'All Ratings', value: 'All' },
  { label: '5 Stars', value: '5' },
  { label: '4 Stars', value: '4' },
  { label: '3 Stars', value: '3' },
  { label: '2 Stars', value: '2' },
  { label: '1 Star', value: '1' }
];

const STATUS_FILTER_OPTIONS = [
  { label: 'All Statuses', value: 'All' },
  { label: 'Visible', value: 'Visible' },
  { label: 'Hidden', value: 'Hidden' }
];

const AdminReviews = () => {
  const { url, token } = useContext(StoreContext);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRating, setSelectedRating] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);

  // Modal Delete State
  const [deleteTargetReview, setDeleteTargetReview] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdminReviews = async (p = page) => {
    setLoading(true);
    setError('');
    try {
      const endpoint = `${url}/api/admin/reviews?search=${encodeURIComponent(searchQuery)}&status=${encodeURIComponent(selectedStatus)}&rating=${encodeURIComponent(selectedRating)}&page=${p}&limit=12`;
      const response = await fetch(endpoint, {
        headers: { token }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setReviews(data.data || []);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
        setTotalReviews(data.total || 0);
      } else {
        setError(data.message || 'Failed to fetch customer reviews');
      }
    } catch (err) {
      setError('Network connection error fetching customer reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminReviews(1);
    }
  }, [token, searchQuery, selectedRating, selectedStatus]);

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleToggleStatus = async (reviewId, currentStatus) => {
    const targetStatus = currentStatus === 'visible' ? 'hidden' : 'visible';
    try {
      const response = await fetch(`${url}/api/admin/reviews/${reviewId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({ status: targetStatus })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        triggerSuccess(`Review #${reviewId} is now marked as "${targetStatus}".`);
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: targetStatus } : r));
      } else {
        alert(data.message || 'Failed to update review status');
      }
    } catch (err) {
      alert('Network error updating review status');
    }
  };

  const handleDeleteReview = async () => {
    if (!deleteTargetReview) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${url}/api/admin/reviews/${deleteTargetReview.id}`, {
        method: 'DELETE',
        headers: { token }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        triggerSuccess(`Review #${deleteTargetReview.id} permanently deleted.`);
        setDeleteTargetReview(null);
        await fetchAdminReviews(page);
      } else {
        alert(data.message || 'Failed to delete review');
      }
    } catch (err) {
      alert('Network error deleting review');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-reviews-page">
      {/* Top Header */}
      <div className="admin-reviews-header">
        <div>
          <h1 className="admin-reviews-title">Customer Reviews & Moderation</h1>
          <p className="admin-reviews-subtitle">Monitor customer feedback, ratings, and moderate inappropriate comments.</p>
        </div>

        <button className="refresh-reviews-btn" onClick={() => fetchAdminReviews(page)} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> {loading ? 'Updating...' : 'Refresh List'}
        </button>
      </div>

      {/* Alerts */}
      {successMsg && <div className="alert-banner alert-success"><CheckCircle2 size={16} /> {successMsg}</div>}
      {error && <div className="alert-banner alert-error"><AlertTriangle size={16} /> {error}</div>}

      {/* Filters Bar */}
      <div className="reviews-filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search customer name, email, product, or comment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-dropdowns">
          <div className="dropdown-group">
            <label htmlFor="rating-filter">Rating:</label>
            <select
              id="rating-filter"
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
            >
              {RATING_FILTER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="dropdown-group">
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {STATUS_FILTER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reviews Table / Content */}
      {loading ? (
        <div className="admin-reviews-loading">
          <div className="loading-spinner"></div>
          <p>Loading customer reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="admin-reviews-empty">
          <MessageSquare size={44} color="#94a3b8" />
          <h3>No customer reviews found</h3>
          <p>Try adjusting your search query or filter selection.</p>
        </div>
      ) : (
        <div className="admin-reviews-table-wrapper">
          <table className="admin-reviews-table">
            <thead>
              <tr>
                <th>Review ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Order #</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((rev) => {
                const dateStr = new Date(rev.created_at || Date.now()).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });
                const isHidden = rev.status === 'hidden';

                return (
                  <tr key={rev.id} className={isHidden ? 'row-hidden' : ''}>
                    <td><span className="rev-id-badge">#{rev.id}</span></td>
                    <td>
                      <div className="user-info-cell">
                        <strong>{rev.userName || rev.customer_name || 'Guest User'}</strong>
                        <span className="user-email-text">{rev.userEmail || rev.customer_email || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="product-info-cell">
                        <strong>{rev.productName || rev.product_name || (rev.productId || rev.product_id ? `Product #${rev.productId || rev.product_id}` : 'Product unavailable')}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="stars-cell">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={13}
                            fill={star <= rev.rating ? '#f59e0b' : 'none'}
                            color={star <= rev.rating ? '#f59e0b' : '#cbd5e1'}
                          />
                        ))}
                        <span className="rating-val-text">{rev.rating}/5</span>
                      </div>
                    </td>
                    <td>
                      <p className="comment-cell-text" title={rev.comment}>
                        {rev.comment}
                      </p>
                    </td>
                    <td><span className="order-link-badge">#{rev.orderId || rev.order_id || '—'}</span></td>
                    <td>
                      <span className={`status-pill pill-${rev.status}`}>
                        ● {rev.status}
                      </span>
                    </td>
                    <td><span className="date-cell">{dateStr}</span></td>
                    <td>
                      <div className="review-actions-group">
                        <button
                          className={`btn-action ${isHidden ? 'btn-show' : 'btn-hide'}`}
                          onClick={() => handleToggleStatus(rev.id, rev.status)}
                          title={isHidden ? 'Unhide / Show on Store' : 'Hide from Public Store'}
                        >
                          {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                          {isHidden ? 'Show' : 'Hide'}
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => setDeleteTargetReview(rev)}
                          title="Permanently Delete Review"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          <button
            className="btn-page"
            disabled={page <= 1 || loading}
            onClick={() => fetchAdminReviews(page - 1)}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <span className="page-indicator">Page {page} of {totalPages} ({totalReviews} total)</span>
          <button
            className="btn-page"
            disabled={page >= totalPages || loading}
            onClick={() => fetchAdminReviews(page + 1)}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetReview && (
        <div className="review-modal-overlay" onClick={() => setDeleteTargetReview(null)}>
          <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <div className="warning-icon-wrapper"><AlertTriangle size={24} color="#ef4444" /></div>
              <h3>Delete Customer Review #{deleteTargetReview.id}?</h3>
            </div>
            <div className="delete-modal-body">
              <p>Are you sure you want to permanently delete this review from <strong>{deleteTargetReview.userName}</strong> for <strong>{deleteTargetReview.productName}</strong>?</p>
              <div className="review-preview-quote">
                "{deleteTargetReview.comment}"
              </div>
              <span className="danger-text-warning">This action cannot be undone.</span>
            </div>
            <div className="delete-modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setDeleteTargetReview(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn-confirm-delete"
                onClick={handleDeleteReview}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
