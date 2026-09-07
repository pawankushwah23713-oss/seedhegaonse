// src/pages/admin/AdminReturnRefundPolicy.jsx
import React, { useState, useEffect } from 'react';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://orange-ape-497824.hostingersite.com/api');

const emptyForm = {
  pageTitle: '',
  introText: '',
  policyPoints: [''], // each string = one bullet point
  footerText: ''
};

const AdminReturnRefundPolicy = () => {
  const [form, setForm] = useState(emptyForm);
  const [existingId, setExistingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState(null);

  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/return-refund-policy`);
      if (res.status === 404) {
        setExistingId(null);
        setForm(emptyForm);
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setExistingId(data._id);
        setForm({
          pageTitle: data.pageTitle || '',
          introText: data.introText || '',
          policyPoints:
            Array.isArray(data.policyPoints) && data.policyPoints.length > 0
              ? data.policyPoints
              : [''],
          footerText: data.footerText || ''
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load policy content: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleTopChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const updatePoint = (idx, value) => {
    setForm((prev) => {
      const points = [...prev.policyPoints];
      points[idx] = value;
      return { ...prev, policyPoints: points };
    });
  };

  const addPoint = () => {
    setForm((prev) => ({ ...prev, policyPoints: [...prev.policyPoints, ''] }));
  };

  const removePoint = (idx) => {
    setForm((prev) => {
      const points = prev.policyPoints.filter((_, i) => i !== idx);
      return { ...prev, policyPoints: points.length > 0 ? points : [''] };
    });
  };

  const movePoint = (idx, direction) => {
    setForm((prev) => {
      const points = [...prev.policyPoints];
      const target = idx + direction;
      if (target < 0 || target >= points.length) return prev;
      [points[idx], points[target]] = [points[target], points[idx]];
      return { ...prev, policyPoints: points };
    });
  };

  const buildPayload = () => ({
    pageTitle: form.pageTitle,
    introText: form.introText,
    policyPoints: form.policyPoints.map((p) => p.trim()).filter(Boolean),
    footerText: form.footerText
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);

      const payload = buildPayload();
      const url = existingId ? `${API_BASE}/return-refund-policy/${existingId}` : `${API_BASE}/return-refund-policy`;
      const method = existingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');

      setExistingId(data._id);
      setMessage({ type: 'success', text: existingId ? 'Policy page updated ✅' : 'Policy page created ✅' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingId) return;
    const confirmDelete = window.confirm('⚠️ Delete the entire Return & Refund Policy content? This cannot be undone.');
    if (!confirmDelete) return;

    try {
      setDeleting(true);
      setMessage(null);
      const res = await fetch(`${API_BASE}/return-refund-policy/${existingId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');

      setExistingId(null);
      setForm(emptyForm);
      setMessage({ type: 'success', text: 'Policy content deleted.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-rrp-page">
      <style>{`
        .admin-rrp-page {
          padding: 20px;
          max-width: 900px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .rrp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .rrp-header h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
        }

        .rrp-header p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 0.85rem;
        }

        .rrp-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .rrp-badge.exists { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
        .rrp-badge.new { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }

        .rrp-message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 18px;
          font-weight: 600;
          font-size: 0.88rem;
        }

        .rrp-message.success { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
        .rrp-message.error { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }

        .rrp-form-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
        }

        .rrp-section-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
          margin: 22px 0 12px;
          padding-bottom: 6px;
          border-bottom: 2px solid #f1f5f9;
        }

        .rrp-section-title:first-child { margin-top: 0; }

        .rrp-field { margin-bottom: 16px; }

        .rrp-field label {
          display: block;
          font-size: 0.82rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 6px;
        }

        .rrp-field .hint {
          font-size: 0.74rem;
          color: #94a3b8;
          font-weight: 500;
          margin-left: 6px;
        }

        .rrp-input, .rrp-textarea {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 0.9rem;
          outline: none;
          font-family: inherit;
          box-sizing: border-box;
          background: #f8fafc;
        }

        .rrp-input:focus, .rrp-textarea:focus {
          border-color: #3b82f6;
          background: #ffffff;
        }

        .rrp-textarea {
          resize: vertical;
          min-height: 70px;
          line-height: 1.5;
        }

        .rrp-point-row {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          margin-bottom: 10px;
        }

        .rrp-point-row .rrp-textarea {
          min-height: 60px;
        }

        .rrp-point-controls {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .rrp-icon-btn {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #334155;
          width: 30px;
          height: 28px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .rrp-icon-btn:hover { background: #f1f5f9; }
        .rrp-icon-btn.danger { color: #dc2626; border-color: #fca5a5; }
        .rrp-icon-btn.danger:hover { background: #fee2e2; }

        .rrp-add-point-btn {
          width: 100%;
          padding: 10px;
          border: 2px dashed #93c5fd;
          background: #eff6ff;
          color: #2563eb;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          font-size: 0.85rem;
          margin-bottom: 6px;
        }

        .rrp-add-point-btn:hover { background: #dbeafe; }

        .rrp-actions {
          display: flex;
          gap: 10px;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .rrp-btn {
          padding: 11px 22px;
          border-radius: 9px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          border: none;
        }

        .rrp-btn-save { background: #2563eb; color: #fff; }
        .rrp-btn-save:hover { background: #1d4ed8; }
        .rrp-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

        .rrp-btn-delete { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
        .rrp-btn-delete:hover { background: #dc2626; color: #fff; }
        .rrp-btn-delete:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div className="rrp-header">
        <div>
          <h1>📝 Return &amp; Refund Policy — Content Manager</h1>
          <p>Add, edit, reorder, or remove any point shown on the public policy page.</p>
        </div>
        {!loading && (
          <span className={`rrp-badge ${existingId ? 'exists' : 'new'}`}>
            {existingId ? '● Live content exists' : '○ Not created yet'}
          </span>
        )}
      </div>

      {message && <div className={`rrp-message ${message.type}`}>{message.text}</div>}

      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading content...</p>
      ) : (
        <form className="rrp-form-card" onSubmit={handleSave}>

          <div className="rrp-section-title">Page Header</div>
          <div className="rrp-field">
            <label>Page Title</label>
            <input className="rrp-input" value={form.pageTitle} onChange={handleTopChange('pageTitle')} placeholder="Return & Refund Policy" />
          </div>
          <div className="rrp-field">
            <label>Intro Paragraph</label>
            <textarea className="rrp-textarea" value={form.introText} onChange={handleTopChange('introText')} placeholder="Short intro shown above the bullet points" />
          </div>

          <div className="rrp-section-title">
            Policy Points <span className="hint">(each becomes one bullet point, in this order)</span>
          </div>

          {form.policyPoints.map((point, idx) => (
            <div className="rrp-point-row" key={idx}>
              <textarea
                className="rrp-textarea"
                value={point}
                onChange={(e) => updatePoint(idx, e.target.value)}
                placeholder={`Point ${idx + 1}...`}
              />
              <div className="rrp-point-controls">
                <button type="button" className="rrp-icon-btn" title="Move up" onClick={() => movePoint(idx, -1)} disabled={idx === 0}>↑</button>
                <button type="button" className="rrp-icon-btn" title="Move down" onClick={() => movePoint(idx, 1)} disabled={idx === form.policyPoints.length - 1}>↓</button>
                <button type="button" className="rrp-icon-btn danger" title="Remove point" onClick={() => removePoint(idx)}>🗑️</button>
              </div>
            </div>
          ))}

          <button type="button" className="rrp-add-point-btn" onClick={addPoint}>
            ➕ Add New Point
          </button>

          <div className="rrp-section-title">Footer</div>
          <div className="rrp-field">
            <label>Closing Statement</label>
            <textarea className="rrp-textarea" value={form.footerText} onChange={handleTopChange('footerText')} placeholder="e.g. By placing an order, the customer agrees to this policy." />
          </div>

          <div className="rrp-actions">
            <button type="submit" className="rrp-btn rrp-btn-save" disabled={saving}>
              {saving ? 'Saving...' : existingId ? '💾 Update Policy Page' : '➕ Create Policy Page'}
            </button>
            {existingId && (
              <button type="button" className="rrp-btn rrp-btn-delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : '🗑️ Delete Content'}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminReturnRefundPolicy;