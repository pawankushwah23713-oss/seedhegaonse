import React, { useState, useEffect } from 'react';

const getBaseApiUrl = () => {
  const envUrl = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
    ? process.env.REACT_APP_API_URL
    : (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL);
  if (!envUrl) return '/api';
  const clean = envUrl.trim().replace(/\/auth\/?$/, '').replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};
const API_BASE = getBaseApiUrl();

const getAuthToken = () => {
  try {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('userToken') ||
      localStorage.getItem('authToken') ||
      null
    );
  } catch {
    return null;
  }
};

const emptySection = () => ({ heading: '', content: '', order: 0 });

const AdminCouponLoyaltyPolicy = () => {
  const [title, setTitle] = useState('Coupon & Loyalty Policy');
  const [introText, setIntroText] = useState('');
  const [sections, setSections] = useState([emptySection()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/coupon-loyalty-policy`);
        const data = await res.json();
        if (res.ok && data?.policy) {
          setTitle(data.policy.title || 'Coupon & Loyalty Policy');
          setIntroText(data.policy.introText || '');
          setSections(
            data.policy.sections?.length
              ? data.policy.sections.map((s, idx) => ({ ...s, order: s.order ?? idx + 1 }))
              : [emptySection()]
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateSection = (idx, field, value) => {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const addSection = () => {
    setSections((prev) => [...prev, { ...emptySection(), order: prev.length + 1 }]);
  };

  const removeSection = (idx) => {
    setSections((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setMsg({ text: '', type: '' });
    const token = getAuthToken();
    if (!token) {
      setMsg({ text: 'Admin login required.', type: 'error' });
      return;
    }
    if (!introText.trim()) {
      setMsg({ text: 'Intro text is required.', type: 'error' });
      return;
    }
    const cleanSections = sections
      .map((s, idx) => ({ ...s, order: s.order || idx + 1 }))
      .filter((s) => s.heading.trim() && s.content.trim());
    if (cleanSections.length === 0) {
      setMsg({ text: 'Add at least one valid section.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/coupon-loyalty-policy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, introText, sections: cleanSections })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save.');
      setMsg({ text: data.message || '✅ Saved successfully!', type: 'success' });
    } catch (err) {
      setMsg({ text: err.message || 'Failed to save policy.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 24 }}>⏳ Loading policy...</div>;
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1.5px solid #cbd5e1',
    fontSize: '0.9rem',
    marginBottom: '10px',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#881337', marginBottom: 4 }}>
        Edit Coupon & Loyalty Policy
      </h1>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 20 }}>
        Wrap any phrase in <code>**double asterisks**</code> to make it bold on the live page.
      </p>

      {msg.text && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 6,
            marginBottom: 16,
            fontWeight: 'bold',
            background: msg.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: msg.type === 'success' ? '#15803d' : '#b91c1c'
          }}
        >
          {msg.text}
        </div>
      )}

      <label style={{ fontWeight: 700, fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Page Title</label>
      <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} />

      <label style={{ fontWeight: 700, fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>Intro Paragraph</label>
      <textarea style={{ ...inputStyle, minHeight: 80 }} value={introText} onChange={(e) => setIntroText(e.target.value)} />

      <h3 style={{ marginTop: 20, marginBottom: 10, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>Sections</h3>

      {sections.map((sec, idx) => (
        <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, marginBottom: 12, background: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <strong style={{ fontSize: '0.85rem', color: '#475569' }}>Section {idx + 1}</strong>
            <button
              type="button"
              onClick={() => removeSection(idx)}
              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
            >
              ✕ Remove
            </button>
          </div>
          <input
            style={inputStyle}
            placeholder="Heading (e.g. 1. Nature of promotional benefits)"
            value={sec.heading}
            onChange={(e) => updateSection(idx, 'heading', e.target.value)}
          />
          <textarea
            style={{ ...inputStyle, minHeight: 70 }}
            placeholder="Content"
            value={sec.content}
            onChange={(e) => updateSection(idx, 'content', e.target.value)}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addSection}
        style={{ background: '#e2e8f0', color: '#334155', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', marginBottom: 20 }}
      >
        + Add Section
      </button>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{ width: '100%', padding: 14, background: '#881337', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer', marginTop: 10 }}
      >
        {saving ? 'Saving...' : '💾 Save Policy'}
      </button>
    </div>
  );
};

export default AdminCouponLoyaltyPolicy;