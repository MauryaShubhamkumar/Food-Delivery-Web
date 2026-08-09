import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import CategoryModal from './CategoryModal';
import { Plus, Search, X, CheckCircle2, AlertTriangle, FolderTree, Edit2, Trash2 } from 'lucide-react';
import './AdminCategories.css';

const AdminCategories = () => {
  const { url, token, loadCategories } = useContext(StoreContext);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchAdminCategories = async (showSkeleton = false) => {
    if (showSkeleton) setLoading(true);
    setError('');
    try {
      const endpoint = `${url}/api/admin/categories?search=${encodeURIComponent(debouncedSearchQuery)}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { token: token }
      });
      const data = await response.json();

      if (data.success) {
        setCategories(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch categories');
      }
    } catch (err) {
      setError('Network connection error while fetching categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminCategories(categories.length === 0);
    }
  }, [token, debouncedSearchQuery]);

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (catData, catId) => {
    let endpoint = `${url}/api/admin/categories`;
    let method = 'POST';

    if (catId) {
      endpoint += `/${catId}`;
      method = 'PUT';
    }

    const response = await fetch(endpoint, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        token: token
      },
      body: JSON.stringify(catData)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Error saving category');
    }

    triggerSuccess(data.message || 'Category saved successfully!');
    await fetchAdminCategories();
    if (loadCategories) await loadCategories(); // Sync storefront categories
  };

  const handleToggleStatus = async (catId) => {
    try {
      const response = await fetch(`${url}/api/admin/categories/${catId}/status`, {
        method: 'PATCH',
        headers: { token: token }
      });
      const data = await response.json();
      if (data.success) {
        triggerSuccess(data.message);
        await fetchAdminCategories();
        if (loadCategories) await loadCategories();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to update category status');
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }
    setError('');
    try {
      const response = await fetch(`${url}/api/admin/categories/${cat.id}`, {
        method: 'DELETE',
        headers: { token: token }
      });
      const data = await response.json();

      if (data.success) {
        triggerSuccess(data.message);
        await fetchAdminCategories();
        if (loadCategories) await loadCategories();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to delete category');
    }
  };

  return (
    <div className="admin-categories-page">
      {/* Top Header */}
      <div className="admin-categories-header">
        <div>
          <h1 className="admin-categories-title">Category Management</h1>
          <p className="admin-categories-subtitle">Organize menu categories, active visibility, and assigned product counts.</p>
        </div>
        <button className="add-category-btn" onClick={handleOpenAddModal} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Success Alert */}
      {successMsg ? (
        <div className="alert-banner alert-success">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} /> {successMsg}</span>
          <button className="alert-close" onClick={() => setSuccessMsg('')}><X size={14} /></button>
        </div>
      ) : null}

      {/* Error / Deletion Warning Alert */}
      {error ? (
        <div className="alert-banner alert-error">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={16} /> {error}</span>
          <button className="alert-close" onClick={() => setError('')}><X size={14} /></button>
        </div>
      ) : null}

      {/* Search Bar */}
      <div className="categories-controls-bar">
        <div className="search-input-group" style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1', maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search categories by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="categories-search-input"
          />
          {searchQuery ? (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '12px' }}><X size={14} /></button>
          ) : null}
        </div>
      </div>

      {/* Categories Table Container */}
      <div className="table-responsive-container">
        {loading && categories.length === 0 ? (
          <div className="table-loading-skeleton">
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="no-categories-found">
            <div className="empty-icon"><FolderTree size={40} color="#94a3b8" /></div>
            <h3>No Categories Found</h3>
            <p>Click "+ Add Category" to create your first menu category.</p>
          </div>
        ) : (
          <table className="categories-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Description</th>
                <th>Assigned Products</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className={!cat.is_active ? 'row-inactive' : ''}>
                  <td>
                    <span className="category-name-title">{cat.name}</span>
                  </td>
                  <td>
                    <span className="category-desc-text">{cat.description || 'No description'}</span>
                  </td>
                  <td>
                    <span className={`product-count-badge ${cat.product_count > 0 ? 'has-products' : 'zero-products'}`}>
                      {cat.product_count} product{cat.product_count !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`status-toggle-btn ${cat.is_active ? 'available' : 'unavailable'}`}
                      onClick={() => handleToggleStatus(cat.id)}
                      title="Click to toggle visibility"
                    >
                      <span className="status-dot"></span>
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleOpenEditModal(cat)}
                        title="Edit category"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteCategory(cat)}
                        title="Delete category"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCategory}
        category={editingCategory}
      />
    </div>
  );
};

export default AdminCategories;
