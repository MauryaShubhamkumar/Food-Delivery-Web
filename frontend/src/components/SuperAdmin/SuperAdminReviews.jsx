import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { MessageSquare, Star, Search, ChevronLeft, ChevronRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import './SuperAdminDashboard.css';

const SuperAdminReviews = () => {
  const { url, token } = useContext(StoreContext);

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [ratingFilter, setRatingFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchReviews = async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 10,
        rating: ratingFilter,
        search: search.trim()
      });

      const response = await fetch(`${url}/api/super-admin/reviews?${queryParams}`, {
        headers: { token }
      });
      const data = await response.json();

      if (data.success) {
        setReviews(data.data);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchReviews(1);
    }
  }, [token, ratingFilter]);

  const handleToggleVisibility = async (reviewId) => {
    try {
      const response = await fetch(`${url}/api/super-admin/reviews/${reviewId}/visibility`, {
        method: "PUT",
        headers: { token }
      });
      const data = await response.json();

      if (data.success) {
        await fetchReviews(currentPage);
      }
    } catch (err) {
      console.error("Error toggling review visibility:", err);
    }
  };

  return (
    <div className="sa-dashboard-container">
      <div className="sa-header-hero">
        <div className="hero-text font-bold">
          <h1><MessageSquare size={24} color="#a78bfa" /> Platform Reviews Moderation</h1>
          <p>Moderate customer reviews across all platform restaurants ({totalCount} Reviews).</p>
        </div>
      </div>

      <div className="sa-section-card">
        <div className="section-card-header flex-col-sm">
          <form onSubmit={e => { e.preventDefault(); fetchReviews(1); }} className="sa-search-form">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by comment, restaurant, item, reviewer..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          <div className="status-filter-pills">
            {['all', '5', '4', '3', '2', '1'].map(rt => (
              <button
                key={rt}
                className={`filter-pill ${ratingFilter === rt ? 'active' : ''}`}
                onClick={() => setRatingFilter(rt)}
              >
                {rt === 'all' ? 'All Ratings' : `${rt} ⭐`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="sa-loading-box">
            <Loader2 size={32} className="spin-icon" />
            <p>Loading Reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="empty-stuck-box">
            <MessageSquare size={36} color="#6b7280" />
            <p>No reviews found matching filter criteria.</p>
          </div>
        ) : (
          <div className="stuck-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Restaurant & Item</th>
                  <th>Reviewer</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Visibility</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="table-rest-cell">
                        <strong>{r.restaurant_name || `Restaurant #${r.restaurant_id}`}</strong>
                        <small>{r.food_name || `Product #${r.food_id}`}</small>
                      </div>
                    </td>
                    <td>
                      <div className="table-user-cell">
                        <span>{r.user_name || 'Anonymous'}</span>
                        <small>{r.user_email || ''}</small>
                      </div>
                    </td>
                    <td>
                      <span className="rating-pill">
                        <Star size={12} fill="#f59e0b" color="#f59e0b" /> {r.rating}
                      </span>
                    </td>
                    <td><p className="comment-clamp">{r.comment}</p></td>
                    <td>
                      <span className={`status-badge-pill ${r.is_visible ? 'active' : 'inactive'}`}>
                        {r.is_visible ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn-action-view"
                        onClick={() => handleToggleVisibility(r.id)}
                      >
                        {r.is_visible ? <EyeOff size={13} /> : <Eye size={13} />} {r.is_visible ? 'Hide' : 'Show'}
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
            <button disabled={currentPage <= 1} onClick={() => fetchReviews(currentPage - 1)}>
              <ChevronLeft size={16} /> Prev
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage >= totalPages} onClick={() => fetchReviews(currentPage + 1)}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminReviews;
