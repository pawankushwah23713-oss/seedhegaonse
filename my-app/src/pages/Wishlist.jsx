import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Wishlist.css';

// 🟢 Import Local Dummy Images
import dummy1 from '../assets/dumy1.png';
import dummy2 from '../assets/dumy2.png';
import dummy3 from '../assets/dumy3.png';
import dummy4 from '../assets/dumy4.png';
import dummy5 from '../assets/dumy5.png';
import dummy6 from '../assets/dumy6.png';
import dummy7 from '../assets/dumy7.png';

// 🟢 Dynamic Base API URL
const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const SERVER_HOST = API_BASE.replace('/api', '');
const WISHLIST_KEY = 'seedhegaonse_wishlist';

// 🟢 DUMMY PRODUCTS LIST
const DUMMY_PRODUCTS = [
  {
    _id: 'dummy-1',
    name: 'Pure Desi Ghee Motichoor Ladoo',
    price: 480,
    category: 'ladoo',
    originRegion: 'Jodhpur',
    description: 'Melt-in-mouth tiny boondi pearls fried in 100% pure desi ghee & garnished with pistachios.',
    image: dummy1,
    inStock: true
  },
  {
    _id: 'dummy-2',
    name: 'Traditional Mathura Peda',
    price: 520,
    category: 'peda',
    originRegion: 'Mathura',
    description: 'Slow-roasted authentic khoya infused with aromatic cardamom and traditional flavours.',
    image: dummy2,
    inStock: true
  },
  {
    _id: 'dummy-3',
    name: 'Royal Agra Kesar Angoori Petha',
    price: 360,
    category: 'petha',
    originRegion: 'Agra',
    description: 'Juicy, soft, translucent sweet pumpkin bites infused with natural Kashmiri saffron.',
    image: dummy3,
    inStock: true
  },
  {
    _id: 'dummy-4',
    name: 'Diamond Silver Foil Kaju Katli',
    price: 950,
    category: 'barfi',
    originRegion: 'Delhi NCR',
    description: 'Premium quality Goan cashews crafted with authentic edible pure silver vark.',
    image: dummy4,
    inStock: true
  },
  {
    _id: 'dummy-5',
    name: 'Jaipuri Malai Rabdi Ghewar',
    price: 650,
    category: 'special',
    originRegion: 'Jaipur',
    description: 'Crispy honeycomb disc soaked in sugar syrup and topped with rich cardamom rabdi.',
    image: dummy5,
    inStock: true
  },
  {
    _id: 'dummy-6',
    name: 'Alwar Famous Danedar Milk Cake',
    price: 540,
    category: 'barfi',
    originRegion: 'Alwar',
    description: 'Rich, caramelized brown grainy milk fudge prepared from fresh whole buffalo milk.',
    image: dummy6,
    inStock: true
  },
  {
    _id: 'dummy-7',
    name: 'Hisar ki malai',
    price: 540,
    category: 'barfi',
    originRegion: 'Alwar',
    description: 'Rich, caramelized brown grainy milk fudge prepared from fresh whole buffalo milk.',
    image: dummy7,
    inStock: true
  }
];

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

// 🟢 Backend & Local Image Formatter with Fallback
const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop';
  }
  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('data:') ||
    imagePath.startsWith('blob:') ||
    imagePath.startsWith('/src/') ||
    imagePath.startsWith('/assets/')
  ) {
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
  const [localToast, setLocalToast] = useState('');

  // 1. FETCH WISHLIST (Combines Local Storage Dummy Items + Backend Items)
  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError('');

      // Load saved wishlist IDs from localStorage
      let localIds = [];
      try {
        const saved = localStorage.getItem(WISHLIST_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          localIds = Array.isArray(parsed)
            ? parsed.map((item) => (typeof item === 'object' && item !== null ? (item._id || item.id) : item).toString())
            : [];
        }
      } catch (e) {
        console.error('Error reading local wishlist:', e);
      }

      // Filter local dummy products that match wishlist IDs
      const localDummyMatches = DUMMY_PRODUCTS.filter((d) => localIds.includes(d._id.toString()));

      const token = getAuthToken();
      let serverItems = [];

      if (token) {
        try {
          const res = await fetch(`${API_BASE}/wishlist`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });

          const data = await res.json();
          if (res.ok && Array.isArray(data)) {
            serverItems = data.filter((item) => item !== null && typeof item === 'object');
          }
        } catch (err) {
          console.warn('Backend wishlist fetch failed, using local items:', err);
        }
      }

      // Merge backend items and dummy items (deduplicated by _id)
      const combinedMap = new Map();
      [...localDummyMatches, ...serverItems].forEach((item) => {
        const id = (item._id || item.id)?.toString();
        if (id && !combinedMap.has(id)) {
          combinedMap.set(id, item);
        }
      });

      const finalItems = Array.from(combinedMap.values());
      setWishlistItems(finalItems);
    } catch (err) {
      console.error('Fetch Wishlist Error:', err);
      setError('Unable to load saved sweets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // 2. REMOVE ITEM FROM WISHLIST (Syncs Local Storage + Backend)
  const handleRemove = async (e, productId) => {
    e.stopPropagation();
    if (!productId) return;

    const pIdStr = productId.toString();
    const prevItems = [...wishlistItems];

    // Update UI State
    setWishlistItems((prev) => prev.filter((item) => (item._id || item.id)?.toString() !== pIdStr));

    // Update LocalStorage
    try {
      const saved = localStorage.getItem(WISHLIST_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const updated = parsed.filter(
          (id) => (typeof id === 'object' && id !== null ? (id._id || id.id) : id)?.toString() !== pIdStr
        );
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
      }
    } catch (err) {
      console.error('LocalStorage update error:', err);
    }

    // Backend Sync if logged in and valid MongoDB ID
    const token = getAuthToken();
    const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(pIdStr);

    if (token && isValidMongoId) {
      try {
        const res = await fetch(`${API_BASE}/wishlist/toggle/${pIdStr}`, {
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
    }
  };

  // 🟢 3. ADD TO CART FUNCTION
  const handleProductAddToCart = (p) => {
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

    if (typeof addToCart === 'function') {
      addToCart(formattedItem);
    } else {
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

        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('cartUpdated'));
      } catch (err) {
        console.error('Direct cart save error:', err);
      }
    }

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

      {/* ERROR / LOADING / EMPTY / GRID */}
      {loading ? (
        <div className="wishlist-loading-state">
          <div className="wishlist-spinner"></div>
          <p>Loading your saved sweets...</p>
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="wishlist-empty-card">
          <span className="empty-icon">❤</span>
          <h3>Your Wishlist is Empty</h3>
          <p>Explore authentic village sweets and tap the heart icon to save them here.</p>
          <button className="wishlist-btn-primary" onClick={() => navigate('/')}>
            Explore Sweets
          </button>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlistItems.map((p) => (
            <div key={p._id || p.id} className="wishlist-card">
              <div className="wishlist-image-wrap">
                {p.originRegion && (
                  <span className="wishlist-badge">📍 {p.originRegion}</span>
                )}

                {/* Remove Cross Button */}
                <button
                  className="wishlist-remove-btn"
                  onClick={(e) => handleRemove(e, p._id || p.id)}
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