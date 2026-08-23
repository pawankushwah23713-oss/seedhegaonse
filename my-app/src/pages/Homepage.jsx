import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Homepage.css';
import banner1 from '../assets/banner1.png';
import banner2 from '../assets/banner2.png';
import dummy1 from '../assets/dumy1.png';
import dummy2 from '../assets/dumy2.png';
import dummy3 from '../assets/dumy3.png';
import dummy4 from '../assets/dumy4.png';
import dummy5 from '../assets/dumy5.png';
import dummy6 from '../assets/dumy6.png';
import dummy7 from '../assets/dumy7.png';

// 🟢 Backend API Base URL
const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const SERVER_HOST = API_BASE.replace('/api', '');

// 🟢 Fallback Dummy Products
const DUMMY_PRODUCTS = [
  {
    _id: 'dummy-1',
    name: 'Pure Desi Ghee Motichoor Ladoo',
    price: 480,
    originalPrice: 550,
    discount: 12,
    offerText: 'Festive Special',
    category: 'ladoo',
    originRegion: 'Jodhpur',
    description: 'Melt-in-mouth tiny boondi pearls fried in 100% pure desi ghee & garnished with pistachios. Prepared fresh daily using traditional village methods.',
    image: dummy1,
    inStock: true
  },
  {
    _id: 'dummy-2',
    name: 'Traditional Mathura Peda',
    price: 520,
    originalPrice: 600,
    discount: 13,
    offerText: 'Special Deal',
    category: 'peda',
    originRegion: 'Mathura',
    description: 'Slow-roasted authentic khoya infused with aromatic cardamom and traditional flavours, sourced directly from the holy city of Mathura.',
    image: dummy2,
    inStock: true
  },
  {
    _id: 'dummy-3',
    name: 'Royal Agra Kesar Angoori Petha',
    price: 360,
    originalPrice: 400,
    discount: 10,
    offerText: 'Fresh Stock',
    category: 'petha',
    originRegion: 'Agra',
    description: 'Juicy, soft, translucent sweet pumpkin bites infused with natural Kashmiri saffron and subtle rose water essence.',
    image: dummy3,
    inStock: true
  },
  {
    _id: 'dummy-4',
    name: 'Diamond Silver Foil Kaju Katli',
    price: 950,
    originalPrice: 1100,
    discount: 15,
    offerText: 'Best Seller',
    category: 'barfi',
    originRegion: 'Delhi NCR',
    description: 'Premium quality Goan cashews crafted with authentic edible pure silver vark and optimal sweetness for every festival.',
    image: dummy4,
    inStock: true
  },
  {
    _id: 'dummy-5',
    name: 'Jaipuri Malai Rabdi Ghewar',
    price: 650,
    originalPrice: 750,
    discount: 13,
    offerText: 'Limited Batch',
    category: 'special',
    originRegion: 'Jaipur',
    description: 'Crispy honeycomb disc soaked in saffron sugar syrup and topped with rich, thick cardamom rabdi and roasted dry fruits.',
    image: dummy5,
    inStock: true
  },
  {
    _id: 'dummy-6',
    name: 'Alwar Famous Danedar Milk Cake',
    price: 540,
    originalPrice: 600,
    discount: 10,
    offerText: '',
    category: 'barfi',
    originRegion: 'Alwar',
    description: 'Rich, caramelized brown grainy milk fudge prepared from slow-simmered fresh whole buffalo milk with no additives.',
    image: dummy6,
    inStock: true
  },
  {
    _id: 'dummy-7',
    name: 'Hisar ki Special Malai Peda',
    price: 540,
    originalPrice: 600,
    discount: 10,
    offerText: '',
    category: 'peda',
    originRegion: 'Hisar',
    description: 'Fresh cream & rich caramelized milk treat straight from Haryana’s renowned dairy heartland.',
    image: dummy7,
    inStock: true
  }
];

// Helper to get JWT Token
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

// Image Path Formatter
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

