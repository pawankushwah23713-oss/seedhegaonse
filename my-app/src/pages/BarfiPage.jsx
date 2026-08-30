import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Homepage.css';
import dummy4 from '../assets/dumy4.png';
import dummy6 from '../assets/dumy6.png';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const SERVER_HOST = API_BASE.replace('/api', '');

const isDummyProduct = (product) => Boolean(product?.isDummy || product?._id?.toString().startsWith('dummy'));

export const isBarfiProduct = (p) => {
  if (!p) return false;
  const category = (p.category || '').toLowerCase();
  const name = (p.name || '').toLowerCase();
  const combined = `${category} ${name}`;
  return (
    category === 'barfi' ||
    combined.includes('barfi') ||
    combined.includes('katli') ||
    combined.includes('kaju') ||
    combined.includes('milk cake') ||
    combined.includes('kalakand') ||
    combined.includes('burfi')
  );
};

const isOutOfStock = (product) => product?.inStock === false;

export const getProductVariants = (product) => {
  if (Array.isArray(product.variants) && product.variants.length > 0) return product.variants;
  const isDummy = isDummyProduct(product);
  const basePrice = Number(product.price) || 0;
  const hasDiscount = !isDummy && (Number(product.originalPrice) > basePrice || Number(product.discount) > 0);
  const baseMrp = Number(product.originalPrice) || basePrice;
  const discountVal = isDummy ? 0 : (Number(product.discount) || 0);

  return [
    { _id: 'v-250', label: '250g', weight: '250g', price: Math.round(basePrice * 0.55), originalPrice: hasDiscount ? Math.round(baseMrp * 0.55) : null, discount: discountVal },
    { _id: 'v-500', label: '500g', weight: '500g', price: basePrice, originalPrice: hasDiscount ? baseMrp : null, discount: discountVal },
    { _id: 'v-1000', label: '1kg', weight: '1kg', price: Math.round(basePrice * 1.9), originalPrice: hasDiscount ? Math.round(baseMrp * 1.9) : null, discount: discountVal }
  ];
};

const DUMMY_BARFIS = [
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
    _id: 'dummy-barfi-3',
    isDummy: true,
    name: 'Royal Pista Malai Barfi',
    category: 'barfi',
    originRegion: 'Hisar',
    description: 'Silky smooth khoya layers blended with rich California pistachios and cardamom.',
    price: 580,
    originalPrice: 580,
    discount: 0,
    offerText: '',
    offerImage: '',
    image: dummy4,
    inStock: true
  }
];

