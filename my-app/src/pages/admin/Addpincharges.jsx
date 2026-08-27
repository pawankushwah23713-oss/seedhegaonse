import React, { useState } from 'react';
import axios from 'axios';
import './AdminPincodeManager.css';

const AdminPincodeManager = () => {
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [charge, setCharge] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ msg: '', type: '' });

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ msg: '', type: '' });

    try {
      // ✅ Sahi URL path: '/api/delivery/admin/set-pincode'
      const res = await axios.post('https://seedhegaonse-1.onrender.com/api/delivery/admin/set-pincode', {
        city: city.trim(),
        pincode: pincode.trim(),
        deliveryCharge: Number(charge),
        isServiceable: true
      });

      setStatus({ 
        msg: res.data.message || 'Delivery charge saved successfully!', 
        type: 'success' 
      });
      setCity('');
      setPincode('');
      setCharge('');
    } catch (err) {
      setStatus({
        msg: err.response?.data?.message || 'Error saving pincode. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pincode-admin-container">
      <div className="pincode-card">
        <div className="pincode-card-header">
          <div className="icon-badge">📍</div>
          <h3>Pincode Delivery Manager</h3>
          <p>Set or update delivery charges based on user pincode</p>
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
            {loading ? 'Saving Rate...' : '💾 Save / Update Rate'}
          </button>

          {status.msg && (
            <div className={`feedback-banner ${status.type}`}>
              {status.type === 'success' ? '✓' : '⚠️'} {status.msg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminPincodeManager;