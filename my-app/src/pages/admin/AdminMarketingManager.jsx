import React, { useState, useEffect } from 'react';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const AdminMarketingManager = () => {
  const [activeTab, setActiveTab] = useState('coupons'); // 'coupons' | 'gifts' | 'banners'
  const [coupons, setCoupons] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Coupon Form State
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderValue: '500',
    maxDiscountAmount: '200',
    validUntil: ''
  });

  // Gift Form State
  const [giftForm, setGiftForm] = useState({ title: '', minOrder: '1500', description: '' });
  const [giftImg, setGiftImg] = useState(null);

  // Banner Form State
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    badgeText: 'Festive Offer',
    linkUrl: '/shop',
    flashSaleEndTime: ''
  });
  const [bannerImg, setBannerImg] = useState(null);

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      if (activeTab === 'coupons') {
        const res = await fetch(`${API_BASE}/coupons`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await res.json();
        if (Array.isArray(d)) setCoupons(d);
      } else if (activeTab === 'gifts') {
        const res = await fetch(`${API_BASE}/gifts/all`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await res.json();
        if (Array.isArray(d)) setGifts(d);
      } else if (activeTab === 'banners') {
        const res = await fetch(`${API_BASE}/banners`);
        const d = await res.json();
        if (Array.isArray(d)) setBanners(d);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Create Coupon
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/coupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(couponForm)
      });
      if (res.ok) {
        setMsg('✅ Coupon created successfully!');
        setCouponForm({ code: '', discountType: 'percentage', discountValue: '', minOrderValue: '500', maxDiscountAmount: '200', validUntil: '' });
        fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  // Create Gift Milestone
  const handleCreateGift = async (e) => {
    e.preventDefault();
    if (!giftImg) return alert('Please upload a gift image');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', giftForm.title);
      fd.append('minOrder', giftForm.minOrder);
      fd.append('description', giftForm.description);
      fd.append('image', giftImg);

      const res = await fetch(`${API_BASE}/gifts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      if (res.ok) {
        setMsg('✅ Gift Milestone added successfully!');
        setGiftForm({ title: '', minOrder: '1500', description: '' });
        setGiftImg(null);
        fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  // Create Banner
  const handleCreateBanner = async (e) => {
    e.preventDefault();
    if (!bannerImg) return alert('Please upload banner image');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', bannerForm.title);
      fd.append('subtitle', bannerForm.subtitle);
      fd.append('badgeText', bannerForm.badgeText);
      fd.append('linkUrl', bannerForm.linkUrl);
      if (bannerForm.flashSaleEndTime) fd.append('flashSaleEndTime', bannerForm.flashSaleEndTime);
      fd.append('bannerImage', bannerImg);

      const res = await fetch(`${API_BASE}/banners`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      if (res.ok) {
        setMsg('✅ Banner & Timeline Offer published!');
        setBannerForm({ title: '', subtitle: '', badgeText: 'Festive Offer', linkUrl: '/shop', flashSaleEndTime: '' });
        setBannerImg(null);
        fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (endpoint, id) => {
    if (!window.confirm('Delete this item?')) return;
    await fetch(`${API_BASE}/${endpoint}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchData();
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>🎯 Store Marketing & Homepage Manager</h2>
      {msg && <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 15px', borderRadius: '6px', marginBottom: '15px' }}>{msg}</div>}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('coupons')} style={{ padding: '10px 20px', background: activeTab === 'coupons' ? '#94191d' : '#f1f5f9', color: activeTab === 'coupons' ? '#fff' : '#334155', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🎟️ Timeline Coupons</button>
        <button onClick={() => setActiveTab('gifts')} style={{ padding: '10px 20px', background: activeTab === 'gifts' ? '#94191d' : '#f1f5f9', color: activeTab === 'gifts' ? '#fff' : '#334155', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🎁 Free Gift Buckets</button>
        <button onClick={() => setActiveTab('banners')} style={{ padding: '10px 20px', background: activeTab === 'banners' ? '#94191d' : '#f1f5f9', color: activeTab === 'banners' ? '#fff' : '#334155', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🖼️ Home Banners & Flash Deals</button>
      </div>

      {/* 🎟️ 1. COUPON TAB */}
      {activeTab === 'coupons' && (
        <div>
          <form onSubmit={handleCreateCoupon} style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div>
              <label>Coupon Code *</label>
              <input type="text" placeholder="e.g. DIWALI20" value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            <div>
              <label>Discount Type</label>
              <select value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label>Discount Value *</label>
              <input type="number" placeholder="10 or 100" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            <div>
              <label>Min. Order Value (₹)</label>
              <input type="number" value={couponForm.minOrderValue} onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            <div>
              <label>Expiry Timeline Date *</label>
              <input type="datetime-local" value={couponForm.validUntil} onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            <button type="submit" disabled={loading} style={{ background: '#94191d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Create Coupon</button>
          </form>

          <div style={{ marginTop: '20px' }}>
            <h3>Existing Coupons</h3>
            {coupons.map((c) => (
              <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#fff', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                <div>
                  <strong>{c.code}</strong> ({c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`})
                  <span style={{ marginLeft: '10px', fontSize: '0.85rem', color: '#666' }}>Min Spend: ₹{c.minOrderValue} | Valid till: {new Date(c.validUntil).toLocaleString()}</span>
                </div>
                <button onClick={() => deleteItem('coupons', c._id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🎁 2. GIFT BUCKETS TAB */}
      {activeTab === 'gifts' && (
        <div>
          <form onSubmit={handleCreateGift} style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label>Gift Title *</label>
              <input type="text" placeholder="e.g. Free 100g Mathura Peda" value={giftForm.title} onChange={(e) => setGiftForm({ ...giftForm, title: e.target.value })} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            <div>
              <label>Unlock Spend Threshold (₹) *</label>
              <input type="number" placeholder="1500" value={giftForm.minOrder} onChange={(e) => setGiftForm({ ...giftForm, minOrder: e.target.value })} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            <div>
              <label>Gift Image *</label>
              <input type="file" accept="image/*" onChange={(e) => setGiftImg(e.target.files[0])} required style={{ width: '100%', marginTop: '4px' }} />
            </div>
            <button type="submit" disabled={loading} style={{ background: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', height: '42px', alignSelf: 'end' }}>Add Gift Bucket</button>
          </form>

          <div style={{ marginTop: '20px' }}>
            <h3>Active Gift Buckets (Roadmap)</h3>
            {gifts.map((g) => (
              <div key={g._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#fff', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img src={g.image.startsWith('http') ? g.image : `${API_BASE.replace('/api', '')}${g.image}`} alt={g.title} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />
                  <div>
                    <strong>{g.title}</strong>
                    <div style={{ color: '#059669', fontSize: '0.85rem' }}>Unlocks on ₹{g.minOrder}+ spend</div>
                  </div>
                </div>
                <button onClick={() => deleteItem('gifts', g._id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🖼️ 3. HOME BANNERS & TIMELINE OFFERS */}
      {activeTab === 'banners' && (
        <div>
          <form onSubmit={handleCreateBanner} style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label>Banner Heading *</label>
              <input type="text" placeholder="Authentic Village Sweets" value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            <div>
              <label>Flash Offer Timeline End (Countdown)</label>
              <input type="datetime-local" value={bannerForm.flashSaleEndTime} onChange={(e) => setBannerForm({ ...bannerForm, flashSaleEndTime: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
            </div>
            <div>
              <label>Banner Image *</label>
              <input type="file" accept="image/*" onChange={(e) => setBannerImg(e.target.files[0])} required style={{ width: '100%', marginTop: '4px' }} />
            </div>
            <button type="submit" disabled={loading} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', height: '42px', alignSelf: 'end' }}>Publish Banner & Offer</button>
          </form>

          <div style={{ marginTop: '20px' }}>
            <h3>Homepage Banners</h3>
            {banners.map((b) => (
              <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#fff', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img src={b.bannerImage.startsWith('http') ? b.bannerImage : `${API_BASE.replace('/api', '')}${b.bannerImage}`} alt={b.title} style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '6px' }} />
                  <div>
                    <strong>{b.title}</strong>
                    {b.flashSaleEndTime && <div style={{ color: '#dc2626', fontSize: '0.8rem' }}>Ends: {new Date(b.flashSaleEndTime).toLocaleString()}</div>}
                  </div>
                </div>
                <button onClick={() => deleteItem('banners', b._id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMarketingManager;