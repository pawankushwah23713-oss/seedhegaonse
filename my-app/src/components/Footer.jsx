import React, { useState } from 'react';
import './Footer.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

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
              <li><a href="#wishlist">Wish List</a></li>
              <li><a href="#track-order">Track Order</a></li>
              <li><a href="#address">Address</a></li>
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

          {/* Social Media Circular Badges */}
          <div className="social-icons-group">
            <a href="https://www.instagram.com/seedhegaonse/" target="_blank" rel="noreferrer" className="social-circle-btn" aria-label="Instagram">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="https://www.facebook.com/profile.php?id=61570758547955" target="_blank" rel="noreferrer" className="social-circle-btn" aria-label="Facebook">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
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