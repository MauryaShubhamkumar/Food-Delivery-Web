import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { Upload, X } from 'lucide-react';
import './ProductModal.css';

const DEFAULT_CATEGORIES = [
  "Salad", "Rolls", "Deserts", "Sandwich", "Cake",
  "Pure Veg", "Pasta", "Noodles", "Pizza", "Burger", "Sushi", "Biryani"
];

const ProductModal = ({ isOpen, onClose, onSave, product }) => {
  const { categories: dynamicCategories } = useContext(StoreContext);
  const categoriesList = dynamicCategories && dynamicCategories.length > 0
    ? dynamicCategories.map(c => c.name)
    : DEFAULT_CATEGORIES;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: categoriesList[0] || 'Salad',
    available: true,
    imageUrl: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price !== undefined ? product.price : '',
        category: product.category || 'Salad',
        available: product.available !== undefined ? Boolean(product.available) : true,
        imageUrl: product.image && product.image.startsWith('http') ? product.image : ''
      });
      setImagePreview(product.image || '');
      setImageFile(null);
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'Salad',
        available: true,
        imageUrl: ''
      });
      setImagePreview('');
      setImageFile(null);
    }
    setErrorMsg('');
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name || formData.name.trim() === '') {
      setErrorMsg('Food item name is required');
      return;
    }

    if (formData.price === '' || isNaN(formData.price) || Number(formData.price) < 0) {
      setErrorMsg('Valid price (≥ 0) is required');
      return;
    }

    if (!formData.category) {
      setErrorMsg('Category selection is required');
      return;
    }

    const payload = new FormData();
    payload.append('name', formData.name.trim());
    payload.append('description', formData.description ? formData.description.trim() : '');
    payload.append('price', Number(formData.price));
    payload.append('category', formData.category);
    payload.append('available', formData.available);

    if (imageFile) {
      payload.append('image', imageFile);
    } else if (formData.imageUrl) {
      payload.append('imageUrl', formData.imageUrl.trim());
    }

    try {
      setSubmitting(true);
      await onSave(payload, product ? product.id : null);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="product-modal-backdrop" onClick={onClose}>
      <div className="product-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="product-modal-header">
          <h3>{product ? 'Edit Food Item' : 'Add New Food Item'}</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close modal"><X size={16} /></button>
        </div>

        {errorMsg ? <div className="modal-error-alert">{errorMsg}</div> : null}

        <form onSubmit={handleSubmit} className="product-modal-form">
          <div className="form-group">
            <label htmlFor="name">Food Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Pepperoni Pizza"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price (₹) *</label>
              <input
                type="number"
                id="price"
                name="price"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleChange}
                placeholder="199"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detailed description of ingredients and taste..."
            ></textarea>
          </div>

          <div className="form-group">
            <label>Food Image</label>
            <div className="image-upload-wrapper">
              <input
                type="file"
                id="image-file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
              />
              <label htmlFor="image-file" className="file-upload-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={14} /> {imageFile ? imageFile.name : 'Choose Image File'}
              </label>

              {imagePreview ? (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Preview" className="modal-img-preview" />
                  <span className="preview-label">Preview</span>
                </div>
              ) : null}
            </div>

            <div className="or-divider"><span>OR Image URL</span></div>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/photo-..."
              disabled={Boolean(imageFile)}
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="available"
                checked={formData.available}
                onChange={handleChange}
              />
              <span className="checkmark"></span>
              Is Available for Customer Orders
            </label>
          </div>

          <div className="product-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={submitting}>
              {submitting ? 'Saving...' : product ? 'Save Changes' : 'Add Food Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
