import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const getAuthToken = () => {
  try {
    const directToken = localStorage.getItem('token') ||
                        localStorage.getItem('userToken') ||
                        localStorage.getItem('authToken');
    if (directToken) return directToken;
    const userObj = localStorage.getItem('user');
    if (userObj) {
      const parsed = JSON.parse(userObj);
      return parsed.token || parsed.jwt || null;
    }
  } catch (err) {
    console.error('Token read error:', err);
  }
  return null;
};

const MyCoupons = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'expired'
  const [copiedCode, setCopiedCode] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });

  // 👛 NEW: Wallet Balance State
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletHistory, setWalletHistory] = useState([]);
  const [walletLoading, setWalletLoading] = useState(true);
  const [showWalletHistory, setShowWalletHistory] = useState(false);

  // 1. Fetch Coupons from MongoDB
  const fetchMyCoupons = async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/coupons/my-coupons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.savedCoupons)) {
        setCoupons(data.savedCoupons);
        localStorage.setItem('sgs_saved_coupons', JSON.stringify(data.savedCoupons));
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. 👛 NEW: Fetch Wallet Balance from MongoDB
  const fetchMyWallet = async () => {
    const token = getAuthToken();
    if (!token) {
      setWalletLoading(false);
      return;
    }
    try {
      setWalletLoading(true);
      const res = await fetch(`${API_BASE}/coupons/my-wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setWalletBalance(Number(data.walletBalance) || 0);
        if (Array.isArray(data.walletHistory)) {
          setWalletHistory(data.walletHistory);
        }
      }
    } catch (err) {
      console.error('Failed to load wallet balance:', err);
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCoupons();
    fetchMyWallet();
  }, []);

  // 3. Remove Single Coupon
  const handleRemoveSingle = async (code) => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/coupons/my-coupons/${encodeURIComponent(code)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.savedCoupons)) {
        setCoupons(data.savedCoupons);
        localStorage.setItem('sgs_saved_coupons', JSON.stringify(data.savedCoupons));
        setMsg({ text: `Coupon ${code} removed!`, type: 'success' });
      }
    } catch {
      setMsg({ text: 'Failed to remove coupon', type: 'error' });
    }
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  // 4. 🗑️ Clean Up ALL Expired Coupons from MongoDB
  const handleCleanExpired = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/coupons/my-coupons/cleanup/expired`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.savedCoupons)) {
        setCoupons(data.savedCoupons);
        localStorage.setItem('sgs_saved_coupons', JSON.stringify(data.savedCoupons));
        setMsg({ text: '✓ All expired coupons removed successfully!', type: 'success' });
      }
    } catch {
      setMsg({ text: 'Failed to clean expired coupons', type: 'error' });
    }
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  // Classify coupons into Active & Expired
  const now = new Date();
  const processedCoupons = coupons.map((c) => {
    const validDate = c.validUntil ? new Date(c.validUntil) : null;
    const isExpired = Boolean(validDate && !isNaN(validDate.getTime()) && validDate < now);
    return { ...c, isExpired, validDate };
  });

  const activeCount = processedCoupons.filter((c) => !c.isExpired).length;
  const expiredCount = processedCoupons.filter((c) => c.isExpired).length;

  const filteredCoupons = processedCoupons.filter((c) => {
    if (filter === 'active') return !c.isExpired;
    if (filter === 'expired') return c.isExpired;
    return true;
  });

  return (
    <div style={{ maxWidth: '960px', margin: '30px auto', padding: '0 20px', fontFamily: 'inherit' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#881337', margin: 0 }}>
            🎫 My Coupon Wallet
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Manage and use your saved discounts and rewards for your orders.
          </p>
        </div>

        {expiredCount > 0 && (
          <button
            onClick={handleCleanExpired}
            style={{
              background: '#fee2e2',
              color: '#b91c1c',
              border: '1.5px solid #f87171',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🗑️ Remove Expired Coupons ({expiredCount})
          </button>
        )}
      </div>

      {/* 👛 NEW: Wallet Balance Card */}
      <div style={{
        background: 'linear-gradient(135deg, #0369a1, #0284c7)',
        borderRadius: '14px',
        padding: '20px 22px',
        marginBottom: '24px',
        color: '#fff',
        boxShadow: '0 6px 18px rgba(2, 132, 199, 0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              👛 Wallet Balance
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '2px' }}>
              {walletLoading ? '...' : `₹${walletBalance.toFixed(2)}`}
            </div>
          </div>

          {walletHistory.length > 0 && (
            <button
              onClick={() => setShowWalletHistory((prev) => !prev)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.4)',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {showWalletHistory ? 'Hide History' : 'View History'}
            </button>
          )}
        </div>

        {showWalletHistory && walletHistory.length > 0 && (
          <div style={{ marginTop: '14px', borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {walletHistory.map((h, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ opacity: 0.9 }}>
                  {h.note || 'Wallet credit'} · {h.date ? new Date(h.date).toLocaleDateString('en-IN') : ''}
                </span>
                <strong>+₹{Number(h.amount || 0).toFixed(2)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      {msg.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          background: msg.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: msg.type === 'success' ? '#15803d' : '#b91c1c',
          border: `1px solid ${msg.type === 'success' ? '#86efac' : '#fca5a5'}`
        }}>
          {msg.text}
        </div>
      )}

      {/* Tabs Filter */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            background: filter === 'all' ? '#881337' : '#f1f5f9',
            color: filter === 'all' ? '#fff' : '#475569',
            border: 'none',
            padding: '8px 18px',
            borderRadius: '20px',
            fontWeight: '700',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          All ({processedCoupons.length})
        </button>

        <button
          onClick={() => setFilter('active')}
          style={{
            background: filter === 'active' ? '#15803d' : '#f1f5f9',
            color: filter === 'active' ? '#fff' : '#475569',
            border: 'none',
            padding: '8px 18px',
            borderRadius: '20px',
            fontWeight: '700',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          Active ({activeCount})
        </button>

        <button
          onClick={() => setFilter('expired')}
          style={{
            background: filter === 'expired' ? '#b91c1c' : '#f1f5f9',
            color: filter === 'expired' ? '#fff' : '#475569',
            border: 'none',
            padding: '8px 18px',
            borderRadius: '20px',
            fontWeight: '700',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          Expired ({expiredCount})
        </button>
      </div>

      {/* Coupons Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>⏳ Loading your coupons...</div>
      ) : filteredCoupons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎟️</div>
          <h3 style={{ margin: '0 0 6px', color: '#334155' }}>No coupons found</h3>
          <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.88rem' }}>
            Complete orders to earn special rewards and discount vouchers!
          </p>
          <button
            onClick={() => navigate('/')}
            style={{ background: '#881337', color: '#fff', padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Explore Sweets & Cakes
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredCoupons.map((coupon, idx) => (
            <div
              key={coupon.code || idx}
              style={{
                background: coupon.isExpired ? '#fafafa' : '#fff',
                border: `1.5px dashed ${coupon.isExpired ? '#d1d5db' : '#881337'}`,
                borderRadius: '12px',
                padding: '16px',
                position: 'relative',
                boxShadow: coupon.isExpired ? 'none' : '0 2px 8px rgba(136,19,55,0.06)',
                opacity: coupon.isExpired ? 0.7 : 1
              }}
            >
              {/* Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span
                  style={{
                    background: coupon.isExpired ? '#fee2e2' : '#dcfce7',
                    color: coupon.isExpired ? '#b91c1c' : '#15803d',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}
                >
                  {coupon.isExpired ? '⌛ EXPIRED' : '✓ ACTIVE'}
                </span>

                <button
                  onClick={() => handleRemoveSingle(coupon.code)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px' }}
                  title="Delete Coupon"
                >
                  ✕
                </button>
              </div>

              {/* Coupon Code */}
              <div style={{ fontSize: '1.25rem', fontWeight: '900', color: coupon.isExpired ? '#64748b' : '#881337', letterSpacing: '0.5px', marginBottom: '6px' }}>
                {coupon.code}
              </div>

              {/* Discount Details */}
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} FLAT OFF`}
              </div>

              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '12px' }}>
                {coupon.minSpend > 0 ? `On minimum order of ₹${coupon.minSpend}` : 'No minimum spend'}
                {coupon.validDate && !isNaN(coupon.validDate.getTime()) ? ` • Valid till ${coupon.validDate.toLocaleDateString('en-IN')}` : ''}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <button
                  disabled={coupon.isExpired}
                  onClick={() => handleCopyCode(coupon.code)}
                  style={{
                    flex: 1,
                    background: copiedCode === coupon.code ? '#15803d' : coupon.isExpired ? '#e2e8f0' : '#f8fafc',
                    color: copiedCode === coupon.code ? '#fff' : coupon.isExpired ? '#94a3b8' : '#881337',
                    border: `1px solid ${coupon.isExpired ? '#cbd5e1' : '#881337'}`,
                    padding: '8px',
                    borderRadius: '6px',
                    fontWeight: '800',
                    fontSize: '0.8rem',
                    cursor: coupon.isExpired ? 'not-allowed' : 'pointer'
                  }}
                >
                  {copiedCode === coupon.code ? '✓ Copied!' : '📋 Copy Code'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCoupons;