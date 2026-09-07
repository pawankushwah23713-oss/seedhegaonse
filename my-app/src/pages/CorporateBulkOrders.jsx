import React, { useState, useEffect } from 'react';
import './CorporateBulkOrders.css';

const getBaseApiUrl = () => {
  const envUrl = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
    ? process.env.REACT_APP_API_URL
    : (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL);
  if (!envUrl) return '/api';
  const clean = envUrl.trim().replace(/\/auth\/?$/, '').replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const API_BASE = getBaseApiUrl();

// Fallback so the page never looks broken while the API loads (or if it fails)
const DEFAULT_POLICY = {
  title: 'Corporate & Bulk Orders',
  introText:
    "At **Seedhe Gaon Se**, we proudly cater to corporate gifting, weddings, festivals, family functions, and bulk celebrations with authentic traditional sweets sourced directly from renowned village Halwai's.",
  sections: [
    { heading: 'Advance booking & availability', content: 'To ensure freshness and timely procurement, **bulk orders should preferably be placed at least 4–5 days in advance**. While we strive to accommodate urgent requests, acceptance of last-minute orders depends entirely on product availability and production capacity.' },
    { heading: 'Minimum order quantity & pricing', content: 'A **minimum order quantity (MOQ)** may apply to avail bulk pricing and special discounts. Discounts are offered based on the order quantity, product selection, delivery location, and seasonal demand.' },
    { heading: 'Payment & cancellation terms', content: 'For all corporate and bulk orders, **complete 100% advance payment is mandatory** to confirm the booking. Production and procurement commence only after the advance amount is received. Once the order enters the production or procurement stage, it cannot be cancelled, modified, or refunded.' },
    { heading: 'Product characteristics', content: 'As our sweets are handcrafted using traditional methods and fresh ingredients, **minor variations in colour, texture, size, or weight are natural** and do not constitute a manufacturing defect.' },
    { heading: 'Delivery responsibilities', content: 'The customer is responsible for providing accurate delivery details and ensuring the availability of the recipient at the time of delivery. Additional delivery attempts, address changes after dispatch, or special delivery requests may attract extra logistics charges.' },
    { heading: 'Branding & customization', content: 'For personalised branding, customised gift boxes, printed sleeves, greeting cards, or corporate packaging, separate charges may apply and such customised orders are non-returnable and non-refundable.' }
  ],
  footerNote:
    'Our commitment is to make your special occasion memorable by delivering authentic, fresh, and premium-quality sweets crafted with care and tradition.'
};

// Escape HTML first, then allow ONLY **bold** markdown to become <strong> — safe from injection
const escapeHtml = (str) =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const renderWithBold = (text) => {
  const escaped = escapeHtml(text);
  const withBold = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return { __html: withBold };
};

const CorporateBulkOrders = () => {
  const [policy, setPolicy] = useState(DEFAULT_POLICY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/corporate-bulk-orders`);
        const data = await res.json();
        if (!cancelled && res.ok && data?.policy) {
          setPolicy(data.policy);
        }
      } catch (err) {
        console.error('Unable to load corporate & bulk orders policy:', err);
        // keep DEFAULT_POLICY fallback already in state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="corporate-page-wrapper">
      <div className="corporate-container">
        <h1 className="corporate-title">{loading ? 'Corporate & Bulk Orders' : (policy.title || 'Corporate & Bulk Orders')}</h1>

        <div className="corporate-card">
          {/* Introduction */}
          <section className="corporate-intro">
            <p dangerouslySetInnerHTML={renderWithBold(policy.introText)} />
          </section>

          {/* Dynamic Sections */}
          {(policy.sections || []).map((sec, idx) => (
            <section className="corporate-section" key={idx}>
              <h2 className="section-heading">{sec.heading}</h2>
              <p className="section-content" dangerouslySetInnerHTML={renderWithBold(sec.content)} />
            </section>
          ))}

          {/* Footer Note */}
          {policy.footerNote && (
            <div className="corporate-footer">
              <p><em>{policy.footerNote}</em></p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Buttons */}

    </div>
  );
};

export default CorporateBulkOrders;