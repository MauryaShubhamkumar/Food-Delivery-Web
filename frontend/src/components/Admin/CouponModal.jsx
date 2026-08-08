import React, { useEffect, useState } from 'react';
import './CouponModal.css';

const CouponModal = ({ isOpen, onClose, onSave, coupon }) => {
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    minimum_order_amount: '',
    maximum_discount: '',
    usage_limit: '',
    expires_at: '',
    is_active: true
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (coupon) {
      const formattedDate = coupon.expires_at
        ? new Date(coupon.expires_at).toISOString().slice(0, 16)
        : '';

      setFormData({
        code: coupon.code || '',
        discount_type: coupon.discount_type || 'percentage',
        discount_value: coupon.discount_value !== undefined ? coupon.discount_value : '',
        minimum_order_amount: coupon.minimum_order_amount !== undefined ? coupon.minimum_order_amount : '',
        maximum_discount: coupon.maximum_discount !== undefined && coupon.maximum_discount !== null ? coupon.maximum_discount : '',
        usage_limit: coupon.usage_limit !== undefined && coupon.usage_limit !== null ? coupon.usage_limit : '',
        expires_at: formattedDate,
        is_active: coupon.is_active !== undefined ? Boolean(coupon.is_active) : true
      });
    } else {
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        minimum_order_amount: '0',
        maximum_discount: '',
        usage_limit: '',
        expires_at: '',
        is_active: true
      });
    }
    setErrorMsg('');
  }, [coupon, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.code || formData.code.trim() === '') {
      setErrorMsg('Coupon code is required');
      return;
    }

    if (formData.discount_value === '' || isNaN(formData.discount_value) || Number(formData.discount_value) <= 0) {
      setErrorMsg('Valid positive discount value is required');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        code: formData.code.trim().toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        minimum_order_amount: formData.minimum_order_amount ? Number(formData.minimum_order_amount) : 0,
        maximum_discount: formData.maximum_discount ? Number(formData.maximum_discount) : null,
        usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
        expires_at: formData.expires_at ? formData.expires_at : null,
        is_active: formData.is_active
      }, coupon ? coupon.id : null);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save coupon');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="coupon-modal-backdrop" onClick={onClose}>
      <div className="coupon-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="coupon-modal-header">
          <h3>{coupon ? 'Edit Coupon' : 'Create New Coupon'}</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        {errorMsg ? <div className="modal-error-alert">⚠️ {errorMsg}</div> : null}

        <form onSubmit={handleSubmit} className="coupon-modal-form">
          <div className="form-group">
            <label htmlFor="code">Coupon Code *</label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="e.g. FAST20, WELCOME100"
              style={{ textTransform: 'uppercase' }}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="discount_type">Discount Type *</label>
              <select
                id="discount_type"
                name="discount_type"
                value={formData.discount_type}
                onChange={handleChange}
                required
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="discount_value">
                Discount Value ({formData.discount_type === 'percentage' ? '%' : '₹'}) *
              </label>
              <input
                type="number"
                id="discount_value"
                name="discount_value"
                step="0.01"
                min="0.1"
                value={formData.discount_value}
                onChange={handleChange}
                placeholder={formData.discount_type === 'percentage' ? '20' : '100'}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="minimum_order_amount">Minimum Order Amount (₹)</label>
              <input
                type="number"
                id="minimum_order_amount"
                name="minimum_order_amount"
                step="1"
                min="0"
                value={formData.minimum_order_amount}
                onChange={handleChange}
                placeholder="500"
              />
            </div>

            <div className="form-group">
              <label htmlFor="maximum_discount">Max Discount Limit (₹)</label>
              <input
                type="number"
                id="maximum_discount"
                name="maximum_discount"
                step="1"
                min="0"
                value={formData.maximum_discount}
                onChange={handleChange}
                placeholder={formData.discount_type === 'percentage' ? '200 (Optional)' : 'N/A'}
                disabled={formData.discount_type === 'fixed'}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="usage_limit">Usage Limit (Max Uses)</label>
              <input
                type="number"
                id="usage_limit"
                name="usage_limit"
                step="1"
                min="1"
                value={formData.usage_limit}
                onChange={handleChange}
                placeholder="100 (Optional)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="expires_at">Expiry Date & Time</label>
              <input
                type="datetime-local"
                id="expires_at"
                name="expires_at"
                value={formData.expires_at}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              Active Coupon (Available for customer checkout)
            </label>
          </div>

          <div className="coupon-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={submitting}>
              {submitting ? 'Saving...' : coupon ? 'Save Changes' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CouponModal;
