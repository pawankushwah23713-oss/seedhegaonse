// src/pages/ProfileInfo.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileInfo.css';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'http://localhost:5000/api');

const SERVER_HOST = API_BASE.replace('/api', '');

const ProfileInfo = ({ onUserUpdated, onLogout }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Fetch Current User Details
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/auth');
          return;
        }

        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok) {
          const nameParts = (data.name || '').split(' ');
          setFormData({
            firstName: data.firstName || nameParts[0] || '',
            lastName: data.lastName || nameParts.slice(1).join(' ') || '',
            email: data.email || '',
            phone: data.phone || '',
            newPassword: '',
            confirmPassword: ''
          });

          if (data.avatar) {
            setAvatarPreview(data.avatar.startsWith('http') ? data.avatar : `${SERVER_HOST}${data.avatar}`);
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Image Upload Handler
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // 2. Submit Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Password Match Check
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        setError('New password must be at least 6 characters long.');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError('New password and Confirm password do not match!');
        return;
      }
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('firstName', formData.firstName);
      data.append('lastName', formData.lastName);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      if (formData.newPassword) {
        data.append('newPassword', formData.newPassword);
      }
      if (avatarFile) {
        data.append('avatar', avatarFile);
      }

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Profile update failed.');

      setSuccess('Profile updated successfully!');
      localStorage.setItem('currentUser', JSON.stringify(result.user));

      if (onUserUpdated) onUserUpdated(result.user);

      setFormData((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Delete Account
  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete your account permanently? This action cannot be undone.'
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        alert('Account deleted successfully.');
        if (onLogout) onLogout();
        navigate('/auth');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete account.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="profile-page-container">
      <h1 className="profile-main-title">Profile Info</h1>

      <div className="profile-card">
        {error && <div className="profile-alert error">{error}</div>}
        {success && <div className="profile-alert success">{success}</div>}

        {/* ── TOP AVATAR SECTION ── */}
        <div className="profile-avatar-row">
          <label htmlFor="avatar-upload-input" className="profile-avatar-box">
            {avatarPreview ? (
              <img src={avatarPreview} alt="User Avatar" crossOrigin="anonymous" />
            ) : (
              <div className="avatar-placeholder-icon">🖼️</div>
            )}
            <input
              id="avatar-upload-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </label>

          <div className="profile-avatar-info">
            <h3>{formData.firstName || 'Customer'}</h3>
            <label htmlFor="avatar-upload-input" className="change-profile-text">
              Change your profile <span className="ratio-hint">(* Image ratio should be 1:1 )</span>
            </label>
          </div>
        </div>

        {/* ── ACCOUNT INFORMATION FORM ── */}
        <form onSubmit={handleUpdate} className="profile-form">
          <h2 className="section-title">Account information</h2>

          <div className="form-grid-2">
            <div className="input-field">
              <label>First name</label>
              <input
                type="text"
                name="firstName"
                placeholder="Customer"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-field">
              <label>Last name</label>
              <input
                type="text"
                name="lastName"
                placeholder="Singh"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="input-field">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="customer@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-field">
              <label>
                Phone number <span className="required-hint">(* Country code is must Like for +91 )</span>
              </label>
              <input
                type="text"
                name="phone"
                placeholder="+919399982548"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="input-field password-field">
              <label>New password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  placeholder="••••••••"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  👁️
                </button>
              </div>
            </div>

            <div className="input-field password-field">
              <label>Confirm password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  👁️
                </button>
              </div>
            </div>
          </div>

          {/* ── BOTTOM ACTIONS ── */}
          <div className="profile-actions-footer">
            <button
              type="button"
              className="btn-delete-account"
              onClick={handleDeleteAccount}
            >
              Delete account
            </button>

            <button
              type="submit"
              className="btn-update-profile"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileInfo;