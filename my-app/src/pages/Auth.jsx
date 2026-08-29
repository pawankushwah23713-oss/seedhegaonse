import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import './Auth.css';

// Unified API URL (Auto-detects Local and Render environments)
const API_URL = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) 
  ? (process.env.REACT_APP_API_URL.endsWith('/auth') ? process.env.REACT_APP_API_URL : `${process.env.REACT_APP_API_URL}/auth`)
  : (import.meta.env?.VITE_API_URL 
      ? (import.meta.env.VITE_API_URL.endsWith('/auth') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/auth`)
      : 'https://seedhegaonse-1.onrender.com/api/auth'); // Production fallback API URL

const Auth = ({ onLoginSuccess }) => {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleTabSwitch = (loginMode) => {
    setIsLogin(loginMode);
    setError('');
    setSuccessMsg('');
    setShowPassword(false);
    setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const validateForm = () => {
    if (isLogin) {
      if (!formData.email.trim() || !formData.password.trim()) {
        setError('Please fill in both Email/Mobile and Password.');
        return false;
      }
    } else {
      if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.password.trim()) {
        setError('Please fill in all required fields.');
        return false;
      }

      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        setError('Please enter a valid 10-digit mobile number.');
        return false;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match!');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        // LOGIN API CALL (Sends both 'email' and 'identifier' for backend compatibility)
        const response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email.trim(),
            identifier: formData.email.trim(),
            password: formData.password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Login failed! Please check your credentials.');
        }

        // Store token and user data in localStorage for application-wide use
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('currentUser', JSON.stringify(data.user));
        }

        if (onLoginSuccess) {
          onLoginSuccess(data.user || data);
        }

        // Role-based Navigation
        if (data.user?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }

      } else {
        // SIGNUP API CALL
        const response = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            password: formData.password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Registration failed! Email/Mobile might already exist.');
        }

        setSuccessMsg('Account created successfully! Switching to Sign In...');
        const registeredEmail = formData.email.trim();

        setTimeout(() => {
          setIsLogin(true);
          setSuccessMsg('Account created! Please enter your password to Sign In.');
          setFormData({
            name: '',
            email: registeredEmail,
            phone: '',
            password: '',
            confirmPassword: ''
          });
        }, 1200);
      }
    } catch (err) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError('Unable to connect to Server. Please ensure Node.js backend is running.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sga-auth-page">
      <div className="sga-auth-shell">

        {/* ============ LEFT: BRAND PANEL ============ */}
        <aside className="sga-brand-panel">
          <div className="sga-brand-top">
            <div className="sga-logo-seal">
              <img src={logoImg} alt="Seedhe Gaon Se" />
            </div>
            <h1 className="sga-brand-name">Seedhe Gaon Se</h1>
            <span className="sga-brand-tagline">Your Gateway to Pure Taste</span>
          </div>

          <div className="sga-brand-rule">
            <span></span>
            <em>Since the village kitchen</em>
            <span></span>
          </div>

          <ul className="sga-brand-points">
            <li>
              <strong>Bilona Desi Ghee</strong>
              
            </li>
            <li>
              <strong>Zero Preservatives</strong>
              
            </li>
            <li>
              <strong>Same Day Delivery</strong>
            
            </li>
          </ul>

          <p className="sga-brand-footnote">
            Direct from the gaon, packed with tradition.
          </p>
        </aside>

        {/* ============ RIGHT: FORM PANEL ============ */}
        <section className="sga-form-panel">

          {/* Mobile-only compact brand header */}
          <div className="sga-mobile-brand">
            <img src={logoImg} alt="Seedhe Gaon Se" />
            <div>
              <span className="sga-mobile-brand-name">Seedhe Gaon Se</span>
              <span className="sga-mobile-brand-tag">Your Gateway to Pure Taste</span>
            </div>
          </div>

          <div className="sga-tabs">
            <button
              type="button"
              className={`sga-tab ${isLogin ? 'sga-active' : ''}`}
              onClick={() => handleTabSwitch(true)}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`sga-tab ${!isLogin ? 'sga-active' : ''}`}
              onClick={() => handleTabSwitch(false)}
            >
              Create Account
            </button>
          </div>

          <h2 className="sga-title">
            {isLogin ? 'Welcome Back' : 'Seedhe Gaon Se'}
          </h2>

          {error && (
            <div className="sga-alert sga-alert-error">
              <span className="sga-alert-icon">!</span>
              {error}
            </div>
          )}
          {successMsg && (
            <div className="sga-alert sga-alert-success">
              <span className="sga-alert-icon">✓</span>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="sga-form">
            {!isLogin && (
              <div className="sga-field">
                <label htmlFor="sga-name">Full Name</label>
                <input
                  id="sga-name"
                  type="text"
                  name="name"
                  placeholder="Ramesh Kumar"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>
            )}

            <div className="sga-field">
              <label htmlFor="sga-email">{isLogin ? 'Email or Mobile Number' : 'Email Address'}</label>
              <input
                id="sga-email"
                type="text"
                name="email"
                placeholder={isLogin ? 'you@example.com or 9876543210' : 'you@example.com'}
                value={formData.email}
                onChange={handleChange}
                autoComplete={isLogin ? 'username' : 'email'}
                required
              />
            </div>

            {!isLogin && (
              <div className="sga-field">
                <label htmlFor="sga-phone">Mobile Number</label>
                <div className="sga-phone-wrap">
                  <span className="sga-phone-prefix">+91</span>
                  <input
                    id="sga-phone"
                    type="tel"
                    name="phone"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength="10"
                    inputMode="numeric"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>
            )}

            <div className="sga-field">
              <label htmlFor="sga-password">Password</label>
              <div className="sga-password-wrap">
                <input
                  id="sga-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  className="sga-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="sga-field">
                <label htmlFor="sga-confirm">Confirm Password</label>
                <input
                  id="sga-confirm"
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>
            )}

            <button type="submit" className="sga-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="sga-spinner"></span>
                  Processing...
                </>
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="sga-redirect">
            {isLogin ? (
              <>
                Don&apos;t have an account?{' '}
                <span onClick={() => handleTabSwitch(false)}>Create one</span>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <span onClick={() => handleTabSwitch(true)}>Sign in</span>
              </>
            )}
          </p>

          <div className="sga-secure-note">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Your details are encrypted and never shared
          </div>
        </section>
      </div>
    </div>
  );
};

export default Auth;