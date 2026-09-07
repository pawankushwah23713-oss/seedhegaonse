import React, { useEffect, useState, useRef } from 'react';
import './ReturnRefundPolicy.css';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://orange-ape-497824.hostingersite.com/api');

// ⚠️ No hardcoded policy text anywhere in this file. Every piece of content
// comes from the backend. If nothing is saved yet, the page shows a plain
// "content coming soon" message instead of any baked-in copy.
const emptyContent = {
  pageTitle: '',
  introText: '',
  policyPoints: [],
  footerText: ''
};

const ReturnRefundPolicy = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [content, setContent] = useState(emptyContent);
  const [loading, setLoading] = useState(true);
  const [hasContent, setHasContent] = useState(false);
  const containerRef = useRef(null);

  // Fetch policy content from the backend — renders exactly what's saved.
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/return-refund-policy`);

        if (res.status === 404) {
          setContent(emptyContent);
          setHasContent(false);
          return;
        }

        if (!res.ok) return;

        const data = await res.json();
        setContent({
          pageTitle: data.pageTitle || '',
          introText: data.introText || '',
          policyPoints: Array.isArray(data.policyPoints) ? data.policyPoints : [],
          footerText: data.footerText || ''
        });
        setHasContent(true);
      } catch (err) {
        console.error('Failed to load Return & Refund Policy content:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  // Scroll reveal animation observer — re-runs after content loads so the
  // dynamically rendered points/paragraphs get observed too.
  // (Also fixed to watch both `.reveal` and `.kreveal`, matching the classes
  // actually used further down — the bullet points use `.kreveal`.)
  useEffect(() => {
    if (!containerRef.current) return;
    const reveals = containerRef.current.querySelectorAll('.reveal, .kreveal');

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

    return () => observer.disconnect();
  }, [content]);

  // Scroll to top visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (loading) {
    return (
      <div className="kpolicy-page" ref={containerRef}>
        <main className="kpolicy-container">
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
            Loading...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="kpolicy-page" ref={containerRef}>
      <main className="kpolicy-container">
        {content.pageTitle && <h1 className="kpage-title reveal">{content.pageTitle}</h1>}

        <div className="kpolicy-card">
          {!hasContent && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              Content coming soon.
            </div>
          )}

          {/* Top Intro Section */}
          {content.introText && (
            <div className="kpolicy-intro reveal">
              <p>{content.introText}</p>
            </div>
          )}

          {content.introText && content.policyPoints.length > 0 && (
            <hr className="kpolicy-divider reveal" />
          )}

          {/* Bullet Points Section */}
          {content.policyPoints.length > 0 && (
            <ul className="kpolicy-list">
              {content.policyPoints.map((point, idx) => (
                <li className="kreveal" key={idx}>
                  {point}
                </li>
              ))}
            </ul>
          )}

          {content.policyPoints.length > 0 && content.footerText && (
            <hr className="kpolicy-divider reveal" />
          )}

          {/* Bottom Agreement Statement */}
          {content.footerText && (
            <div className="kpolicy-footer reveal">
              <p>{content.footerText}</p>
            </div>
          )}
        </div>
      </main>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fab scroll-top-btn"
          title="Scroll to top"
          style={{ position: 'fixed', bottom: '20px', right: '20px' }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="#ffffff">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ReturnRefundPolicy;1