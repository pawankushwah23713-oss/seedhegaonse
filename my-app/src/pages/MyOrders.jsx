// src/pages/MyOrders.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import './MyOrders.css';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://orange-ape-497824.hostingersite.com/api');

const SERVER_HOST = API_BASE.replace('/api', '');

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

  // 🟢 Live Chat States
  const [activeChatOrder, setActiveChatOrder] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChatOrder?.messages]);

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

    // 🟢 Real-time Status Updates
    socket.on('order_status_updated', (updatedOrder) => {
      setOrders((prevOrders) => {
        const exists = prevOrders.some((o) => o._id === updatedOrder._id);
        if (exists) {
          setLiveToast(`⚡ Order #${updatedOrder._id.slice(-6).toUpperCase()} status updated to: ${updatedOrder.orderStatus}`);
          setTimeout(() => setLiveToast(''), 5000);
          return prevOrders.map((o) => (o._id === updatedOrder._id ? { ...o, ...updatedOrder } : o));
        }
        return prevOrders;
      });
    });

    // 🟢 Real-time Chat Messages
    socket.on('order_chat_message', ({ orderId, message }) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o._id === orderId) {
            const currentMsgs = o.messages || [];
            const exists = currentMsgs.some((m) => m._id === message._id);
            return exists ? o : { ...o, messages: [...currentMsgs, message] };
          }
          return o;
        })
      );

      setActiveChatOrder((curr) => {
        if (curr && curr._id === orderId) {
          const currentMsgs = curr.messages || [];
          const exists = currentMsgs.some((m) => m._id === message._id);
          return exists ? curr : { ...curr, messages: [...currentMsgs, message] };
        }
        return curr;
      });
    });

    return () => {
      socket.off('order_status_updated');
      socket.off('order_chat_message');
    };
  }, [navigate]);

  // 🟢 Customer Sends Message to Admin
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatOrder) return;

    try {
      setSendingMsg(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/orders/${activeChatOrder._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          text: chatInput,
          sender: 'customer',
          senderName: activeChatOrder.customer?.name || 'Customer'
        })
      });

      if (res.ok) {
        setChatInput('');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to send message');
      }
    } catch (err) {
      alert('Error sending message: ' + err.message);
    } finally {
      setSendingMsg(false);
    }
  };

  return (
    <div className="my-orders-container">
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

                <div className="order-card-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '15px' }}>
                  <div className="delivery-address-box">
                    <strong>📍 Delivery Address:</strong>
                    <p>
                      {order.customer?.name} ({order.customer?.phone})<br />
                      {order.customer?.address}, {order.customer?.city}, {order.customer?.state} - {order.customer?.pincode}
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                    {/* 🟢 Live Support Chat Button */}
                    <button
                      onClick={() => setActiveChatOrder(order)}
                      style={{
                        background: '#d97706',
                        color: '#ffffff',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)'
                      }}
                    >
                      💬 Order Support Chat {order.messages?.length > 0 && `(${order.messages.length})`}
                    </button>

                    <div className="order-price-summary">
                      <span className="payment-badge">💵 {order.paymentMethod || 'Cash on Delivery'}</span>
                      <div className="total-amount-row">
                        <span>Total:</span>
                        <strong>₹{Number(order.totalAmount || 0).toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🟢 CUSTOMER LIVE ORDER CHAT MODAL */}
      {activeChatOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '15px'
        }}>
          <div style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: '500px',
            height: '75vh',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 12px 35px rgba(0,0,0,0.3)'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>
                  💬 Support: Order #{activeChatOrder._id.slice(-6).toUpperCase()}
                </h3>
                <small style={{ opacity: 0.9 }}>Talk directly with our kitchen / delivery team</small>
              </div>
              <button
                onClick={() => setActiveChatOrder(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.4rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Chat Body */}
            <div style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              background: '#fffbeb',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {!activeChatOrder.messages || activeChatOrder.messages.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#92400e', margin: 'auto', fontSize: '0.95rem' }}>
                  👋 Need help with this order? Type your query below!
                </p>
              ) : (
                activeChatOrder.messages.map((msg, index) => {
                  const isMe = msg.sender === 'customer';
                  return (
                    <div
                      key={index}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        background: isMe ? '#d97706' : '#ffffff',
                        color: isMe ? '#ffffff' : '#1e293b',
                        padding: '10px 14px',
                        borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                        border: isMe ? 'none' : '1px solid #fde68a'
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.85, marginBottom: '2px' }}>
                        {isMe ? 'You' : 'Admin / Support'}
                      </div>
                      <div style={{ fontSize: '0.92rem', wordBreak: 'break-word' }}>{msg.text}</div>
                      <div style={{ fontSize: '0.68rem', opacity: 0.75, textAlign: 'right', marginTop: '4px' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendMessage} style={{
              display: 'flex',
              padding: '12px',
              background: '#ffffff',
              borderTop: '1px solid #fef3c7',
              gap: '8px'
            }}>
              <input
                type="text"
                placeholder="Ask about delivery, custom packaging..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '24px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  fontSize: '0.95rem'
                }}
              />
              <button
                type="submit"
                disabled={sendingMsg || !chatInput.trim()}
                style={{
                  background: '#d97706',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '24px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: sendingMsg || !chatInput.trim() ? 0.6 : 1
                }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;