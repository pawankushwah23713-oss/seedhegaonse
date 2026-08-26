import React, { useState, useEffect } from 'react';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const defaultForm = {
  name: '',
  originRegion: '',
  category: 'ladoo',
  price: '',
  originalPrice: '',
  description: '',
  discountPercent: '',
  discountValidUntil: '',
  productCouponCode: '',
  productCouponDiscount: '',
  productCouponType: 'flat',
  productCouponValidUntil: '',
  highValueThreshold: '',
  highValueDiscountPercent: '',
  isFreeDelivery: false
};

const AdminAllInOneProducts = () => {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(defaultForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [editingId, setEditingId] = useState(null); // null = Add mode, id = Edit mode
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const token = localStorage.getItem('token');

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products`);
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Click on Edit Product
  const handleEditClick = (p) => {
    setEditingId(p._id);
    setFormData({
      name: p.name || '',
      originRegion: p.originRegion || '',
      category: p.category || 'ladoo',
      price: p.price || '',
      originalPrice: p.originalPrice || '',
      description: p.description || '',
      discountPercent: p.discountPercent || '',
      discountValidUntil: p.discountValidUntil ? p.discountValidUntil.slice(0, 16) : '',
      productCouponCode: p.productCouponCode || '',
      productCouponDiscount: p.productCouponDiscount || '',
      productCouponType: p.productCouponType || 'flat',
      productCouponValidUntil: p.productCouponValidUntil ? p.productCouponValidUntil.slice(0, 16) : '',
      highValueThreshold: p.highValueThreshold || '',
      highValueDiscountPercent: p.highValueDiscountPercent || '',
      isFreeDelivery: !!p.isFreeDelivery
    });
    setImagePreview(p.image ? (p.image.startsWith('http') ? p.image : `${API_BASE.replace('/api', '')}${p.image}`) : null);
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setImageFile(null);
    setImagePreview(null);
  };

  // Submit (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      if (imageFile) {
        data.append('image', imageFile);
      }

      const url = editingId ? `${API_BASE}/products/${editingId}` : `${API_BASE}/products`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Operation failed');

      setMsg({
        text: editingId ? '🎉 Product updated successfully!' : '🎉 New product added successfully!',
        type: 'success'
      });

      handleCancelEdit();
      fetchProducts();
    } catch (err) {
      setMsg({ text: err.message || 'Error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Delete Product
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMsg({ text: '🗑️ Product deleted', type: 'success' });
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '20px auto', padding: '20px', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#94191d' }}>
            {editingId ? '✏️ Edit Sweet Product & Custom Offers' : '➕ Add Sweet Product & Dynamic Offers'}
          </h1>
          <p style={{ margin: '5px 0 0', color: '#64748b' }}>
            Manage limited-time discounts, product coupons, bulk spending rules (₹12,000+), and free delivery in one place.
          </p>
        </div>
        {editingId && (
          <button
            onClick={handleCancelEdit}
            style={{ padding: '8px 16px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            ✕ Cancel Edit
          </button>
        )}
      </div>

      {/* FEEDBACK MSG */}
      {msg.text && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: '8px',
          background: msg.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'success' ? '#15803d' : '#b91c1c',
          fontWeight: 'bold'
        }}>
          {msg.text}
        </div>
      )}

      {/* 📝 MASTER ALL-IN-ONE FORM */}
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', marginBottom: '40px' }}>
        
        {/* SECTION 1: BASIC DETAILS */}
        <h3 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', color: '#334155' }}>📦 1. Basic Sweet Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px', marginTop: '12px' }}>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Sweet Name *</label>
            <input type="text" name="name" required placeholder="e.g. Shuddh Desi Ghee Besan Laddu" value={formData.name} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Origin Region / Gaon *</label>
            <input type="text" name="originRegion" required placeholder="e.g. Kanpur, UP" value={formData.originRegion} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} style={inputStyle}>
              <option value="ladoo">Ladoo</option>
              <option value="peda">Peda</option>
              <option value="petha">Petha</option>
              <option value="halwa">Halwa</option>
              <option value="barfi">Barfi & Katli</option>
              <option value="special">Regional Special</option>
            </select>
          </div>
        </div>

        {/* SECTION 2: BASE PRICING & MRP */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '15px', marginTop: '15px' }}>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Selling Price (₹) *</label>
            <input type="number" name="price" required min="1" placeholder="e.g. 500" value={formData.price} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>MRP / Original Price (₹)</label>
            <input type="number" name="originalPrice" min="0" placeholder="e.g. 600" value={formData.originalPrice} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Product Description</label>
            <input type="text" name="description" placeholder="Desi mithaas, made with 100% bilona ghee..." value={formData.description} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        {/* SECTION 3: TIMELINE-BASED DISCOUNT (SOME DAYS OFFER) */}
        <h3 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginTop: '25px', color: '#d97706' }}>
          ⏳ 2. Limited Days Special Discount (Timeline Offer)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px', marginTop: '12px', background: '#fffbeb', padding: '15px', borderRadius: '8px' }}>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#b45309' }}>Special Discount (%)</label>
            <input type="number" name="discountPercent" min="0" max="100" placeholder="e.g. 15" value={formData.discountPercent} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#b45309' }}>Offer Valid Until (Date & Time Expiry)</label>
            <input type="datetime-local" name="discountValidUntil" value={formData.discountValidUntil} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        {/* SECTION 4: PRODUCT-SPECIFIC SECRET COUPON */}
        <h3 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginTop: '25px', color: '#7c3aed' }}>
          🎟️ 3. Product-Specific Coupon Code (Optional)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 2fr', gap: '15px', marginTop: '12px', background: '#f5f3ff', padding: '15px', borderRadius: '8px' }}>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#6d28d9' }}>Coupon Code</label>
            <input type="text" name="productCouponCode" placeholder="e.g. BESAN50" value={formData.productCouponCode} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#6d28d9' }}>Discount Type</label>
            <select name="productCouponType" value={formData.productCouponType} onChange={handleChange} style={inputStyle}>
              <option value="flat">Flat ₹ OFF</option>
              <option value="percentage">% Percentage</option>
            </select>
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#6d28d9' }}>Coupon Value</label>
            <input type="number" name="productCouponDiscount" placeholder="e.g. 50" value={formData.productCouponDiscount} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#6d28d9' }}>Coupon Expiry Date</label>
            <input type="datetime-local" name="productCouponValidUntil" value={formData.productCouponValidUntil} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        {/* SECTION 5: HIGH VALUE / BULK RULE (₹12,000+) & FREE DELIVERY */}
        <h3 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginTop: '25px', color: '#059669' }}>
          💎 4. High-Value Threshold (₹12,000+) & Delivery Rules
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.5fr', gap: '15px', marginTop: '12px', background: '#ecfdf5', padding: '15px', borderRadius: '8px', alignItems: 'center' }}>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#047857' }}>Bulk Spend Threshold (₹)</label>
            <input type="number" name="highValueThreshold" placeholder="e.g. 12000" value={formData.highValueThreshold} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#047857' }}>Extra Bulk Discount (%)</label>
            <input type="number" name="highValueDiscountPercent" placeholder="e.g. 20" value={formData.highValueDiscountPercent} onChange={handleChange} style={inputStyle} />
          </div>
          <div style={{ paddingTop: '18px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#047857', cursor: 'pointer' }}>
              <input type="checkbox" name="isFreeDelivery" checked={formData.isFreeDelivery} onChange={handleChange} style={{ width: '18px', height: '18px' }} />
              🚚 Free Delivery on this Sweet
            </label>
          </div>
        </div>

        {/* SECTION 6: PRODUCT IMAGE */}
        <div style={{ marginTop: '20px' }}>
          <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Product Photo {editingId ? '(Leave empty to keep existing image)' : '*'}</label>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '8px' }}>
            <input type="file" accept="image/*" onChange={handleImageChange} required={!editingId} />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }} />
            )}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div style={{ marginTop: '25px', display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '12px 28px',
              background: editingId ? '#059669' : '#94191d',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Processing...' : editingId ? '💾 Update Sweet Product' : '🚀 Save & Publish Sweet'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              style={{ padding: '12px 20px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* 📋 SECTION: ALL PRODUCTS LIST */}
      <div>
        <h2>📋 All Store Products & Active Rules ({products.length})</h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          {products.map((p) => {
            const hasTimelineDiscount = p.discountPercent > 0 && (!p.discountValidUntil || new Date(p.discountValidUntil) > new Date());
            const hasCoupon = p.productCouponCode && (!p.productCouponValidUntil || new Date(p.productCouponValidUntil) > new Date());
            const hasBulkRule = p.highValueThreshold > 0;
            const imgSrc = p.image?.startsWith('http') ? p.image : `${API_BASE.replace('/api', '')}${p.image}`;

            return (
              <div
                key={p._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#fff',
                  padding: '16px 20px',
                  borderRadius: '10px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  borderLeft: `5px solid ${editingId === p._id ? '#059669' : '#94191d'}`
                }}
              >
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <img src={imgSrc} alt={p.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: '#1e293b' }}>{p.name}</h3>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Price: <strong>₹{p.price}</strong> | Origin: {p.originRegion} | Category: {p.category}
                    </div>

                    {/* Active Rules Badges */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {hasTimelineDiscount && (
                        <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          ⏳ {p.discountPercent}% OFF (Ends: {new Date(p.discountValidUntil).toLocaleDateString()})
                        </span>
                      )}
                      {hasCoupon && (
                        <span style={{ background: '#ede9fe', color: '#5b21b6', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          🎟️ Coupon: {p.productCouponCode} ({p.productCouponType === 'flat' ? `₹${p.productCouponDiscount}` : `${p.productCouponDiscount}%`})
                        </span>
                      )}
                      {hasBulkRule && (
                        <span style={{ background: '#dcfce7', color: '#166534', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          💎 ₹{p.highValueThreshold}+ spend = {p.highValueDiscountPercent}% OFF
                        </span>
                      )}
                      {p.isFreeDelivery && (
                        <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          🚚 Free Shipping
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleEditClick(p)}
                    style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  marginTop: '5px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box'
};

export default AdminAllInOneProducts;