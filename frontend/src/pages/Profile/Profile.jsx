import React, { useContext, useEffect, useState, useRef } from 'react';
import './Profile.css';
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Camera,
  Trash2,
  Briefcase,
  Calendar,
  Edit2,
  X,
  Save,
  Leaf,
  MapPin,
  CheckCircle2,
  Phone,
  Mail,
  User,
  Info,
  Loader2,
  Sparkles
} from 'lucide-react';
import {
  validateField,
  fetchPincodeDetails,
  normalizePhone,
  PINCODE_REGEX
} from '../../utils/addressValidation';

const Profile = () => {
  const { url, token, loadUserProfile, setUser: setGlobalUser } = useContext(StoreContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);

  // Field validation and auto-lookup states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeSuccessMsg, setPincodeSuccessMsg] = useState("");

  const inputRefs = {
    firstName: useRef(null),
    lastName: useRef(null),
    phone: useRef(null),
    street: useRef(null),
    city: useRef(null),
    state: useRef(null),
    zipCode: useRef(null)
  };

  const [user, setUser] = useState({
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    address: '',
    profession: '',
    dietary_preference: 'Veg',
    bio: '',
    avatar_url: null,
    created_at: ''
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    profession: '',
    dietary_preference: 'Veg',
    bio: ''
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${url}/api/user/me`, {
        method: 'GET',
        headers: { token: token }
      });
      const resData = await response.json();
      if (resData.success && resData.user) {
        const u = resData.user;
        const fName = u.firstName || u.first_name || (u.name ? u.name.trim().split(' ')[0] : '');
        const lName = u.lastName || u.last_name || (u.name ? u.name.trim().split(' ').slice(1).join(' ') : '');

        setUser({
          ...u,
          firstName: fName,
          lastName: lName,
          street: u.street || '',
          city: u.city || '',
          state: u.state || '',
          zipCode: u.zipCode || u.zip_code || '',
          country: u.country || 'India'
        });

        setFormData({
          firstName: fName,
          lastName: lName,
          phone: u.phone || '',
          street: u.street || '',
          city: u.city || '',
          state: u.state || '',
          zipCode: u.zipCode || u.zip_code || '',
          country: u.country || 'India',
          profession: u.profession || '',
          dietary_preference: u.dietary_preference || 'Veg',
          bio: u.bio || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const err = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: err }));
    }

    // Auto PIN code detection
    if (name === "zipCode") {
      const cleanPin = value.trim();
      if (cleanPin.length === 6 && PINCODE_REGEX.test(cleanPin)) {
        setPincodeLoading(true);
        setPincodeSuccessMsg("");
        try {
          const result = await fetchPincodeDetails(cleanPin);
          if (result.success) {
            setFormData(prev => ({
              ...prev,
              city: result.city || prev.city,
              state: result.state || prev.state
            }));
            setPincodeSuccessMsg(`Auto-detected: ${result.city}, ${result.state}`);
            setErrors(prev => ({
              ...prev,
              zipCode: null,
              city: null,
              state: null
            }));
          }
        } catch (err) {
          setPincodeSuccessMsg("");
        } finally {
          setPincodeLoading(false);
        }
      } else {
        setPincodeSuccessMsg("");
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const postData = new FormData();
    postData.append('avatar', file);

    try {
      setUploadingAvatar(true);
      const response = await fetch(`${url}/api/user/avatar`, {
        method: 'POST',
        headers: { token: token },
        body: postData
      });

      const resData = await response.json();
      if (response.ok && resData.success && resData.user) {
        setUser(resData.user);
        if (setGlobalUser) setGlobalUser(resData.user);
        await loadUserProfile(token);
        alert('Profile photo updated successfully!');
      } else {
        alert(resData.message || 'Failed to upload profile photo');
      }
    } catch (err) {
      alert('Error uploading profile photo to server');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;

    try {
      setRemovingAvatar(true);
      const response = await fetch(`${url}/api/user/avatar`, {
        method: 'DELETE',
        headers: { token: token }
      });

      const resData = await response.json();
      if (response.ok && resData.success && resData.user) {
        setUser(resData.user);
        if (setGlobalUser) setGlobalUser(resData.user);
        await loadUserProfile(token);
        alert('Profile photo removed');
      } else {
        alert(resData.message || 'Failed to remove profile photo');
      }
    } catch (err) {
      alert('Error removing profile photo');
    } finally {
      setRemovingAvatar(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Field-level Validation before saving
    const newErrors = {};
    const fNameErr = validateField('firstName', formData.firstName);
    if (fNameErr) newErrors.firstName = fNameErr;

    const lNameErr = validateField('lastName', formData.lastName);
    if (lNameErr) newErrors.lastName = lNameErr;

    if (formData.phone && formData.phone.trim()) {
      const phoneErr = validateField('phone', formData.phone);
      if (phoneErr) newErrors.phone = phoneErr;
    }

    // If any address field is entered, validate the address fields
    const hasAnyAddressField = Boolean(formData.street || formData.city || formData.state || formData.zipCode);
    if (hasAnyAddressField) {
      if (!formData.street || formData.street.trim().length < 5) {
        newErrors.street = 'Street address must be at least 5 characters.';
      }
      const cityErr = validateField('city', formData.city);
      if (cityErr) newErrors.city = cityErr;

      const stateErr = validateField('state', formData.state);
      if (stateErr) newErrors.state = stateErr;

      const pinErr = validateField('zipCode', formData.zipCode);
      if (pinErr) newErrors.zipCode = pinErr;
    }

    setTouched({
      firstName: true,
      lastName: true,
      phone: true,
      street: true,
      city: true,
      state: true,
      zipCode: true
    });
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      if (inputRefs[firstKey]?.current) {
        inputRefs[firstKey].current.focus();
      }
      return;
    }

    setSaving(true);

    const cleanFirstName = formData.firstName.trim();
    const cleanLastName = formData.lastName.trim();
    const fullName = `${cleanFirstName} ${cleanLastName}`.trim();
    const cleanedPhone = formData.phone ? normalizePhone(formData.phone) : '';
    const formattedAddress = [formData.street, formData.city, formData.state, formData.zipCode, formData.country]
      .map(s => (s || '').trim())
      .filter(Boolean)
      .join(', ');

    const updateBody = {
      ...formData,
      name: fullName,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      phone: cleanedPhone,
      address: formattedAddress
    };

    try {
      const response = await fetch(`${url}/api/user/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: token
        },
        body: JSON.stringify(updateBody)
      });
      const resData = await response.json();
      if (resData.success && resData.user) {
        const u = resData.user;
        setUser(u);
        if (setGlobalUser) setGlobalUser(u);
        await loadUserProfile(token);
        setIsEditing(false);
        alert('Profile & Default Delivery Address updated successfully!');
      } else {
        if (resData.errors && typeof resData.errors === 'object') {
          setErrors(prev => ({ ...prev, ...resData.errors }));
        }
        alert(resData.message || 'Failed to update profile');
      }
    } catch (err) {
      alert('Error updating profile information');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="profile-empty">
        <div className="empty-icon"><Lock size={44} color="#94a3b8" /></div>
        <h3>Please Sign In</h3>
        <p>You must be logged in to view and manage your personal profile.</p>
        <button onClick={() => navigate('/')} className="explore-btn">Go to Home</button>
      </div>
    );
  }

  const userAvatarSrc = user.avatar_url || assets.profile_icon;
  const fullNameDisplay = (user.name || `${user.firstName || ''} ${user.lastName || ''}`).trim() || 'Food Lover';
  const hasStructuredAddress = Boolean(user.street || user.city);

  return (
    <div className="user-profile-page">
      <div className="profile-card">
        {/* Banner / Header */}
        <div className="profile-banner">
          <div className="avatar-wrapper">
            <img src={userAvatarSrc} alt={fullNameDisplay} className={`avatar-img ${!user.avatar_url ? 'default-icon' : ''}`} />
            
            {/* Interactive Upload Overlay */}
            <label className="avatar-upload-overlay" title="Upload new profile photo">
              <Camera size={18} />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarFileChange}
                disabled={uploadingAvatar}
                className="file-hidden"
              />
            </label>
          </div>
        </div>

        <div className="profile-body">
          <div className="profile-header-info">
            <h2>{fullNameDisplay}</h2>
            <p className="profile-email">{user.email}</p>

            {/* Avatar Action Controls */}
            <div className="avatar-actions-bar">
              <label className="avatar-action-btn upload-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Camera size={14} /> {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarFileChange}
                  disabled={uploadingAvatar}
                  className="file-hidden"
                />
              </label>

              {user.avatar_url ? (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={removingAvatar}
                  className="avatar-action-btn remove-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={14} /> {removingAvatar ? 'Removing...' : 'Remove Photo'}
                </button>
              ) : null}
            </div>

            <div className="profile-badges">
              <span className={`diet-badge ${user.dietary_preference ? user.dietary_preference.toLowerCase() : 'veg'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Leaf size={13} /> {user.dietary_preference || 'Veg'}
              </span>
              {user.profession && (
                <span className="profession-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Briefcase size={13} /> {user.profession}
                </span>
              )}
              <span className="member-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} /> Member since {new Date(user.created_at || Date.now()).getFullYear()}
              </span>
            </div>
          </div>

          <hr className="profile-divider" />

          {!isEditing ? (
            /* VIEW MODE */
            <div className="profile-details-view">
              <div className="details-header">
                <h3>Personal Information</h3>
                <button onClick={() => setIsEditing(true)} className="edit-profile-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Edit2 size={14} /> Edit Profile
                </button>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">First Name</span>
                  <p className="info-value">{user.firstName || (user.name ? user.name.split(' ')[0] : 'Not specified')}</p>
                </div>

                <div className="info-item">
                  <span className="info-label">Last Name</span>
                  <p className="info-value">{user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : 'Not specified')}</p>
                </div>

                <div className="info-item">
                  <span className="info-label">Email Address</span>
                  <p className="info-value">{user.email}</p>
                </div>

                <div className="info-item">
                  <span className="info-label">Phone Number</span>
                  <p className="info-value">{user.phone || 'Add phone number'}</p>
                </div>

                <div className="info-item">
                  <span className="info-label">Profession</span>
                  <p className="info-value">{user.profession || 'Add profession'}</p>
                </div>

                <div className="info-item">
                  <span className="info-label">Meal / Diet Preference</span>
                  <p className="info-value">{user.dietary_preference || 'Veg'}</p>
                </div>

                {/* Default Delivery Address Card */}
                <div className="info-item full-width default-address-view-card">
                  <div className="address-card-header">
                    <span className="info-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={15} color="#ff5e3a" /> Default Delivery Address
                    </span>
                    <span className="default-address-pill">
                      <CheckCircle2 size={12} /> Selected Default
                    </span>
                  </div>

                  {hasStructuredAddress ? (
                    <div className="structured-address-display">
                      <p className="address-street">{user.street}</p>
                      <p className="address-city-state">
                        {[user.city, user.state].filter(Boolean).join(', ')}
                        {user.zipCode ? ` - ${user.zipCode}` : ''}
                      </p>
                      {user.country && <p className="address-country">{user.country}</p>}
                    </div>
                  ) : user.address ? (
                    <p className="info-value">{user.address}</p>
                  ) : (
                    <p className="info-value text-muted-empty">No default delivery address saved yet. Click "Edit Profile" to add one.</p>
                  )}
                </div>

                <div className="info-item full-width">
                  <span className="info-label">About / Bio</span>
                  <p className="info-value">{user.bio || 'Passionate about delicious food & fast deliveries!'}</p>
                </div>
              </div>
            </div>
          ) : (
            /* EDIT MODE */
            <form onSubmit={handleSave} className="profile-edit-form" noValidate>
              <div className="details-header">
                <h3>Edit Profile Information</h3>
                <button type="button" onClick={() => setIsEditing(false)} className="cancel-edit-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <X size={14} /> Cancel
                </button>
              </div>

              {/* Personal Information Fields */}
              <div className="form-section-title">
                <User size={16} /> Customer Information
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    ref={inputRefs.firstName}
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    placeholder="First Name"
                    className={touched.firstName && errors.firstName ? "input-error" : ""}
                  />
                  {touched.firstName && errors.firstName && (
                    <span className="field-error-msg">{errors.firstName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    ref={inputRefs.lastName}
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    placeholder="Last Name"
                    className={touched.lastName && errors.lastName ? "input-error" : ""}
                  />
                  {touched.lastName && errors.lastName && (
                    <span className="field-error-msg">{errors.lastName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    ref={inputRefs.phone}
                    type="tel"
                    name="phone"
                    maxLength={15}
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="10-Digit Mobile (e.g. 9876543210)"
                    className={touched.phone && errors.phone ? "input-error" : ""}
                  />
                  {touched.phone && errors.phone && (
                    <span className="field-error-msg">{errors.phone}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Profession / Occupation</label>
                  <input
                    type="text"
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    placeholder="e.g. Software Engineer, Designer"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Meal / Dietary Preference</label>
                  <select
                    name="dietary_preference"
                    value={formData.dietary_preference}
                    onChange={handleChange}
                  >
                    <option value="Veg">Pure Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                    <option value="Eggetarian">Eggetarian</option>
                    <option value="Vegan">Vegan</option>
                  </select>
                </div>
              </div>

              {/* Default Delivery Address Section (Matching Checkout Fields & Layout) */}
              <div className="form-section-title address-section-title">
                <MapPin size={16} color="#ff5e3a" /> Default Delivery Address
                <span className="address-help-badge">
                  <CheckCircle2 size={12} /> Auto-prefills Checkout
                </span>
              </div>

              <div className="form-grid address-form-grid">
                <div className="form-group full-width">
                  <label>Street Address</label>
                  <input
                    ref={inputRefs.street}
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Street Address (Flat / House No, Road)"
                    className={touched.street && errors.street ? "input-error" : ""}
                  />
                  {touched.street && errors.street && (
                    <span className="field-error-msg">{errors.street}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>6-Digit PIN Code</label>
                  <input
                    ref={inputRefs.zipCode}
                    type="text"
                    name="zipCode"
                    maxLength={6}
                    value={formData.zipCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. 221001"
                    className={touched.zipCode && errors.zipCode ? "input-error" : ""}
                  />
                  {pincodeLoading && (
                    <span className="pincode-status-tag loading">
                      <Loader2 size={12} className="spin-icon" /> Detecting City & State...
                    </span>
                  )}
                  {pincodeSuccessMsg && !pincodeLoading && (
                    <span className="pincode-status-tag success">
                      <Sparkles size={12} /> {pincodeSuccessMsg}
                    </span>
                  )}
                  {touched.zipCode && errors.zipCode && (
                    <span className="field-error-msg">{errors.zipCode}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>City</label>
                  <input
                    ref={inputRefs.city}
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="City"
                    className={touched.city && errors.city ? "input-error" : ""}
                  />
                  {touched.city && errors.city && (
                    <span className="field-error-msg">{errors.city}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>State</label>
                  <input
                    ref={inputRefs.state}
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="State"
                    className={touched.state && errors.state ? "input-error" : ""}
                  />
                  {touched.state && errors.state && (
                    <span className="field-error-msg">{errors.state}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    readOnly
                    className="country-readonly-input"
                  />
                </div>

                <div className="form-group full-width">
                  <label>About / Bio</label>
                  <textarea
                    name="bio"
                    rows="2"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Share a short bio or favorite food cravings!"
                  ></textarea>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" disabled={saving} className="save-profile-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Profile & Address'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
