import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import './Navbar.css';

// 🟢 Shelf dropdown menus ka data (desktop hover + mobile tap dono isi se chalte hain)
const SHELF_MENUS = {
  sweets: {
    title: '🍬 Sweets',
    links: [
      { to: '/', label: '🍬 All Sweets' },
      { to: '/laddu', label: '🟡 Pure Desi Ghee Laddu' },
      { to: '/peda', label: '🟤 Mathura Special Peda' },
      { to: '/petha', label: '⚪ Agra Petha Varieties' },
      { to: '/halwa', label: '🥣 Moong Dal Halwa' },
      { to: '/barfi', label: '🔶 Kaju Barfi & Katli' },
      { to: '/specials', label: '⭐ Special Festive Mithai' }
    ]
  },
  cakes: {
    title: '🎂 Cakes',
    links: [
      { to: '/cake', label: '🎂 All Fresh Cakes' },
      { to: '/cakes/chocolate-truffle', label: '🍫 Dutch Truffle Cake' },
      { to: '/cakes/red-velvet', label: '❤️ Royal Red Velvet' },
      { to: '/cakes/fresh-fruit', label: '🍓 Fresh Exotic Fruit' },
      { to: '/cakes/cheesecake', label: '🧀 Baked Cheesecakes' },
      { to: '/cakes/bento-mini', label: '🎀 Bento & Mini Cakes' },
      { to: '/cakes/butterscotch', label: '🍯 Butterscotch Crunch' }
    ]
  },
  about: {
    title: '📖 About Us',
    links: [
      { to: '/AboutUs', label: '📖 Our Village Story', anchor: true },
      { to: '/why-us', label: '🌟 Why Choose Us', anchor: true }
    ]
  }
};

/* ==========================================================
   🔍 SMART SEARCH ROUTING
   User jo bhi likhe, uske keyword ke hisaab se sahi page khulega.
   ⚠️ Order important hai: pehle zyada specific (cake sub-category),
   uske baad general ('cake') — warna "truffle cake" bhi /cake par
   chala jayega.
   ========================================================== */
const SEARCH_ROUTES = [
  // 🎂 Cake sub-categories (sabse specific)
  { path: '/cakes/chocolate-truffle', keywords: ['chocolate truffle', 'dutch truffle', 'truffle', 'chocolate', 'choco', 'dutch'] },
  { path: '/cakes/red-velvet', keywords: ['red velvet', 'redvelvet', 'velvet'] },
  { path: '/cakes/fresh-fruit', keywords: ['fresh fruit', 'fruit cake', 'fruit', 'pineapple', 'mango', 'strawberry', 'exotic'] },
  { path: '/cakes/cheesecake', keywords: ['cheesecake', 'cheese cake', 'cheese', 'blueberry'] },
  { path: '/cakes/bento-mini', keywords: ['bento', 'mini cake', 'mini', 'small cake'] },
  { path: '/cakes/butterscotch', keywords: ['butterscotch', 'butter scotch', 'caramel', 'crunch'] },

  // 🎂 General cakes
  { path: '/cake', keywords: ['cake', 'cakes', 'bakery', 'bake', 'pastry', 'birthday', 'anniversary', 'photo cake', 'egg less', 'eggless'] },

  // 🍬 Sweets categories
  { path: '/laddu', keywords: ['laddu', 'ladoo', 'motichoor', 'motichur', 'besan', 'boondi'] },
  { path: '/peda', keywords: ['peda', 'pedha', 'mathura', 'malai peda', 'khoya'] },
  { path: '/petha', keywords: ['petha', 'angoori', 'agra'] },
  { path: '/halwa', keywords: ['halwa', 'halva', 'moong', 'sohan', 'karachi', 'gajar'] },
  { path: '/barfi', keywords: ['barfi', 'burfi', 'katli', 'kaju', 'milk cake', 'milkcake', 'kalakand'] },
  { path: '/specials', keywords: ['special', 'ghewar', 'ghevar', 'rasgulla', 'gulab jamun', 'jamun', 'festive', 'rabdi', 'imarti'] },

  // 🎁 Other pages
  { path: '/bulk-gifting', keywords: ['bulk', 'gift', 'gifting', 'hamper', 'corporate', 'wholesale', 'shaadi', 'wedding', 'diwali box'] },
  { path: '/my-orders', keywords: ['my order', 'my orders', 'order status', 'track order', 'order'] },
  { path: '/wishlist', keywords: ['wishlist', 'wish list', 'favourite', 'favorite', 'saved'] },
  { path: '/contact-us', keywords: ['contact', 'support', 'helpline', 'customer care', 'complaint', 'phone number'] },
  { path: '/AboutUs', keywords: ['about us', 'about', 'our story', 'gaon story'] },
  { path: '/why-us', keywords: ['why choose', 'why us', 'quality promise'] },
  { path: '/shipping-policy', keywords: ['shipping', 'delivery charge', 'delivery policy', 'courier'] },
  { path: '/return-refund', keywords: ['return', 'refund', 'replace'] },
  { path: '/cancellation-policy', keywords: ['cancel', 'cancellation'] },
  { path: '/privacy', keywords: ['privacy'] },
  { path: '/terms', keywords: ['terms', 'condition'] },
  { path: '/loyalty-rewards', keywords: ['coupon', 'reward', 'loyalty', 'promo', 'offer', 'discount'] },
  { path: '/profile', keywords: ['profile', 'my account', 'account setting'] }
];

