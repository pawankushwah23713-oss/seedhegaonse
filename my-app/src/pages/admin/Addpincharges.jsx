import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPincodeManager.css';

const API_BASE = 'https://orange-ape-497824.hostingersite.com/api';

const AdminPincodeManager = () => {
  // 📍 Pincode Form State
  const [pincodeInput, setPincodeInput] = useState(''); // Single or Multi (e.g. 110001, 110058)
  const [city, setCity] = useState('');
  const [charge, setCharge] = useState('');
  const [gstPercent, setGstPercent] = useState('18'); // Default 18%
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ msg: '', type: '' });

  // 📋 Pincode List State
  const [pincodeList, setPincodeList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 🎁 Gift Box & Global Tax Settings
  const [settings, setSettings] = useState({
    giftBoxEnabled: true,
    giftBoxTitle: 'Gift Box wrap',
    giftBoxCharge: 50,
    productTaxPercent: 5,
    shippingTaxPercent: 5
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState({ msg: '', type: '' });

  // ==========================================
  // 🔄 LOAD DATA
  // ==========================================
  const fetchPincodes = async () => {
    setListLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/delivery/admin/pincodes`);
      if (Array.isArray(res.data?.data)) {
        setPincodeList(res.data.data);
      }
    } catch (err) {
      console.error('Pincode list error:', err);
    } finally {
      setListLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/delivery/settings`);
      if (res.data?.settings) {
        const s = res.data.settings;
        setSettings({
          giftBoxEnabled: s.giftBoxEnabled !== false,
          giftBoxTitle: s.giftBoxTitle || 'Gift Box wrap',
          giftBoxCharge: s.giftBoxCharge ?? 50,
          productTaxPercent: s.productTaxPercent ?? 5,
          shippingTaxPercent: s.shippingTaxPercent ?? 5
        });
      }
    } catch (err) {
      console.error('Settings load error:', err);
    }
  };

  useEffect(() => {
    fetchPincodes();
    fetchSettings();
  }, []);

  // ==========================================
  // 📍 SAVE PINCODE (Single / Multi)
  // ==========================================
  const handleSavePincode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ msg: '', type: '' });

    try {
      const payload = {
        pincodeInput: pincodeInput.trim(),
        city: city.trim(),
        deliveryCharge: Number(charge),
        gstPercent: Number(gstPercent) || 0,
        isServiceable: true
      };

      const res = editingId
        ? await axios.put(`${API_BASE}/delivery/admin/pincode/${editingId}`, payload)
        : await axios.post(`${API_BASE}/delivery/admin/set-pincode`, payload);

      setStatus({
        msg: res.data.message || 'Pincode rate(s) saved successfully!',
        type: 'success'
      });

      handleCancelEdit();
      fetchPincodes();
    } catch (err) {
      setStatus({
        msg: err.response?.data?.message || 'Error saving pincode. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (p) => {
    setEditingId(p._id);
    setPincodeInput(p.pincode || '');
    setCity(p.city || '');
    setCharge(String(p.deliveryCharge ?? ''));
    setGstPercent(String(p.gstPercent ?? '18'));
    setStatus({ msg: '', type: '' });
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setPincodeInput('');
    setCity('');
    setCharge('');
    setGstPercent('18');
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete pincode ${p.pincode}?`)) return;
    setBusyId(p._id);
    try {
      const res = await axios.delete(`${API_BASE}/delivery/admin/pincode/${p._id}`);
      setStatus({ msg: res.data.message || '🗑️ Deleted successfully', type: 'success' });
      setPincodeList((prev) => prev.filter((x) => x._id !== p._id));
      if (editingId === p._id) handleCancelEdit();
    } catch (err) {
      setStatus({ msg: err.response?.data?.message || 'Delete failed', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleServiceable = async (p) => {
    setBusyId(p._id);
    try {
      const res = await axios.patch(`${API_BASE}/delivery/admin/pincode/${p._id}/toggle`);
      setStatus({ msg: res.data.message, type: 'success' });
      setPincodeList((prev) =>
        prev.map((x) => (x._id === p._id ? { ...x, isServiceable: !x.isServiceable } : x))
      );
    } catch (err) {
      setStatus({ msg: err.response?.data?.message || 'Update failed', type: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  // ==========================================
  // 🎁 SAVE GIFT BOX & GLOBAL TAX SETTINGS
  // ==========================================
  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsMsg({ msg: '', type: '' });

    try {
      const res = await axios.put(`${API_BASE}/delivery/settings`, {
        giftBoxEnabled: settings.giftBoxEnabled,
        giftBoxTitle: settings.giftBoxTitle,
        giftBoxCharge: Number(settings.giftBoxCharge) || 0,
        productTaxPercent: Number(settings.productTaxPercent) || 0,
        shippingTaxPercent: Number(settings.shippingTaxPercent) || 0
      });
      setSettingsMsg({ msg: res.data.message || '✅ Settings Saved!', type: 'success' });
    } catch (err) {
      setSettingsMsg({
        msg: err.response?.data?.message || 'Failed to save settings.',
        type: 'error'
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  // Filter list by search
  const filteredList = pincodeList.filter((p) =>
    (p.pincode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.city || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pincode-admin-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>

      {/* ================= 🎁 SECTION 1: GIFT BOX & GLOBAL TAX ================= */}
      <div className="pincode-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '15px' }}>
          <span style={{ fontSize: '1.5rem' }}>🎁</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Free Gift & Global Tax Settings</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Configure gift box wrap option and base cart taxes</p>
          </div>
        </div>

        <form onSubmit={handleSettingsSave}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', background: settings.giftBoxEnabled ? '#f0fdf4' : '#f8fafc', border: `1px solid ${settings.giftBoxEnabled ? '#86efac' : '#cbd5e1'}`, cursor: 'pointer', marginBottom: '15px' }}>
            <input
              type="checkbox"
              checked={settings.giftBoxEnabled}
              onChange={(e) => setSettings({ ...settings, giftBoxEnabled: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
            />
            <span style={{ fontWeight: 600, color: settings.giftBoxEnabled ? '#15803d' : '#64748b', fontSize: '0.9rem' }}>
              🎁 Enable Gift Box wrap option on Checkout
            </span>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Gift Box Name</label>
              <input
                type="text"
                className="pincode-input"
                value={settings.giftBoxTitle}
                onChange={(e) => setSettings({ ...settings, giftBoxTitle: e.target.value })}
                placeholder="e.g. Gift Box wrap"
                style={{ width: '100%', padding: '8px 10px', marginTop: '4px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Gift Box Price (₹)</label>
              <input
                type="number"
                min="0"
                className="pincode-input"
                value={settings.giftBoxCharge}
                onChange={(e) => setSettings({ ...settings, giftBoxCharge: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', marginTop: '4px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Product Tax / GST (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="pincode-input"
                value={settings.productTaxPercent}
                onChange={(e) => setSettings({ ...settings, productTaxPercent: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', marginTop: '4px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Shipping Tax / GST (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="pincode-input"
                value={settings.shippingTaxPercent}
                onChange={(e) => setSettings({ ...settings, shippingTaxPercent: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', marginTop: '4px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={settingsLoading}
            style={{ marginTop: '15px', background: '#0284c7', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
          >
            {settingsLoading ? 'Saving...' : '💾 Save Gift & Tax Settings'}
          </button>

          {settingsMsg.msg && (
            <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', background: settingsMsg.type === 'success' ? '#dcfce7' : '#fee2e2', color: settingsMsg.type === 'success' ? '#15803d' : '#b91c1c' }}>
              {settingsMsg.msg}
            </div>
          )}
        </form>
      </div>

      {/* ================= 📍 SECTION 2: PIN CODE ADMIN (Exact as Excel) ================= */}
      <div className="pincode-card" style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '2px solid #b91c1c', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
        
        {/* Title */}
        <h2 style={{ textAlign: 'center', color: '#c00000', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 16px 0', letterSpacing: '0.5px' }}>
          Pin Code Admin
        </h2>

        {/* Form */}
        <form onSubmit={handleSavePincode}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            
            {/* 1. Pin Code (Single as well as Multi) */}
            <div>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                Pin Code (Single As well as Multi Option Must) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                disabled={Boolean(editingId)}
                placeholder={editingId ? 'Editing single pin' : 'e.g. 110001 or 110001, 110058, 201301'}
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', marginTop: '6px', border: '1.5px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }}
              />
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Comma (,) ya space dekar ek saath multiple pincodes daal sakte hain.
              </span>
            </div>

            {/* 2. City Name */}
            <div>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                City Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Delhi, Noida"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ width: '100%', padding: '10px', marginTop: '6px', border: '1.5px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }}
              />
            </div>

            {/* 3. Delivery Charge (Pin Base) Rs. */}
            <div>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                Delivery Charge Pin Code (Pin Base) Rs. <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 100, 150, 250"
                value={charge}
                onChange={(e) => setCharge(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', marginTop: '6px', border: '1.5px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }}
              />
            </div>

            {/* 4. GST % */}
            <div>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                GST % <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="e.g. 18 or 5"
                value={gstPercent}
                onChange={(e) => setGstPercent(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', marginTop: '6px', border: '1.5px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{ flex: 1, background: '#c00000', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}
            >
              {loading ? 'Saving...' : editingId ? '💾 Update Rate' : '💾 Add Pincode(s) Delivery Rate'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{ background: '#64748b', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
            )}
          </div>

          {status.msg && (
            <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', textAlign: 'center', fontWeight: 600, fontSize: '0.88rem', background: status.type === 'success' ? '#dcfce7' : '#fee2e2', color: status.type === 'success' ? '#15803d' : '#b91c1c' }}>
              {status.msg}
            </div>
          )}
        </form>

        {/* 🔴 RED NOTE BANNER EXACTLY AS IN EXCEL SHEET */}
        <div style={{ marginTop: '22px', padding: '12px', textAlign: 'center', color: '#c00000', fontWeight: 800, fontSize: '1rem', borderTop: '1px solid #fecaca', borderBottom: '1px solid #fecaca', background: '#fff5f5' }}>
          Our Buyer can be from PAN India but Delivery only on Pin Code which We Put Up
        </div>

        {/* ================= 📋 TABLE (Pin Code | Delivery Charge | GST %) ================= */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem' }}>
              Configured Pincodes ({filteredList.length})
            </h4>
            <input
              type="text"
              placeholder="🔍 Search Pincode or City..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '220px' }}
            />
          </div>

          {listLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading pincodes...</div>
          ) : filteredList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No pincode configured yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>Pin Code</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>City</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>Delivery Charge Rs.</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>GST %</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>Status</th>
                    <th style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((p) => {
                    const off = p.isServiceable === false;
                    return (
                      <tr key={p._id} style={{ borderBottom: '1px solid #e2e8f0', background: off ? '#fef2f2' : '#ffffff' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>
                          {p.pincode}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#64748b' }}>
                          {p.city || '-'}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0284c7' }}>
                          ₹{p.deliveryCharge}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#15803d' }}>
                          {p.gstPercent ?? 18}%
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: off ? '#fee2e2' : '#dcfce7', color: off ? '#b91c1c' : '#15803d' }}>
                            {off ? 'OFF' : 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => handleToggleServiceable(p)}
                              disabled={busyId === p._id}
                              style={{ background: off ? '#16a34a' : '#f59e0b', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                            >
                              {off ? 'ON' : 'OFF'}
                            </button>
                            <button
                              onClick={() => handleEditClick(p)}
                              style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              disabled={busyId === p._id}
                              style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPincodeManager;