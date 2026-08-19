import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Homepage.css';

// 🟢 Dynamic API & Server Base Configuration
const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'http://localhost:5000/api');

const SERVER_HOST = API_BASE.replace('/api', '');

// 🟢 DUMMY PRODUCTS (Ye hamesha pehle dikhenge)
// Aap apni images ke links yahan replace kar sakte hain
const DUMMY_PRODUCTS = [
  {
    _id: 'dummy-1',
    name: 'Pure Desi Ghee Motichoor Ladoo',
    price: 480,
    category: 'ladoo',
    originRegion: 'Jodhpur',
    description: 'Melt-in-mouth tiny boondi pearls fried in 100% pure desi ghee & garnished with pistachios.',
    image: "https://seedhegaonse.in/storage/app/public/product/thumbnail/2026-07-31-6a6c5190d063c.png",
    inStock: true
  },
  {
    _id: 'dummy-2',
    name: 'Traditional Mathura Peda',
    price: 520,
    category: 'peda',
    originRegion: 'Mathura',
    description: 'Slow-roasted authentic khoya infused with aromatic cardamom and traditional flavours.',
    image: "https://seedhegaonse.in/storage/app/public/product/thumbnail/2026-06-26-6a3e4b18431ae.png",
    inStock: true
  },
  {
    _id: 'dummy-3',
    name: 'Royal Agra Kesar Angoori Petha',
    price: 360,
    category: 'petha',
    originRegion: 'Agra',
    description: 'Juicy, soft, translucent sweet pumpkin bites infused with natural Kashmiri saffron.',
    image: "https://seedhegaonse.in/storage/app/public/product/thumbnail/2026-06-26-6a3e468293d75.png",
    inStock: true
  },
  {
    _id: 'dummy-4',
    name: 'Diamond Silver Foil Kaju Katli',
    price: 950,
    category: 'barfi',
    originRegion: 'Delhi NCR',
    description: 'Premium quality Goan cashews crafted with authentic edible pure silver vark.',
    image: 'https://seedhegaonse.in/storage/app/public/product/thumbnail/2026-06-26-6a3e4a022f488.png',
    inStock: true
  },
  {
    _id: 'dummy-5',
    name: 'Jaipuri Malai Rabdi Ghewar',
    price: 650,
    category: 'special',
    originRegion: 'Jaipur',
    description: 'Crispy honeycomb disc soaked in sugar syrup and topped with rich cardamom rabdi.',
    image: 'https://seedhegaonse.in/storage/app/public/product/thumbnail/2026-06-26-6a3e468293d75.png',
    inStock: true
  },
  {
    _id: 'dummy-6',
    name: 'Alwar Famous Danedar Milk Cake',
    price: 540,
    category: 'barfi',
    originRegion: 'Alwar',
    description: 'Rich, caramelized brown grainy milk fudge prepared from fresh whole buffalo milk.',
    image: 'https://seedhegaonse.in/storage/app/public/product/thumbnail/2026-06-26-6a3e404916f2c.png',
    inStock: true
  }
  ,
{
    _id: 'dummy-7',
    name: 'Hisar ki malai',
    price: 540,
    category: 'barfi',
    originRegion: 'Alwar',
    description: 'Rich, caramelized brown grainy milk fudge prepared from fresh whole buffalo milk.',
    image:"https://seedhegaonse.in/storage/app/public/product/thumbnail/2026-06-26-6a3e4b18431ae.png",
    inStock: true
  }

];

// 🟢 Bulletproof Helper to get JWT Token
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

