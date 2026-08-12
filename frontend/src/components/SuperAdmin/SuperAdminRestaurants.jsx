import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import {
  Building2,
  Search,
  ExternalLink,
  Power,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Store,
  UserCheck
} from 'lucide-react';
import './SuperAdminDashboard.css';

const SuperAdminRestaurants = () => {
  const { url, token, startImpersonation } = useContext(StoreContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [impersonatingId, setImpersonatingId] = useState(null);

  const handleImpersonate = async (restaurantId) => {
    setImpersonatingId(restaurantId);
    const res = await startImpersonation(restaurantId);
    setImpersonatingId(null);
    if (res.success) {
      navigate('/admin');
    } else {
      setAlertMsg(res.message || "Failed to start impersonation mode.");
    }
  };

  // Deactivation confirmation modal state
  const [selectedRest, setSelectedRest] = useState(null);
  const [modalAction, setModalAction] = useState(null); // 'activate' | 'deactivate'
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  const fetchRestaurants = async (page = 1) => {
    setLoading(true);
    setAlertMsg('');
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 10,
        search: search.trim(),
        status: statusFilter
      });

      const response = await fetch(`${url}/api/super-admin/restaurants?${queryParams}`, {
        headers: { token }
      });
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setRestaurants(data.data);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
        setTotalCount(data.totalCount || 0);
      } else {
        setRestaurants([]);
      }
    } catch (err) {
      setAlertMsg("Error loading platform restaurants.");
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRestaurants(1);
    }
  }, [token, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRestaurants(1);
  };

  const handleToggleStatus = async () => {
    if (!selectedRest || !modalAction) return;

    setSubmitting(true);
    const newStatus = modalAction === 'activate' ? 'active' : 'inactive';

    try {
      const response = await fetch(`${url}/api/super-admin/restaurants/${selectedRest.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          token
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();

      if (data.success) {
        setSelectedRest(null);
        setModalAction(null);
        await fetchRestaurants(currentPage);
      } else {
        setAlertMsg(data.message || "Failed to update status.");
      }
    } catch (err) {
      setAlertMsg("Error updating restaurant status.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sa-dashboard-container">
      <div className="sa-header-hero">
        <div className="hero-text font-bold">
          <h1><Building2 size={24} color="#a78bfa" /> Restaurant Management</h1>
          <p>Inspect, manage, and monitor all platform restaurants ({totalCount} Total).</p>
        </div>
      </div>

      {alertMsg && (
        <div className="sa-alert error">
          <AlertTriangle size={18} /> {alertMsg}
        </div>
      )}

      <div className="sa-section-card">
        {/* Controls Bar */}
        <div className="section-card-header flex-col-sm">
          <form onSubmit={handleSearchSubmit} className="sa-search-form">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by restaurant name, slug, email, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          <div className="status-filter-pills">
            {['all', 'active', 'setup', 'inactive'].map(st => (
              <button
                key={st}
                className={`filter-pill ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="sa-loading-box">
            <Loader2 size={32} className="spin-icon" />
            <p>Loading Restaurants...</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="empty-stuck-box">
            <Store size={36} color="#6b7280" />
            <p>No restaurants found matching filter criteria.</p>
          </div>
        ) : (
          <div className="stuck-table-wrapper">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Restaurant</th>
                  <th>Owner</th>
                  <th>Menu Items</th>
                  <th>Orders</th>
                  <th>GMV Revenue</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="table-rest-cell">
                        <strong>{r.name}</strong>
                        <code>{r.slug}</code>
                      </div>
                    </td>
                    <td>
                      <div className="table-user-cell">
                        <span>{r.owner_name || 'Unassigned'}</span>
                        <small>{r.owner_email || r.email || ''}</small>
                      </div>
                    </td>
                    <td>{r.product_count} items</td>
                    <td>{r.order_count} orders</td>
                    <td><strong>₹{Number(r.gmv).toFixed(2)}</strong></td>
                    <td>
                      <span className={`status-badge-pill ${r.status || 'setup'}`}>
                        {String(r.status || 'setup').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-cell">
                        <button
                          className="btn-impersonate-owner"
                          onClick={() => handleImpersonate(r.id)}
                          disabled={impersonatingId === r.id}
                          title={`Impersonate & log in as owner of ${r.name}`}
                        >
                          {impersonatingId === r.id ? <Loader2 size={13} className="spin-icon" /> : <UserCheck size={13} />} Log in as Owner
                        </button>

                        {r.status === 'active' && (
                          <a
                            href={`/r/${r.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-store-link"
                            title="View Public Storefront"
                          >
                            <ExternalLink size={14} /> Storefront
                          </a>
                        )}

                        {r.status === 'active' ? (
                          <button
                            className="btn-status-toggle deactivate"
                            onClick={() => {
                              setSelectedRest(r);
                              setModalAction('deactivate');
                            }}
                          >
                            <Power size={13} /> Deactivate
                          </button>
                        ) : (
                          <button
                            className="btn-status-toggle activate"
                            onClick={() => {
                              setSelectedRest(r);
                              setModalAction('activate');
                            }}
                          >
                            <Power size={13} /> Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="sa-pagination">
            <button
              disabled={currentPage <= 1}
              onClick={() => fetchRestaurants(currentPage - 1)}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => fetchRestaurants(currentPage + 1)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {selectedRest && modalAction && (
        <div className="modal-overlay">
          <div className="sa-modal-card">
            <div className="modal-icon-warning">
              <AlertTriangle size={36} />
            </div>
            <h3>{modalAction === 'deactivate' ? 'Deactivate Restaurant?' : 'Activate Restaurant?'}</h3>
            <p>
              {modalAction === 'deactivate'
                ? `"${selectedRest.name}" will no longer accept new customer orders or appear on public search. Existing orders and data will be preserved.`
                : `"${selectedRest.name}" will become active and available to accept customer orders.`}
            </p>

            <div className="modal-actions-row">
              <button
                className={`btn-confirm-action ${modalAction}`}
                onClick={handleToggleStatus}
                disabled={submitting}
              >
                {submitting ? <Loader2 size={16} className="spin-icon" /> : null}
                {modalAction === 'deactivate' ? 'Deactivate Restaurant' : 'Activate Restaurant'}
              </button>
              <button
                className="btn-cancel-modal"
                onClick={() => {
                  setSelectedRest(null);
                  setModalAction(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminRestaurants;
