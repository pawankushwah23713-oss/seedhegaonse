// src/pages/admin/AdminOrders.jsx
import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../../socket';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

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
  
  // 🟢 Chat States
  const [activeChatOrder, setActiveChatOrder] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChatOrder?.messages]);

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

    // 🟢 REAL-TIME LISTENER: New Order
    socket.on('new_order', (newOrder) => {
      playOrderChime();
      setLiveAlert(`🔔 New Order from ${newOrder.customer?.name || 'Customer'} (₹${newOrder.totalAmount})!`);
      setTimeout(() => setLiveAlert(null), 5000);
      setOrders((prev) => [newOrder, ...prev]);
    });

    // 🟢 REAL-TIME LISTENER: Order Status Update
    socket.on('order_status_updated', (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? { ...o, ...updatedOrder } : o))
      );
    });

    // 🟢 REAL-TIME LISTENER: Live Chat Message
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
      socket.off('new_order');
      socket.off('order_status_updated');
      socket.off('order_chat_message');
    };
  }, []);

  // Admin Changes Status
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

      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  // 🟢 Admin Sends Chat Message
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
          sender: 'admin',
          senderName: 'Admin Support'
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="page-heading" style={{ margin: 0 }}>📦 Live Customer Orders</h1>
        <span style={{ background: '#ecfdf5', color: '#059669', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
          ⚡ Socket Connected
        </span>
      </div>

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
                <th>Customer & Address</th>
                <th>Items Ordered</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Live Status</th>
                <th>Customer Chat</th>
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
                  <td>
                    {/* 🟢 Live Chat Button with Message Count */}
                    <button
                      onClick={() => setActiveChatOrder(o)}
                      style={{
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      💬 Chat {o.messages?.length > 0 && `(${o.messages.length})`}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 🟢 LIVE ORDER CHAT MODAL (ADMIN) */}
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
          zIndex: 9999
        }}>
          <div style={{
            background: '#ffffff',
            width: '90%',
            maxWidth: '520px',
            height: '80vh',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              background: '#1e293b',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  💬 Chat for Order #{activeChatOrder._id.slice(-6).toUpperCase()}
                </h3>
                <small style={{ color: '#94a3b8' }}>
                  Customer: {activeChatOrder.customer?.name} ({activeChatOrder.customer?.phone})
                </small>
              </div>
              <button
                onClick={() => setActiveChatOrder(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            {/* Chat Messages Body */}
            <div style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {!activeChatOrder.messages || activeChatOrder.messages.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', margin: 'auto' }}>
                  No messages yet. Send a message to the customer.
                </p>
              ) : (
                activeChatOrder.messages.map((msg, index) => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <div
                      key={index}
                      style={{
                        alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        background: isAdmin ? '#2563eb' : '#ffffff',
                        color: isAdmin ? '#ffffff' : '#1e293b',
                        padding: '10px 14px',
                        borderRadius: isAdmin ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
                        border: isAdmin ? 'none' : '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.8, marginBottom: '3px' }}>
                        {isAdmin ? 'You (Admin)' : (msg.senderName || 'Customer')}
                      </div>
                      <div style={{ fontSize: '0.92rem', wordBreak: 'break-word' }}>{msg.text}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.7, textAlign: 'right', marginTop: '4px' }}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} style={{
              display: 'flex',
              padding: '12px',
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              gap: '8px'
            }}>
              <input
                type="text"
                placeholder="Type your reply to customer..."
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
                  background: '#2563eb',
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

export default AdminOrders;