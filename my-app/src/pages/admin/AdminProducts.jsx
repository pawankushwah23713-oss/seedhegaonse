import React, { useState, useEffect } from 'react';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://orange-ape-497824.hostingersite.com/api');

const defaultCakeForm = {
  name: '',
  originRegion: 'Fresh Bakehouse',
  category: 'chocolate',
  price: '',
  originalPrice: '',
  description: '',
  discountPercent: '',
  discountValidUntil: '',
  couponsList: [
    { code: 'CAKE50', discountType: 'flat', discountValue: '50', minSpend: '500', validUntil: '' }
  ],
  quantityDiscounts: [
    { minQty: '2', discountPercent: '10' }
  ],
  giftTiers: [
    { minSpend: '1200', giftTitle: 'Free Birthday Candle & Designer Knife Set', giftImage: '' }
  ],
  isFreeDelivery: false,
  inStock: true
};

const AdminAllInOneCakes = () => {
  const [cakes, setCakes] = useState([]);
  const [formData, setFormData] = useState(defaultCakeForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stockBusyId, setStockBusyId] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const token = localStorage.getItem('token');

  const fetchCakes = async () => {
    try {
      const res = await fetch(`${API_BASE}/cakes`);
      const data = await res.json();
      if (Array.isArray(data)) setCakes(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCakes();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const setStockStatus = (value) => {
    setFormData((prev) => ({ ...prev, inStock: value }));
  };

  // Coupons Handlers
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

  // Qty Discount Handlers
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

  // Gift Slabs Handlers
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Edit Cake
  const handleEditClick = (c) => {
    setEditingId(c._id);

    let existingGiftTiers = Array.isArray(c.giftTiers) && c.giftTiers.length > 0
      ? c.giftTiers
      : [{ minSpend: '1200', giftTitle: 'Free Birthday Candle & Knife Set', giftImage: '' }];

    let existingCoupons = Array.isArray(c.couponsList) && c.couponsList.length > 0
      ? c.couponsList
      : c.productCouponCode
      ? [{ code: c.productCouponCode, discountType: c.productCouponType || 'flat', discountValue: String(c.productCouponDiscount || 50), minSpend: '0', validUntil: c.productCouponValidUntil ? c.productCouponValidUntil.slice(0, 16) : '' }]
      : [{ code: '', discountType: 'flat', discountValue: '', minSpend: '0', validUntil: '' }];

    let existingQtyDiscounts = Array.isArray(c.quantityDiscounts) && c.quantityDiscounts.length > 0
      ? c.quantityDiscounts
      : [{ minQty: '2', discountPercent: '10' }];

    setFormData({
      name: c.name || '',
      originRegion: c.originRegion || 'Fresh Bakehouse',
      category: c.category || 'chocolate',
      price: c.price || '',
      originalPrice: c.originalPrice || '',
      description: c.description || '',
      discountPercent: c.discountPercent || '',
      discountValidUntil: c.discountValidUntil ? c.discountValidUntil.slice(0, 16) : '',
      couponsList: existingCoupons,
      quantityDiscounts: existingQtyDiscounts,
      giftTiers: existingGiftTiers,
      isFreeDelivery: !!c.isFreeDelivery,
      inStock: c.inStock !== false
    });

    setImagePreview(c.image ? (c.image.startsWith('http') ? c.image : `${API_BASE.replace('/api', '')}${c.image}`) : null);
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData(defaultCakeForm);
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
          data.append(key, formData[key] ? 'true' : 'false');
        } else {
          data.append(key, formData[key]);
        }
      });

      if (imageFile) {
        data.append('image', imageFile);
      }

      const url = editingId ? `${API_BASE}/cakes/${editingId}` : `${API_BASE}/cakes`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Operation failed');

      setMsg({
        text: editingId ? '🎉 Cake & Offer Rules updated successfully!' : '🎉 New Cake saved & published!',
        type: 'success'
      });

      handleCancelEdit();
      fetchCakes();
    } catch (err) {
      setMsg({ text: err.message || 'Error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Stock Toggle
  const handleQuickStockToggle = async (c) => {
    const nextValue = c.inStock === false;
    setStockBusyId(c._id);
    try {
      const data = new FormData();
      data.append('inStock', nextValue ? 'true' : 'false');

      const res = await fetch(`${API_BASE}/cakes/${c._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Stock update failed');

      setCakes((prev) => prev.map((item) => (item._id === c._id ? { ...item, inStock: nextValue } : item)));
      setMsg({
        text: nextValue ? `✅ "${c.name}" ab IN STOCK hai` : `⛔ "${c.name}" ab OUT OF STOCK hai`,
        type: 'success'
      });
    } catch (err) {
      setMsg({ text: err.message || 'Stock update failed', type: 'error' });
    } finally {
      setStockBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this cake and all its offers?')) return;
    try {
      const res = await fetch(`${API_BASE}/cakes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMsg({ text: '🗑️ Cake deleted successfully', type: 'success' });
        fetchCakes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '15px auto', padding: '12px', fontFamily: 'Segoe UI, sans-serif', boxSizing: 'border-box' }}>
      
      {/* 📱 RESPONSIVE CSS INJECTED */}
      <style>{`
        .resp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .resp-grid-3 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }
        .resp-grid-2 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 15px;
        }
        .coupon-row {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr 1.5fr auto;
          gap: 10px;
          align-items: center;
        }
        .qty-row {
          display: grid;
          grid-template-columns: 2fr 2fr auto;
          gap: 12px;
          align-items: center;
        }
        .gift-row {
          display: grid;
          grid-template-columns: 1.5fr 3fr auto;
          gap: 12px;
          align-items: center;
        }
        .cake-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .cake-card-left {
          display: flex;
          gap: 15px;
          align-items: center;
          min-width: 0;
        }
        .cake-card-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
        .section-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 25px;
          border-bottom: 2px solid #f1f5f9;
          padding-bottom: 8px;
          gap: 10px;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .coupon-row {
            grid-template-columns: 1fr 1fr;
          }
          .coupon-row > div:nth-child(5) {
            grid-column: 1 / -1;
          }
          .qty-row {
            grid-template-columns: 1fr 1fr;
          }
          .gift-row {
            grid-template-columns: 1fr;
          }
          .cake-card {
            flex-direction: column;
            align-items: stretch;
          }
          .cake-card-actions {
            justify-content: flex-start;
            flex-wrap: wrap;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #f1f5f9;
          }
          .cake-card-actions button {
            flex: 1 1 auto;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .coupon-row {
            grid-template-columns: 1fr;
          }
          .qty-row {
            grid-template-columns: 1fr;
          }
          .cake-card-left {
            flex-direction: column;
            align-items: flex-start;
          }
          .cake-card-left img {
            width: 100% !important;
            height: 160px !important;
          }
        }
      `}</style>

      {/* HEADER */}
      <div className="resp-header">
        <div>
          <h1 style={{ margin: 0, color: '#e11d48', fontSize: 'clamp(1.25rem, 4vw, 1.8rem)' }}>
            {editingId ? '✏️ Edit Bakery Cake & Multi-Offer Rules' : '🎂 Add Fresh Cake & Custom Bakery Offers'}
          </h1>
          <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Manage bakery cakes, stock toggle, weight variants, special timeline discounts, custom coupons & gifts!
          </p>
        </div>
        {editingId && (
          <button onClick={handleCancelEdit} style={{ padding: '8px 16px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 }}>
            ✕ Cancel Edit
          </button>
        )}
      </div>

      {msg.text && (
        <div style={{ padding: '12px 16px', marginBottom: '20px', borderRadius: '8px', background: msg.type === 'success' ? '#dcfce7' : '#fee2e2', color: msg.type === 'success' ? '#15803d' : '#b91c1c', fontWeight: 'bold' }}>
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 'clamp(14px, 3vw, 24px)', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', marginBottom: '40px' }}>

        {/* 1. BASIC DETAILS */}
        <h3 style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', color: '#334155' }}>🎂 1. Basic Cake Details</h3>
        <div className="resp-grid-3" style={{ marginTop: '12px' }}>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Cake Name *</label>
            <input type="text" name="name" required placeholder="e.g. Belgian Dark Chocolate Truffle Cake" value={formData.name} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Bakery / Tagline *</label>
            <input type="text" name="originRegion" required placeholder="e.g. Fresh Bakehouse" value={formData.originRegion} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} style={inputStyle}>
              <option value="chocolate">Chocolate Truffle</option>
              <option value="redvelvet">Red Velvet</option>
              <option value="fruit">Fresh Fruit</option>
              <option value="cheesecake">Cheesecake</option>
              <option value="bento">Bento & Mini</option>
              <option value="butterscotch">Butterscotch</option>
              <option value="special">Artisan Special</option>
            </select>
          </div>
        </div>

        {/* 2. STOCK STATUS */}
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
              cursor: 'pointer'
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
              cursor: 'pointer'
            }}
          >
            ⛔ Out of Stock
          </button>

          <span style={{ fontSize: '0.85rem', color: '#475569' }}>
            {formData.inStock
              ? 'Ye cake website par active dikhega aur 500g/1kg/2kg select karke cart me add ho sakega.'
              : 'Ye cake page par blur & "Sold Out" dikhega aur cart me add nahi hoga.'}
          </span>
        </div>

        {/* 3. PRICING */}
        <div className="resp-grid-3" style={{ marginTop: '15px' }}>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Base Price (500g) (₹) *</label>
            <input type="number" name="price" required min="1" placeholder="e.g. 549" value={formData.price} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>MRP / Original Price (₹)</label>
            <input type="number" name="originalPrice" min="0" placeholder="e.g. 649" value={formData.originalPrice} onChange={handleChange} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Cake Description</label>
            <input type="text" name="description" placeholder="Layers of moist cocoa sponge and fresh cream..." value={formData.description} onChange={handleChange} style={inputStyle} />
          </div>
        </div>

       

        {/* 5. MULTIPLE COUPONS */}
       

        
              

        {/* 6. QUANTITY DISCOUNT */}
        

        

        {/* 7. FREE GIFTS */}
        

       

       

        {/* 9. IMAGE UPLOAD */}
        <div style={{ marginTop: '20px' }}>
          <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Cake Photo {editingId ? '(Leave empty to keep current)' : '*'}</label>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
            <input type="file" accept="image/*" onChange={handleImageChange} required={!editingId} style={{ maxWidth: '100%' }} />
            {imagePreview && (
              <img src={imagePreview} alt="Preview" style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }} />
            )}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div style={{ marginTop: '25px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="submit" disabled={loading} style={{ padding: '12px 28px', background: editingId ? '#059669' : '#e11d48', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', flexGrow: 1 }}>
            {loading ? 'Processing...' : editingId ? '💾 Update Cake' : '🚀 Save & Publish Cake'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} style={{ padding: '12px 20px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Cancel
            </button>
          )}
          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: formData.inStock ? '#15803d' : '#dc2626', width: '100%' }}>
            {formData.inStock ? '✅ Saving as IN STOCK' : '⛔ Saving as OUT OF STOCK'}
          </span>
        </div>
      </form>

      {/* 📋 CAKES LIST */}
      <div>
        <h2 style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.5rem)' }}>📋 All Bakery Cakes & Dynamic Offers ({cakes.length})</h2>
        <div style={{ display: 'grid', gap: '12px' }}>
          {cakes.map((c) => {
            const hasTimeline = c.discountPercent > 0 && (!c.discountValidUntil || new Date(c.discountValidUntil) > new Date());
            const giftList = Array.isArray(c.giftTiers) ? c.giftTiers : [];
            const coupons = Array.isArray(c.couponsList) ? c.couponsList : (c.productCouponCode ? [{ code: c.productCouponCode, discountValue: c.productCouponDiscount }] : []);
            const qtyList = Array.isArray(c.quantityDiscounts) ? c.quantityDiscounts : [];
            const imgSrc = c.image?.startsWith('http') ? c.image : `${API_BASE.replace('/api', '')}${c.image}`;
            const outOfStock = c.inStock === false;

            return (
              <div key={c._id} className="cake-card" style={{ background: outOfStock ? '#fff8f8' : '#fff', padding: 'clamp(12px, 2.5vw, 16px)', borderRadius: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', borderLeft: `5px solid ${outOfStock ? '#dc2626' : editingId === c._id ? '#059669' : '#e11d48'}` }}>
                <div className="cake-card-left">
                  <img
                    src={imgSrc}
                    alt={c.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      filter: outOfStock ? 'blur(2px) grayscale(0.8)' : 'none',
                      opacity: outOfStock ? 0.7 : 1,
                      flexShrink: 0
                    }}
                  />
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', color: '#1e293b' }}>{c.name}</h3>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Price: <strong>₹{c.price}</strong> | Category: {c.category}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <span style={{ background: outOfStock ? '#fee2e2' : '#dcfce7', color: outOfStock ? '#b91c1c' : '#15803d', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        {outOfStock ? '⛔ Out of Stock' : '✅ In Stock'}
                      </span>

                      {hasTimeline && (
                        <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          ⏳ {c.discountPercent}% OFF
                        </span>
                      )}
                      {coupons.map((cp, i) => (
                        <span key={i} style={{ background: '#ede9fe', color: '#5b21b6', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          🎟️ {cp.code} ({cp.discountType === 'percentage' ? `${cp.discountValue}%` : `₹${cp.discountValue}`})
                        </span>
                      ))}
                      {qtyList.map((q, i) => (
                        <span key={i} style={{ background: '#ffedd5', color: '#c2410c', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          📦 Buy {q.minQty}+ Cakes = {q.discountPercent}% OFF
                        </span>
                      ))}
                      {giftList.map((g, i) => (
                        <span key={i} style={{ background: '#dbeafe', color: '#1e40af', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          🎁 ₹{Number(g.minSpend).toLocaleString('en-IN')}+ = {g.giftTitle}
                        </span>
                      ))}
                      {c.isFreeDelivery && (
                        <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          🚚 Free Delivery
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="cake-card-actions">
                  <button
                    onClick={() => handleQuickStockToggle(c)}
                    disabled={stockBusyId === c._id}
                    style={{
                      background: outOfStock ? '#15803d' : '#f59e0b',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      cursor: stockBusyId === c._id ? 'wait' : 'pointer',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {stockBusyId === c._id ? '...' : outOfStock ? '✅ In Stock karo' : '⛔ Out of Stock karo'}
                  </button>

                  <button onClick={() => handleEditClick(c)} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleDelete(c._id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer' }}>
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

export default AdminAllInOneCakes;