const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:') || imagePath.startsWith('/src/')) return imagePath;
  const cleanPath = imagePath.replace(/\\/g, '/');
  return `${SERVER_HOST}${cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`}`;
};

const calculatePricing = (targetObj, qty = 1, isDummy = false) => {
  const price = Number(targetObj?.price) || 0;
  if (isDummy) return { price: price * qty, mrp: null, discountPercent: null, savings: 0 };
  let mrp = Number(targetObj?.originalPrice) || 0;
  const manualDiscount = Number(targetObj?.discount) || 0;
  let discountPercent = 0;
  if (manualDiscount > 0) {
    discountPercent = manualDiscount;
    if (!mrp || mrp <= price) mrp = Math.round(price / (1 - discountPercent / 100));
  } else if (mrp > price) {
    discountPercent = Math.round(((mrp - price) / mrp) * 100);
  }
  return { price: price * qty, mrp: (mrp > price && discountPercent > 0) ? mrp * qty : null, discountPercent: discountPercent > 0 ? discountPercent : null, savings: (mrp > price && discountPercent > 0) ? (mrp - price) * qty : 0 };
};

const WISHLIST_KEY = 'seedhegaonse_wishlist';
const loadWishlist = () => {
  try {
    const saved = localStorage.getItem(WISHLIST_KEY);
    return saved ? JSON.parse(saved).map((i) => (typeof i === 'object' && i !== null ? (i._id || i.id) : i).toString()) : [];
  } catch {
    return [];
  }
};

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop';

const BarfiPage = ({ addToCart, addedToast }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState(loadWishlist);
  const [authAlert, setAuthAlert] = useState('');

  // 🟢 QUICK VIEW MODAL STATE
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
      transform: 'scale(2.3)'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)'
    });
  };

  const closeModal = () => setSelectedProduct(null);

  // 🟢 Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = selectedProduct ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedProduct]);

  // 🟢 Close modal on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const fetchLiveBarfis = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();
        if (res.ok && Array.isArray(data) && data.length > 0) {
          const barfiItems = data.filter(isBarfiProduct);
          const apiIds = new Set(barfiItems.map((p) => p._id?.toString()));
          const nonDup = DUMMY_BARFIS.filter((d) => !apiIds.has(d._id?.toString()));
          setProducts([...barfiItems, ...nonDup]);
        } else {
          setProducts(DUMMY_BARFIS);
        }
      } catch (err) {
        setProducts(DUMMY_BARFIS);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveBarfis();
  }, []);

  const isWishlisted = (id) => wishlist.some((w) => w?.toString() === id?.toString());

  const toggleWishlist = (e, id) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const pId = id.toString();
    setWishlist((prev) => {
      const updated = prev.includes(pId) ? prev.filter((i) => i !== pId) : [...prev, pId];
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const handleOpenModal = (product, initialVariant = null) => {
    if (isOutOfStock(product)) return;
    const variants = getProductVariants(product);
    setSelectedProduct(product);
    setSelectedModalVariant(initialVariant || variants[0]);
    setModalQty(1);
  };

  const handleProductAddToCart = (p, qty = 1, variant = null) => {
    if (isOutOfStock(p)) {
      setAuthAlert(`"${p.name}" abhi Out of Stock hai`);
      setTimeout(() => setAuthAlert(''), 2500);
      return false;
    }
    const v = variant || (p.variants && p.variants[0]) || { weight: '250g', label: '250g', price: Math.round(p.price * 0.55) };
    addToCart({
      id: `${p._id}_${v.label || v.weight}`,
      productId: p._id,
      name: `${p.name} (${v.label || v.weight})`,
      variant: v.label || v.weight,
      price: `₹${Number(v.price || p.price)}`,
      unitPrice: Number(v.price || p.price),
      quantity: qty,
      totalPrice: Number(v.price || p.price) * qty,
      img: getImageUrl(p.image),
      originRegion: p.originRegion
    });
    return true;
  };

  return (
    <div className="sg-homepage-container">
      {authAlert && <div className="sg-cart-toast" style={{ background: '#dc2626' }}>⚠️ {authAlert}</div>}
      {addedToast && <div className="sg-cart-toast">✓ <strong>{addedToast}</strong> added to cart</div>}

      {/* 🟢 QUICK VIEW POPUP MODAL (same structure/classes as Homepage) */}
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
                <img
                  src={getImageUrl(selectedProduct.image)}
                  alt={selectedProduct.name}
                  style={zoomStyle}
                  onError={(e) => { e.target.src = FALLBACK_IMG; }}
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
                    <span className="sg-badge-category">🔶 BARFI</span>
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
                            <span className="sg-chip-price">₹{v.price}</span>
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
                    {selectedProduct.description || 'Authentic traditional barfi prepared using 100% pure khoya with no artificial flavours or preservatives.'}
                  </p>
                </div>

                <div className="sg-modal-trust-checklist">
                  <div className="sg-trust-check-item">✓ 100% Pure Khoya</div>
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

      <section className="sg-container" style={{ marginTop: '24px' }}>
        <div className="sg-section-heading-wrap sg-text-center">
          <span className="sg-sub-heading">Pure Cashew & Rich Khoya</span>
          <h1 className="sg-main-heading">🔶 Kaju Katli & Barfi Collection</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '6px' }}>
            Authentic melt-in-mouth Kaju Katli, Alwar Milk Cake & Khoya Barfis crafted with pure silver vark.
          </p>
        </div>
      </section>

      <section className="sg-products-section sg-container">
        {loading && products.length === 0 ? (
          <div className="sg-empty-loading-state"><div className="sg-spinner"></div><h3>🔶 Loading royal barfis...</h3></div>
        ) : (
          <div className="sg-modern-product-grid">
            {products.map((p) => {
              const variants = getProductVariants(p);
              const out = isOutOfStock(p);
              return (
                <div
                  className="sg-product-card"
                  key={p._id}
                  style={{ cursor: out ? 'not-allowed' : 'pointer' }}
                  onClick={() => handleOpenModal(p, variants[0])}
                >
                  {out && (
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
                    {out ? (
                      <span className="sg-badge-discount" style={{ background: '#dc2626', color: '#fff' }}>SOLD OUT</span>
                    ) : (
                      <span className="sg-badge-category-mini">🔶 BARFI</span>
                    )}
                    <button type="button" className={`sg-card-heart-btn ${isWishlisted(p._id) ? 'sg-is-liked' : ''}`} onClick={(e) => toggleWishlist(e, p._id)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={isWishlisted(p._id) ? '#ef4444' : 'none'} stroke={isWishlisted(p._id) ? '#ef4444' : '#64748b'} strokeWidth="2.2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </button>
                  </div>
                  <div
                    className="sg-card-media-box"
                    style={out ? { filter: 'blur(3px) grayscale(0.85)', opacity: 0.65 } : undefined}
                  >
                    <img src={getImageUrl(p.image)} alt={p.name} className="sg-card-product-img" onError={(e) => { e.target.src = FALLBACK_IMG; }} />
                  </div>
                  <div className="sg-card-body">
                    <h3 className="sg-card-title" style={out ? { opacity: 0.55 } : undefined}>{p.name}</h3>
                    <div className="sg-card-footer">
                      <div className="sg-card-price-group" style={out ? { opacity: 0.5 } : undefined}>
                        <span className="sg-current-price">₹{Math.round(p.price * 0.55)}</span>
                      </div>
                      <button
                        className="sg-btn-add-cart"
                        onClick={(e) => { e.stopPropagation(); handleProductAddToCart(p, 1, variants[0]); }}
                        disabled={out}
                        style={out ? { background: '#94a3b8', cursor: 'not-allowed', opacity: 0.9 } : undefined}
                      >
                        {out ? 'Out of Stock' : '+ ADD'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default BarfiPage;