import React, { useState, useEffect } from 'react';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const CATEGORIES = [
  { value: 'ladoo', label: 'Ladoo' },
  { value: 'peda', label: 'Peda' },
  { value: 'petha', label: 'Petha' },
  { value: 'halwa', label: 'Halwa' },
  { value: 'barfi', label: 'Barfi & Katli' },
  { value: 'special', label: 'Regional Special' }
];

const defaultForm = {
  name: '',
  originRegion: '',
  category: 'ladoo',
  price: '',
  originalPrice: '',
  description: '',
  discountPercent: '',
  discountValidUntil: '',
  couponsList: [
    { code: 'DESI50', discountType: 'flat', discountValue: '50', minSpend: '500', validUntil: '' }
  ],
  quantityDiscounts: [
    { minQty: '2', discountPercent: '10' }
  ],
  giftTiers: [
    { minSpend: '1500', giftTitle: 'Free 100g Desi Ghee Peda Box', giftImage: '' }
  ],
  isFreeDelivery: false,
  inStock: true // 🟢 STOCK STATUS
};

// 🌐 BULK OFFER PANEL KA DEFAULT STATE
const defaultBulkOffer = {
  category: 'all',
  mode: 'replace', // replace | append | remove
  applyDiscount: false,
  discountPercent: '',
  discountValidUntil: '',
  applyCoupons: false,
  couponsList: [{ code: 'SGS50', discountType: 'flat', discountValue: '50', minSpend: '500', validUntil: '' }],
  applyQtyDiscounts: false,
  quantityDiscounts: [{ minQty: '2', discountPercent: '10' }],
  applyGifts: false,
  giftTiers: [{ minSpend: '1500', giftTitle: 'Free 100g Desi Ghee Peda Box', giftImage: '' }],
  applyFreeDelivery: false,
  isFreeDelivery: true
};

