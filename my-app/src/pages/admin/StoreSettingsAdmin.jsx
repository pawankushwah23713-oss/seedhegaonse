import React, { useState, useEffect, useCallback } from 'react';

// API Base URL Resolver
const getBaseApiUrl = () => {
  const envUrl = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
    ? process.env.REACT_APP_API_URL
    : (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL);

  if (!envUrl) return '/api';
  const clean = envUrl.trim().replace(/\/auth\/?$/, '').replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const API_BASE = getBaseApiUrl();

// Auth Token Helper
const getAuthToken = () => {
  try {
    const directToken = localStorage.getItem('token') ||
                        localStorage.getItem('adminToken') ||
                        localStorage.getItem('authToken');
    if (directToken) return directToken;

    const userObj = localStorage.getItem('user');
    if (userObj) {
      const parsed = JSON.parse(userObj);
      return parsed.token || parsed.jwt || null;
    }
  } catch (err) {
    console.error('Error reading token:', err);
  }
  return null;
};

const StoreSettingsAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Master Settings State
  const [settings, setSettings] = useState({
    codEnabled: true,
    upiEnabled: true,
    upiId: 'seedhegaonse@upi',
    giftBoxEnabled: true,
    giftBoxTitle: 'Gift Box Packaging',
    giftBoxCharge: 50,
    productTaxPercent: 5,
    shippingTaxPercent: 5
  });

  // Settings Load karna
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/delivery/settings`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok && data.settings) {
        const s = data.settings;
        setSettings({
          codEnabled: s.codEnabled !== false,
          upiEnabled: s.upiEnabled !== false,
          upiId: s.upiId || 'seedhegaonse@upi',
          giftBoxEnabled: s.giftBoxEnabled !== false,
          giftBoxTitle: s.giftBoxTitle || 'Gift Box Packaging',
          giftBoxCharge: Number(s.giftBoxCharge ?? 50),
          productTaxPercent: Number(s.productTaxPercent ?? 5),
          shippingTaxPercent: Number(s.shippingTaxPercent ?? 5)
        });
      }
    } catch (err) {
      console.error('Settings load error:', err);
      setMessage({ text: 'सेटिंग्स लोड करने में समस्या आई!', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Settings Save / Update karna
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/delivery/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(settings)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ text: '✓ सेटिंग्स सफलतापूर्वक अपडेट हो गई!', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
      } else {
        setMessage({ text: data.message || 'सेव करने में विफल!', type: 'error' });
      }
    } catch (err) {
      console.error('Save error:', err);
      setMessage({ text: 'सर्वर एरर! दोबारा प्रयास करें।', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Quick Toggle Handler (COD ya UPI ek click me on/off)
  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
        <p style={{ color: '#64748b', fontWeight: 'bold' }}>स्टोर सेटिंग्स लोड हो रही हैं...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '850px', margin: '30px auto', padding: '0 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Header */}
      <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#0f172a', margin: '0 0 6px' }}>
          ⚙️ पेमेंट & स्टोर सेटिंग्स (Admin Panel)
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
          यहाँ से आप Cash on Delivery (COD), UPI और अन्य स्टोर फीचर्स को लाइव ऑन/ऑफ कर सकते हैं।
        </p>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.92rem',
            fontWeight: 'bold',
            background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: message.type === 'success' ? '#15803d' : '#b91c1c',
            border: `1.5px solid ${message.type === 'success' ? '#86efac' : '#fca5a5'}`
          }}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSaveSettings}>

        {/* 💳 1. PAYMENT GATEWAY CONTROLS */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px', marginBottom: '22px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#94191d', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💳</span> पेमेंट मेथड्स (Payment Methods)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* 💵 CASH ON DELIVERY (COD) TOGGLE */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: settings.codEnabled ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${settings.codEnabled ? '#22c55e' : '#cbd5e1'}`, borderRadius: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <strong style={{ fontSize: '1rem', color: '#0f172a' }}>💵 Cash on Delivery (COD)</strong>
                  <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', background: settings.codEnabled ? '#22c55e' : '#ef4444', color: '#fff' }}>
                    {settings.codEnabled ? 'ACTIVE / चालू' : 'INACTIVE / बंद'}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                  बंद करने पर चेकआउट और कार्ट पेज पर ग्राहकों को COD का विकल्प नहीं दिखेगा।
                </div>
              </div>

              {/* Custom Toggle Switch */}
              <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', cursor: 'pointer', flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={settings.codEnabled}
                  onChange={() => toggleSetting('codEnabled')}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: settings.codEnabled ? '#22c55e' : '#cbd5e1',
                    borderRadius: '34px', transition: '.3s'
                  }}
                >
                  <span
                    style={{
                      position: 'absolute', content: '""', height: '18px', width: '18px', left: '4px', bottom: '4px',
                      backgroundColor: 'white', borderRadius: '50%', transition: '.3s',
                      transform: settings.codEnabled ? 'translateX(24px)' : 'translateX(0)'
                    }}
                  />
                </span>
              </label>
            </div>

            {/* 📲 UPI PAYMENT TOGGLE */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: settings.upiEnabled ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${settings.upiEnabled ? '#22c55e' : '#cbd5e1'}`, borderRadius: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <strong style={{ fontSize: '1rem', color: '#0f172a' }}>📲 UPI Instant Pay (GPay / PhonePe / Paytm)</strong>
                  <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', background: settings.upiEnabled ? '#22c55e' : '#ef4444', color: '#fff' }}>
                    {settings.upiEnabled ? 'ACTIVE / चालू' : 'INACTIVE / बंद'}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                  बंद करने पर चेकआउट से UPI और QR कोड का विकल्प हट जाएगा।
                </div>
              </div>

              {/* Custom Toggle Switch */}
              <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', cursor: 'pointer', flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={settings.upiEnabled}
                  onChange={() => toggleSetting('upiEnabled')}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: settings.upiEnabled ? '#22c55e' : '#cbd5e1',
                    borderRadius: '34px', transition: '.3s'
                  }}
                >
                  <span
                    style={{
                      position: 'absolute', content: '""', height: '18px', width: '18px', left: '4px', bottom: '4px',
                      backgroundColor: 'white', borderRadius: '50%', transition: '.3s',
                      transform: settings.upiEnabled ? 'translateX(24px)' : 'translateX(0)'
                    }}
                  />
                </span>
              </label>
            </div>

            {/* UPI ID INPUT */}
            {settings.upiEnabled && (
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Store Official UPI ID (VPA)
                </label>
                <input
                  type="text"
                  required={settings.upiEnabled}
                  value={settings.upiId}
                  onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                  placeholder="e.g. yourstore@upi"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  ग्राहक इसी UPI ID पर पेमेंट करेंगे।
                </div>
              </div>
            )}

          </div>
        </div>

        {/* 🎁 2. GIFT BOX PACKAGING SETTINGS */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px', marginBottom: '22px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#94191d', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎁</span> गिफ्ट बॉक्स पैकेजिंग (Gift Box)
            </h2>

            <label style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.giftBoxEnabled}
                onChange={() => toggleSetting('giftBoxEnabled')}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: settings.giftBoxEnabled ? '#22c55e' : '#cbd5e1', borderRadius: '34px', transition: '.3s' }}>
                <span style={{ position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px', backgroundColor: 'white', borderRadius: '50%', transition: '.3s', transform: settings.giftBoxEnabled ? 'translateX(22px)' : 'translateX(0)' }} />
              </span>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                गिफ्ट बॉक्स का नाम (Title)
              </label>
              <input
                type="text"
                value={settings.giftBoxTitle}
                disabled={!settings.giftBoxEnabled}
                onChange={(e) => setSettings({ ...settings, giftBoxTitle: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: !settings.giftBoxEnabled ? '#f1f5f9' : '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                शुल्क (₹ Extra Charge)
              </label>
              <input
                type="number"
                min="0"
                value={settings.giftBoxCharge}
                disabled={!settings.giftBoxEnabled}
                onChange={(e) => setSettings({ ...settings, giftBoxCharge: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', background: !settings.giftBoxEnabled ? '#f1f5f9' : '#fff' }}
              />
            </div>
          </div>
        </div>

        {/* 📊 3. TAX & GST SETTINGS */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px', marginBottom: '26px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#94191d', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📊</span> टैक्स / GST प्रतिशत (%)
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Product GST (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.productTaxPercent}
                onChange={(e) => setSettings({ ...settings, productTaxPercent: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Shipping GST (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.shippingTaxPercent}
                onChange={(e) => setSettings({ ...settings, shippingTaxPercent: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <button
          type="submit"
          disabled={saving}
          style={{
            width: '100%',
            padding: '14px',
            background: saving ? '#9ca3af' : '#94191d',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '900',
            fontSize: '1.05rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(148, 25, 29, 0.25)',
            transition: 'background 0.2s'
          }}
        >
          {saving ? '⏳ सेटिंग्स सेव हो रही हैं...' : '💾 Save Settings / सेटिंग्स सुरक्षित करें'}
        </button>

      </form>
    </div>
  );
};

export default StoreSettingsAdmin;