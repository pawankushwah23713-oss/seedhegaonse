import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const Login = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState(''); // Email ya Phone Number
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!identifier || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    // LocalStorage se users get karna
    const existingUsers = JSON.parse(localStorage.getItem('users')) || [];

    // Matching User dhundna (Email/Phone aur Password dono match hone chahiye)
    const foundUser = existingUsers.find(
      (user) =>
        (user.email === identifier || user.phone === identifier) &&
        user.password === password
    );

    if (!foundUser) {
      setError('Invalid Email/Mobile Number or Password!');
      return;
    }

    // Current logged-in user ko localStorage me set karna
    localStorage.setItem('currentUser', JSON.stringify(foundUser));

    if (onLoginSuccess) {
      onLoginSuccess(foundUser.name);
    }

    navigate('/');
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to your Seedhe Gaon Se account</p>

        {error && <div className="auth-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form-body">
          <div className="auth-input-group">
            <label>Email Address or Mobile Number</label>
            <input
              type="text"
              placeholder="you@example.com or 9876543210"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div className="auth-input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="auth-primary-btn">Sign In</button>
        </form>

        <p className="auth-redirect-text">
          Don't have an account? <Link to="/signup">Create one here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;