const AdminAllInOneProducts = () => {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState(defaultForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stockBusyId, setStockBusyId] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });

  // 🌐 BULK OFFER STATE
  const [bulkPanelOpen, setBulkPanelOpen] = useState(false);
  const [bulkOffer, setBulkOffer] = useState(defaultBulkOffer);
  const [bulkLoading, setBulkLoading] = useState(false);

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

  // 🟢 STOCK TOGGLE (form ke andar)
  const setStockStatus = (value) => {
    setFormData((prev) => ({ ...prev, inStock: value }));
  };

  // ➕ 1. Dynamic Coupons Handlers
  const handleCouponChange = (index, field, value) => {
    const updated = [...formData.couponsList];
    updated[index][field] = field === 'code' ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, couponsList: updated }));
  };
  const addCoupon = () => {
    setFormData((prev) => ({
      ...prev,
      couponsList: [...prev.couponsList, { code: '', discountType: 'flat', discountValue: '', minSpend: '0', validUntil: '' }]
    }));
  };
  const removeCoupon = (index) => {
    setFormData((prev) => ({ ...prev, couponsList: prev.couponsList.filter((_, i) => i !== index) }));
  };

  // ➕ 2. Dynamic Quantity Discount Handlers
  const handleQtyDiscountChange = (index, field, value) => {
    const updated = [...formData.quantityDiscounts];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, quantityDiscounts: updated }));
  };
  const addQtyDiscount = () => {
    setFormData((prev) => ({
      ...prev,
      quantityDiscounts: [...prev.quantityDiscounts, { minQty: '', discountPercent: '' }]
    }));
  };
  const removeQtyDiscount = (index) => {
    setFormData((prev) => ({ ...prev, quantityDiscounts: prev.quantityDiscounts.filter((_, i) => i !== index) }));
  };

  // ➕ 3. Dynamic Gift Slabs Handlers
  const handleGiftTierChange = (index, field, value) => {
    const updated = [...formData.giftTiers];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, giftTiers: updated }));
  };
  const addGiftTier = () => {
    setFormData((prev) => ({
      ...prev,
      giftTiers: [...prev.giftTiers, { minSpend: '', giftTitle: '', giftImage: '' }]
    }));
  };
  const removeGiftTier = (index) => {
    setFormData((prev) => ({ ...prev, giftTiers: prev.giftTiers.filter((_, i) => i !== index) }));
  };

  // ==========================================
  // 🌐 BULK OFFER HANDLERS (sab products ke liye)
  // ==========================================
  const setBulkField = (field, value) => {
    setBulkOffer((prev) => ({ ...prev, [field]: value }));
  };

  const handleBulkArrayChange = (listName, index, field, value) => {
    setBulkOffer((prev) => {
      const updated = prev[listName].map((row, i) =>
        i === index ? { ...row, [field]: field === 'code' ? value.toUpperCase() : value } : row
      );
      return { ...prev, [listName]: updated };
    });
  };

  const addBulkArrayRow = (listName, emptyRow) => {
    setBulkOffer((prev) => ({ ...prev, [listName]: [...prev[listName], emptyRow] }));
  };

  const removeBulkArrayRow = (listName, index) => {
    setBulkOffer((prev) => ({ ...prev, [listName]: prev[listName].filter((_, i) => i !== index) }));
  };

  // Kitne products affect honge
  const affectedCount = bulkOffer.category === 'all'
    ? products.length
    : products.filter((p) => p.category === bulkOffer.category).length;

  const handleBulkApply = async () => {
    const anySelected =
      bulkOffer.applyDiscount ||
      bulkOffer.applyCoupons ||
      bulkOffer.applyQtyDiscounts ||
      bulkOffer.applyGifts ||
      bulkOffer.applyFreeDelivery;

    if (!anySelected) {
      setMsg({ text: '⚠️ Kam se kam ek offer type ka checkbox tick karein.', type: 'error' });
      return;
    }

    const scopeText = bulkOffer.category === 'all' ? 'SAARE' : `"${bulkOffer.category}" category ke`;
    const modeText =
      bulkOffer.mode === 'remove' ? 'HATA' : bulkOffer.mode === 'append' ? 'ADD KAR' : 'REPLACE KAR';

    if (!window.confirm(`Ye offers ${scopeText} ${affectedCount} products par ${modeText} diye jayenge. Confirm?`)) {
      return;
    }

    setBulkLoading(true);
    setMsg({ text: '', type: '' });

    try {
      const res = await fetch(`${API_BASE}/products/bulk-offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bulkOffer)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Bulk offer apply failed');

      setMsg({ text: data.message || '🎉 Bulk offers applied!', type: 'success' });
      fetchProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setMsg({ text: err.message || 'Bulk offer apply karne me error aaya.', type: 'error' });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // ✏️ Edit Product
  const handleEditClick = (p) => {
    setEditingId(p._id);

    let existingGiftTiers = Array.isArray(p.giftTiers) && p.giftTiers.length > 0
      ? p.giftTiers
      : [{ minSpend: '1500', giftTitle: 'Free 100g Desi Ghee Peda Box', giftImage: '' }];

    let existingCoupons = Array.isArray(p.couponsList) && p.couponsList.length > 0
      ? p.couponsList
      : p.productCouponCode
      ? [{ code: p.productCouponCode, discountType: p.productCouponType || 'flat', discountValue: String(p.productCouponDiscount || 50), minSpend: '0', validUntil: p.productCouponValidUntil ? p.productCouponValidUntil.slice(0, 16) : '' }]
      : [{ code: '', discountType: 'flat', discountValue: '', minSpend: '0', validUntil: '' }];

    let existingQtyDiscounts = Array.isArray(p.quantityDiscounts) && p.quantityDiscounts.length > 0
      ? p.quantityDiscounts
      : [{ minQty: '2', discountPercent: '10' }];

    setFormData({
      name: p.name || '',
      originRegion: p.originRegion || '',
      category: p.category || 'ladoo',
      price: p.price || '',
      originalPrice: p.originalPrice || '',
      description: p.description || '',
      discountPercent: p.discountPercent || '',
      discountValidUntil: p.discountValidUntil ? p.discountValidUntil.slice(0, 16) : '',
      couponsList: existingCoupons,
      quantityDiscounts: existingQtyDiscounts,
      giftTiers: existingGiftTiers,
      isFreeDelivery: !!p.isFreeDelivery,
      inStock: p.inStock !== false // 🟢 purana product bhi default In Stock
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

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        if (['giftTiers', 'couponsList', 'quantityDiscounts'].includes(key)) {
          data.append(key, JSON.stringify(formData[key]));
        } else if (key === 'inStock' || key === 'isFreeDelivery') {
          // 🟢 Boolean ko hamesha 'true' / 'false' string bana kar bhejo
          data.append(key, formData[key] ? 'true' : 'false');
        } else {
          data.append(key, formData[key]);
        }
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
        text: editingId ? '🎉 Product & All Dynamic Slabs updated!' : '🎉 New product & Slabs saved successfully!',
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

  // 🟢 LIST ME SE 1-CLICK STOCK TOGGLE (In Stock <-> Out of Stock)
  const handleQuickStockToggle = async (p) => {
    const nextValue = p.inStock === false; // abhi out hai to true karo
    setStockBusyId(p._id);
    try {
      const data = new FormData();
      data.append('inStock', nextValue ? 'true' : 'false');

      const res = await fetch(`${API_BASE}/products/${p._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Stock update failed');

      setProducts((prev) => prev.map((item) => (item._id === p._id ? { ...item, inStock: nextValue } : item)));
      setMsg({
        text: nextValue ? `✅ "${p.name}" ab IN STOCK hai` : `⛔ "${p.name}" ab OUT OF STOCK hai`,
        type: 'success'
      });
    } catch (err) {
      setMsg({ text: err.message || 'Stock update failed', type: 'error' });
    } finally {
      setStockBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product and all its offers?')) return;
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

  const isRemoveMode = bulkOffer.mode === 'remove';

  return (
    <div style={{ maxWidth: '1100px', margin: '20px auto', padding: '20px', fontFamily: 'Segoe UI, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#94191d' }}>
            {editingId ? '✏️ Edit Sweet & Dynamic Multi-Offer Rules' : '➕ Add Sweet & Unlimited Custom Offers'}
          </h1>
          <p style={{ margin: '5px 0 0', color: '#64748b' }}>
            Create and manage stock status, multiple discounts, pack quantity offers, secret coupons and free gifts in one form!
          </p>
        </div>
        {editingId && (
          <button onClick={handleCancelEdit} style={{ padding: '8px 16px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            ✕ Cancel Edit
          </button>
        )}
      </div>

      {msg.text && (
        <div style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '8px', background: msg.type === 'success' ? '#dcfce7' : '#fee2e2', color: msg.type === 'success' ? '#15803d' : '#b91c1c', fontWeight: 'bold' }}>
          {msg.text}
        </div>
      )}

      {/* ==================================================== */}
      {/* 🌐 BULK OFFERS — SAB PRODUCTS PAR EK SAATH            */}
      {/* ==================================================== */}
      <div style={{ background: '#fff', border: '2px solid #94191d', borderRadius: '12px', marginBottom: '30px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(148,25,29,0.10)' }}>
        <div
          onClick={() => setBulkPanelOpen(!bulkPanelOpen)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '16px 20px', background: '#94191d', color: '#fff', cursor: 'pointer' }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>🌐 Bulk Offers — Sab Products Par Ek Saath</h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', opacity: 0.9 }}>
              Ek hi baar me sabhi (ya kisi ek category ke) sweets par discount, coupons, pack offers, free gifts aur free delivery lagayein.
            </p>
          </div>
          <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{bulkPanelOpen ? '▲' : '▼'}</span>
        </div>

        {bulkPanelOpen && (
          <div style={{ padding: '20px' }}>

            {/* SCOPE + MODE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', background: '#fdf5f5', padding: '15px', borderRadius: '8px', border: '1px solid #f3d5d5' }}>
              <div>
                <label style={{ fontWeight: '700', fontSize: '0.85rem', color: '#94191d' }}>Kis par lagana hai?</label>
                <select value={bulkOffer.category} onChange={(e) => setBulkField('category', e.target.value)} style={inputStyle}>
                  <option value="all">🍬 All Products (Saare Sweets)</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label} only</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontWeight: '700', fontSize: '0.85rem', color: '#94191d' }}>Mode</label>
                <select value={bulkOffer.mode} onChange={(e) => setBulkField('mode', e.target.value)} style={inputStyle}>
                  <option value="replace">♻️ Replace — purane offers hata kar naye lagao</option>
                  <option value="append">➕ Add — purane offers ke saath jodo</option>
                  <option value="remove">🗑️ Remove — selected offers hata do</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div style={{ background: '#94191d', color: '#fff', padding: '10px 12px', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {affectedCount} products affect honge
                </div>
              </div>
            </div>

            {isRemoveMode && (
              <div style={{ marginTop: '12px', background: '#fef2f2', border: '1px dashed #dc2626', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                🗑️ Remove mode: neeche jo bhi checkbox tick karenge, us type ke offers in products se hata diye jayenge. Values matter nahi karti.
              </div>
            )}

            {/* ⏳ BULK TIMELINE DISCOUNT */}
            <div style={{ marginTop: '20px', border: '1px solid #fde68a', borderRadius: '8px', overflow: 'hidden' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fffbeb', padding: '12px 15px', cursor: 'pointer', fontWeight: '700', color: '#b45309' }}>
                <input type="checkbox" checked={bulkOffer.applyDiscount} onChange={(e) => setBulkField('applyDiscount', e.target.checked)} style={checkboxStyle} />
                ⏳ Discount (%) sab par lagao
              </label>

              {bulkOffer.applyDiscount && !isRemoveMode && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px', padding: '15px' }}>
                  <div>
                    <label style={{ fontWeight: '600', fontSize: '0.85rem', color: '#b45309' }}>Discount (%)</label>
                    <input type="number" min="0" max="100" placeholder="e.g. 15" value={bulkOffer.discountPercent} onChange={(e) => setBulkField('discountPercent', e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontWeight: '600', fontSize: '0.85rem', color: '#b45309' }}>Valid Until (khali chhodenge to no expiry)</label>
                    <input type="datetime-local" value={bulkOffer.discountValidUntil} onChange={(e) => setBulkField('discountValidUntil', e.target.value)} style={inputStyle} />
                  </div>
                </div>
              )}
            </div>

            {/* 🎟️ BULK COUPONS */}
            <div style={{ marginTop: '15px', border: '1px solid #ddd6fe', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f3ff', padding: '12px 15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '700', color: '#6d28d9' }}>
                  <input type="checkbox" checked={bulkOffer.applyCoupons} onChange={(e) => setBulkField('applyCoupons', e.target.checked)} style={checkboxStyle} />
                  🎟️ Coupons sab par lagao
                </label>
                {bulkOffer.applyCoupons && !isRemoveMode && (
                  <button type="button" onClick={() => addBulkArrayRow('couponsList', { code: '', discountType: 'flat', discountValue: '', minSpend: '0', validUntil: '' })} style={{ ...smallBtnStyle, background: '#7c3aed' }}>
                    ➕ Add Coupon
                  </button>
                )}
              </div>

              {bulkOffer.applyCoupons && !isRemoveMode && (
                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {bulkOffer.couponsList.map((c, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.5fr auto', gap: '10px', alignItems: 'center' }}>
                      <div>
                        <label style={miniLabel('#6d28d9')}>Code</label>
                        <input type="text" placeholder="SGS50" value={c.code} onChange={(e) => handleBulkArrayChange('couponsList', idx, 'code', e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={miniLabel('#6d28d9')}>Type</label>
                        <select value={c.discountType} onChange={(e) => handleBulkArrayChange('couponsList', idx, 'discountType', e.target.value)} style={inputStyle}>
                          <option value="flat">Flat (₹)</option>
                          <option value="percentage">% Percent</option>
                        </select>
                      </div>
                      <div>
                        <label style={miniLabel('#6d28d9')}>Value</label>
                        <input type="number" placeholder="50" value={c.discountValue} onChange={(e) => handleBulkArrayChange('couponsList', idx, 'discountValue', e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={miniLabel('#6d28d9')}>Min Spend</label>
                        <input type="number" placeholder="500" value={c.minSpend} onChange={(e) => handleBulkArrayChange('couponsList', idx, 'minSpend', e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={miniLabel('#6d28d9')}>Expiry</label>
                        <input type="datetime-local" value={c.validUntil} onChange={(e) => handleBulkArrayChange('couponsList', idx, 'validUntil', e.target.value)} style={inputStyle} />
                      </div>
                      {bulkOffer.couponsList.length > 1 && (
                        <button type="button" onClick={() => removeBulkArrayRow('couponsList', idx)} style={removeBtnStyle}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 📦 BULK QUANTITY DISCOUNTS */}
            <div style={{ marginTop: '15px', border: '1px solid #fed7aa', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff7ed', padding: '12px 15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '700', color: '#c2410c' }}>
                  <input type="checkbox" checked={bulkOffer.applyQtyDiscounts} onChange={(e) => setBulkField('applyQtyDiscounts', e.target.checked)} style={checkboxStyle} />
                  📦 Quantity / Pack Discounts sab par lagao
                </label>
                {bulkOffer.applyQtyDiscounts && !isRemoveMode && (
                  <button type="button" onClick={() => addBulkArrayRow('quantityDiscounts', { minQty: '', discountPercent: '' })} style={{ ...smallBtnStyle, background: '#ea580c' }}>
                    ➕ Add Slab
                  </button>
                )}
              </div>

              {bulkOffer.applyQtyDiscounts && !isRemoveMode && (
                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {bulkOffer.quantityDiscounts.map((q, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr auto', gap: '12px', alignItems: 'center' }}>
                      <div>
                        <label style={miniLabel('#c2410c')}>Min Packs / Qty</label>
                        <input type="number" placeholder="e.g. 2" value={q.minQty} onChange={(e) => handleBulkArrayChange('quantityDiscounts', idx, 'minQty', e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={miniLabel('#c2410c')}>Extra Discount (%)</label>
                        <input type="number" placeholder="e.g. 10" value={q.discountPercent} onChange={(e) => handleBulkArrayChange('quantityDiscounts', idx, 'discountPercent', e.target.value)} style={inputStyle} />
                      </div>
                      {bulkOffer.quantityDiscounts.length > 1 && (
                        <button type="button" onClick={() => removeBulkArrayRow('quantityDiscounts', idx)} style={removeBtnStyle}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 🎁 BULK GIFTS */}
            <div style={{ marginTop: '15px', border: '1px solid #bfdbfe', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eff6ff', padding: '12px 15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '700', color: '#1e40af' }}>
                  <input type="checkbox" checked={bulkOffer.applyGifts} onChange={(e) => setBulkField('applyGifts', e.target.checked)} style={checkboxStyle} />
                  🎁 Free Gifts sab par lagao
                </label>
                {bulkOffer.applyGifts && !isRemoveMode && (
                  <button type="button" onClick={() => addBulkArrayRow('giftTiers', { minSpend: '', giftTitle: '', giftImage: '' })} style={{ ...smallBtnStyle, background: '#2563eb' }}>
                    ➕ Add Gift Tier
                  </button>
                )}
              </div>

              {bulkOffer.applyGifts && !isRemoveMode && (
                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {bulkOffer.giftTiers.map((g, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 3fr auto', gap: '12px', alignItems: 'center' }}>
                      <div>
                        <label style={miniLabel('#1e40af')}>Min Spend (₹)</label>
                        <input type="number" placeholder="e.g. 1500" value={g.minSpend} onChange={(e) => handleBulkArrayChange('giftTiers', idx, 'minSpend', e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={miniLabel('#1e40af')}>Free Gift Title</label>
                        <input type="text" placeholder="e.g. Free 100g Mathura Peda Box" value={g.giftTitle} onChange={(e) => handleBulkArrayChange('giftTiers', idx, 'giftTitle', e.target.value)} style={inputStyle} />
                      </div>
                      {bulkOffer.giftTiers.length > 1 && (
                        <button type="button" onClick={() => removeBulkArrayRow('giftTiers', idx)} style={removeBtnStyle}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 🚚 BULK FREE DELIVERY */}
            <div style={{ marginTop: '15px', border: '1px solid #bbf7d0', borderRadius: '8px', overflow: 'hidden' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f0fdf4', padding: '12px 15px', cursor: 'pointer', fontWeight: '700', color: '#047857' }}>
                <input type="checkbox" checked={bulkOffer.applyFreeDelivery} onChange={(e) => setBulkField('applyFreeDelivery', e.target.checked)} style={checkboxStyle} />
                🚚 Free Delivery sab par {isRemoveMode ? 'hatao' : 'lagao'}
              </label>

              {bulkOffer.applyFreeDelivery && !isRemoveMode && (
                <div style={{ padding: '12px 15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                    <input type="checkbox" checked={bulkOffer.isFreeDelivery} onChange={(e) => setBulkField('isFreeDelivery', e.target.checked)} style={checkboxStyle} />
                    Free Delivery ON rakho (uncheck karenge to OFF ho jayegi)
                  </label>
                </div>
              )}
            </div>

            {/* APPLY BUTTONS */}
            <div style={{ marginTop: '22px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleBulkApply}
                disabled={bulkLoading}
                style={{
                  padding: '12px 28px',
                  background: isRemoveMode ? '#dc2626' : '#94191d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  cursor: bulkLoading ? 'wait' : 'pointer',
                  opacity: bulkLoading ? 0.7 : 1
                }}
              >
                {bulkLoading
                  ? 'Applying...'
                  : isRemoveMode
                  ? `🗑️ Remove from ${affectedCount} Products`
                  : `🚀 Apply to ${affectedCount} Products`}
              </button>

              <button
                type="button"
                onClick={() => setBulkOffer(defaultBulkOffer)}
                style={{ padding: '12px 20px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Reset Panel
              </button>

              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Ye offers har product me save honge, isliye homepage aur cart me automatically dikhenge.
              </span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', marginBottom: '40px' }}>

        {/* 1. BASIC DETAILS */}
        <h3 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', color: '#334155' }}>📦 1. Basic Sweet Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px', marginTop: '12px' }}>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Sweet Name *</label>
            <input type="text" name="name" required placeholder="e.g. Pure Desi Ghee Besan Laddu" value={formData.name} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Origin Region / Gaon *</label>
            <input type="text" name="originRegion" required placeholder="e.g. Kanpur, UP" value={formData.originRegion} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} style={inputStyle}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 🟢 2. STOCK STATUS */}
        <h3 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginTop: '25px', color: formData.inStock ? '#15803d' : '#b91c1c' }}>
          🏷️ 2. Stock Status
        </h3>
        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            background: formData.inStock ? '#f0fdf4' : '#fef2f2',
            border: `1.5px solid ${formData.inStock ? '#bbf7d0' : '#fecaca'}`,
            padding: '14px 16px',
            borderRadius: '10px'
          }}
        >
          <button
            type="button"
            onClick={() => setStockStatus(true)}
            style={{
              padding: '10px 20px',
              borderRadius: '30px',
              border: formData.inStock ? '2px solid #15803d' : '2px solid #e2e8f0',
              background: formData.inStock ? '#15803d' : '#fff',
              color: formData.inStock ? '#fff' : '#64748b',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ✅ In Stock
          </button>

          <button
            type="button"
            onClick={() => setStockStatus(false)}
            style={{
              padding: '10px 20px',
              borderRadius: '30px',
              border: !formData.inStock ? '2px solid #dc2626' : '2px solid #e2e8f0',
              background: !formData.inStock ? '#dc2626' : '#fff',
              color: !formData.inStock ? '#fff' : '#64748b',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ⛔ Out of Stock
          </button>

          <span style={{ fontSize: '0.85rem', color: '#475569' }}>
            {formData.inStock
              ? 'Ye sweet website par normally dikhegi aur cart me add ho sakegi.'
              : 'Ye sweet homepage par blur dikhegi aur "Out of Stock" ki wajah se cart me add nahi hogi.'}
          </span>
        </div>

        {/* 3. PRICING */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '15px', marginTop: '15px' }}>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Base Selling Price (₹) *</label>
            <input type="number" name="price" required min="1" placeholder="e.g. 500" value={formData.price} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>MRP / Original Price (₹)</label>
            <input type="number" name="originalPrice" min="0" placeholder="e.g. 600" value={formData.originalPrice} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Product Description</label>
            <input type="text" name="description" placeholder="Handcrafted with 100% bilona ghee..." value={formData.description} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        {/* 4. TIMELINE DISCOUNT */}
        <h3 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginTop: '25px', color: '#d97706' }}>
          ⏳ 3. Limited Days Special Discount (Timeline Offer)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px', marginTop: '12px', background: '#fffbeb', padding: '15px', borderRadius: '8px' }}>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#b45309' }}>Special Discount (%)</label>
            <input type="number" name="discountPercent" min="0" max="100" placeholder="e.g. 15" value={formData.discountPercent} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#b45309' }}>Offer Valid Until (Expiry Date)</label>
            <input type="datetime-local" name="discountValidUntil" value={formData.discountValidUntil} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

        {/* 5. MULTIPLE COUPONS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '25px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
          <h3 style={{ margin: 0, color: '#7c3aed' }}>🎟️ 4. Product Secret Coupons (Add Multiple with +)</h3>
          <button type="button" onClick={addCoupon} style={{ ...smallBtnStyle, background: '#7c3aed' }}>
            ➕ Add Another Coupon
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
          {formData.couponsList.map((c, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.5fr auto', gap: '10px', background: '#f5f3ff', padding: '12px 15px', borderRadius: '8px', alignItems: 'center' }}>
              <div>
                <label style={miniLabel('#6d28d9')}>Coupon Code</label>
                <input type="text" placeholder="e.g. LADDU50" value={c.code} onChange={(e) => handleCouponChange(idx, 'code', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={miniLabel('#6d28d9')}>Type</label>
                <select value={c.discountType} onChange={(e) => handleCouponChange(idx, 'discountType', e.target.value)} style={inputStyle}>
                  <option value="flat">Flat (₹)</option>
                  <option value="percentage">% Percent</option>
                </select>
              </div>
              <div>
                <label style={miniLabel('#6d28d9')}>Value</label>
                <input type="number" placeholder="50" value={c.discountValue} onChange={(e) => handleCouponChange(idx, 'discountValue', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={miniLabel('#6d28d9')}>Min Spend (₹)</label>
                <input type="number" placeholder="500" value={c.minSpend} onChange={(e) => handleCouponChange(idx, 'minSpend', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={miniLabel('#6d28d9')}>Expiry Date</label>
                <input type="datetime-local" value={c.validUntil} onChange={(e) => handleCouponChange(idx, 'validUntil', e.target.value)} style={inputStyle} />
              </div>
              {formData.couponsList.length > 1 && (
                <button type="button" onClick={() => removeCoupon(idx)} style={removeBtnStyle} title="Remove">✕</button>
              )}
            </div>
          ))}
        </div>

        {/* 6. MULTIPLE PACK DISCOUNTS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '25px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
          <h3 style={{ margin: 0, color: '#ea580c' }}>📦 5. Quantity / Pack Discounts (Buy 2+, Buy 5+ with +)</h3>
          <button type="button" onClick={addQtyDiscount} style={{ ...smallBtnStyle, background: '#ea580c' }}>
            ➕ Add Qty Slab
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
          {formData.quantityDiscounts.map((q, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr auto', gap: '12px', background: '#fff7ed', padding: '12px 15px', borderRadius: '8px', alignItems: 'center' }}>
              <div>
                <label style={miniLabel('#c2410c')}>Min Packs / Qty (e.g. 2, 5)</label>
                <input type="number" placeholder="e.g. 2" value={q.minQty} onChange={(e) => handleQtyDiscountChange(idx, 'minQty', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={miniLabel('#c2410c')}>Extra Discount (% OFF)</label>
                <input type="number" placeholder="e.g. 10" value={q.discountPercent} onChange={(e) => handleQtyDiscountChange(idx, 'discountPercent', e.target.value)} style={inputStyle} />
              </div>
              {formData.quantityDiscounts.length > 1 && (
                <button type="button" onClick={() => removeQtyDiscount(idx)} style={removeBtnStyle} title="Remove">✕</button>
              )}
            </div>
          ))}
        </div>

        {/* 7. MULTIPLE FREE GIFTS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '25px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
          <h3 style={{ margin: 0, color: '#2563eb' }}>🎁 6. Free Gifts on Spending Roadmap (Add Multiple with +)</h3>
          <button type="button" onClick={addGiftTier} style={{ ...smallBtnStyle, background: '#2563eb' }}>
            ➕ Add More Gift Tier
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
          {formData.giftTiers.map((tier, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 3fr auto', gap: '12px', background: '#eff6ff', padding: '12px 15px', borderRadius: '8px', alignItems: 'center' }}>
              <div>
                <label style={miniLabel('#1e40af')}>Min Spend to Unlock Gift (₹)</label>
                <input type="number" placeholder="e.g. 1500" value={tier.minSpend} onChange={(e) => handleGiftTierChange(idx, 'minSpend', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={miniLabel('#1e40af')}>Free Gift Name / Title</label>
                <input type="text" placeholder="e.g. Free 100g Mathura Peda Box" value={tier.giftTitle} onChange={(e) => handleGiftTierChange(idx, 'giftTitle', e.target.value)} style={inputStyle} />
              </div>
              {formData.giftTiers.length > 1 && (
                <button type="button" onClick={() => removeGiftTier(idx)} style={removeBtnStyle} title="Remove">✕</button>
              )}
            </div>
          ))}
        </div>

        {/* 8. FREE DELIVERY */}
        <div style={{ marginTop: '18px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#047857', cursor: 'pointer' }}>
            <input type="checkbox" name="isFreeDelivery" checked={formData.isFreeDelivery} onChange={handleChange} style={checkboxStyle} />
            🚚 Provide 100% FREE Delivery directly on this Sweet
          </label>
        </div>

        {/* 9. IMAGE UPLOAD */}
        <div style={{ marginTop: '20px' }}>
          <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Product Photo {editingId ? '(Leave empty to keep current)' : '*'}</label>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '8px' }}>
            <input type="file" accept="image/*" onChange={handleImageChange} required={!editingId} />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }} />
            )}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div style={{ marginTop: '25px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button type="submit" disabled={loading} style={{ padding: '12px 28px', background: editingId ? '#059669' : '#94191d', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
            {loading ? 'Processing...' : editingId ? '💾 Update Sweet Product' : '🚀 Save & Publish Sweet'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} style={{ padding: '12px 20px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Cancel
            </button>
          )}
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: formData.inStock ? '#15803d' : '#dc2626' }}>
            {formData.inStock ? '✅ Saving as IN STOCK' : '⛔ Saving as OUT OF STOCK'}
          </span>
        </div>
      </form>

      {/* 📋 PRODUCTS LIST */}
      <div>
        <h2>📋 All Store Sweets & Active Dynamic Offers ({products.length})</h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          {products.map((p) => {
            const hasTimeline = p.discountPercent > 0 && (!p.discountValidUntil || new Date(p.discountValidUntil) > new Date());
            const giftList = Array.isArray(p.giftTiers) ? p.giftTiers : [];
            const coupons = Array.isArray(p.couponsList) ? p.couponsList : (p.productCouponCode ? [{ code: p.productCouponCode, discountValue: p.productCouponDiscount }] : []);
            const qtyList = Array.isArray(p.quantityDiscounts) ? p.quantityDiscounts : [];
            const imgSrc = p.image?.startsWith('http') ? p.image : `${API_BASE.replace('/api', '')}${p.image}`;
            const outOfStock = p.inStock === false;

            return (
              <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: outOfStock ? '#fff8f8' : '#fff', padding: '16px 20px', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', borderLeft: `5px solid ${outOfStock ? '#dc2626' : editingId === p._id ? '#059669' : '#94191d'}` }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <img
                    src={imgSrc}
                    alt={p.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      filter: outOfStock ? 'blur(2px) grayscale(0.8)' : 'none',
                      opacity: outOfStock ? 0.7 : 1
                    }}
                  />
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: '#1e293b' }}>{p.name}</h3>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Price: <strong>₹{p.price}</strong> | Origin: {p.originRegion} | Category: {p.category}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {/* 🟢 STOCK BADGE */}
                      <span style={{ background: outOfStock ? '#fee2e2' : '#dcfce7', color: outOfStock ? '#b91c1c' : '#15803d', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        {outOfStock ? '⛔ Out of Stock' : '✅ In Stock'}
                      </span>

                      {hasTimeline && (
                        <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          ⏳ {p.discountPercent}% OFF
                        </span>
                      )}
                      {coupons.map((c, i) => (
                        <span key={i} style={{ background: '#ede9fe', color: '#5b21b6', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          🎟️ {c.code} ({c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`})
                        </span>
                      ))}
                      {qtyList.map((q, i) => (
                        <span key={i} style={{ background: '#ffedd5', color: '#c2410c', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          📦 Buy {q.minQty}+ Packs = {q.discountPercent}% OFF
                        </span>
                      ))}
                      {giftList.map((g, i) => (
                        <span key={i} style={{ background: '#dbeafe', color: '#1e40af', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          🎁 ₹{Number(g.minSpend).toLocaleString('en-IN')}+ = {g.giftTitle}
                        </span>
                      ))}
                      {p.isFreeDelivery && (
                        <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          🚚 Free Delivery
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                  {/* 🟢 1-CLICK STOCK TOGGLE */}
                  <button
                    onClick={() => handleQuickStockToggle(p)}
                    disabled={stockBusyId === p._id}
                    title={outOfStock ? 'Mark as In Stock' : 'Mark as Out of Stock'}
                    style={{
                      background: outOfStock ? '#15803d' : '#f59e0b',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      cursor: stockBusyId === p._id ? 'wait' : 'pointer',
                      fontWeight: 'bold',
                      opacity: stockBusyId === p._id ? 0.6 : 1,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {stockBusyId === p._id ? '...' : outOfStock ? '✅ In Stock karo' : '⛔ Out of Stock karo'}
                  </button>

                  <button onClick={() => handleEditClick(p)} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDelete(p._id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer' }}>
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

const removeBtnStyle = {
  background: '#ef4444',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  padding: '8px 12px',
  cursor: 'pointer',
  fontWeight: 'bold',
  alignSelf: 'flex-end',
  marginBottom: '2px'
};

const smallBtnStyle = {
  padding: '6px 14px',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.85rem'
};

const checkboxStyle = {
  width: '18px',
  height: '18px',
  cursor: 'pointer',
  accentColor: '#94191d'
};

const miniLabel = (color) => ({
  fontWeight: '600',
  fontSize: '0.8rem',
  color
});

export default AdminAllInOneProducts;