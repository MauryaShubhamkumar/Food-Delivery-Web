import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import {
  Star,
  X,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Send,
  Loader2
} from 'lucide-react';
import './ProductReviewsModal.css';

const ProductReviewsModal = ({ isOpen, onClose, product, initialOrderId = null }) => {
  const { url, token, user } = useContext(StoreContext);

  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    distributionPct: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('recent');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Eligibility & Form State
  const [eligibility, setEligibility] = useState({ eligible: false, alreadyReviewed: false, review: null });
  const [ratingInput, setRatingInput] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentInput, setCommentInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);

  const productId = product?._id || product?.id;

  const fetchReviews = async (p = 1, sort = sortBy) => {
    if (!productId) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${url}/api/reviews/product/${productId}?page=${p}&limit=6&sort=${sort}`);
      const data = await response.json();
      if (data.success) {
        setSummary(data.summary || summary);
        setReviews(data.reviews || []);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
      } else {
        setError(data.message || 'Failed to load reviews');
      }
    } catch (err) {
      setError('Network error loading reviews');
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    if (!token || !productId) {
      setEligibility({ eligible: false, alreadyReviewed: false, review: null });
      return;
    }
    try {
      let endpoint = `${url}/api/reviews/eligibility?productId=${productId}`;
      if (initialOrderId) {
        endpoint += `&orderId=${initialOrderId}`;
      }
      const response = await fetch(endpoint, {
        headers: { token }
      });
      const data = await response.json();
      if (data.success) {
        setEligibility(data);
        if (data.alreadyReviewed && data.review) {
          setRatingInput(data.review.rating);
          setCommentInput(data.review.comment);
          setEditingReviewId(data.review.id);
        }
      }
    } catch (err) {
      // Ignore check errors
    }
  };

  useEffect(() => {
    if (isOpen && productId) {
      fetchReviews(1, sortBy);
      checkEligibility();
    }
  }, [isOpen, productId, sortBy, token]);

  if (!isOpen || !product) return null;

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Please log in to submit a review.');
      return;
    }

    if (ratingInput < 1 || ratingInput > 5) {
      alert('Please select a star rating between 1 and 5.');
      return;
    }

    if (!commentInput.trim() || commentInput.trim().length < 5) {
      alert('Please write a comment of at least 5 characters.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const isEditing = Boolean(editingReviewId);
      const targetUrl = isEditing ? `${url}/api/reviews/${editingReviewId}` : `${url}/api/reviews`;
      const method = isEditing ? 'PUT' : 'POST';

      const bodyPayload = {
        productId,
        orderId: initialOrderId || eligibility.review?.order_id,
        rating: ratingInput,
        comment: commentInput.trim()
      };

      const response = await fetch(targetUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify(bodyPayload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg(data.message || (isEditing ? 'Review updated!' : 'Review submitted!'));
        await fetchReviews(1, sortBy);
        await checkEligibility();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert(data.message || 'Failed to submit review');
      }
    } catch (err) {
      alert('Network connection error while submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOwnReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      const response = await fetch(`${url}/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { token }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg('Your review has been deleted.');
        setEditingReviewId(null);
        setCommentInput('');
        setRatingInput(5);
        await fetchReviews(1, sortBy);
        await checkEligibility();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert(data.message || 'Failed to delete review');
      }
    } catch (err) {
      alert('Network error deleting review');
    }
  };

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="review-modal-header">
          <div>
            <h2 className="review-product-name">{product.name}</h2>
            <span className="review-subtitle">Customer Ratings & Verified Product Reviews</span>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="review-modal-body">
          {/* Rating Summary Section */}
          <div className="rating-summary-card">
            <div className="overall-score-box">
              <span className="score-number">{summary.averageRating > 0 ? summary.averageRating.toFixed(1) : 'New'}</span>
              <div className="score-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    fill={star <= Math.round(summary.averageRating) ? '#f59e0b' : 'none'}
                    color={star <= Math.round(summary.averageRating) ? '#f59e0b' : '#9ca3af'}
                  />
                ))}
              </div>
              <span className="total-reviews-count">{summary.totalReviews} customer reviews</span>
            </div>

            {/* Rating Bars Breakdown */}
            <div className="rating-bars-breakdown">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = summary.distribution[stars] || 0;
                const pct = summary.distributionPct[stars] || 0;
                return (
                  <div key={stars} className="rating-bar-row">
                    <span className="bar-star-label">{stars} <Star size={12} fill="#f59e0b" color="#f59e0b" /></span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="bar-count-val">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form to Submit / Edit Review if Eligible */}
          {token && eligibility.eligible && (
            <div className="write-review-card">
              <h3>{eligibility.alreadyReviewed ? 'Edit Your Review' : 'Write a Verified Purchase Review'}</h3>
              <form onSubmit={handleSubmitReview}>
                <div className="star-input-group">
                  <span className="star-input-label">Your Rating:</span>
                  <div className="interactive-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={24}
                        className="interactive-star"
                        fill={(hoverRating || ratingInput) >= star ? '#f59e0b' : 'none'}
                        color={(hoverRating || ratingInput) >= star ? '#f59e0b' : '#9ca3af'}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRatingInput(star)}
                      />
                    ))}
                  </div>
                </div>

                <div className="comment-input-group">
                  <textarea
                    rows={3}
                    placeholder="Share your taste experience, food quality, or portion size..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    minLength={5}
                    maxLength={1000}
                    required
                  />
                  <div className="char-count">{commentInput.length}/1000 characters</div>
                </div>

                <div className="form-actions-row">
                  <button type="submit" className="btn-submit-review" disabled={submitting}>
                    {submitting ? <Loader2 size={16} className="spin-icon" /> : <Send size={16} />}
                    {submitting ? 'Submitting...' : eligibility.alreadyReviewed ? 'Update Review' : 'Submit Review'}
                  </button>

                  {eligibility.alreadyReviewed && (
                    <button
                      type="button"
                      className="btn-delete-own-review"
                      onClick={() => handleDeleteOwnReview(editingReviewId)}
                    >
                      <Trash2 size={15} /> Delete Review
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Alerts */}
          {successMsg && <div className="alert-banner alert-success"><CheckCircle2 size={16} /> {successMsg}</div>}
          {error && <div className="alert-banner alert-error"><AlertTriangle size={16} /> {error}</div>}

          {/* Reviews Controls Header */}
          <div className="reviews-section-header">
            <h3><MessageSquare size={18} /> Customer Feedback</h3>
            <div className="sort-controls">
              <label htmlFor="sort-select">Sort by:</label>
              <select id="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="recent">Most Recent</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>
          </div>

          {/* Reviews List */}
          {loading ? (
            <div className="reviews-loading">
              <Loader2 size={24} className="spin-icon" />
              <span>Loading customer reviews...</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="no-reviews-state">
              <MessageSquare size={36} color="#94a3b8" />
              <h4>No reviews yet</h4>
              <p>Be the first customer to review this dish after ordering!</p>
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.map((rev) => {
                const isOwnReview = user && String(user.id) === String(rev.userId);
                const revDate = new Date(rev.createdAt || Date.now()).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div key={rev.id} className={`review-item-card ${isOwnReview ? 'own-review-card' : ''}`}>
                    <div className="review-item-header">
                      <div className="author-info">
                        <div className="author-avatar">
                          {rev.authorName ? rev.authorName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="author-name-row">
                            <span className="author-name">{rev.authorName}</span>
                            {isOwnReview && <span className="own-badge">You</span>}
                            {rev.isVerifiedPurchase && (
                              <span className="verified-badge" title="Verified Customer Order">
                                <CheckCircle2 size={12} /> Verified Purchase
                              </span>
                            )}
                          </div>
                          <span className="review-date">{revDate}</span>
                        </div>
                      </div>

                      <div className="item-rating-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            fill={star <= rev.rating ? '#f59e0b' : 'none'}
                            color={star <= rev.rating ? '#f59e0b' : '#d1d5db'}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="review-comment-text">{rev.comment}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-bar">
              <button
                className="btn-page"
                disabled={page <= 1 || loading}
                onClick={() => fetchReviews(page - 1)}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span className="page-indicator">Page {page} of {totalPages}</span>
              <button
                className="btn-page"
                disabled={page >= totalPages || loading}
                onClick={() => fetchReviews(page + 1)}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductReviewsModal;
