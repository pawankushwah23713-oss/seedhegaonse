import React, { useState, useEffect } from 'react';

// 🟢 STRICTLY resolve base URL from imported .env variable
const RAW_ENV_URL = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL
  : (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL);

if (!RAW_ENV_URL) {
  console.error('⚠️ Environment variable REACT_APP_API_URL or VITE_API_URL is missing!');
}

const API_BASE = (RAW_ENV_URL || '').replace(/\/auth\/?$/, '').replace(/\/+$/, '');

const CATEGORIES = [
  { value: 'ladoo', label: 'Ladoo' },
  { value: 'peda', label: 'Peda' },
  { value: 'petha', label: 'Petha' },
  { value: 'halwa', label: 'Halwa' },
  { value: 'barfi', label: 'Barfi & Katli' },
  { value: 'special', label: 'Regional Special' }
];

const defaultForm = {
  // Metadata from Sheet
  name: '',
  category: 'ladoo',
  productRank: '1',
  latestProduct: false, // Yes / No
  skuNo: '',
  originRegion: '',
  description: '',
  shelfLife: '',
  preservation: '',
  desiGhee: '',
  hygiene: '',

  // Tax Details
  gstRate: '5',
  hsnCode: '',

  // Pricing & Stock
  price: '',
  originalPrice: '',
  inStock: true,
  isFreeDelivery: false,

  // Variants (+ dynamic rows)
  variants: [
    { weight: '250g', price: '', discountLumpsum: '0', discountPercent: '0', quantityAvailable: '10', stockAvailableDate: '' },
    { weight: '500g', price: '', discountLumpsum: '0', discountPercent: '0', quantityAvailable: '10', stockAvailableDate: '' }
  ]
};

