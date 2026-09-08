import React, { useState, useEffect } from 'react';

// 🟢 STRICTLY resolve base URL from imported .env variable (Always ensures /api)
const getBaseApiUrl = () => {
  const envUrl = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
    ? process.env.REACT_APP_API_URL
    : (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL);

  if (!envUrl) {
    console.error('⚠️ Missing REACT_APP_API_URL or VITE_API_URL in .env file!');
    return '';
  }

  const clean = envUrl.trim().replace(/\/auth\/?$/, '').replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const API_BASE = getBaseApiUrl();

const CATEGORIES = [
  { value: 'ladoo', label: 'Ladoo' },
  { value: 'peda', label: 'Peda' },
  { value: 'petha', label: 'Petha' },
  { value: 'halwa', label: 'Halwa' },
  { value: 'barfi', label: 'Barfi & Katli' },
  { value: 'special', label: 'Regional Special' }
];

const defaultForm = {
  // 1. Basic Metadata
  name: '',
  category: 'ladoo',
  productRank: '1',
  latestProduct: false,
  skuNo: '',
  originRegion: '',
  description: '',

  // 2. Attributes
  shelfLife: '',
  preservation: '',
  desiGhee: '',
  hygiene: '',

  // 3. Tax & Compliance
  gstRate: '5',
  hsnCode: '',

  // 4. Base Pricing & Stock
  price: '',
  originalPrice: '',
  inStock: true,
  isFreeDelivery: false,

  // 5. Dynamic Variants
  variants: [
    { weight: '250g', price: '', discountLumpsum: '0', discountPercent: '0', quantityAvailable: '10', stockAvailableDate: '' },
    { weight: '500g', price: '', discountLumpsum: '0', discountPercent: '0', quantityAvailable: '10', stockAvailableDate: '' }
  ]
};

const defaultSlots = [
  { file: null, preview: '', existingUrl: '' },
  { file: null, preview: '', existingUrl: '' },
  { file: null, preview: '', existingUrl: '' }
];

const AdminAllInOneProducts = () => {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(defaultForm);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // 3 Dedicated Image Slots
  const [imageSlots, setImageSlots] = useState(defaultSlots);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const token = localStorage.getItem('token');

  // Fetch Products from .env API_BASE
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server error (${res.status})`);
      }
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setMsg({ text: `Failed to load products: ${err.message}`, type: 'error' });
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

  // Dynamic Variants Handlers
  const handleVariantChange = (index, field, value) => {
    const updated = [...formData.variants];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, variants: updated }));
  };

  const addVariantRow = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { weight: '', price: '', discountLumpsum: '0', discountPercent: '0', quantityAvailable: '0', stockAvailableDate: '' }
      ]
    }));
  };

  const removeVariantRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  // 3 Images Slots Handler (Individual slot file pick & remove)
  const handleSlotImageChange = (index, file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setImageSlots((prev) => {
      const updated = [...prev];
      updated[index] = { file, preview: previewUrl, existingUrl: '' };
      return updated;
    });
  };

  const handleRemoveSlotImage = (index) => {
    setImageSlots((prev) => {
      const updated = [...prev];
      updated[index] = { file: null, preview: '', existingUrl: '' };
      return updated;
    });
  };

  // Submit / Save
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === 'variants') {
          data.append(key, JSON.stringify(formData[key]));
        } else if (typeof formData[key] === 'boolean') {
          data.append(key, formData[key] ? 'true' : 'false');
        } else {
          data.append(key, formData[key]);
        }
      });

      // Append newly uploaded files from 3 slots
      imageSlots.forEach((slot) => {
        if (slot.file) {
          data.append('images', slot.file);
        }
      });

      // If editing, retain any existing images kept by the user
      if (editingId) {
        const retainedExisting = imageSlots
          .filter((slot) => !slot.file && slot.existingUrl)
          .map((slot) => slot.existingUrl);
        data.append('existingImages', JSON.stringify(retainedExisting));
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
        text: editingId ? '🎉 Product updated successfully!' : '🎉 Product published successfully!',
        type: 'success'
      });

      handleCancelEdit();
      fetchProducts();
    } catch (err) {
      setMsg({ text: err.message || 'Error occurred while saving', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (p) => {
    setEditingId(p._id);

    // Check if category is standard or custom
    const isCustom = !CATEGORIES.some((c) => c.value === p.category);
    setIsCustomCategory(isCustom);

    setFormData({
      name: p.name || '',
      category: p.category || 'ladoo',
      productRank: p.productRank || '1',
      latestProduct: !!p.latestProduct,
      skuNo: p.skuNo || '',
      originRegion: p.originRegion || '',
      description: p.description || '',
      shelfLife: p.shelfLife || '',
      preservation: p.preservation || '',
      desiGhee: p.desiGhee || '',
      hygiene: p.hygiene || '',
      gstRate: p.gstRate || '5',
      hsnCode: p.hsnCode || '',
      price: p.price || '',
      originalPrice: p.originalPrice || '',
      inStock: p.inStock !== false,
      isFreeDelivery: !!p.isFreeDelivery,
      variants: Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : defaultForm.variants
    });

    // Populate existing images into slots 1, 2, 3
    const imgs = p.images?.length > 0 ? p.images : (p.image ? [p.image] : []);
    const populatedSlots = [0, 1, 2].map((idx) => {
      const rawUrl = imgs[idx] || '';
      const fullUrl = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `${API_BASE.replace('/api', '')}${rawUrl}`) : '';
      return {
        file: null,
        preview: fullUrl,
        existingUrl: rawUrl
      };
    });
    setImageSlots(populatedSlots);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setIsCustomCategory(false);
    setImageSlots(defaultSlots);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMsg({ text: '🗑️ Product deleted successfully', type: 'success' });
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '1150px', margin: '20px auto', padding: '15px', fontFamily: 'Segoe UI, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #94191d', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#94191d', margin: 0 }}>
          {editingId ? '✏️ Edit Product' : '📦 Product Upload (Catalogue System)'}
        </h2>
        {editingId && (
          <button onClick={handleCancelEdit} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer' }}>
            ✕ Cancel Edit
          </button>
        )}
      </div>

      {msg.text && (
        <div style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '8px', background: msg.type === 'success' ? '#dcfce7' : '#fee2e2', color: msg.type === 'success' ? '#15803d' : '#b91c1c', fontWeight: 'bold' }}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
        {/* ROW 1: BASIC METADATA */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={labelStyle}>Category *</label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomCategory(!isCustomCategory);
                  if (isCustomCategory) {
                    setFormData((prev) => ({ ...prev, category: 'ladoo' }));
                  }
                }}
                style={{ background: 'none', border: 'none', color: '#94191d', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
              >
                {isCustomCategory ? '← Choose from List' : '+ Add Custom'}
              </button>
            </div>

            {isCustomCategory ? (
              <input
                type="text"
                name="category"
                required
                placeholder="Type custom category (e.g. Namkeen)"
                value={formData.category}
                onChange={handleChange}
                style={inputStyle}
              />
            ) : (
              <select
                name="category"
                value={formData.category}
                onChange={(e) => {
                  if (e.target.value === '__add_custom__') {
                    setIsCustomCategory(true);
                    setFormData((prev) => ({ ...prev, category: '' }));
                  } else {
                    handleChange(e);
                  }
                }}
                style={inputStyle}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
                <option value="__add_custom__">+ Add Custom Category...</option>
              </select>
            )}
          </div>

          <div>
            <label style={labelStyle}>Product Rank</label>
            <input type="number" name="productRank" value={formData.productRank} onChange={handleChange} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Latest Product (Yes/No)</label>
            <select name="latestProduct" value={formData.latestProduct} onChange={(e) => setFormData((p) => ({ ...p, latestProduct: e.target.value === 'true' }))} style={inputStyle}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>SKU No</label>
            <input type="text" name="skuNo" placeholder="e.g. SKU-LADOO-001" value={formData.skuNo} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        {/* ROW 2: NAME, REGION, DESCRIPTION */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '15px', marginTop: '15px' }}>
          <div>
            <label style={labelStyle}>Product Name *</label>
            <input type="text" name="name" required placeholder="e.g. Pure Desi Ghee Besan Laddu" value={formData.name} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Origin Place *</label>
            <input type="text" name="originRegion" required placeholder="e.g. Kanpur, Uttar Pradesh" value={formData.originRegion} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Product Description</label>
            <input type="text" name="description" placeholder="Handcrafted with 100% bilona ghee..." value={formData.description} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        {/* ROW 3: QUALITY ATTRIBUTES */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
          <div>
            <label style={labelStyle}>Shelf Life</label>
            <input type="text" name="shelfLife" placeholder="e.g. 30 Days" value={formData.shelfLife} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Preservation</label>
            <input type="text" name="preservation" placeholder="e.g. Store in cool dry place" value={formData.preservation} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Desi Ghee (%)</label>
            <input type="text" name="desiGhee" placeholder="e.g. 100% Pure Desi Ghee" value={formData.desiGhee} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Hygiene</label>
            <input type="text" name="hygiene" placeholder="e.g. Untouched packaging" value={formData.hygiene} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        {/* ROW 4: DYNAMIC VARIANTS TABLE */}
        <div style={{ marginTop: '25px', background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <h4 style={{ margin: 0, color: '#334155' }}>⚖️ Weight Variants, Pricing & Stock Availability</h4>
            <button type="button" onClick={addVariantRow} style={{ background: '#facc15', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', color: '#713f12' }}>
              + Add Variant
            </button>
          </div>

          {formData.variants.map((v, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr)) auto', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <input type="text" placeholder="Weight (e.g. 500g)" value={v.weight} onChange={(e) => handleVariantChange(i, 'weight', e.target.value)} style={inputStyle} />
              <input type="number" placeholder="Price (₹)" value={v.price} onChange={(e) => handleVariantChange(i, 'price', e.target.value)} style={inputStyle} />
              <input type="number" placeholder="Disc. Flat (₹)" value={v.discountLumpsum} onChange={(e) => handleVariantChange(i, 'discountLumpsum', e.target.value)} style={inputStyle} />
              <input type="number" placeholder="Disc. %" value={v.discountPercent} onChange={(e) => handleVariantChange(i, 'discountPercent', e.target.value)} style={inputStyle} />
              <input type="number" placeholder="Qty Available" value={v.quantityAvailable} onChange={(e) => handleVariantChange(i, 'quantityAvailable', e.target.value)} style={inputStyle} />
              <input type="date" title="Date on which Stock Available" value={v.stockAvailableDate ? v.stockAvailableDate.slice(0, 10) : ''} onChange={(e) => handleVariantChange(i, 'stockAvailableDate', e.target.value)} style={inputStyle} />
              {formData.variants.length > 1 && (
                <button type="button" onClick={() => removeVariantRow(i)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '9px 12px', borderRadius: '6px', cursor: 'pointer' }}>✕</button>
              )}
            </div>
          ))}
          <small style={{ color: '#dc2626', display: 'block', marginTop: '6px' }}>
            * Jab Quantity Available 0 ho jayegi, product store par automatically Out of Stock show hoga.
          </small>
        </div>

        {/* ROW 5: TAX & GST */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginTop: '15px' }}>
          <div>
            <label style={labelStyle}>GST on Product (% Rate of Tax)</label>
            <input type="number" name="gstRate" placeholder="5" value={formData.gstRate} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>HSN Code</label>
            <input type="text" name="hsnCode" placeholder="e.g. 2106" value={formData.hsnCode} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Base Fallback Price (₹)</label>
            <input type="number" name="price" placeholder="e.g. 500" value={formData.price} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        {/* ROW 6: FIXED 3 IMAGES SLOTS UPLOAD */}
        <div style={{ marginTop: '25px' }}>
          <label style={labelStyle}>Images Upload (Image 1, Image 2, Image 3) — Suggested Size: 800x800 px</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginTop: '12px' }}>
            {[0, 1, 2].map((idx) => {
              const slot = imageSlots[idx];
              const slotLabels = ['Image +1 (Main Cover)', 'Image +2', 'Image +3'];

              return (
                <div
                  key={idx}
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '8px',
                    padding: '12px',
                    textAlign: 'center',
                    background: slot.preview ? '#f8fafc' : '#ffffff',
                    position: 'relative',
                    minHeight: '150px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  {slot.preview ? (
                    <div style={{ width: '100%' }}>
                      <img
                        src={slot.preview}
                        alt={`Slot ${idx + 1}`}
                        style={{
                          width: '100%',
                          height: '110px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          marginBottom: '8px'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <label
                          style={{
                            background: '#0284c7',
                            color: '#fff',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          Change
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleSlotImageChange(idx, e.target.files[0])}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveSlotImage(idx)}
                          style={{
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      style={{
                        cursor: 'pointer',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '10px 0'
                      }}
                    >
                      <span style={{ fontSize: '2rem', color: '#94a3b8' }}>📷</span>
                      <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 'bold', marginTop: '6px' }}>
                        + {slotLabels[idx]}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Click to select</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSlotImageChange(idx, e.target.files[0])}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div style={{ marginTop: '25px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button type="submit" disabled={loading} style={{ background: '#94191d', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: '6px', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer' }}>
            {loading ? 'Processing...' : editingId ? '💾 Update Product' : '🚀 Save & Publish Product'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* STORED PRODUCTS LIST */}
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ color: '#1e293b' }}>Stored Catalogue ({products.length})</h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          {products.map((p) => {
            const imgSrc = p.images?.[0] || p.image;
            const fullImg = imgSrc ? (imgSrc.startsWith('http') ? imgSrc : `${API_BASE.replace('/api', '')}${imgSrc}`) : null;
            return (
              <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '16px', borderRadius: '8px', borderLeft: `5px solid ${p.inStock ? '#15803d' : '#dc2626'}`, boxShadow: '0 2px 6px rgba(0,0,0,0.04)', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  {fullImg && (
                    <img src={fullImg} alt={p.name} style={{ width: '55px', height: '55px', objectFit: 'cover', borderRadius: '6px' }} />
                  )}
                  <div>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#1e293b' }}>
                      {p.name} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({p.skuNo || 'No SKU'})</span>
                    </h4>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Rank: #{p.productRank} | Category: {p.category} | GST: {p.gstRate}% | Status: <strong style={{ color: p.inStock ? '#15803d' : '#dc2626' }}>{p.inStock ? 'In Stock' : 'Out of Stock'}</strong>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEditClick(p)} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Edit</button>
                  <button onClick={() => handleDelete(p._id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
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
  marginTop: '4px',
  borderRadius: '6px',
  border: '1px solid #cbd5e1',
  boxSizing: 'border-box',
  fontSize: '0.9rem'
};

const labelStyle = {
  fontWeight: '600',
  fontSize: '0.85rem',
  color: '#334155'
};

export default AdminAllInOneProducts;