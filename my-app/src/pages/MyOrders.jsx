// src/pages/MyOrders.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket'; // 🟢 Socket.io Instance
import './MyOrders.css';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'http://localhost:5000/api');

const SERVER_HOST = API_BASE.replace('/api', '');

// Image URL Helper
const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://placehold.co/60x60?text=Sweet';
  if (imagePath.startsWith('http')) return imagePath;
  const clean = imagePath.replace(/\\/g, '/');
  return `${SERVER_HOST}${clean.startsWith('/') ? clean : `/${clean}`}`;
};

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveToast, setLiveToast] = useState('');

  // Status Step Helper (1: Placed, 2: Confirmed, 3: Dispatched, 4: Delivered)
  const getStepIndex = (status) => {
    switch (status) {
      case 'Placed': return 1;
      case 'Confirmed': return 2;
      case 'Dispatched': return 3;
      case 'Delivered': return 4;
      case 'Cancelled': return -1;
      default: return 1;
    }
  };

  // 1. Initial Load of Customer Orders
  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/auth');
          return;
        }

        const res = await fetch(`${API_BASE}/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok && Array.isArray(data)) {
          setOrders(data);
        } else {
          throw new Error(data.message || 'Failed to load your orders.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrders();

    // 🟢 2. REAL-TIME SOCKET LISTENER: Live Status Change Sync
    socket.on('order_status_updated', (updatedOrder) => {
      setOrders((prevOrders) => {
        // Check agar updated order isi customer ka hai
        const exists = prevOrders.some((o) => o._id === updatedOrder._id);
        if (exists) {
          // Live Alert Notification Screen par dikhana
          setLiveToast(`⚡ Order #${updatedOrder._id.slice(-6).toUpperCase()} status updated to: ${updatedOrder.orderStatus}`);
          setTimeout(() => setLiveToast(''), 5000);

          return prevOrders.map((o) => (o._id === updatedOrder._id ? updatedOrder : o));
        }
        return prevOrders;
      });
    });

    return () => {
      socket.off('order_status_updated');
    };
  }, [navigate]);

  return (
    <div className="my-orders-container">
      {/* ── HEADER ── */}
      <div className="my-orders-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>🛍️ My Sweet Orders</h1>
            <p>Track your traditional sweet orders with live delivery status</p>
          </div>
          <span style={{ background: '#ecfdf5', color: '#059669', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
            ⚡ Live Tracker Active
          </span>
        </div>
      </div>

      {/* 🟢 Real-Time Live Status Toast Banner */}
      {liveToast && (
        <div style={{
          background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
          color: '#ffffff',
          padding: '14px 20px',
          borderRadius: '10px',
          marginBottom: '24px',
          fontWeight: 600,
          boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
          animation: 'fadeIn 0.3s ease'
        }}>
          {liveToast}
        </div>
      )}

      {/* ── CONTENT BODY ── */}
      {loading ? (
        <div className="orders-loading">
          <div className="loading-spinner"></div>
          <p>Connecting to live tracking...</p>
        </div>
      ) : error ? (
        <div className="orders-error-banner" style={{ padding: '16px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px' }}>
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="orders-empty-state">
          <div style={{ fontSize: '3.5rem' }}>📦</div>
          <h3>You haven't placed any orders yet!</h3>
          <p>Order pure Desi Ghee regional sweets straight from village artisans.</p>
          <button className="explore-sweets-btn" onClick={() => navigate('/')}>
            Explore Sweets
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const step = getStepIndex(order.orderStatus);
            const isCancelled = order.orderStatus === 'Cancelled';

            return (
              <div key={order._id} className="order-card">
                {/* ── CARD TOP BAR ── */}
                <div className="order-card-top">
                  <div>
                    <span className="order-id">Order #{order._id.slice(-6).toUpperCase()}</span>
                    <span className="order-date">
                      Placed on: {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <span className={`status-pill status-${(order.orderStatus || 'placed').toLowerCase()}`}>
                    ● {order.orderStatus}
                  </span>
                </div>

                {/* ── 🟢 REAL-TIME LIVE STEP TRACKER ── */}
                {!isCancelled ? (
                  <div className="order-tracker">
                    <div className={`track-step ${step >= 1 ? 'completed' : ''}`}>
                      <div className="step-dot">1</div>
                      <span>Placed</span>
                    </div>
                    <div className={`track-line ${step >= 2 ? 'completed' : ''}`}></div>

                    <div className={`track-step ${step >= 2 ? 'completed' : ''}`}>
                      <div className="step-dot">2</div>
                      <span>Confirmed</span>
                    </div>
                    <div className={`track-line ${step >= 3 ? 'completed' : ''}`}></div>

                    <div className={`track-step ${step >= 3 ? 'completed' : ''}`}>
                      <div className="step-dot">3</div>
                      <span>Dispatched</span>
                    </div>
                    <div className={`track-line ${step >= 4 ? 'completed' : ''}`}></div>

                    <div className={`track-step ${step >= 4 ? 'completed' : ''}`}>
                      <div className="step-dot">4</div>
                      <span>Delivered</span>
                    </div>
                  </div>
                ) : (
                  <div className="cancelled-banner" style={{ padding: '12px 18px', background: '#fee2e2', color: '#dc2626', fontSize: '0.9rem' }}>
                    ⚠️ This order was cancelled. If you have any questions, please contact our support team.
                  </div>
                )}

                {/* ── ITEMS ORDERED ── */}
                <div className="order-items-list">
                  {order.orderItems?.map((item, idx) => (
                    <div key={idx} className="order-item-row">
                      <img
                        src={getImageUrl(item.img)}
                        alt={item.name}
                        crossOrigin="anonymous"
                        onError={(e) => { e.target.src = 'https://placehold.co/50x50?text=Sweet'; }}
                      />
                      <div className="item-details">
                        <h4>{item.name}</h4>
                        <span className="item-qty-price">
                          Qty: <b>{item.qty}</b> × ₹{item.price}
                        </span>
                      </div>
                      <div className="item-total">
                        ₹{(item.qty * item.price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── FOOTER (ADDRESS & TOTAL) ── */}
                <div className="order-card-bottom">
                  <div className="delivery-address-box">
                    <strong>📍 Delivery Address:</strong>
                    <p>
                      {order.customer?.name} ({order.customer?.phone})<br />
                      {order.customer?.address}, {order.customer?.city}, {order.customer?.state} - {order.customer?.pincode}
                    </p>
                  </div>

                  <div className="order-price-summary">
                    <span className="payment-badge">💵 {order.paymentMethod || 'Cash on Delivery'}</span>
                    <div className="total-amount-row">
                      <span>Total Amount:</span>
                      <strong>₹{Number(order.totalAmount || 0).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;