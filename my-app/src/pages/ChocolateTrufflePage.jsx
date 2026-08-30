// src/pages/ChocolateTrufflePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CakePage.css';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const SERVER_HOST = API_BASE.replace('/api', '');
const WISHLIST_KEY = 'seedhegaonse_wishlist';
const FALLBACK_CAKE_IMG = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop';

const isDummyProduct = (product) => Boolean(product?.isDummy || product?._id?.toString().startsWith('dummy'));
const isOutOfStock = (product) => product?.inStock === false;

// 🟢 Same variant logic as CakePage
const getProductVariants = (product) => {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants;
  }
  const isDummy = isDummyProduct(product);
  const basePrice = Number(product.price) || 0;
  const hasDiscount = !isDummy && (Number(product.originalPrice) > basePrice || Number(product.discountPercent) > 0);
  const baseMrp = Number(product.originalPrice) || basePrice;
  const discountVal = isDummy ? 0 : (Number(product.discountPercent) || 0);

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

const getAuthToken = () => {
  try {
    const directToken = localStorage.getItem('token') ||
                        localStorage.getItem('userToken') ||
                        localStorage.getItem('authToken');
    if (directToken) return directToken;
    const userObj = localStorage.getItem('user');
    if (userObj) return JSON.parse(userObj).token || null;
  } catch (err) {}
  return null;
};

const ChocolateTrufflePage = ({ addToCart, addedToast }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState(loadWishlist);
  const [authAlert, setAuthAlert] = useState('');

  // 🟢 QUICK VIEW MODAL STATE (same as CakePage)
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

  const closeModal = () => setSelectedProduct(null);

  // 🟢 Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = selectedProduct ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedProduct]);

  // 🟢 Close modal on ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 🟢 DIRECT BACKEND FETCH: Sirf 'chocolate' category ka data aayega
  useEffect(() => {
    const fetchChocolateCakes = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/cakes?category=chocolate`);
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          // Strict check: sirf chocolate wale hi state me rahenge
          setProducts(data.filter(item => item.category?.toLowerCase().includes('chocolate')));
        }
      } catch (err) {
        console.error("Chocolate cakes fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChocolateCakes();
  }, []);

  const isWishlisted = (id) => wishlist.some((w) => w?.toString() === id?.toString());

  const toggleWishlist = (e, id) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!id) return;
    const pId = id.toString();
    setWishlist((prev) => {
      const updated = prev.includes(pId) ? prev.filter((i) => i !== pId) : [...prev, pId];
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
      return updated;
    });

    const token = getAuthToken();
    const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(pId);
    if (token && isValidMongoId) {
      fetch(`${API_BASE}/wishlist/toggle/${pId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }).catch((err) => console.warn('Backend wishlist sync failed:', err));
    }
  };

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
        originRegion: p.originRegion || 'Fresh Bakehouse'
      });
    }
    return true;
  };

  return (
    <div className="ck-homepage-container">
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

      {/* 🟢 QUICK VIEW MODAL (same structure/classes as CakePage) */}
      {selectedProduct && (() => {
        const isDummy = isDummyProduct(selectedProduct);
        const modalOutOfStock = isOutOfStock(selectedProduct);
        const modalVariants = getProductVariants(selectedProduct);
        const currentActiveVariant = selectedModalVariant || modalVariants[0];
        const pricing = calculatePricing(currentActiveVariant, modalQty, isDummy);

        return (
          <div className="ck-product-modal-backdrop" onClick={closeModal}>
            <div className="ck-product-modal-card" onClick={(e) => e.stopPropagation()}>
              <button className="ck-modal-close-btn" onClick={closeModal} aria-label="Close">✕</button>

              <div
                className="ck-modal-image-col"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={modalOutOfStock ? { filter: 'blur(4px) grayscale(0.85)', opacity: 0.7 } : undefined}
              >
                <img
                  src={getImageUrl(selectedProduct.image)}
                  alt={selectedProduct.name}
                  style={zoomStyle}
                  onError={(e) => { e.target.src = FALLBACK_CAKE_IMG; }}
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
                    <span className="ck-badge-category">🍫 CHOCOLATE</span>
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
                      if (added) closeModal();
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

      {/* Category Hero Banner */}
      <div style={{ background: '#2b1410', color: '#fff', padding: '35px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', margin: '0 0 8px', color: '#f59e0b' }}>🍫 Chocolate Truffle Cakes</h1>
        <p style={{ margin: 0, color: '#fed7aa', fontSize: '14px' }}>Rich Belgian Ganache, Moist Dark Sponge & Chocolate Fudge</p>
      </div>

      <div className="ck-container">
        {/* Products Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>🍫 Loading Chocolate Cakes from Bakery...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', background: '#fff', borderRadius: '12px' }}>
            <h3>No Chocolate Cakes Available Right Now</h3>
          </div>
        ) : (
          <div className="ck-modern-product-grid">
            {products.map((cake) => {
              const variants = getProductVariants(cake);
              const out = isOutOfStock(cake);
              return (
                <div
                  key={cake._id}
                  className="ck-product-card"
                  style={{ position: 'relative', cursor: out ? 'not-allowed' : 'pointer' }}
                  onClick={() => handleOpenModal(cake, variants[0])}
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
                      ⛔ SOLD OUT
                    </div>
                  )}

                  <div className="ck-card-top-bar" style={{ position: 'relative', zIndex: 6 }}>
                    {out ? (
                      <span className="ck-badge-discount" style={{ background: '#dc2626', color: '#fff' }}>SOLD OUT</span>
                    ) : (
                      <span className="ck-badge-category-mini">🍫 CHOCOLATE</span>
                    )}
                    <button
                      type="button"
                      className={`ck-card-heart-btn ${isWishlisted(cake._id) ? 'ck-is-liked' : ''}`}
                      onClick={(e) => toggleWishlist(e, cake._id)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={isWishlisted(cake._id) ? '#e11d48' : 'none'} stroke={isWishlisted(cake._id) ? '#e11d48' : '#64748b'} strokeWidth="2.2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </button>
                  </div>

                  <div
                    className="ck-card-media-box"
                    style={out ? { filter: 'blur(3px) grayscale(0.85)', opacity: 0.65 } : undefined}
                  >
                    <img
                      src={getImageUrl(cake.image)}
                      alt={cake.name}
                      className="ck-card-product-img"
                      onError={(e) => { e.target.src = FALLBACK_CAKE_IMG; }}
                    />
                  </div>
                  <div className="ck-card-body">
                    <h3 className="ck-card-title" style={out ? { opacity: 0.55 } : undefined}>{cake.name}</h3>
                    <div className="ck-card-footer">
                      <span className="ck-current-price" style={out ? { opacity: 0.5 } : undefined}>₹{cake.price}</span>
                      <button
                        className="ck-btn-add-cart"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCakeAddToCart(cake, 1, variants[0]);
                        }}
                        disabled={out}
                        style={out ? { background: '#94a3b8', cursor: 'not-allowed', opacity: 0.9 } : undefined}
                      >
                        {out ? 'Sold Out' : '+ ADD'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChocolateTrufflePage;