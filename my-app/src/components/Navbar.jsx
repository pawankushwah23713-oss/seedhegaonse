import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import './Navbar.css';

const Navbar = ({ 
  cartCount = 0, 
  onCartClick, 
  wishlistCount = 0, 
  isLoggedIn, 
  userName, 
  onLogout,
  userAddress = "Block A2, Janakpuri, New Delhi"
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(userAddress);

  const navigate = useNavigate();
  const location = useLocation();
  const accountRef = useRef(null);

  // Quick category chips scroller data (uses live wishlistCount)
  const QUICK_CATEGORIES = [
    { id: 'all-sweets', name: `All Sweets (9)`, icon: '🍬', link: '/' },
    { id: 'laddu', name: 'Laddu', icon: '🟡', link: '/#products' },
    { id: 'peda', name: 'Peda', icon: '🟤', link: '/#products' },
    { id: 'petha', name: 'Petha', icon: '⚪', link: '/#products' },
    { id: 'halwa', name: 'Halwa', icon: '🥣', link: '/#products' },
    { id: 'barfi-katli', name: 'Barfi & Katli', icon: '🔶', link: '/#products' },
    { id: 'specials', name: 'Specials', icon: '⭐', link: '/#products' },
    { id: 'wishlist-sweets', name: `Wishlist (${wishlistCount})`, icon: '❤️', link: '/wishlist' },
    { id: 'all-cakes', name: `All Cakes (7)`, icon: '🎂', link: '/cake' },
    { id: 'chocolate-truffle', name: 'Chocolate Truffle', icon: '🍫', link: '/cakes#cakes' },
    { id: 'red-velvet', name: 'Red Velvet', icon: '❤️', link: '/cakes#cakes' },
    { id: 'fresh-fruit', name: 'Fresh Fruit', icon: '🍓', link: '/cakes#cakes' },
    { id: 'cheesecakes', name: 'Cheesecakes', icon: '🧀', link: '/cakes#cakes' },
    { id: 'bento-mini', name: 'Bento & Mini', icon: '🎀', link: '/cakes#cakes' },
    { id: 'butterscotch', name: 'Butterscotch', icon: '🍯', link: '/cakes#cakes' },
    { id: 'wishlist-cakes', name: `Wishlist (${wishlistCount})`, icon: '❤️', link: '/wishlist' },
  ];

  // LocalStorage Sync
  const getUserFromStorage = () => {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const [userData, setUserData] = useState(getUserFromStorage);

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

  // Route change hone par drawer auto close
  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  }, [location.pathname]);

  // Mobile menu open hone par background scroll lock
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMobileSubmenu = (menuName) => {
    setMobileDropdown(mobileDropdown === menuName ? null : menuName);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileDropdown(null);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    navigate(`/?search=${encodeURIComponent(trimmed)}`);
    closeMobileMenu();
  };

  const handleLogoutAction = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setUserData(null);
    setAccountMenuOpen(false);
    closeMobileMenu();
    if (onLogout) onLogout();
    navigate('/');
  };

  const isUserAuthenticated = Boolean(localStorage.getItem('token') && userData);
  const isAdminUser = Boolean(userData?.role === 'admin' || userData?.isAdmin === true || userData?.userType === 'admin');
  const displayName = userData?.name || userData?.fullName || userData?.username || (userData?.email ? userData.email.split('@')[0] : '') || userName || 'User';
  const userInitial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  return (
    <div className="navbar-root-wrapper">
      
      {/* 📣 1. ANNOUNCEMENT BAR */}
      <div className="top-announcement-strip">
        <div className="announcement-inner">
          <span className="announcement-highlight">🚚 SAME DAY DELIVERY IN DELHI NCR</span>
          <span className="announcement-sep">•</span>
          <span className="announcement-code-text">Use Code <strong className="promo-badge">SGS50</strong> for FLAT ₹50 OFF</span>
        </div>
      </div>

      {/* 🟡 2. MAIN HEADER */}
      <header className="main-app-header">
        <div className="header-layout-container">

          {/* Row 1: Brand & Location on Left | Actions on Right */}
          <div className="header-primary-row">
            
            {/* Brand Logo & Location */}
            <div className="brand-and-location-col">
              <Link to="/" className="app-logo-link" onClick={closeMobileMenu}>
                <img 
                  src={logoImg} 
                  alt="Seedhe Gaon Se" 
                  className="app-logo-img" 
                  onError={(e) => { e.target.style.display = 'none'; }} 
                />
                <div className="app-brand-text">
                  <span className="brand-heading">Seedhe Gaon Se</span>
                  <span className="brand-subtext">Pure Village Sweets & Bakes</span>
                </div>
              </Link>

              {/* Blinkit Delivery Info (Mobile + Desktop friendly) */}
              <div className="quick-delivery-widget">
                <div className="delivery-time-badge">
                  <span className="speed-tag">⚡ 15 MINS</span>
                  <span className="delivery-city">Delivery to</span>
                </div>
                <div className="location-pill-btn" title="Change Location">
                  <span className="location-name">{selectedLocation}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
            </div>

            {/* Desktop Only Search Bar (In Row 1 for screens > 768px) */}
            <div className="desktop-search-container">
              <form className="universal-search-box" onSubmit={handleSearchSubmit}>
                <svg className="search-icon-svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  className="search-text-input"
                  placeholder='Search "Kaju Katli, Laddu, Cakes..."'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" className="search-reset-btn" onClick={() => setSearchQuery('')}>✕</button>
                )}
              </form>
            </div>

            {/* Right Action Icons (Wishlist, Login/Account, Cart, Hamburger) */}
            <div className="header-action-group">
              
              {/* Wishlist Icon */}
              {isUserAuthenticated && (
                <button className="icon-circle-btn wishlist-desktop" onClick={() => navigate('/wishlist')} title="My Wishlist">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  {wishlistCount > 0 && <span className="action-pill-count">{wishlistCount}</span>}
                </button>
              )}

              {/* Login Pill or Profile Avatar */}
              {!isUserAuthenticated ? (
                <button className="auth-signin-pill" onClick={() => navigate('/auth')}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span className="auth-text">Sign In</span>
                </button>
              ) : (
                <div className="user-profile-anchor" ref={accountRef}>
                  <button 
                    className={`profile-circle-trigger ${accountMenuOpen ? 'active' : ''}`}
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    aria-label="User Profile"
                  >
                    <div className="user-letter-avatar">{userInitial}</div>
                    <svg className={`drop-arrow-icon ${accountMenuOpen ? 'open' : ''}`} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  {/* Profile Dropdown Card */}
                  {accountMenuOpen && (
                    <div className="profile-card-dropdown">
                      <div className="user-meta-header">
                        <div className="user-big-avatar">{userInitial}</div>
                        <div className="user-meta-details">
                          <span className="user-name-title">{displayName}</span>
                          {userData?.email && <span className="user-email-subtitle">{userData.email}</span>}
                        </div>
                      </div>
                      <div className="card-divider-line"></div>
                      <ul className="profile-menu-links">
                        {isAdminUser && (
                          <li>
                            <button onClick={() => { setAccountMenuOpen(false); navigate('/admin'); }}>
                              🛠️ Admin Dashboard
                            </button>
                          </li>
                        )}
                        <li>
                          <button onClick={() => { setAccountMenuOpen(false); navigate('/my-orders'); }}>
                            📦 My Orders
                          </button>
                        </li>
                        <li>
                          <button onClick={() => { setAccountMenuOpen(false); navigate('/wishlist'); }}>
                            ❤️ Wishlist ({wishlistCount})
                          </button>
                        </li>
                        <li>
                          <button onClick={() => { setAccountMenuOpen(false); navigate('/profile'); }}>
                            ⚙️ Account Settings
                          </button>
                        </li>
                      </ul>
                      <div className="card-divider-line"></div>
                      <button className="card-logout-btn" onClick={handleLogoutAction}>
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Cart Button */}
              <button className="primary-cart-button" onClick={onCartClick} title="Open Cart">
                <div className="cart-badge-holder">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  {cartCount > 0 && <span className="cart-number-badge">{cartCount}</span>}
                </div>
                <span className="cart-text-label">My Cart</span>
              </button>

              {/* Hamburger Button (Mobile / Tablet) */}
              <button 
                className={`hamburger-toggle-button ${mobileMenuOpen ? 'is-active' : ''}`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Navigation"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>

            </div>
          </div>

          {/* Row 2: Dedicated Mobile Search Row (Screens <= 768px) */}
          <div className="mobile-search-row">
            <form className="universal-search-box" onSubmit={handleSearchSubmit}>
              <svg className="search-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="search-text-input"
                placeholder='Search "Kaju Katli, Truffle Cake..."'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" className="search-reset-btn" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </form>
          </div>

        </div>
      </header>

      {/* 🧭 3. DESKTOP SECONDARY SUB-NAVBAR WITH ALL BUTTONS & DROPDOWNS */}
      <nav className="desktop-navigation-shelf">
        <div className="shelf-container">
          <ul className="desktop-nav-menu">
            <li>
              <Link to="/" className="menu-nav-link active-link">Home</Link>
            </li>

            {/* 🍬 SWEETS DROPDOWN */}
            <li className="menu-nav-item has-dropdown">
              <a href="/#products" className="menu-nav-link">
                Sweets 
                <svg className="dropdown-arrow-svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </a>
              <ul className="dropdown-flyout">
                <li><Link to="/">🍬 All Sweets</Link></li>
                <li><Link to="/#products">🟡 Pure Desi Ghee Laddu</Link></li>
                <li><Link to="/#products">🟤 Mathura Special Peda</Link></li>
                <li><Link to="/#products">⚪ Agra Petha Varieties</Link></li>
                <li><Link to="/#products">🥣 Moong Dal Halwa</Link></li>
                <li><Link to="/#products">🔶 Kaju Barfi & Katli</Link></li>
                <li><Link to="/#products">⭐ Special Festive Mithai</Link></li>
              </ul>
            </li>

            {/* 🎂 CAKES DROPDOWN */}
            <li className="menu-nav-item has-dropdown">
              <Link to="/cake" className="menu-nav-link">
                Cakes 
                <svg className="dropdown-arrow-svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </Link>
              <ul className="dropdown-flyout">
                <li><Link to="/cake">🎂 All Fresh Cakes</Link></li>
                <li><Link to="/cakes#cakes">🍫 Dutch Truffle Cake</Link></li>
                <li><Link to="/cakes#cakes">❤️ Royal Red Velvet</Link></li>
                <li><Link to="/cakes#cakes">🍓 Fresh Exotic Fruit</Link></li>
                <li><Link to="/cakes#cakes">🧀 Baked Cheesecakes</Link></li>
                <li><Link to="/cakes#cakes">🎀 Bento & Mini Cakes</Link></li>
                <li><Link to="/cakes#cakes">🍯 Butterscotch Crunch</Link></li>
              </ul>
            </li>

            {/* 🏢 ABOUT US DROPDOWN */}
            <li className="menu-nav-item has-dropdown">
              <a href="#about-us" className="menu-nav-link">
                About Us 
                <svg className="dropdown-arrow-svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </a>
              <ul className="dropdown-flyout">
                <li><a href="/AboutUs">📖 Our Village Story</a></li>
                <li><a href="/why-us">🌟 Why Choose Us</a></li>
              </ul>
            </li>

            {/* 🎁 BULK / GIFTING */}
            <li>
              <Link to="/bulk-gifting" className="menu-nav-link">Bulk / Gifting</Link>
            </li>

            {/* 📞 CONTACT US */}
            <li>
              <a href="/contact-us" className="menu-nav-link">Contact Us</a>
            </li>
          </ul>

          <div className="shelf-guarantee-badge">
            <span>🌿 100% Pure Desi Ghee & Fresh Bakes</span>
          </div>
        </div>
      </nav>

      {/* 🏷️ 4. QUICK CATEGORY CHIPS SCROLLER (Blinkit Horizontal Scroll Strip) */}
      <div className="category-scroll-wrapper">
        <div className="category-scroll-track">
          {QUICK_CATEGORIES.map((cat) => (
            <Link 
              key={cat.id} 
              to={cat.link}
              className="category-pill-item"
              onClick={closeMobileMenu}
            >
              <span className="category-pill-icon">{cat.icon}</span>
              <span className="category-pill-text">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 📱 5. MOBILE OVERLAY + SLIDE-OUT DRAWER */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={closeMobileMenu}></div>
      )}

      <aside className={`mobile-navigation-drawer ${mobileMenuOpen ? 'drawer-opened' : ''}`}>
        <div className="drawer-header-row">
          <span className="drawer-title">Navigation</span>
          <button className="drawer-close-btn" onClick={closeMobileMenu}>✕</button>
        </div>

        <div className="drawer-inner-scroll">
          {/* User Profile Bar inside drawer */}
          {isUserAuthenticated ? (
            <div className="drawer-user-badge">
              <div className="user-letter-avatar">{userInitial}</div>
              <div className="drawer-user-info">
                <span className="drawer-user-name">{displayName}</span>
                <span className="drawer-user-sub">{userData?.email || userData?.phone}</span>
              </div>
            </div>
          ) : (
            <button className="drawer-login-action-btn" onClick={() => { closeMobileMenu(); navigate('/auth'); }}>
              Sign In / Register
            </button>
          )}

          {/* Navigation Links List */}
          <ul className="drawer-links-stack">
            <li>
              <Link to="/" className="drawer-link-item" onClick={closeMobileMenu}>🏠 Home</Link>
            </li>

            {/* Accordion 1: Sweets */}
            <li className="drawer-accordion-group">
              <div className="drawer-accordion-trigger" onClick={() => toggleMobileSubmenu('sweets')}>
                <span>🍬 Sweets</span>
                <span className={`accordion-icon-rotate ${mobileDropdown === 'sweets' ? 'open' : ''}`}>▼</span>
              </div>
              {mobileDropdown === 'sweets' && (
                <ul className="drawer-sub-links-tree">
                  <li><Link to="/" onClick={closeMobileMenu}>All Sweets</Link></li>
                  <li><Link to="/#products" onClick={closeMobileMenu}>🟡 Laddu & Peda</Link></li>
                  <li><Link to="/#products" onClick={closeMobileMenu}>⚪ Agra Petha</Link></li>
                  <li><Link to="/#products" onClick={closeMobileMenu}>🥣 Moong Dal Halwa</Link></li>
                  <li><Link to="/#products" onClick={closeMobileMenu}>🔶 Kaju Katli</Link></li>
                </ul>
              )}
            </li>

            {/* Accordion 2: Cakes */}
            <li className="drawer-accordion-group">
              <div className="drawer-accordion-trigger" onClick={() => toggleMobileSubmenu('cakes')}>
                <span>🎂 Cakes & Bakery</span>
                <span className={`accordion-icon-rotate ${mobileDropdown === 'cakes' ? 'open' : ''}`}>▼</span>
              </div>
              {mobileDropdown === 'cakes' && (
                <ul className="drawer-sub-links-tree">
                  <li><Link to="/cake" onClick={closeMobileMenu}>All Cakes</Link></li>
                  <li><Link to="/cakes#cakes" onClick={closeMobileMenu}>🍫 Chocolate Truffle</Link></li>
                  <li><Link to="/cakes#cakes" onClick={closeMobileMenu}>❤️ Red Velvet</Link></li>
                  <li><Link to="/cakes#cakes" onClick={closeMobileMenu}>🍓 Fresh Fruit Cake</Link></li>
                  <li><Link to="/cakes#cakes" onClick={closeMobileMenu}>🧀 Cheesecakes & Bento</Link></li>
                </ul>
              )}
            </li>

            {/* Accordion 3: About Us */}
            <li className="drawer-accordion-group">
              <div className="drawer-accordion-trigger" onClick={() => toggleMobileSubmenu('about')}>
                <span>📖 About Us</span>
                <span className={`accordion-icon-rotate ${mobileDropdown === 'about' ? 'open' : ''}`}>▼</span>
              </div>
              {mobileDropdown === 'about' && (
                <ul className="drawer-sub-links-tree">
                  <li><a href="/AboutUs" onClick={closeMobileMenu}>Our Story</a></li>
                  <li><a href="/why-us" onClick={closeMobileMenu}>Why Choose Us</a></li>
                </ul>
              )}
            </li>

            <li>
              <Link to="/bulk-gifting" className="drawer-link-item" onClick={closeMobileMenu}>🎁 Bulk / Gifting</Link>
            </li>

            <li>
              <a href="/contact-us" className="drawer-link-item" onClick={closeMobileMenu}>📞 Contact Us</a>
            </li>

            {isUserAuthenticated && (
              <>
                <div className="drawer-line-divider"></div>
                <li>
                  <Link to="/my-orders" className="drawer-link-item" onClick={closeMobileMenu}>📦 My Orders</Link>
                </li>
                <li>
                  <Link to="/wishlist" className="drawer-link-item" onClick={closeMobileMenu}>❤️ My Wishlist ({wishlistCount})</Link>
                </li>
                {isAdminUser && (
                  <li>
                    <Link to="/admin" className="drawer-link-item" onClick={closeMobileMenu}>🛠️ Admin Dashboard</Link>
                  </li>
                )}
                <li className="drawer-logout-holder">
                  <button className="drawer-logout-btn" onClick={handleLogoutAction}>
                    Log Out
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </aside>

    </div>
  );
};

export default Navbar;