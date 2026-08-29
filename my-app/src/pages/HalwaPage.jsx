import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Homepage.css';
import dummy5 from '../assets/dumy5.png';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const SERVER_HOST = API_BASE.replace('/api', '');

const isDummyProduct = (product) => Boolean(product?.isDummy || product?._id?.toString().startsWith('dummy'));

export const isHalwaProduct = (p) => {
  if (!p) return false;
  const category = (p.category || '').toLowerCase();
  const name = (p.name || '').toLowerCase();
  const combined = `${category} ${name}`;
  return (
    category === 'halwa' ||
    combined.includes('halwa') ||
    combined.includes('sohan') ||
    combined.includes('karachi') ||
    combined.includes('moong dal') ||
    combined.includes('gajar halwa')
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

const DUMMY_HALWAS = [
  {
    _id: 'dummy-halwa-1',
    isDummy: true,
    name: 'Pure Desi Ghee Moong Dal Halwa',
    category: 'halwa',
    originRegion: 'Rajasthan',
    description: 'Slow-roasted yellow lentils cooked in 100% pure cow ghee with rich saffron, mawa, cashew & almond flakes.',
    price: 490,
    originalPrice: 490,
    discount: 0,
    offerText: '',
    offerImage: '',
    image: dummy5,
    inStock: true
  },
  {
    _id: 'dummy-halwa-2',
    isDummy: true,
    name: 'Old Delhi Famous Royal Sohan Halwa',
    category: 'halwa',
    originRegion: 'Old Delhi',
    description: 'Crisp, dense, golden caramelized wheat germ sweet disc topped with premium pistachios and walnuts.',
    price: 540,
    originalPrice: 540,
    discount: 0,
    offerText: '',
    offerImage: '',
    image: dummy5,
    inStock: true
  },
  {
    _id: 'dummy-halwa-3',
    isDummy: true,
    name: 'Bombay Karachi Bombay Halwa (Dry Fruit)',
    category: 'halwa',
    originRegion: 'Mumbai',
    description: 'Chewy, colorful, glossy ghee-rich cornstarch treat loaded with crunchy melon seeds, cashews and cardamom.',
    price: 420,
    originalPrice: 420,
    discount: 0,
    offerText: '',
    offerImage: '',
    image: dummy5,
    inStock: true
  }
];

const getAuthToken = () => {
  try {
    const directToken = localStorage.getItem('token') || localStorage.getItem('userToken') || localStorage.getItem('authToken');
    if (directToken) return directToken;
    const userObj = localStorage.getItem('user');
    if (userObj) return JSON.parse(userObj).token || null;
  } catch (err) {}
  return null;
};

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

const HalwaPage = ({ addToCart, addedToast }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState(loadWishlist);
  const [authAlert, setAuthAlert] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedModalVariant, setSelectedModalVariant] = useState(null);
  const [modalQty, setModalQty] = useState(1);

  useEffect(() => {
    const fetchLiveHalwas = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();
        if (res.ok && Array.isArray(data) && data.length > 0) {
          const halwaItems = data.filter(isHalwaProduct);
          const apiIds = new Set(halwaItems.map((p) => p._id?.toString()));
          const nonDup = DUMMY_HALWAS.filter((d) => !apiIds.has(d._id?.toString()));
          setProducts([...halwaItems, ...nonDup]);
        } else {
          setProducts(DUMMY_HALWAS);
        }
      } catch (err) {
        setProducts(DUMMY_HALWAS);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveHalwas();
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
      
      <section className="sg-container" style={{ marginTop: '24px' }}>
        <div className="sg-section-heading-wrap sg-text-center">
          <span className="sg-sub-heading">Slow Cooked in Pure Ghee</span>
          <h1 className="sg-main-heading">🥣 Desi Ghee Halwa Collection</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '6px' }}>
            Rich aromatic Moong Dal, Sohan & Karachi Halwa slow-simmered with nuts & pure cow ghee.
          </p>
        </div>
      </section>

      <section className="sg-products-section sg-container">
        {loading && products.length === 0 ? (
          <div className="sg-empty-loading-state"><div className="sg-spinner"></div><h3>🥣 Loading fresh halwas...</h3></div>
        ) : (
          <div className="sg-modern-product-grid">
            {products.map((p) => {
              const variants = getProductVariants(p);
              const out = isOutOfStock(p);
              return (
                <div className="sg-product-card" key={p._id} onClick={() => { setSelectedProduct(p); setSelectedModalVariant(variants[0]); setModalQty(1); }}>
                  <div className="sg-card-top-bar">
                    <span className="sg-badge-category-mini">🥣 HALWA</span>
                    <button type="button" className={`sg-card-heart-btn ${isWishlisted(p._id) ? 'sg-is-liked' : ''}`} onClick={(e) => toggleWishlist(e, p._id)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={isWishlisted(p._id) ? '#ef4444' : 'none'} stroke={isWishlisted(p._id) ? '#ef4444' : '#64748b'} strokeWidth="2.2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </button>
                  </div>
                  <div className="sg-card-media-box">
                    <img src={getImageUrl(p.image)} alt={p.name} className="sg-card-product-img" onError={(e) => { e.target.src = FALLBACK_IMG; }} />
                  </div>
                  <div className="sg-card-body">
                    <h3 className="sg-card-title">{p.name}</h3>
                    <div className="sg-card-footer">
                      <div className="sg-card-price-group">
                        <span className="sg-current-price">₹{Math.round(p.price * 0.55)}</span>
                      </div>
                      <button className="sg-btn-add-cart" onClick={(e) => { e.stopPropagation(); handleProductAddToCart(p, 1, variants[0]); }} disabled={out}>
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

export default HalwaPage;