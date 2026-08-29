import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Wishlist.css';

// 🟢 Import Local Dummy Images for Sweets
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
const CAKE_WISHLIST_KEY = 'seedhegaonse_cake_wishlist';

// 🟢 DUMMY SWEETS LIST
const DUMMY_SWEETS = [
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
    name: 'Hisar ki Special Malai Peda',
    price: 540,
    category: 'peda',
    originRegion: 'Hisar',
    description: 'Fresh cream & rich caramelized milk treat straight from Haryana’s dairy heartland.',
    image: dummy7,
    inStock: true
  }
];

// 🟢 DUMMY CAKES LIST
const DUMMY_CAKES = [
  {
    _id: 'dummy-cake-1',
    name: 'Belgian Dark Chocolate Truffle Cake',
    category: 'chocolate',
    originRegion: 'Fresh Bakehouse',
    description: 'Layers of moist dark chocolate sponge filled with rich, silky Belgian ganache.',
    price: 549,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop',
    inStock: true
  },
  {
    _id: 'dummy-cake-2',
    name: 'Classic Red Velvet Cream Cheese Cake',
    category: 'redvelvet',
    originRegion: 'Master Chef Special',
    description: 'Velvety crimson sponge paired with authentic Philadelphia style cream cheese frosting.',
    price: 599,
    image: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?q=80&w=600&auto=format&fit=crop',
    inStock: true
  },
  {
    _id: 'dummy-cake-3',
    name: 'Exotic Fresh Seasonal Fruit Cake',
    category: 'fruit',
    originRegion: 'Farm Fresh',
    description: 'Light vanilla sponge layered with freshly whipped cream and hand-cut fresh fruits.',
    price: 520,
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=600&auto=format&fit=crop',
    inStock: true
  },
  {
    _id: 'dummy-cake-4',
    name: 'New York Baked Blueberry Cheesecake',
    category: 'cheesecake',
    originRegion: 'Gourmet Selection',
    description: 'Traditional slow-baked rich cheesecake on a buttery cracker crust with blueberry compote.',
    price: 750,
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=600&auto=format&fit=crop',
    inStock: true
  },
  {
    _id: 'dummy-cake-5',
    name: 'Crunchy Caramel Butterscotch Cake',
    category: 'butterscotch',
    originRegion: 'Daily Fresh Oven',
    description: 'Golden sponge layered with home-cooked butterscotch sauce and cashew praline crunch.',
    price: 479,
    image: 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?q=80&w=600&auto=format&fit=crop',
    inStock: true
  },
  {
    _id: 'dummy-cake-6',
    name: 'Pastel Korean Heart Bento Cake',
    category: 'bento',
    originRegion: 'Trending Korean Design',
    description: 'Cute pocket-sized minimalist birthday cake decorated with pastel buttercream design.',
    price: 349,
    image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?q=80&w=600&auto=format&fit=crop',
    inStock: true
  }
];

// Helper to get Token
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

