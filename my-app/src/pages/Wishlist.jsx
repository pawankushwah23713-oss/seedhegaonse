import React, { useState, useEffect, useRef } from 'react';
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

// 🟢 Backend API Base URL
const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://orange-ape-497824.hostingersite.com/api');

const SERVER_HOST = API_BASE.replace('/api', '');
const WISHLIST_KEY = 'seedhegaonse_wishlist';
const CAKE_WISHLIST_KEY = 'seedhegaonse_cake_wishlist';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop';
const SWIPE_THRESHOLD = 40;

// 🟢 Helper to check if a product is a Dummy item
const isDummyProduct = (product) => {
  if (!product) return false;
  return Boolean(product.isDummy || product._id?.toString().startsWith('dummy'));
};

// 🟢 STOCK HELPER — inStock === false hone par hi Out of Stock
const isOutOfStock = (product) => product?.inStock === false;

// 🟢 Helper to get Default Variants
export const getProductVariants = (product) => {
  if (Array.isArray(product?.variants) && product.variants.length > 0) {
    return product.variants;
  }
  const isDummy = isDummyProduct(product);
  const basePrice = Number(product?.price) || 0;
  const hasDiscount = !isDummy && (Number(product?.originalPrice) > basePrice || Number(product?.discount) > 0);
  const baseMrp = Number(product?.originalPrice) || basePrice;
  const discountVal = isDummy ? 0 : (Number(product?.discount) || 0);

  return [
    {
      _id: 'v-250',
      label: '250g',
      weight: '250g',
      price: Math.round(basePrice * 0.55),
      originalPrice: hasDiscount ? Math.round(baseMrp * 0.55) : null,
      discount: discountVal
    },
    {
      _id: 'v-500',
      label: '500g',
      weight: '500g',
      price: basePrice,
      originalPrice: hasDiscount ? baseMrp : null,
      discount: discountVal
    },
    {
      _id: 'v-1000',
      label: '1kg',
      weight: '1kg',
      price: Math.round(basePrice * 1.9),
      originalPrice: hasDiscount ? Math.round(baseMrp * 1.9) : null,
      discount: discountVal
    }
  ];
};

// 🟢 DUMMY SWEETS LIST
const DUMMY_SWEETS = [
  {
    _id: 'dummy-1',
    isDummy: true,
    name: 'Pure Desi Ghee Motichoor Ladoo',
    price: 480,
    originalPrice: 480,
    discount: 0,
    category: 'ladoo',
    originRegion: 'Jodhpur',
    description: 'Melt-in-mouth tiny boondi pearls fried in 100% pure desi ghee & garnished with pistachios.',
    image: dummy1,
    inStock: true
  },
  {
    _id: 'dummy-2',
    isDummy: true,
    name: 'Traditional Mathura Peda',
    price: 520,
    originalPrice: 520,
    discount: 0,
    category: 'peda',
    originRegion: 'Mathura',
    description: 'Slow-roasted authentic khoya infused with aromatic cardamom and traditional flavours.',
    image: dummy2,
    inStock: true
  },
  {
    _id: 'dummy-3',
    isDummy: true,
    name: 'Royal Agra Kesar Angoori Petha',
    price: 360,
    originalPrice: 360,
    discount: 0,
    category: 'petha',
    originRegion: 'Agra',
    description: 'Juicy, soft, translucent sweet pumpkin bites infused with natural Kashmiri saffron.',
    image: dummy3,
    inStock: true
  },
  {
    _id: 'dummy-4',
    isDummy: true,
    name: 'Diamond Silver Foil Kaju Katli',
    price: 950,
    originalPrice: 950,
    discount: 0,
    category: 'barfi',
    originRegion: 'Delhi NCR',
    description: 'Premium quality Goan cashews crafted with authentic edible pure silver vark.',
    image: dummy4,
    inStock: true
  },
  {
    _id: 'dummy-5',
    isDummy: true,
    name: 'Jaipuri Malai Rabdi Ghewar',
    price: 650,
    originalPrice: 650,
    discount: 0,
    category: 'special',
    originRegion: 'Jaipur',
    description: 'Crispy honeycomb disc soaked in sugar syrup and topped with rich cardamom rabdi.',
    image: dummy5,
    inStock: true
  },
  {
    _id: 'dummy-6',
    isDummy: true,
    name: 'Alwar Famous Danedar Milk Cake',
    price: 540,
    originalPrice: 540,
    discount: 0,
    category: 'barfi',
    originRegion: 'Alwar',
    description: 'Rich, caramelized brown grainy milk fudge prepared from fresh whole buffalo milk.',
    image: dummy6,
    inStock: true
  },
  {
    _id: 'dummy-7',
    isDummy: true,
    name: 'Hisar ki Special Malai Peda',
    price: 540,
    originalPrice: 540,
    discount: 0,
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
    isDummy: true,
    name: 'Belgian Dark Chocolate Truffle Cake',
    category: 'chocolate',
    originRegion: 'Fresh Bakehouse',
    description: 'Layers of moist dark chocolate sponge filled with rich, silky Belgian ganache.',
    price: 549,
    originalPrice: 549,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop',
    inStock: true
  },
  {
    _id: 'dummy-cake-2',
    isDummy: true,
    name: 'Classic Red Velvet Cream Cheese Cake',
    category: 'redvelvet',
    originRegion: 'Master Chef Special',
    description: 'Velvety crimson sponge paired with authentic Philadelphia style cream cheese frosting.',
    price: 599,
    originalPrice: 599,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?q=80&w=600&auto=format&fit=crop',
    inStock: true
  },
  {
    _id: 'dummy-cake-3',
    isDummy: true,
    name: 'Exotic Fresh Seasonal Fruit Cake',
    category: 'fruit',
    originRegion: 'Farm Fresh',
    description: 'Light vanilla sponge layered with freshly whipped cream and hand-cut fresh fruits.',
    price: 520,
    originalPrice: 520,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?q=80&w=600&auto=format&fit=crop',
    inStock: true
  },
  {
    _id: 'dummy-cake-4',
    isDummy: true,
    name: 'New York Baked Blueberry Cheesecake',
    category: 'cheesecake',
    originRegion: 'Gourmet Selection',
    description: 'Traditional slow-baked rich cheesecake on a buttery cracker crust with blueberry compote.',
    price: 750,
    originalPrice: 750,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=600&auto=format&fit=crop',
    inStock: true
  },
  {
    _id: 'dummy-cake-5',
    isDummy: true,
    name: 'Crunchy Caramel Butterscotch Cake',
    category: 'butterscotch',
    originRegion: 'Daily Fresh Oven',
    description: 'Golden sponge layered with home-cooked butterscotch sauce and cashew praline crunch.',
    price: 479,
    originalPrice: 479,
    discount: 0,
    image: 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?q=80&w=600&auto=format&fit=crop',
    inStock: true
  },
  {
    _id: 'dummy-cake-6',
    isDummy: true,
    name: 'Pastel Korean Heart Bento Cake',
    category: 'bento',
    originRegion: 'Trending Korean Design',
    description: 'Cute pocket-sized minimalist birthday cake decorated with pastel buttercream design.',
    price: 349,
    originalPrice: 349,
    discount: 0,
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
  if (!imagePath) return FALLBACK_IMG;
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

// Pricing & Offer Calculation
const calculatePricing = (targetObj, qty = 1, isDummy = false) => {
  const price = Number(targetObj?.price) || 0;

  if (isDummy) {
    return {
      price: price * qty,
      mrp: null,
      discountPercent: null,
      savings: 0
    };
  }

  let mrp = Number(targetObj?.originalPrice) || 0;
  const manualDiscount = Number(targetObj?.discount) || 0;
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

/* --- SLIDER COMPONENTS MATCHED TO HOMEPAGE --- */
const CardImageSlider = ({ images, alt }) => {
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef(null);
  const trackWidthRef = useRef(1);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const movedRef = useRef(false);
  const slides = images.length > 0 ? images : [FALLBACK_IMG];

  useEffect(() => {
    setIndex(0);
    if (slides.length <= 1) return undefined;
    const timer = setInterval(() => {
      if (isDraggingRef.current) return;
      setIndex((prev) => (prev + 1) % slides.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [slides.length]);

  const finishDrag = (finalOffset) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const width = trackWidthRef.current || 1;
    const movedEnough = Math.abs(finalOffset) > SWIPE_THRESHOLD || Math.abs(finalOffset) / width > 0.15;
    if (movedEnough && slides.length > 1) {
      if (finalOffset < 0) {
        setIndex((prev) => (prev + 1) % slides.length);
      } else {
        setIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
      }
    }
    setDragOffset(0);
  };

  const handlePointerDown = (e) => {
    if (slides.length <= 1) return;
    isDraggingRef.current = true;
    movedRef.current = false;
    startXRef.current = e.clientX;
    trackWidthRef.current = containerRef.current ? containerRef.current.offsetWidth : 1;
    if (e.currentTarget.setPointerCapture) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > 5) movedRef.current = true;
    setDragOffset(delta);
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;
    finishDrag(e.clientX - startXRef.current);
  };

  const handlePointerCancel = () => finishDrag(dragOffset);

  const handleClickCapture = (e) => {
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      movedRef.current = false;
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: slides.length > 1 ? 'grab' : 'default',
        userSelect: 'none',
        touchAction: 'pan-y'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerCancel}
      onPointerCancel={handlePointerCancel}
      onClickCapture={handleClickCapture}
      draggable={false}
    >
      <div
        className="sg-card-slider-track"
        style={{
          transform: `translateX(calc(-${index * 100}% + ${dragOffset}px))`,
          transition: isDraggingRef.current ? 'none' : 'transform 0.4s cubic-bezier(0.65, 0, 0.35, 1)'
        }}
      >
        {slides.map((src, i) => (
          <div className="sg-card-slider-slide" key={i}>
            <img
              src={src}
              alt={alt}
              className="sg-card-product-img"
              loading="lazy"
              draggable={false}
              onError={(e) => { e.target.src = FALLBACK_IMG; }}
            />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="sg-card-slider-dots" onClick={(e) => e.stopPropagation()}>
          {slides.map((_, i) => (
            <span
              key={i}
              className={`sg-card-slider-dot ${i === index ? 'sg-active' : ''}`}
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

const ModalImageSlider = ({ images, labels = [], alt, zoomStyle, onDragStateChange }) => {
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef(null);
  const trackWidthRef = useRef(1);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const slides = images.length > 0 ? images : [FALLBACK_IMG];

  useEffect(() => {
    setIndex(0);
    if (slides.length <= 1) return undefined;
    const timer = setInterval(() => {
      if (isDraggingRef.current) return;
      setIndex((prev) => (prev + 1) % slides.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [slides.length]);

  const finishDrag = (finalOffset) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (onDragStateChange) onDragStateChange(false);
    const width = trackWidthRef.current || 1;
    const movedEnough = Math.abs(finalOffset) > SWIPE_THRESHOLD || Math.abs(finalOffset) / width > 0.15;
    if (movedEnough && slides.length > 1) {
      if (finalOffset < 0) {
        setIndex((prev) => (prev + 1) % slides.length);
      } else {
        setIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
      }
    }
    setDragOffset(0);
  };

  const handlePointerDown = (e) => {
    if (slides.length <= 1) return;
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    trackWidthRef.current = containerRef.current ? containerRef.current.offsetWidth : 1;
    if (onDragStateChange) onDragStateChange(true);
    if (e.currentTarget.setPointerCapture) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    setDragOffset(e.clientX - startXRef.current);
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;
    finishDrag(e.clientX - startXRef.current);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: slides.length > 1 ? 'grab' : 'default',
        userSelect: 'none',
        touchAction: 'pan-y'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => finishDrag(dragOffset)}
      onPointerCancel={() => finishDrag(dragOffset)}
      draggable={false}
    >
      <div
        className="sg-modal-slider-track"
        style={{
          transform: `translateX(calc(-${index * 100}% + ${dragOffset}px))`,
          transition: isDraggingRef.current ? 'none' : 'transform 0.4s cubic-bezier(0.65, 0, 0.35, 1)'
        }}
      >
        {slides.map((src, i) => (
          <div className="sg-modal-slider-slide" key={i}>
            <img
              src={src}
              alt={alt}
              style={i === index ? zoomStyle : undefined}
              draggable={false}
              onError={(e) => { e.target.src = FALLBACK_IMG; }}
            />
            {labels[i] && (
              <span className="sg-modal-slide-free-badge">{labels[i]}</span>
            )}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="sg-modal-slider-dots" onClick={(e) => e.stopPropagation()}>
          {slides.map((_, i) => (
            <span
              key={i}
              className={`sg-modal-slider-dot ${i === index ? 'sg-active' : ''}`}
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

/* --- WISHLIST PRODUCT CARD (Homepage UI & UX) --- */
const WishlistProductCard = ({ product, onRemove, onOpenModal, onAddToCart }) => {
  const isDummy = isDummyProduct(product);
  const outOfStock = isOutOfStock(product);
  const variants = getProductVariants(product);
  const defaultVar = variants[0];
  const [selectedVariant, setSelectedVariant] = useState(defaultVar);

  const pricing = calculatePricing(selectedVariant, 1, isDummy);

  return (
    <div
      className="sg-product-card"
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
          ⛔ OUT OF STOCK
        </div>
      )}

      <div className="sg-card-top-bar" style={{ position: 'relative', zIndex: 6 }}>
        {outOfStock ? (
          <span className="sg-badge-discount" style={{ background: '#dc2626', color: '#fff' }}>
            SOLD OUT
          </span>
        ) : !isDummy && pricing.discountPercent ? (
          <span className="sg-badge-discount">{pricing.discountPercent}% OFF</span>
        ) : product.originRegion ? (
          <span className="sg-badge-origin-mini">📍 {product.originRegion}</span>
        ) : (
          <span className="sg-badge-category-mini">{product.category}</span>
        )}

        <button
          type="button"
          className="sg-card-heart-btn sg-is-liked"
          onClick={(e) => onRemove(e, product._id || product.id)}
          aria-label="Remove from Wishlist"
          title="Remove from Wishlist"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2.2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      <div
        className="sg-card-media-box"
        style={outOfStock ? { filter: 'blur(3px) grayscale(0.85)', opacity: 0.65 } : undefined}
      >
        <CardImageSlider
          images={[getImageUrl(product.image)]}
          alt={product.name}
        />
      </div>

      <div
        className="sg-card-origin-strip"
        style={outOfStock ? { filter: 'blur(1.5px)', opacity: 0.6 } : undefined}
      >
        <span>📍 Handcrafted in {product.originRegion || 'Authentic Village'}</span>
      </div>

      <div className="sg-card-body">
        <h3
          className="sg-card-title"
          title={product.name}
          style={outOfStock ? { opacity: 0.55 } : undefined}
        >
          {product.name}
        </h3>

        <div
          className="sg-card-variants-container"
          onClick={(e) => e.stopPropagation()}
          style={outOfStock ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
        >
          <div className="sg-variant-chips-list">
            {variants.map((v, idx) => {
              const isActive = (selectedVariant._id && v._id) ? selectedVariant._id === v._id : selectedVariant.label === v.label;
              return (
                <button
                  key={v._id || idx}
                  type="button"
                  className={`sg-variant-pill-btn ${isActive ? 'sg-active' : ''}`}
                  onClick={() => setSelectedVariant(v)}
                  disabled={outOfStock}
                >
                  {v.label || v.weight || 'Standard'}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sg-card-footer">
          <div className="sg-card-price-group" style={outOfStock ? { opacity: 0.5 } : undefined}>
            <div className="sg-price-row">
              <span className="sg-current-price">₹{pricing.price}</span>
              {!isDummy && pricing.mrp && <span className="sg-mrp-price">₹{pricing.mrp}</span>}
            </div>
            {!isDummy && pricing.savings > 0 && (
              <span className="sg-savings-tag">Save ₹{pricing.savings}</span>
            )}
          </div>

          <button
            className="sg-btn-add-cart"
            onClick={(e) => {
              e.stopPropagation();
              if (outOfStock) return;
              onAddToCart(product, 1, selectedVariant);
            }}
            disabled={outOfStock}
            style={outOfStock ? { background: '#94a3b8', cursor: 'not-allowed', opacity: 0.9 } : undefined}
          >
            {outOfStock ? 'Out of Stock' : '+ ADD'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* --- MAIN WISHLIST COMPONENT --- */
const Wishlist = ({ addToCart, addedToast }) => {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localToast, setLocalToast] = useState('');

  // 🟢 QUICK VIEW MODAL STATE
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedModalVariant, setSelectedModalVariant] = useState(null);
  const [modalQty, setModalQty] = useState(1);
  const [zoomStyle, setZoomStyle] = useState({
    transformOrigin: 'center center',
    transform: 'scale(1)'
  });
  const [isImageDragging, setIsImageDragging] = useState(false);

  const handleMouseMove = (e) => {
    if (isImageDragging) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(2.3)'
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

  const closeModal = () => setSelectedProduct(null);

  useEffect(() => {
    document.body.style.overflow = selectedProduct ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedProduct]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. FETCH WISHLIST (Sweets + Cakes + Dummies + Backend API)
  const fetchWishlist = async () => {
    try {
      setLoading(true);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  // 2. REMOVE ITEM FROM WISHLIST
  const handleRemove = async (e, productId) => {
    if (e) e.stopPropagation();
    if (!productId) return;

    const pIdStr = productId.toString();
    const prevItems = [...wishlistItems];

    setWishlistItems((prev) => prev.filter((item) => (item._id || item.id)?.toString() !== pIdStr));

    setSelectedProduct((prev) => {
      if (prev && (prev._id || prev.id)?.toString() === pIdStr) return null;
      return prev;
    });

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
  const handleProductAddToCart = (p, qty = 1, variant = null) => {
    if (isOutOfStock(p)) return false;

    const activeVariant = variant || (p.variants && p.variants[0]) || {
      weight: '250g',
      label: '250g',
      price: Math.round(p.price * 0.55)
    };

    const variantPrice = Number(activeVariant.price || p.price);
    const variantLabel = activeVariant.label || activeVariant.weight || '250g';

    const formattedItem = {
      id: `${p._id || p.id}_${variantLabel}`,
      _id: `${p._id || p.id}_${variantLabel}`,
      productId: p._id || p.id,
      name: `${p.name} (${variantLabel})`,
      variant: variantLabel,
      price: `₹${variantPrice}`,
      unitPrice: variantPrice,
      quantity: qty,
      totalPrice: variantPrice * qty,
      img: getImageUrl(p.image),
      image: getImageUrl(p.image),
      originRegion: p.originRegion || 'Authentic Special'
    };

    if (typeof addToCart === 'function') {
      addToCart(formattedItem);
    } else {
      try {
        const savedCart = JSON.parse(localStorage.getItem('cart') || localStorage.getItem('cartItems') || '[]');
        const existingIndex = savedCart.findIndex(item => (item.id || item._id) === formattedItem.id);

        if (existingIndex > -1) {
          savedCart[existingIndex].quantity = (savedCart[existingIndex].quantity || 1) + qty;
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
    return true;
  };

  const activeToastMessage = addedToast || localToast;

  return (
    <div className="wishlist-page-container">
      {activeToastMessage && (
        <div className="sg-cart-toast sg-fade-slide-up">
          ✓ <strong>{activeToastMessage}</strong> added to cart
        </div>
      )}

      {/* 🟢 QUICK VIEW POPUP MODAL (HOMEPAGE DESIGN) */}
      {selectedProduct && (() => {
        const isDummy = isDummyProduct(selectedProduct);
        const modalOutOfStock = isOutOfStock(selectedProduct);
        const modalVariants = getProductVariants(selectedProduct);
        const currentActiveVariant = selectedModalVariant || modalVariants[0];
        const pricing = calculatePricing(currentActiveVariant, modalQty, isDummy);

        return (
          <div className="sg-product-modal-backdrop" onClick={closeModal}>
            <div className="sg-product-modal-card" onClick={(e) => e.stopPropagation()}>
              <button className="sg-modal-close-btn" onClick={closeModal} aria-label="Close">✕</button>

              <div
                className="sg-modal-image-col"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={modalOutOfStock ? { filter: 'blur(4px) grayscale(0.85)', opacity: 0.7 } : undefined}
              >
                <ModalImageSlider
                  images={[getImageUrl(selectedProduct.image)]}
                  labels={[null]}
                  alt={selectedProduct.name}
                  zoomStyle={zoomStyle}
                  onDragStateChange={setIsImageDragging}
                />
              </div>

              <div className="sg-modal-info-col">
                <div>
                  <div className="sg-modal-tags-row">
                    {modalOutOfStock && (
                      <span className="sg-badge-category" style={{ background: '#dc2626', color: '#fff' }}>
                        ⛔ OUT OF STOCK
                      </span>
                    )}
                    {selectedProduct.originRegion && (
                      <span className="sg-badge-origin">📍 {selectedProduct.originRegion} Special</span>
                    )}
                    {selectedProduct.category && (
                      <span className="sg-badge-category">{selectedProduct.category.toUpperCase()}</span>
                    )}
                  </div>

                  <h3 className="sg-modal-title">{selectedProduct.name}</h3>

                  <div className="sg-modal-variant-section">
                    <span className="sg-variant-section-title">Select Pack Size / Weight:</span>
                    <div
                      className="sg-modal-variant-chips"
                      style={modalOutOfStock ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
                    >
                      {modalVariants.map((v, idx) => {
                        const isActive = currentActiveVariant?.label === v.label || currentActiveVariant?.weight === v.weight;
                        return (
                          <button
                            key={v._id || idx}
                            type="button"
                            className={`sg-modal-chip-btn ${isActive ? 'sg-active' : ''}`}
                            onClick={() => setSelectedModalVariant(v)}
                            disabled={modalOutOfStock}
                          >
                            <span className="sg-chip-label">{v.label || v.weight}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sg-modal-price-box">
                    <div className="sg-modal-price-numbers">
                      <span className="sg-modal-current-price">₹{pricing.price}</span>
                      {!isDummy && pricing.mrp && <span className="sg-modal-mrp-price">₹{pricing.mrp}</span>}
                    </div>
                    {!isDummy && pricing.discountPercent && (
                      <span className="sg-modal-discount-pill">{pricing.discountPercent}% OFF</span>
                    )}
                  </div>

                  <p className="sg-modal-desc">
                    {selectedProduct.description || 'Authentic traditional recipe prepared using 100% pure desi ghee with no artificial flavours or preservatives.'}
                  </p>
                </div>

                <div className="sg-modal-trust-checklist">
                  <div className="sg-trust-check-item">✓ 100% Pure & Fresh</div>
                  <div className="sg-trust-check-item">✓ 0 Preservatives Added</div>
                  <div className="sg-trust-check-item">✓ Hygienically Packed</div>
                  <div className="sg-trust-check-item">✓ Authentic Village Recipe</div>
                </div>

                <div className="sg-modal-actions-row">
                  <button
                    className="sg-btn-modal-wishlist"
                    onClick={(e) => handleRemove(e, selectedProduct._id || selectedProduct.id)}
                    title="Remove from wishlist"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2.2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>

                  <div
                    className="sg-stepper-box"
                    style={modalOutOfStock ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
                  >
                    <button type="button" className="sg-stepper-btn" onClick={() => setModalQty((prev) => Math.max(1, prev - 1))} disabled={modalQty <= 1 || modalOutOfStock}>−</button>
                    <span className="sg-stepper-val">{modalQty}</span>
                    <button type="button" className="sg-stepper-btn" onClick={() => setModalQty((prev) => prev + 1)} disabled={modalOutOfStock}>+</button>
                  </div>

                  <button
                    className="sg-btn-modal-add"
                    onClick={() => {
                      if (modalOutOfStock) return;
                      const added = handleProductAddToCart(selectedProduct, modalQty, currentActiveVariant);
                      if (added) closeModal();
                    }}
                    disabled={modalOutOfStock}
                    style={modalOutOfStock ? { background: '#94a3b8', cursor: 'not-allowed' } : undefined}
                  >
                    {modalOutOfStock ? '⛔ Out of Stock' : `Add ${modalQty} to Cart • ₹${pricing.price}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="wishlist-header">
        <h1 className="wishlist-title">My Saved Sweets & Cakes</h1>
        <p className="wishlist-subtitle">
          Your favorite handcrafted regional sweets and fresh artisan cakes saved for quick ordering
        </p>
      </div>

      {loading ? (
        <div className="sg-empty-loading-state">
          <div className="sg-spinner"></div>
          <h3>🍬 Loading your saved items...</h3>
        </div>
      ) : wishlistItems.length === 0 ? (
        <div className="sg-empty-category-card" style={{ maxWidth: '480px', margin: '40px auto', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem', color: 'var(--primary-brand)', display: 'block', marginBottom: '10px' }}>❤</span>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Your Wishlist is Empty</h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: '8px 0 16px' }}>
            Explore authentic village sweets & artisan cakes, tap the heart icon to save them here.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button className="sg-tab-btn sg-active" onClick={() => navigate('/')}>
              Explore Sweets
            </button>
            <button className="sg-tab-btn" onClick={() => navigate('/cakes')}>
              Explore Cakes
            </button>
          </div>
        </div>
      ) : (
        <div className="sg-modern-product-grid">
          {wishlistItems.map((p) => (
            <WishlistProductCard
              key={p._id || p.id}
              product={p}
              onRemove={handleRemove}
              onOpenModal={handleOpenModal}
              onAddToCart={handleProductAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;