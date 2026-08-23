import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// API Base URL Detection (Vite / CRA / Production Render fallback)
const getApiBaseUrl = () => {
  let url = 'https://seedhegaonse-1.onrender.com/api';
  if (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) {
    url = process.env.REACT_APP_API_URL.replace('/auth', '');
  } else if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    url = import.meta.env.VITE_API_URL.replace('/auth', '');
  }
  return url.endsWith('/api') ? url : `${url}/api`;
};

const API_BASE = getApiBaseUrl();

const AdminAddProduct = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    originRegion: '',
    price: '',
    originalPrice: '',
    discount: '',
    offerText: '',
    category: 'ladoo',
    description: ''
  });

  // Main Image States
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Offer Image States (Optional)
  const [offerImageFile, setOfferImageFile] = useState(null);
  const [offerImagePreview, setOfferImagePreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle Text Inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Handle Main Image Selection & Preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Main image size cannot exceed 5MB!');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  // Handle Offer Image Selection & Preview
  const handleOfferImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Offer image size cannot exceed 5MB!');
        return;
      }
      setOfferImageFile(file);
      setOfferImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  // Remove Images
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleRemoveOfferImage = () => {
    setOfferImageFile(null);
    setOfferImagePreview(null);
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (!formData.name.trim()) {
      setError('Please enter sweet product name!');
      return;
    }
    if (!formData.originRegion.trim()) {
      setError('Please enter sweet origin region/village!');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setError('Please enter a valid selling price greater than 0!');
      return;
    }
    if (!imageFile) {
      setError('Please select a sweet product image!');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Admin token not found. Please log in again.');
      return;
    }

    setLoading(true);

    try {
      // Create FormData payload for Multipart upload
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('originRegion', formData.originRegion.trim());
      data.append('price', String(formData.price));
      data.append('originalPrice', String(formData.originalPrice || 0));
      data.append('discount', String(formData.discount || 0));
      data.append('offerText', formData.offerText ? formData.offerText.trim() : '');
      data.append('category', formData.category);
      data.append('description', formData.description ? formData.description.trim() : '');
      data.append('image', imageFile);

      if (offerImageFile) {
        data.append('offerImage', offerImageFile);
      }

      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
          // Note: FormData ke sath 'Content-Type' header mat lagana, browser boundary auto-set karta hai
        },
        body: data
      });

      // Safe Response Parsing (prevents JSON parse errors on 500 HTML response)
      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const rawText = await response.text();
        throw new Error(`Server returned error (${response.status}): ${rawText.slice(0, 150)}`);
      }

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create sweet product.');
      }

      setSuccess('🎉 Sweet product & offers added to store successfully!');

      // Reset Form
      setFormData({
        name: '',
        originRegion: '',
        price: '',
        originalPrice: '',
        discount: '',
        offerText: '',
        category: 'ladoo',
        description: ''
      });
      setImageFile(null);
      setImagePreview(null);
      setOfferImageFile(null);
      setOfferImagePreview(null);

      // Auto redirect to products list after 1.5s
      setTimeout(() => {
        navigate('/admin/products');
      }, 1500);
    } catch (err) {
      console.error('Submit Error:', err);
      setError(err.message || 'Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto', padding: '20px' }}>
      <h1 className="page-heading" style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '20px' }}>
        ➕ Add New Authentic Sweet & Offers
      </h1>

      {error && (
        <div
          className="badge badge-pending"
          style={{
            display: 'block',
            padding: '12px 16px',
            marginBottom: '15px',
            color: '#dc2626',
            background: '#fee2e2',
            borderRadius: '8px',
            border: '1px solid #fca5a5'
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div
          className="badge badge-success"
          style={{
            display: 'block',
            padding: '12px 16px',
            marginBottom: '15px',
            color: '#15803d',
            background: '#dcfce7',
            borderRadius: '8px',
            border: '1px solid #86efac'
          }}
        >
          {success}
        </div>
      )}

      <div className="admin-content-card" style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <form onSubmit={handleSubmit} className="admin-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Sweet Name */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: '600' }}>Sweet Name *</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Pure Desi Ghee Besan Laddu"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Origin */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '600' }}>Origin Region / Gaon *</label>
              <input
                type="text"
                name="originRegion"
                placeholder="e.g. Kanpur, Uttar Pradesh"
                value={formData.originRegion}
                onChange={handleChange}
                required
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>

            {/* Category */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '600' }}>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }}
              >
                <option value="ladoo">Laddu (Besan, Motichoor, Gond)</option>
                <option value="peda">Peda (Mathura, Dharwad)</option>
                <option value="petha">Petha (Agra Special)</option>
                <option value="halwa">Halwa (Sohan, Karachi)</option>
                <option value="barfi">Barfi & Kaju Katli</option>
                <option value="special">Regional Special Sweets</option>
              </select>
            </div>
          </div>

          {/* Pricing & Discount Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            {/* Selling Price */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '600' }}>Selling Price (₹) *</label>
              <input
                type="number"
                name="price"
                min="1"
                placeholder="e.g. 900"
                value={formData.price}
                onChange={handleChange}
                required
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>

            {/* Original MRP */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '600' }}>Original MRP (₹)</label>
              <input
                type="number"
                name="originalPrice"
                min="0"
                placeholder="e.g. 1000"
                value={formData.originalPrice}
                onChange={handleChange}
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>

            {/* Discount */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '600' }}>Discount (%)</label>
              <input
                type="number"
                name="discount"
                min="0"
                max="100"
                placeholder="e.g. 10"
                value={formData.discount}
                onChange={handleChange}
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>
          </div>

          {/* Offer Text */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: '600' }}>Offer Tag / Badge Text (Optional)</label>
            <input
              type="text"
              name="offerText"
              placeholder="e.g. Diwali Dhamaka, Buy 1 Get 1, Special Discount"
              value={formData.offerText}
              onChange={handleChange}
              style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            />
          </div>

          {/* Description */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: '600' }}>Product Story / Description</label>
            <textarea
              name="description"
              rows="3"
              placeholder="Desi gaon ka shuddh swaad, traditional bhatti par tayyar..."
              value={formData.description}
              onChange={handleChange}
              style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }}
            />
          </div>

          {/* 📸 1. MAIN PRODUCT IMAGE UPLOAD */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontWeight: '600' }}>Main Product Image (.png, .jpg, .webp, .svg up to 5MB) *</label>

            {!imagePreview ? (
              <label
                style={{
                  border: '2px dashed #d97706',
                  borderRadius: '10px',
                  padding: '24px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#fffbeb',
                  display: 'block'
                }}
              >
                <div style={{ fontSize: '1.8rem' }}>📷</div>
                <p style={{ margin: '6px 0 0', fontWeight: '600', color: '#b45309' }}>
                  Click to Browse Main Image
                </p>
                <span style={{ fontSize: '0.8rem', color: '#92400e' }}>Supports PNG, JPG, WEBP, SVG</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>
            ) : (
              <div style={{ position: 'relative', width: 'fit-content', marginTop: '10px' }}>
                <img
                  src={imagePreview}
                  alt="Main Preview"
                  style={{ width: '160px', height: '120px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #e2e8f0' }}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* 🎁 2. OFFER BANNER / BADGE IMAGE (OPTIONAL) */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
            <label style={{ fontWeight: '600' }}>Offer Badge / Banner Image (Optional)</label>

            {!offerImagePreview ? (
              <label
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '10px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#f8fafc',
                  display: 'block'
                }}
              >
                <div style={{ fontSize: '1.5rem' }}>🏷️</div>
                <p style={{ margin: '4px 0 0', fontWeight: '600', color: '#64748b' }}>
                  Upload Special Offer Badge / Sticker
                </p>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                  onChange={handleOfferImageChange}
                  style={{ display: 'none' }}
                />
              </label>
            ) : (
              <div style={{ position: 'relative', width: 'fit-content', marginTop: '10px' }}>
                <img
                  src={offerImagePreview}
                  alt="Offer Preview"
                  style={{ width: '140px', height: '100px', objectFit: 'cover', borderRadius: '10px', border: '2px dashed #f59e0b' }}
                />
                <button
                  type="button"
                  onClick={handleRemoveOfferImage}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '15px',
              padding: '12px 20px',
              background: loading ? '#9ca3af' : '#d97706',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              transition: 'background 0.2s ease'
            }}
          >
            {loading ? '⏳ Uploading & Saving Sweet...' : '🚀 Save & Publish Sweet'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminAddProduct;