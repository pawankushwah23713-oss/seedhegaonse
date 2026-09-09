import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://seedhegaonse-1.onrender.com/api';

const AdminCouponGiftManager = () => {
  // ==========================================
  // 🎁 1. FREE GIFT / MILESTONES STATE
  // ==========================================
  const [giftMilestones, setGiftMilestones] = useState([]);
  const [giftTitle, setGiftTitle] = useState('');
  const [giftMinOrder, setGiftMinOrder] = useState('');
  const [giftDesc, setGiftDesc] = useState('');
  const [giftImage, setGiftImage] = useState(null);
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftListLoading, setGiftListLoading] = useState(false);
  const [giftStatusMsg, setGiftStatusMsg] = useState({ text: '', type: '' });

  // 🎟️ Coupon Form State
  const [code, setCode] = useState('');
  const [noOfTimesUse, setNoOfTimesUse] = useState('first_time');
  const [customUseCount, setCustomUseCount] = useState('');
  const [baseValue, setBaseValue] = useState('');
  const [discountType, setDiscountType] = useState('lumpsum');
  const [lumpsumAmount, setLumpsumAmount] = useState('');
  const [percentageAmount, setPercentageAmount] = useState('');
  const [maxDiscountValue, setMaxDiscountValue] = useState('');
  const [assignedUser, setAssignedUser] = useState('');

  const [couponList, setCouponList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // 👛 Wallet State
  const [walletIdentifier, setWalletIdentifier] = useState('');
  const [walletAmount, setWalletAmount] = useState('');
  const [walletNote, setWalletNote] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletStatusMsg, setWalletStatusMsg] = useState({ text: '', type: '' });
  const [walletResult, setWalletResult] = useState(null);

  // Helper for Auth Token
  const getAuthHeader = () => {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('adminToken') ||
      localStorage.getItem('userToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // =========================================================
  // 🔄 FETCH ALL FREE GIFTS (/api/gifts)
  // =========================================================
  const fetchGifts = async () => {
    setGiftListLoading(true);
    try {
      // Pehle admin route try karega, fallback me public
      let res;
      try {
        res = await axios.get(`${API_BASE}/gifts/all`, { headers: getAuthHeader() });
      } catch (err) {
        res = await axios.get(`${API_BASE}/gifts`);
      }

      if (Array.isArray(res.data)) {
        setGiftMilestones(res.data);
      }
    } catch (err) {
      console.error('Error fetching gifts:', err);
    } finally {
      setGiftListLoading(false);
    }
  };

  // =========================================================
  // ➕ ADD CUSTOM FREE GIFT WITH IMAGE
  // =========================================================
  const handleAddGift = async (e) => {
    e.preventDefault();
    if (!giftImage) {
      alert('Kripya ek Gift Image zaroor select karein!');
      return;
    }

    setGiftLoading(true);
    setGiftStatusMsg({ text: '', type: '' });

    try {
      const formData = new FormData();
      formData.append('title', giftTitle.trim());
      formData.append('minOrder', Number(giftMinOrder));
      formData.append('description', giftDesc.trim());
      formData.append('image', giftImage);

      await axios.post(`${API_BASE}/gifts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...getAuthHeader()
        }
      });

      setGiftStatusMsg({ text: '✅ Custom Free Gift successfully add ho gaya!', type: 'success' });
      setGiftTitle('');
      setGiftMinOrder('');
      setGiftDesc('');
      setGiftImage(null);
      // Reset file input
      const fileInput = document.getElementById('giftImageInput');
      if (fileInput) fileInput.value = '';

      fetchGifts();
    } catch (err) {
      setGiftStatusMsg({
        text: err.response?.data?.message || 'Gift add karne me error aaya.',
        type: 'error'
      });
    } finally {
      setGiftLoading(false);
    }
  };

  // =========================================================
  // 🗑️ DELETE FREE GIFT
  // =========================================================
  const handleDeleteGift = async (id, title) => {
    if (!window.confirm(`Kya aap "${title}" gift milestone ko delete karna chahte hain?`)) return;

    try {
      await axios.delete(`${API_BASE}/gifts/${id}`, { headers: getAuthHeader() });
      setGiftMilestones((prev) => prev.filter((g) => g._id !== id));
      setGiftStatusMsg({ text: `🗑️ Gift "${title}" delete ho gaya!`, type: 'success' });
    } catch (err) {
      alert(err.response?.data?.message || 'Delete karne me dikkat aayi.');
    }
  };

  // =========================================================
  // 🔄 COUPONS & WALLET HANDLERS
  // =========================================================
  const fetchCoupons = async () => {
    setListLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/coupons/available`);
      if (Array.isArray(res.data?.coupons)) {
        setCouponList(res.data.coupons);
      }
    } catch (err) {
      console.error('Coupons fetch error:', err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchGifts();
    fetchCoupons();
  }, []);

  const handleSeedSheet = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/coupons/seed-excel-coupons`);
      setStatusMsg({ text: res.data?.message || '✅ Excel Sheet Coupons seeded!', type: 'success' });
      fetchCoupons();
    } catch (err) {
      setStatusMsg({ text: 'Seed failed: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ text: '', type: '' });

    try {
      const finalUse = noOfTimesUse === 'custom' ? customUseCount : noOfTimesUse;
      const payload = {
        code: code.trim().toUpperCase(),
        noOfTimesUse: finalUse,
        maxUsagePerUser: finalUse === 'first_time' ? 1 : Number(finalUse) || 1,
        baseValue: Number(baseValue) || 0,
        discountType,
        lumpsumAmount: discountType === 'lumpsum' ? Number(lumpsumAmount) || 0 : 0,
        percentageAmount: discountType === 'percentage' ? Number(percentageAmount) || 0 : 0,
        maxDiscountValue: Number(maxDiscountValue) || (discountType === 'lumpsum' ? Number(lumpsumAmount) : 0),
        isActive: true,
        assignedUser: assignedUser.trim() || undefined
      };

      await axios.post(`${API_BASE}/coupons/admin/add`, payload);
      setStatusMsg({ text: `✅ Coupon "${payload.code}" added!`, type: 'success' });
      setCode('');
      setBaseValue('');
      setLumpsumAmount('');
      setPercentageAmount('');
      setMaxDiscountValue('');
      setNoOfTimesUse('first_time');
      setCustomUseCount('');
      setAssignedUser('');
      fetchCoupons();
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.message || 'Error saving coupon.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`Delete coupon "${coupon.code}"?`)) return;
    setBusyId(coupon._id);
    try {
      await axios.delete(`${API_BASE}/coupons/admin/${coupon._id}`);
      setCouponList((prev) => prev.filter((c) => c._id !== coupon._id));
    } catch (err) {
      alert('Delete error');
    } finally {
      setBusyId(null);
    }
  };

  const handleAddWalletCredit = async (e) => {
    e.preventDefault();
    setWalletLoading(true);
    setWalletStatusMsg({ text: '', type: '' });
    setWalletResult(null);
    try {
      const res = await axios.post(`${API_BASE}/coupons/admin/wallet-credit`, {
        identifier: walletIdentifier.trim(),
        amount: Number(walletAmount),
        note: walletNote.trim()
      });
      setWalletStatusMsg({ text: res.data?.message || '✅ Wallet credit ho gaya!', type: 'success' });
      setWalletResult(res.data?.wallet || null);
      setWalletAmount('');
      setWalletNote('');
    } catch (err) {
      setWalletStatusMsg({ text: err.response?.data?.message || 'Error', type: 'error' });
    } finally {
      setWalletLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '980px', margin: '20px auto', padding: '0 15px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* ================= 🎁 1. REAL DYNAMIC FREE GIFT SECTION ================= */}
      <div style={{ background: '#fff', border: '2px solid #b91c1c', borderRadius: '10px', padding: '20px', marginBottom: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h2 style={{ color: '#c00000', margin: '0 0 6px 0', fontSize: '1.4rem', fontWeight: 800 }}>🎁 Free Gift Configuration (Milestones)</h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 16px 0' }}>
          Apni marzi ka koi bhi Custom Order Base Value (e.g. ₹1500, ₹2500, ₹3000) aur Free Gift add karein.
        </p>

        {/* Add Form */}
        <form onSubmit={handleAddGift} style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '1rem' }}>➕ Add New Custom Gift Milestone</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Gift Title *</label>
              <input
                type="text"
                placeholder="e.g. Delicious Sweets Box"
                value={giftTitle}
                onChange={(e) => setGiftTitle(e.target.value)}
                required
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Order (Base Value) Rs. *</label>
              <input
                type="number"
                placeholder="e.g. 1500, 2500 ya 5000"
                value={giftMinOrder}
                onChange={(e) => setGiftMinOrder(e.target.value)}
                required
                min="1"
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Gift Image *</label>
              <input
                id="giftImageInput"
                type="file"
                accept="image/*"
                onChange={(e) => setGiftImage(e.target.files[0])}
                required
                style={{ width: '100%', padding: '6px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', background: '#fff' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Description (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Special festive treat"
                value={giftDesc}
                onChange={(e) => setGiftDesc(e.target.value)}
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={giftLoading}
            style={{ marginTop: '14px', background: '#0284c7', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '6px', fontWeight: 700, cursor: giftLoading ? 'wait' : 'pointer' }}
          >
            {giftLoading ? 'Adding...' : '💾 Save Custom Gift'}
          </button>

          {giftStatusMsg.text && (
            <div style={{ marginTop: '10px', color: giftStatusMsg.type === 'success' ? '#15803d' : '#b91c1c', fontWeight: 700, fontSize: '0.88rem' }}>
              {giftStatusMsg.text}
            </div>
          )}
        </form>

        {/* Existing Gifts List */}
        <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#0f172a', fontWeight: 800 }}>
          Active Free Gift Milestones ({giftMilestones.length})
        </h4>

        {giftListLoading ? (
          <div style={{ padding: '15px', color: '#64748b' }}>Gifts load ho rahe hain...</div>
        ) : giftMilestones.length === 0 ? (
          <div style={{ padding: '15px', color: '#64748b', background: '#f8fafc', borderRadius: '6px' }}>
            Abhi koi custom gift configure nahi hai. Upar se add karein.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {giftMilestones.map((g) => (
              <div key={g._id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', display: 'flex', gap: '12px', alignItems: 'center', background: '#fff' }}>
                {g.image ? (
                  <img
                    src={`https://seedhegaonse-1.onrender.com${g.image}`}
                    alt={g.title}
                    style={{ width: '55px', height: '55px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ width: '55px', height: '55px', background: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🎁</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.92rem' }}>{g.title}</div>
                  <div style={{ color: '#0284c7', fontWeight: 700, fontSize: '0.84rem' }}>Min Order: ₹{g.minOrder}</div>
                  {g.description && <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{g.description}</div>}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteGift(g._id, g.title)}
                  style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}
                >
                  🗑️ Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= 👛 2. WALLET CREDIT (SPECIFIC USER) CARD ================= */}
      <div style={{ background: '#fff', border: '2px solid #0284c7', borderRadius: '10px', padding: '20px', marginBottom: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h2 style={{ color: '#0369a1', margin: '0 0 8px 0', fontSize: '1.4rem', fontWeight: 800 }}>👛 Wallet Credit (Specific User)</h2>
        <form onSubmit={handleAddWalletCredit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>User (userId / email / phone) *</label>
              <input
                type="text"
                placeholder="e.g. 98xxxxxxxx"
                value={walletIdentifier}
                onChange={(e) => setWalletIdentifier(e.target.value)}
                required
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Amount (₹) *</label>
              <input
                type="number"
                placeholder="e.g. 100"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                required
                min="1"
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Referral bonus"
                value={walletNote}
                onChange={(e) => setWalletNote(e.target.value)}
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={walletLoading}
            style={{ width: '100%', background: '#0284c7', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 800, cursor: walletLoading ? 'wait' : 'pointer' }}
          >
            {walletLoading ? 'Adding...' : '👛 Add to Wallet'}
          </button>
          {walletStatusMsg.text && (
            <div style={{ marginTop: '10px', color: walletStatusMsg.type === 'success' ? '#15803d' : '#b91c1c', fontWeight: 700 }}>
              {walletStatusMsg.text}
            </div>
          )}
          {walletResult && (
            <div style={{ marginTop: '10px', padding: '10px', background: '#f0f9ff', borderRadius: '6px', color: '#0c4a6e' }}>
              Naya Balance: <strong>₹{walletResult.walletBalance}</strong>
            </div>
          )}
        </form>
      </div>

      {/* ================= 🎟️ 3. COUPON ADMIN CARD ================= */}
      <div style={{ background: '#fff', border: '2px solid #b91c1c', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ color: '#c00000', margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>🎟️ Coupon Admin</h2>
          <button
            type="button"
            onClick={handleSeedSheet}
            disabled={loading}
            style={{ background: '#15803d', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
          >
            ⚡ Seed Excel Sheet Coupons
          </button>
        </div>

        <form onSubmit={handleSaveCoupon}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Coupon Code *</label>
              <input
                type="text"
                placeholder="e.g. SGS50"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>No. of times Use *</label>
              <select
                value={noOfTimesUse}
                onChange={(e) => setNoOfTimesUse(e.target.value)}
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', background: '#fff', boxSizing: 'border-box' }}
              >
                <option value="first_time">First Time use</option>
                <option value="10">10 times</option>
                <option value="2">2 times</option>
                <option value="custom">Custom count...</option>
              </select>
              {noOfTimesUse === 'custom' && (
                <input
                  type="number"
                  placeholder="Count (e.g. 5)"
                  value={customUseCount}
                  onChange={(e) => setCustomUseCount(e.target.value)}
                  style={{ width: '100%', padding: '6px', marginTop: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                  required
                />
              )}
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Base Value (Min Order) *</label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={baseValue}
                onChange={(e) => setBaseValue(e.target.value)}
                required
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Type *</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', background: '#fff', boxSizing: 'border-box' }}
              >
                <option value="lumpsum">Lumpsum (Flat Rs)</option>
                <option value="percentage">% Amount on Value</option>
              </select>
            </div>
            {discountType === 'lumpsum' ? (
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Lumpsum (Rs.) *</label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={lumpsumAmount}
                  onChange={(e) => setLumpsumAmount(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>
            ) : (
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>% (Percentage) *</label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  value={percentageAmount}
                  onChange={(e) => setPercentageAmount(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
                />
              </div>
            )}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Max Discount Value *</label>
              <input
                type="number"
                placeholder="e.g. 100"
                value={maxDiscountValue}
                onChange={(e) => setMaxDiscountValue(e.target.value)}
                required
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: '#c00000', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 800, cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? 'Saving...' : '💾 Add Coupon to Store'}
          </button>
          {statusMsg.text && (
            <div style={{ marginTop: '10px', color: statusMsg.type === 'success' ? '#15803d' : '#b91c1c', fontWeight: 700 }}>
              {statusMsg.text}
            </div>
          )}
        </form>

        {/* Coupons Table */}
        <div style={{ marginTop: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '8px' }}>Code</th>
                <th style={{ padding: '8px' }}>Usage</th>
                <th style={{ padding: '8px' }}>Min Order</th>
                <th style={{ padding: '8px' }}>Discount</th>
                <th style={{ padding: '8px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {couponList.map((c) => (
                <tr key={c._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px', fontWeight: 800, color: '#c00000' }}>{c.code}</td>
                  <td style={{ padding: '8px' }}>{c.noOfTimesUse}</td>
                  <td style={{ padding: '8px' }}>₹{c.baseValue}</td>
                  <td style={{ padding: '8px' }}>
                    {c.discountType === 'lumpsum' ? `₹${c.lumpsumAmount}` : `${c.percentageAmount}% (Max ₹${c.maxDiscountValue})`}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(c)}
                      style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminCouponGiftManager;