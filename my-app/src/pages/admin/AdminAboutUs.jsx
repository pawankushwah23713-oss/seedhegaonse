// src/pages/admin/AdminAboutUs.jsx
import React, { useState, useEffect } from 'react';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://orange-ape-497824.hostingersite.com/api');

// Empty form shape used both for "create new" and as a fallback
const emptyForm = {
  heroTitle: '',
  heroSubtitle: '',
  journeyTitle: '',
  journeyParagraphs: '', // textarea: one paragraph per line, split on save
  whyWeExistTitle: '',
  whyWeExistText: '',
  promiseTitle: '',
  promiseParagraphs: '', // textarea: one paragraph per line, split on save
  quoteText: '',
  whatsappNumber: ''
};

const AdminAboutUs = () => {
  const [form, setForm] = useState(emptyForm);
  const [existingId, setExistingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }

  const authHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  // Load existing content (if any) so the form is pre-filled for editing
  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/aboutus`);
      if (res.status === 404) {
        // Nothing saved yet — keep the blank form, this is a valid "create" state
        setExistingId(null);
        setForm(emptyForm);
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setExistingId(data._id);
        setForm({
          heroTitle: data.heroTitle || '',
          heroSubtitle: data.heroSubtitle || '',
          journeyTitle: data.journeyTitle || '',
          journeyParagraphs: (data.journeyParagraphs || []).join('\n'),
          whyWeExistTitle: data.whyWeExistTitle || '',
          whyWeExistText: data.whyWeExistText || '',
          promiseTitle: data.promiseTitle || '',
          promiseParagraphs: (data.promiseParagraphs || []).join('\n'),
          quoteText: data.quoteText || '',
          whatsappNumber: data.whatsappNumber || ''
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load About Us content: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const buildPayload = () => ({
    heroTitle: form.heroTitle,
    heroSubtitle: form.heroSubtitle,
    journeyTitle: form.journeyTitle,
    journeyParagraphs: form.journeyParagraphs
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean),
    whyWeExistTitle: form.whyWeExistTitle,
    whyWeExistText: form.whyWeExistText,
    promiseTitle: form.promiseTitle,
    promiseParagraphs: form.promiseParagraphs
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean),
    quoteText: form.quoteText,
    whatsappNumber: form.whatsappNumber
  });

  // Save = create if nothing exists yet, otherwise update
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);

      const payload = buildPayload();
      const url = existingId ? `${API_BASE}/aboutus/${existingId}` : `${API_BASE}/aboutus`;
      const method = existingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');

      setExistingId(data._id);
      setMessage({ type: 'success', text: existingId ? 'About Us page updated ✅' : 'About Us page created ✅' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Delete = wipes the content entirely; public page falls back to its defaults
  const handleDelete = async () => {
    if (!existingId) return;
    const confirmDelete = window.confirm('⚠️ Delete the entire About Us content? This cannot be undone.');
    if (!confirmDelete) return;

    try {
      setDeleting(true);
      setMessage(null);
      const res = await fetch(`${API_BASE}/aboutus/${existingId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');

      setExistingId(null);
      setForm(emptyForm);
      setMessage({ type: 'success', text: 'About Us content deleted.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-aboutus-page">
      <style>{`
        .admin-aboutus-page {
          padding: 20px;
          max-width: 900px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .aa-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .aa-header h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
        }

        .aa-header p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 0.85rem;
        }

        .aa-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .aa-badge.exists { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
        .aa-badge.new { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }

        .aa-message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 18px;
          font-weight: 600;
          font-size: 0.88rem;
        }

        .aa-message.success { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
        .aa-message.error { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }

        .aa-form-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 24px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
        }

        .aa-section-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0f172a;
          margin: 22px 0 12px;
          padding-bottom: 6px;
          border-bottom: 2px solid #f1f5f9;
        }

        .aa-section-title:first-child {
          margin-top: 0;
        }

        .aa-field {
          margin-bottom: 16px;
        }

        .aa-field label {
          display: block;
          font-size: 0.82rem;
          font-weight: 700;
          color: #334155;
          margin-bottom: 6px;
        }

        .aa-field .hint {
          font-size: 0.74rem;
          color: #94a3b8;
          font-weight: 500;
          margin-left: 6px;
        }

        .aa-input, .aa-textarea {
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

        .aa-input:focus, .aa-textarea:focus {
          border-color: #3b82f6;
          background: #ffffff;
        }

        .aa-textarea {
          resize: vertical;
          min-height: 90px;
          line-height: 1.5;
        }

        .aa-actions {
          display: flex;
          gap: 10px;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .aa-btn {
          padding: 11px 22px;
          border-radius: 9px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          border: none;
        }

        .aa-btn-save {
          background: #2563eb;
          color: #fff;
        }
        .aa-btn-save:hover { background: #1d4ed8; }
        .aa-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

        .aa-btn-delete {
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fca5a5;
        }
        .aa-btn-delete:hover { background: #dc2626; color: #fff; }
        .aa-btn-delete:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div className="aa-header">
        <div>
          <h1>📝 About Us — Content Manager</h1>
          <p>Edit what customers see on the public About Us page.</p>
        </div>
        {!loading && (
          <span className={`aa-badge ${existingId ? 'exists' : 'new'}`}>
            {existingId ? '● Live content exists' : '○ Not created yet'}
          </span>
        )}
      </div>

      {message && (
        <div className={`aa-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading content...</p>
      ) : (
        <form className="aa-form-card" onSubmit={handleSave}>

          <div className="aa-section-title">Hero Banner</div>
          <div className="aa-field">
            <label>Title</label>
            <input className="aa-input" value={form.heroTitle} onChange={handleChange('heroTitle')} placeholder="Our Story" />
          </div>
          <div className="aa-field">
            <label>Subtitle</label>
            <textarea className="aa-textarea" style={{ minHeight: '60px' }} value={form.heroSubtitle} onChange={handleChange('heroSubtitle')} placeholder="Short tagline shown under the title" />
          </div>

          <div className="aa-section-title">Our Journey Section</div>
          <div className="aa-field">
            <label>Section Title</label>
            <input className="aa-input" value={form.journeyTitle} onChange={handleChange('journeyTitle')} placeholder="Our Journey" />
          </div>
          <div className="aa-field">
            <label>Paragraphs <span className="hint">(one paragraph per line)</span></label>
            <textarea className="aa-textarea" value={form.journeyParagraphs} onChange={handleChange('journeyParagraphs')} placeholder={'First paragraph...\nSecond paragraph...\nThird paragraph...'} />
          </div>

          <div className="aa-section-title">Why We Exist Box</div>
          <div className="aa-field">
            <label>Title</label>
            <input className="aa-input" value={form.whyWeExistTitle} onChange={handleChange('whyWeExistTitle')} placeholder="Why We Exist" />
          </div>
          <div className="aa-field">
            <label>Text</label>
            <textarea className="aa-textarea" style={{ minHeight: '70px' }} value={form.whyWeExistText} onChange={handleChange('whyWeExistText')} />
          </div>

          <div className="aa-section-title">Our Promise Section</div>
          <div className="aa-field">
            <label>Section Title</label>
            <input className="aa-input" value={form.promiseTitle} onChange={handleChange('promiseTitle')} placeholder="Our Promise" />
          </div>
          <div className="aa-field">
            <label>Paragraphs <span className="hint">(one paragraph per line)</span></label>
            <textarea className="aa-textarea" value={form.promiseParagraphs} onChange={handleChange('promiseParagraphs')} placeholder={'First paragraph...\nSecond paragraph...'} />
          </div>
          <div className="aa-field">
            <label>Golden Quote</label>
            <textarea className="aa-textarea" style={{ minHeight: '60px' }} value={form.quoteText} onChange={handleChange('quoteText')} placeholder="No Shortcuts. No False Promises..." />
          </div>

          <div className="aa-section-title">Contact</div>
          <div className="aa-field">
            <label>WhatsApp Number <span className="hint">(digits only, with country code, e.g. 919876543210)</span></label>
            <input className="aa-input" value={form.whatsappNumber} onChange={handleChange('whatsappNumber')} placeholder="919876543210" />
          </div>

          <div className="aa-actions">
            <button type="submit" className="aa-btn aa-btn-save" disabled={saving}>
              {saving ? 'Saving...' : existingId ? '💾 Update About Us Page' : '➕ Create About Us Page'}
            </button>
            {existingId && (
              <button type="button" className="aa-btn aa-btn-delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : '🗑️ Delete Content'}
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminAboutUs;