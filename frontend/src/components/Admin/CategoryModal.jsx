import React, { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import './CategoryModal.css';

const CategoryModal = ({ isOpen, onClose, onSave, category }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        is_active: category.is_active !== undefined ? Boolean(category.is_active) : true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        is_active: true
      });
    }
    setErrorMsg('');
  }, [category, isOpen]);

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

    if (!formData.name || formData.name.trim() === '') {
      setErrorMsg('Category name is required');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        name: formData.name.trim(),
        description: formData.description ? formData.description.trim() : '',
        is_active: formData.is_active
      }, category ? category.id : null);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="category-modal-backdrop" onClick={onClose}>
      <div className="category-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="category-modal-header">
          <h3>{category ? 'Edit Category' : 'Add New Category'}</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close modal"><X size={16} /></button>
        </div>

        {errorMsg ? (
          <div className="modal-error-alert" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} /> {errorMsg}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="category-modal-form">
          <div className="form-group">
            <label htmlFor="name">Category Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Desserts, Beverages, Pizza"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief summary of foods included in this category..."
            ></textarea>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              Active Category (Visible to customers)
            </label>
          </div>

          <div className="category-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={submitting}>
              {submitting ? 'Saving...' : category ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