const AdminAllInOneProducts = () => {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(defaultForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const token = localStorage.getItem('token');

  // Fetch using strictly the .env URL
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products`);
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
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

  // Dynamic Variant Handlers
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

  // Image Handling (Supports up to 3 images as requested in Sheet: Image +1, +2, +3)
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    setImageFiles(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  // Submit Data to API_BASE (.env only)
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

      // Append multi-images
      imageFiles.forEach((file) => {
        data.append('images', file);
      });

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
        text: editingId ? '🎉 Product successfully updated!' : '🎉 New product saved successfully!',
        type: 'success'
      });

      handleCancelEdit();
      fetchProducts();
    } catch (err) {
      setMsg({ text: err.message || 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (p) => {
    setEditingId(p._id);
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

    const imgs = p.images?.length > 0 ? p.images : (p.image ? [p.image] : []);
    setImagePreviews(imgs.map((img) => (img.startsWith('http') ? img : `${API_BASE.replace('/api', '')}${img}`)));
    setImageFiles([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setImageFiles([]);
    setImagePreviews([]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
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
    <div style={{ maxWidth: '1150px', margin: '20px auto', padding: '15px', fontFamily: 'Segoe UI, sans-serif' }}>
      <h2 style={{ color: '#94191d', borderBottom: '2px solid #94191d', paddingBottom: '10px' }}>
        {editingId ? '✏️ Edit Product' : '📦 Product Upload (Catalogue System)'}
      </h2>

      {msg.text && (
        <div style={{ padding: '12px', margin: '15px 0', borderRadius: '6px', background: msg.type === 'success' ? '#dcfce7' : '#fee2e2', color: msg.type === 'success' ? '#15803d' : '#b91c1c', fontWeight: 'bold' }}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
        {/* ROW 1: BASIC METADATA */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
          <div>
            <label style={labelStyle}>Category (Drop Down) *</label>
            <select name="category" value={formData.category} onChange={handleChange} style={inputStyle}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
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
            <input type="text" name="skuNo" placeholder="e.g. SKU-BESAN-01" value={formData.skuNo} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        {/* ROW 2: NAME, REGION, DESCRIPTION */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '15px', marginTop: '15px' }}>
          <div>
            <label style={labelStyle}>Product Name *</label>
            <input type="text" name="name" required placeholder="e.g. Desi Ghee Besan Ladoo" value={formData.name} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Origin Place *</label>
            <input type="text" name="originRegion" required placeholder="e.g. Kanpur, Uttar Pradesh" value={formData.originRegion} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Product Description</label>
            <input type="text" name="description" placeholder="Rich aroma and traditional taste..." value={formData.description} onChange={handleChange} style={inputStyle} />
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
            <input type="text" name="preservation" placeholder="e.g. Keep in airtight container" value={formData.preservation} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Desi Ghee (%)</label>
            <input type="text" name="desiGhee" placeholder="e.g. 100% Pure Bilona" value={formData.desiGhee} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Hygiene</label>
            <input type="text" name="hygiene" placeholder="e.g. Sealed & Untouched" value={formData.hygiene} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        {/* ROW 4: DYNAMIC VARIANTS TABLE */}
        <div style={{ marginTop: '25px', background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: 0, color: '#334155' }}>⚖️ Weight Variants, Stock & Automatic Out-of-Stock</h4>
            <button type="button" onClick={addVariantRow} style={{ background: '#facc15', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              + Add Variant
            </button>
          </div>

          {formData.variants.map((v, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr 1.5fr auto', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <input type="text" placeholder="Weight (e.g. 500g)" value={v.weight} onChange={(e) => handleVariantChange(i, 'weight', e.target.value)} style={inputStyle} />
              <input type="number" placeholder="Price (₹)" value={v.price} onChange={(e) => handleVariantChange(i, 'price', e.target.value)} style={inputStyle} />
              <input type="number" placeholder="Disc. Flat (₹)" value={v.discountLumpsum} onChange={(e) => handleVariantChange(i, 'discountLumpsum', e.target.value)} style={inputStyle} />
              <input type="number" placeholder="Disc. %" value={v.discountPercent} onChange={(e) => handleVariantChange(i, 'discountPercent', e.target.value)} style={inputStyle} />
              <input type="number" placeholder="Qty Available" value={v.quantityAvailable} onChange={(e) => handleVariantChange(i, 'quantityAvailable', e.target.value)} style={inputStyle} />
              <input type="date" title="Date on which Stock Available" value={v.stockAvailableDate ? v.stockAvailableDate.slice(0, 10) : ''} onChange={(e) => handleVariantChange(i, 'stockAvailableDate', e.target.value)} style={inputStyle} />
              {formData.variants.length > 1 && (
                <button type="button" onClick={() => removeVariantRow(i)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: '6px', cursor: 'pointer' }}>✕</button>
              )}
            </div>
          ))}
          <small style={{ color: '#dc2626' }}>* When Quantity Available reaches 0, the system automatically shows the variant / product as "Out of Stock".</small>
        </div>

        {/* ROW 5: GST & TAX */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
          <div>
            <label style={labelStyle}>GST on Product (% Rate of Tax)</label>
            <input type="number" name="gstRate" placeholder="5" value={formData.gstRate} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>HSN Code</label>
            <input type="text" name="hsnCode" placeholder="e.g. 2106" value={formData.hsnCode} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        {/* ROW 6: IMAGES UPLOAD (Image +1, Image +2, Image +3) */}
        <div style={{ marginTop: '20px' }}>
          <label style={labelStyle}>Images Upload (Image +1, Image +2, Image +3) — Suggested Size: 800x800 px</label>
          <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ marginTop: '8px' }} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            {imagePreviews.map((src, idx) => (
              <img key={idx} src={src} alt={`Preview ${idx + 1}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ccc' }} />
            ))}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div style={{ marginTop: '25px', display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={loading} style={{ background: '#94191d', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'Processing...' : editingId ? 'Update Product' : 'Save & Publish Product'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} style={{ background: '#64748b', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '6px', cursor: 'pointer' }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* PRODUCTS LIST */}
      <div style={{ marginTop: '40px' }}>
        <h3>Stored Catalogue ({products.length})</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          {products.map((p) => (
            <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '15px', borderRadius: '8px', borderLeft: `5px solid ${p.inStock ? '#15803d' : '#dc2626'}` }}>
              <div>
                <h4 style={{ margin: 0 }}>{p.name} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({p.skuNo || 'No SKU'})</span></h4>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  Rank: #{p.productRank} | Category: {p.category} | GST: {p.gstRate}% | Status: <strong>{p.inStock ? 'In Stock' : 'Out of Stock'}</strong>
                </div>
              </div>
              <div>
                <button onClick={() => handleEditClick(p)} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginRight: '6px' }}>Edit</button>
                <button onClick={() => handleDelete(p._id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  marginTop: '4px',
  borderRadius: '5px',
  border: '1px solid #cbd5e1',
  boxSizing: 'border-box'
};

const labelStyle = {
  fontWeight: '600',
  fontSize: '0.85rem',
  color: '#334155'
};

export default AdminAllInOneProducts;