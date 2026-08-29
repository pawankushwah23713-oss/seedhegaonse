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
                <div className="sg-product-card" key={p._id}>
                  <div className="sg-card-top-bar">
                    <span className="sg-badge-category-mini">🔶 BARFI</span>
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
                      <button className="sg-btn-add-cart" onClick={() => handleProductAddToCart(p, 1, variants[0])} disabled={out}>
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