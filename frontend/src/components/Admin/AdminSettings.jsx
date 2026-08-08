import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../../context/StoreContext';
import { Store, CreditCard, Clock, Truck, Globe, Save, CheckCircle2, AlertTriangle, X, Upload } from 'lucide-react';
import './AdminSettings.css';

const CURRENCY_OPTIONS = [
  { code: 'INR', symbol: '₹', label: 'INR (₹) — Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'USD ($) — US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) — Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) — British Pound' }
];

const AdminSettings = () => {
  const { url, token, loadPublicSettings } = useContext(StoreContext);

  const [formData, setFormData] = useState({
    restaurantName: 'FastBite',
    logoUrl: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    openingTime: '10:00',
    closingTime: '22:00',
    isOpen: true,
    deliveryFee: 40,
    minimumOrderAmount: 199,
    currency: 'INR',
    isActive: true,
    upiId: 'shubhamkumarmaurya155@okaxis',
    upiQrUrl: ''
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [upiQrFile, setUpiQrFile] = useState(null);
  const [upiQrPreview, setUpiQrPreview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAdminSettings = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`${url}/api/admin/settings`, {
        headers: { token }
      });
      const data = await response.json();

      if (data.success && data.data) {
        setFormData({
          restaurantName: data.data.restaurantName || '',
          logoUrl: data.data.logoUrl || '',
          description: data.data.description || '',
          phone: data.data.phone || '',
          email: data.data.email || '',
          address: data.data.address || '',
          openingTime: data.data.openingTime || '10:00',
          closingTime: data.data.closingTime || '22:00',
          isOpen: data.data.isOpen !== undefined ? Boolean(data.data.isOpen) : true,
          deliveryFee: data.data.deliveryFee !== undefined ? data.data.deliveryFee : 40,
          minimumOrderAmount: data.data.minimumOrderAmount !== undefined ? data.data.minimumOrderAmount : 199,
          currency: data.data.currency || 'INR',
          isActive: data.data.isActive !== undefined ? Boolean(data.data.isActive) : true,
          upiId: data.data.upiId || 'shubhamkumarmaurya155@okaxis',
          upiQrUrl: data.data.upiQrUrl || ''
        });
        setLogoPreview(data.data.logoUrl || null);
        setUpiQrPreview(data.data.upiQrUrl || null);
      } else {
        setErrorMsg(data.message || 'Failed to load restaurant settings');
      }
    } catch (err) {
      setErrorMsg('Network error while loading settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminSettings();
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleUpiQrFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUpiQrFile(file);
      setUpiQrPreview(URL.createObjectURL(file));
    }
  };

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.restaurantName || formData.restaurantName.trim() === '') {
      setErrorMsg('Restaurant Name is required');
      return;
    }

    if (formData.deliveryFee === '' || isNaN(formData.deliveryFee) || Number(formData.deliveryFee) < 0) {
      setErrorMsg('Delivery Fee must be a valid non-negative number');
      return;
    }

    if (formData.minimumOrderAmount === '' || isNaN(formData.minimumOrderAmount) || Number(formData.minimumOrderAmount) < 0) {
      setErrorMsg('Minimum Order Amount must be a valid non-negative number');
      return;
    }

    try {
      setSaving(true);
      const postData = new FormData();
      postData.append('restaurantName', formData.restaurantName.trim());
      postData.append('description', formData.description);
      postData.append('phone', formData.phone);
      postData.append('email', formData.email);
      postData.append('address', formData.address);
      postData.append('openingTime', formData.openingTime);
      postData.append('closingTime', formData.closingTime);
      postData.append('isOpen', formData.isOpen);
      postData.append('deliveryFee', formData.deliveryFee);
      postData.append('minimumOrderAmount', formData.minimumOrderAmount);
      postData.append('currency', formData.currency);
      postData.append('isActive', formData.isActive);
      postData.append('upiId', formData.upiId.trim());

      if (logoFile) {
        postData.append('logo', logoFile);
      } else if (formData.logoUrl) {
        postData.append('logoUrl', formData.logoUrl);
      }

      if (upiQrFile) {
        postData.append('upiQr', upiQrFile);
      } else if (formData.upiQrUrl) {
        postData.append('upiQrUrl', formData.upiQrUrl);
      }

      const response = await fetch(`${url}/api/admin/settings`, {
        method: 'PUT',
        headers: { token },
        body: postData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        triggerSuccess(data.message || 'Settings saved successfully!');
        if (loadPublicSettings) {
          await loadPublicSettings();
        }
      } else {
        setErrorMsg(data.message || 'Failed to update settings');
      }
    } catch (err) {
      setErrorMsg('Error saving settings to server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-settings-page">
      {/* Top Header */}
      <div className="admin-settings-header">
        <div>
          <h1 className="admin-settings-title">Restaurant Settings</h1>
          <p className="admin-settings-subtitle">Customize restaurant branding, operating hours, delivery fees, minimum orders, and UPI payment settings.</p>
        </div>
      </div>

      {/* Success Alert */}
      {successMsg ? (
        <div className="alert-banner alert-success">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} /> {successMsg}</span>
          <button className="alert-close" onClick={() => setSuccessMsg('')}><X size={14} /></button>
        </div>
      ) : null}

      {/* Error Alert */}
      {errorMsg ? (
        <div className="alert-banner alert-error">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={16} /> {errorMsg}</span>
          <button className="alert-close" onClick={() => setErrorMsg('')}><X size={14} /></button>
        </div>
      ) : null}

      {loading ? (
        <div className="settings-loading-skeleton">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="settings-form-layout">
          {/* Section 1: Restaurant Information */}
          <div className="settings-card">
            <h3 className="settings-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Store size={18} /> Restaurant Information
            </h3>
            <div className="settings-card-body">
              <div className="form-group">
                <label htmlFor="restaurantName">Restaurant Name *</label>
                <input
                  type="text"
                  id="restaurantName"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  placeholder="e.g. FastBite, Sharma Family Restaurant"
                  required
                />
              </div>

              <div className="form-group">
                <label>Restaurant Logo</label>
                <div className="logo-upload-wrapper">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo Preview" className="settings-logo-preview" />
                  ) : (
                    <div className="logo-preview-placeholder">No Logo</div>
                  )}
                  <div className="logo-upload-controls">
                    <label className="logo-file-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Upload size={14} /> Select Logo Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        className="file-hidden"
                      />
                    </label>
                    <span className="or-text">OR Image URL:</span>
                    <input
                      type="url"
                      name="logoUrl"
                      value={formData.logoUrl}
                      onChange={(e) => {
                        handleChange(e);
                        setLogoPreview(e.target.value || null);
                      }}
                      placeholder="https://example.com/logo.png"
                      className="logo-url-input"
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Restaurant Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Short tagline or summary displayed on customer homepage and footer"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Contact Phone Number</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Contact Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contact@restaurant.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Physical Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street, City, State, Country"
                />
              </div>
            </div>
          </div>

          {/* Section 2: UPI Payment Settings */}
          <div className="settings-card">
            <h3 className="settings-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} /> Payment Settings (UPI)
            </h3>
            <div className="settings-card-body">
              <div className="form-group">
                <label htmlFor="upiId">Restaurant UPI ID (VPA) *</label>
                <input
                  type="text"
                  id="upiId"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleChange}
                  placeholder="shubhamkumarmaurya155@okaxis"
                  required
                />
                <p className="field-hint">Customers will see this UPI VPA at checkout and can copy or pay directly.</p>
              </div>

              <div className="form-group">
                <label>Restaurant UPI QR Code</label>
                <div className="logo-upload-wrapper">
                  {upiQrPreview ? (
                    <img src={upiQrPreview} alt="UPI QR Preview" className="settings-qr-preview" />
                  ) : (
                    <div className="logo-preview-placeholder">No QR Uploaded</div>
                  )}
                  <div className="logo-upload-controls">
                    <label className="logo-file-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Upload size={14} /> Upload New QR Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUpiQrFileChange}
                        className="file-hidden"
                      />
                    </label>
                    <span className="or-text">OR Image URL:</span>
                    <input
                      type="url"
                      name="upiQrUrl"
                      value={formData.upiQrUrl}
                      onChange={(e) => {
                        handleChange(e);
                        setUpiQrPreview(e.target.value || null);
                      }}
                      placeholder="https://example.com/upi-qr.png"
                      className="logo-url-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Business Hours & Operational Status */}
          <div className="settings-card">
            <h3 className="settings-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} /> Business Hours & Operational Status
            </h3>
            <div className="settings-card-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="openingTime">Opening Time</label>
                  <input
                    type="time"
                    id="openingTime"
                    name="openingTime"
                    value={formData.openingTime}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="closingTime">Closing Time</label>
                  <input
                    type="time"
                    id="closingTime"
                    name="closingTime"
                    value={formData.closingTime}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="toggle-switch-card">
                <div>
                  <strong>Restaurant Operating Status (Is Open)</strong>
                  <p className="toggle-desc">Toggle off when closed. Menu browsing remains enabled, but new orders are blocked.</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="isOpen"
                    checked={formData.isOpen}
                    onChange={handleChange}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 4: Delivery & Minimum Order Settings */}
          <div className="settings-card">
            <h3 className="settings-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={18} /> Delivery & Minimum Order Settings
            </h3>
            <div className="settings-card-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="deliveryFee">Flat Delivery Fee (₹/$) *</label>
                  <input
                    type="number"
                    id="deliveryFee"
                    name="deliveryFee"
                    step="0.01"
                    min="0"
                    value={formData.deliveryFee}
                    onChange={handleChange}
                    placeholder="40.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="minimumOrderAmount">Minimum Order Requirement (₹/$) *</label>
                  <input
                    type="number"
                    id="minimumOrderAmount"
                    name="minimumOrderAmount"
                    step="0.01"
                    min="0"
                    value={formData.minimumOrderAmount}
                    onChange={handleChange}
                    placeholder="199.00"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Currency & Active Status */}
          <div className="settings-card">
            <h3 className="settings-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} /> Currency & System Availability
            </h3>
            <div className="settings-card-body">
              <div className="form-group">
                <label htmlFor="currency">Display Currency *</label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  required
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="toggle-switch-card">
                <div>
                  <strong>System Active Status (Platform Online)</strong>
                  <p className="toggle-desc">When disabled, customers see a maintenance/unavailable message.</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="settings-save-actions">
            <button type="submit" className="save-settings-btn" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Save size={16} /> {saving ? 'Saving Settings...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminSettings;
