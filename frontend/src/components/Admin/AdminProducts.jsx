import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import ProductModal from './ProductModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import './AdminProducts.css';

const CATEGORY_OPTIONS = [
  "All", "Salad", "Rolls", "Deserts", "Sandwich", "Cake",
  "Pure Veg", "Pasta", "Noodles", "Pizza", "Burger", "Sushi", "Biryani"
];

const AdminProducts = () => {
  const { url, token, fetchFoodList } = useContext(StoreContext);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAvailability, setSelectedAvailability] = useState('All');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAdminProducts = async () => {
    setLoading(true);
    setError('');
    try {
      let endpoint = `${url}/api/admin/products?search=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(selectedCategory)}&available=${encodeURIComponent(selectedAvailability)}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { token: token }
      });
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
      } else {
        setError(data.message || 'Failed to fetch food products');
      }
    } catch (err) {
      setError('Network or server connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminProducts();
    }
  }, [token, searchQuery, selectedCategory, selectedAvailability]);

  // Show auto-expiring success message
  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  // Open Modal for Add
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  // Save Product (Add or Edit)
  const handleSaveProduct = async (formData, productId) => {
    let endpoint = `${url}/api/admin/products`;
    let method = 'POST';

    if (productId) {
      endpoint += `/${productId}`;
      method = 'PUT';
    }

    const response = await fetch(endpoint, {
      method: method,
      headers: { token: token },
      body: formData
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Error saving product');
    }

    triggerSuccess(data.message || 'Product saved successfully!');
    await fetchAdminProducts();
    await fetchFoodList(); // Sync customer menu
  };

  // Toggle Availability
  const handleToggleAvailability = async (productId) => {
    try {
      const response = await fetch(`${url}/api/admin/products/${productId}/availability`, {
        method: 'PATCH',
        headers: { token: token }
      });
      const data = await response.json();
      if (data.success) {
        triggerSuccess(data.message);
        await fetchAdminProducts();
        await fetchFoodList(); // Sync customer menu
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to update product availability');
    }
  };

  // Open Delete Confirmation
  const handleOpenDeleteModal = (product) => {
    setDeletingProduct(product);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Product
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      const response = await fetch(`${url}/api/admin/products/${deletingProduct.id}`, {
        method: 'DELETE',
        headers: { token: token }
      });
      const data = await response.json();

      if (data.success) {
        triggerSuccess(data.message);
        setIsDeleteModalOpen(false);
        setDeletingProduct(null);
        await fetchAdminProducts();
        await fetchFoodList(); // Sync customer menu
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  // Helper for rendering image src safely
  const getProductImageSrc = (imgStr) => {
    if (!imgStr) return 'https://via.placeholder.com/60?text=Food';
    if (imgStr.startsWith('http')) return imgStr;
    return `${url}/images/${imgStr}`;
  };

  return (
    <div className="admin-products-page">
      {/* Top Header Row */}
      <div className="admin-products-header">
        <div>
          <h1 className="admin-products-title">Product & Menu Management</h1>
          <p className="admin-products-subtitle">Manage food items, pricing, categories, images, and availability.</p>
        </div>
        <button className="add-food-btn" onClick={handleOpenAddModal}>
          ➕ Add New Food
        </button>
      </div>

      {/* Success Notification Banner */}
      {successMsg ? (
        <div className="alert-banner alert-success">
          <span>✅ {successMsg}</span>
          <button className="alert-close" onClick={() => setSuccessMsg('')}>✕</button>
        </div>
      ) : null}

      {/* Error Notification Banner */}
      {error ? (
        <div className="alert-banner alert-error">
          <span>⚠️ {error}</span>
          <button className="alert-close" onClick={() => setError('')}>✕</button>
        </div>
      ) : null}

      {/* Filters & Search Control Bar */}
      <div className="products-controls-bar">
        <div className="search-input-group">
          <span className="search-icon-symbol">🔍</span>
          <input
            type="text"
            placeholder="Search food by name or ingredient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="products-search-input"
          />
          {searchQuery ? (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>✕</button>
          ) : null}
        </div>

        <div className="filter-dropdown-group">
          <label>Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <label>Availability:</label>
          <select
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Status</option>
            <option value="true">Available</option>
            <option value="false">Unavailable</option>
          </select>
        </div>
      </div>

      {/* Products Table Container */}
      <div className="table-responsive-container">
        {loading ? (
          <div className="table-loading-skeleton">
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="no-products-found">
            <div className="empty-icon">🍽️</div>
            <h3>No Food Items Found</h3>
            <p>Try adjusting your search query or filter settings, or click "+ Add New Food" to create one.</p>
          </div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Food Name & Description</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item.id} className={!item.available ? 'row-unavailable' : ''}>
                  <td>
                    <img
                      src={getProductImageSrc(item.image)}
                      alt={item.name}
                      className="table-food-img"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/60?text=Food'; }}
                    />
                  </td>
                  <td>
                    <div className="table-food-title">{item.name}</div>
                    <div className="table-food-desc">{item.description || 'No description provided.'}</div>
                  </td>
                  <td>
                    <span className="category-pill">{item.category}</span>
                  </td>
                  <td>
                    <span className="price-tag">₹{Number(item.price).toFixed(2)}</span>
                  </td>
                  <td>
                    <button
                      className={`status-toggle-btn ${item.available ? 'available' : 'unavailable'}`}
                      onClick={() => handleToggleAvailability(item.id)}
                      title="Click to toggle availability"
                    >
                      <span className="status-dot"></span>
                      {item.available ? 'Active' : 'Off'}
                    </button>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleOpenEditModal(item)}
                        title="Edit product"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleOpenDeleteModal(item)}
                        title="Delete product"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        product={editingProduct}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        productName={deletingProduct ? deletingProduct.name : ''}
        deleting={deleting}
      />
    </div>
  );
};

export default AdminProducts;
