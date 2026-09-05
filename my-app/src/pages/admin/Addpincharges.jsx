import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPincodeManager.css';

const API_BASE = 'https://orange-ape-497824.hostingersite.com/api';

const AdminPincodeManager = () => {
  // 📍 Pincode Form State
  const [pincodeInput, setPincodeInput] = useState('');
  const [city, setCity] = useState('');
  const [charge, setCharge] = useState('');
  const [gstPercent, setGstPercent] = useState('18');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ msg: '', type: '' });

  // 📋 Pincode List State
  const [pincodeList, setPincodeList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 🎁 Gift Box & Global Tax Settings State
  const [settings, setSettings] = useState({
    giftBoxEnabled: true,
    giftBoxTitle: 'Gift Box wrap',
    giftBoxCharge: 50,
    productTaxPercent: 5,
    shippingTaxPercent: 5
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState({ msg: '', type: '' });

  // =========================================================
  // 🔄 LOAD DATA
  // =========================================================
  const fetchPincodes = async () => {
    setListLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/delivery/admin/pincodes`);
      if (Array.isArray(res.data?.data)) {
        setPincodeList(res.data.data);
      }
    } catch (err) {
      console.error('Pincode list fetch error:', err);
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

  // =========================================================
  // 📍 SAVE PINCODE (Single as well as Multi Option)
  // =========================================================
  const handleSavePincode = async (e) => {
    e.preventDefault();

    if (!pincodeInput.trim()) {
      setStatus({ msg: '⚠️ Pincode daalna zaroori hai.', type: 'error' });
      return;
    }

    if (charge === '' || isNaN(Number(charge))) {
      setStatus({ msg: '⚠️ Delivery charge sahi se bharein.', type: 'error' });
      return;
    }

    setLoading(true);
    setStatus({ msg: '', type: '' });

    try {
      const cleanPin = pincodeInput.trim();

      // Dono fields bhej rahe hain taaki 400 bad request na aaye
      const payload = {
        pincode: cleanPin,
        pincodeInput: cleanPin,
        city: city.trim(),
        deliveryCharge: Number(charge),
        gstPercent: Number(gstPercent) || 0,
        isServiceable: true
      };

      const res = editingId
        ? await axios.put(`${API_BASE}/delivery/admin/pincode/${editingId}`, payload)
        : await axios.post(`${API_BASE}/delivery/admin/set-pincode`, payload);

      setStatus({
        msg: res.data.message || '✅ Rate successfully save ho gaya!',
        type: 'success'
      });

      handleCancelEdit();
      fetchPincodes();
    } catch (err) {
      console.error('Save error:', err);
      setStatus({
        msg: err.response?.data?.message || 'Server error. Kripya dobara koshish karein.',
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
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setPincodeInput('');
    setCity('');
    setCharge('');
    setGstPercent('18');
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Kya aap pincode ${p.pincode} ko delete karna chahte hain?`)) return;
    setBusyId(p._id);
    try {
      const res = await axios.delete(`${API_BASE}/delivery/admin/pincode/${p._id}`);
      setStatus({ msg: res.data.message || '🗑️ Pincode delete ho gaya', type: 'success' });
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

  // =========================================================
  // 🎁 SAVE GIFT BOX & GLOBAL TAX SETTINGS
  // =========================================================
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
      setSettingsMsg({ msg: res.data.message || '✅ Settings save ho gayi!', type: 'success' });
    } catch (err) {
      setSettingsMsg({
        msg: err.response?.data?.message || 'Settings save karne me dikkat aayi.',
        type: 'error'
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  // Search filter
  const filteredList = pincodeList.filter((p) =>
    (p.pincode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.city || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pincode-admin-wrapper">

      {/* ================= SECTION 1: GIFT BOX & TAX ================= */}
      <div className="admin-box-card">
        <div className="card-header-row">
          <span className="icon-badge">🎁</span>
          <div>
            <h3>Gift Box & Tax Settings</h3>
            <p>Cart ke andar gift wrap aur base GST percentage yahan se control hoga</p>
          </div>
        </div>

        <form onSubmit={handleSettingsSave} className="settings-form">
          <label className={`toggle-label ${settings.giftBoxEnabled ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={settings.giftBoxEnabled}
              onChange={(e) => setSettings({ ...settings, giftBoxEnabled: e.target.checked })}
            />
            <span>🎁 Checkout par Gift Box Wrap ka option show karein</span>
          </label>

          <div className="grid-form-4">
            <div className="input-group">
              <label>Gift Box Name</label>
              <input
                type="text"
                value={settings.giftBoxTitle}
                onChange={(e) => setSettings({ ...settings, giftBoxTitle: e.target.value })}
                placeholder="e.g. Gift Box wrap"
              />
            </div>

            <div className="input-group">
              <label>Gift Box Price (₹)</label>
              <input
                type="number"
                min="0"
                value={settings.giftBoxCharge}
                onChange={(e) => setSettings({ ...settings, giftBoxCharge: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label>Product Tax / GST (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.productTaxPercent}
                onChange={(e) => setSettings({ ...settings, productTaxPercent: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label>Shipping Tax / GST (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.shippingTaxPercent}
                onChange={(e) => setSettings({ ...settings, shippingTaxPercent: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" disabled={settingsLoading} className="btn-primary-blue">
            {settingsLoading ? 'Saving Settings...' : '💾 Save Gift & Tax Settings'}
          </button>

          {settingsMsg.msg && (
            <div className={`status-msg ${settingsMsg.type}`}>
              {settingsMsg.msg}
            </div>
          )}
        </form>
      </div>

      {/* ================= SECTION 2: PIN CODE ADMIN ================= */}
      <div className="admin-box-card pincode-section-card">
        
        {/* Exact Red Heading */}
        <h2 className="red-excel-title">Pin Code Admin</h2>

        {/* Input Form */}
        <form onSubmit={handleSavePincode}>
          <div className="grid-form-4">
            
            {/* 1. Pin Code (Single as well as Multi Option) */}
            <div className="input-group">
              <label className="required-label">
                Pin Code (Single As well as Multi Option Must)
              </label>
              <input
                type="text"
                disabled={Boolean(editingId)}
                placeholder={editingId ? 'Editing 1 pincode' : '110001 or 110001, 110058, 201301'}
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value)}
                required
              />
              <span className="helper-text">
                Ek pincode daalein ya comma (,) dekar multiple daalein.
              </span>
            </div>

            {/* 2. City Name */}
            <div className="input-group">
              <label>City Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Delhi, Noida"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            {/* 3. Delivery Charge Pin Code (Pin Base) Rs. */}
            <div className="input-group">
              <label className="required-label">
                Delivery Charge Pin Code (Pin Base) Rs.
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 100, 150, 250"
                value={charge}
                onChange={(e) => setCharge(e.target.value)}
                required
              />
            </div>

            {/* 4. GST % */}
            <div className="input-group">
              <label className="required-label">GST %</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="e.g. 18 or 5"
                value={gstPercent}
                onChange={(e) => setGstPercent(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="button-group-row">
            <button type="submit" disabled={loading} className="btn-primary-red">
              {loading ? 'Saving...' : editingId ? '💾 Update Rate' : '💾 Save / Set Delivery Rate'}
            </button>

            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="btn-cancel">
                ✕ Cancel Edit
              </button>
            )}
          </div>

          {status.msg && (
            <div className={`status-msg ${status.type}`}>
              {status.msg}
            </div>
          )}
        </form>

        {/* 🔴 RED NOTE EXACTLY AS IN EXCEL SHEET */}
        <div className="red-excel-banner">
          Our Buyer can be from PAN India but Delivery only on Pin Code which We Put Up
        </div>

        {/* Table List View */}
        <div className="table-container-header">
          <h4>Configured Pincodes ({filteredList.length})</h4>
          <input
            type="text"
            placeholder="🔍 Search Pincode or City..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {listLoading ? (
          <div className="empty-state">Loading pincodes...</div>
        ) : filteredList.length === 0 ? (
          <div className="empty-state">No pincode found in the database.</div>
        ) : (
          <div className="table-responsive">
            <table className="pincode-data-table">
              <thead>
                <tr>
                  <th>Pin Code</th>
                  <th>City</th>
                  <th>Delivery Charge (Rs.)</th>
                  <th>GST %</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((p) => {
                  const off = p.isServiceable === false;
                  return (
                    <tr key={p._id} className={off ? 'row-off' : ''}>
                      <td className="font-bold">{p.pincode}</td>
                      <td className="text-muted">{p.city || '-'}</td>
                      <td className="font-bold text-blue">₹{p.deliveryCharge}</td>
                      <td className="font-bold text-green">{p.gstPercent ?? 18}%</td>
                      <td>
                        <span className={`status-pill ${off ? 'pill-off' : 'pill-on'}`}>
                          {off ? 'OFF' : 'Active'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleToggleServiceable(p)}
                            disabled={busyId === p._id}
                            className={`btn-toggle ${off ? 'btn-toggle-on' : 'btn-toggle-off'}`}
                          >
                            {busyId === p._id ? '...' : off ? 'ON' : 'OFF'}
                          </button>
                          <button onClick={() => handleEditClick(p)} className="btn-edit">
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            disabled={busyId === p._id}
                            className="btn-delete"
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
  );
};

export default AdminPincodeManager;