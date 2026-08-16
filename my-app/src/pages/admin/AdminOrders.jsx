// src/pages/admin/AdminOrders.jsx
import React, { useState, useEffect } from 'react';
import { socket } from '../../socket';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'http://localhost:5000/api');

// 🔔 Clean Notification Chime (Web Audio API - No MP3 file needed)
const playOrderChime = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (err) {
    console.log('Audio autoplay waiting for user interaction');
  }
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveAlert, setLiveAlert] = useState(null);

  // 1. Fetch Orders on Initial Load
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setOrders(data);
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // 🟢 REAL-TIME LISTENER: Jab Customer Naya Order Kare
    socket.on('new_order', (newOrder) => {
      playOrderChime();
      setLiveAlert(`🔔 New Order from ${newOrder.customer?.name || 'Customer'} (₹${newOrder.totalAmount})!`);
      setTimeout(() => setLiveAlert(null), 5000);

      // Naya order table ke top par add hoga
      setOrders((prev) => [newOrder, ...prev]);
    });

    // 🟢 REAL-TIME LISTENER: Jab Order Status Update Ho
    socket.on('order_status_updated', (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
      );
    });

    return () => {
      socket.off('new_order');
      socket.off('order_status_updated');
    };
  }, []);

  // 2. Admin Changes Order Status Dropdown
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ orderStatus: newStatus })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Status update failed');
      }

      // Local state update
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-heading" style={{ margin: 0 }}>📦 Live Customer Orders</h1>
        <span style={{ background: '#ecfdf5', color: '#059669', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
          ⚡ Socket Connected
        </span>
      </div>

      {/* Live Order Alert Popup */}
      {liveAlert && (
        <div style={{
          background: '#d97706',
          color: '#ffffff',
          padding: '14px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontWeight: 600,
          boxShadow: '0 6px 16px rgba(217, 119, 6, 0.35)'
        }}>
          {liveAlert}
        </div>
      )}

      <div className="admin-content-card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Loading Orders...</p>
        ) : orders.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No customer orders placed yet.</p>
        ) : (
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer & Delivery Address</th>
                <th>Items Ordered</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Live Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td><b>#{o._id.slice(-6).toUpperCase()}</b></td>
                  <td>
                    <strong>{o.customer?.name}</strong> ({o.customer?.phone})<br />
                    <small style={{ color: '#64748b' }}>
                      {o.customer?.address}, {o.customer?.city} - {o.customer?.pincode}
                    </small>
                  </td>
                  <td>
                    {o.orderItems?.map((item, idx) => (
                      <div key={idx} style={{ fontSize: '0.84rem' }}>
                        {item.name} × {item.qty}
                      </div>
                    ))}
                  </td>
                  <td><b>₹{Number(o.totalAmount).toFixed(2)}</b></td>
                  <td><span className="badge badge-pending">💵 {o.paymentMethod}</span></td>
                  <td>
                    <select
                      value={o.orderStatus}
                      onChange={(e) => handleStatusChange(o._id, e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Placed">Placed</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;