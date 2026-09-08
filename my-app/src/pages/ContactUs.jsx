import React, { useState, useEffect } from 'react';
import './ContactUs.css';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://orange-ape-497824.hostingersite.com/api');

// Same icon set used in the Admin Social Links manager and the Footer,
// so icons stay consistent everywhere they appear on the site.
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

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState({ type: '', text: '' });
  const [socialLinks, setSocialLinks] = useState([]);

  // 🟢 Load active social links from the backend (Admin > Social Links Manager)
  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        const res = await fetch(`${API_BASE}/social-links`);
        const data = await res.json();
        if (res.ok) setSocialLinks(data);
      } catch (err) {
        // Fail silently — page still renders fine without the icons
        console.error('Failed to load social links:', err.message);
      }
    };

    fetchSocialLinks();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponseMsg({ type: '', text: '' });

    try {
      const response = await fetch('https://seedhegaonse-1.onrender.com/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setResponseMsg({ type: 'success', text: 'Message sent successfully!' });
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setResponseMsg({ type: 'error', text: data.message || 'Failed to send message.' });
      }
    } catch (error) {
      setResponseMsg({ type: 'error', text: 'Server error. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page-container">
      <h1 className="main-title">Contact Us</h1>

      <div className="contact-wrapper">
        {/* Left Section - Contact Info */}
        <div className="contact-card info-card">
          <h2 className="section-title-left">Contact Information</h2>

          <div className="info-list">
            <div className="info-item">
              <div className="icon maroon-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>
              <div className="info-text">
                <span className="label">Address</span>
                <p className="val">A2/3, Janakpuri, New Delhi-110058</p>
              </div>
            </div>

            <div className="info-item">
              <div className="icon maroon-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              </div>
              <div className="info-text">
                <span className="label">Phone number</span>
                <p className="val">+91 9315911105</p>
              </div>
            </div>

            <div className="info-item">
              <div className="icon maroon-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </div>
              <div className="info-text">
                <span className="label">Email</span>
                <p className="val">info@seedhegaonse.in</p>
              </div>
            </div>
          </div>

          {/* Timings Banner */}
          <div className="timings-banner">
            <div className="clock-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className="timings-text">
              <div className="sub-head">CUSTOMER CARE TIMINGS</div>
              <div className="time">9:00 AM – 9:00 PM</div>
            </div>
          </div>

          {/* 🟢 Social Icons — now driven by the backend (Admin > Social Links
              Manager). Add/edit/reorder/hide links there and they update here
              automatically, same as the footer. */}
          <div className="social-icons">
            {socialLinks.map((link) => (
              <a
                key={link._id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                aria-label={link.platform === 'custom' ? (link.customLabel || 'Social link') : link.platform}
                title={link.platform === 'custom' ? (link.customLabel || 'Social link') : undefined}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#871a1a">
                  {SOCIAL_ICONS[link.platform] || SOCIAL_ICONS.custom}
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="contact-card form-card">
          <h2 className="section-title-right">Send us a message</h2>

          {responseMsg.text && (
            <div className={`alert-box ${responseMsg.type}`}>
              {responseMsg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Your name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="johndoe@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Your phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Contact Number"
                  required
                />
              </div>

              <div className="form-group">
                <label>Subject:</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Short title"
                  required
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>Message</label>
              <textarea
                name="message"
                rows="6"
                value={formData.message}
                onChange={handleChange}
                placeholder=""
                required
              ></textarea>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>

     
    </div>
  );
};

export default ContactUs;