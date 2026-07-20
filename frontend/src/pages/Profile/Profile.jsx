import React, { useContext, useEffect, useState } from 'react';
import './Profile.css';
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { url, token } = useContext(StoreContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    profession: '',
    dietary_preference: 'Veg',
    bio: '',
    created_at: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
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
        setUser(resData.user);
        setFormData({
          name: resData.user.name || '',
          phone: resData.user.phone || '',
          address: resData.user.address || '',
          profession: resData.user.profession || '',
          dietary_preference: resData.user.dietary_preference || 'Veg',
          bio: resData.user.bio || ''
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`${url}/api/user/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: token
        },
        body: JSON.stringify(formData)
      });
      const resData = await response.json();
      if (resData.success && resData.user) {
        setUser(resData.user);
        setIsEditing(false);
        alert('🎉 Profile updated successfully!');
      } else {
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
        <div className="empty-icon">🔒</div>
        <h3>Please Sign In</h3>
        <p>You must be logged in to view and manage your personal profile.</p>
        <button onClick={() => navigate('/')} className="explore-btn">Go to Home</button>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      <div className="profile-card">
        {/* Banner / Header */}
        <div className="profile-banner">
          <div className="avatar-wrapper">
            <img src={assets.profile_icon} alt="Profile Avatar" className="avatar-img" />
          </div>
        </div>

        <div className="profile-body">
          <div className="profile-header-info">
            <h2>{user.name || 'Food Lover'}</h2>
            <p className="profile-email">{user.email}</p>
            <div className="profile-badges">
              <span className={`diet-badge ${user.dietary_preference ? user.dietary_preference.toLowerCase() : 'veg'}`}>
                {user.dietary_preference === 'Veg' ? '🌱 Pure Veg' : user.dietary_preference === 'Non-Veg' ? '🍖 Non-Veg' : user.dietary_preference === 'Vegan' ? '🥗 Vegan' : '🥚 Eggetarian'}
              </span>
              {user.profession && <span className="profession-badge">💼 {user.profession}</span>}
              <span className="member-badge">
                📅 Member since {new Date(user.created_at || Date.now()).getFullYear()}
              </span>
            </div>
          </div>

          <hr className="profile-divider" />

          {!isEditing ? (
            /* VIEW MODE */
            <div className="profile-details-view">
              <div className="details-header">
                <h3>Personal Information</h3>
                <button onClick={() => setIsEditing(true)} className="edit-profile-btn">
                  ✏️ Edit Profile
                </button>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Full Name</span>
                  <p className="info-value">{user.name || 'Not specified'}</p>
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

                <div className="info-item full-width">
                  <span className="info-label">Saved Delivery Address</span>
                  <p className="info-value">{user.address || 'No saved address yet'}</p>
                </div>

                <div className="info-item full-width">
                  <span className="info-label">About / Bio</span>
                  <p className="info-value">{user.bio || 'Passionate about delicious food & fast deliveries!'}</p>
                </div>
              </div>
            </div>
          ) : (
            /* EDIT MODE */
            <form onSubmit={handleSave} className="profile-edit-form">
              <div className="details-header">
                <h3>Edit Profile Information</h3>
                <button type="button" onClick={() => setIsEditing(false)} className="cancel-edit-btn">
                  ✕ Cancel
                </button>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your Full Name"
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                  />
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

                <div className="form-group">
                  <label>Meal / Dietary Preference</label>
                  <select
                    name="dietary_preference"
                    value={formData.dietary_preference}
                    onChange={handleChange}
                  >
                    <option value="Veg">🌱 Pure Veg</option>
                    <option value="Non-Veg">🍖 Non-Veg</option>
                    <option value="Eggetarian">🥚 Eggetarian</option>
                    <option value="Vegan">🥗 Vegan</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Default Delivery Address</label>
                  <textarea
                    name="address"
                    rows="3"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Flat / House No, Street, City, Pincode"
                  ></textarea>
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
                <button type="submit" disabled={saving} className="save-profile-btn">
                  {saving ? 'Saving...' : '💾 Save Profile'}
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
