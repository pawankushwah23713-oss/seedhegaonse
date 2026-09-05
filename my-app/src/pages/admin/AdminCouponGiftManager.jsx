
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://orange-ape-497824.hostingersite.com/api';

const AdminCouponGiftManager = () => {
  // 🎟️ Coupon Form State
  const [code, setCode] = useState('');
  const [noOfTimesUse, setNoOfTimesUse] = useState('first_time'); // 'first_time', '10', '2', custom
  const [customUseCount, setCustomUseCount] = useState('');
  const [baseValue, setBaseValue] = useState('');
  const [discountType, setDiscountType] = useState('lumpsum'); // 'lumpsum' or 'percentage'
  const [lumpsumAmount, setLumpsumAmount] = useState('');
  const [percentageAmount, setPercentageAmount] = useState('');
  const [maxDiscountValue, setMaxDiscountValue] = useState('');
  
  const [couponList, setCouponList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // 🎁 Free Gift Settings State
  const [giftTier1, setGiftTier1] = useState('Delicious Sweets Gift Box (Tier 1)');
  const [giftTier2, setGiftTier2] = useState('Special Premium Gift (Tier 2)');
  const [giftSavedMsg, setGiftSavedMsg] = useState('');

  // Fetch all coupons
  const fetchCoupons = async () => {
    try {
      const res = await axios.get(`${API_BASE}/coupons/available`);
      if (Array.isArray(res.data?.coupons)) {
        setCouponList(res.data.coupons);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Quick Seed Default Sheet Coupons (SGS50, SGS100, SGS125)
  const handleSeedSheet = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/coupons/seed-excel-coupons`);
      setStatusMsg({ text: '✅ Excel Sheet Coupons (SGS50, SGS100, SGS125) seeded successfully!', type: 'success' });
      fetchCoupons();
    } catch (err) {
      setStatusMsg({ text: 'Seed failed: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Save new coupon
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
        isActive: true
      };

      await axios.post(`${API_BASE}/coupons/admin/add`, payload);
      setStatusMsg({ text: `✅ Coupon ${payload.code} added successfully!`, type: 'success' });
      
      // Reset form
      setCode('');
      setBaseValue('');
      setLumpsumAmount('');
      setPercentageAmount('');
      setMaxDiscountValue('');
      setNoOfTimesUse('first_time');
      fetchCoupons();
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.message || 'Error saving coupon.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '950px', margin: '20px auto', padding: '0 15px', fontFamily: 'sans-serif' }}>
      
      {/* ================= 🎁 1. FREE GIFT ADMIN CARD ================= */}
      <div style={{ background: '#fff', border: '2px solid #b91c1c', borderRadius: '10px', padding: '20px', marginBottom: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h2 style={{ color: '#c00000', margin: '0 0 8px 0', fontSize: '1.4rem' }}>🎁 Free Gift Configuration</h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 16px 0' }}>
          Always Amount/Value Base Show: Tier 1 unlocks at ₹1500. Tier 2 at ₹2500 (Tier 1 turns OFF automatically).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '4px' }}>
              Order (Base Value) Rs. 1500/- Gift Title
            </label>
            <input
              type="text"
              value={giftTier1}
              onChange={(e) => setGiftTier1(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '6px' }}
            />
            <span style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: 600 }}>Free Gift automatically shows</span>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '4px' }}>
              Order (Base Value) Rs. 2500/- Gift Title
            </label>
            <input
              type="text"
              value={giftTier2}
              onChange={(e) => setGiftTier2(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '6px' }}
            />
            <span style={{ fontSize: '0.74rem', color: '#b91c1c', fontWeight: 600 }}>First Free Gift Show OFF and new Gift Show</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setGiftSavedMsg('✅ Free Gift titles saved!')}
          style={{ marginTop: '14px', background: '#0284c7', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
        >
          Save Free Gift Tiers
        </button>
        {giftSavedMsg && <span style={{ marginLeft: '10px', color: '#15803d', fontSize: '0.88rem', fontWeight: 700 }}>{giftSavedMsg}</span>}
      </div>

      {/* ================= 🎟️ 2. COUPON ADMIN CARD ================= */}
      <div style={{ background: '#fff', border: '2px solid #b91c1c', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <h2 style={{ color: '#c00000', margin: 0, fontSize: '1.4rem' }}>🎟️ Coupon Admin</h2>
          <button
            type="button"
            onClick={handleSeedSheet}
            disabled={loading}
            style={{ background: '#15803d', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
          >
            ⚡ Seed Excel Sheet Coupons (SGS50, SGS100, SGS125)
          </button>
        </div>

        <form onSubmit={handleSaveCoupon}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            
            {/* 1. Coupon Code */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Coupon Code *</label>
              <input
                type="text"
                placeholder="e.g. SGS50"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>

            {/* 2. No. of times Use */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>No. of times Use *</label>
              <select
                value={noOfTimesUse}
                onChange={(e) => setNoOfTimesUse(e.target.value)}
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
              >
                <option value="first_time">First Time use</option>
                <option value="10">10 times</option>
                <option value="2">2 times</option>
                <option value="custom">Custom count...</option>
              </select>
              {noOfTimesUse === 'custom' && (
                <input
                  type="number"
                  placeholder="Enter count (e.g. 5)"
                  value={customUseCount}
                  onChange={(e) => setCustomUseCount(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', marginTop: '4px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  required
                />
              )}
            </div>

            {/* 3. Base Value */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Base Value (Min Order) *</label>
              <input
                type="number"
                placeholder="e.g. 500, 1500, 1000"
                value={baseValue}
                onChange={(e) => setBaseValue(e.target.value)}
                required
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>

            {/* 4. Discount Type */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Type (Lumpsum vs %) *</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', background: '#fff' }}
              >
                <option value="lumpsum">Lumpsum (Flat Rs)</option>
                <option value="percentage">% Amount on Value</option>
              </select>
            </div>

            {/* 5. Value (Lumpsum or %) */}
            {discountType === 'lumpsum' ? (
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Lumpsum (Rs.) *</label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={lumpsumAmount}
                  onChange={(e) => setLumpsumAmount(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
            ) : (
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>% (Percentage) *</label>
                <input
                  type="number"
                  placeholder="e.g. 5 or 10"
                  value={percentageAmount}
                  onChange={(e) => setPercentageAmount(e.target.value)}
                  required
                  style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px' }}
                />
              </div>
            )}

            {/* 6. Max Discount Value */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Max Discount Value *</label>
              <input
                type="number"
                placeholder="e.g. 50, 100, 75"
                value={maxDiscountValue}
                onChange={(e) => setMaxDiscountValue(e.target.value)}
                required
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: '#c00000', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}
          >
            {loading ? 'Saving...' : '💾 Add Coupon to Store'}
          </button>

          {statusMsg.text && (
            <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', fontSize: '0.88rem', fontWeight: 700, background: statusMsg.type === 'success' ? '#dcfce7' : '#fee2e2', color: statusMsg.type === 'success' ? '#15803d' : '#b91c1c' }}>
              {statusMsg.text}
            </div>
          )}
        </form>

        {/* ================= 📋 3. COUPONS TABLE (Matching Excel Format) ================= */}
        <div style={{ marginTop: '25px', overflowX: 'auto' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#0f172a' }}>Active Coupons List</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '10px 8px' }}>Coupon Code</th>
                <th style={{ padding: '10px 8px' }}>No. of times Use</th>
                <th style={{ padding: '10px 8px' }}>Base Value</th>
                <th style={{ padding: '10px 8px' }}>Lumpsum</th>
                <th style={{ padding: '10px 8px' }}>%</th>
                <th style={{ padding: '10px 8px' }}>Max Discount Value</th>
              </tr>
            </thead>
            <tbody>
              {couponList.map((c) => (
                <tr key={c.code} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#c00000' }}>{c.code}</td>
                  <td style={{ padding: '10px 8px', color: '#b91c1c', fontWeight: 600 }}>
                    {c.noOfTimesUse === 'first_time' ? 'First Time use' : c.noOfTimesUse}
                  </td>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>₹{c.baseValue}</td>
                  <td style={{ padding: '10px 8px' }}>{c.discountType === 'lumpsum' ? `₹${c.lumpsumAmount}` : '-'}</td>
                  <td style={{ padding: '10px 8px' }}>{c.discountType === 'percentage' ? `${c.percentageAmount}%` : '-'}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 800, color: '#15803d' }}>₹{c.maxDiscountValue}</td>
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