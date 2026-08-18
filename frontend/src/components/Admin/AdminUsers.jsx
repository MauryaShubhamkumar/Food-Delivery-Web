import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import UserDetailsModal from './UserDetailsModal';
import { RefreshCw, Search, X, CheckCircle2, AlertTriangle, Users, Eye } from 'lucide-react';
import './AdminUsers.css';

const AdminUsers = () => {
  const { url, token } = useContext(StoreContext);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const fetchAdminUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = `${url}/api/admin/users?search=${encodeURIComponent(searchQuery)}&status=${encodeURIComponent(selectedStatus)}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { token: token }
      });
      const data = await response.json();

      if (data.success) {
        setUsers(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch customer list');
      }
    } catch (err) {
      setError('Network connection error while fetching customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminUsers();
    }
  }, [token, searchQuery, selectedStatus]);

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleOpenDetails = (userId) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };

  return (
    <div className="admin-users-page">
      {/* Top Header */}
      <div className="admin-users-header">
        <div>
          <h1 className="admin-users-title">Customer Management</h1>
          <p className="admin-users-subtitle">View registered customers, total spending, order history, and account status.</p>
        </div>
        <button className="refresh-users-btn" onClick={fetchAdminUsers} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> {loading ? 'Refreshing...' : 'Refresh List'}
        </button>
      </div>

      {/* Success Alert */}
      {successMsg ? (
        <div className="alert-banner alert-success">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} /> {successMsg}</span>
          <button className="alert-close" onClick={() => setSuccessMsg('')}><X size={14} /></button>
        </div>
      ) : null}

      {/* Error Alert */}
      {error ? (
        <div className="alert-banner alert-error">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={16} /> {error}</span>
          <button className="alert-close" onClick={() => setError('')}><X size={14} /></button>
        </div>
      ) : null}

      {/* Search & Filter Bar */}
      <div className="users-controls-bar">
        <div className="search-input-group" style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1', maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="users-search-input"
          />
          {searchQuery ? (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '12px' }}><X size={14} /></button>
          ) : null}
        </div>

        <div className="filter-dropdown-group">
          <label htmlFor="user-status-filter">Status:</label>
          <select
            id="user-status-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Customers Table / Cards Container */}
      <div className="table-responsive-container">
        {loading ? (
          <div className="table-loading-skeleton">
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="no-users-found">
            <div className="empty-icon"><Users size={40} color="#94a3b8" /></div>
            <h3>No Customers Found</h3>
            <p>Try clearing your search or status filter parameters.</p>
          </div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Email Address</th>
                <th>Orders Placed</th>
                <th>Total Spent</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={!user.isActive ? 'user-row-inactive' : ''}>
                  <td>
                    <span className="user-name-title">{user.name}</span>
                  </td>
                  <td>
                    <span className="user-email-text">{user.email}</span>
                  </td>
                  <td>
                    <span className="user-orders-count">{user.totalOrders} order{user.totalOrders !== 1 ? 's' : ''}</span>
                  </td>
                  <td>
                    <span className="user-spent-amount">₹{Number(user.totalSpent).toFixed(2)}</span>
                  </td>
                  <td>
                    <span className={`user-status-pill ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                      ● {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-view-user"
                      onClick={() => handleOpenDetails(user.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={13} /> View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Customer Details Modal */}
      <UserDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={selectedUserId}
      />
    </div>
  );
};

export default AdminUsers;
