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
    originalPrice: '',
    discount: '',
    offerText: '',
    category: 'ladoo',
    description: ''
  });

  // Main Image States
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // 🟢 Offer Image States (Optional)
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
      data.append('originalPrice', formData.originalPrice || 0);
      data.append('discount', formData.discount || 0);
      data.append('offerText', formData.offerText || '');
      data.append('category', formData.category);
      data.append('description', formData.description);
      data.append('image', imageFile);

      if (offerImageFile) {
        data.append('offerImage', offerImageFile);
      }

      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: data
      });

      const result = await response.json();

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
      setError(err.message || 'Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto' }}>
      <h1 className="page-heading">➕ Add New Authentic Sweet & Offers</h1>

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
          </div>

          {/* 🟢 PRICING & CHHOOT / DISCOUNT SECTION */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            {/* Selling Price */}
            <div className="form-group">
              <label>Selling Price (₹) *</label>
              <input
                type="number"
                name="price"
                placeholder="e.g. 900"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            {/* Original MRP */}
            <div className="form-group">
              <label>Original MRP (₹) (Optional)</label>
              <input
                type="number"
                name="originalPrice"
                placeholder="e.g. 1000"
                value={formData.originalPrice}
                onChange={handleChange}
              />
            </div>

            {/* Chhoot / Discount */}
            <div className="form-group">
              <label>Chhoot / Discount (%) (Optional)</label>
              <input
                type="number"
                name="discount"
                placeholder="e.g. 10"
                value={formData.discount}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Offer Text / Tag */}
          <div className="form-group">
            <label>Offer Tag / Badge Text (Optional)</label>
            <input
              type="text"
              name="offerText"
              placeholder="e.g. Diwali Dhamaka, Buy 1 Get 1, Special Discount"
              value={formData.offerText}
              onChange={handleChange}
            />
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

          {/* 📸 1. MAIN PRODUCT IMAGE UPLOAD */}
          <div className="form-group">
            <label>Sweet Image (.png, .jpg, .webp, .svg up to 5MB) *</label>
            
            {!imagePreview ? (
              <label style={{
                border: '2px dashed #d97706',
                borderRadius: '10px',
                padding: '24px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: '#fffbeb',
                display: 'block'
              }}>
                <div style={{ fontSize: '1.8rem' }}>📷</div>
                <p style={{ margin: '6px 0 0', fontWeight: '600', color: '#b45309' }}>
                  Click to Browse or Drag Main Image Here
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
                    fontSize: '12px'
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* 🎁 2. OFFER BANNER / BADGE IMAGE (OPTIONAL) */}
          <div className="form-group" style={{ marginTop: '10px' }}>
            <label>Offer Badge / Banner Image (Optional)</label>
            
            {!offerImagePreview ? (
              <label style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: '#f8fafc',
                display: 'block'
              }}>
                <div style={{ fontSize: '1.5rem' }}>🏷️</div>
                <p style={{ margin: '4px 0 0', fontWeight: '600', color: '#64748b' }}>
                  Upload Special Offer Badge / Sticker (Optional)
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
            style={{ marginTop: '20px', height: '46px' }}
          >
            {loading ? 'Uploading & Saving Sweet...' : '🚀 Save & Publish Sweet'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminAddProduct;