import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import {
  PackageCheck,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  History,
  Loader2,
  X
} from 'lucide-react';
import './AdminInventory.css';

const AdminInventory = () => {
  const { url, token, formatCurrency } = useContext(StoreContext);

  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('updated_desc');

  // Edit stock modal state
  const [editItem, setEditItem] = useState(null);
  const [editMode, setEditMode] = useState('set'); // 'set' | 'adjust'
  const [newQuantity, setNewQuantity] = useState(0);
  const [newMinStock, setNewMinStock] = useState(5);
  const [adjustmentVal, setAdjustmentVal] = useState(0);
  const [reason, setReason] = useState('Restock');
  const [saving, setSaving] = useState(false);

  // History modal state
  const [historyItem, setHistoryItem] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchInventoryData = async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 15,
        search: search.trim(),
        status: statusFilter,
        sort: sortOption
      });

      const [listRes, summaryRes] = await Promise.all([
        fetch(`${url}/api/inventory?${queryParams}`, { headers: { token } }),
        fetch(`${url}/api/inventory/summary`, { headers: { token } })
      ]);

      const listData = await listRes.json();
      const summaryData = await summaryRes.json();

      if (listData.success) {
        setInventory(listData.data);
        setTotalPages(listData.totalPages || 1);
        setCurrentPage(listData.currentPage || 1);
        setTotalCount(listData.totalCount || 0);
      }

      if (summaryData.success) {
        setSummary(summaryData.data);
      }
    } catch (err) {
      console.error("Error loading inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchInventoryData(1);
    }
  }, [token, statusFilter, sortOption]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInventoryData(1);
  };

  const handleOpenEditModal = (item) => {
    setEditItem(item);
    setEditMode('set');
    setNewQuantity(item.quantity);
    setNewMinStock(item.minimumStock);
    setAdjustmentVal(0);
    setReason('Restock');
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (!editItem) return;

    let targetQty = newQuantity;
    if (editMode === 'adjust') {
      targetQty = Math.max(0, editItem.quantity + Number(adjustmentVal));
    }

    if (isNaN(targetQty) || targetQty < 0) {
      alert("Stock quantity cannot be negative.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${url}/api/inventory/${editItem.productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          token
        },
        body: JSON.stringify({
          quantity: targetQty,
          minimumStock: newMinStock,
          reason: reason.trim() || 'Manual stock update'
        })
      });

      const data = await response.json();
      if (data.success) {
        setEditItem(null);
        await fetchInventoryData(currentPage);
      } else {
        alert(data.message || "Failed to update stock.");
      }
    } catch (err) {
      alert("Error saving stock updates.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenHistoryModal = async (item) => {
    setHistoryItem(item);
    setLoadingHistory(true);
    try {
      const response = await fetch(`${url}/api/inventory/${item.productId}/history`, {
        headers: { token }
      });
      const data = await response.json();
      if (data.success) {
        setHistoryLogs(data.data);
      }
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="admin-inventory-container">
      {/* Header Banner */}
      <div className="inv-header-hero">
        <div>
          <h1><Boxes size={24} color="#ff5e3a" /> Restaurant Inventory Management</h1>
          <p>Track product stock, set low-stock thresholds, and view audit history.</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="inv-kpi-grid">
        <div className="inv-kpi-card total">
          <div className="inv-kpi-label">Total Products</div>
          <div className="inv-kpi-value">{summary?.totalProducts || 0}</div>
        </div>

        <div className="inv-kpi-card green">
          <div className="inv-kpi-label">In Stock</div>
          <div className="inv-kpi-value">{summary?.inStock || 0}</div>
        </div>

        <div className="inv-kpi-card yellow">
          <div className="inv-kpi-label">Low Stock Warnings</div>
          <div className="inv-kpi-value">{summary?.lowStock || 0}</div>
        </div>

        <div className="inv-kpi-card red">
          <div className="inv-kpi-label">Out of Stock</div>
          <div className="inv-kpi-value">{summary?.outOfStock || 0}</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="admin-card">
        <div className="inv-controls-bar">
          <form onSubmit={handleSearchSubmit} className="inv-search-form">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search product stock by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          <div className="inv-filter-group">
            <div className="inv-pills">
              {[
                { id: 'all', label: 'All' },
                { id: 'in_stock', label: 'In Stock' },
                { id: 'low_stock', label: 'Low Stock' },
                { id: 'out_of_stock', label: 'Out of Stock' }
              ].map(st => (
                <button
                  key={st.id}
                  className={`inv-pill ${statusFilter === st.id ? 'active' : ''}`}
                  onClick={() => setStatusFilter(st.id)}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <select
              className="inv-sort-select"
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
            >
              <option value="updated_desc">Recently Updated</option>
              <option value="qty_asc">Quantity: Low → High</option>
              <option value="qty_desc">Quantity: High → Low</option>
              <option value="name_asc">Product Name (A-Z)</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="inv-loading-box">
            <Loader2 size={32} className="spin-icon" />
            <p>Loading Inventory Stock...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="inv-empty-box">
            <Boxes size={36} color="#94a3b8" />
            <p>No inventory records matching filter criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Current Stock</th>
                  <th>Min Threshold</th>
                  <th>Stock Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(item => (
                  <tr key={item.productId}>
                    <td>
                      <div className="inv-prod-cell">
                        <img src={item.image} alt={item.productName} className="inv-prod-thumb" />
                        <strong>{item.productName}</strong>
                      </div>
                    </td>
                    <td>{item.category}</td>
                    <td>{formatCurrency(item.price)}</td>
                    <td>
                      <strong className={`stock-count ${item.stockStatus.toLowerCase()}`}>
                        {item.quantity} units
                      </strong>
                    </td>
                    <td>{item.minimumStock} units</td>
                    <td>
                      <span className={`inv-status-pill ${item.stockStatus.toLowerCase()}`}>
                        {item.stockStatus === 'IN_STOCK' && <CheckCircle2 size={12} />}
                        {item.stockStatus === 'LOW_STOCK' && <AlertTriangle size={12} />}
                        {item.stockStatus === 'OUT_OF_STOCK' && <XCircle size={12} />}
                        {item.stockStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="inv-actions-cell">
                        <button
                          className="btn-edit-stock"
                          onClick={() => handleOpenEditModal(item)}
                          title="Update Stock"
                        >
                          <Edit size={14} /> Update Stock
                        </button>
                        <button
                          className="btn-inv-history"
                          onClick={() => handleOpenHistoryModal(item)}
                          title="Audit History"
                        >
                          <History size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="inv-pagination">
            <button disabled={currentPage <= 1} onClick={() => fetchInventoryData(currentPage - 1)}>
              <ChevronLeft size={16} /> Prev
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage >= totalPages} onClick={() => fetchInventoryData(currentPage + 1)}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Edit Stock Modal */}
      {editItem && (
        <div className="modal-overlay">
          <div className="inv-modal-card">
            <div className="modal-top-bar">
              <h3>Update Stock — {editItem.productName}</h3>
              <button className="btn-close-modal" onClick={() => setEditItem(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStock} className="inv-form-body">
              <div className="mode-tabs">
                <button
                  type="button"
                  className={`mode-tab ${editMode === 'set' ? 'active' : ''}`}
                  onClick={() => setEditMode('set')}
                >
                  Set Quantity
                </button>
                <button
                  type="button"
                  className={`mode-tab ${editMode === 'adjust' ? 'active' : ''}`}
                  onClick={() => setEditMode('adjust')}
                >
                  Adjust Stock (+ / -)
                </button>
              </div>

              {editMode === 'set' ? (
                <div className="form-group">
                  <label>Current Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    value={newQuantity}
                    onChange={e => setNewQuantity(Number(e.target.value))}
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>Adjustment (+ Restock / - Damage)</label>
                  <input
                    type="number"
                    value={adjustmentVal}
                    onChange={e => setAdjustmentVal(Number(e.target.value))}
                    placeholder="e.g. 15 or -5"
                    required
                  />
                  <small>New Stock will become: Math.max(0, {editItem.quantity} + {adjustmentVal}) = {Math.max(0, editItem.quantity + Number(adjustmentVal))}</small>
                </div>
              )}

              <div className="form-group">
                <label>Minimum Stock Warning Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={newMinStock}
                  onChange={e => setNewMinStock(Number(e.target.value))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Reason for Stock Update</label>
                <select value={reason} onChange={e => setReason(e.target.value)}>
                  <option value="Restock">Restock / New Delivery</option>
                  <option value="Damaged">Damaged / Spilled</option>
                  <option value="Correction">Inventory Audit Correction</option>
                  <option value="Expired">Expired</option>
                  <option value="Other">Other Reason</option>
                </select>
              </div>

              <div className="modal-actions-row">
                <button type="submit" className="btn-save-stock" disabled={saving}>
                  {saving ? <Loader2 size={16} className="spin-icon" /> : null} Save Stock
                </button>
                <button type="button" className="btn-cancel-modal" onClick={() => setEditItem(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyItem && (
        <div className="modal-overlay">
          <div className="inv-modal-card history-modal">
            <div className="modal-top-bar">
              <h3>Stock Audit Log — {historyItem.productName}</h3>
              <button className="btn-close-modal" onClick={() => setHistoryItem(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="history-modal-body">
              {loadingHistory ? (
                <div className="inv-loading-box">
                  <Loader2 size={24} className="spin-icon" />
                  <p>Loading audit logs...</p>
                </div>
              ) : historyLogs.length === 0 ? (
                <p className="no-logs-msg">No inventory transaction history recorded for this product yet.</p>
              ) : (
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Qty Change</th>
                      <th>Previous → New</th>
                      <th>Reason</th>
                      <th>By User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyLogs.map(log => (
                      <tr key={log.id}>
                        <td>{new Date(log.created_at).toLocaleString()}</td>
                        <td>
                          <span className={`tx-type-pill ${log.type.toLowerCase()}`}>
                            {log.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <strong className={log.quantity >= 0 ? 'pos' : 'neg'}>
                            {log.quantity >= 0 ? `+${log.quantity}` : log.quantity}
                          </strong>
                        </td>
                        <td>{log.previous_quantity} → {log.new_quantity}</td>
                        <td>{log.reason || '—'}</td>
                        <td>{log.userName || log.userEmail || 'System'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
