import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './CakePage.css';

// 🟢 Backend API Base URL
const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const SERVER_HOST = API_BASE.replace('/api', '');
const WISHLIST_KEY = 'seedhegaonse_wishlist';

// Helper to check dummy product
const isDummyProduct = (product) => {
  if (!product) return false;
  return Boolean(product.isDummy || product._id?.toString().startsWith('dummy'));
};

// 🟢 Out of Stock Helper
const isOutOfStock = (product) => product?.inStock === false;

// 🟢 Helper to get Default Cake Variants (500g, 1kg, 2kg / Bento)
export const getProductVariants = (product) => {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants;
  }
  const isDummy = isDummyProduct(product);
  const basePrice = Number(product.price) || 0;
  const hasDiscount = !isDummy && (Number(product.originalPrice) > basePrice || Number(product.discountPercent) > 0);
  const baseMrp = Number(product.originalPrice) || basePrice;
  const discountVal = isDummy ? 0 : (Number(product.discountPercent) || 0);

  if (product.category === 'bento') {
    return [
      {
        _id: 'v-bento-250',
        label: '250g',
        weight: '250g',
        price: basePrice,
        originalPrice: hasDiscount ? baseMrp : null,
        discount: discountVal
      },
      {
        _id: 'v-bento-500',
        label: '500g',
        weight: '500g',
        price: Math.round(basePrice * 1.6),
        originalPrice: hasDiscount ? Math.round(baseMrp * 1.6) : null,
        discount: discountVal
      }
    ];
  }

  return [
    {
      _id: 'v-500',
      label: '500g (0.5 kg)',
      weight: '500g',
      price: basePrice,
      originalPrice: hasDiscount ? baseMrp : null,
      discount: discountVal
    },
    {
      _id: 'v-1000',
      label: '1kg (1.0 kg)',
      weight: '1kg',
      price: Math.round(basePrice * 1.85),
      originalPrice: hasDiscount ? Math.round(baseMrp * 1.85) : null,
      discount: discountVal
    },
    {
      _id: 'v-2000',
      label: '2kg Party Size',
      weight: '2kg',
      price: Math.round(basePrice * 3.5),
      originalPrice: hasDiscount ? Math.round(baseMrp * 3.5) : null,
      discount: discountVal
    }
  ];
};

// 🟢 Dummy Cake Fallback Products
const DUMMY_CAKES = [
  {
    _id: 'dummy-cake-1',
    isDummy: true,
    name: 'Belgian Dark Chocolate Truffle Cake',
    category: 'chocolate',
    originRegion: 'Fresh Bakehouse',
    description: 'Layers of moist dark chocolate sponge filled with rich, silky Belgian ganache and glazed with chocolate glaze.',
    price: 549,
    originalPrice: 549,
    discountPercent: 0,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop',
    inStock: true
  },
  {
    _id: 'dummy-cake-2',
    isDummy: true,
    name: 'Classic Red Velvet Cream Cheese Cake',
    category: 'redvelvet',
    originRegion: 'Master Chef Special',
    description: 'Velvety crimson sponge paired with authentic Philadelphia style cream cheese frosting and fine red velvet crumbs.',
    price: 599,
    originalPrice: 599,
    discountPercent: 0,
    image: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?q=80&w=600&auto=format&fit=crop',
    inStock: true
  },
  {
    _id: 'dummy-cake-3',
    isDummy: true,
    name: 'Exotic Fresh Seasonal Fruit Cake',
    category: 'fruit',
    originRegion: 'Farm Fresh',
    description: 'Light vanilla sponge layered with freshly whipped cream and loaded with hand-cut kiwis, apples, oranges, and strawberries.',
    price: 520,
    originalPrice: 520,
    discountPercent: 0,
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=600&auto=format&fit=crop',
    inStock: true
  },
  {
    _id: 'dummy-cake-4',
    isDummy: true,
    name: 'New York Baked Blueberry Cheesecake',
    category: 'cheesecake',
    originRegion: 'Gourmet Selection',
    description: 'Traditional slow-baked rich cheesecake on a buttery graham cracker crust topped with thick wild blueberry compote.',
    price: 750,
    originalPrice: 750,
    discountPercent: 0,
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=600&auto=format&fit=crop',
    inStock: true
  },
  {
    _id: 'dummy-cake-5',
    isDummy: true,
    name: 'Crunchy Caramel Butterscotch Cake',
    category: 'butterscotch',
    originRegion: 'Daily Fresh Oven',
    description: 'Golden sponge layered with home-cooked brown sugar butterscotch sauce and caramelized cashew praline crunch.',
    price: 479,
    originalPrice: 479,
    discountPercent: 0,
    image: 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?q=80&w=600&auto=format&fit=crop',
    inStock: true
  },
  {
    _id: 'dummy-cake-6',
    isDummy: true,
    name: 'Pastel Korean Heart Bento Cake',
    category: 'bento',
    originRegion: 'Trending Korean Design',
    description: 'Cute pocket-sized minimalist birthday cake decorated with pastel aesthetic buttercream design. Comes with candle & fork.',
    price: 349,
    originalPrice: 349,
    discountPercent: 0,
    image: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?q=80&w=600&auto=format&fit=crop',
    inStock: true
  }
];

