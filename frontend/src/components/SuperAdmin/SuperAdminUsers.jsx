import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { Users, Search, ChevronLeft, ChevronRight, Loader2, UserCheck, UserX, AlertCircle, CheckCircle2 } from 'lucide-react';
import './SuperAdminDashboard.css';

const SuperAdminUsers = () => {
  const { url, token, user: currentSuperAdmin } = useContext(StoreContext);

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 10,
        search: search.trim(),
        role: roleFilter
      });

      const response = await fetch(`${url}/api/super-admin/users?${queryParams}`, {
        headers: { token }
      });
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
        setTotalCount(data.totalCount || 0);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Error loading users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers(1);
    }
  }, [token, roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const formatRoleLabel = (role) => {
    if (role === 'super_admin') return 'Super Admin';
    if (role === 'restaurant_owner') return 'Restaurant Owner';
    return 'Customer';
  };

  const handleToggleUserStatus = async (targetUser) => {
    const targetStatus = !targetUser.is_active;
    const actionText = targetStatus ? 'activate' : 'deactivate';

    if (Number(targetUser.id) === Number(currentSuperAdmin?.id)) {
      showToast("You cannot deactivate your own Super Admin account.", "error");
      return;
    }

    if (!window.confirm(`Are you sure you want to ${actionText} ${targetUser.name}'s account (${targetUser.email})?`)) {
      return;
    }

    setActionLoadingId(targetUser.id);
    try {
      const response = await fetch(`${url}/api/super-admin/users/${targetUser.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          token
        },
        body: JSON.stringify({ isActive: targetStatus })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast(`User account "${targetUser.name}" ${targetStatus ? 'activated' : 'deactivated'} successfully.`, 'success');
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, is_active: targetStatus } : u));
      } else {
        showToast(data.message || `Failed to ${actionText} user account.`, 'error');
      }
    } catch (err) {
      showToast("Network error while updating user account status.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="sa-dashboard-container">
      <div className="sa-header-hero">
        <div className="hero-text font-bold">
          <h1><Users size={24} color="#a78bfa" /> Platform Users Management</h1>
          <p>Inspect and manage all registered users, roles, account activation/deactivation ({totalCount} Accounts).</p>
        </div>
      </div>

      {toastMsg && (
        <div className={`sa-toast-banner ${toastType === 'error' ? 'toast-error' : 'toast-success'}`} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          background: toastType === 'error' ? '#fef2f2' : '#f0fdf4',
          color: toastType === 'error' ? '#dc2626' : '#16a34a',
          border: `1px solid ${toastType === 'error' ? '#fca5a5' : '#86efac'}`,
          fontWeight: '600',
          fontSize: '14px'
        }}>
          {toastType === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="sa-section-card">
        <div className="section-card-header flex-col-sm">
          <form onSubmit={handleSearchSubmit} className="sa-search-form">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by user name, email, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          <div className="status-filter-pills">
            {[
              { id: 'all', label: 'All' },
              { id: 'customer', label: 'Customers' },
              { id: 'restaurant_owner', label: 'Owners' },
              { id: 'super_admin', label: 'Super Admin' }
            ].map(r => (
              <button
                key={r.id}
                className={`filter-pill ${roleFilter === r.id ? 'active' : ''}`}
                onClick={() => setRoleFilter(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="sa-loading-box">
            <Loader2 size={32} className="spin-icon" />
            <p>Loading Platform Users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-stuck-box">
            <Users size={36} color="#6b7280" />
            <p>No users found matching filter criteria.</p>
          </div>
        ) : (
          <div className="stuck-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Role</th>
                  <th>Assigned Restaurant</th>
                  <th>Account Status</th>
                  <th>Registered Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isCurrentAdmin = Number(u.id) === Number(currentSuperAdmin?.id);
                  const isActionLoading = actionLoadingId === u.id;

                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="table-user-cell">
                          <strong>{u.name}</strong>
                          <small>{u.email}</small>
                          {u.phone && <small>{u.phone}</small>}
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge-pill ${u.role}`}>
                          {formatRoleLabel(u.role)}
                        </span>
                      </td>
                      <td>
                        {u.restaurant_name ? (
                          <div className="table-rest-cell">
                            <span>{u.restaurant_name}</span>
                            <code>{u.restaurant_slug}</code>
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge-pill ${u.is_active ? 'active' : 'inactive'}`}>
                          {u.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        {isCurrentAdmin ? (
                          <span className="text-muted" style={{ fontSize: '12px', fontStyle: 'italic' }}>Your Account</span>
                        ) : (
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            disabled={isActionLoading}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              border: '1px solid',
                              background: u.is_active ? '#fef2f2' : '#f0fdf4',
                              color: u.is_active ? '#dc2626' : '#16a34a',
                              borderColor: u.is_active ? '#fca5a5' : '#86efac',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {isActionLoading ? (
                              <Loader2 size={13} className="spin-icon" />
                            ) : u.is_active ? (
                              <><UserX size={13} /> Deactivate</>
                            ) : (
                              <><UserCheck size={13} /> Activate</>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="sa-pagination">
            <button disabled={currentPage <= 1} onClick={() => fetchUsers(currentPage - 1)}>
              <ChevronLeft size={16} /> Prev
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage >= totalPages} onClick={() => fetchUsers(currentPage + 1)}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminUsers;
