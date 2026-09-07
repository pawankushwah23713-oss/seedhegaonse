import React, { useState, useEffect } from 'react';
import './CancellationPolicy.css';

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
  title: 'Cancellation Policy',
  introText:
    "At **Seedhe Gaon Se**, our products are highly perishable, prepared in small batches, and freshly procured from our trusted village Halwai's based on your order confirmation. Because procurement and preparation begin almost immediately, cancellations are subject to strict terms.",
  sections: [
    { heading: '1. Cancellation timeframe', content: 'Customers can request an order cancellation **within 30 minutes** of placing the order or before the order status moves to "Processing" / "Dispatched" (whichever is earlier). Once procurement begins or the batch is packed, we cannot accept any cancellation requests.' },
    { heading: '2. How to request cancellation', content: 'To request a cancellation within the permitted window, please contact our customer support team immediately via our designated helpline or support email with your active Order ID. Requests made outside business hours or through social media comments may not be processed in time.' },
    { heading: '3. Cancellations by Seedhe Gaon Se', content: 'We reserve the right to cancel any order due to unforeseen circumstances, including but not limited to: non-availability of fresh stock from the Halwai, operational delivery constraints within your region in Delhi NCR, extreme weather conditions, or incorrect pricing/product details on the website. In such cases, a 100% refund will be initiated to your original payment mode.' },
    { heading: '4. Failed deliveries as cancellations', content: "If an order cannot be delivered due to customer absence, a wrong phone number, an incorrect address, or refusal to accept the package, the order will be marked as cancelled from the customer's end. Due to the perishable nature of our products, **no refunds** will be issued for such cases." },
    { heading: '5. Refund processing for cancelled orders', content: 'For valid cancellations approved by our support desk, the payment will be refunded to your original source account within **7–10 business days**, subject to standard bank processing guidelines.' }
  ],
  footerNote: 'By confirming your order with Seedhe Gaon Se, you explicitly agree to follow this Cancellation Policy.'
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

const CancellationPolicy = () => {
  const [policy, setPolicy] = useState(DEFAULT_POLICY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/cancellation-policy`);
        const data = await res.json();
        if (!cancelled && res.ok && data?.policy) {
          setPolicy(data.policy);
        }
      } catch (err) {
        console.error('Unable to load cancellation policy:', err);
        // keep DEFAULT_POLICY fallback already in state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="policy-page-wrapper">
      <div className="policy-container">
        <h1 className="policy-title">{loading ? 'Cancellation Policy' : (policy.title || 'Cancellation Policy')}</h1>

        <div className="policy-card">
          {/* Introduction */}
          <section className="policy-intro">
            <p dangerouslySetInnerHTML={renderWithBold(policy.introText)} />
          </section>

          {/* Dynamic Sections */}
          {(policy.sections || []).map((sec, idx) => (
            <section className="policy-section" key={idx}>
              <h2 className="section-heading">{sec.heading}</h2>
              <p className="section-content" dangerouslySetInnerHTML={renderWithBold(sec.content)} />
            </section>
          ))}

          {/* Footer Agreement Note */}
          {policy.footerNote && (
            <div className="policy-agreement-footer">
              <p>{policy.footerNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CancellationPolicy;