const FALLBACK_CAKE_IMG = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop';

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

const getImageUrl = (imagePath) => {
  if (!imagePath) return FALLBACK_CAKE_IMG;
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

const calculatePricing = (targetObj, qty = 1, isDummy = false) => {
  const price = Number(targetObj?.price) || 0;
  if (isDummy) {
    return { price: price * qty, mrp: null, discountPercent: null, savings: 0 };
  }
  let mrp = Number(targetObj?.originalPrice) || 0;
  const manualDiscount = Number(targetObj?.discount || targetObj?.discountPercent) || 0;
  let discountPercent = 0;

  if (manualDiscount > 0) {
    discountPercent = manualDiscount;
    if (!mrp || mrp <= price) {
      mrp = Math.round(price / (1 - discountPercent / 100));
    }
  } else if (mrp > price) {
    discountPercent = Math.round(((mrp - price) / mrp) * 100);
  }

  const savings = (mrp > price && discountPercent > 0) ? (mrp - price) * qty : 0;
  return {
    price: price * qty,
    mrp: (mrp > price && discountPercent > 0) ? mrp * qty : null,
    discountPercent: discountPercent > 0 ? discountPercent : null,
    savings
  };
};

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

// 🟢 Cake Card Slider
const CakeCardSlider = ({ images, alt }) => {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(0);
  const slides = images.length > 0 ? images : [FALLBACK_CAKE_IMG];

  useEffect(() => {
    setIndex(0);
    if (slides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (slides.length <= 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 35) {
      setIndex((prev) => (prev + 1) % slides.length);
    } else if (diff < -35) {
      setIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    }
  };

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="ck-card-slider-track"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((src, i) => (
          <div className="ck-card-slider-slide" key={i}>
            <img
              src={src}
              alt={alt}
              className="ck-card-product-img"
              loading="lazy"
              onError={(e) => { e.target.src = FALLBACK_CAKE_IMG; }}
            />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="ck-card-slider-dots" onClick={(e) => e.stopPropagation()}>
          {slides.map((_, i) => (
            <span
              key={i}
              className={`ck-card-slider-dot ${i === index ? 'ck-active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 🟢 Cake Modal Slider
const CakeModalSlider = ({ images, alt, zoomStyle }) => {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(0);
  const slides = images.length > 0 ? images : [FALLBACK_CAKE_IMG];

  useEffect(() => {
    setIndex(0);
    if (slides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (slides.length <= 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 35) {
      setIndex((prev) => (prev + 1) % slides.length);
    } else if (diff < -35) {
      setIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    }
  };

  return (
    <div
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="ck-modal-slider-track"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((src, i) => (
          <div className="ck-modal-slider-slide" key={i}>
            <img
              src={src}
              alt={alt}
              style={i === index ? zoomStyle : undefined}
              onError={(e) => { e.target.src = FALLBACK_CAKE_IMG; }}
            />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="ck-modal-slider-dots" onClick={(e) => e.stopPropagation()}>
          {slides.map((_, i) => (
            <span
              key={i}
              className={`ck-modal-slider-dot ${i === index ? 'ck-active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 🟢 Individual Cake Card
const CakeProductCard = ({ product, isWishlisted, toggleWishlist, onOpenModal, onAddToCart }) => {
  const isDummy = isDummyProduct(product);
  const outOfStock = isOutOfStock(product);
  const variants = getProductVariants(product);
  const [selectedVariant, setSelectedVariant] = useState(variants[0]);

  const pricing = calculatePricing(selectedVariant, 1, isDummy);
  const liked = isWishlisted(product._id);

  const hasTimeline = product.discountPercent > 0 && (!product.discountValidUntil || new Date(product.discountValidUntil) > new Date());
  const coupons = Array.isArray(product.couponsList) ? product.couponsList : [];
  const giftList = Array.isArray(product.giftTiers) ? product.giftTiers : [];

  return (
    <div
      className="ck-product-card"
      style={{ position: 'relative', cursor: outOfStock ? 'not-allowed' : 'pointer' }}
      onClick={() => {
        if (outOfStock) return;
        onOpenModal(product, selectedVariant);
      }}
    >
      {outOfStock && (
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-8deg)',
            background: '#dc2626',
            color: '#fff',
            padding: '8px 18px',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '0.85rem',
            letterSpacing: '0.5px',
            boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
            zIndex: 5,
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          ⛔ SOLD OUT
        </div>
      )}

      <div className="ck-card-top-bar" style={{ position: 'relative', zIndex: 6 }}>
        {outOfStock ? (
          <span className="ck-badge-discount" style={{ background: '#dc2626', color: '#fff' }}>
            SOLD OUT
          </span>
        ) : hasTimeline ? (
          <span className="ck-badge-discount">⏳ {product.discountPercent}% OFF</span>
        ) : !isDummy && pricing.discountPercent ? (
          <span className="ck-badge-discount">{pricing.discountPercent}% OFF</span>
        ) : (
          <span className="ck-badge-category-mini">🎂 {product.category}</span>
        )}

        <button
          type="button"
          className={`ck-card-heart-btn ${liked ? 'ck-is-liked' : ''}`}
          onClick={(e) => toggleWishlist(e, product._id)}
          aria-label="Wishlist"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? '#e11d48' : 'none'} stroke={liked ? '#e11d48' : '#64748b'} strokeWidth="2.2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      <div
        className="ck-card-media-box"
        style={outOfStock ? { filter: 'blur(3px) grayscale(0.85)', opacity: 0.65 } : undefined}
      >
        <CakeCardSlider
          images={[getImageUrl(product.image)]}
          alt={product.name}
        />
      </div>

      <div
        className="ck-card-origin-strip"
        style={outOfStock ? { filter: 'blur(1.5px)', opacity: 0.6 } : undefined}
      >
        <span>✨ 100% Freshly Baked Daily • {product.originRegion || 'Fresh Oven'}</span>
      </div>

      <div className="ck-card-body">
        <h3
          className="ck-card-title"
          title={product.name}
          style={outOfStock ? { opacity: 0.55 } : undefined}
        >
          {product.name}
        </h3>

        <div
          className="ck-card-variants-container"
          onClick={(e) => e.stopPropagation()}
          style={outOfStock ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
        >
          <div className="ck-variant-chips-list">
            {variants.map((v, idx) => {
              const isActive = selectedVariant.label === v.label;
              return (
                <button
                  key={v._id || idx}
                  type="button"
                  className={`ck-variant-pill-btn ${isActive ? 'ck-active' : ''}`}
                  onClick={() => setSelectedVariant(v)}
                  disabled={outOfStock}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>

        {(coupons.length > 0 || giftList.length > 0 || product.isFreeDelivery) && (
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', margin: '4px 0 8px' }}>
            {coupons.slice(0, 1).map((cp, i) => (
              <span key={i} style={{ background: '#ede9fe', color: '#5b21b6', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                🎟️ {cp.code}
              </span>
            ))}
            {giftList.slice(0, 1).map((g, i) => (
              <span key={i} style={{ background: '#dbeafe', color: '#1e40af', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                🎁 Free Gift
              </span>
            ))}
            {product.isFreeDelivery && (
              <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                🚚 Free Delivery
              </span>
            )}
          </div>
        )}

        <div className="ck-card-footer">
          <div className="ck-card-price-group" style={outOfStock ? { opacity: 0.5 } : undefined}>
            <div className="ck-price-row">
              <span className="ck-current-price">₹{pricing.price}</span>
              {!isDummy && pricing.mrp && <span className="ck-mrp-price">₹{pricing.mrp}</span>}
            </div>
            {!isDummy && pricing.savings > 0 && (
              <span className="ck-savings-tag">Save ₹{pricing.savings}</span>
            )}
          </div>

          <button
            className="ck-btn-add-cart"
            onClick={(e) => {
              e.stopPropagation();
              if (outOfStock) return;
              onAddToCart(product, 1, selectedVariant);
            }}
            disabled={outOfStock}
            style={outOfStock ? { background: '#94a3b8', cursor: 'not-allowed', opacity: 0.9 } : undefined}
          >
            {outOfStock ? 'Sold Out' : '+ ADD'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CakePage = ({ addToCart, addedToast }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [wishlist, setWishlist] = useState(loadWishlist);
  const [authAlert, setAuthAlert] = useState('');

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedModalVariant, setSelectedModalVariant] = useState(null);
  const [modalQty, setModalQty] = useState(1);

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
      transform: 'scale(2.2)'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)'
    });
  };

  const handleOpenModal = (product, initialVariant = null) => {
    if (isOutOfStock(product)) return;
    setSelectedProduct(product);
    const variants = getProductVariants(product);
    setSelectedModalVariant(initialVariant || variants[0]);
    setModalQty(1);
  };

  useEffect(() => {
    document.body.style.overflow = selectedProduct ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedProduct]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedProduct(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load Cake Products & Sync Backend Wishlist
  useEffect(() => {
    const fetchCakes = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/cakes`);
        const data = await res.json();
        if (res.ok && Array.isArray(data) && data.length > 0) {
          const apiIds = new Set(data.map((c) => c._id?.toString()));
          const nonDupDummies = DUMMY_CAKES.filter((d) => !apiIds.has(d._id?.toString()));
          setProducts([...data, ...nonDupDummies]);
        } else {
          setProducts(DUMMY_CAKES);
        }
      } catch {
        setProducts(DUMMY_CAKES);
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

    fetchCakes();
    fetchBackendWishlist();
  }, []);

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    const revealElements = document.querySelectorAll('.ck-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('ck-active');
        });
      },
      { threshold: 0.12 }
    );
    revealElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [products]);

  // 🟢 Wishlist Check Helper
  const isWishlisted = (productId) => {
    if (!productId) return false;
    const targetId = productId.toString();
    return wishlist.some((id) => {
      const cleanId = typeof id === 'object' && id !== null ? (id._id || id.id) : id;
      return cleanId?.toString() === targetId;
    });
  };

  // 🟢 Shared Wishlist Toggle (Syncs localStorage + Backend)
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

  // Banner Slides
  const heroSlides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id: 2,
      image: 'https://images.pexels.com/photos/1793037/pexels-photo-1793037.jpeg'
    }
  ];

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(slideInterval);
  }, [heroSlides.length]);

  const filteredProducts = products.filter((p) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'wishlist') return isWishlisted(p._id);
    const category = (p.category || '').toLowerCase();
    const name = (p.name || '').toLowerCase();
    return category.includes(activeTab.toLowerCase()) || name.includes(activeTab.toLowerCase());
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aOut = isOutOfStock(a) ? 1 : 0;
    const bOut = isOutOfStock(b) ? 1 : 0;
    return aOut - bOut;
  });

  const handleCakeAddToCart = (p, qty = 1, variant = null) => {
    if (isOutOfStock(p)) {
      setAuthAlert(`"${p.name}" abhi Out of Stock hai`);
      setTimeout(() => setAuthAlert(''), 2500);
      return false;
    }

    const activeVariant = variant || (p.variants && p.variants[0]) || {
      label: '500g (0.5 kg)',
      price: p.price
    };
    const variantPrice = Number(activeVariant.price || p.price);
    const variantLabel = activeVariant.label || '500g';

    if (addToCart) {
      addToCart({
        id: `${p._id}_${variantLabel}`,
        productId: p._id,
        name: `${p.name} (${variantLabel})`,
        variant: variantLabel,
        price: `₹${variantPrice}`,
        unitPrice: variantPrice,
        quantity: qty,
        totalPrice: variantPrice * qty,
        img: getImageUrl(p.image),
        originRegion: p.originRegion || 'Fresh Bakehouse',
        giftTiers: p.giftTiers || [],
        bulkTiers: p.bulkTiers || [],
        couponsList: p.couponsList || [],
        isFreeDelivery: p.isFreeDelivery || false
      });
    }
    return true;
  };

  return (
    <div className="ck-homepage-container">
      <a
        href="https://wa.me/919315911105"
        className="ck-whatsapp-button ck-pulse-anim"
        target="_blank"
        rel="noreferrer"
        title="Custom Cake Order on WhatsApp"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.762.459 3.48 1.333 5.001L2 22l5.122-1.343c1.468.802 3.123 1.225 4.887 1.226 5.507 0 9.989-4.478 9.99-9.985 0-5.507-4.482-9.998-9.987-9.998zm5.83 14.364c-.244.685-1.41 1.309-1.974 1.393-.505.075-1.144.106-1.844-.117-.424-.135-.97-.315-1.67-.616-2.937-1.268-4.854-4.258-5.001-4.453-.146-.195-1.195-1.591-1.195-3.033 0-1.441.758-2.151 1.026-2.443.268-.293.585-.366.78-.366.195 0 .39.002.561.01.18.008.421-.068.66.505.244.585.833 2.03.906 2.176.073.146.122.317.024.512-.098.195-.146.317-.293.488-.146.171-.307.382-.439.513-.146.146-.298.305-.128.597.171.293.758 1.252 1.626 2.025 1.118.995 2.062 1.304 2.355 1.45.293.146.463.122.634-.073.171-.195.732-.853.927-1.146.195-.293.39-.244.659-.146.268.098 1.708.805 2.001.951.293.146.488.22.561.341.073.122.073.71-.171 1.395z"/>
        </svg>
      </a>

      {authAlert && (
        <div className="ck-cart-toast" style={{ background: '#dc2626' }}>
          <span>⚠️ {authAlert}</span>
        </div>
      )}

      {addedToast && !authAlert && (
        <div className="ck-cart-toast">
          ✓ <strong>{addedToast}</strong> added to cart
        </div>
      )}

      {/* QUICK VIEW MODAL */}
      {selectedProduct && (() => {
        const isDummy = isDummyProduct(selectedProduct);
        const modalOutOfStock = isOutOfStock(selectedProduct);
        const modalVariants = getProductVariants(selectedProduct);
        const currentActiveVariant = selectedModalVariant || modalVariants[0];
        const pricing = calculatePricing(currentActiveVariant, modalQty, isDummy);

        return (
          <div className="ck-product-modal-backdrop" onClick={() => setSelectedProduct(null)}>
            <div className="ck-product-modal-card" onClick={(e) => e.stopPropagation()}>
              <button className="ck-modal-close-btn" onClick={() => setSelectedProduct(null)} aria-label="Close">✕</button>

              <div
                className="ck-modal-image-col"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={modalOutOfStock ? { filter: 'blur(4px) grayscale(0.85)', opacity: 0.7 } : undefined}
              >
                <CakeModalSlider
                  images={[getImageUrl(selectedProduct.image)]}
                  alt={selectedProduct.name}
                  zoomStyle={zoomStyle}
                />
              </div>

              <div className="ck-modal-info-col">
                <div>
                  <div className="ck-modal-tags-row">
                    {modalOutOfStock && (
                      <span className="ck-badge-category" style={{ background: '#dc2626', color: '#fff' }}>
                        ⛔ OUT OF STOCK
                      </span>
                    )}
                    <span className="ck-badge-origin">⭐ {selectedProduct.originRegion || 'Fresh Oven'}</span>
                    {selectedProduct.category && (
                      <span className="ck-badge-category">{selectedProduct.category.toUpperCase()}</span>
                    )}
                  </div>

                  <h3 className="ck-modal-title">{selectedProduct.name}</h3>

                  <div className="ck-modal-variant-section">
                    <span className="ck-variant-section-title">Select Weight / Size:</span>
                    <div
                      className="ck-modal-variant-chips"
                      style={modalOutOfStock ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
                    >
                      {modalVariants.map((v, idx) => {
                        const isActive = currentActiveVariant?.label === v.label;
                        return (
                          <button
                            key={v._id || idx}
                            type="button"
                            className={`ck-modal-chip-btn ${isActive ? 'ck-active' : ''}`}
                            onClick={() => setSelectedModalVariant(v)}
                            disabled={modalOutOfStock}
                          >
                            <span className="ck-chip-label">{v.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="ck-modal-price-box">
                    <span className="ck-modal-current-price">₹{pricing.price}</span>
                    {!isDummy && pricing.mrp && <span className="ck-modal-mrp-price">₹{pricing.mrp}</span>}
                    {!isDummy && pricing.discountPercent && (
                      <span className="ck-modal-discount-pill">{pricing.discountPercent}% OFF</span>
                    )}
                  </div>

                  <p className="ck-modal-desc">
                    {selectedProduct.description || 'Crafted with fine imported chocolates, pure butter and 100% fresh cream. Free birthday candle and knife included.'}
                  </p>

                  <div className="ck-modal-trust-checklist">
                    <div className="ck-trust-check-item">✓ 100% Eggless Option Available</div>
                    <div className="ck-trust-check-item">✓ Baked Fresh Every Morning</div>
                    <div className="ck-trust-check-item">✓ Same Day Express Delivery</div>
                    <div className="ck-trust-check-item">✓ Temperature-Controlled Box</div>
                  </div>
                </div>

                <div className="ck-modal-actions-row">
                  <button
                    className="ck-btn-modal-wishlist"
                    onClick={(e) => toggleWishlist(e, selectedProduct._id)}
                    title="Wishlist"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill={isWishlisted(selectedProduct._id) ? '#e11d48' : 'none'} stroke={isWishlisted(selectedProduct._id) ? '#e11d48' : '#64748b'} strokeWidth="2.2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>

                  <div
                    className="ck-stepper-box"
                    style={modalOutOfStock ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
                  >
                    <button type="button" className="ck-stepper-btn" onClick={() => setModalQty((prev) => Math.max(1, prev - 1))} disabled={modalQty <= 1 || modalOutOfStock}>−</button>
                    <span className="ck-stepper-val">{modalQty}</span>
                    <button type="button" className="ck-stepper-btn" onClick={() => setModalQty((prev) => prev + 1)} disabled={modalOutOfStock}>+</button>
                  </div>

                  <button
                    className="ck-btn-modal-add"
                    onClick={() => {
                      if (modalOutOfStock) return;
                      const added = handleCakeAddToCart(selectedProduct, modalQty, currentActiveVariant);
                      if (added) setSelectedProduct(null);
                    }}
                    disabled={modalOutOfStock}
                    style={modalOutOfStock ? { background: '#94a3b8', cursor: 'not-allowed' } : undefined}
                  >
                    {modalOutOfStock ? '⛔ Out of Stock' : `Add to Cart • ₹${pricing.price}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* HERO SLIDER */}
      <section className="ck-hero-slider-section">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`ck-hero-slide ${index === currentSlide ? 'ck-active-slide' : ''}`}
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(20, 10, 15, 0.75) 0%, rgba(50, 15, 25, 0.55) 100%), url(${slide.image})`
            }}
          />
        ))}

        <div className="ck-slider-dots">
          {heroSlides.map((_, idx) => (
            <span
              key={idx}
              className={`ck-dot ${idx === currentSlide ? 'ck-active' : ''}`}
              onClick={() => setCurrentSlide(idx)}
            />
          ))}
        </div>
      </section>

      {/* USP 4-CARDS */}
      <section className="ck-usp-banner-section ck-container ck-reveal">
        <div className="ck-usp-grid">
          <div className="ck-usp-card">
            <div className="ck-usp-icon-wrap">⚡</div>
            <div className="ck-usp-text">
              <h4>2-Hour Delivery</h4>
              <p>In Delhi NCR</p>
            </div>
          </div>

          <div className="ck-usp-card">
            <div className="ck-usp-icon-wrap">🍓</div>
            <div className="ck-usp-text">
              <h4>100% Fresh Cream</h4>
              <p>Zero Artificial Additives</p>
            </div>
          </div>

          <div className="ck-usp-card">
            <div className="ck-usp-icon-wrap">🌱</div>
            <div className="ck-usp-text">
              <h4>100% Eggless</h4>
              <p>Options in All Flavours</p>
            </div>
          </div>

          <div className="ck-usp-card">
            <div className="ck-usp-icon-wrap">🎂</div>
            <div className="ck-usp-text">
              <h4>Custom Designs</h4>
              <p>Photo & Fondant Cakes</p>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN PRODUCTS SECTION */}
      <section id="cakes" className="ck-products-section ck-container ck-reveal">
        <div className="ck-section-heading-wrap">
          <div>
            <span className="ck-sub-heading">Fresh From The Oven</span>
            <h2 className="ck-main-heading">Artisan Bakery Cakes</h2>
          </div>

          {/* FILTER TABS */}
          <div className="ck-tab-filters">
            <button className={`ck-tab-btn ${activeTab === 'all' ? 'ck-active' : ''}`} onClick={() => setActiveTab('all')}>
              🎂 All Cakes ({products.length})
            </button>
            <button className={`ck-tab-btn ${activeTab === 'chocolate' ? 'ck-active' : ''}`} onClick={() => setActiveTab('chocolate')}>
              🍫 Chocolate Truffle
            </button>
            <button className={`ck-tab-btn ${activeTab === 'redvelvet' ? 'ck-active' : ''}`} onClick={() => setActiveTab('redvelvet')}>
              ❤️ Red Velvet
            </button>
            <button className={`ck-tab-btn ${activeTab === 'fruit' ? 'ck-active' : ''}`} onClick={() => setActiveTab('fruit')}>
              🍓 Fresh Fruit
            </button>
            <button className={`ck-tab-btn ${activeTab === 'cheesecake' ? 'ck-active' : ''}`} onClick={() => setActiveTab('cheesecake')}>
              🧀 Cheesecakes
            </button>
            <button className={`ck-tab-btn ${activeTab === 'bento' ? 'ck-active' : ''}`} onClick={() => setActiveTab('bento')}>
              🎀 Bento & Mini
            </button>
            <button className={`ck-tab-btn ${activeTab === 'butterscotch' ? 'ck-active' : ''}`} onClick={() => setActiveTab('butterscotch')}>
              🍯 Butterscotch
            </button>
            <button className={`ck-tab-btn ${activeTab === 'wishlist' ? 'ck-active' : ''}`} onClick={() => setActiveTab('wishlist')}>
              ❤️ Wishlist ({wishlist.length})
            </button>
          </div>
        </div>

        {/* PRODUCTS GRID */}
        {loading && products.length === 0 ? (
          <div className="ck-empty-loading-state">
            <p>🍰 Baking fresh delicious cakes...</p>
          </div>
        ) : (
          <div className="ck-modern-product-grid">
            {sortedProducts.map((cake) => (
              <CakeProductCard
                key={cake._id}
                product={cake}
                isWishlisted={isWishlisted}
                toggleWishlist={toggleWishlist}
                onOpenModal={handleOpenModal}
                onAddToCart={handleCakeAddToCart}
              />
            ))}
          </div>
        )}
      </section>

      {/* INFINITE GALLERY SECTION */}
      {products.length > 0 && (
        <section className="ck-gallery-slider-section ck-reveal">
          <div className="ck-section-heading-wrap ck-text-center ck-container" style={{ marginBottom: '18px' }}>
            <span className="ck-sub-heading">Fresh Creations</span>
            <h2 className="ck-main-heading">From Our Bakery Gallery</h2>
          </div>

          <div className="ck-gallery-slider-viewport">
            <div className="ck-gallery-slider-track">
              {[...products, ...products].map((p, idx) => (
                <div className="ck-gallery-slide-item" key={`gallery-cake-${p._id}-${idx}`}>
                  <img
                    src={getImageUrl(p.image)}
                    alt={p.name}
                    loading="lazy"
                    onError={(e) => { e.target.src = FALLBACK_CAKE_IMG; }}
                  />
                  <span className="ck-gallery-slide-caption">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default CakePage;