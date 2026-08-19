import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

// 🟢 Unified API URL (Local / Render dono ke sath auto-detect)
const API_URL = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) 
  ? (process.env.REACT_APP_API_URL.endsWith('/auth') ? process.env.REACT_APP_API_URL : `${process.env.REACT_APP_API_URL}/auth`)
  : (import.meta.env?.VITE_API_URL 
      ? (import.meta.env.VITE_API_URL.endsWith('/auth') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/auth`)
      : 'https://seedhegaonse-1.onrender.com/api/auth'); // Agar production par hain to yahan Render URL daalein

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
        // 🟢 LOGIN API CALL (Sending both 'email' and 'identifier' for 100% backend compatibility)
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

        // 🟢 Store Token & User in LocalStorage safely for all components
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
        // 🟢 SIGNUP API CALL
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
    <div className="auth-page-container">
      <div className="auth-card fade-slide-down">
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => handleTabSwitch(true)}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => handleTabSwitch(false)}
          >
            Create Account
          </button>
        </div>

        <h2 className="auth-title">
          {isLogin ? 'Welcome Back' : 'Join Seedhe Gaon Se'}
        </h2>
        <p className="auth-subtitle">
          {isLogin
            ? 'Sign in to access your orders and sweets cart'
            : 'Get flat ₹50 OFF on your first authentic regional sweet order'}
        </p>

        {error && <div className="auth-alert error">{error}</div>}
        {successMsg && <div className="auth-alert success">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form-body">
          {!isLogin && (
            <div className="auth-input-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Ramesh Kumar"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="auth-input-group">
            <label>{isLogin ? 'Email Address or Mobile Number' : 'Email Address'}</label>
            <input
              type="text"
              name="email"
              placeholder={isLogin ? "you@example.com or 9876543210" : "you@example.com"}
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {!isLogin && (
            <div className="auth-input-group">
              <label>Mobile Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
                maxLength="10"
                required
              />
            </div>
          )}

          <div className="auth-input-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="auth-input-group">
              <label>Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <button type="submit" className="auth-primary-btn" disabled={loading}>
            {loading ? (
              <span className="btn-spinner">Processing...</span>
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="auth-redirect-text">
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <span onClick={() => handleTabSwitch(false)}>Create one</span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span onClick={() => handleTabSwitch(true)}>Sign in</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Auth;