import React, { useState, useEffect } from 'react';
import './CouponLoyaltyPolicy.css';

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
  title: 'Coupon & Loyalty Policy',
  introText:
    'At **Seedhe Gaon Se**, we value every customer and may, at our sole discretion, offer promotional coupons, loyalty points, cash back offers, referral rewards, festive benefits or other promotional incentives from time to time. Such offers are intended solely to reward genuine customers and enhance their shopping experience.',
  sections: [
    { heading: '1. Nature of promotional benefits', content: 'Coupons, loyalty points and rewards are promotional benefits with **no cash value**, **are non-transferable**, and cannot be exchanged for cash, refunded or combined with any other offer unless expressly stated. Unless otherwise specified, only **one coupon or promotional offer** may be redeemed per order.' },
    { heading: '2. Validity & usage conditions', content: 'Each coupon, reward or loyalty benefit is subject to its own validity period, minimum order value, eligible products and other applicable terms. Expired, altered, duplicated or misused coupons shall be deemed invalid and will not be accepted under any circumstances.' },
    { heading: '3. Fraud prevention & account fairness', content: '**Seedhe Gaon Se** reserves the right to modify, suspend, reject or cancel any coupon, loyalty points or reward in cases of suspected fraud, misuse, duplicate accounts, technical errors or violation of these Terms & Conditions, without prior notice or liability.' },
    { heading: '4. Right of discontinuation', content: 'The Company further reserves the absolute right to introduce, modify or discontinue any loyalty programme, reward scheme or promotional campaign at any time without assigning any reason. Participation in such programmes shall constitute acceptance of this Policy and the Company\u2019s decision regarding all promotional benefits shall be final and binding.' }
  ]
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

const CouponLoyaltyPolicy = () => {
  const [policy, setPolicy] = useState(DEFAULT_POLICY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/coupon-loyalty-policy`);
        const data = await res.json();
        if (!cancelled && res.ok && data?.policy) {
          setPolicy(data.policy);
        }
      } catch (err) {
        console.error('Unable to load coupon & loyalty policy:', err);
        // keep DEFAULT_POLICY fallback already in state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const sections = policy.sections || [];

  return (
    <div className="loyalty-page-wrapper">
      <div className="loyalty-container">
        <h1 className="loyalty-title">{loading ? 'Coupon & Loyalty Policy' : (policy.title || 'Coupon & Loyalty Policy')}</h1>

        <div className="loyalty-card">
          {/* Introduction */}
          <section className="loyalty-intro">
            <p dangerouslySetInnerHTML={renderWithBold(policy.introText)} />
          </section>

          {/* Dynamic Sections */}
          {sections.map((sec, idx) => (
            <section
              className={`loyalty-section ${idx === sections.length - 1 ? 'last-section' : ''}`}
              key={idx}
            >
              <h2 className="section-heading">{sec.heading}</h2>
              <p className="section-content" dangerouslySetInnerHTML={renderWithBold(sec.content)} />
            </section>
          ))}
        </div>
      </div>

      {/* Floating WhatsApp Button */}

    </div>
  );
};

export default CouponLoyaltyPolicy;