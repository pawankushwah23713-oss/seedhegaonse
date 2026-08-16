// src/pages/admin/AdminOverview.jsx
import React, { useState, useEffect } from 'react';
import { socket } from '../../socket';

const AdminOverview = () => {
  const [onlineUsers, setOnlineUsers] = useState(1);

  useEffect(() => {
    socket.on('online_users_count', (count) => {
      setOnlineUsers(count);
    });

    return () => socket.off('online_users_count');
  }, []);

  return (
    <div>
      <h1 className="page-heading">📊 Store Analytics & Overview</h1>
      <div className="admin-stats-grid">
        {/* Real-time Online Users Card */}
        <div className="stat-card" style={{ borderLeft: '4px solid #22c55e' }}>
          <h4>🟢 Live Active Shoppers</h4>
          <p className="stat-num stat-green">{onlineUsers} Online</p>
          <span className="stat-subtitle">Browsing sweets right now</span>
        </div>

        <div className="stat-card">
          <h4>Total Revenue</h4>
          <p className="stat-num stat-amber">₹48,950</p>
          <span className="stat-subtitle">+12% from last week</span>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;