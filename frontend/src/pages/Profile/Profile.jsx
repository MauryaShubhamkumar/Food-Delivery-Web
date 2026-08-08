import React, { useContext, useEffect, useState } from 'react';
import './Profile.css';
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { url, token, loadUserProfile, setUser: setGlobalUser } = useContext(StoreContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);

  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    profession: '',
    dietary_preference: 'Veg',
    bio: '',
    avatar_url: null,
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
        alert('📸 Profile photo updated successfully!');
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
        alert('🗑️ Profile photo removed');
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
        if (setGlobalUser) setGlobalUser(resData.user);
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

  const userAvatarSrc = user.avatar_url || assets.profile_icon;

  return (
    <div className="user-profile-page">
      <div className="profile-card">
        {/* Banner / Header */}
        <div className="profile-banner">
          <div className="avatar-wrapper">
            <img src={userAvatarSrc} alt={user.name || 'User'} className={`avatar-img ${!user.avatar_url ? 'default-icon' : ''}`} />
            
            {/* Interactive Upload Overlay */}
            <label className="avatar-upload-overlay" title="Upload new profile photo">
              <span>📷</span>
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
            <h2>{user.name || 'Food Lover'}</h2>
            <p className="profile-email">{user.email}</p>

            {/* Avatar Action Controls */}
            <div className="avatar-actions-bar">
              <label className="avatar-action-btn upload-btn">
                📷 {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
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
                >
                  🗑️ {removingAvatar ? 'Removing...' : 'Remove Photo'}
                </button>
              ) : null}
            </div>

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
