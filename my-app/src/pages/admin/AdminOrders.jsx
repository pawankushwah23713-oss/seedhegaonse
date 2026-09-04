// src/pages/admin/AdminOrders.jsx
import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../../socket';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://orange-ape-497824.hostingersite.com/api');

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

// Helper function to format exact Date, Time, and Relative Time
const formatOrderDateTime = (dateString) => {
  if (!dateString) return { date: 'N/A', time: '', relative: '', isNew: false };
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return { date: 'N/A', time: '', relative: '', isNew: false };

  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  let relative = '';
  let isNew = false;

  if (diffSec < 60) {
    relative = 'Just now';
    isNew = true;
  } else if (diffMin < 60) {
    relative = `${diffMin}m ago`;
    if (diffMin <= 15) isNew = true;
  } else if (diffHr < 24) {
    relative = `${diffHr}h ago`;
  } else if (diffDays === 1) {
    relative = 'Yesterday';
  } else {
    relative = `${diffDays}d ago`;
  }

  const date = d.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const time = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return { date, time, relative, isNew };
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveAlert, setLiveAlert] = useState(null);

  // Filter States
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'yesterday', 'week'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chat States
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

    // REAL-TIME LISTENER: New Order
    socket.on('new_order', (newOrder) => {
      playOrderChime();
      const orderWithTime = {
        ...newOrder,
        createdAt: newOrder.createdAt || new Date().toISOString()
      };
      setLiveAlert(`🔔 New Order from ${newOrder.customer?.name || 'Customer'} ($${newOrder.totalAmount || newOrder.totalAmount})!`);
      setTimeout(() => setLiveAlert(null), 5000);
      setOrders((prev) => [orderWithTime, ...prev]);
    });

    // REAL-TIME LISTENER: Order Status Update
    socket.on('order_status_updated', (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? { ...o, ...updatedOrder } : o))
      );
    });

    // REAL-TIME LISTENER: Live Chat Message
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

  // Update Status
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

  // Delete Order
  const handleDeleteOrder = async (orderId) => {
    const confirmDelete = window.confirm(`⚠️ Are you sure you want to delete order #${orderId.slice(-6).toUpperCase()}?`);
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete order');
      }

      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      if (activeChatOrder?._id === orderId) setActiveChatOrder(null);
    } catch (err) {
      alert('Delete Error: ' + err.message);
    }
  };

  // Send Chat Message
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

  // Filter & Search Logic
  const filteredOrders = orders.filter((o) => {
    const orderDate = new Date(o.createdAt || o.date || o.timestamp);
    const now = new Date();

    // 1. Date Filter
    if (dateFilter === 'today') {
      if (orderDate.toDateString() !== now.toDateString()) return false;
    } else if (dateFilter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      if (orderDate.toDateString() !== yesterday.toDateString()) return false;
    } else if (dateFilter === 'week') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      if (orderDate < sevenDaysAgo) return false;
    }

    // 2. Status Filter
    if (statusFilter !== 'all' && (o.orderStatus || '').toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const idMatch = (o._id || '').toLowerCase().includes(query);
      const nameMatch = (o.customer?.name || '').toLowerCase().includes(query);
      const phoneMatch = (o.customer?.phone || '').includes(query);
      const cityMatch = (o.customer?.city || '').toLowerCase().includes(query);
      if (!idMatch && !nameMatch && !phoneMatch && !cityMatch) return false;
    }

    return true;
  });

  return (
    <div className="admin-orders-page">
      {/* Embedded Responsive Styling */}
      <style>{`
        .admin-orders-page {
          padding: 16px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
        }

        .filters-container {
          background: #ffffff;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          margin-bottom: 20px;
          border: 1px solid #e2e8f0;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1 1 200px;
        }

        .filter-input, .filter-select {
          width: 100%;
          padding: 9px 12px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 0.9rem;
          outline: none;
          background: #f8fafc;
          transition: border-color 0.2s;
        }

        .filter-input:focus, .filter-select:focus {
          border-color: #3b82f6;
          background: #ffffff;
        }

        .order-table-wrapper {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border: 1px solid #e2e8f0;
        }

        .admin-data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          min-width: 900px;
        }

        .admin-data-table th {
          background: #f1f5f9;
          color: #334155;
          padding: 14px 16px;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e2e8f0;
        }

        .admin-data-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 0.88rem;
          vertical-align: middle;
        }

        .admin-data-table tr:hover {
          background: #f8fafc;
        }

        .btn-action-chat {
          background: #3b82f6;
          color: #fff;
          border: none;
          padding: 7px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.82rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: background 0.2s;
        }

        .btn-action-chat:hover {
          background: #2563eb;
        }

        .btn-action-delete {
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fca5a5;
          padding: 7px 10px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.82rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-left: 6px;
          transition: all 0.2s;
        }

        .btn-action-delete:hover {
          background: #dc2626;
          color: #ffffff;
        }

        @media (max-width: 768px) {
          .admin-orders-page {
            padding: 10px;
          }
          .filters-container {
            padding: 12px;
            gap: 10px;
          }
          .filter-group {
            flex: 1 1 100%;
          }
        }
      `}</style>

      {/* Header */}
      <div className="header-bar">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            📦 Live Customer Orders
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Showing {filteredOrders.length} of {orders.length} total orders
          </p>
        </div>
        <span style={{
          background: '#ecfdf5',
          color: '#059669',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '0.85rem',
          fontWeight: 700,
          border: '1px solid #a7f3d0'
        }}>
          ⚡ Live Socket Active
        </span>
      </div>

      {/* Live Order Alert Banner */}
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

      {/* Filter and Search Bar */}
      <div className="filters-container">
        {/* Search */}
        <div className="filter-group" style={{ flex: '2 1 240px' }}>
          <input
            type="text"
            className="filter-input"
            placeholder="🔍 Search Order ID, Name, Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Date Filter */}
        <div className="filter-group">
          <select
            className="filter-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">📅 All Dates</option>
            <option value="today">🔥 Today's Orders</option>
            <option value="yesterday">⏳ Yesterday's Orders</option>
            <option value="week">🗓️ Last 7 Days</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="filter-group">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">🏷️ All Statuses</option>
            <option value="Placed">Placed</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {(dateFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              setDateFilter('all');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            style={{
              padding: '8px 14px',
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#475569'
            }}
          >
            ✕ Reset Filters
          </button>
        )}
      </div>

      {/* Orders Table Wrapper */}
      <div className="order-table-wrapper">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading Orders...</p>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
            <h3>No orders found!</h3>
            <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>Try adjusting your search criteria or date filter.</p>
          </div>
        ) : (
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Order ID & Time</th>
                <th>Customer & Address</th>
                <th>Items Ordered</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Live Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => {
                const { date, time, relative, isNew } = formatOrderDateTime(o.createdAt || o.date || o.timestamp);
                return (
                  <tr key={o._id}>
                    <td>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>
                        #{o._id.slice(-6).toUpperCase()}
                      </div>
                      
                      {/* Live Date & Time Indicator */}
                      <div style={{ marginTop: '4px', fontSize: '0.78rem' }}>
                        <div style={{ color: '#0f172a', fontWeight: 700 }}>⏰ {time || 'Just now'}</div>
                        <div style={{ color: '#64748b', marginTop: '1px' }}>📅 {date}</div>
                        {relative && (
                          <div style={{ marginTop: '4px' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 7px',
                              borderRadius: '12px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: isNew ? '#fee2e2' : '#f1f5f9',
                              color: isNew ? '#dc2626' : '#475569',
                              border: isNew ? '1px solid #fca5a5' : '1px solid #e2e8f0'
                            }}>
                              {isNew ? `🔴 ${relative}` : `⏳ ${relative}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <strong style={{ color: '#0f172a' }}>{o.customer?.name}</strong> ({o.customer?.phone})<br />
                      <small style={{ color: '#64748b' }}>
                        {o.customer?.address}, {o.customer?.city} - {o.customer?.pincode}
                      </small>
                    </td>

                    <td>
                      {o.orderItems?.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '0.84rem', color: '#334155' }}>
                          {item.name} × <strong>{item.qty}</strong>
                        </div>
                      ))}
                    </td>

                    <td>
                      <b style={{ color: '#047857', fontSize: '0.98rem' }}>
                        ₹{Number(o.totalAmount).toFixed(2)}
                      </b>
                    </td>

                    <td>
                      <span style={{
                        background: '#f8fafc',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.78rem',
                        fontWeight: 600
                      }}>
                        💵 {o.paymentMethod}
                      </span>
                    </td>

                    <td>
                      <select
                        value={o.orderStatus}
                        onChange={(e) => handleStatusChange(o._id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontWeight: 600,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          background:
                            o.orderStatus === 'Delivered' ? '#f0fdf4' :
                            o.orderStatus === 'Cancelled' ? '#fef2f2' : '#ffffff',
                          color:
                            o.orderStatus === 'Delivered' ? '#166534' :
                            o.orderStatus === 'Cancelled' ? '#991b1b' : '#0f172a'
                        }}
                      >
                        <option value="Placed">Placed</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {/* Live Chat Button */}
                      <button
                        onClick={() => setActiveChatOrder(o)}
                        className="btn-action-chat"
                        title="Open Live Chat"
                      >
                        💬 Chat {o.messages?.length > 0 && `(${o.messages.length})`}
                      </button>

                      {/* Delete Order Button */}
                      <button
                        onClick={() => handleDeleteOrder(o._id)}
                        className="btn-action-delete"
                        title="Delete Order"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Live Order Chat Modal */}
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
          padding: '12px'
        }}>
          <div style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: '520px',
            height: '82vh',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 12px 35px rgba(0,0,0,0.3)'
          }}>
            {/* Modal Header */}
            <div style={{
              background: '#1e293b',
              color: '#ffffff',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
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
                  fontSize: '1.4rem',
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
                        maxWidth: '78%',
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