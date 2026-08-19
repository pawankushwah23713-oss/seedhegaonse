// src/pages/admin/AdminAddProduct.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const AdminAddProduct = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    originRegion: '',
    price: '',
    category: 'ladoo',
    description: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle Text Inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Handle Image File Selection & Preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 5MB Client-side limit check
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size cannot exceed 5MB!');
        return;
      }

      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  // Remove Selected Image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!imageFile) {
      setError('Please select a sweet product image!');
      return;
    }

    setLoading(true);

    try {
      // Create FormData payload for Multipart upload
      const data = new FormData();
      data.append('name', formData.name);
      data.append('originRegion', formData.originRegion);
      data.append('price', formData.price);
      data.append('category', formData.category);
      data.append('description', formData.description);
      data.append('image', imageFile);

      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
          // Note: Content-Type header mat lagana, browser automatically boundary set karega
        },
        body: data
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create sweet product.');
      }

      setSuccess('🎉 Sweet product added to store successfully!');
      
      // Reset Form
      setFormData({
        name: '',
        originRegion: '',
        price: '',
        category: 'ladoo',
        description: ''
      });
      setImageFile(null);
      setImagePreview(null);

      // Auto redirect to products list after 1.5s
      setTimeout(() => {
        navigate('/admin/products');
      }, 1500);

    } catch (err) {
      setError(err.message || 'Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto' }}>
      <h1 className="page-heading">➕ Add New Authentic Sweet</h1>

      {error && <div className="badge badge-pending" style={{ display: 'block', padding: '12px', marginBottom: '15px', color: '#dc2626', background: '#fee2e2' }}>{error}</div>}
      {success && <div className="badge badge-success" style={{ display: 'block', padding: '12px', marginBottom: '15px' }}>{success}</div>}

      <div className="admin-content-card">
        <form onSubmit={handleSubmit} className="admin-form">
          {/* Sweet Name */}
          <div className="form-group">
            <label>Sweet Name *</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Pure Desi Ghee Besan Laddu"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Origin */}
            <div className="form-group">
              <label>Origin Region / Gaon *</label>
              <input
                type="text"
                name="originRegion"
                placeholder="e.g. Kanpur, Uttar Pradesh"
                value={formData.originRegion}
                onChange={handleChange}
                required
              />
            </div>

            {/* Price */}
            <div className="form-group">
              <label>Price (₹ per kg / box) *</label>
              <input
                type="number"
                name="price"
                placeholder="e.g. 550"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Category */}
          <div className="form-group">
            <label>Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            >
              <option value="ladoo">Laddu (Besan, Motichoor, Gond)</option>
              <option value="peda">Peda (Mathura, Dharwad)</option>
              <option value="petha">Petha (Agra Special)</option>
              <option value="halwa">Halwa (Sohan, Karachi)</option>
              <option value="barfi">Barfi & Kaju Katli</option>
              <option value="special">Regional Special Sweets</option>
            </select>
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Product Story / Description</label>
            <textarea
              name="description"
              rows="3"
              placeholder="Desi gaon ka shuddh swaad, traditional bhatti par tayyar..."
              value={formData.description}
              onChange={handleChange}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }}
            />
          </div>

          {/* 📸 IMAGE UPLOAD SECTION WITH PREVIEW */}
          <div className="form-group">
            <label>Sweet Image (.png, .jpg, .webp, .svg up to 5MB) *</label>
            
            {!imagePreview ? (
              <label style={{
                border: '2px dashed #d97706',
                borderRadius: '10px',
                padding: '30px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: '#fffbeb',
                display: 'block'
              }}>
                <div style={{ fontSize: '2rem' }}>📷</div>
                <p style={{ margin: '8px 0 0', fontWeight: '600', color: '#b45309' }}>
                  Click to Browse or Drag Image Here
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
                  alt="Preview"
                  style={{ width: '180px', height: '140px', objectFit: 'cover', borderRadius: '10px', border: '2px solid #e2e8f0' }}
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
                    fontSize: '12px'
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
            className="admin-primary-btn"
            disabled={loading}
            style={{ marginTop: '15px', height: '46px' }}
          >
            {loading ? 'Uploading & Saving Sweet...' : '🚀 Save & Publish Sweet'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminAddProduct;