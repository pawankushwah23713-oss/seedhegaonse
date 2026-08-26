import React, { useState, useEffect, useRef } from 'react';
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

// 🟢 Helper to check if a product is a Dummy item
const isDummyProduct = (product) => {
  if (!product) return false;
  return Boolean(product.isDummy || product._id?.toString().startsWith('dummy'));
};

// 🟢 Check if timeline discount is currently valid
const isTimelineDiscountValid = (product) => {
  if (!product) return false;
  const discount = Number(product.discountPercent || product.discount) || 0;
  if (discount <= 0) return false;
  if (!product.discountValidUntil) return true;
  return new Date(product.discountValidUntil) > new Date();
};

// 🟢 Helper to get Default Variants (Lowest Weight Default & Dynamic Discount check)
export const getProductVariants = (product) => {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants;
  }
  const isDummy = isDummyProduct(product);
  const basePrice = Number(product.price) || 0;
  const hasTimeline = !isDummy && isTimelineDiscountValid(product);
  const discountVal = hasTimeline ? Number(product.discountPercent || product.discount) : 0;

  let baseMrp = Number(product.originalPrice) || 0;
  if (!baseMrp || baseMrp <= basePrice) {
    baseMrp = discountVal > 0 ? Math.round(basePrice / (1 - discountVal / 100)) : basePrice;
  }

  const hasDiscount = !isDummy && (baseMrp > basePrice || discountVal > 0);

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

// 🟢 Dummy Fallback Products
const DUMMY_PRODUCTS = [
  {
    _id: 'dummy-1',
    isDummy: true,
    name: 'Pure Desi Ghee Motichoor Ladoo',
    category: 'ladoo',
    originRegion: 'Jodhpur',
    description: 'Melt-in-mouth tiny boondi pearls fried in 100% pure desi ghee & garnished with pistachios. Prepared fresh daily using traditional village methods.',
    price: 480,
    originalPrice: 480,
    discount: 0,
    offerText: '',
    offerImage: '',
    image: dummy1,
    inStock: true
  },
  {
    _id: 'dummy-2',
    isDummy: true,
    name: 'Traditional Mathura Peda',
    category: 'peda',
    originRegion: 'Mathura',
    description: 'Slow-roasted authentic khoya infused with aromatic cardamom and traditional flavours, sourced directly from the holy city of Mathura.',
    price: 520,
    originalPrice: 520,
    discount: 0,
    offerText: '',
    offerImage: '',
    image: dummy2,
    inStock: true
  },
  {
    _id: 'dummy-3',
    isDummy: true,
    name: 'Royal Agra Kesar Angoori Petha',
    category: 'petha',
    originRegion: 'Agra',
    description: 'Juicy, soft, translucent sweet pumpkin bites infused with natural Kashmiri saffron and subtle rose water essence.',
    price: 360,
    originalPrice: 360,
    discount: 0,
    offerText: '',
    offerImage: '',
    image: dummy3,
    inStock: true
  },
  {
    _id: 'dummy-4',
    isDummy: true,
    name: 'Diamond Silver Foil Kaju Katli',
    category: 'barfi',
    originRegion: 'Delhi NCR',
    description: 'Premium quality Goan cashews crafted with authentic edible pure silver vark and optimal sweetness for every festival.',
    price: 950,
    originalPrice: 950,
    discount: 0,
    offerText: '',
    offerImage: '',
    image: dummy4,
    inStock: true
  },
  {
    _id: 'dummy-5',
    isDummy: true,
    name: 'Jaipuri Malai Rabdi Ghewar',
    category: 'special',
    originRegion: 'Jaipur',
    description: 'Crispy honeycomb disc soaked in saffron sugar syrup and topped with rich, thick cardamom rabdi and roasted dry fruits.',
    price: 650,
    originalPrice: 650,
    discount: 0,
    offerText: '',
    offerImage: '',
    image: dummy5,
    inStock: true
  },
  {
    _id: 'dummy-6',
    isDummy: true,
    name: 'Alwar Famous Danedar Milk Cake',
    category: 'barfi',
    originRegion: 'Alwar',
    description: 'Rich, caramelized brown grainy milk fudge prepared from slow-simmered fresh whole buffalo milk with no additives.',
    price: 540,
    originalPrice: 540,
    discount: 0,
    offerText: '',
    offerImage: '',
    image: dummy6,
    inStock: true
  },
  {
    _id: 'dummy-7',
    isDummy: true,
    name: 'Hisar ki Special Malai Peda',
    category: 'peda',
    originRegion: 'Hisar',
    description: 'Fresh cream & rich caramelized milk treat straight from Haryana’s renowned dairy heartland.',
    price: 540,
    originalPrice: 540,
    discount: 0,
    offerText: '',
    offerImage: '',
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

// Image URL Formatter
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

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop';
const SWIPE_THRESHOLD = 40;

// 🟢 Card Image Slider
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
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
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
    const delta = e.clientX - startXRef.current;
    finishDrag(delta);
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
              alt={i === 0 ? alt : `${alt} offer`}
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

// 🟢 Modal Image Slider
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
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    }
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const delta = e.clientX - startXRef.current;
    setDragOffset(delta);
  };

  const handlePointerUp = (e) => {
    if (!isDraggingRef.current) return;
    const delta = e.clientX - startXRef.current;
    finishDrag(delta);
  };

  const handlePointerCancel = () => finishDrag(dragOffset);

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
              alt={i === 0 ? alt : `${alt} offer`}
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

// 🟢 Individual Product Card Component
const ProductCard = ({ product, isWishlisted, toggleWishlist, onOpenModal, onAddToCart }) => {
  const isDummy = isDummyProduct(product);
  const variants = getProductVariants(product);
  const defaultVar = variants[0];
  const [selectedVariant, setSelectedVariant] = useState(defaultVar);

  const pricing = calculatePricing(selectedVariant, 1, isDummy);
  const liked = isWishlisted(product._id);

  // Dynamic Badges & Offer Checks from Database
  const hasTimelineDiscount = !isDummy && isTimelineDiscountValid(product);
  const hasFreeDelivery = !isDummy && Boolean(product.isFreeDelivery);
  const hasBulkOffer = !isDummy && Number(product.highValueThreshold) > 0;
  const hasCoupon = !isDummy && Boolean(product.productCouponCode);

  // Format Bulk Offer Text for Offer Strip
  const bulkOfferString = hasBulkOffer
    ? `💎 Buy ₹${Number(product.highValueThreshold).toLocaleString('en-IN')}+ Get ${product.highValueDiscountPercent || 10}% EXTRA OFF`
    : '';

  const couponOfferString = hasCoupon
    ? `🎟️ Coupon: ${product.productCouponCode} (${product.productCouponType === 'flat' ? `₹${product.productCouponDiscount} OFF` : `${product.productCouponDiscount}% OFF`})`
    : '';

  return (
    <div className="sg-product-card" onClick={() => onOpenModal(product, selectedVariant)}>
      {/* TOP BADGE BAR */}
      <div className="sg-card-top-bar">
        {!isDummy && pricing.discountPercent ? (
          <span className="sg-badge-discount">⏳ {pricing.discountPercent}% OFF</span>
        ) : hasBulkOffer ? (
          <span className="sg-badge-discount" style={{ background: '#059669' }}>
            💎 ₹{Number(product.highValueThreshold).toLocaleString('en-IN')}+ Bulk
          </span>
        ) : hasFreeDelivery ? (
          <span className="sg-badge-discount" style={{ background: '#2563eb' }}>🚚 FREE SHIP</span>
        ) : product.originRegion ? (
          <span className="sg-badge-origin-mini">📍 {product.originRegion}</span>
        ) : (
          <span className="sg-badge-category-mini">{product.category}</span>
        )}

        {/* LIKE BUTTON */}
        <button
          type="button"
          className={`sg-card-heart-btn ${liked ? 'sg-is-liked' : ''}`}
          onClick={(e) => toggleWishlist(e, product._id)}
          aria-label="Wishlist"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? '#ef4444' : 'none'} stroke={liked ? '#ef4444' : '#64748b'} strokeWidth="2.2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      {/* PRODUCT IMAGE + SLIDER */}
      <div className="sg-card-media-box">
        <CardImageSlider
          images={
            !isDummy && product.offerImage
              ? [getImageUrl(product.image), getImageUrl(product.offerImage)]
              : [getImageUrl(product.image)]
          }
          alt={product.name}
        />
      </div>

      {/* 🏷️ DYNAMIC OFFER / BULK / COUPON STRIP */}
      {!isDummy && (hasBulkOffer || hasCoupon || product.offerText) ? (
        <div
          className="sg-card-offer-strip"
          style={{
            background: hasBulkOffer ? '#ecfdf5' : '#fef3c7',
            color: hasBulkOffer ? '#065f46' : '#92400e'
          }}
        >
          <span>{bulkOfferString || couponOfferString || `🏷️ ${product.offerText}`}</span>
        </div>
      ) : (
        <div className="sg-card-origin-strip">
          <span>📍 Handcrafted in {product.originRegion || 'Authentic Village'}</span>
        </div>
      )}

      {/* DETAILS BODY */}
      <div className="sg-card-body">
        <h3 className="sg-card-title" title={product.name}>
          {product.name}
        </h3>

        {/* VARIANTS DISPLAY */}
        <div className="sg-card-variants-container" onClick={(e) => e.stopPropagation()}>
          <div className="sg-variant-chips-list">
            {variants.map((v, idx) => {
              const isActive = (selectedVariant._id && v._id) ? selectedVariant._id === v._id : selectedVariant.label === v.label;
              return (
                <button
                  key={v._id || idx}
                  type="button"
                  className={`sg-variant-pill-btn ${isActive ? 'sg-active' : ''}`}
                  onClick={() => setSelectedVariant(v)}
                >
                  {v.label || v.weight || 'Standard'}
                </button>
              );
            })}
          </div>
        </div>

        {/* PRICING & ACTION FOOTER */}
        <div className="sg-card-footer">
          <div className="sg-card-price-group">
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
              onAddToCart(product, 1, selectedVariant);
            }}
            disabled={product.inStock === false}
          >
            {product.inStock === false ? 'Sold Out' : '+ ADD'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Homepage = ({ addToCart, addedToast }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [wishlist, setWishlist] = useState(loadWishlist);
  const [authAlert, setAuthAlert] = useState('');

  // Modal & Quantity State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedModalVariant, setSelectedModalVariant] = useState(null);
  const [modalQty, setModalQty] = useState(1);

  // Ultra Zoom State
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
    setSelectedProduct(product);
    const variants = getProductVariants(product);
    setSelectedModalVariant(initialVariant || variants[0]);
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

  // 🟢 FETCH LIVE PRODUCTS & BANNERS FROM BACKEND
  useEffect(() => {
    const fetchLiveProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();

        if (res.ok && Array.isArray(data) && data.length > 0) {
          const apiProductIds = new Set(data.map((p) => p._id?.toString()));
          const nonDuplicateDummies = DUMMY_PRODUCTS.filter((d) => !apiProductIds.has(d._id?.toString()));
          setProducts([...data, ...nonDuplicateDummies]);
        } else {
          setProducts(DUMMY_PRODUCTS);
        }
      } catch (err) {
        console.warn('Backend offline, using fallback dummy products:', err);
        setProducts(DUMMY_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };

    const fetchLiveBanners = async () => {
      try {
        const res = await fetch(`${API_BASE}/banners`);
        const data = await res.json();
        if (res.ok && Array.isArray(data) && data.length > 0) {
          setBanners(data.map((b) => ({ id: b._id, image: getImageUrl(b.bannerImage) })));
        } else {
          setBanners([
            { id: 1, image: banner1 },
            { id: 2, image: banner2 }
          ]);
        }
      } catch {
        setBanners([
          { id: 1, image: banner1 },
          { id: 2, image: banner2 }
        ]);
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
    fetchLiveBanners();
    fetchBackendWishlist();
  }, []);

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  // Scroll Reveal Observer
  useEffect(() => {
    const revealElements = document.querySelectorAll('.sg-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('sg-active');
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

  // Hero Slider Auto-Timer
  const heroSlides = banners.length > 0 ? banners : [{ id: 1, image: banner1 }, { id: 2, image: banner2 }];

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(slideInterval);
  }, [heroSlides.length]);

  // Filter Logic
  const filteredProducts = products.filter((p) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'wishlist') return isWishlisted(p._id);

    const category = (p.category || '').toLowerCase();
    const name = (p.name || '').toLowerCase();
    const combined = `${category} ${name}`;

    switch (activeTab) {
      case 'ladoo':
        return category === 'ladoo' || combined.includes('ladoo') || combined.includes('laddu') || combined.includes('motichoor') || combined.includes('besan');
      case 'peda':
        return category === 'peda' || combined.includes('peda') || combined.includes('pedha') || combined.includes('mathura');
      case 'petha':
        return category === 'petha' || combined.includes('petha') || combined.includes('agra') || combined.includes('angoori');
      case 'halwa':
        return category === 'halwa' || combined.includes('halwa') || combined.includes('sohan') || combined.includes('karachi');
      case 'barfi':
        return category === 'barfi' || combined.includes('barfi') || combined.includes('burfi') || combined.includes('katli') || combined.includes('kaju') || combined.includes('milk cake');
      case 'special':
        return category === 'special' || combined.includes('special') || combined.includes('ghewar') || combined.includes('ghevar') || combined.includes('rasgulla') || combined.includes('gulab jamun');
      default:
        return category.includes(activeTab.toLowerCase()) || name.includes(activeTab.toLowerCase());
    }
  });

  // Add To Cart (With All Dynamic Backend Rules Passed)
  const handleProductAddToCart = (p, qty = 1, variant = null) => {
    const activeVariant = variant || (p.variants && p.variants[0]) || {
      weight: '250g',
      label: '250g',
      price: Math.round(p.price * 0.55)
    };

    const variantPrice = Number(activeVariant.price || p.price);
    const variantLabel = activeVariant.label || activeVariant.weight || '250g';

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
      originRegion: p.originRegion,
      isFreeDelivery: Boolean(p.isFreeDelivery),
      highValueThreshold: Number(p.highValueThreshold || 0),
      highValueDiscountPercent: Number(p.highValueDiscountPercent || 0),
      productCouponCode: p.productCouponCode || '',
      productCouponDiscount: Number(p.productCouponDiscount || 0),
      productCouponType: p.productCouponType || 'flat'
    });
    return true;
  };

  return (
    <div className="sg-homepage-container">
      {/* FLOATING WHATSAPP BUTTON */}
      <a
        href="https://wa.me/919315911105"
        className="sg-whatsapp-button sg-pulse-anim"
        target="_blank"
        rel="noreferrer"
        title="Chat on WhatsApp"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.762.459 3.48 1.333 5.001L2 22l5.122-1.343c1.468.802 3.123 1.225 4.887 1.226 5.507 0 9.989-4.478 9.99-9.985 0-5.507-4.482-9.998-9.987-9.998zm5.83 14.364c-.244.685-1.41 1.309-1.974 1.393-.505.075-1.144.106-1.844-.117-.424-.135-.97-.315-1.67-.616-2.937-1.268-4.854-4.258-5.001-4.453-.146-.195-1.195-1.591-1.195-3.033 0-1.441.758-2.151 1.026-2.443.268-.293.585-.366.78-.366.195 0 .39.002.561.01.18.008.421-.068.66.505.244.585.833 2.03.906 2.176.073.146.122.317.024.512-.098.195-.146.317-.293.488-.146.171-.307.382-.439.513-.146.146-.298.305-.128.597.171.293.758 1.252 1.626 2.025 1.118.995 2.062 1.304 2.355 1.45.293.146.463.122.634-.073.171-.195.732-.853.927-1.146.195-.293.39-.244.659-.146.268.098 1.708.805 2.001.951.293.146.488.22.561.341.073.122.073.71-.171 1.395z"/>
        </svg>
      </a>

      {/* AUTH REQUIRED ALERT */}
      {authAlert && (
        <div className="sg-cart-toast sg-fade-slide-up" style={{ background: '#dc2626' }}>
          <span>⚠️ {authAlert}</span>
          <button onClick={() => navigate('/auth')} className="sg-toast-login-btn">Login Now</button>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {addedToast && !authAlert && (
        <div className="sg-cart-toast sg-fade-slide-up">
          ✓ <strong>{addedToast}</strong> added to cart
        </div>
      )}

      {/* PRODUCT DETAILS MODAL (QUICK VIEW) */}
      {selectedProduct && (() => {
        const isDummy = isDummyProduct(selectedProduct);
        const modalVariants = getProductVariants(selectedProduct);
        const currentActiveVariant = selectedModalVariant || modalVariants[0];
        const pricing = calculatePricing(currentActiveVariant, modalQty, isDummy);
        const hasBulk = !isDummy && Number(selectedProduct.highValueThreshold) > 0;
        const hasCoupon = !isDummy && Boolean(selectedProduct.productCouponCode);
        const hasTimeline = !isDummy && isTimelineDiscountValid(selectedProduct);

        return (
          <div className="sg-product-modal-backdrop" onClick={() => setSelectedProduct(null)}>
            <div className="sg-product-modal-card" onClick={(e) => e.stopPropagation()}>
              <button className="sg-modal-close-btn" onClick={() => setSelectedProduct(null)} aria-label="Close">✕</button>

              {/* Left Column: Image with Zoom */}
              <div className="sg-modal-image-col" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                <ModalImageSlider
                  images={
                    !isDummy && selectedProduct.offerImage
                      ? [getImageUrl(selectedProduct.image), getImageUrl(selectedProduct.offerImage)]
                      : [getImageUrl(selectedProduct.image)]
                  }
                  labels={!isDummy && selectedProduct.offerImage ? [null, selectedProduct.offerText || 'FREE'] : [null]}
                  alt={selectedProduct.name}
                  zoomStyle={zoomStyle}
                  onDragStateChange={setIsImageDragging}
                />
              </div>

              {/* Right Column: Information & Actions */}
              <div className="sg-modal-info-col">
                <div>
                  <div className="sg-modal-tags-row">
                    {selectedProduct.originRegion && (
                      <span className="sg-badge-origin">📍 {selectedProduct.originRegion} Special</span>
                    )}
                    {selectedProduct.category && (
                      <span className="sg-badge-category">{selectedProduct.category.toUpperCase()}</span>
                    )}
                    {!isDummy && selectedProduct.isFreeDelivery && (
                      <span className="sg-badge-category" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 'bold' }}>
                        🚚 FREE DELIVERY
                      </span>
                    )}
                  </div>

                  <h3 className="sg-modal-title">{selectedProduct.name}</h3>

                  {/* 💎 HIGH-VALUE / BULK ORDER SPECIAL HIGHLIGHT BOX */}
                  {hasBulk && (
                    <div style={{ background: '#ecfdf5', border: '1.5px dashed #059669', padding: '10px 14px', borderRadius: '10px', margin: '10px 0', color: '#065f46' }}>
                      <div style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.92rem' }}>
                        💎 Bulk Order Discount Active!
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '0.84rem', lineHeight: '1.4' }}>
                        Buy worth <strong>₹{Number(selectedProduct.highValueThreshold).toLocaleString('en-IN')}+</strong> of this sweet and get <strong>{selectedProduct.highValueDiscountPercent || 10}% EXTRA Discount</strong> automatically in cart!
                      </p>
                    </div>
                  )}

                  {/* 🎟️ PRODUCT SPECIFIC EXCLUSIVE COUPON BOX */}
                  {hasCoupon && (
                    <div style={{ background: '#f5f3ff', border: '1px solid #c4b5fd', padding: '8px 12px', borderRadius: '8px', margin: '8px 0', color: '#6d28d9', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🎟️ Exclusive Coupon: <strong>{selectedProduct.productCouponCode}</strong></span>
                      <span style={{ fontWeight: '800' }}>
                        {selectedProduct.productCouponType === 'flat' ? `₹${selectedProduct.productCouponDiscount} FLAT OFF` : `${selectedProduct.productCouponDiscount}% OFF`}
                      </span>
                    </div>
                  )}

                  {/* ⏳ TIMELINE OFFER EXPIRY DATE */}
                  {hasTimeline && selectedProduct.discountValidUntil && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', margin: '6px 0' }}>
                      ⏳ Limited Time Offer! Valid till: {new Date(selectedProduct.discountValidUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}

                  {/* ALL VARIANTS DISPLAY IN MODAL */}
                  <div className="sg-modal-variant-section">
                    <span className="sg-variant-section-title">Select Pack Size / Weight:</span>
                    <div className="sg-modal-variant-chips">
                      {modalVariants.map((v, idx) => {
                        const isActive = currentActiveVariant?.label === v.label || currentActiveVariant?.weight === v.weight;
                        return (
                          <button
                            key={v._id || idx}
                            type="button"
                            className={`sg-modal-chip-btn ${isActive ? 'sg-active' : ''}`}
                            onClick={() => setSelectedModalVariant(v)}
                          >
                            <span className="sg-chip-label">{v.label || v.weight}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pricing Box */}
                  <div className="sg-modal-price-box">
                    <div className="sg-modal-price-numbers">
                      <span className="sg-modal-current-price">₹{pricing.price}</span>
                      {!isDummy && pricing.mrp && <span className="sg-modal-mrp-price">₹{pricing.mrp}</span>}
                    </div>
                    {!isDummy && pricing.discountPercent && (
                      <span className="sg-modal-discount-pill">{pricing.discountPercent}% OFF</span>
                    )}
                  </div>

                  {/* Offer Banner if available */}
                  {!isDummy && selectedProduct.offerText && !hasCoupon && (
                    <div className="sg-modal-offer-banner">
                      <span>🏷️ <strong>Offer:</strong> {selectedProduct.offerText}</span>
                    </div>
                  )}

                  <p className="sg-modal-desc">
                    {selectedProduct.description || 'Authentic traditional recipe prepared using 100% pure desi ghee with no artificial flavours or preservatives.'}
                  </p>
                </div>

                <div className="sg-modal-trust-checklist">
                  <div className="sg-trust-check-item">✓ 100% Pure Desi Ghee</div>
                  <div className="sg-trust-check-item">✓ 0 Preservatives Added</div>
                  <div className="sg-trust-check-item">✓ Shelf Life: 7-10 Days</div>
                  <div className="sg-trust-check-item">✓ Hygienically Packed</div>
                </div>

                {/* Modal Buttons: Heart + Stepper + Add to Cart in one row */}
                <div className="sg-modal-actions-row">
                  <button
                    className="sg-btn-modal-wishlist"
                    onClick={(e) => toggleWishlist(e, selectedProduct._id)}
                    title="Wishlist"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill={isWishlisted(selectedProduct._id) ? '#ef4444' : 'none'} stroke={isWishlisted(selectedProduct._id) ? '#ef4444' : '#64748b'} strokeWidth="2.2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>

                  <div className="sg-stepper-box">
                    <button type="button" className="sg-stepper-btn" onClick={() => setModalQty((prev) => Math.max(1, prev - 1))} disabled={modalQty <= 1}>−</button>
                    <span className="sg-stepper-val">{modalQty}</span>
                    <button type="button" className="sg-stepper-btn" onClick={() => setModalQty((prev) => prev + 1)}>+</button>
                  </div>

                  <button
                    className="sg-btn-modal-add"
                    onClick={() => {
                      const added = handleProductAddToCart(selectedProduct, modalQty, currentActiveVariant);
                      if (added) setSelectedProduct(null);
                    }}
                    disabled={selectedProduct.inStock === false}
                  >
                    {selectedProduct.inStock === false ? 'Out of Stock' : `Add ${modalQty} to Cart • ₹${pricing.price}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* HERO SLIDER SECTION */}
      <section className="sg-hero-slider-section">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id || index}
            className={`sg-hero-slide ${index === currentSlide ? 'sg-active-slide' : ''}`}
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(7, 35, 27, 0.82) 0%, rgba(13, 59, 46, 0.65) 100%), url(${slide.image})`
            }}
          />
        ))}

        <div className="sg-slider-dots">
          {heroSlides.map((_, idx) => (
            <span
              key={idx}
              className={`sg-dot ${idx === currentSlide ? 'sg-active' : ''}`}
              onClick={() => setCurrentSlide(idx)}
            />
          ))}
        </div>
      </section>

      {/* HERO KE BAAD: 4 USP FEATURE CARDS */}
      <section className="sg-usp-banner-section sg-container sg-reveal">
        <div className="sg-usp-grid">
          <div className="sg-usp-card">
            <div className="sg-usp-icon-wrap">🚚</div>
            <div className="sg-usp-text">
              <h4>Same Day Delivery</h4>
              <p>In Delhi NCR</p>
            </div>
          </div>

          <div className="sg-usp-card">
            <div className="sg-usp-icon-wrap">🌿</div>
            <div className="sg-usp-text">
              <h4>No Preservatives</h4>
              <p>0% Artificial Flavours</p>
            </div>
          </div>

          <div className="sg-usp-card">
            <div className="sg-usp-icon-wrap">🍯</div>
            <div className="sg-usp-text">
              <h4>Fresh Made Daily</h4>
              <p>100% Pure Desi Ghee</p>
            </div>
          </div>

          <div className="sg-usp-card">
            <div className="sg-usp-icon-wrap">🏛️</div>
            <div className="sg-usp-text">
              <h4>100% Authentic</h4>
              <p>Village Artisans Recipe</p>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN PRODUCTS SECTION */}
      <section id="products" className="sg-products-section sg-container sg-reveal">
        <div className="sg-section-heading-wrap">
          <div>
            <span className="sg-sub-heading">Fresh & Authentic</span>
            <h2 className="sg-main-heading">Village Special Sweets</h2>
          </div>

          {/* FILTER TABS */}
          <div className="sg-tab-filters">
            <button className={`sg-tab-btn ${activeTab === 'all' ? 'sg-active' : ''}`} onClick={() => setActiveTab('all')}>
              🍬 All Sweets ({products.length})
            </button>
            <button className={`sg-tab-btn ${activeTab === 'ladoo' ? 'sg-active' : ''}`} onClick={() => setActiveTab('ladoo')}>
              🟡 Laddu
            </button>
            <button className={`sg-tab-btn ${activeTab === 'peda' ? 'sg-active' : ''}`} onClick={() => setActiveTab('peda')}>
              🟤 Peda
            </button>
            <button className={`sg-tab-btn ${activeTab === 'petha' ? 'sg-active' : ''}`} onClick={() => setActiveTab('petha')}>
              ⚪ Petha
            </button>
            <button className={`sg-tab-btn ${activeTab === 'halwa' ? 'sg-active' : ''}`} onClick={() => setActiveTab('halwa')}>
              🥣 Halwa
            </button>
            <button className={`sg-tab-btn ${activeTab === 'barfi' ? 'sg-active' : ''}`} onClick={() => setActiveTab('barfi')}>
              🔶 Barfi & Katli
            </button>
            <button className={`sg-tab-btn ${activeTab === 'special' ? 'sg-active' : ''}`} onClick={() => setActiveTab('special')}>
              ⭐ Specials
            </button>
            <button className={`sg-tab-btn ${activeTab === 'wishlist' ? 'sg-active' : ''}`} onClick={() => setActiveTab('wishlist')}>
              ❤️ Wishlist ({wishlist.length})
            </button>
          </div>
        </div>

        {/* PRODUCTS GRID */}
        {loading && products.length === 0 ? (
          <div className="sg-empty-loading-state">
            <div className="sg-spinner"></div>
            <h3>🍬 Loading authentic village sweets...</h3>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="sg-empty-category-card">
            <h3>{activeTab === 'wishlist' ? 'Your Wishlist is Empty!' : 'No sweets found in this category!'}</h3>
            <button className="sg-primary-btn" onClick={() => setActiveTab('all')} style={{ marginTop: '12px' }}>
              Explore All Sweets
            </button>
          </div>
        ) : (
          <div className="sg-modern-product-grid">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                isWishlisted={isWishlisted}
                toggleWishlist={toggleWishlist}
                onOpenModal={handleOpenModal}
                onAddToCart={handleProductAddToCart}
              />
            ))}
          </div>
        )}
      </section>

      {/* GALLERY SECTION */}
      {products.length > 0 && (
        <section className="sg-gallery-slider-section sg-reveal">
          <div className="sg-section-heading-wrap sg-text-center sg-container" style={{ marginBottom: '18px' }}>
            <span className="sg-sub-heading">Handpicked For You</span>
            <h2 className="sg-main-heading">A Glimpse Of Our Sweets</h2>
          </div>

          <div className="sg-gallery-slider-viewport">
            <div className="sg-gallery-slider-track">
              {[...products, ...products].map((p, idx) => (
                <div className="sg-gallery-slide-item" key={`gallery-${p._id}-${idx}`}>
                  <img
                    src={getImageUrl(p.image)}
                    alt={p.name}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop';
                    }}
                  />
                  <span className="sg-gallery-slide-caption">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Homepage;