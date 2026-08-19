import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Wishlist.css';

// 🟢 Dynamic Base API URL
const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const SERVER_HOST = API_BASE.replace('/api', '');

// 🟢 Helper to get Token
const getAuthToken = () => {
  try {
    const directToken = localStorage.getItem('token') || 
                        localStorage.getItem('userToken') || 
                        localStorage.getItem('authToken');
    if (directToken) return directToken;

    const userObj = localStorage.getItem('user');
    if (userObj) {
      const parsed = JSON.parse(userObj);
      return parsed.token || parsed.jwt || null;
    }
  } catch (err) {
    console.error('Error reading auth token:', err);
  }
  return null;
};

// 🟢 Backend Image Formatter with Fallback
const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop';
  }
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const cleanPath = imagePath.replace(/\\/g, '/');
  const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${SERVER_HOST}${normalizedPath}`;
};

const Wishlist = ({ addToCart, addedToast }) => {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [localToast, setLocalToast] = useState(''); // 🟢 Self-handling Toast

  // 1. FETCH USER WISHLIST FROM BACKEND
  const fetchWishlist = async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      setError('Please sign in to view your saved sweets.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_BASE}/wishlist`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch wishlist');
      }

      // Filter out null or deleted products
      const validItems = Array.isArray(data) ? data.filter(item => item !== null && typeof item === 'object') : [];
      setWishlistItems(validItems);
    } catch (err) {
      console.error('Fetch Wishlist Error:', err);
      setError(err.message || 'Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // 2. REMOVE ITEM FROM WISHLIST
  const handleRemove = async (e, productId) => {
    e.stopPropagation();
    const token = getAuthToken();
    if (!token) return;

    const prevItems = [...wishlistItems];
    setWishlistItems((prev) => prev.filter((item) => (item._id || item.id) !== productId));

    try {
      const res = await fetch(`${API_BASE}/wishlist/toggle/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        setWishlistItems(prevItems);
      }
    } catch (err) {
      console.error('Remove from wishlist error:', err);
      setWishlistItems(prevItems);
    }
  };

  // 🟢 3. BULLETPROOF ADD TO CART FUNCTION
  const handleProductAddToCart = (p) => {
    console.log('Adding to cart:', p.name);

    const formattedItem = {
      id: p._id || p.id,
      _id: p._id || p.id,
      name: p.name,
      price: typeof p.price === 'string' && p.price.startsWith('₹') ? p.price : `₹${p.price}`,
      img: getImageUrl(p.image),
      image: getImageUrl(p.image),
      originRegion: p.originRegion,
      quantity: 1
    };

    // Step A: Agar App.jsx se addToCart prop mila hai toh call karein
    if (typeof addToCart === 'function') {
      addToCart(formattedItem);
    } else {
      // Step B: Fallback agar prop pass nahi hua toh direct localStorage update karein
      try {
        const savedCart = JSON.parse(localStorage.getItem('cart') || localStorage.getItem('cartItems') || '[]');
        const existingIndex = savedCart.findIndex(item => (item.id || item._id) === formattedItem.id);

        if (existingIndex > -1) {
          savedCart[existingIndex].quantity = (savedCart[existingIndex].quantity || 1) + 1;
        } else {
          savedCart.push(formattedItem);
        }

        localStorage.setItem('cart', JSON.stringify(savedCart));
        localStorage.setItem('cartItems', JSON.stringify(savedCart));

        // Trigger event so Navbar updates count
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('cartUpdated'));
      } catch (err) {
        console.error('Direct cart save error:', err);
      }
    }

    // Step C: Instant Toast Notification show karein
    setLocalToast(p.name);
    setTimeout(() => {
      setLocalToast('');
    }, 2500);
  };

  const activeToastMessage = addedToast || localToast;

  return (
    <div className="wishlist-page-container">
      {/* TOAST NOTIFICATION */}
      {activeToastMessage && (
        <div className="cart-toast fade-slide-up" style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          background: '#047857',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 9999,
          fontWeight: 600
        }}>
          ✓ <strong>{activeToastMessage}</strong> added to cart
        </div>
      )}

      <div className="wishlist-header">
        <h1 className="wishlist-title">My Saved Sweets</h1>
        <p className="wishlist-subtitle">
          Your favorite handcrafted regional sweets saved for quick ordering
        </p>
      </div>

      {/* ERROR / LOGIN REQUIRED STATE */}
      {error ? (
        <div className="wishlist-empty-card">
          <span className="empty-icon">🔒</span>
          <h3>{error}</h3>
          <p>Login to your account to view your saved sweets across devices.</p>
          <button className="wishlist-btn-primary" onClick={() => navigate('/auth')}>
            Sign In / Register
          </button>
        </div>
      ) : loading ? (
        /* LOADING STATE */
        <div className="wishlist-loading-state">
          <div className="wishlist-spinner"></div>
          <p>Loading your saved sweets...</p>
        </div>
      ) : wishlistItems.length === 0 ? (
        /* EMPTY STATE */
        <div className="wishlist-empty-card">
          <span className="empty-icon">❤</span>
          <h3>Your Wishlist is Empty</h3>
          <p>Explore authentic village sweets and tap the heart icon to save them here.</p>
          <button className="wishlist-btn-primary" onClick={() => navigate('/')}>
            Explore Sweets
          </button>
        </div>
      ) : (
        /* 🟢 PRODUCTS GRID */
        <div className="wishlist-grid">
          {wishlistItems.map((p) => (
            <div key={p._id} className="wishlist-card">
              <div className="wishlist-image-wrap">
                {p.originRegion && (
                  <span className="wishlist-badge">📍 {p.originRegion}</span>
                )}

                {/* Remove Cross Button */}
                <button
                  className="wishlist-remove-btn"
                  onClick={(e) => handleRemove(e, p._id)}
                  title="Remove from wishlist"
                  aria-label="Remove"
                >
                  ✕
                </button>

                <img
                  src={getImageUrl(p.image)}
                  alt={p.name}
                  crossOrigin="anonymous"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src =
                      'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop';
                  }}
                />
              </div>

              <div className="wishlist-info">
                <div className="wishlist-rating">
                  ★★★★★ <span>(100% Pure Desi Ghee)</span>
                </div>

                <h3 className="wishlist-product-name" title={p.name}>
                  {p.name}
                </h3>

                {p.description && (
                  <p className="wishlist-product-desc">
                    {p.description}
                  </p>
                )}

                {/* FOOTER & ADD TO CART BUTTON */}
                <div className="wishlist-footer">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="wishlist-price">₹{p.price}</span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Per Box / Kg</span>
                  </div>

                  <button
                    className="cart-btn"
                    onClick={() => handleProductAddToCart(p)}
                    disabled={p.inStock === false}
                    style={{
                      opacity: p.inStock === false ? 0.6 : 1,
                      cursor: p.inStock === false ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {p.inStock === false ? 'Out of Stock' : '+ Add'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;