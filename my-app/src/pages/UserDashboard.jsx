// src/pages/UserDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const UserDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
      <h2>👋 Welcome back, {user?.name || 'Customer'}!</h2>
      <p style={{ color: '#666' }}>Email: {user?.email} | Mobile: {user?.phone}</p>

      <hr style={{ margin: '20px 0', border: '0.5px solid #eee' }} />

      <h3>🛍️ My Sweet Orders</h3>
      <div style={{ padding: '20px', background: '#fafafa', borderRadius: '8px', border: '1px dashed #ccc', textAlign: 'center', marginTop: '15px' }}>
        <p>No orders placed yet!</p>
        <button 
          onClick={() => navigate('/')} 
          style={{ marginTop: '10px', padding: '8px 16px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          Explore Regional Sweets
        </button>
      </div>

      <button 
        onClick={onLogout}
        style={{ marginTop: '30px', padding: '10px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
      >
        Logout
      </button>
    </div>
  );
};

export default UserDashboard;