// src/pages/AdminDashboard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css'; // Optional CSS

const AdminDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleAdminLogout = () => {
    onLogout();
    navigate('/auth');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f6f9' }}>
      {/* Admin Sidebar */}
      <div style={{ width: '260px', background: '#1e293b', color: '#fff', padding: '20px' }}>
        <h2 style={{ fontSize: '1.3rem', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
          👑 Admin Panel
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Logged in as: <b>{user?.name || 'Admin'}</b></p>
        
        <nav style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={() => setActiveTab('overview')} 
            style={{ padding: '10px', background: activeTab === 'overview' ? '#3b82f6' : 'transparent', color: '#fff', border: 'none', textAlign: 'left', borderRadius: '6px', cursor: 'pointer' }}
          >
            📊 Dashboard Overview
          </button>
          <button 
            onClick={() => setActiveTab('orders')} 
            style={{ padding: '10px', background: activeTab === 'orders' ? '#3b82f6' : 'transparent', color: '#fff', border: 'none', textAlign: 'left', borderRadius: '6px', cursor: 'pointer' }}
          >
            📦 Manage Orders
          </button>
          <button 
            onClick={() => setActiveTab('products')} 
            style={{ padding: '10px', background: activeTab === 'products' ? '#3b82f6' : 'transparent', color: '#fff', border: 'none', textAlign: 'left', borderRadius: '6px', cursor: 'pointer' }}
          >
            🍬 Add / Manage Sweets
          </button>
          <button 
            onClick={() => navigate('/')} 
            style={{ padding: '10px', background: '#475569', color: '#fff', border: 'none', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', marginTop: '20px' }}
          >
            🌐 View Live Store
          </button>
          <button 
            onClick={handleAdminLogout} 
            style={{ padding: '10px', background: '#ef4444', color: '#fff', border: 'none', textAlign: 'left', borderRadius: '6px', cursor: 'pointer', marginTop: '10px' }}
          >
            🚪 Logout
          </button>
        </nav>
      </div>

      {/* Main Admin Content */}
      <div style={{ flex: 1, padding: '30px' }}>
        {activeTab === 'overview' && (
          <div>
            <h1>Dashboard Overview</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h3>Total Revenue</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>₹45,200</p>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h3>Total Orders</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>128</p>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h3>Total Sweets</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>24 Items</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h1>Customer Orders</h1>
            <p>List of all incoming sweet orders from villages and cities.</p>
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <h1>Manage Products</h1>
            <button style={{ padding: '10px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
              + Add New Sweet Item
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;