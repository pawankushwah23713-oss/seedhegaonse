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

// 🟢 Bulletproof Array & JSON Normalizer
export const ensureArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

// 🟢 Strict Boolean Checker
export const isTrueFlag = (val) => val === true || val === 'true' || val === 1 || val === '1';

// 🟢 Check if dummy product
const isDummyProduct = (product) => {
  if (!product) return false;
  return Boolean(product.isDummy || product._id?.toString().startsWith('dummy'));
};

// 🟢 Check timeline discount validity
const isTimelineDiscountValid = (product) => {
  if (!product) return false;
  const discount = Number(product.discountPercent || product.discount) || 0;
  if (discount <= 0) return false;
  if (!product.discountValidUntil) return true;
  return new Date(product.discountValidUntil) > new Date();
};

// 🟢 Default Variants Generator
export const getProductVariants = (product) => {
  const existingVars = ensureArray(product?.variants);
  if (existingVars.length > 0) return existingVars;

  const isDummy = isDummyProduct(product);
  const basePrice = Number(product?.price) || 0;
  const hasTimeline = !isDummy && isTimelineDiscountValid(product);
  const discountVal = hasTimeline ? Number(product.discountPercent || product.discount) : 0;

  let baseMrp = Number(product?.originalPrice) || 0;
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

// Dummy Products
const DUMMY_PRODUCTS = [
  {
    _id: 'dummy-1',
    isDummy: true,
    name: 'Pure Desi Ghee Motichoor Ladoo',
    category: 'ladoo',
    originRegion: 'Jodhpur',
    description: 'Melt-in-mouth tiny boondi pearls fried in 100% pure desi ghee & garnished with pistachios.',
    price: 480,
    originalPrice: 480,
    discount: 0,
    image: dummy1,
    inStock: true,
    isFreeDelivery: false,
    bulkTiers: [
      { minSpend: 5000, discountValue: 5, discountType: 'percentage' },
      { minSpend: 12000, discountValue: 20, discountType: 'percentage' }
    ],
    giftTiers: [
      { minSpend: 1500, giftTitle: 'Free 100g Mathura Peda Box' }
    ]
  },
  {
    _id: 'dummy-2',
    isDummy: true,
    name: 'Traditional Mathura Peda',
    category: 'peda',
    originRegion: 'Mathura',
    description: 'Slow-roasted authentic khoya infused with aromatic cardamom.',
    price: 520,
    originalPrice: 520,
    discount: 0,
    image: dummy2,
    inStock: true,
    isFreeDelivery: false
  },
  {
    _id: 'dummy-3',
    isDummy: true,
    name: 'Royal Agra Kesar Angoori Petha',
    category: 'petha',
    originRegion: 'Agra',
    description: 'Juicy, soft sweet pumpkin bites infused with natural Kashmiri saffron.',
    price: 360,
    originalPrice: 360,
    discount: 0,
    image: dummy3,
    inStock: true,
    isFreeDelivery: false
  },
  {
    _id: 'dummy-4',
    isDummy: true,
    name: 'Diamond Silver Foil Kaju Katli',
    category: 'barfi',
    originRegion: 'Delhi NCR',
    description: 'Premium quality Goan cashews crafted with pure silver vark.',
    price: 950,
    originalPrice: 950,
    discount: 0,
    image: dummy4,
    inStock: true,
    isFreeDelivery: false
  }
];

const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:') || imagePath.startsWith('/assets/')) {
    return imagePath;
  }
  const cleanPath = imagePath.replace(/\\/g, '/');
  return `${SERVER_HOST}${cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`}`;
};

const calculatePricing = (targetObj, qty = 1, isDummy = false) => {
  const price = Number(targetObj?.price) || 0;
  if (isDummy) return { price: price * qty, mrp: null, discountPercent: null, savings: 0 };

  let mrp = Number(targetObj?.originalPrice) || 0;
  const manualDiscount = Number(targetObj?.discount || targetObj?.discountPercent) || 0;
  let discountPercent = 0;

  if (manualDiscount > 0) {
    discountPercent = manualDiscount;
    if (!mrp || mrp <= price) mrp = Math.round(price / (1 - discountPercent / 100));
  } else if (mrp > price) {
    discountPercent = Math.round(((mrp - price) / mrp) * 100);
  }

  const savings = mrp > price && discountPercent > 0 ? (mrp - price) * qty : 0;
  return { price: price * qty, mrp: mrp > price ? mrp * qty : null, discountPercent: discountPercent > 0 ? discountPercent : null, savings };
};

const WISHLIST_KEY = 'seedhegaonse_wishlist';
const loadWishlist = () => {
  try {
    const saved = localStorage.getItem(WISHLIST_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// 🟢 Individual Product Card
const ProductCard = ({ product, isWishlisted, toggleWishlist, onOpenModal, onAddToCart }) => {
  const isDummy = isDummyProduct(product);
  const variants = getProductVariants(product);
  const defaultVar = variants[0];
  const [selectedVariant, setSelectedVariant] = useState(defaultVar);

  const pricing = calculatePricing(selectedVariant, 1, isDummy);
  const liked = isWishlisted(product._id);

  // 💎 Parse Dynamic Slabs with ensureArray
  const rawBulks = ensureArray(product.bulkTiers);
  const bulkList = rawBulks.length > 0
    ? rawBulks.filter((b) => Number(b.minSpend) > 0)
    : (Number(product.highValueThreshold) > 0 ? [{ minSpend: product.highValueThreshold, discountValue: product.highValueDiscountPercent, discountType: 'percentage' }] : []);

  const rawGifts = ensureArray(product.giftTiers);
  const giftList = rawGifts.filter((g) => g.giftTitle && Number(g.minSpend) > 0);

  const rawQty = ensureArray(product.quantityDiscounts);
  const qtyDiscounts = rawQty.filter((q) => Number(q.minQty) > 1);

  const hasFreeDelivery = !isDummy && isTrueFlag(product.isFreeDelivery);
  const hasBulkOffer = bulkList.length > 0;
  const hasGift = giftList.length > 0;
  const hasQtyDiscount = qtyDiscounts.length > 0;

  return (
    <div className="sg-product-card" onClick={() => onOpenModal(product, selectedVariant)}>
      {/* Top Badge Bar */}
      <div className="sg-card-top-bar">
        {hasBulkOffer ? (
          <span className="sg-badge-discount" style={{ background: '#059669', color: '#fff', fontWeight: 'bold' }}>
            💎 Bulk: Upto {Math.max(...bulkList.map((b) => Number(b.discountValue || b.discountPercent || 0)))}% OFF
          </span>
        ) : hasGift ? (
          <span className="sg-badge-discount" style={{ background: '#2563eb', color: '#fff', fontWeight: 'bold' }}>
            🎁 Free Gift
          </span>
        ) : pricing.discountPercent ? (
          <span className="sg-badge-discount">⏳ {pricing.discountPercent}% OFF</span>
        ) : hasFreeDelivery ? (
          <span className="sg-badge-discount" style={{ background: '#059669' }}>🚚 FREE SHIP</span>
        ) : (
          <span className="sg-badge-origin-mini">📍 {product.originRegion || 'Authentic'}</span>
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

      {/* Image */}
      <div className="sg-card-media-box">
        <img
          src={getImageUrl(product.image)}
          alt={product.name}
          className="sg-card-product-img"
          loading="lazy"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop'; }}
        />
      </div>

      {/* 🏷️ VISIBLE BULK TIERS & OFFERS STRIP */}
      {hasBulkOffer ? (
        <div
          style={{
            background: '#ecfdf5',
            color: '#065f46',
            padding: '6px 10px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            alignItems: 'center',
            borderBottom: '1.5px solid #a7f3d0'
          }}
        >
          <span>💎 Bulk Deals:</span>
          {bulkList.map((b, i) => (
            <span key={i} style={{ background: '#10b981', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
              ₹{Number(b.minSpend).toLocaleString('en-IN')}+➔{b.discountValue || b.discountPercent}% OFF
            </span>
          ))}
        </div>
      ) : hasGift ? (
        <div style={{ background: '#eff6ff', color: '#1e40af', padding: '6px 10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
          🎁 Free Gift: {giftList[0]?.giftTitle} (Spend ₹{Number(giftList[0]?.minSpend).toLocaleString('en-IN')}+)
        </div>
      ) : hasQtyDiscount ? (
        <div style={{ background: '#fff7ed', color: '#c2410c', padding: '6px 10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
          📦 Buy {qtyDiscounts[0]?.minQty}+ Packs: {qtyDiscounts[0]?.discountPercent}% Extra OFF
        </div>
      ) : (
        <div className="sg-card-origin-strip">
          <span>📍 Handcrafted in {product.originRegion || 'Authentic Gaon'}</span>
        </div>
      )}

      {/* Details Body */}
      <div className="sg-card-body">
        <h3 className="sg-card-title" title={product.name}>
          {product.name}
        </h3>

        {/* Variants */}
        <div className="sg-card-variants-container" onClick={(e) => e.stopPropagation()}>
          <div className="sg-variant-chips-list">
            {variants.map((v, idx) => {
              const isActive = selectedVariant.label === v.label || selectedVariant.weight === v.weight;
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

        {/* Pricing Footer */}
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

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedModalVariant, setSelectedModalVariant] = useState(null);
  const [modalQty, setModalQty] = useState(1);

  const handleOpenModal = (product, initialVariant = null) => {
    setSelectedProduct(product);
    const variants = getProductVariants(product);
    setSelectedModalVariant(initialVariant || variants[0]);
    setModalQty(1);
  };

  useEffect(() => {
    const fetchLiveProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();
        if (res.ok && Array.isArray(data) && data.length > 0) {
          const apiIds = new Set(data.map((p) => p._id?.toString()));
          const nonDupDummies = DUMMY_PRODUCTS.filter((d) => !apiIds.has(d._id?.toString()));
          setProducts([...data, ...nonDupDummies]);
        } else {
          setProducts(DUMMY_PRODUCTS);
        }
      } catch {
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
          setBanners([{ id: 1, image: banner1 }, { id: 2, image: banner2 }]);
        }
      } catch {
        setBanners([{ id: 1, image: banner1 }, { id: 2, image: banner2 }]);
      }
    };

    fetchLiveProducts();
    fetchLiveBanners();
  }, []);

  const heroSlides = banners.length > 0 ? banners : [{ id: 1, image: banner1 }, { id: 2, image: banner2 }];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const isWishlisted = (productId) => {
    if (!productId) return false;
    return wishlist.includes(productId.toString());
  };

  const toggleWishlist = (e, productId) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const pIdStr = productId.toString();
    setWishlist((prev) => {
      const updated = prev.includes(pIdStr) ? prev.filter((id) => id !== pIdStr) : [...prev, pIdStr];
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Add To Cart handler passing all dynamic slabs cleanly
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
      isFreeDelivery: isTrueFlag(p.isFreeDelivery),
      bulkTiers: ensureArray(p.bulkTiers),
      giftTiers: ensureArray(p.giftTiers),
      couponsList: ensureArray(p.couponsList),
      quantityDiscounts: ensureArray(p.quantityDiscounts),
      highValueThreshold: Number(p.highValueThreshold || 0),
      highValueDiscountPercent: Number(p.highValueDiscountPercent || 0)
    });
    return true;
  };

  const filteredProducts = products.filter((p) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'wishlist') return isWishlisted(p._id);
    const cat = (p.category || '').toLowerCase();
    const name = (p.name || '').toLowerCase();
    return cat.includes(activeTab.toLowerCase()) || name.includes(activeTab.toLowerCase());
  });

  return (
    <div className="sg-homepage-container">
      {/* FLOATING WHATSAPP BUTTON */}
      <a href="https://wa.me/919315911105" className="sg-whatsapp-button sg-pulse-anim" target="_blank" rel="noreferrer" title="Chat on WhatsApp">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.762.459 3.48 1.333 5.001L2 22l5.122-1.343c1.468.802 3.123 1.225 4.887 1.226 5.507 0 9.989-4.478 9.99-9.985 0-5.507-4.482-9.998-9.987-9.998zm5.83 14.364c-.244.685-1.41 1.309-1.974 1.393-.505.075-1.144.106-1.844-.117-.424-.135-.97-.315-1.67-.616-2.937-1.268-4.854-4.258-5.001-4.453-.146-.195-1.195-1.591-1.195-3.033 0-1.441.758-2.151 1.026-2.443.268-.293.585-.366.78-.366.195 0 .39.002.561.01.18.008.421-.068.66.505.244.585.833 2.03.906 2.176.073.146.122.317.024.512-.098.195-.146.317-.293.488-.146.171-.307.382-.439.513-.146.146-.298.305-.128.597.171.293.758 1.252 1.626 2.025 1.118.995 2.062 1.304 2.355 1.45.293.146.463.122.634-.073.171-.195.732-.853.927-1.146.195-.293.39-.244.659-.146.268.098 1.708.805 2.001.951.293.146.488.22.561.341.073.122.073.71-.171 1.395z"/>
        </svg>
      </a>

      {addedToast && (
        <div className="sg-cart-toast sg-fade-slide-up">
          ✓ <strong>{addedToast}</strong> added to cart
        </div>
      )}

      {/* 🌟 100% VISIBLE HERO SECTION (Guaranteed Rendering) */}
      <section
        style={{
          position: 'relative',
          minHeight: '440px',
          background: 'linear-gradient(135deg, #1e3a2f 0%, #0f241d 100%)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: '40px 20px',
          textAlign: 'center'
        }}
      >
        {heroSlides.map((slide, idx) => (
          <div
            key={slide.id || idx}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `linear-gradient(135deg, rgba(7, 35, 27, 0.82) 0%, rgba(13, 59, 46, 0.65) 100%), url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: idx === currentSlide ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out',
              zIndex: 1
            }}
          />
        ))}

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px', margin: '0 auto' }}>
          <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', padding: '6px 18px', borderRadius: '30px', fontSize: '0.92rem', fontWeight: 'bold', color: '#fef08a', marginBottom: '12px', border: '1px solid rgba(254, 240, 138, 0.5)' }}>
            🍯 100% Pure Desi Ghee & Fresh Daily Handcrafted
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', margin: '0 0 12px', fontWeight: '800', lineHeight: '1.2', color: '#ffffff' }}>
            Pure Village Sweets Direct To Your Doorstep
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: '#e2e8f0', margin: '0 0 24px', lineHeight: '1.5' }}>
            Authentic taste from Jodhpur, Mathura, Agra & Jaipur. 0% Preservatives, Sourced Directly from Artisans.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="#products"
              style={{ padding: '12px 28px', background: '#94191d', color: '#fff', borderRadius: '30px', fontWeight: 'bold', textDecoration: 'none', fontSize: '1rem', boxShadow: '0 4px 15px rgba(148, 25, 29, 0.4)' }}
            >
              🍬 Explore Sweets
            </a>
            <a
              href="https://wa.me/919315911105"
              target="_blank"
              rel="noreferrer"
              style={{ padding: '12px 24px', background: '#25d366', color: '#fff', borderRadius: '30px', fontWeight: 'bold', textDecoration: 'none', fontSize: '1rem' }}
            >
              💬 WhatsApp Order
            </a>
          </div>
        </div>

        {/* Dots */}
        <div style={{ position: 'absolute', bottom: '15px', zIndex: 3, display: 'flex', gap: '8px' }}>
          {heroSlides.map((_, idx) => (
            <span
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              style={{
                width: idx === currentSlide ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: idx === currentSlide ? '#fef08a' : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            />
          ))}
        </div>
      </section>

      {/* 4 USP CARDS */}
      <section className="sg-usp-banner-section sg-container">
        <div className="sg-usp-grid">
          <div className="sg-usp-card">
            <div className="sg-usp-icon-wrap">🚚</div>
            <div className="sg-usp-text"><h4>Same Day Delivery</h4><p>In Delhi NCR</p></div>
          </div>
          <div className="sg-usp-card">
            <div className="sg-usp-icon-wrap">🌿</div>
            <div className="sg-usp-text"><h4>No Preservatives</h4><p>0% Artificial Flavours</p></div>
          </div>
          <div className="sg-usp-card">
            <div className="sg-usp-icon-wrap">🍯</div>
            <div className="sg-usp-text"><h4>Fresh Made Daily</h4><p>100% Pure Desi Ghee</p></div>
          </div>
          <div className="sg-usp-card">
            <div className="sg-usp-icon-wrap">🏛️</div>
            <div className="sg-usp-text"><h4>100% Authentic</h4><p>Village Artisans Recipe</p></div>
          </div>
        </div>
      </section>

      {/* MAIN PRODUCTS SECTION */}
      <section id="products" className="sg-products-section sg-container">
        <div className="sg-section-heading-wrap">
          <div>
            <span className="sg-sub-heading">Fresh & Authentic</span>
            <h2 className="sg-main-heading">Village Special Sweets</h2>
          </div>

          <div className="sg-tab-filters">
            <button className={`sg-tab-btn ${activeTab === 'all' ? 'sg-active' : ''}`} onClick={() => setActiveTab('all')}>🍬 All Sweets ({products.length})</button>
            <button className={`sg-tab-btn ${activeTab === 'ladoo' ? 'sg-active' : ''}`} onClick={() => setActiveTab('ladoo')}>🟡 Laddu</button>
            <button className={`sg-tab-btn ${activeTab === 'peda' ? 'sg-active' : ''}`} onClick={() => setActiveTab('peda')}>🟤 Peda</button>
            <button className={`sg-tab-btn ${activeTab === 'petha' ? 'sg-active' : ''}`} onClick={() => setActiveTab('petha')}>⚪ Petha</button>
            <button className={`sg-tab-btn ${activeTab === 'barfi' ? 'sg-active' : ''}`} onClick={() => setActiveTab('barfi')}>🔶 Barfi</button>
            <button className={`sg-tab-btn ${activeTab === 'wishlist' ? 'sg-active' : ''}`} onClick={() => setActiveTab('wishlist')}>❤️ Wishlist ({wishlist.length})</button>
          </div>
        </div>

        {/* PRODUCTS GRID */}
        {loading && products.length === 0 ? (
          <div className="sg-empty-loading-state">
            <div className="sg-spinner"></div>
            <h3>🍬 Loading fresh sweets...</h3>
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

      {/* QUICK VIEW MODAL */}
      {selectedProduct && (() => {
        const isDummy = isDummyProduct(selectedProduct);
        const modalVariants = getProductVariants(selectedProduct);
        const currentActiveVariant = selectedModalVariant || modalVariants[0];
        const pricing = calculatePricing(currentActiveVariant, modalQty, isDummy);
        const modalBulks = ensureArray(selectedProduct.bulkTiers).filter((b) => Number(b.minSpend) > 0);
        const modalGifts = ensureArray(selectedProduct.giftTiers).filter((g) => g.giftTitle);

        return (
          <div className="sg-product-modal-backdrop" onClick={() => setSelectedProduct(null)}>
            <div className="sg-product-modal-card" onClick={(e) => e.stopPropagation()}>
              <button className="sg-modal-close-btn" onClick={() => setSelectedProduct(null)}>✕</button>

              <div className="sg-modal-image-col">
                <img src={getImageUrl(selectedProduct.image)} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              <div className="sg-modal-info-col">
                <div>
                  <div className="sg-modal-tags-row">
                    {selectedProduct.originRegion && <span className="sg-badge-origin">📍 {selectedProduct.originRegion} Special</span>}
                    {selectedProduct.category && <span className="sg-badge-category">{selectedProduct.category.toUpperCase()}</span>}
                  </div>

                  <h3 className="sg-modal-title">{selectedProduct.name}</h3>

                  <div className="sg-modal-variant-section">
                    <span className="sg-variant-section-title">Select Pack Size / Weight:</span>
                    <div className="sg-modal-variant-chips">
                      {modalVariants.map((v, idx) => {
                        const isActive = currentActiveVariant?.label === v.label || currentActiveVariant?.weight === v.weight;
                        return (
                          <button key={v._id || idx} type="button" className={`sg-modal-chip-btn ${isActive ? 'sg-active' : ''}`} onClick={() => setSelectedModalVariant(v)}>
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
                  </div>

                  <p className="sg-modal-desc">{selectedProduct.description || 'Authentic traditional sweet recipe prepared using 100% pure desi ghee.'}</p>
                </div>

                {/* 💎 BULK TIERS BOX */}
                {modalBulks.length > 0 && (
                  <div style={{ background: '#ecfdf5', border: '1.5px dashed #059669', padding: '10px 14px', borderRadius: '10px', margin: '8px 0', color: '#065f46', fontSize: '0.86rem' }}>
                    <div style={{ fontWeight: '800' }}>💎 Bulk Order Tier Discounts Active:</div>
                    {modalBulks.map((b, i) => (
                      <div key={i} style={{ marginTop: '3px' }}>
                        • Spend ₹{Number(b.minSpend).toLocaleString('en-IN')}+ ➔ Get <strong>{b.discountValue || b.discountPercent}% {b.discountType === 'flat' ? 'FLAT' : 'EXTRA'} OFF</strong>
                      </div>
                    ))}
                  </div>
                )}

                {/* 🎁 GIFT BOX */}
                {modalGifts.length > 0 && (
                  <div style={{ background: '#eff6ff', border: '1.5px dashed #2563eb', padding: '10px 14px', borderRadius: '10px', margin: '8px 0', color: '#1e40af', fontSize: '0.86rem' }}>
                    <div style={{ fontWeight: '800' }}>🎁 Free Gift On Spend:</div>
                    {modalGifts.map((g, i) => (
                      <div key={i} style={{ marginTop: '3px' }}>
                        • Spend ₹{Number(g.minSpend).toLocaleString('en-IN')}+ ➔ Get <strong>{g.giftTitle}</strong> FREE!
                      </div>
                    ))}
                  </div>
                )}

                <div className="sg-modal-actions-row">
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
    </div>
  );
};

export default Homepage;