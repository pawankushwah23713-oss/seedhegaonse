import React, { useEffect, useState, useRef } from 'react';
import './ShippingPolicy.css';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const ShippingPolicy = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const containerRef = useRef(null);

  // 🟢 NEW: Policy content now comes from the backend (admin-editable) instead of being hardcoded
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // 🟢 NEW: Fetch the Shipping Policy content
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/policies/shipping`);
        const data = await res.json();
        if (res.ok && data.policy) {
          setPolicy(data.policy);
        } else {
          setLoadError(data.message || 'Shipping policy not available right now.');
        }
      } catch (err) {
        console.error('Failed to load shipping policy:', err);
        setLoadError('Failed to load shipping policy. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  useEffect(() => {
    // Scroll reveal animation observer — re-run whenever the fetched content changes
    // so newly rendered sections get the reveal effect too.
    if (!containerRef.current) return;
    const reveals = containerRef.current.querySelectorAll('.reveal');

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    reveals.forEach((el) => observer.observe(el));

    // Scroll to top button visibility
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [policy]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // 🟢 NEW: Loading state
  if (loading) {
    return (
      <div className="policy-page" ref={containerRef}>
        <main className="policy-container">
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            ⏳ Loading Shipping Policy...
          </div>
        </main>
      </div>
    );
  }

  // 🟢 NEW: Error / not-found state
  if (loadError || !policy) {
    return (
      <div className="policy-page" ref={containerRef}>
        <main className="policy-container">
          <h1 className="page-title reveal">Shipping Policy</h1>
          <div className="policy-card">
            <div className="policy-section reveal">
              <p>{loadError || 'Shipping policy content is not available right now. Please check back soon.'}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="policy-page" ref={containerRef}>
      <main className="policy-container">
        <h1 className="page-title reveal">{policy.title}</h1>

        <div className="policy-card">
          {/* Intro paragraph (🟢 now dynamic) */}
          {policy.intro && (
            <div className="policy-section reveal">
              <p dangerouslySetInnerHTML={{ __html: policy.intro }} />
            </div>
          )}

          {/* 🟢 Dynamic sections, admin-editable */}
          {Array.isArray(policy.sections) &&
            policy.sections.map((section, idx) => (
              <div className="policy-section reveal" key={idx}>
                {section.heading && <h2>{section.heading}</h2>}
                <p dangerouslySetInnerHTML={{ __html: section.content }} />
              </div>
            ))}

          {/* Footer note (🟢 now dynamic) */}
          {policy.footerNote && (
            <div className="policy-section reveal">
              <p className="policy-footer-note">{policy.footerNote}</p>
            </div>
          )}
        </div>
      </main>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: 'none',
            background: '#881337',
            color: '#fff',
            fontSize: '1.2rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(136,19,55,0.35)',
            zIndex: 999
          }}
        >
          ↑
        </button>
      )}
    </div>
  );
};

export default ShippingPolicy;