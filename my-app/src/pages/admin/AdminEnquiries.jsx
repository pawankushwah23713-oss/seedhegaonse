import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './AdminEnquiries.css';

const SOCKET_SERVER_URL = 'https://orange-ape-497824.hostingersite.com/';
const API_BASE_URL = 'https://orange-ape-497824.hostingersite.com/api/enquiry';

const AdminEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [liveAlert, setLiveAlert] = useState(null);

  // 1. Initial Fetch from MongoDB
  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_BASE_URL);
      const data = await res.json();
      if (data.success) {
        setEnquiries(data.data);
      }
    } catch (err) {
      console.error('Error fetching enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();

    // 🟢 2. Real-time Live Socket.io Connection
    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('⚡ Admin connected to Realtime Socket');
    });

    // Jab naya enquiry submit hoga, backend se direct yaha aayega
    socket.on('new_enquiry', (newEnquiry) => {
      setEnquiries((prev) => [newEnquiry, ...prev]);

      // Top par Live Alert Notification
      setLiveAlert(`🔔 New Enquiry from ${newEnquiry.name} (${newEnquiry.quantity})!`);
      setTimeout(() => setLiveAlert(null), 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 3. Update Status Handler
  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        setEnquiries((prev) =>
          prev.map((item) => (item._id === id ? { ...item, status: newStatus } : item))
        );
      }
    } catch (err) {
      alert('Status update failed');
    }
  };

  // 4. Delete Enquiry Handler
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enquiry?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        setEnquiries((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (err) {
      alert('Failed to delete enquiry');
    }
  };

  // Filter Logic
  const filteredEnquiries = filterStatus === 'All'
    ? enquiries
    : enquiries.filter((item) => item.status === filterStatus);

  return (
    <div className="admin-enquiry-container">
      {/* Live Notification Bar */}
      {liveAlert && <div className="live-toast-bar">{liveAlert}</div>}

      {/* Header */}
      <div className="admin-header">
        <div>
          <h2>Bulk & Catering Enquiries</h2>
          <p className="sub-title">Real-time live updates from MongoDB</p>
        </div>
        <div className="live-status-pill">
          <span className="pulsing-dot"></span> Live Connected
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-bar">
        {['All', 'Pending', 'Contacted', 'Confirmed', 'Cancelled'].map((status) => (
          <button
            key={status}
            className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
            onClick={() => setFilterStatus(status)}
          >
            {status} ({status === 'All' ? enquiries.length : enquiries.filter((e) => e.status === status).length})
          </button>
        ))}
      </div>

      {/* Content Table */}
      {loading ? (
        <div className="admin-loading">Loading Enquiries...</div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="empty-state">No enquiries found.</div>
      ) : (
        <div className="table-responsive">
          <table className="enquiry-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Customer</th>
                <th>Sweets & Qty</th>
                <th>Event Type</th>
                <th>Delivery Address</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.map((item) => (
                <tr key={item._id} className={`status-row-${item.status?.toLowerCase()}`}>
                  <td className="date-cell">
                    {new Date(item.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                    <br />
                    <small>
                      {new Date(item.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </small>
                  </td>

                  <td>
                    <strong>{item.name}</strong>
                    <br />
                    <a href={`tel:${item.mobile}`} className="contact-link">
                      📞 {item.mobile}
                    </a>
                    <a
                      href={`https://wa.me/91${item.mobile}?text=Hi ${item.name}, regarding your bulk sweets enquiry at Seedhe Gaon Se...`}
                      target="_blank"
                      rel="noreferrer"
                      className="wa-link"
                      title="WhatsApp Chat"
                    >
                      💬 WhatsApp
                    </a>
                  </td>

                  <td>
                    <span className="highlight-text">{item.sweets || 'N/A'}</span>
                    <br />
                    <span className="qty-tag">📦 {item.quantity}</span>
                  </td>

                  <td>
                    <span className="event-badge">{item.eventType || 'General'}</span>
                  </td>

                  <td className="address-cell" title={item.address}>
                    {item.address}
                  </td>

                  <td>
                    <select
                      className={`status-select ${item.status?.toLowerCase()}`}
                      value={item.status || 'Pending'}
                      onChange={(e) => handleStatusChange(item._id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>

                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(item._id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminEnquiries;