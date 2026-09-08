import React, { useState, useEffect } from 'react';
import './Footer.css';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://orange-ape-497824.hostingersite.com/api');

// Same icon set used in the Admin Social Links manager, so the footer icons
// always match whatever is shown in the admin preview.
const SOCIAL_ICONS = {
  instagram: <path d="M12 2c2.7 0 3 .01 4.1.06 1.1.05 1.85.23 2.5.48.68.27 1.26.62 1.83 1.19.57.57.92 1.15 1.19 1.83.25.65.43 1.4.48 2.5.05 1.1.06 1.4.06 4.1s-.01 3-.06 4.1c-.05 1.1-.23 1.85-.48 2.5a4.9 4.9 0 0 1-1.19 1.83 4.9 4.9 0 0 1-1.83 1.19c-.65.25-1.4.43-2.5.48-1.1.05-1.4.06-4.1.06s-3-.01-4.1-.06c-1.1-.05-1.85-.23-2.5-.48a4.9 4.9 0 0 1-1.83-1.19 4.9 4.9 0 0 1-1.19-1.83c-.25-.65-.43-1.4-.48-2.5C2.01 15 2 14.7 2 12s.01-3 .06-4.1c.05-1.1.23-1.85.48-2.5.27-.68.62-1.26 1.19-1.83A4.9 4.9 0 0 1 5.56 1.38c.65-.25 1.4-.43 2.5-.48C9.16 2.01 9.46 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-8.4a1.17 1.17 0 1 1 0-2.34 1.17 1.17 0 0 1 0 2.34z" />,
  facebook: <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />,
  pinterest: <path d="M12 2a10 10 0 0 0-3.64 19.32c-.05-.83-.09-2.1.02-3 .1-.44.65-2.78.65-2.78s-.17-.33-.17-.83c0-.78.45-1.36 1.02-1.36.48 0 .71.36.71.79 0 .48-.31 1.2-.46 1.87-.14.56.28 1.02.83 1.02 1 0 1.77-1.05 1.77-2.58 0-1.35-.97-2.29-2.35-2.29-1.6 0-2.54 1.2-2.54 2.44 0 .48.18.99.42 1.27a.17.17 0 0 1 .04.16l-.16.64c-.02.11-.08.13-.19.08-.71-.33-1.15-1.36-1.15-2.19 0-1.78 1.29-3.42 3.73-3.42 1.96 0 3.48 1.4 3.48 3.26 0 1.94-1.22 3.51-2.92 3.51-.57 0-1.11-.3-1.29-.64l-.35 1.34c-.13.49-.47 1.1-.7 1.47A10 10 0 1 0 12 2z" />,
  youtube: <path d="M21.8 8.1s-.2-1.5-.8-2.1c-.8-.8-1.7-.8-2.1-.9C15.9 5 12 5 12 5h0s-3.9 0-6.9.1c-.4 0-1.3.1-2.1.9-.6.6-.8 2.1-.8 2.1S2 9.8 2 11.6v1.7c0 1.8.2 3.5.2 3.5s.2 1.5.8 2.1c.8.8 1.9.8 2.3.9C6.8 19.9 12 20 12 20s3.9 0 6.9-.2c.4 0 1.3-.1 2.1-.9.6-.6.8-2.1.8-2.1s.2-1.7.2-3.5v-1.7c0-1.8-.2-3.5-.2-3.5zM9.9 15V8.9l5.4 3.05z" />,
  twitter: <path d="M18.9 3H21.7l-6.1 6.98L22.8 21h-5.6l-4.4-5.75L7.7 21H4.9l6.5-7.46L4.2 3h5.75l3.98 5.26zm-1 16.2h1.55L8.14 4.7H6.47z" />,
  whatsapp: <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.15 8.15 0 0 1-1.25-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23z" />,
  linkedin: <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.11 20.45H3.56V9h3.55z" />,
  custom: <path d="M13.06 8.11L9.17 12l3.89 3.89-1.42 1.42L6.34 12l5.3-5.31zM10.94 15.89L14.83 12l-3.89-3.89 1.42-1.42L18.66 12l-5.3 5.31z" />
};

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [socialLinks, setSocialLinks] = useState([]);

  // 🟢 Check if user is logged in from LocalStorage
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token') || 
                      localStorage.getItem('userToken') || 
                      localStorage.getItem('authToken');
        const user = localStorage.getItem('user') || 
                     localStorage.getItem('currentUser');
        
        setIsLoggedIn(Boolean(token || user));
      } catch (err) {
        setIsLoggedIn(false);
      }
    };

    checkAuth();
    // Listen for storage changes across tabs/login events
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // 🟢 Load active social links from the backend for the footer icon row
  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        const res = await fetch(`${API_BASE}/social-links`);
        const data = await res.json();
        if (res.ok) setSocialLinks(data);
      } catch (err) {
        // Fail silently — footer still renders fine without the icons
        console.error('Failed to load social links:', err.message);
      }
    };

    fetchSocialLinks();
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail('');
      }, 3000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer-wrapper">
      <div className="footer-main-container">
        
        {/* ================= TOP 4 COLUMNS ================= */}
        <div className="footer-top-grid">
          
          {/* Column 1: POLICIES */}
          <div className="footer-col">
            <h4 className="footer-title">POLICIES</h4>
            <ul className="footer-list">
              <li><a href="/shipping-policy">Shipping Policy</a></li>
              <li><a href="/return-refund">Return & Refund Policy</a></li>
              <li><a href="/cancellation-policy">Cancellation Policy</a></li>
              <li><a href="/quality-policy">Quality Policy</a></li>
              <li><a href="/loyalty-rewards">Coupon Loyalty Points & Rewards Policy</a></li>
              <li><a href="/bulk-orders">Corporate Wedding & Bulk Order Policy</a></li>
            </ul>

            {/* Food Delivery Partner Badges */}
            <div className="delivery-partners">
              <a href="https://www.swiggy.com/city/delhi/seedhe-gaon-se-janakpuri-rest1400302?source=sharing" target="_blank" rel="noopener noreferrer">
                <div className="partner-badge swiggy-badge" title="Order on Swiggy">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5c0 .83-.67 1.5-1.5 1.5S10 17.33 10 16.5V11c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5.5zm0-8c0 .83-.67 1.5-1.5 1.5S10 9.33 10 8.5 10.67 7 11.5 7s1.5.67 1.5 1.5z"/>
                  </svg>
                  <span>swiggy</span>
                </div>
              </a>
              <a href="https://www.zomato.com/delhi/seedhe-gaon-se-janakpuri" target="_blank" rel="noopener noreferrer">
                <div className="partner-badge zomato-badge" title="Order on Zomato">
                  <span>zomato</span>
                </div>
              </a>
            </div>
          </div>

          {/* Column 2: SPECIAL */}
          <div className="footer-col">
            <h4 className="footer-title">SPECIAL</h4>
            <ul className="footer-list">
              <li><a href="/featured">Featured Products</a></li>
              <li><a href="/latest">Latest Products</a></li>
              <li><a href="/best-selling">Best Selling Product</a></li>
              <li><a href="/top-rated">Top Rated Product</a></li>
            </ul>
          </div>

          {/* Column 3: ACCOUNT & SHIPPING INFO */}
          <div className="footer-col">
            <h4 className="footer-title">ACCOUNT & SHIPPING INFO</h4>
            <ul className="footer-list">
              <li><a href="/profile">Profile Info</a></li>
              
              {/* 🟢 MY ORDERS BUTTON (Visible only when user is Logged In) */}
              
              <li><a href="/wishlist">Wish List</a></li>
              <li><a href="/my-orders">Track Order</a></li>
              <li><a href="/contact-us">Address</a></li>
            </ul>
          </div>

          {/* Column 4: NEWSLETTER */}
          <div className="footer-col newsletter-col">
            <h4 className="footer-title">NEWS LETTER</h4>
            <p className="newsletter-subtitle">Subscribe to our new channel to get latest updates</p>
            
            <form className="newsletter-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Your Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit">Subscribe</button>
            </form>
            {subscribed && <span className="subscribe-success">✓ Subscribed successfully!</span>}
          </div>

        </div>

        {/* ================= MIDDLE CONVERSATION & ADDRESS BAR ================= */}
        <div className="footer-middle-bar">
          
          <div className="conversation-section">
            <h4 className="footer-title inline-title">Start a conversation</h4>
            <div className="contact-links-group">
              <a href="tel:+919315911105" className="contact-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                +91 9315911105
              </a>
              <a href="mailto:info@seedhegaonse.in" className="contact-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                info@seedhegaonse.in
              </a>
              <a href="#support" className="contact-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Support Ticket
              </a>
            </div>
          </div>

          <div className="address-section">
            <h4 className="footer-title inline-title">Address</h4>
            <p className="address-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              A2/3, Janakpuri, New Delhi-110058
            </p>
          </div>

        </div>

      </div>

      {/* ================= BOTTOM BAR ================= */}
      <div className="footer-bottom-bar">
        <div className="footer-bottom-container">
          
          <div className="copyright-text">
            Saaryva Kart | CopyRight@2026
          </div>

          {/* 🟢 Social Media Circular Badges — now driven by the backend
              (Admin > Social Links Manager). Add/edit/reorder/hide links
              there and they update here automatically. */}
          <div className="social-icons-group">
            {socialLinks.map((link) => (
              <a
                key={link._id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="social-circle-btn"
                aria-label={link.platform === 'custom' ? (link.customLabel || 'Social link') : link.platform}
                title={link.platform === 'custom' ? (link.customLabel || 'Social link') : undefined}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  {SOCIAL_ICONS[link.platform] || SOCIAL_ICONS.custom}
                </svg>
              </a>
            ))}
          </div>

          <div className="bottom-links">
            <a href="/terms">Terms & conditions</a>
            <a href="/privacy">Privacy policy</a>
          </div>

        </div>
      </div>

    </footer>
  );
};

export default Footer;