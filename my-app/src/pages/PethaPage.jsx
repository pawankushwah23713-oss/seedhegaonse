import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Homepage.css';
import dummy3 from '../assets/dumy3.png';

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

// 🟢 Helper to check if a product is a Petha
export const isPethaProduct = (p) => {
  if (!p) return false;
  const category = (p.category || '').toLowerCase();
  const name = (p.name || '').toLowerCase();
  const combined = `${category} ${name}`;
  return (
    category === 'petha' ||
    combined.includes('petha') ||
    combined.includes('angoori') ||
    combined.includes('agra') ||
    combined.includes('paan petha') ||
    combined.includes('kesar petha') ||
    combined.includes('dry petha')
  );
};

// 🟢 STOCK HELPER
const isOutOfStock = (product) => product?.inStock === false;

// 🟢 Default Variants Helper
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

// 🟢 Dedicated Petha Dummy Items
const DUMMY_PETHAS = [
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
    _id: 'dummy-petha-2',
    isDummy: true,
    name: 'Traditional Agra Classic Dry Petha',
    category: 'petha',
    originRegion: 'Agra',
    description: 'Crisp on the outside and wonderfully juicy inside, crafted using authentic ash gourd (winter melon) and purified sugar syrup.',
    price: 320,
    originalPrice: 320,
    discount: 0,
    offerText: '',
    offerImage: '',
    image: dummy3,
    inStock: true
  },
  {
    _id: 'dummy-petha-3',
    isDummy: true,
    name: 'Shahi Gulab Paan Stuffed Petha',
    category: 'petha',
    originRegion: 'Agra',
    description: 'Exquisite green paan-shaped petha bites stuffed with rich gulkand, crushed dry fruits and natural aromatic mouth-fresheners.',
    price: 450,
    originalPrice: 450,
    discount: 0,
    offerText: '',
    offerImage: '',
    image: dummy3,
    inStock: true
  }
];

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
  const outOfStock = isOutOfStock(product);
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
          <span className="sg-badge-category-mini">PETHA</span>
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
        <span>📍 Handcrafted in {product.originRegion || 'Agra, UP'}</span>
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

const PethaPage = ({ addToCart, addedToast }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
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
    const fetchLivePethas = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();

        if (res.ok && Array.isArray(data) && data.length > 0) {
          // Filter out ONLY petha items from backend API
          const pethaApiItems = data.filter(isPethaProduct);
          const apiIds = new Set(pethaApiItems.map((p) => p._id?.toString()));
          const nonDupDummies = DUMMY_PETHAS.filter((d) => !apiIds.has(d._id?.toString()));
          setProducts([...pethaApiItems, ...nonDupDummies]);
        } else {
          setProducts(DUMMY_PETHAS);
        }
      } catch (err) {
        console.warn('Backend offline, using fallback dummy pethas:', err);
        setProducts(DUMMY_PETHAS);
      } finally {
        setLoading(false);
      }
    };

    fetchLivePethas();
  }, []);

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

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

  const sortedPethas = [...products].sort((a, b) => {
    const aOut = isOutOfStock(a) ? 1 : 0;
    const bOut = isOutOfStock(b) ? 1 : 0;
    return aOut - bOut;
  });

  const handleProductAddToCart = (p, qty = 1, variant = null) => {
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
        const modalOutOfStock = isOutOfStock(selectedProduct);
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
                    <span className="sg-badge-category">AGRA SPECIAL PETHA</span>
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
                    {selectedProduct.description || 'Authentic Agra recipe prepared from fresh winter melon (ash gourd) naturally infused with saffron, rose essence, and delicate sweetness.'}
                  </p>
                </div>

                <div className="sg-modal-trust-checklist">
                  <div className="sg-trust-check-item">✓ 100% Fresh Ash Gourd (Petha)</div>
                  <div className="sg-trust-check-item">✓ 0 Chemical Preservatives</div>
                  <div className="sg-trust-check-item">✓ Shelf Life: 15-20 Days</div>
                  <div className="sg-trust-check-item">✓ Hygienically Sealed Box</div>
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

      {/* Header Banner for Petha Page */}
      <section className="sg-container" style={{ marginTop: '24px' }}>
        <div className="sg-section-heading-wrap sg-text-center">
          <span className="sg-sub-heading">Juicy & Translucent Delights</span>
          <h1 className="sg-main-heading">⚪ Royal Agra Petha Collection</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '6px' }}>
            Authentic Taj Nagri Agra petha varieties infused with Kashmiri Kesar, Rose Water & Gulkand.
          </p>
        </div>
      </section>

      {/* Product Grid */}
      <section className="sg-products-section sg-container">
        {loading && products.length === 0 ? (
          <div className="sg-empty-loading-state">
            <div className="sg-spinner"></div>
            <h3>⚪ Loading fresh juicy pethas...</h3>
          </div>
        ) : sortedPethas.length === 0 ? (
          <div className="sg-empty-category-card">
            <h3>No Pethas currently available!</h3>
            <button className="sg-primary-btn" onClick={() => navigate('/')} style={{ marginTop: '12px' }}>
              Explore All Sweets
            </button>
          </div>
        ) : (
          <div className="sg-modern-product-grid">
            {sortedPethas.map((p) => (
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
    </div>
  );
};

export default PethaPage;