// Query ke hisaab se sahi route nikaalo, warna homepage par filter
const resolveSearchRoute = (rawQuery) => {
  const q = String(rawQuery || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!q) return null;

  for (const route of SEARCH_ROUTES) {
    const hit = route.keywords.some((kw) => q.includes(kw) || kw.includes(q));
    if (hit) return route.path;
  }
  return null;
};

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

  // 🟢 Mobile par shelf dropdown (Sweets / Cakes / About) tap se khulega
  const [isMobileView, setIsMobileView] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const [shelfMenu, setShelfMenu] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const accountRef = useRef(null);

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

  // 🟢 Screen size track (mobile par tap-dropdown, desktop par hover)
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobileView(mobile);
      if (!mobile) setShelfMenu(null);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Route change hone par drawer / dropdown auto close
  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
    setShelfMenu(null);
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

  // 🟢 Shelf ke dropdown items par click
  // Mobile: navigate na karke neeche panel kholo. Desktop: normal link behaviour.
  const handleShelfDropdownClick = (e, key) => {
    if (isMobileView) {
      e.preventDefault();
      setShelfMenu((prev) => (prev === key ? null : key));
    }
  };

  // 🔍 SMART SEARCH SUBMIT
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    const matchedPath = resolveSearchRoute(trimmed);
    const q = encodeURIComponent(trimmed);

    if (matchedPath) {
      // Keyword match mila to seedha us page par (search param bhi saath jayega)
      navigate(`${matchedPath}?search=${q}`);
    } else {
      // Kuch match nahi hua to homepage par filter ho jayega
      navigate(`/?search=${q}`);
    }

    setSearchQuery('');
    setShelfMenu(null);
    closeMobileMenu();

    // Mobile keyboard band karne ke liye
    if (e.target && typeof e.target.querySelector === 'function') {
      const input = e.target.querySelector('input');
      if (input) input.blur();
    }
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
            <li className={`menu-nav-item has-dropdown ${shelfMenu === 'sweets' ? 'is-open' : ''}`}>
              <a
                href="/#products"
                className="menu-nav-link"
                onClick={(e) => handleShelfDropdownClick(e, 'sweets')}
              >
                Sweets 
                <svg className="dropdown-arrow-svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </a>
              <ul className="dropdown-flyout">
                {SHELF_MENUS.sweets.links.map((l) => (
                  <li key={l.to + l.label}><Link to={l.to}>{l.label}</Link></li>
                ))}
              </ul>
            </li>

            {/* 🎂 CAKES DROPDOWN */}
            <li className={`menu-nav-item has-dropdown ${shelfMenu === 'cakes' ? 'is-open' : ''}`}>
              <Link
                to="/cake"
                className="menu-nav-link"
                onClick={(e) => handleShelfDropdownClick(e, 'cakes')}
              >
                Cakes 
                <svg className="dropdown-arrow-svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </Link>
              <ul className="dropdown-flyout">
                {SHELF_MENUS.cakes.links.map((l) => (
                  <li key={l.to + l.label}><Link to={l.to}>{l.label}</Link></li>
                ))}
              </ul>
            </li>

            {/* 🏢 ABOUT US DROPDOWN */}
            <li className={`menu-nav-item has-dropdown ${shelfMenu === 'about' ? 'is-open' : ''}`}>
              <a
                href="#about-us"
                className="menu-nav-link"
                onClick={(e) => handleShelfDropdownClick(e, 'about')}
              >
                About Us 
                <svg className="dropdown-arrow-svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </a>
              <ul className="dropdown-flyout">
                {SHELF_MENUS.about.links.map((l) => (
                  <li key={l.to + l.label}><a href={l.to}>{l.label}</a></li>
                ))}
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

      {/* 📲 3b. MOBILE SUB-MENU PANEL (Sweets / Cakes / About tap karne par) */}
      {isMobileView && shelfMenu && SHELF_MENUS[shelfMenu] && (
        <div className="mobile-subnav-panel">
          <div className="mobile-subnav-head">
            <span>{SHELF_MENUS[shelfMenu].title}</span>
            <button
              type="button"
              className="mobile-subnav-close"
              onClick={() => setShelfMenu(null)}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <ul className="mobile-subnav-links">
            {SHELF_MENUS[shelfMenu].links.map((l) =>
              l.anchor ? (
                <li key={l.to + l.label}>
                  <a href={l.to} onClick={() => setShelfMenu(null)}>{l.label}</a>
                </li>
              ) : (
                <li key={l.to + l.label}>
                  <Link to={l.to} onClick={() => setShelfMenu(null)}>{l.label}</Link>
                </li>
              )
            )}
          </ul>
        </div>
      )}

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
                  <li><Link to="/laddu" onClick={closeMobileMenu}>🟡 Laddu & Peda</Link></li>
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