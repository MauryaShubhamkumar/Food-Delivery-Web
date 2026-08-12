import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { Users, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import './SuperAdminDashboard.css';

const SuperAdminUsers = () => {
  const { url, token } = useContext(StoreContext);

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

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

      if (data.success) {
        setUsers(data.data);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error("Error loading users:", err);
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

  return (
    <div className="sa-dashboard-container">
      <div className="sa-header-hero">
        <div className="hero-text font-bold">
          <h1><Users size={24} color="#a78bfa" /> Platform Users Management</h1>
          <p>Inspect all registered users, roles, and restaurant associations ({totalCount} Accounts).</p>
        </div>
      </div>

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
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
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
                  </tr>
                ))}
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
