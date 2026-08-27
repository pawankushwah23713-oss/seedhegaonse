import React, { useState } from 'react';
import axios from 'axios';

const AdminPincodeManager = () => {
  const [pincode, setPincode] = useState('');
  const [charge, setCharge] = useState('');
  const [msg, setMsg] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://seedhegaonse-1.onrender.com/api/admin/set-pincode', {
        pincode,
        deliveryCharge: Number(charge),
        isServiceable: true
      });
      setMsg(res.data.message);
      setPincode('');
      setCharge('');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error saving pincode');
    }
  };

  return (
    <form onSubmit={handleSave}>
      <h3>Set Delivery Charge by Pincode</h3>
      <input
        type="text"
        placeholder="Pincode (e.g. 110001)"
        value={pincode}
        onChange={(e) => setPincode(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Delivery Charge (₹)"
        value={charge}
        onChange={(e) => setCharge(e.target.value)}
        required
      />
      <button type="submit">Save / Update Charge</button>
      {msg && <p>{msg}</p>}
    </form>
  );
};

export default AdminPincodeManager;