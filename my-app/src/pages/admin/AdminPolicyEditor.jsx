// src/pages/admin/AdminPolicyEditor.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://orange-ape-497824.hostingersite.com/api');

const POLICY_TYPES = [
  { value: 'shipping', label: '🚚 Shipping Policy' },
  { value: 'privacy', label: '🔒 Privacy Policy' },
  { value: 'terms', label: '📜 Terms & Conditions' },
  { value: 'refund', label: '💰 Refund & Cancellation Policy' }
];

const emptySection = () => ({ heading: '', content: '', order: 0 });

const AdminPolicyEditor = () => {
  const [policyType, setPolicyType] = useState('shipping');
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [sections, setSections] = useState([emptySection()]);
  const [footerNote, setFooterNote] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  const getToken = () => localStorage.getItem('token');

  // =========================================================
  // 🔄 1. LOAD SELECTED POLICY'S CURRENT CONTENT
  // =========================================================
  const fetchPolicy = async (type) => {
    setLoading(true);
    setStatusMsg({ text: '', type: '' });
    try {
      const res = await axios.get(`${API_BASE}/policies/${type}`);
      const p = res.data?.policy;
      if (p) {
        setTitle(p.title || '');
        setIntro(p.intro || '');
        setSections(Array.isArray(p.sections) && p.sections.length ? p.sections : [emptySection()]);
        setFooterNote(p.footerNote || '');
        setIsActive(p.isActive !== undefined ? p.isActive : true);
      }
    } catch (err) {
      // 404 means it doesn't exist yet — start with a blank form
      setTitle('');
      setIntro('');
      setSections([emptySection()]);
      setFooterNote('');
      setIsActive(true);
      if (err.response?.status !== 404) {
        setStatusMsg({ text: 'Failed to load policy: ' + err.message, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy(policyType);
  }, [policyType]);

  // =========================================================
  // ⚡ 2. SEED DEFAULT SHIPPING POLICY (only shown for 'shipping' type)
  // =========================================================
  const handleSeedDefault = async () => {
    try {
      setSaving(true);
      const token = getToken();
      const res = await axios.post(
        `${API_BASE}/policies/seed/shipping-default`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatusMsg({ text: res.data?.message || '✅ Seeded!', type: 'success' });
      fetchPolicy('shipping');
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.message || 'Seed failed.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // ✏️ 3. SECTION HELPERS
  // =========================================================
  const updateSection = (index, field, value) => {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const addSection = () => {
    setSections((prev) => [...prev, { ...emptySection(), order: prev.length }]);
  };

  const removeSection = (index) => {
    if (!window.confirm('Is section ko delete karna hai?')) return;
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const moveSection = (index, direction) => {
    setSections((prev) => {
      const newArr = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= newArr.length) return prev;
      [newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]];
      return newArr.map((s, i) => ({ ...s, order: i }));
    });
  };

  // =========================================================
  // 💾 4. SAVE POLICY
  // =========================================================
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg({ text: '', type: '' });

    try {
      const token = getToken();
      const payload = {
        title: title.trim(),
        intro: intro.trim(),
        sections: sections
          .filter((s) => s.content.trim())
          .map((s, idx) => ({ ...s, order: idx })),
        footerNote: footerNote.trim(),
        isActive
      };

      const res = await axios.put(`${API_BASE}/policies/${policyType}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStatusMsg({ text: res.data?.message || '✅ Saved!', type: 'success' });
    } catch (err) {
      setStatusMsg({ text: err.response?.data?.message || 'Save failed.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto', padding: '0 15px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ background: '#fff', border: '2px solid #0f172a', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>📄 Policy Page Editor</h2>

          <select
            value={policyType}
            onChange={(e) => setPolicyType(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontWeight: 700, background: '#fff' }}
          >
            {POLICY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {policyType === 'shipping' && (
          <button
            type="button"
            onClick={handleSeedDefault}
            disabled={saving}
            style={{ background: '#15803d', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', marginBottom: '18px' }}
          >
            ⚡ Load Default Shipping Policy Content
          </button>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading policy...</div>
        ) : (
          <form onSubmit={handleSave}>
            {/* Title */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Page Title *</label>
              <input
                type="text"
                placeholder="e.g. Shipping Policy"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', fontWeight: 700, fontSize: '1rem' }}
              />
            </div>

            {/* Intro */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                Intro Paragraph <span style={{ color: '#94a3b8', fontWeight: 500 }}>(basic HTML like &lt;strong&gt; allowed)</span>
              </label>
              <textarea
                placeholder="Opening paragraph shown right under the title..."
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>

            {/* Sections */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>Sections</label>
                <button
                  type="button"
                  onClick={addSection}
                  style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  ➕ Add Section
                </button>
              </div>

              {sections.map((section, idx) => (
                <div
                  key={idx}
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '12px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>Section {idx + 1}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" onClick={() => moveSection(idx, -1)} disabled={idx === 0} title="Move Up"
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 8px', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.4 : 1 }}>
                        ⬆️
                      </button>
                      <button type="button" onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1} title="Move Down"
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 8px', cursor: idx === sections.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === sections.length - 1 ? 0.4 : 1 }}>
                        ⬇️
                      </button>
                      <button type="button" onClick={() => removeSection(idx)} title="Delete Section"
                        style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer' }}>
                        🗑️
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Section heading (optional), e.g. Delivery coverage & timelines"
                    value={section.heading}
                    onChange={(e) => updateSection(idx, 'heading', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '5px', boxSizing: 'border-box', marginBottom: '8px', fontWeight: 700 }}
                  />

                  <textarea
                    placeholder="Section content... (basic HTML like <strong> allowed)"
                    value={section.content}
                    onChange={(e) => updateSection(idx, 'content', e.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: '5px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
                  />
                </div>
              ))}
            </div>

            {/* Footer Note */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Footer Note (Optional)</label>
              <textarea
                placeholder="Closing note shown at the bottom of the page..."
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>

            {/* Active toggle */}
            <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="policy-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="policy-active" style={{ fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
                Page is live (visible to customers)
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{ width: '100%', background: '#0f172a', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 800, fontSize: '0.95rem', cursor: saving ? 'wait' : 'pointer' }}
            >
              {saving ? 'Saving...' : '💾 Save Policy'}
            </button>

            {statusMsg.text && (
              <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', fontSize: '0.88rem', fontWeight: 700, background: statusMsg.type === 'success' ? '#dcfce7' : '#fee2e2', color: statusMsg.type === 'success' ? '#15803d' : '#b91c1c' }}>
                {statusMsg.text}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminPolicyEditor;