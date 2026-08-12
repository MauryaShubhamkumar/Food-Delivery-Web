import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import {
  Store,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  Sparkles,
  QrCode,
  Utensils,
  Tag,
  Loader2
} from 'lucide-react';
import './Onboarding.css';

const Onboarding = () => {
  const { url, token, user, loadUserProfile } = useContext(StoreContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [hasRestaurant, setHasRestaurant] = useState(false);
  const [restaurantData, setRestaurantData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [currentStep, setCurrentStep] = useState(1);
  const [launched, setLaunched] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form States
  const [storeForm, setStoreForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [newProd, setNewProd] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    image: null
  });
  const [prodImagePreview, setProdImagePreview] = useState(null);

  const [paymentForm, setPaymentForm] = useState({
    upiId: ''
  });

  // Fetch user restaurant onboarding state
  const fetchOnboardingState = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch(`${url}/api/restaurant/me`, {
        headers: { token }
      });
      const data = await response.json();

      if (data.success && data.hasRestaurant && data.data) {
        setHasRestaurant(true);
        const r = data.data;
        setRestaurantData(r);
        setCurrentStep(r.onboarding_completed ? 6 : Math.max(1, r.onboarding_step || 1));
        setLaunched(Boolean(r.onboarding_completed));

        setStoreForm({
          name: r.name || '',
          email: r.email || user?.email || '',
          phone: r.phone || user?.phone || '',
          address: r.address || '',
          city: r.city || '',
          state: r.state || '',
          pincode: r.pincode || ''
        });

        if (r.logo_url) {
          setLogoPreview(r.logo_url);
        }

        if (r.settings?.upi_id) {
          setPaymentForm({ upiId: r.settings.upi_id });
        }

        // Fetch categories & products for step 3 & 4
        await Promise.all([
          fetchCategories(),
          fetchProducts()
        ]);
      } else {
        setHasRestaurant(false);
        setStoreForm(prev => ({
          ...prev,
          email: user?.email || '',
          phone: user?.phone || ''
        }));
      }
    } catch (err) {
      setErrorMsg("Failed to load onboarding status.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${url}/api/admin/categories`, { headers: { token } });
      const data = await res.json();
      if (data.success && data.data) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error("Categories fetch error:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${url}/api/admin/products`, { headers: { token } });
      const data = await res.json();
      if (data.success && data.data) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error("Products fetch error:", err);
    }
  };

  useEffect(() => {
    fetchOnboardingState();
  }, [token]);

  // Handle Initial Restaurant Creation
  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const response = await fetch(`${url}/api/restaurant/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token
        },
        body: JSON.stringify(storeForm)
      });
      const data = await response.json();

      if (data.success && data.data) {
        setHasRestaurant(true);
        setRestaurantData(data.data);
        setCurrentStep(1);
        setSuccessMsg(data.message);
        await loadUserProfile(token);
      } else {
        setErrorMsg(data.message || "Failed to create restaurant.");
      }
    } catch (err) {
      setErrorMsg("Connection error while creating restaurant.");
    } finally {
      setSubmitting(false);
    }
  };

  // Save Step 1 Info
  const handleSaveStep1 = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const response = await fetch(`${url}/api/restaurant/me/onboarding`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          token
        },
        body: JSON.stringify({ ...storeForm, step: 2 })
      });
      const data = await response.json();

      if (data.success) {
        setCurrentStep(2);
        setSuccessMsg("Restaurant info saved!");
      } else {
        setErrorMsg(data.message || "Failed to save step 1.");
      }
    } catch (err) {
      setErrorMsg("Connection error saving step 1.");
    } finally {
      setSubmitting(false);
    }
  };

  // Save Step 2 Logo Upload
  const handleLogoUpload = async (e) => {
    e.preventDefault();
    if (!logoFile) {
      setCurrentStep(3);
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    const formData = new FormData();
    formData.append('logo', logoFile);

    try {
      const response = await fetch(`${url}/api/restaurant/me/logo`, {
        method: "POST",
        headers: { token },
        body: formData
      });
      const data = await response.json();

      if (data.success) {
        setLogoPreview(data.logoUrl);
        // Advance step
        await fetch(`${url}/api/restaurant/me/onboarding`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", token },
          body: JSON.stringify({ step: 3 })
        });
        setCurrentStep(3);
        setSuccessMsg("Logo uploaded successfully!");
      } else {
        setErrorMsg(data.message || "Logo upload failed.");
      }
    } catch (err) {
      setErrorMsg("Failed to upload logo.");
    } finally {
      setSubmitting(false);
    }
  };

  // Add Category (Step 3)
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setErrorMsg('');
    setSubmitting(true);

    try {
      const response = await fetch(`${url}/api/admin/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token
        },
        body: JSON.stringify({ name: newCatName.trim(), description: newCatDesc.trim() })
      });
      const data = await response.json();

      if (data.success) {
        setNewCatName('');
        setNewCatDesc('');
        await fetchCategories();
        setSuccessMsg("Category added!");
      } else {
        setErrorMsg(data.message || "Failed to add category.");
      }
    } catch (err) {
      setErrorMsg("Error adding category.");
    } finally {
      setSubmitting(false);
    }
  };

  // Add Product (Step 4)
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProd.name.trim() || !newProd.price || !newProd.category) {
      setErrorMsg("Product name, price, and category are required.");
      return;
    }

    setErrorMsg('');
    setSubmitting(true);
    const formData = new FormData();
    formData.append('name', newProd.name.trim());
    formData.append('price', newProd.price);
    formData.append('category', newProd.category);
    formData.append('description', newProd.description.trim());
    if (newProd.image) {
      formData.append('image', newProd.image);
    }

    try {
      const response = await fetch(`${url}/api/admin/products`, {
        method: "POST",
        headers: { token },
        body: formData
      });
      const data = await response.json();

      if (data.success) {
        setNewProd({ name: '', price: '', category: '', description: '', image: null });
        setProdImagePreview(null);
        await fetchProducts();
        setSuccessMsg("Product added to menu!");
      } else {
        setErrorMsg(data.message || "Failed to add product.");
      }
    } catch (err) {
      setErrorMsg("Error adding product.");
    } finally {
      setSubmitting(false);
    }
  };

  // Save Step 5 Payment Info
  const handleSaveStep5 = async (e) => {
    e.preventDefault();
    if (!paymentForm.upiId.trim()) {
      setErrorMsg("Please enter a valid UPI ID for customer payments.");
      return;
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      const response = await fetch(`${url}/api/restaurant/me/onboarding`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          token
        },
        body: JSON.stringify({ upiId: paymentForm.upiId.trim(), step: 6 })
      });
      const data = await response.json();

      if (data.success) {
        setCurrentStep(6);
        setSuccessMsg("Payment details saved!");
      } else {
        setErrorMsg(data.message || "Failed to save payment info.");
      }
    } catch (err) {
      setErrorMsg("Error saving payment info.");
    } finally {
      setSubmitting(false);
    }
  };

  // Launch Restaurant (Step 6)
  const handleLaunchRestaurant = async () => {
    setErrorMsg('');
    setSubmitting(true);

    try {
      const response = await fetch(`${url}/api/restaurant/me/launch`, {
        method: "POST",
        headers: { token }
      });
      const data = await response.json();

      if (data.success) {
        setLaunched(true);
        setSuccessMsg(data.message);
        await fetchOnboardingState();
      } else {
        setErrorMsg(data.message || "Launch requirements incomplete.");
      }
    } catch (err) {
      setErrorMsg("Failed to launch restaurant.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyStoreLink = () => {
    const storeUrl = `${window.location.origin}/?restaurant=${restaurantData?.slug || ''}`;
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="onboarding-loading">
        <Loader2 size={36} className="spin-icon" />
        <p>Loading Restaurant Onboarding Wizard...</p>
      </div>
    );
  }

  // Initial Creation View (No restaurant row yet)
  if (!hasRestaurant) {
    return (
      <div className="onboarding-container">
        <div className="onboarding-card create-card">
          <div className="onboarding-header-hero">
            <div className="hero-icon">
              <Store size={40} />
            </div>
            <h1>Create Your Restaurant</h1>
            <p>Welcome to FastBite SaaS platform! Let's get your restaurant set up in minutes.</p>
          </div>

          {errorMsg && (
            <div className="onboarding-alert error">
              <AlertCircle size={18} /> {errorMsg}
            </div>
          )}

          <form onSubmit={handleCreateRestaurant} className="onboarding-form">
            <div className="form-group">
              <label>Restaurant Name *</label>
              <input
                type="text"
                placeholder="e.g. Spice Garden & Grill"
                value={storeForm.name}
                onChange={e => setStoreForm({ ...storeForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Restaurant Email</label>
                <input
                  type="email"
                  placeholder="contact@spicegarden.com"
                  value={storeForm.email}
                  onChange={e => setStoreForm({ ...storeForm, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={storeForm.phone}
                  onChange={e => setStoreForm({ ...storeForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Street Address</label>
              <input
                type="text"
                placeholder="Shop 12, Main Street"
                value={storeForm.address}
                onChange={e => setStoreForm({ ...storeForm, address: e.target.value })}
              />
            </div>

            <div className="form-row three-col">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  placeholder="Varanasi"
                  value={storeForm.city}
                  onChange={e => setStoreForm({ ...storeForm, city: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  placeholder="Uttar Pradesh"
                  value={storeForm.state}
                  onChange={e => setStoreForm({ ...storeForm, state: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  placeholder="221001"
                  value={storeForm.pincode}
                  onChange={e => setStoreForm({ ...storeForm, pincode: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? <Loader2 size={18} className="spin-icon" /> : "Start Restaurant Setup"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 6-Step Multi-Step Wizard
  return (
    <div className="onboarding-container">
      {/* Wizard Progress Bar */}
      <div className="wizard-progress-bar">
        <div className="progress-title">
          <h2>{restaurantData?.name || 'Restaurant Setup'}</h2>
          <span className="step-count">Step {currentStep} of 6</span>
        </div>

        <div className="steps-stepper">
          {[
            { num: 1, label: 'Restaurant' },
            { num: 2, label: 'Branding' },
            { num: 3, label: 'Categories' },
            { num: 4, label: 'Products' },
            { num: 5, label: 'Payment' },
            { num: 6, label: 'Launch' }
          ].map(s => {
            const isCompleted = currentStep > s.num || launched;
            const isCurrent = currentStep === s.num && !launched;
            return (
              <div
                key={s.num}
                className={`stepper-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                onClick={() => {
                  if (s.num <= Math.max(restaurantData?.onboarding_step || 1, 1)) {
                    setCurrentStep(s.num);
                  }
                }}
              >
                <div className="step-circle">
                  {isCompleted ? <CheckCircle2 size={16} /> : s.num}
                </div>
                <span className="step-label">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="onboarding-alert error">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="onboarding-alert success">
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* STEP 1 — RESTAURANT INFO */}
      {currentStep === 1 && (
        <div className="onboarding-card">
          <div className="card-header">
            <h3>Step 1 — Restaurant Information</h3>
            <p>Verify your basic restaurant business profile.</p>
          </div>
          <form onSubmit={handleSaveStep1} className="onboarding-form">
            <div className="form-group">
              <label>Restaurant Name *</label>
              <input
                type="text"
                value={storeForm.name}
                onChange={e => setStoreForm({ ...storeForm, name: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={storeForm.email}
                  onChange={e => setStoreForm({ ...storeForm, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={storeForm.phone}
                  onChange={e => setStoreForm({ ...storeForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Street Address</label>
              <input
                type="text"
                value={storeForm.address}
                onChange={e => setStoreForm({ ...storeForm, address: e.target.value })}
              />
            </div>
            <div className="form-row three-col">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={storeForm.city}
                  onChange={e => setStoreForm({ ...storeForm, city: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  value={storeForm.state}
                  onChange={e => setStoreForm({ ...storeForm, state: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  value={storeForm.pincode}
                  onChange={e => setStoreForm({ ...storeForm, pincode: e.target.value })}
                />
              </div>
            </div>
            <div className="card-actions">
              <span></span>
              <button type="submit" className="btn-next" disabled={submitting}>
                Save & Continue <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2 — BRANDING (LOGO) */}
      {currentStep === 2 && (
        <div className="onboarding-card">
          <div className="card-header">
            <h3>Step 2 — Branding & Logo</h3>
            <p>Upload your official restaurant logo for customer storefront and receipts.</p>
          </div>

          <form onSubmit={handleLogoUpload} className="onboarding-form">
            <div className="logo-upload-box">
              {logoPreview ? (
                <div className="logo-preview-wrapper">
                  <img src={logoPreview} alt="Restaurant Logo Preview" />
                </div>
              ) : (
                <div className="logo-placeholder">
                  <Store size={48} />
                  <span>No logo uploaded yet</span>
                </div>
              )}

              <input
                type="file"
                id="logo-input"
                accept="image/*"
                onChange={e => {
                  if (e.target.files?.[0]) {
                    setLogoFile(e.target.files[0]);
                    setLogoPreview(URL.createObjectURL(e.target.files[0]));
                  }
                }}
                style={{ display: 'none' }}
              />

              <label htmlFor="logo-input" className="btn-upload-trigger">
                <Upload size={16} /> {logoPreview ? "Replace Logo" : "Choose Logo File"}
              </label>
            </div>

            <div className="card-actions">
              <button type="button" className="btn-back" onClick={() => setCurrentStep(1)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button type="submit" className="btn-next" disabled={submitting}>
                {logoFile ? "Upload & Continue" : "Skip / Next"} <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3 — CATEGORIES */}
      {currentStep === 3 && (
        <div className="onboarding-card">
          <div className="card-header">
            <h3>Step 3 — Food Categories</h3>
            <p>Create your menu categories (e.g. Pizza, Burgers, Beverages, Desserts).</p>
          </div>

          <form onSubmit={handleAddCategory} className="add-category-box">
            <input
              type="text"
              placeholder="Category Name (e.g. Pizzas)"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              required
            />
            <button type="submit" className="btn-add" disabled={submitting}>
              <Plus size={16} /> Add Category
            </button>
          </form>

          <div className="categories-list">
            <h4>Your Restaurant Categories ({categories.length})</h4>
            {categories.length === 0 ? (
              <p className="empty-text">No categories added yet. Add at least one category to proceed.</p>
            ) : (
              <div className="chips-grid">
                {categories.map(c => (
                  <div key={c.id} className="category-chip">
                    <Tag size={14} />
                    <span>{c.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card-actions">
            <button type="button" className="btn-back" onClick={() => setCurrentStep(2)}>
              <ArrowLeft size={16} /> Back
            </button>
            <button
              type="button"
              className="btn-next"
              onClick={() => {
                if (categories.length === 0) {
                  setErrorMsg("Please add at least one food category before proceeding.");
                  return;
                }
                setCurrentStep(4);
              }}
            >
              Continue to Products <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 — PRODUCTS */}
      {currentStep === 4 && (
        <div className="onboarding-card">
          <div className="card-header">
            <h3>Step 4 — Add Initial Products</h3>
            <p>Add food items to your restaurant menu.</p>
          </div>

          <form onSubmit={handleAddProduct} className="onboarding-form add-product-box">
            <div className="form-row">
              <div className="form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Margherita Pizza"
                  value={newProd.name}
                  onChange={e => setNewProd({ ...newProd, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="299"
                  value={newProd.price}
                  onChange={e => setNewProd({ ...newProd, price: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={newProd.category}
                  onChange={e => setNewProd({ ...newProd, category: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Item Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files?.[0]) {
                      setNewProd({ ...newProd, image: e.target.files[0] });
                      setProdImagePreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }}
                />
              </div>
            </div>

            {prodImagePreview && (
              <div className="prod-img-preview">
                <img src={prodImagePreview} alt="Product preview" />
              </div>
            )}

            <button type="submit" className="btn-add-prod" disabled={submitting}>
              {submitting ? <Loader2 size={16} className="spin-icon" /> : <Plus size={16} />} Add Product to Menu
            </button>
          </form>

          <div className="products-list">
            <h4>Added Menu Items ({products.length})</h4>
            {products.length === 0 ? (
              <p className="empty-text">No products added yet. Add at least one food product to proceed.</p>
            ) : (
              <div className="products-compact-grid">
                {products.map(p => (
                  <div key={p.id} className="prod-compact-card">
                    <img src={p.image} alt={p.name} />
                    <div className="prod-info">
                      <span className="prod-name">{p.name}</span>
                      <span className="prod-price">₹{Number(p.price).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card-actions">
            <button type="button" className="btn-back" onClick={() => setCurrentStep(3)}>
              <ArrowLeft size={16} /> Back
            </button>
            <button
              type="button"
              className="btn-next"
              onClick={() => {
                if (products.length === 0) {
                  setErrorMsg("Please add at least one product before proceeding.");
                  return;
                }
                setCurrentStep(5);
              }}
            >
              Continue to Payment <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5 — PAYMENT / UPI */}
      {currentStep === 5 && (
        <div className="onboarding-card">
          <div className="card-header">
            <h3>Step 5 — Payment & UPI Configuration</h3>
            <p>Set up your UPI VPA address to receive direct customer order payments.</p>
          </div>

          <form onSubmit={handleSaveStep5} className="onboarding-form">
            <div className="form-group">
              <label>UPI VPA ID *</label>
              <div className="input-icon-group">
                <QrCode size={18} />
                <input
                  type="text"
                  placeholder="e.g. restaurantname@upi or 9876543210@paytm"
                  value={paymentForm.upiId}
                  onChange={e => setPaymentForm({ upiId: e.target.value })}
                  required
                />
              </div>
              <small className="help-text">Customers will use this UPI ID to transfer order payments directly to your bank account.</small>
            </div>

            <div className="card-actions">
              <button type="button" className="btn-back" onClick={() => setCurrentStep(4)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button type="submit" className="btn-next" disabled={submitting}>
                Save & Proceed to Review <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 6 — REVIEW & LAUNCH */}
      {currentStep === 6 && (
        <div className="onboarding-card">
          <div className="card-header">
            <h3>Step 6 — Review & Launch Restaurant</h3>
            <p>Review your restaurant configuration before making your store live.</p>
          </div>

          <div className="review-summary-grid">
            <div className="summary-item">
              <div className="summary-title">
                <Store size={18} /> Restaurant Details
              </div>
              <p><strong>Name:</strong> {restaurantData?.name}</p>
              <p><strong>Address:</strong> {restaurantData?.address || 'N/A'}, {restaurantData?.city || ''}</p>
              <p><strong>URL Slug:</strong> <code>{restaurantData?.slug}</code></p>
            </div>

            <div className="summary-item">
              <div className="summary-title">
                <Utensils size={18} /> Menu Summary
              </div>
              <p><strong>Categories:</strong> {categories.length} configured</p>
              <p><strong>Products:</strong> {products.length} menu items</p>
            </div>

            <div className="summary-item">
              <div className="summary-title">
                <QrCode size={18} /> Payment Setup
              </div>
              <p><strong>UPI ID:</strong> {paymentForm.upiId || restaurantData?.settings?.upi_id || 'Configured ✓'}</p>
              <p><strong>Status:</strong> Manual UTR Verification Active</p>
            </div>
          </div>

          {!launched ? (
            <div className="launch-section">
              <button
                type="button"
                className="btn-launch"
                onClick={handleLaunchRestaurant}
                disabled={submitting}
              >
                {submitting ? <Loader2 size={20} className="spin-icon" /> : <Sparkles size={20} />} Launch Restaurant Live
              </button>
            </div>
          ) : (
            <div className="launched-success-modal">
              <div className="success-icon-badge">
                <CheckCircle2 size={48} />
              </div>
              <h2>🎉 Your Restaurant is Live!</h2>
              <p>"{restaurantData?.name}" is now active and ready to take customer orders.</p>

              <div className="store-url-box">
                <span>{window.location.origin}/?restaurant={restaurantData?.slug}</span>
                <button onClick={copyStoreLink}>
                  <Copy size={16} /> {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>

              <div className="launched-actions">
                <button onClick={() => navigate("/admin")} className="btn-dashboard">
                  Go to Admin Dashboard
                </button>
                <button onClick={() => navigate(`/?restaurant=${restaurantData?.slug}`)} className="btn-view-store">
                  <ExternalLink size={16} /> View Live Storefront
                </button>
              </div>
            </div>
          )}

          {!launched && (
            <div className="card-actions">
              <button type="button" className="btn-back" onClick={() => setCurrentStep(5)}>
                <ArrowLeft size={16} /> Modify Setup
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Onboarding;
