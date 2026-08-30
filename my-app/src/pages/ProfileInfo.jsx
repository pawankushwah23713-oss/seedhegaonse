// src/pages/ProfileInfo.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileInfo.css';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const SERVER_HOST = API_BASE.replace('/api', '');

// Same list used in the Cart drawer, kept here so this page can render
// the same State dropdown when editing the saved address.
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const ProfileInfo = ({ onUserUpdated, onLogout }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    newPassword: '',
    confirmPassword: '',
    // 🟢 Saved address fields (same shape as the Cart drawer's shippingAddress,
    // so an address saved from checkout shows up here automatically)
    addressType: 'Permanent',
    address: '',
    landmark: '',
    state: '',
    city: '',
    pincode: '',
    country: 'India'
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
            confirmPassword: '',
            // 🟢 Populate the saved address (present once the user has
            // saved one from checkout, or edited it here before)
            addressType: data.addressType || 'Permanent',
            address: data.address || '',
            landmark: data.landmark || '',
            state: data.state || '',
            city: data.city || '',
            pincode: data.pincode || '',
            country: data.country || 'India'
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

  // Pincode should only ever be digits, max 6 (same rule as Cart checkout)
  const handlePincodeChange = (e) => {
    const newPin = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode: newPin }));
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

      // 🟢 Send the (possibly edited) saved address along with the rest
      // of the profile update
      data.append('addressType', formData.addressType);
      data.append('address', formData.address);
      data.append('landmark', formData.landmark);
      data.append('state', formData.state);
      data.append('city', formData.city);
      data.append('pincode', formData.pincode);
      data.append('country', formData.country);

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

      setFormData((prev) => ({
        ...prev,
        newPassword: '',
        confirmPassword: '',
        addressType: result.user.addressType || prev.addressType,
        address: result.user.address ?? prev.address,
        landmark: result.user.landmark ?? prev.landmark,
        state: result.user.state ?? prev.state,
        city: result.user.city ?? prev.city,
        pincode: result.user.pincode ?? prev.pincode,
        country: result.user.country || prev.country
      }));
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

          {/* ── 🟢 SAVED ADDRESS SECTION (fetched from /auth/me, editable, saved via /auth/profile) ── */}
          <h2 className="section-title" style={{ marginTop: '10px' }}>Saved address</h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '-6px 0 14px' }}>
            This is the address used at checkout. Ticking "Save this address" in the cart
            will update it here automatically — you can also edit it directly below.
          </p>

          <div className="form-grid-2">
            <div className="input-field">
              <label>Address type</label>
              <select name="addressType" value={formData.addressType} onChange={handleChange}>
                <option value="Permanent">Permanent</option>
                <option value="Home">Home</option>
                <option value="Office">Office</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="input-field">
              <label>Country</label>
              <select name="country" value={formData.country} onChange={handleChange}>
                <option value="India">India</option>
              </select>
            </div>
          </div>

          <div className="input-field">
            <label>Address</label>
            <textarea
              name="address"
              placeholder="House / Flat No., Street, Building Name"
              rows="3"
              value={formData.address}
              onChange={handleChange}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div className="form-grid-2">
            <div className="input-field">
              <label>Landmark / Floor / House details</label>
              <input
                type="text"
                name="landmark"
                placeholder="e.g. Near Shiv Temple, 2nd Floor"
                value={formData.landmark}
                onChange={handleChange}
              />
            </div>

            <div className="input-field">
              <label>State / Union Territory</label>
              <select name="state" value={formData.state} onChange={handleChange}>
                <option value="">Select State / UT</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="input-field">
              <label>City</label>
              <input
                type="text"
                name="city"
                placeholder="e.g. Noida, Delhi"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div className="input-field">
              <label>Pincode (6 digits)</label>
              <input
                type="text"
                name="pincode"
                maxLength="6"
                placeholder="e.g. 201301"
                value={formData.pincode}
                onChange={handlePincodeChange}
              />
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