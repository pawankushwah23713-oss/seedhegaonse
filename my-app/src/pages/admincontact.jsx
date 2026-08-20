import React, { useState, useEffect } from 'react';

// API Base URL (Backend Port 5000/3000 auto-detect)
const API_URL = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const AdminInquiries = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  // Fetch inquiries from backend GET /api/contact
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/contact`);
      const result = await res.json();

      if (res.ok && result.success) {
        setContacts(result.data || []);
      } else if (Array.isArray(result)) {
        setContacts(result);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Filter inquiries by search query
  const filteredContacts = contacts.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.name?.toLowerCase().includes(term) ||
      item.email?.toLowerCase().includes(term) ||
      item.phone?.toLowerCase().includes(term) ||
      item.subject?.toLowerCase().includes(term) ||
      item.message?.toLowerCase().includes(term)
    );
  });

  // Format Date & Time
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="admin-inquiries-container">
      <style>{`
        .admin-inquiries-container {
          padding: 28px;
          background: #f8fafc;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1e293b;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }

        .admin-title-wrap h1 {
          font-size: 1.6rem;
          font-weight: 800;
          color: #871a1a;
          margin: 0;
        }

        .admin-title-wrap p {
          color: #64748b;
          font-size: 0.88rem;
          margin: 4px 0 0;
        }

        .admin-stats-row {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-badge {
          background: #ffffff;
          padding: 12px 20px;
          border-radius: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .stat-count {
          font-size: 1.4rem;
          font-weight: 800;
          color: #871a1a;
        }

        .stat-label {
          font-size: 0.82rem;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 600;
        }

        .action-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .search-input {
          flex: 1;
          min-width: 260px;
          max-width: 400px;
          padding: 10px 16px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.9rem;
          outline: none;
          background: #ffffff;
        }

        .search-input:focus {
          border-color: #871a1a;
        }

        .refresh-btn {
          background: #871a1a;
          color: #ffffff;
          border: none;
          padding: 10px 18px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.88rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .refresh-btn:hover {
          background: #6e1414;
        }

        /* Table Design */
        .table-responsive {
          background: #ffffff;
          border-radius: 14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
          overflow-x: auto;
        }

        .inquiries-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.88rem;
        }

        .inquiries-table th {
          background: #f1f5f9;
          color: #475569;
          font-weight: 700;
          padding: 14px 16px;
          border-bottom: 2px solid #e2e8f0;
          white-space: nowrap;
        }

        .inquiries-table td {
          padding: 14px 16px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: top;
        }

        .inquiries-table tr:hover {
          background: #fff8f8;
        }

        .customer-name {
          font-weight: 700;
          color: #0f172a;
        }

        .customer-phone {
          color: #64748b;
          font-size: 0.8rem;
          margin-top: 2px;
        }

        .subject-badge {
          background: #fee2e2;
          color: #991b1b;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.76rem;
          font-weight: 700;
          display: inline-block;
          margin-bottom: 4px;
        }

        .message-preview {
          max-width: 280px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          color: #475569;
          line-height: 1.35;
        }

        .table-action-btns {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .btn-view {
          background: #0ea5e9;
          color: #fff;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-view:hover {
          background: #0284c7;
        }

        .btn-whatsapp {
          background: #22c55e;
          color: #fff;
          border: none;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 0.78rem;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
        }

        .btn-whatsapp:hover {
          background: #16a34a;
        }

        /* Modal Details */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .modal-box {
          background: #ffffff;
          border-radius: 16px;
          max-width: 600px;
          width: 100%;
          padding: 24px;
          position: relative;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
        }

        .modal-close {
          position: absolute;
          top: 14px;
          right: 14px;
          background: #f1f5f9;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-field {
          margin-bottom: 14px;
        }

        .modal-field label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          display: block;
          margin-bottom: 2px;
        }

        .modal-field p {
          margin: 0;
          color: #1e293b;
          font-size: 0.95rem;
        }

        .modal-msg-body {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-left: 4px solid #871a1a;
          padding: 14px;
          border-radius: 8px;
          margin-top: 6px;
          white-space: pre-wrap;
          font-size: 0.9rem;
          line-height: 1.5;
        }
      `}</style>

      {/* Header */}
      <div className="admin-header">
        <div className="admin-title-wrap">
          <h1>Customer Inquiries & Messages</h1>
          <p>View, track, and reply to customer questions submitted from the Contact Us form.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats-row">
        <div className="stat-badge">
          <div>
            <div className="stat-count">{contacts.length}</div>
            <div className="stat-label">Total Messages</div>
          </div>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="action-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, email, phone or subject..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="refresh-btn" onClick={fetchContacts}>
          ↻ Refresh
        </button>
      </div>

      {/* Inquiries Table */}
      <div className="table-responsive">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Loading inquiries...
          </div>
        ) : filteredContacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            No messages found.
          </div>
        ) : (
          <table className="inquiries-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Subject</th>
                <th>Message Preview</th>
                <th>Received On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((c) => (
                <tr key={c._id || Math.random()}>
                  <td>
                    <div className="customer-name">{c.name}</div>
                    <div className="customer-phone">📞 {c.phone}</div>
                    <div className="customer-phone">✉️ {c.email}</div>
                  </td>
                  <td>
                    <span className="subject-badge">{c.subject}</span>
                  </td>
                  <td>
                    <div className="message-preview" title={c.message}>
                      {c.message}
                    </div>
                  </td>
                  <td>{formatDate(c.createdAt)}</td>
                  <td>
                    <div className="table-action-btns">
                      <button
                        className="btn-view"
                        onClick={() => setSelectedInquiry(c)}
                      >
                        View
                      </button>
                      <a
                        href={`https://wa.me/${c.phone?.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-whatsapp"
                        title="Chat on WhatsApp"
                      >
                        WA
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detailed View Modal */}
      {selectedInquiry && (
        <div className="modal-overlay" onClick={() => setSelectedInquiry(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedInquiry(null)}>
              ✕
            </button>

            <h2 style={{ color: '#871a1a', margin: '0 0 16px 0', fontSize: '1.25rem' }}>
              Inquiry Details
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="modal-field">
                <label>Customer Name</label>
                <p><strong>{selectedInquiry.name}</strong></p>
              </div>

              <div className="modal-field">
                <label>Received Date</label>
                <p>{formatDate(selectedInquiry.createdAt)}</p>
              </div>

              <div className="modal-field">
                <label>Email Address</label>
                <p>
                  <a href={`mailto:${selectedInquiry.email}`} style={{ color: '#0ea5e9' }}>
                    {selectedInquiry.email}
                  </a>
                </p>
              </div>

              <div className="modal-field">
                <label>Phone Number</label>
                <p>
                  <a href={`tel:${selectedInquiry.phone}`} style={{ color: '#0ea5e9' }}>
                    {selectedInquiry.phone}
                  </a>
                </p>
              </div>
            </div>

            <div className="modal-field">
              <label>Subject</label>
              <p><strong>{selectedInquiry.subject}</strong></p>
            </div>

            <div className="modal-field">
              <label>Full Message</label>
              <div className="modal-msg-body">{selectedInquiry.message}</div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <a
                href={`mailto:${selectedInquiry.email}?subject=Re: ${encodeURIComponent(selectedInquiry.subject)}`}
                style={{
                  background: '#871a1a',
                  color: '#fff',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  fontWeight: '600'
                }}
              >
                ✉ Reply via Email
              </a>

              <a
                href={`https://wa.me/${selectedInquiry.phone?.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: '#22c55e',
                  color: '#fff',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  fontWeight: '600'
                }}
              >
                💬 Open WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInquiries;