// src/pages/admin/AdminSocialLinks.jsx
import React, { useState, useEffect } from 'react';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://orange-ape-497824.hostingersite.com/api');

// Built-in icon paths — same set used here for the admin preview and
// meant to be reused on your public footer/header for a consistent look.
const ICONS = {
  instagram: <path d="M12 2c2.7 0 3 .01 4.1.06 1.1.05 1.85.23 2.5.48.68.27 1.26.62 1.83 1.19.57.57.92 1.15 1.19 1.83.25.65.43 1.4.48 2.5.05 1.1.06 1.4.06 4.1s-.01 3-.06 4.1c-.05 1.1-.23 1.85-.48 2.5a4.9 4.9 0 0 1-1.19 1.83 4.9 4.9 0 0 1-1.83 1.19c-.65.25-1.4.43-2.5.48-1.1.05-1.4.06-4.1.06s-3-.01-4.1-.06c-1.1-.05-1.85-.23-2.5-.48a4.9 4.9 0 0 1-1.83-1.19 4.9 4.9 0 0 1-1.19-1.83c-.25-.65-.43-1.4-.48-2.5C2.01 15 2 14.7 2 12s.01-3 .06-4.1c.05-1.1.23-1.85.48-2.5.27-.68.62-1.26 1.19-1.83A4.9 4.9 0 0 1 5.56 1.38c.65-.25 1.4-.43 2.5-.48C9.16 2.01 9.46 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-8.4a1.17 1.17 0 1 1 0-2.34 1.17 1.17 0 0 1 0 2.34z" />,
  facebook: <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />,
  pinterest: <path d="M12 2a10 10 0 0 0-3.64 19.32c-.05-.83-.09-2.1.02-3 .1-.44.65-2.78.65-2.78s-.17-.33-.17-.83c0-.78.45-1.36 1.02-1.36.48 0 .71.36.71.79 0 .48-.31 1.2-.46 1.87-.14.56.28 1.02.83 1.02 1 0 1.77-1.05 1.77-2.58 0-1.35-.97-2.29-2.35-2.29-1.6 0-2.54 1.2-2.54 2.44 0 .48.18.99.42 1.27a.17.17 0 0 1 .04.16l-.16.64c-.02.11-.08.13-.19.08-.71-.33-1.15-1.36-1.15-2.19 0-1.78 1.29-3.42 3.73-3.42 1.96 0 3.48 1.4 3.48 3.26 0 1.94-1.22 3.51-2.92 3.51-.57 0-1.11-.3-1.29-.64l-.35 1.34c-.13.49-.47 1.1-.7 1.47A10 10 0 1 0 12 2z" />,
  youtube: <path d="M21.8 8.1s-.2-1.5-.8-2.1c-.8-.8-1.7-.8-2.1-.9C15.9 5 12 5 12 5h0s-3.9 0-6.9.1c-.4 0-1.3.1-2.1.9-.6.6-.8 2.1-.8 2.1S2 9.8 2 11.6v1.7c0 1.8.2 3.5.2 3.5s.2 1.5.8 2.1c.8.8 1.9.8 2.3.9C6.8 19.9 12 20 12 20s3.9 0 6.9-.2c.4 0 1.3-.1 2.1-.9.6-.6.8-2.1.8-2.1s.2-1.7.2-3.5v-1.7c0-1.8-.2-3.5-.2-3.5zM9.9 15V8.9l5.4 3.05z" />,
  twitter: <path d="M18.9 3H21.7l-6.1 6.98L22.8 21h-5.6l-4.4-5.75L7.7 21H4.9l6.5-7.46L4.2 3h5.75l3.98 5.26zm-1 16.2h1.55L8.14 4.7H6.47z" />,
  whatsapp: <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.15 8.15 0 0 1-1.25-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23z" />,
  linkedin: <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.11 20.45H3.56V9h3.55z" />,
  custom: <path d="M13.06 8.11L9.17 12l3.89 3.89-1.42 1.42L6.34 12l5.3-5.31zM10.94 15.89L14.83 12l-3.89-3.89 1.42-1.42L18.66 12l-5.3 5.31z" />
};

const PLATFORM_LABELS = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  pinterest: 'Pinterest',
  youtube: 'YouTube',
  twitter: 'Twitter / X',
  whatsapp: 'WhatsApp',
  linkedin: 'LinkedIn',
  custom: 'Custom / Other'
};

const IconPreview = ({ platform, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    {ICONS[platform] || ICONS.custom}
  </svg>
);

const blankForm = { platform: 'instagram', customLabel: '', url: '', order: 0, isActive: true };

const AdminSocialLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = creating new
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);

  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/social-links/all`, { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setLinks(data);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load social links: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...blankForm, order: links.length });
    setShowForm(true);
  };

  const openEditForm = (link) => {
    setEditingId(link._id);
    setForm({
      platform: link.platform,
      customLabel: link.customLabel || '',
      url: link.url,
      order: link.order,
      isActive: link.isActive
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(blankForm);
  };

  const handleChange = (field) => (e) => {
    const value = field === 'isActive' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);

      const payload = {
        platform: form.platform,
        customLabel: form.platform === 'custom' ? form.customLabel : '',
        url: form.url.trim(),
        order: Number(form.order) || 0,
        isActive: form.isActive
      };

      const url = editingId ? `${API_BASE}/social-links/${editingId}` : `${API_BASE}/social-links`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');

      setMessage({ type: 'success', text: editingId ? 'Social link updated ✅' : 'Social link added ✅' });
      closeForm();
      fetchLinks();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Delete this social link?');
    if (!confirmDelete) return;
    try {
      const res = await fetch(`${API_BASE}/social-links/${id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      setMessage({ type: 'success', text: 'Social link deleted.' });
      fetchLinks();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const toggleActive = async (link) => {
    try {
      const res = await fetch(`${API_BASE}/social-links/${link._id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ isActive: !link.isActive })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      fetchLinks();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="admin-social-page">
      <style>{`
        .admin-social-page {
          padding: 20px;
          max-width: 900px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .as-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .as-header h1 { margin: 0; font-size: 1.5rem; font-weight: 800; color: #0f172a; }
        .as-header p { margin: 4px 0 0; color: #64748b; font-size: 0.85rem; }

        .as-add-btn {
          background: #2563eb;
          color: #fff;
          border: none;
          padding: 10px 18px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .as-add-btn:hover { background: #1d4ed8; }

        .as-message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 18px;
          font-weight: 600;
          font-size: 0.88rem;
        }
        .as-message.success { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
        .as-message.error { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }

        .as-list {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
        }

        .as-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          border-bottom: 1px solid #f1f5f9;
        }
        .as-row:last-child { border-bottom: none; }

        .as-icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #f1f5f9;
          color: #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .as-row-main { flex: 1; min-width: 0; }
        .as-row-platform { font-weight: 700; font-size: 0.92rem; color: #0f172a; }
        .as-row-url {
          font-size: 0.8rem;
          color: #64748b;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .as-row-order {
          font-size: 0.76rem;
          color: #94a3b8;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 3px 8px;
          border-radius: 6px;
          flex-shrink: 0;
        }

        .as-toggle {
          width: 42px;
          height: 24px;
          border-radius: 20px;
          border: none;
          cursor: pointer;
          position: relative;
          flex-shrink: 0;
          transition: background 0.2s ease;
        }
        .as-toggle.on { background: #22c55e; }
        .as-toggle.off { background: #cbd5e1; }
        .as-toggle .knob {
          position: absolute;
          top: 3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #fff;
          transition: left 0.2s ease;
        }
        .as-toggle.on .knob { left: 21px; }
        .as-toggle.off .knob { left: 3px; }

        .as-row-actions { display: flex; gap: 6px; flex-shrink: 0; }
        .as-icon-btn {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #334155;
          width: 32px;
          height: 32px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 0.85rem;
        }
        .as-icon-btn:hover { background: #f1f5f9; }
        .as-icon-btn.danger { color: #dc2626; border-color: #fca5a5; }
        .as-icon-btn.danger:hover { background: #fee2e2; }

        .as-empty { text-align: center; padding: 50px 20px; color: #94a3b8; }

        /* Modal form */
        .as-modal-overlay {
          position: fixed; inset: 0; background: rgba(15,23,42,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 999; padding: 16px;
        }
        .as-modal {
          background: #fff;
          border-radius: 14px;
          padding: 26px;
          width: 100%;
          max-width: 440px;
        }
        .as-modal h3 { margin: 0 0 18px; font-size: 1.15rem; color: #0f172a; }

        .as-field { margin-bottom: 14px; }
        .as-field label { display: block; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 6px; }
        .as-input, .as-select {
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 0.9rem;
          background: #f8fafc;
          box-sizing: border-box;
        }
        .as-input:focus, .as-select:focus { outline: none; border-color: #3b82f6; background: #fff; }

        .as-checkbox-row { display: flex; align-items: center; gap: 8px; margin-bottom: 18px; }

        .as-modal-actions { display: flex; gap: 10px; }
        .as-btn { flex: 1; padding: 11px; border-radius: 8px; font-weight: 700; font-size: 0.88rem; cursor: pointer; border: none; }
        .as-btn-save { background: #2563eb; color: #fff; }
        .as-btn-save:hover { background: #1d4ed8; }
        .as-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .as-btn-cancel { background: #f1f5f9; color: #334155; }
        .as-btn-cancel:hover { background: #e2e8f0; }
      `}</style>

      <div className="as-header">
        <div>
          <h1>🔗 Social Links Manager</h1>
          <p>Add, edit, reorder, or remove the social icons shown on your site.</p>
        </div>
        <button className="as-add-btn" onClick={openAddForm}>➕ Add Social Link</button>
      </div>

      {message && <div className={`as-message ${message.type}`}>{message.text}</div>}

      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading...</p>
      ) : links.length === 0 ? (
        <div className="as-list">
          <div className="as-empty">No social links yet. Click "Add Social Link" to create one.</div>
        </div>
      ) : (
        <div className="as-list">
          {links.map((link) => (
            <div className="as-row" key={link._id}>
              <div className="as-icon-badge"><IconPreview platform={link.platform} /></div>
              <div className="as-row-main">
                <div className="as-row-platform">
                  {link.platform === 'custom' ? (link.customLabel || 'Custom') : PLATFORM_LABELS[link.platform]}
                </div>
                <div className="as-row-url">{link.url}</div>
              </div>
              <span className="as-row-order" title="Display order">#{link.order}</span>
              <button
                className={`as-toggle ${link.isActive ? 'on' : 'off'}`}
                onClick={() => toggleActive(link)}
                title={link.isActive ? 'Active — click to hide' : 'Hidden — click to show'}
              >
                <span className="knob"></span>
              </button>
              <div className="as-row-actions">
                <button className="as-icon-btn" title="Edit" onClick={() => openEditForm(link)}>✏️</button>
                <button className="as-icon-btn danger" title="Delete" onClick={() => handleDelete(link._id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="as-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}>
          <div className="as-modal">
            <h3>{editingId ? 'Edit Social Link' : 'Add Social Link'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="as-field">
                <label>Platform</label>
                <select className="as-select" value={form.platform} onChange={handleChange('platform')}>
                  {Object.keys(PLATFORM_LABELS).map((key) => (
                    <option key={key} value={key}>{PLATFORM_LABELS[key]}</option>
                  ))}
                </select>
              </div>

              {form.platform === 'custom' && (
                <div className="as-field">
                  <label>Custom Label</label>
                  <input className="as-input" value={form.customLabel} onChange={handleChange('customLabel')} placeholder="e.g. Telegram, Threads..." />
                </div>
              )}

              <div className="as-field">
                <label>URL</label>
                <input className="as-input" type="url" value={form.url} onChange={handleChange('url')} placeholder="https://instagram.com/yourpage" required />
              </div>

              <div className="as-field">
                <label>Display Order <span style={{ fontWeight: 400, color: '#94a3b8' }}>(lower shows first)</span></label>
                <input className="as-input" type="number" value={form.order} onChange={handleChange('order')} />
              </div>

              <div className="as-checkbox-row">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={handleChange('isActive')} />
                <label htmlFor="isActive" style={{ margin: 0, fontSize: '0.85rem', color: '#334155' }}>Show on site</label>
              </div>

              <div className="as-modal-actions">
                <button type="button" className="as-btn as-btn-cancel" onClick={closeForm}>Cancel</button>
                <button type="submit" className="as-btn as-btn-save" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Add Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSocialLinks;