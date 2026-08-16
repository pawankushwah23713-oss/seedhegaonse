import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import logoImg from '../assets/logo.png';
import './Navbar.css';

const Navbar = ({ cartCount = 0, onCartClick, isLoggedIn, userName, onLogout }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  
  // LocalStorage se turant live data read karna
  const getUserFromStorage = () => {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const [userData, setUserData] = useState(getUserFromStorage);
  
  const navigate = useNavigate();
  const location = useLocation();
  const accountRef = useRef(null);

  // 1. Page change ya login state change hone par data hamesha fresh sync hoga
  useEffect(() => {
    const syncUser = () => {
      const token = localStorage.getItem('token');
      const user = getUserFromStorage();
      if (token && user) {
        setUserData(user);
      } else {
        setUserData(null);
      }
    };

    syncUser();
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, [location.pathname, isLoggedIn, userName]);

  // 2. Scroll detection for Sticky Header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3. Dropdown ke bahar click karne par auto-close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helpers
  const toggleMobileSubmenu = (menuName) => {
    setMobileDropdown(mobileDropdown === menuName ? null : menuName);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileDropdown(null);
  };

  // ==========================================
  // LOGOUT HANDLER (LOCALSTORAGE DATA CLEAR)
  // ==========================================
  const handleLogoutAction = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');

    setUserData(null);
    setAccountMenuOpen(false);
    closeMobileMenu();

    if (onLogout) {
      onLogout();
    }

    navigate('/');
  };

  const isUserAuthenticated = Boolean(localStorage.getItem('token') && userData);

  // Real User Name extraction
  const displayName = userData?.name || userData?.fullName || userData?.username || (userData?.email ? userData.email.split('@')[0] : '') || userName || 'User';
  const userInitial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  return (
    <>
      {/* ANNOUNCEMENT BAR */}
      <div className="announcement-bar">
        <div className="announcement-content">
          <span>🚚 <strong>SAME DAY DELIVERY IN DELHI NCR</strong></span>
          <span className="divider">|</span>
          <span>Use Code <span className="coupon-code shimmer-effect">SGS50</span> for <strong>FLAT ₹50 OFF</strong></span>
        </div>
      </div>

      {/* HEADER NAVBAR */}
      <header className={`main-header ${isScrolled ? 'scrolled-header' : ''}`}>
        <div className="header-container">
          {/* BRAND LOGO */}
          <Link to="/" className="header-logo logo-hover-anim" onClick={closeMobileMenu}>
            <img src={logoImg} alt="Seedhe Gaon Se Logo" className="logo-image" />
            <div className="logo-info">
              <span className="logo-brand-title">Seedhe Gaon Se</span>
              <span className="logo-brand-tagline">Your Gateway to Pure Taste</span>
            </div>
          </Link>

          {/* DESKTOP NAVBAR */}
          <nav className="desktop-navbar">
            <ul className="nav-menu">
              <li className="nav-item">
                <Link to="/" className="nav-link active">Home</Link>
              </li>
              
              <li className="nav-item has-dropdown">
                <a href="#about-us" className="nav-link">
                  About Us 
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="dropdown-arrow">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </a>
                <ul className="dropdown-menu fade-slide-down">
                  <li><a href="/AboutUs">Our Story</a></li>
                  <li><a href="/why-us">Why Choose Us</a></li>
                  <li><a href="#artisans">Village Artisans</a></li>
                </ul>
              </li>

              <li className="nav-item has-dropdown">
                <a href="#sweets" className="nav-link">
                  Sweets 
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="dropdown-arrow">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </a>
                <ul className="dropdown-menu fade-slide-down">
                  <li><a href="#pedas">Hisar Malai Peda</a></li>
                  <li><a href="#milkcake">Alwar Milk Cake</a></li>
                  <li><a href="#balushahi">Baghpat Balushahi</a></li>
                  <li><a href="#laddoo">Desi Ghee Laddoo</a></li>
                </ul>
              </li>

              <li className="nav-item"><a href="#offers" className="nav-link">Offers</a></li>
              <li className="nav-item"><a href="contact-us" className="nav-link">Contact Us</a></li>
            </ul>
          </nav>

          {/* ACTION BUTTONS */}
          <div className="header-actions">
            
            {/* SIGN IN BUTTON (AGAR USER LOGIN NAHI HAI) */}
            {!isUserAuthenticated ? (
              <button className="signin-trigger" onClick={() => navigate('/auth')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span className="signin-text">Sign In</span>
              </button>
            ) : (
              /* LOGGED IN USER (SIRF ICON AUR CHEVRON ARROW DIKHEGA) */
              <div className="account-wrap" ref={accountRef}>
                <button 
                  className={`user-profile-icon-btn ${accountMenuOpen ? 'active-profile' : ''}`} 
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  title="My Account"
                  aria-label="User Account"
                >
                  <div className="avatar-circle">{userInitial}</div>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`user-arrow ${accountMenuOpen ? 'open' : ''}`}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {/* CLICK KARNE PAR YE RICH CARD OPEN HOGA */}
                {accountMenuOpen && (
                  <div className="account-dropdown-card fade-slide-down">
                    
                    {/* User Info Header: Real Name, Email & Phone */}
                    <div className="dropdown-user-header">
                      <div className="dropdown-avatar">{userInitial}</div>
                      <div className="dropdown-user-meta">
                        <span className="user-full-name">{displayName}</span>
                        {userData?.email && <span className="user-email-text">{userData.email}</span>}
                        {userData?.phone && <span className="user-phone-badge">📞 {userData.phone}</span>}
                      </div>
                    </div>

                    <div className="dropdown-divider"></div>

                    {/* Quick Links */}
                    <ul className="dropdown-links-list">
                      <li>
                        <button onClick={() => { setAccountMenuOpen(false); navigate('/my-orders'); }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                          My Orders
                        </button>
                      </li>
                      <li>
                        <button onClick={() => { setAccountMenuOpen(false); navigate('/profile'); }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          Account Settings
                        </button>
                      </li>
                      <li>
                        <button onClick={() => { setAccountMenuOpen(false); navigate('/support'); }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          Help & Support
                        </button>
                      </li>
                    </ul>

                    <div className="dropdown-divider"></div>

                    {/* Logout Button */}
                    <button className="dropdown-logout-btn" onClick={handleLogoutAction}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* CART TRIGGER */}
            <div className="cart-trigger cart-bounce" title="View Cart" onClick={onCartClick}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <span className="cart-count">{cartCount}</span>
            </div>

            {/* MOBILE HAMBURGER BUTTON */}
            <button 
              className={`mobile-hamburger-btn ${mobileMenuOpen ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Mobile Menu"
            >
              <span className="hamburger-bar"></span>
              <span className="hamburger-bar"></span>
              <span className="hamburger-bar"></span>
            </button>
          </div>
        </div>

        {/* MOBILE SLIDE-OUT MENU */}
        <div className={`mobile-nav-menu ${mobileMenuOpen ? 'show' : ''}`}>
          <ul className="mobile-menu-list">
            
            {/* Mobile User Profile Card */}
            {isUserAuthenticated && (
              <li className="mobile-user-profile-badge">
                <div className="avatar-circle mobile-avatar">{userInitial}</div>
                <div className="mobile-user-details">
                  <span className="mobile-name">{displayName}</span>
                  <span className="mobile-phone">{userData?.email || userData?.phone}</span>
                </div>
              </li>
            )}

            <li>
              <Link to="/" onClick={closeMobileMenu}>Home</Link>
            </li>

            {/* Accordion: About Us */}
            <li className="mobile-dropdown-item">
              <div className="mobile-dropdown-header" onClick={() => toggleMobileSubmenu('about')}>
                <span>About Us</span>
                <span className={`accordion-icon ${mobileDropdown === 'about' ? 'open' : ''}`}>▼</span>
              </div>
              {mobileDropdown === 'about' && (
                <ul className="mobile-submenu">
                  <li><a href="#our-story" onClick={closeMobileMenu}>Our Story</a></li>
                  <li><a href="#why-choose-us" onClick={closeMobileMenu}>Why Choose Us</a></li>
                  <li><a href="#artisans" onClick={closeMobileMenu}>Village Artisans</a></li>
                </ul>
              )}
            </li>

            {/* Accordion: Sweets */}
            <li className="mobile-dropdown-item">
              <div className="mobile-dropdown-header" onClick={() => toggleMobileSubmenu('sweets')}>
                <span>Sweets</span>
                <span className={`accordion-icon ${mobileDropdown === 'sweets' ? 'open' : ''}`}>▼</span>
              </div>
              {mobileDropdown === 'sweets' && (
                <ul className="mobile-submenu">
                  <li><a href="#pedas" onClick={closeMobileMenu}>Hisar Malai Peda</a></li>
                  <li><a href="#milkcake" onClick={closeMobileMenu}>Alwar Milk Cake</a></li>
                  <li><a href="#balushahi" onClick={closeMobileMenu}>Baghpat Balushahi</a></li>
                  <li><a href="#laddoo" onClick={closeMobileMenu}>Desi Ghee Laddoo</a></li>
                </ul>
              )}
            </li>

            <li><a href="#offers" onClick={closeMobileMenu}>Offers</a></li>
            <li><a href="#contact-us" onClick={closeMobileMenu}>Contact Us</a></li>

            {/* Mobile Auth Button */}
            <li className="mobile-auth-btn">
              {!isUserAuthenticated ? (
                <Link to="/auth" className="mobile-login-link" onClick={closeMobileMenu}>Sign in / Register</Link>
              ) : (
                <button className="mobile-logout-btn" onClick={handleLogoutAction}>
                  Logout
                </button>
              )}
            </li>
          </ul>
        </div>
      </header>
    </>
  );
};

export default Navbar;