// 🟢 Wishlist localStorage helpers
const WISHLIST_KEY = 'seedhegaonse_wishlist';
const loadWishlist = () => {
  try {
    const saved = localStorage.getItem(WISHLIST_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const Homepage = ({ addToCart, addedToast }) => {
  const navigate = useNavigate();
  // 🟢 Initially dummy products render honge taaki screen khali na lage
  const [products, setProducts] = useState(DUMMY_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [wishlist, setWishlist] = useState(loadWishlist);
  const [authAlert, setAuthAlert] = useState('');

  // 1. FETCH LIVE PRODUCTS & MERGE (Dummy First, Live Second)
  useEffect(() => {
    const fetchLiveProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();
        
        if (res.ok && Array.isArray(data)) {
          // 🟢 Dummy pehle + Backend products baad me
          // Agar aap backend ke items ke saath duplicate avoid karna chahte hain:
          const backendIds = new Set(data.map((item) => item._id));
          const uniqueDummies = DUMMY_PRODUCTS.filter((d) => !backendIds.has(d._id));
          
          setProducts([...uniqueDummies, ...data]);
        }
      } catch (err) {
        console.warn('Backend offline ya empty hai, dummy products active rahenge:', err);
        setProducts(DUMMY_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };

    const fetchBackendWishlist = async () => {
      const token = getAuthToken();
      if (!token) return;

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
          const serverWishlistIds = data.map((item) => 
            typeof item === 'object' && item !== null ? (item._id || item.id || item).toString() : item.toString()
          );
          setWishlist(serverWishlistIds);
        }
      } catch (err) {
        console.error('Failed to sync wishlist from backend:', err);
      }
    };

    fetchLiveProducts();
    fetchBackendWishlist();
  }, []);

  // 2. SCROLL REVEAL OBSERVER
  useEffect(() => {
    const revealElements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.12 }
    );

    revealElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [products]);

  // Persist wishlist
  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  const isWishlisted = (productId) => {
    if (!productId) return false;
    return wishlist.some((id) => id?.toString() === productId?.toString());
  };

  // 3. TOGGLE WISHLIST (Optimistic + Backend)
  const toggleWishlist = async (e, productId) => {
    e.stopPropagation();
    if (!productId) return;

    const pIdStr = productId.toString();
    const isCurrentlyLiked = isWishlisted(pIdStr);
    const previousWishlist = [...wishlist];

    // Local UI update
    const updatedWishlist = isCurrentlyLiked
      ? wishlist.filter((id) => id?.toString() !== pIdStr)
      : [...wishlist, pIdStr];
    setWishlist(updatedWishlist);

    // Dummy product ya guest user ke liye backend call skip
    const token = getAuthToken();
    if (!token || pIdStr.startsWith('dummy-')) return;

    try {
      const res = await fetch(`${API_BASE}/wishlist/toggle/${pIdStr}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        setWishlist(previousWishlist);
      }
    } catch (err) {
      setWishlist(previousWishlist);
    }
  };

  // HERO SLIDER DATA
  const heroSlides = [
    {
      id: 1,
      image: "https://seedhegaonse.in/storage/app/public/banner/2026-06-28-6a415293d55d6.png",
      subtitle: 'Pure Desi Ghee Goodness',
      title: 'Straight From Village Artisans',
      description: 'Handcrafted Traditional Sweets Delivered Fresh To Your Doorstep'
    },
    {
      id: 2,
      image: "https://seedhegaonse.in/storage/app/public/banner/2026-06-26-6a3e4fac3d1a0.png",
      subtitle: 'Authentic Regional Delicacies',
      title: 'Hisar Peda & Alwar Milk Cake',
      description: '100% Pure Milk & Pure Khoya Prepared Daily'
    }
  ];

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(slideInterval);
  }, [heroSlides.length]);

  // SMART FILTER LOGIC
  const filteredProducts = products.filter((p) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'wishlist') return isWishlisted(p._id);

    const category = (p.category || '').toLowerCase();
    const name = (p.name || '').toLowerCase();
    const combined = `${category} ${name}`;

    switch (activeTab) {
      case 'ladoo':
        return (
          combined.includes('ladoo') ||
          combined.includes('laddu') ||
          combined.includes('laddoo') ||
          combined.includes('motichoor') ||
          combined.includes('boondi') ||
          combined.includes('besan')
        );

      case 'peda':
        return (
          combined.includes('peda') ||
          combined.includes('pedha') ||
          combined.includes('pedas') ||
          combined.includes('dharwad') ||
          combined.includes('mathura')
        );

      case 'petha':
        return (
          combined.includes('petha') ||
          combined.includes('agra') ||
          combined.includes('angoori')
        );

      case 'barfi':
        return (
          combined.includes('barfi') ||
          combined.includes('burfi') ||
          combined.includes('katli') ||
          combined.includes('kaju') ||
          combined.includes('milk cake') ||
          combined.includes('kalakand') ||
          combined.includes('mysore pak')
        );

      case 'special':
        return (
          combined.includes('special') ||
          combined.includes('ghewar') ||
          combined.includes('ghevar') ||
          combined.includes('rasgulla') ||
          combined.includes('gulab jamun') ||
          combined.includes('halwa') ||
          combined.includes('jalebi') ||
          combined.includes('imarti') ||
          combined.includes('gujiya')
        );

      default:
        return category.includes(activeTab.toLowerCase()) || name.includes(activeTab.toLowerCase());
    }
  });

  // ADD TO CART BRIDGE
  const handleProductAddToCart = (p) => {
    const token = getAuthToken();

    if (!token) {
      setAuthAlert('Please sign in to add sweets to your cart!');
      setTimeout(() => {
        setAuthAlert('');
      }, 4000);
      return;
    }

    addToCart({
      id: p._id,
      name: p.name,
      price: `₹${p.price}`,
      img: getImageUrl(p.image),
      originRegion: p.originRegion
    });
  };

  const faqList = [
    { q: 'How do you guarantee Same Day Delivery in Delhi NCR?', a: 'All orders placed before 4 PM in Delhi NCR are freshly prepared in the morning and dispatched via our express delivery partners.' },
    { q: 'Are preservatives or artificial flavours added?', a: 'No! Absolutely 0 preservatives and 0 artificial flavours. We prepare sweets daily using 100% pure Desi Ghee.' },
    { q: 'What is the shelf life of these traditional sweets?', a: 'Our sweets remain perfectly fresh for 7 to 10 days at room temperature, and up to 15 days if refrigerated.' }
  ];

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="homepage-container">
      {/* FLOATING WHATSAPP BUTTON */}
      <a 
        href="https://wa.me/919315911105" 
        className="whatsapp-button pulse-anim" 
        target="_blank" 
        rel="noreferrer" 
        title="Chat on WhatsApp"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.762.459 3.48 1.333 5.001L2 22l5.122-1.343c1.468.802 3.123 1.225 4.887 1.226 5.507 0 9.989-4.478 9.99-9.985 0-5.507-4.482-9.998-9.987-9.998zm5.83 14.364c-.244.685-1.41 1.309-1.974 1.393-.505.075-1.144.106-1.844-.117-.424-.135-.97-.315-1.67-.616-2.937-1.268-4.854-4.258-5.001-4.453-.146-.195-1.195-1.591-1.195-3.033 0-1.441.758-2.151 1.026-2.443.268-.293.585-.366.78-.366.195 0 .39.002.561.01.18.008.421-.068.66.505.244.585.833 2.03.906 2.176.073.146.122.317.024.512-.098.195-.146.317-.293.488-.146.171-.307.382-.439.513-.146.146-.298.305-.128.597.171.293.758 1.252 1.626 2.025 1.118.995 2.062 1.304 2.355 1.45.293.146.463.122.634-.073.171-.195.732-.853.927-1.146.195-.293.39-.244.659-.146.268.098 1.708.805 2.001.951.293.146.488.22.561.341.073.122.073.71-.171 1.395z"/>
        </svg>
      </a>

      {/* CUSTOM AUTH ALERT */}
      {authAlert && (
        <div 
          className="cart-toast fade-slide-up" 
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            background: '#991b1b',
            color: '#ffffff',
            padding: '14px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            fontWeight: 500
          }}
        >
          <span>🔒 {authAlert}</span>
          <button
            onClick={() => navigate('/auth')}
            style={{
              background: '#f59e0b',
              color: '#78350f',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Sign In
          </button>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {addedToast && !authAlert && (
        <div className="cart-toast fade-slide-up">
          ✓ <strong>{addedToast}</strong> added to cart
        </div>
      )}

      {/* HERO SLIDER SECTION */}
      <section className="hero-slider-section">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-slide ${index === currentSlide ? 'active-slide' : ''}`}
            style={{ 
              backgroundImage: `linear-gradient(135deg, rgba(7, 35, 27, 0.82) 0%, rgba(13, 59, 46, 0.65) 100%), url(${slide.image})` 
            }}
          >
            <div className="hero-box">
              <span className="hero-subtitle">{slide.subtitle}</span>
              <h1>{slide.title}</h1>
              <p>{slide.description}</p>
              <button className="primary-btn" onClick={() => scrollToSection('products')}>
                Explore Authentic Sweets
              </button>
            </div>
          </div>
        ))}

        <div className="slider-dots">
          {heroSlides.map((_, idx) => (
            <span
              key={idx}
              className={`dot ${idx === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(idx)}
            />
          ))}
        </div>
      </section>

      {/* MAIN PRODUCTS SECTION */}
      <section id="products" className="products-section container reveal">
        <div className="section-heading-wrap">
          <div>
            <span className="sub-heading">Fresh & Authentic</span>
            <h2 className="main-heading">Village Special Sweets</h2>
          </div>

          {/* FILTER TABS */}
          <div className="tab-filters">
            <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
              All Sweets ({products.length})
            </button>
            <button className={`tab-btn ${activeTab === 'ladoo' ? 'active' : ''}`} onClick={() => setActiveTab('ladoo')}>
              Laddu
            </button>
            <button className={`tab-btn ${activeTab === 'peda' ? 'active' : ''}`} onClick={() => setActiveTab('peda')}>
              Peda
            </button>
            <button className={`tab-btn ${activeTab === 'petha' ? 'active' : ''}`} onClick={() => setActiveTab('petha')}>
              Petha
            </button>
            <button className={`tab-btn ${activeTab === 'barfi' ? 'active' : ''}`} onClick={() => setActiveTab('barfi')}>
              Barfi & Katli
            </button>
            <button className={`tab-btn ${activeTab === 'special' ? 'active' : ''}`} onClick={() => setActiveTab('special')}>
              Specials
            </button>
            <button className={`tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`} onClick={() => setActiveTab('wishlist')}>
              ❤ Wishlist ({wishlist.length})
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#b45309' }}>
            <h3>🍬 Loading fresh regional sweets...</h3>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fffbeb', borderRadius: '16px', border: '1px dashed #d97706', margin: '20px 0' }}>
            <h3 style={{ color: '#92400e' }}>
              {activeTab === 'wishlist' ? 'Your wishlist is empty!' : 'No sweets found in this category!'}
            </h3>
            <p style={{ color: '#b45309', margin: '8px 0 16px' }}>
              {activeTab === 'wishlist'
                ? 'Tap the heart icon on any sweet to save it here.'
                : 'Add authentic sweets from your Admin Panel to display here.'}
            </p>
            <button className="primary-btn" onClick={() => setActiveTab('all')}>
              View All Sweets
            </button>
          </div>
        ) : (
          <div className="modern-product-grid">
            {filteredProducts.map((p) => (
              <div key={p._id} className="modern-product-card">
                <div className="product-image-box">
                  {p.originRegion && (
                    <span className="product-tag origin-tag">
                      📍 {p.originRegion}
                    </span>
                  )}

                  <button
                    className={`like-btn ${isWishlisted(p._id) ? 'liked' : ''}`}
                    onClick={(e) => toggleWishlist(e, p._id)}
                    aria-label={isWishlisted(p._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                    title={isWishlisted(p._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isWishlisted(p._id) ? '#ef4444' : 'none'} stroke={isWishlisted(p._id) ? '#ef4444' : '#4b5563'} strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>

                  <img
                    src={getImageUrl(p.image)}
                    alt={p.name}
                    className="zoom-on-hover"
                    crossOrigin="anonymous"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop';
                    }}
                  />
                </div>

                <div className="product-info-box">
                  <div className="product-rating">
                    <span className="stars">★★★★★</span>
                    <span className="review-count">(100% Pure Desi Ghee)</span>
                  </div>

                  <h3 className="product-name" title={p.name}>
                    {p.name}
                  </h3>

                  {p.description && (
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.description}
                    </p>
                  )}

                  <div className="product-footer">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="price">₹{p.price}</span>
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
      </section>

      {/* PRODUCT IMAGES GALLERY SLIDER - same images as above, auto-scrolling */}
      {products.length > 0 && (
        <section className="gallery-slider-section reveal">
          <div className="section-heading-wrap text-center container" style={{ margin: '0 auto 18px' }}>
            <span className="sub-heading">Handpicked For You</span>
            <h2 className="main-heading">A Glimpse Of Our Sweets</h2>
          </div>

          <div className="gallery-slider-viewport">
            <div className="gallery-slider-track">
              {[...products, ...products].map((p, idx) => (
                <div className="gallery-slide-item" key={`gallery-${p._id}-${idx}`}>
                  <img
                    src={getImageUrl(p.image)}
                    alt={p.name}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop';
                    }}
                  />
                  <span className="gallery-slide-caption">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ SECTION */}
      <section className="faq-section container reveal">
        <div className="section-heading-wrap text-center">
          <span className="sub-heading">Got Questions?</span>
          <h2 className="main-heading">Frequently Asked Questions</h2>
        </div>

        <div className="faq-accordion">
          {faqList.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button 
                  className="faq-question" 
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                >
                  <h4>{faq.q}</h4>
                  <span className="faq-toggle-icon">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="faq-answer-content">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Homepage;