// 🟢 Helper to calculate Price, MRP and Discount %
const calculatePricing = (product, qty = 1) => {
  const price = Number(product.price) || 0;
  const originalPrice = Number(product.originalPrice) || 0;
  const manualDiscount = Number(product.discount) || 0;

  let discountPercent = 0;
  let mrp = originalPrice;

  if (manualDiscount > 0) {
    discountPercent = manualDiscount;
    if (!mrp || mrp <= price) {
      mrp = Math.round(price / (1 - discountPercent / 100));
    }
  } else if (originalPrice > price) {
    discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  return {
    price: price * qty,
    mrp: mrp > price ? mrp * qty : null,
    discountPercent: discountPercent > 0 ? discountPercent : null
  };
};

const WISHLIST_KEY = 'seedhegaonse_wishlist';
const loadWishlist = () => {
  try {
    const saved = localStorage.getItem(WISHLIST_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed)
      ? parsed.map((item) => (typeof item === 'object' && item !== null ? (item._id || item.id) : item).toString())
      : [];
  } catch {
    return [];
  }
};

const Homepage = ({ addToCart, addedToast }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [wishlist, setWishlist] = useState(loadWishlist);
  const [authAlert, setAuthAlert] = useState('');
  
  // Modal & Quantity State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalQty, setModalQty] = useState(1);

  // Ultra Zoom State
  const [zoomStyle, setZoomStyle] = useState({
    transformOrigin: 'center center',
    transform: 'scale(1)'
  });

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(2.4)'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)'
    });
  };

  const handleOpenModal = (product) => {
    setSelectedProduct(product);
    setModalQty(1);
  };

  useEffect(() => {
    document.body.style.overflow = selectedProduct ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedProduct]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedProduct(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 🟢 1. FETCH LIVE PRODUCTS FROM BACKEND
  useEffect(() => {
    const fetchLiveProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();
        
        if (res.ok && Array.isArray(data) && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(DUMMY_PRODUCTS);
        }
      } catch (err) {
        console.warn('Backend offline, using fallback products:', err);
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
          const serverWishlistIds = data
            .map((item) => (typeof item === 'object' && item !== null ? (item._id || item.id) : item))
            .filter(Boolean)
            .map((id) => id.toString());

          const merged = Array.from(new Set([...loadWishlist(), ...serverWishlistIds]));
          setWishlist(merged);
          localStorage.setItem(WISHLIST_KEY, JSON.stringify(merged));
        }
      } catch (err) {
        console.error('Backend wishlist sync error:', err);
      }
    };

    fetchLiveProducts();
    fetchBackendWishlist();
  }, []);

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  // Scroll Reveal Observer
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

  const isWishlisted = (productId) => {
    if (!productId) return false;
    const targetId = productId.toString();
    return wishlist.some((id) => {
      const cleanId = typeof id === 'object' && id !== null ? (id._id || id.id) : id;
      return cleanId?.toString() === targetId;
    });
  };

  const toggleWishlist = async (e, productId) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!productId) return;

    const pIdStr = productId.toString();

    setWishlist((prevWishlist) => {
      const cleanList = prevWishlist.map((id) =>
        (typeof id === 'object' && id !== null ? (id._id || id.id) : id)?.toString()
      ).filter(Boolean);

      const isCurrentlyLiked = cleanList.includes(pIdStr);
      const updated = isCurrentlyLiked
        ? cleanList.filter((id) => id !== pIdStr)
        : [...cleanList, pIdStr];

      localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
      return updated;
    });

    const token = getAuthToken();
    const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(pIdStr);

    if (token && isValidMongoId) {
      try {
        await fetch(`${API_BASE}/wishlist/toggle/${pIdStr}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (err) {
        console.warn('Backend sync failed, saved locally:', err);
      }
    }
  };

  const heroSlides = [
    { id: 1, image: banner1 },
    { id: 2, image: banner2 }
  ];

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(slideInterval);
  }, [heroSlides.length]);

  // SMART FILTER
  const filteredProducts = products.filter((p) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'wishlist') return isWishlisted(p._id);

    const category = (p.category || '').toLowerCase();
    const name = (p.name || '').toLowerCase();
    const combined = `${category} ${name}`;

    switch (activeTab) {
      case 'ladoo':
        return combined.includes('ladoo') || combined.includes('laddu') || combined.includes('motichoor') || combined.includes('boondi') || combined.includes('besan');
      case 'peda':
        return combined.includes('peda') || combined.includes('pedha') || combined.includes('mathura');
      case 'petha':
        return combined.includes('petha') || combined.includes('agra') || combined.includes('angoori');
      case 'barfi':
        return combined.includes('barfi') || combined.includes('burfi') || combined.includes('katli') || combined.includes('kaju') || combined.includes('milk cake');
      case 'special':
        return combined.includes('special') || combined.includes('ghewar') || combined.includes('ghevar') || combined.includes('rasgulla') || combined.includes('gulab jamun');
      default:
        return category.includes(activeTab.toLowerCase()) || name.includes(activeTab.toLowerCase());
    }
  });

  // ADD TO CART
  const handleProductAddToCart = (p, qty = 1) => {
    const token = getAuthToken();
    if (!token) {
      setAuthAlert('Please login first to add items to your cart!');
      setTimeout(() => setAuthAlert(''), 4000);
      return false;
    }

    addToCart({
      id: p._id,
      name: p.name,
      price: `₹${p.price}`,
      unitPrice: p.price,
      quantity: qty,
      totalPrice: p.price * qty,
      img: getImageUrl(p.image),
      originRegion: p.originRegion
    });
    return true;
  };

  const faqList = [
    { q: 'How do you guarantee Same Day Delivery in Delhi NCR?', a: 'All orders placed before 4 PM in Delhi NCR are freshly prepared in the morning and dispatched via our express delivery partners.' },
    { q: 'Are preservatives or artificial flavours added?', a: 'No! Absolutely 0 preservatives and 0 artificial flavours. We prepare sweets daily using 100% pure Desi Ghee.' },
    { q: 'What is the shelf life of these traditional sweets?', a: 'Our sweets remain perfectly fresh for 7 to 10 days at room temperature, and up to 15 days if refrigerated.' }
  ];

  return (
    <div className="homepage-container">
      {/* INLINE CSS FOR OFFER BADGES & ZOOM MODAL */}
      <style>{`
        .product-card-interactive {
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .product-card-interactive:hover {
          transform: translateY(-4px);
        }

        /* 🏷️ OFFER BADGES ON CARD */
        .card-offer-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: #ef4444;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          z-index: 2;
          box-shadow: 0 2px 6px rgba(239, 68, 68, 0.35);
        }

        .card-custom-offer-tag {
          position: absolute;
          bottom: 8px;
          left: 8px;
          background: rgba(15, 23, 42, 0.85);
          color: #fef08a;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 4px;
          z-index: 2;
        }

        .card-offer-image-sticker {
          position: absolute;
          bottom: 8px;
          right: 8px;
          width: 38px;
          height: 38px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #f59e0b;
          z-index: 2;
          background: #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }

        .product-mrp-price {
          font-size: 0.78rem;
          color: #94a3b8;
          text-decoration: line-through;
          margin-left: 6px;
          font-weight: 600;
        }

        /* Modal Styles */
        .product-modal-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(11, 28, 23, 0.78);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 16px;
          animation: modalFadeIn 0.25s ease-out;
        }

        .product-modal-card {
          background: #ffffff;
          border-radius: 20px;
          max-width: 900px;
          width: 100%;
          max-height: 92vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.45);
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          position: relative;
          animation: modalScaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .modal-close-btn {
          position: absolute;
          top: 14px; right: 14px;
          background: #f1f5f9;
          border: none;
          width: 38px; height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #334155;
          cursor: pointer;
          z-index: 20;
        }
        .modal-close-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
          transform: rotate(90deg);
        }

        .modal-image-col {
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          border-right: 1px solid #f1f5f9;
          overflow: hidden;
          position: relative;
          cursor: crosshair;
        }

        .modal-image-col img {
          max-width: 100%;
          max-height: 330px;
          object-fit: contain;
          border-radius: 12px;
          will-change: transform;
        }

        .modal-info-col {
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .modal-origin-badge {
          display: inline-block;
          background: #fef3c7;
          color: #92400e;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .modal-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .modal-price-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 12px;
        }
        .modal-price {
          font-size: 1.65rem;
          font-weight: 800;
          color: #059669;
        }
        .modal-mrp-price {
          font-size: 1.15rem;
          color: #94a3b8;
          text-decoration: line-through;
          font-weight: 600;
        }
        .modal-discount-tag {
          background: #fee2e2;
          color: #ef4444;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
        }

        .modal-qty-control-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 14px;
          margin-bottom: 20px;
        }
        .qty-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 4px 8px;
        }
        .qty-btn {
          background: #f1f5f9;
          border: none;
          width: 30px; height: 30px;
          border-radius: 6px;
          font-weight: 800;
          cursor: pointer;
        }
        .qty-num {
          font-size: 1.05rem;
          font-weight: 800;
          min-width: 22px;
          text-align: center;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }
        .modal-btn-cart {
          flex: 1;
          background: #047857;
          color: #ffffff;
          border: none;
          padding: 12px 20px;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
        }
        .modal-btn-wishlist {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 0 16px;
          border-radius: 10px;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .product-modal-card {
            grid-template-columns: 1fr;
          }
          .modal-image-col {
            border-right: none;
            border-bottom: 1px solid #f1f5f9;
          }
        }
      `}</style>

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

      {/* AUTH REQUIRED ALERT */}
      {authAlert && (
        <div 
          className="cart-toast fade-slide-up"
          style={{ 
            background: '#dc2626', 
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <span>⚠️ {authAlert}</span>
          <button
            onClick={() => navigate('/auth')}
            style={{
              background: '#ffffff',
              color: '#dc2626',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Login Now
          </button>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {addedToast && !authAlert && (
        <div className="cart-toast fade-slide-up">
          ✓ <strong>{addedToast}</strong> added to cart
        </div>
      )}

      {/* 🌟 PRODUCT DETAILS MODAL */}
      {selectedProduct && (() => {
        const pricing = calculatePricing(selectedProduct, modalQty);
        return (
          <div 
            className="product-modal-backdrop"
            onClick={() => setSelectedProduct(null)}
          >
            <div 
              className="product-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="modal-close-btn" 
                onClick={() => setSelectedProduct(null)}
                aria-label="Close"
              >
                ✕
              </button>

              {/* Left Col: Image */}
              <div 
                className="modal-image-col"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <img
                  src={getImageUrl(selectedProduct.image)}
                  alt={selectedProduct.name}
                  style={zoomStyle}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop';
                  }}
                />
              </div>

              {/* Right Col: Details */}
              <div className="modal-info-col">
                <div>
                  {selectedProduct.originRegion && (
                    <span className="modal-origin-badge">
                      📍 {selectedProduct.originRegion} Special
                    </span>
                  )}

                  <h3 className="modal-title">{selectedProduct.name}</h3>

                  {/* 🏷️ Dynamic Price & Calculated Discount */}
                  <div className="modal-price-row">
                    <span className="modal-price">₹{pricing.price}</span>
                    {pricing.mrp && (
                      <span className="modal-mrp-price">₹{pricing.mrp}</span>
                    )}
                    {pricing.discountPercent && (
                      <span className="modal-discount-tag">{pricing.discountPercent}% OFF</span>
                    )}
                    {selectedProduct.offerText && (
                      <span className="modal-discount-tag" style={{ background: '#fef3c7', color: '#b45309' }}>
                        🏷️ {selectedProduct.offerText}
                      </span>
                    )}
                  </div>

                  <p className="modal-desc" style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '16px' }}>
                    {selectedProduct.description || 'Authentic traditional recipe prepared using 100% pure desi ghee with no artificial flavours or preservatives.'}
                  </p>

                  {/* Qty Selector */}
                  <div className="modal-qty-control-row">
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>Select Quantity / Box:</span>
                    <div className="qty-box">
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => setModalQty((prev) => Math.max(1, prev - 1))}
                        disabled={modalQty <= 1}
                      >
                        −
                      </button>
                      <span className="qty-num">{modalQty}</span>
                      <button
                        type="button"
                        className="qty-btn"
                        onClick={() => setModalQty((prev) => prev + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="modal-actions">
                  <button
                    className="modal-btn-cart"
                    onClick={() => {
                      const added = handleProductAddToCart(selectedProduct, modalQty);
                      if (added) setSelectedProduct(null);
                    }}
                    disabled={selectedProduct.inStock === false}
                  >
                    {selectedProduct.inStock === false 
                      ? 'Out of Stock' 
                      : `Add ${modalQty} to Cart • ₹${pricing.price}`}
                  </button>

                  <button
                    className="modal-btn-wishlist"
                    onClick={(e) => toggleWishlist(e, selectedProduct._id)}
                    title="Wishlist"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill={isWishlisted(selectedProduct._id) ? '#ef4444' : 'none'} stroke={isWishlisted(selectedProduct._id) ? '#ef4444' : '#64748b'} strokeWidth="2.2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* HERO SLIDER SECTION */}
      <section className="hero-slider-section">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-slide ${index === currentSlide ? 'active-slide' : ''}`}
            style={{ 
              backgroundImage: `linear-gradient(135deg, rgba(7, 35, 27, 0.82) 0%, rgba(13, 59, 46, 0.65) 100%), url(${slide.image})` 
            }}
          />
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

        {/* PRODUCTS GRID */}
        {loading && products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#b45309' }}>
            <h3>🍬 Loading fresh regional sweets...</h3>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fffbeb', borderRadius: '16px', border: '1px dashed #d97706', margin: '20px 0' }}>
            <h3 style={{ color: '#92400e' }}>
              {activeTab === 'wishlist' ? 'Your wishlist is empty!' : 'No sweets found in this category!'}
            </h3>
            <button className="primary-btn" onClick={() => setActiveTab('all')} style={{ marginTop: '10px' }}>
              View All Sweets
            </button>
          </div>
        ) : (
          <div className="modern-product-grid">
            {filteredProducts.map((p) => {
              const liked = isWishlisted(p._id);
              const pricing = calculatePricing(p, 1);

              return (
                <div 
                  key={p._id} 
                  className="modern-product-card product-card-interactive"
                  onClick={() => handleOpenModal(p)}
                >
                  <div className="product-image-box">
                    {/* 🟢 Discount Badge */}
                    {pricing.discountPercent ? (
                      <span className="card-offer-badge">
                        {pricing.discountPercent}% OFF
                      </span>
                    ) : p.originRegion ? (
                      <span className="product-tag origin-tag">
                        📍 {p.originRegion}
                      </span>
                    ) : null}

                    {/* 🟢 Custom Offer Tag Text */}
                    {p.offerText && (
                      <span className="card-custom-offer-tag">
                        🏷️ {p.offerText}
                      </span>
                    )}

                    {/* 🟢 Offer Image Badge Sticker */}
                    {p.offerImage && (
                      <img
                        src={getImageUrl(p.offerImage)}
                        alt="Offer Badge"
                        className="card-offer-image-sticker"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}

                    {/* ❤️ HEART / WISHLIST BUTTON */}
                    <button
                      type="button"
                      className={`like-btn ${liked ? 'liked' : ''}`}
                      onClick={(e) => toggleWishlist(e, p._id)}
                      aria-label="Wishlist"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? '#ef4444' : 'none'} stroke={liked ? '#ef4444' : '#4b5563'} strokeWidth="2.2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </button>

                    <img
                      src={getImageUrl(p.image)}
                      alt={p.name}
                      className="zoom-on-hover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop';
                      }}
                    />
                  </div>

                  <div className="product-info-box">
                    <div className="product-rating">
                      <span className="stars">★★★★★</span>
                    </div>

                    <h3 className="product-name" title={p.name}>
                      {p.name}
                    </h3>

                    <div className="product-footer">
                      <div className="product-price-block">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span className="price">₹{p.price}</span>
                          {pricing.mrp && (
                            <span className="product-mrp-price">₹{pricing.mrp}</span>
                          )}
                        </div>
                        <span className="unit-label">Per Box / Kg</span>
                      </div>

                      <button
                        className="cart-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProductAddToCart(p, 1);
                        }}
                        disabled={p.inStock === false}
                      >
                        {p.inStock === false ? 'Out of Stock' : '+ Add'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* GALLERY SECTION */}
      {products.length > 0 && (
        <section className="gallery-slider-section reveal">
          <div className="section-heading-wrap text-center container" style={{ marginBottom: '18px' }}>
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