// Backend & Local Image Formatter
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

  // 1. FETCH WISHLIST (Sweets + Cakes + Dummies + Backend API)
  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError('');

      // 🟢 Read both main key and legacy cake key
      let localIds = [];
      const readKey = (k) => {
        try {
          const saved = localStorage.getItem(k);
          if (saved) {
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed)
              ? parsed.map((item) => (typeof item === 'object' && item !== null ? (item._id || item.id) : item).toString())
              : [];
          }
        } catch (e) {
          return [];
        }
        return [];
      };

      localIds = Array.from(new Set([...readKey(WISHLIST_KEY), ...readKey(CAKE_WISHLIST_KEY)]));

      // Match Dummy Sweets & Dummy Cakes
      const allDummies = [...DUMMY_SWEETS, ...DUMMY_CAKES];
      const localDummyMatches = allDummies.filter((d) => localIds.includes(d._id.toString()));

      let serverItems = [];
      const token = getAuthToken();

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

      // Fetch live products & cakes to resolve any remaining wishlisted IDs
      let liveProductsAndCakes = [];
      try {
        const [prodRes, cakeRes] = await Promise.allSettled([
          fetch(`${API_BASE}/products`),
          fetch(`${API_BASE}/cakes`)
        ]);

        if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
          const pData = await prodRes.value.json();
          if (Array.isArray(pData)) liveProductsAndCakes.push(...pData);
        }
        if (cakeRes.status === 'fulfilled' && cakeRes.value.ok) {
          const cData = await cakeRes.value.json();
          if (Array.isArray(cData)) liveProductsAndCakes.push(...cData);
        }
      } catch (err) {
        console.warn('Live items fetch error:', err);
      }

      const liveMatched = liveProductsAndCakes.filter((p) => localIds.includes(p._id?.toString()));

      // Merge backend items, live items, and dummy items (deduplicated)
      const combinedMap = new Map();
      [...serverItems, ...liveMatched, ...localDummyMatches].forEach((item) => {
        const id = (item._id || item.id)?.toString();
        if (id && !combinedMap.has(id) && localIds.includes(id)) {
          combinedMap.set(id, item);
        }
      });

      const finalItems = Array.from(combinedMap.values());
      setWishlistItems(finalItems);
    } catch (err) {
      console.error('Fetch Wishlist Error:', err);
      setError('Unable to load saved items.');
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
    if (!productId) return;

    const pIdStr = productId.toString();
    const prevItems = [...wishlistItems];

    setWishlistItems((prev) => prev.filter((item) => (item._id || item.id)?.toString() !== pIdStr));

    // Update LocalStorage for both keys
    const updateLocalKey = (k) => {
      try {
        const saved = localStorage.getItem(k);
        if (saved) {
          const parsed = JSON.parse(saved);
          const updated = parsed.filter(
            (id) => (typeof id === 'object' && id !== null ? (id._id || id.id) : id)?.toString() !== pIdStr
          );
          localStorage.setItem(k, JSON.stringify(updated));
        }
      } catch (err) {}
    };

    updateLocalKey(WISHLIST_KEY);
    updateLocalKey(CAKE_WISHLIST_KEY);

    // Backend Sync if logged in
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

  // 3. ADD TO CART FUNCTION
  const handleProductAddToCart = (p) => {
    const formattedItem = {
      id: p._id || p.id,
      _id: p._id || p.id,
      productId: p._id || p.id,
      name: p.name,
      variant: p.category ? `${p.category.toUpperCase()}` : 'Standard',
      price: typeof p.price === 'string' && p.price.startsWith('₹') ? p.price : `₹${p.price}`,
      unitPrice: Number(p.price) || 0,
      totalPrice: Number(p.price) || 0,
      img: getImageUrl(p.image),
      image: getImageUrl(p.image),
      originRegion: p.originRegion || 'Authentic Special',
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
        <h1 className="wishlist-title">My Saved Sweets & Cakes</h1>
        <p className="wishlist-subtitle">
          Your favorite handcrafted regional sweets and fresh artisan cakes saved for quick ordering
        </p>
      </div>

      {loading ? (
        <div className="wishlist-loading-state">
          <div className="wishlist-spinner"></div>
          <p>Loading your saved items...</p>
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="wishlist-empty-card">
          <span className="empty-icon">❤</span>
          <h3>Your Wishlist is Empty</h3>
          <p>Explore authentic sweets & fresh bakery cakes, tap the heart icon to save them here.</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '12px' }}>
            <button className="wishlist-btn-primary" onClick={() => navigate('/')}>
              Explore Sweets
            </button>
            <button className="wishlist-btn-primary" onClick={() => navigate('/cakes')} style={{ background: '#e11d48' }}>
              Explore Cakes
            </button>
          </div>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlistItems.map((p) => (
            <div key={p._id || p.id} className="wishlist-card">
              <div className="wishlist-image-wrap">
                {p.originRegion && (
                  <span className="wishlist-badge">📍 {p.originRegion}</span>
                )}

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
                  ★★★★★ <span>({p.category === 'bento' || p.category === 'chocolate' || p.category === 'redvelvet' ? 'Fresh Daily Baked' : '100% Pure Desi Ghee'})</span>
                </div>

                <h3 className="wishlist-product-name" title={p.name}>
                  {p.name}
                </h3>

                {p.description && (
                  <p className="wishlist-product-desc">
                    {p.description}
                  </p>
                )}

                <div className="wishlist-footer">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="wishlist-price">₹{p.price}</span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Starting Price</span>
                  </div>

                  <button
                    className="cart-btn"
                    onClick={() => handleProductAddToCart(p)}
                    disabled={p.inStock === false}
                    style={{
                      opacity: p.inStock === false ? 0.6 : 1,
                      cursor: p.inStock === false ? 'not-allowed' : 'pointer',
                      background: p.category ? '#e11d48' : '#94191d'
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