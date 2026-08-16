import React, { useState, useEffect } from 'react';
import './Homepage.css';

// Dynamic API & Server Base Configuration
const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const SERVER_HOST = API_BASE.replace('/api', '');

// 🟢 Backend Image Formatter with Fallback
const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop';
  }
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Windows backslash fix & forward slash normalization
  const cleanPath = imagePath.replace(/\\/g, '/');
  const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${SERVER_HOST}${normalizedPath}`;
};

const Homepage = ({ addToCart, addedToast }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  // 1. FETCH REAL PRODUCTS FROM BACKEND (MongoDB)
  useEffect(() => {
    const fetchLiveProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setProducts(data);
        }
      } catch (err) {
        console.error('Failed to load products from server:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveProducts();
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

  // 3. HERO SLIDER DATA
  const heroSlides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=1200&auto=format&fit=crop',
      subtitle: 'Pure Desi Ghee Goodness',
      title: 'Straight From Village Artisans',
      description: 'Handcrafted Traditional Sweets Delivered Fresh To Your Doorstep'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=1200&auto=format&fit=crop',
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

  // 🟢 4. SMART FILTER LOGIC (Category + Name + Multiple Spellings)
  const filteredProducts = products.filter((p) => {
    if (activeTab === 'all') return true;

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

  // 5. ADD TO CART BRIDGE FUNCTION
  const handleProductAddToCart = (p) => {
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

      {/* TOAST NOTIFICATION */}
      {addedToast && (
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

        {/* SLIDER DOTS */}
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

      {/* ── MAIN PRODUCTS SECTION (LIVE FROM BACKEND) ── */}
      <section id="products" className="products-section container reveal">
        <div className="section-heading-wrap">
          <div>
            <span className="sub-heading">Fresh & Authentic</span>
            <h2 className="main-heading">Village Special Sweets</h2>
          </div>

          {/* 🟢 FILTER TABS */}
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
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#b45309' }}>
            <h3>🍬 Loading fresh regional sweets...</h3>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* EMPTY STATE */
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fffbeb', borderRadius: '16px', border: '1px dashed #d97706', margin: '20px 0' }}>
            <h3 style={{ color: '#92400e' }}>No sweets found in this category!</h3>
            <p style={{ color: '#b45309', margin: '8px 0 16px' }}>Add authentic sweets from your Admin Panel to display here.</p>
            <button className="primary-btn" onClick={() => setActiveTab('all')}>
              View All Sweets
            </button>
          </div>
        ) : (
          /* 🟢 MODERN PRODUCT GRID */
          <div className="modern-product-grid">
            {filteredProducts.map((p) => (
              <div key={p._id} className="modern-product-card">
                <div className="product-image-box">
                  {/* Village Origin Badge */}
                  {p.originRegion && (
                    <span className="product-tag origin-tag">
                      📍 {p.originRegion}
                    </span>
                  )}

                  {/* Backend Image with CORS & Fallback */}
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