import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPincodeManager.css';

const API_BASE = 'https://seedhegaonse-1.onrender.com/api';

const AdminPincodeManager = () => {
  // 📍 Pincode form
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [charge, setCharge] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ msg: '', type: '' });

  // 📋 Pincode list
  const [pincodeList, setPincodeList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // 🎁 Store settings (Gift Box + Tax)
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
  // LOADERS
  // ==========================================
  const fetchPincodes = async () => {
    setListLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/delivery/admin/pincodes`);
      if (Array.isArray(res.data?.data)) setPincodeList(res.data.data);
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
  // 📍 PINCODE SAVE / UPDATE
  // ==========================================
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ msg: '', type: '' });

    try {
      const payload = {
        city: city.trim(),
        pincode: pincode.trim(),
        deliveryCharge: Number(charge),
        isServiceable: true
      };

      const res = editingId
        ? await axios.put(`${API_BASE}/delivery/admin/pincode/${editingId}`, payload)
        : await axios.post(`${API_BASE}/delivery/admin/set-pincode`, payload);

      setStatus({
        msg: res.data.message || 'Delivery charge saved successfully!',
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
    setCity(p.city || '');
    setPincode(p.pincode || '');
    setCharge(String(p.deliveryCharge ?? ''));
    setStatus({ msg: '', type: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCity('');
    setPincode('');
    setCharge('');
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete pincode ${p.pincode}?`)) return;
    setBusyId(p._id);
    try {
      const res = await axios.delete(`${API_BASE}/delivery/admin/pincode/${p._id}`);
      setStatus({ msg: res.data.message || '🗑️ Deleted', type: 'success' });
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
  // 🎁 SETTINGS SAVE
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
      setSettingsMsg({ msg: res.data.message || '✅ Saved!', type: 'success' });
    } catch (err) {
      setSettingsMsg({
        msg: err.response?.data?.message || 'Could not save settings. Please try again.',
        type: 'error'
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  const setSettingField = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="pincode-admin-container">

      {/* ================= 🎁 GIFT BOX + TAX SETTINGS ================= */}
      <div className="pincode-card" style={{ marginBottom: '24px' }}>
        <div className="pincode-card-header">
          <div className="icon-badge">🎁</div>
          <h3>Gift Box & Tax Settings</h3>
          <p>Set the gift packaging name/price and GST percentage here</p>
        </div>

        <form onSubmit={handleSettingsSave} className="pincode-form">

          {/* Gift Box ON / OFF */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: settings.giftBoxEnabled ? '#f0fdf4' : '#f8fafc',
              border: `1.5px solid ${settings.giftBoxEnabled ? '#bbf7d0' : '#e2e8f0'}`,
              cursor: 'pointer',
              marginBottom: '14px'
            }}
          >
            <input
              type="checkbox"
              checked={settings.giftBoxEnabled}
              onChange={(e) => setSettingField('giftBoxEnabled', e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#15803d', cursor: 'pointer' }}
            />
            <span style={{ fontWeight: 700, color: settings.giftBoxEnabled ? '#047857' : '#64748b', fontSize: '0.9rem' }}>
              🎁 Show Gift Box option in cart
            </span>
          </label>

          <div className="form-group">
            <label>Gift Box Name</label>
            <input
              type="text"
              className="pincode-input"
              placeholder="e.g. Premium Gift Box wrap"
              value={settings.giftBoxTitle}
              onChange={(e) => setSettingField('giftBoxTitle', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Gift Box Price (₹) <span>*</span></label>
            <input
              type="number"
              min="0"
              className="pincode-input"
              placeholder="e.g. 50"
              value={settings.giftBoxCharge}
              onChange={(e) => setSettingField('giftBoxCharge', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Product Tax / GST (%) <span>*</span></label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              className="pincode-input"
              placeholder="e.g. 5"
              value={settings.productTaxPercent}
              onChange={(e) => setSettingField('productTaxPercent', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Shipping Tax / GST (%) <span>*</span></label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              className="pincode-input"
              placeholder="e.g. 5"
              value={settings.shippingTaxPercent}
              onChange={(e) => setSettingField('shippingTaxPercent', e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-save-pincode" disabled={settingsLoading}>
            {settingsLoading ? 'Saving Settings...' : '💾 Save Gift & Tax Settings'}
          </button>

          {settingsMsg.msg && (
            <div className={`feedback-banner ${settingsMsg.type}`}>
              {settingsMsg.type === 'success' ? '✓' : '⚠️'} {settingsMsg.msg}
            </div>
          )}

          <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '10px', lineHeight: 1.5 }}>
            These values will be automatically applied in the cart — both the gift box price and GST will be controlled from here.
          </p>
        </form>
      </div>

      {/* ================= 📍 PINCODE FORM ================= */}
      <div className="pincode-card">
        <div className="pincode-card-header">
          <div className="icon-badge">📍</div>
          <h3>{editingId ? 'Edit Pincode Delivery Rate' : 'Pincode Delivery Manager'}</h3>
          <p>{editingId ? 'Update the details of the selected pincode' : 'Set or update delivery charges based on user pincode'}</p>
        </div>

        <form onSubmit={handleSave} className="pincode-form">
          <div className="form-group">
            <label>City Name</label>
            <input
              type="text"
              className="pincode-input"
              placeholder="e.g. Noida, Delhi, Lucknow"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Pincode <span>*</span></label>
            <input
              type="text"
              maxLength="6"
              className="pincode-input"
              placeholder="e.g. 201301"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
              required
            />
          </div>

          <div className="form-group">
            <label>Delivery Charge (₹) <span>*</span></label>
            <input
              type="number"
              min="0"
              className="pincode-input"
              placeholder="e.g. 50"
              value={charge}
              onChange={(e) => setCharge(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-save-pincode" disabled={loading}>
            {loading ? 'Saving Rate...' : editingId ? '💾 Update Rate' : '💾 Save / Update Rate'}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '11px',
                background: '#e2e8f0',
                color: '#334155',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✕ Cancel Edit
            </button>
          )}

          {status.msg && (
            <div className={`feedback-banner ${status.type}`}>
              {status.type === 'success' ? '✓' : '⚠️'} {status.msg}
            </div>
          )}
        </form>
      </div>

      {/* ================= 📋 PINCODE LIST (Edit / Delete) ================= */}
      <div className="pincode-card" style={{ marginTop: '24px' }}>
        <div className="pincode-card-header">
          <div className="icon-badge">📋</div>
          <h3>All Serviceable Pincodes ({pincodeList.length})</h3>
          <p>You can edit, turn on/off, or delete any pincode from here</p>
        </div>

        <div style={{ padding: '4px 0 8px' }}>
          {listLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
              Loading pincodes...
            </div>
          ) : pincodeList.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
              No pincode has been added yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pincodeList.map((p) => {
                const off = p.isServiceable === false;
                return (
                  <div
                    key={p._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: off ? '#fff8f8' : '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderLeft: `5px solid ${off ? '#dc2626' : '#15803d'}`
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                        {p.pincode}
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginLeft: '8px' }}>
                          {p.city || 'City not set'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                          ₹{Number(p.deliveryCharge || 0).toFixed(2)} delivery
                        </span>
                        <span style={{ background: off ? '#fee2e2' : '#dcfce7', color: off ? '#b91c1c' : '#15803d', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                          {off ? '⛔ Delivery OFF' : '✅ Serviceable'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleToggleServiceable(p)}
                        disabled={busyId === p._id}
                        style={{
                          background: off ? '#15803d' : '#f59e0b',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          cursor: busyId === p._id ? 'wait' : 'pointer',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {busyId === p._id ? '...' : off ? '✅ Turn ON' : '⛔ Turn OFF'}
                      </button>

                      <button
                        onClick={() => handleEditClick(p)}
                        style={{
                          background: '#0284c7',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={() => handleDelete(p)}
                        disabled={busyId === p._id}
                        style={{
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          cursor: busyId === p._id ? 'wait' : 'pointer',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPincodeManager;