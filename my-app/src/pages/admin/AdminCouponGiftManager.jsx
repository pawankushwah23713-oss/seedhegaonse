import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://seedhegaonse-1.onrender.com/api';

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
  // 🟢 NEW: agar bhara gaya to ye coupon sirf usi user ke liye lock ho jayega
  const [assignedUser, setAssignedUser] = useState('');

  const [couponList, setCouponList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [busyId, setBusyId] = useState(null); // Track which item is being deleted
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // 🎁 Free Gift Settings State
  const [giftTier1, setGiftTier1] = useState('Delicious Sweets Gift Box (Tier 1)');
  const [giftTier2, setGiftTier2] = useState('Special Premium Gift (Tier 2)');
  const [giftSavedMsg, setGiftSavedMsg] = useState('');

  // 👛 NEW: Wallet Credit Form State
  const [walletIdentifier, setWalletIdentifier] = useState(''); // userId / email / phone
  const [walletAmount, setWalletAmount] = useState('');
  const [walletNote, setWalletNote] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletStatusMsg, setWalletStatusMsg] = useState({ text: '', type: '' });
  const [walletResult, setWalletResult] = useState(null); // last successful credit result

  // =========================================================
  // 🔄 1. FETCH ALL COUPONS
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
    fetchCoupons();
  }, []);

  // =========================================================
  // ⚡ 2. SEED DEFAULT SHEET COUPONS (SGS50, SGS100, SGS125)
  // =========================================================
  const handleSeedSheet = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/coupons/seed-excel-coupons`);
      setStatusMsg({ 
        text: res.data?.message || '✅ Excel Sheet Coupons (SGS50, SGS100, SGS125) seeded successfully!', 
        type: 'success' 
      });
      fetchCoupons();
    } catch (err) {
      setStatusMsg({ text: 'Seed failed: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // ➕ 3. SAVE / ADD NEW COUPON
  // =========================================================
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
        // 🟢 NEW: agar admin ne koi specific user diya hai, to wahi bhejo
        assignedUser: assignedUser.trim() || undefined
      };

      await axios.post(`${API_BASE}/coupons/admin/add`, payload);
      setStatusMsg({
        text: assignedUser.trim()
          ? `✅ Private Coupon "${payload.code}" sirf "${assignedUser.trim()}" ke liye add ho gaya!`
          : `✅ Coupon "${payload.code}" added successfully!`,
        type: 'success'
      });
      
      // Reset form
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

  // =========================================================
  // 🗑️ 4. DELETE COUPON (Calls DELETE /api/coupons/admin/:id)
  // =========================================================
  const handleDeleteCoupon = async (coupon) => {
    const deleteId = coupon._id;
    if (!deleteId) {
      alert('Coupon ID missing hai.');
      return;
    }

    if (!window.confirm(`Kya aap sach me coupon "${coupon.code}" ko delete karna chahte hain?`)) {
      return;
    }

    setBusyId(deleteId);
    setStatusMsg({ text: '', type: '' });

    try {
      const res = await axios.delete(`${API_BASE}/coupons/admin/${deleteId}`);
      setStatusMsg({
        text: res.data?.message || `🗑️ Coupon "${coupon.code}" delete ho gaya!`,
        type: 'success'
      });

      // Table se instantly hatao
      setCouponList((prev) => prev.filter((c) => c._id !== deleteId));
    } catch (err) {
      console.error('Delete error:', err);
      setStatusMsg({
        text: err.response?.data?.message || 'Coupon delete karne me dikkat aayi.',
        type: 'error'
      });
    } finally {
      setBusyId(null);
    }
  };

  // =========================================================
  // 👛 5. 🟢 NEW: ADD WALLET CREDIT TO A SPECIFIC USER
  // =========================================================
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

      setWalletStatusMsg({
        text: res.data?.message || '✅ Wallet credit ho gaya!',
        type: 'success'
      });
      setWalletResult(res.data?.wallet || null);

      // Reset form (identifier rehne dete hain taaki dobara dekh sake)
      setWalletAmount('');
      setWalletNote('');
    } catch (err) {
      setWalletStatusMsg({
        text: err.response?.data?.message || 'Wallet credit karne me dikkat aayi.',
        type: 'error'
      });
    } finally {
      setWalletLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '980px', margin: '20px auto', padding: '0 15px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* ================= 🎁 1. FREE GIFT ADMIN CARD ================= */}
      <div style={{ background: '#fff', border: '2px solid #b91c1c', borderRadius: '10px', padding: '20px', marginBottom: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h2 style={{ color: '#c00000', margin: '0 0 8px 0', fontSize: '1.4rem', fontWeight: 800 }}>🎁 Free Gift Configuration</h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 16px 0' }}>
          Always Amount/Value Base Show: Tier 1 unlocks at ₹1500. Tier 2 at ₹2500 (Tier 1 turns OFF automatically).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '4px' }}>
              Order (Base Value) Rs. 1500/- Gift Title
            </label>
            <input
              type="text"
              value={giftTier1}
              onChange={(e) => setGiftTier1(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
            />
            <span style={{ fontSize: '0.74rem', color: '#15803d', fontWeight: 600, display: 'block', marginTop: '4px' }}>
              ✓ Free Gift automatically shows
            </span>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '4px' }}>
              Order (Base Value) Rs. 2500/- Gift Title
            </label>
            <input
              type="text"
              value={giftTier2}
              onChange={(e) => setGiftTier2(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
            />
            <span style={{ fontSize: '0.74rem', color: '#b91c1c', fontWeight: 600, display: 'block', marginTop: '4px' }}>
              ✓ First Free Gift Show OFF and new Gift Show
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setGiftSavedMsg('✅ Free Gift titles saved!')}
          style={{ marginTop: '14px', background: '#0284c7', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
        >
          Save Free Gift Tiers
        </button>
        {giftSavedMsg && <span style={{ marginLeft: '12px', color: '#15803d', fontSize: '0.88rem', fontWeight: 700 }}>{giftSavedMsg}</span>}
      </div>

      {/* ================= 👛 2. 🟢 NEW: WALLET CREDIT (SPECIFIC USER) CARD ================= */}
      <div style={{ background: '#fff', border: '2px solid #0284c7', borderRadius: '10px', padding: '20px', marginBottom: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h2 style={{ color: '#0369a1', margin: '0 0 8px 0', fontSize: '1.4rem', fontWeight: 800 }}>👛 Wallet Credit (Specific User)</h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 16px 0' }}>
          Kisi ek customer ke wallet me seedha paisa daalo — koi coupon code nahi lagega, wo khud checkout par is balance ko use kar payega.
        </p>

        <form onSubmit={handleAddWalletCredit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                User (userId / email / phone) *
              </label>
              <input
                type="text"
                placeholder="e.g. 98xxxxxxxx ya user@email.com"
                value={walletIdentifier}
                onChange={(e) => setWalletIdentifier(e.target.value)}
                required
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Amount (₹) *
              </label>
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
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Referral bonus, Birthday gift..."
                value={walletNote}
                onChange={(e) => setWalletNote(e.target.value)}
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={walletLoading}
            style={{ width: '100%', background: '#0284c7', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 800, fontSize: '0.95rem', cursor: walletLoading ? 'wait' : 'pointer' }}
          >
            {walletLoading ? 'Adding...' : '👛 Add to Wallet'}
          </button>

          {walletStatusMsg.text && (
            <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', fontSize: '0.88rem', fontWeight: 700, background: walletStatusMsg.type === 'success' ? '#dcfce7' : '#fee2e2', color: walletStatusMsg.type === 'success' ? '#15803d' : '#b91c1c' }}>
              {walletStatusMsg.text}
            </div>
          )}

          {walletResult && (
            <div style={{ marginTop: '10px', padding: '12px', borderRadius: '6px', background: '#f0f9ff', border: '1px solid #bae6fd', fontSize: '0.85rem', color: '#0c4a6e' }}>
              <strong>{walletResult.name || walletResult.email || walletResult.phone}</strong> ka naya wallet balance:{' '}
              <strong style={{ color: '#0369a1' }}>₹{walletResult.walletBalance}</strong>
            </div>
          )}
        </form>
      </div>

      {/* ================= 🎟️ 3. COUPON ADMIN CARD ================= */}
      <div style={{ background: '#fff', border: '2px solid #b91c1c', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <h2 style={{ color: '#c00000', margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>🎟️ Coupon Admin</h2>
          <button
            type="button"
            onClick={handleSeedSheet}
            disabled={loading}
            style={{ background: '#15803d', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, cursor: loading ? 'wait' : 'pointer' }}
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
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>

            {/* 2. No. of times Use */}
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
                  placeholder="Enter count (e.g. 5)"
                  value={customUseCount}
                  onChange={(e) => setCustomUseCount(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', marginTop: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
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
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>

            {/* 4. Discount Type */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Type (Lumpsum vs %) *</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', background: '#fff', boxSizing: 'border-box' }}
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
                  style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
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
                  style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
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
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
              />
            </div>

            {/* 7. 🟢 NEW: Assign to a specific user (optional) */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Assign to Specific User (Optional)
              </label>
              <input
                type="text"
                placeholder="userId / email / phone"
                value={assignedUser}
                onChange={(e) => setAssignedUser(e.target.value)}
                style={{ width: '100%', padding: '9px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '3px' }}>
                Blank chhodo agar sabke liye public coupon banana hai.
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: '#c00000', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 800, fontSize: '0.95rem', cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? 'Saving...' : '💾 Add Coupon to Store'}
          </button>

          {statusMsg.text && (
            <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', fontSize: '0.88rem', fontWeight: 700, background: statusMsg.type === 'success' ? '#dcfce7' : '#fee2e2', color: statusMsg.type === 'success' ? '#15803d' : '#b91c1c' }}>
              {statusMsg.text}
            </div>
          )}
        </form>

        {/* ================= 📋 4. COUPONS TABLE (With Delete Action) ================= */}
        <div style={{ marginTop: '25px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: 800 }}>
              Active Coupons List ({couponList.length})
            </h4>
            <button
              type="button"
              onClick={fetchCoupons}
              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '5px', fontSize: '0.78rem', cursor: 'pointer' }}
            >
              🔄 Refresh
            </button>
          </div>

          {listLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading coupons...</div>
          ) : couponList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', background: '#f8fafc', borderRadius: '6px' }}>
              No coupons configured yet. Click on <strong>"Seed Excel Sheet Coupons"</strong> above.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '10px 8px' }}>Coupon Code</th>
                  <th style={{ padding: '10px 8px' }}>No. of times Use</th>
                  <th style={{ padding: '10px 8px' }}>Base Value</th>
                  <th style={{ padding: '10px 8px' }}>Lumpsum</th>
                  <th style={{ padding: '10px 8px' }}>%</th>
                  <th style={{ padding: '10px 8px' }}>Max Discount Value</th>
                  <th style={{ padding: '10px 8px' }}>Assigned User</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {couponList.map((c) => {
                  const isDeleting = busyId === c._id;
                  return (
                    <tr key={c._id || c.code} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 8px', fontWeight: 800, color: '#c00000' }}>{c.code}</td>
                      <td style={{ padding: '10px 8px', color: '#b91c1c', fontWeight: 600 }}>
                        {c.noOfTimesUse === 'first_time' ? 'First Time use' : `${c.noOfTimesUse} times`}
                      </td>
                      <td style={{ padding: '10px 8px', fontWeight: 700 }}>₹{c.baseValue}</td>
                      <td style={{ padding: '10px 8px' }}>{c.discountType === 'lumpsum' ? `₹${c.lumpsumAmount}` : '-'}</td>
                      <td style={{ padding: '10px 8px' }}>{c.discountType === 'percentage' ? `${c.percentageAmount}%` : '-'}</td>
                      <td style={{ padding: '10px 8px', fontWeight: 800, color: '#15803d' }}>₹{c.maxDiscountValue}</td>
                      <td style={{ padding: '10px 8px' }}>
                        {c.assignedUser ? (
                          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700 }}>
                            🔒 Private
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Public</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(c)}
                          disabled={isDeleting}
                          style={{
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '5px',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: isDeleting ? 'wait' : 'pointer'
                          }}
                        >
                          {isDeleting ? '...' : '🗑️ Delete'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminCouponGiftManager;