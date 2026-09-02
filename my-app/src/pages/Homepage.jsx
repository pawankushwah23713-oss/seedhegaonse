import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Homepage.css';
import banner1 from '../assets/banner1.png';
import banner2 from '../assets/banner2.png';

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

// 🟢 STOCK HELPER — inStock === false hone par hi Out of Stock
const isOutOfStock = (product) => product?.inStock === false;

// 🟢 Helper to get Default Variants (Lowest Weight Default & No Fake Discount on Dummy)
export const getProductVariants = (product) => {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants;
  }
  const isDummy = isDummyProduct(product);
  const basePrice = Number(product.price) || 0;
  const hasDiscount = !isDummy && (Number(product.originalPrice) > basePrice || Number(product.discount) > 0);
  const baseMrp = Number(product.originalPrice) || basePrice;
  const discountVal = isDummy ? 0 : (Number(product.discount) || 0);

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

// 🟢 ADDED — FUZZY / TYPO-TOLERANT MATCH HELPERS
// Yeh sirf tab kaam aate hain jab exact substring/token match (Tier 1-6)
// kisi bhi field me nahi milta — jaise "laddoo" (double o) type karne par,
// jabki product me "Ladoo" / category "ladoo" hai. Levenshtein edit-distance
// se chhote spelling farak (typo, extra/missing letter) ko tolerate karte hain.
const levenshteinDistance = (a, b) => {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j]);
      }
    }
  }
  return dp[m][n];
};

// Do words "kaafi close" hain kya (typo tolerance), word/token length ke
// hisaab se threshold adjust hota hai taaki chhote words par galat match na ho
const isFuzzyMatch = (word, token) => {
  if (!word || !token) return false;
  if (word === token) return true;
  const maxLen = Math.max(word.length, token.length);
  if (maxLen <= 3) return false; // bahut chhote words par fuzzy match risky hai
  const threshold = maxLen <= 5 ? 1 : maxLen <= 8 ? 2 : 3;
  return levenshteinDistance(word, token) <= threshold;
};

// 🟢 UNIVERSAL PRODUCT SEARCH — TIERED PRIORITY MATCHING
// Pehle EXACT/CLOSE product name match dhundta hai — agar mil jaye toh
// SIRF wahi dikhega (baaki loose/broad matches ignore ho jaate hain).
// Tabhi jab koi name-match na mile, tab category/description/price jaise
// broader fields me search hota hai. Isse "Pure Desi Ghee Motichoor Ladoo"
// type karne par sirf wahi ek product aayega, sare laddu nahi.
//
// Tier 1 = exact name match (best)
// Tier 2 = name me poora phrase substring ki tarah mila
// Tier 3 = name ke andar sare words mile (order matters nahi)
// Tier 4 = category exact match
// Tier 5 = poora phrase category/origin/description me mila
// Tier 6 = sare words kahin bhi (name+category+origin+description+price) mile
// Tier 7 = 🟢 name ke words se typo/spelling-variant fuzzy match (e.g. "laddoo" ~ "Ladoo")
// Tier 8 = 🟢 category/origin/description/variant words se fuzzy match
// Tier 0 = koi match nahi
const getSearchMatchTier = (product, term) => {
  if (!term) return 0;

  const name = String(product.name || '').toLowerCase();
  const category = String(product.category || '').toLowerCase();
  const origin = String(product.originRegion || '').toLowerCase();
  const description = String(product.description || '').toLowerCase();
  const priceStr = String(product.price ?? '');
  const tokens = term.split(/\s+/).filter(Boolean);

  if (name === term) return 1;
  if (name.includes(term)) return 2;

  const nameTokensMatch = tokens.length > 0 && tokens.every((t) => name.includes(t));
  if (nameTokensMatch) return 3;

  if (category === term) return 4;
  if (category.includes(term) || origin.includes(term) || description.includes(term)) return 5;

  const variants = getProductVariants(product);
  const variantText = variants
    .map((v) => `${v.label || ''} ${v.weight || ''} ${v.price || ''}`)
    .join(' ')
    .toLowerCase();

  const broadHaystack = `${name} ${category} ${origin} ${description} ${priceStr} ${product.originalPrice ?? ''} ${variantText}`;
  const allTokensMatchBroadly = tokens.length > 0 && tokens.every((t) => broadHaystack.includes(t));
  if (allTokensMatchBroadly) return 6;

  // 🟢 Tier 7 — Fuzzy match sirf product name ke words ke against
  const nameWords = name.split(/\s+/).filter(Boolean);
  const nameFuzzyMatch = tokens.length > 0 && tokens.every((t) => nameWords.some((w) => isFuzzyMatch(w, t)));
  if (nameFuzzyMatch) return 7;

  // 🟢 Tier 8 — Fuzzy match broader fields (category/origin/description/variants) ke against
  const broadWords = broadHaystack.split(/\s+/).filter(Boolean);
  const broadFuzzyMatch = tokens.length > 0 && tokens.every((t) => broadWords.some((w) => isFuzzyMatch(w, t)));
  if (broadFuzzyMatch) return 8;

  return 0;
};

// 🟢 Product list ko search term ke against filter karta hai — sirf sabse
// "best" (sabse chhota tier number) match group ko return karta hai, taaki
// exact name match milne par baaki loose matches dab na jayein screen par.
const filterProductsBySearch = (products, rawSearchTerm) => {
  const term = String(rawSearchTerm || '').trim().toLowerCase();
  if (!term) return products;

  const scored = products
    .map((p) => ({ product: p, tier: getSearchMatchTier(p, term) }))
    .filter((entry) => entry.tier > 0);

  if (scored.length === 0) return [];

  const bestTier = Math.min(...scored.map((entry) => entry.tier));
  return scored.filter((entry) => entry.tier === bestTier).map((entry) => entry.product);
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
  const movedRef = useRef(false);
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
    movedRef.current = false;
    startXRef.current = e.clientX;
    trackWidthRef.current = containerRef.current ? containerRef.current.offsetWidth : 1;
    if (onDragStateChange) onDragStateChange(true);
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

const ProductCard = ({ product, isWishlisted, toggleWishlist, onOpenModal, onAddToCart }) => {
  const isDummy = isDummyProduct(product);
  const outOfStock = isOutOfStock(product); // 🟢 STOCK CHECK
  const variants = getProductVariants(product);
  const defaultVar = variants[0];
  const [selectedVariant, setSelectedVariant] = useState(defaultVar);

  const pricing = calculatePricing(selectedVariant, 1, isDummy);
  const liked = isWishlisted(product._id);

  return (
    <div
      className="sg-product-card"
      style={{ position: 'relative', cursor: outOfStock ? 'not-allowed' : 'pointer' }}
      onClick={() => {
        if (outOfStock) return; // 🟢 Out of stock par modal nahi khulega
        onOpenModal(product, selectedVariant);
      }}
    >
      {/* 🟢 OUT OF STOCK STAMP */}
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
          className={`sg-card-heart-btn ${liked ? 'sg-is-liked' : ''}`}
          onClick={(e) => toggleWishlist(e, product._id)}
          aria-label="Wishlist"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? '#ef4444' : 'none'} stroke={liked ? '#ef4444' : '#64748b'} strokeWidth="2.2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      {/* 🟢 BLUR: sirf out of stock par */}
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
              if (outOfStock) return; // 🟢 double safety
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

const Homepage = ({ addToCart, addedToast }) => {
  const navigate = useNavigate();
  const location = useLocation(); // 🟢 ADDED: read current URL (for ?search=...)
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

  const [isImageDragging, setIsImageDragging] = useState(false);

  // 🟢 ADDED: Navbar search se aane wala "?search=text" yahan se nikalte hain
  const searchTerm = new URLSearchParams(location.search).get('search')?.trim().toLowerCase() || '';

  // 🟢 ADDED: Search active hote hi purana category tab reset ho jaye,
  // warna tab filter search results ko chhupa dega
  useEffect(() => {
    if (searchTerm) setActiveTab('all');
  }, [searchTerm]);

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
    if (isOutOfStock(product)) return; // 🟢 Out of stock ka modal nahi khulega
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

  useEffect(() => {
    const fetchLiveProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();
        console.log(data);

        // 🟢 Ab sirf backend se fetch ki hui asli products hi dikhengi — koi dummy fallback nahi
        if (res.ok && Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.warn('Backend offline, no products to show:', err);
        setProducts([]);
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
        console.log(data);

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

  const filteredProducts = searchTerm
    ? filterProductsBySearch(products, searchTerm) // 🟢 search active ho toh sirf best-match products (tab ka koi asar nahi)
    : products.filter((p) => {
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

  // 🟢 In Stock products pehle, Out of Stock neeche
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aOut = isOutOfStock(a) ? 1 : 0;
    const bOut = isOutOfStock(b) ? 1 : 0;
    return aOut - bOut;
  });

  // 🟢 ADDED: Agar search ka koi bhi match na mile (0 results), toh user ko
  // "0 found" empty state dikhne ki jagah khud-ba-khud related page (yahi
  // page, search clear karke) par redirect ho jaye — poora catalog dikhega.
  useEffect(() => {
    if (searchTerm && !loading && sortedProducts.length === 0) {
      navigate(location.pathname, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, loading, sortedProducts.length]);

  const handleProductAddToCart = (p, qty = 1, variant = null) => {
    // 🟢 Out of stock item kabhi cart me nahi jayega
    if (isOutOfStock(p)) {
      setAuthAlert(`"${p.name}" abhi Out of Stock hai`);
      setTimeout(() => setAuthAlert(''), 2500);
      return false;
    }

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
      giftTiers: p.giftTiers || [],
      bulkTiers: p.bulkTiers || [],
      couponsList: p.couponsList || [],
      isFreeDelivery: p.isFreeDelivery || false
    });
    return true;
  };

  return (
    <div className="sg-homepage-container">
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

      {authAlert && (
        <div className="sg-cart-toast sg-fade-slide-up" style={{ background: '#dc2626' }}>
          <span>⚠️ {authAlert}</span>
          <button onClick={() => navigate('/auth')} className="sg-toast-login-btn">Login Now</button>
        </div>
      )}

      {addedToast && !authAlert && (
        <div className="sg-cart-toast sg-fade-slide-up">
          ✓ <strong>{addedToast}</strong> added to cart
        </div>
      )}

      {selectedProduct && (() => {
        const isDummy = isDummyProduct(selectedProduct);
        const modalOutOfStock = isOutOfStock(selectedProduct); // 🟢
        const modalVariants = getProductVariants(selectedProduct);
        const currentActiveVariant = selectedModalVariant || modalVariants[0];
        const pricing = calculatePricing(currentActiveVariant, modalQty, isDummy);

        return (
          <div className="sg-product-modal-backdrop" onClick={() => setSelectedProduct(null)}>
            <div className="sg-product-modal-card" onClick={(e) => e.stopPropagation()}>
              <button className="sg-modal-close-btn" onClick={() => setSelectedProduct(null)} aria-label="Close">✕</button>

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
                  <div className="sg-trust-check-item">✓ 100% Pure Desi Ghee</div>
                  <div className="sg-trust-check-item">✓ 0 Preservatives Added</div>
                  <div className="sg-trust-check-item">✓ Shelf Life: 7-10 Days</div>
                  <div className="sg-trust-check-item">✓ Hygienically Packed</div>
                </div>

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
                      if (added) setSelectedProduct(null);
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

      <section className="sg-hero-slider-section">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
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

      <section id="products" className="sg-products-section sg-container sg-reveal">

        {/* 🟢 ADDED: Search chal raha ho toh user ko dikhao kya search hua */}
        {searchTerm && (
          <div className="sg-section-heading-wrap" style={{ marginBottom: '14px' }}>
            <h2 className="sg-main-heading" style={{ fontSize: '18px' }}>
              🔍 Search results for "<span style={{ color: 'var(--primary-brand)' }}>{searchTerm}</span>"
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginLeft: '8px' }}>
                ({sortedProducts.length} found)
              </span>
            </h2>
          </div>
        )}

        {loading && products.length === 0 ? (
          <div className="sg-empty-loading-state">
            <div className="sg-spinner"></div>
            <h3>🍬 Loading authentic village sweets...</h3>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="sg-empty-category-card">
            <h3>
              {searchTerm
                ? `No results found for "${searchTerm}"`
                : activeTab === 'wishlist'
                  ? 'Your Wishlist is Empty!'
                  : 'No sweets found in this category!'}
            </h3>
            <button
              className="sg-primary-btn"
              onClick={() => {
                setActiveTab('all');
                if (searchTerm) navigate('/');
              }}
              style={{ marginTop: '12px' }}
            >
              Explore All Sweets
            </button>
          </div>
        ) : (
          <div className="sg-modern-product-grid">
            {sortedProducts.map((p) => (
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
                    style={isOutOfStock(p) ? { filter: 'blur(2px) grayscale(0.8)', opacity: 0.6 } : undefined}
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