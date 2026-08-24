import React, { useState, useEffect } from 'react';
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

// 🟢 Helper to get Default Variants if not provided by backend
export const getProductVariants = (product) => {
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants;
  }
  const basePrice = Number(product.price) || 0;
  const baseMrp = Number(product.originalPrice) || Math.round(basePrice * 1.15);
  
  return [
    {
      _id: 'v-250',
      label: '250g',
      weight: '250g',
      price: Math.round(basePrice * 0.55),
      originalPrice: Math.round(baseMrp * 0.55),
      discount: product.discount || 0
    },
    {
      _id: 'v-500',
      label: '500g',
      weight: '500g',
      price: basePrice,
      originalPrice: baseMrp,
      discount: product.discount || 0
    },
    {
      _id: 'v-1000',
      label: '1kg',
      weight: '1kg',
      price: Math.round(basePrice * 1.9),
      originalPrice: Math.round(baseMrp * 1.9),
      discount: product.discount || 0
    }
  ];
};

// 🟢 Fallback Dummy Products
const DUMMY_PRODUCTS = [
  {
    _id: 'dummy-1',
    name: 'Pure Desi Ghee Motichoor Ladoo',
    category: 'ladoo',
    originRegion: 'Jodhpur',
    description: 'Melt-in-mouth tiny boondi pearls fried in 100% pure desi ghee & garnished with pistachios. Prepared fresh daily using traditional village methods.',
    price: 480,
    originalPrice: 550,
    discount: 12,
    offerText: 'Diwali Dhamaka',
    offerImage: '',
    image: dummy1,
    inStock: true
  },
  {
    _id: 'dummy-2',
    name: 'Traditional Mathura Peda',
    category: 'peda',
    originRegion: 'Mathura',
    description: 'Slow-roasted authentic khoya infused with aromatic cardamom and traditional flavours, sourced directly from the holy city of Mathura.',
    price: 520,
    originalPrice: 600,
    discount: 13,
    offerText: 'Special Deal',
    offerImage: '',
    image: dummy2,
    inStock: true
  },
  {
    _id: 'dummy-3',
    name: 'Royal Agra Kesar Angoori Petha',
    category: 'petha',
    originRegion: 'Agra',
    description: 'Juicy, soft, translucent sweet pumpkin bites infused with natural Kashmiri saffron and subtle rose water essence.',
    price: 360,
    originalPrice: 400,
    discount: 10,
    offerText: 'Fresh Stock',
    offerImage: '',
    image: dummy3,
    inStock: true
  },
  {
    _id: 'dummy-4',
    name: 'Diamond Silver Foil Kaju Katli',
    category: 'barfi',
    originRegion: 'Delhi NCR',
    description: 'Premium quality Goan cashews crafted with authentic edible pure silver vark and optimal sweetness for every festival.',
    price: 950,
    originalPrice: 1100,
    discount: 15,
    offerText: 'Best Seller',
    offerImage: '',
    image: dummy4,
    inStock: true
  },
  {
    _id: 'dummy-5',
    name: 'Jaipuri Malai Rabdi Ghewar',
    category: 'special',
    originRegion: 'Jaipur',
    description: 'Crispy honeycomb disc soaked in saffron sugar syrup and topped with rich, thick cardamom rabdi and roasted dry fruits.',
    price: 650,
    originalPrice: 750,
    discount: 13,
    offerText: 'Limited Batch',
    offerImage: '',
    image: dummy5,
    inStock: true
  },
  {
    _id: 'dummy-6',
    name: 'Alwar Famous Danedar Milk Cake',
    category: 'barfi',
    originRegion: 'Alwar',
    description: 'Rich, caramelized brown grainy milk fudge prepared from slow-simmered fresh whole buffalo milk with no additives.',
    price: 540,
    originalPrice: 600,
    discount: 10,
    offerText: '',
    offerImage: '',
    image: dummy6,
    inStock: true
  },
  {
    _id: 'dummy-7',
    name: 'Hisar ki Special Malai Peda',
    category: 'peda',
    originRegion: 'Hisar',
    description: 'Fresh cream & rich caramelized milk treat straight from Haryana’s renowned dairy heartland.',
    price: 540,
    originalPrice: 600,
    discount: 10,
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
const calculatePricing = (targetObj, qty = 1) => {
  const price = Number(targetObj?.price) || 0;
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

  const savings = mrp > price ? (mrp - price) * qty : 0;

  return {
    price: price * qty,
    mrp: mrp > price ? mrp * qty : null,
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

// 🟢 Card Image Slider
const CardImageSlider = ({ images, alt }) => {
  const [index, setIndex] = useState(0);
  const slides = images.length > 0 ? images : [FALLBACK_IMG];

  useEffect(() => {
    setIndex(0);
    if (slides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 2200);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <>
      <div
        className="card-slider-track"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((src, i) => (
          <div className="card-slider-slide" key={i}>
            <img
              src={src}
              alt={i === 0 ? alt : `${alt} offer`}
              className="card-product-img"
              loading="lazy"
              onError={(e) => { e.target.src = FALLBACK_IMG; }}
            />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="card-slider-dots">
          {slides.map((_, i) => (
            <span key={i} className={`card-slider-dot ${i === index ? 'active' : ''}`} />
          ))}
        </div>
      )}
    </>
  );
};

// 🟢 Modal Image Slider
const ModalImageSlider = ({ images, labels = [], alt, zoomStyle }) => {
  const [index, setIndex] = useState(0);
  const slides = images.length > 0 ? images : [FALLBACK_IMG];

  useEffect(() => {
    setIndex(0);
    if (slides.length <= 1) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 2600);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <>
      <div
        className="modal-slider-track"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((src, i) => (
          <div className="modal-slider-slide" key={i}>
            <img
              src={src}
              alt={i === 0 ? alt : `${alt} offer`}
              style={i === index ? zoomStyle : undefined}
              onError={(e) => { e.target.src = FALLBACK_IMG; }}
            />
            {labels[i] && (
              <span className="modal-slide-free-badge">{labels[i]}</span>
            )}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="modal-slider-dots">
          {slides.map((_, i) => (
            <span key={i} className={`modal-slider-dot ${i === index ? 'active' : ''}`} />
          ))}
        </div>
      )}
    </>
  );
};

// 🟢 INDIVIDUAL PRODUCT CARD COMPONENT (Shows All Variants Directly + Dynamic Price Below)
const ProductCard = ({ product, isWishlisted, toggleWishlist, onOpenModal, onAddToCart }) => {
  const variants = getProductVariants(product);
  const defaultVar = variants.find((v) => (v.weight || v.label || '').includes('500g')) || variants[0];
  const [selectedVariant, setSelectedVariant] = useState(defaultVar);

  const pricing = calculatePricing(selectedVariant, 1);
  const liked = isWishlisted(product._id);

  return (
    <div className="product-card" onClick={() => onOpenModal(product, selectedVariant)}>
      {/* TOP BADGE BAR */}
      <div className="card-top-bar">
        {pricing.discountPercent ? (
          <span className="badge-discount">{pricing.discountPercent}% OFF</span>
        ) : product.originRegion ? (
          <span className="badge-origin-mini">📍 {product.originRegion}</span>
        ) : (
          <span className="badge-category-mini">{product.category}</span>
        )}

        {/* LIKE BUTTON */}
        <button
          type="button"
          className={`card-heart-btn ${liked ? 'is-liked' : ''}`}
          onClick={(e) => toggleWishlist(e, product._id)}
          aria-label="Wishlist"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? '#ef4444' : 'none'} stroke={liked ? '#ef4444' : '#64748b'} strokeWidth="2.2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      {/* PRODUCT IMAGE + OFFER SLIDER */}
      <div className="card-media-box">
        <CardImageSlider
          images={
            product.offerImage
              ? [getImageUrl(product.image), getImageUrl(product.offerImage)]
              : [getImageUrl(product.image)]
          }
          alt={product.name}
        />
      </div>

      {/* OFFER / ORIGIN STRIP */}
      {product.offerText ? (
        <div className="card-offer-strip">
          <span>🏷️ {product.offerText}</span>
        </div>
      ) : (
        <div className="card-origin-strip">
          <span>📍 Handcrafted in {product.originRegion || 'Authentic Village'}</span>
        </div>
      )}

      {/* DETAILS BODY */}
      <div className="card-body">
        <h3 className="card-title" title={product.name}>
          {product.name}
        </h3>

        {/* 🟢 ALL VARIANTS DISPLAY (NO DROPDOWN - CLICKABLE CHIPS) */}
        <div className="card-variants-container" onClick={(e) => e.stopPropagation()}>
          <div className="variant-chips-list">
            {variants.map((v, idx) => {
              const isActive = (selectedVariant._id && v._id) ? selectedVariant._id === v._id : selectedVariant.label === v.label;
              return (
                <button
                  key={v._id || idx}
                  type="button"
                  className={`variant-pill-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedVariant(v)}
                >
                  {v.label || v.weight || 'Standard'}
                </button>
              );
            })}
          </div>
        </div>

        {/* PRICING & ACTION FOOTER (Directly Below Variants) */}
        <div className="card-footer">
          <div className="card-price-group">
            <div className="price-row">
              <span className="current-price">₹{pricing.price}</span>
              {pricing.mrp && <span className="mrp-price">₹{pricing.mrp}</span>}
            </div>
            {pricing.savings > 0 && (
              <span className="savings-tag">Save ₹{pricing.savings}</span>
            )}
          </div>

          <button
            className="btn-add-cart"
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
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

  // 🟢 Fetch Products & Merge with Dummy Products
  useEffect(() => {
    const fetchLiveProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();

        if (res.ok && Array.isArray(data) && data.length > 0) {
          // Backend products + Dummy products dono combine honge
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
    fetchBackendWishlist();
  }, []);

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  // Scroll Reveal Observer
  useEffect(() => {
    const revealElements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
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

  // SMART FILTER
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

  // ADD TO CART WITH SELECTED VARIANT
  const handleProductAddToCart = (p, qty = 1, variant = null) => {
    const token = getAuthToken();
    if (!token) {
      setAuthAlert('Please login first to add items to your cart!');
      setTimeout(() => setAuthAlert(''), 4000);
      return false;
    }

    const activeVariant = variant || (p.variants && p.variants[0]) || {
      weight: '500g',
      label: '500g',
      price: p.price
    };

    const variantPrice = Number(activeVariant.price || p.price);
    const variantLabel = activeVariant.label || activeVariant.weight || '500g';

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
      originRegion: p.originRegion
    });
    return true;
  };

  const faqList = [
    { q: 'How do you guarantee Same Day Delivery in Delhi NCR?', a: 'All orders placed before 4 PM in Delhi NCR are freshly prepared in the morning and dispatched via our express delivery partners.' },
    { q: 'Are preservatives or artificial flavours added?', a: 'No! Absolutely 0 preservatives and 0 artificial flavours. We prepare sweets daily using 100% pure Desi Ghee.' },
    { q: 'What is the shelf life of these traditional sweets?', a: 'Our sweets remain perfectly fresh for 7 to 10 days at room temperature, and up to 15 days if refrigerated.' }
  ];

  return (
    <div className="homepage-container">
      {/* FLOATING WHATSAPP BUTTON */}
      <a
        href="https://wa.me/919315911105"
        className="whatsapp-button pulse-anim"
        target="_blank"
        rel="noreferrer"
        title="Chat on WhatsApp"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.762.459 3.48 1.333 5.001L2 22l5.122-1.343c1.468.802 3.123 1.225 4.887 1.226 5.507 0 9.989-4.478 9.99-9.985 0-5.507-4.482-9.998-9.987-9.998zm5.83 14.364c-.244.685-1.41 1.309-1.974 1.393-.505.075-1.144.106-1.844-.117-.424-.135-.97-.315-1.67-.616-2.937-1.268-4.854-4.258-5.001-4.453-.146-.195-1.195-1.591-1.195-3.033 0-1.441.758-2.151 1.026-2.443.268-.293.585-.366.78-.366.195 0 .39.002.561.01.18.008.421-.068.66.505.244.585.833 2.03.906 2.176.073.146.122.317.024.512-.098.195-.146.317-.293.488-.146.171-.307.382-.439.513-.146.146-.298.305-.128.597.171.293.758 1.252 1.626 2.025 1.118.995 2.062 1.304 2.355 1.45.293.146.463.122.634-.073.171-.195.732-.853.927-1.146.195-.293.39-.244.659-.146.268.098 1.708.805 2.001.951.293.146.488.22.561.341.073.122.073.71-.171 1.395z"/>
        </svg>
      </a>

      {/* AUTH REQUIRED ALERT */}
      {authAlert && (
        <div className="cart-toast fade-slide-up" style={{ background: '#dc2626' }}>
          <span>⚠️ {authAlert}</span>
          <button onClick={() => navigate('/auth')} className="toast-login-btn">Login Now</button>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {addedToast && !authAlert && (
        <div className="cart-toast fade-slide-up">
          ✓ <strong>{addedToast}</strong> added to cart
        </div>
      )}

      {/* PRODUCT DETAILS MODAL (QUICK VIEW) */}
      {selectedProduct && (() => {
        const modalVariants = getProductVariants(selectedProduct);
        const currentActiveVariant = selectedModalVariant || modalVariants[0];
        const pricing = calculatePricing(currentActiveVariant, modalQty);

        return (
          <div className="product-modal-backdrop" onClick={() => setSelectedProduct(null)}>
            <div className="product-modal-card" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setSelectedProduct(null)} aria-label="Close">✕</button>

              {/* Left Column: Image with Zoom */}
              <div className="modal-image-col" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                <ModalImageSlider
                  images={
                    selectedProduct.offerImage
                      ? [getImageUrl(selectedProduct.image), getImageUrl(selectedProduct.offerImage)]
                      : [getImageUrl(selectedProduct.image)]
                  }
                  labels={selectedProduct.offerImage ? [null, selectedProduct.offerText || 'FREE'] : [null]}
                  alt={selectedProduct.name}
                  zoomStyle={zoomStyle}
                />
              </div>

              {/* Right Column: Information & Actions */}
              <div className="modal-info-col">
                <div>
                  <div className="modal-tags-row">
                    {selectedProduct.originRegion && (
                      <span className="badge-origin">📍 {selectedProduct.originRegion} Special</span>
                    )}
                    {selectedProduct.category && (
                      <span className="badge-category">{selectedProduct.category.toUpperCase()}</span>
                    )}
                  </div>

                  <h3 className="modal-title">{selectedProduct.name}</h3>

                  {/* 🟢 ALL VARIANTS DISPLAY IN MODAL (NO DROPDOWN - DIRECT CHIPS) */}
                  <div className="modal-variant-section">
                    <span className="variant-section-title">Select Pack Size / Weight:</span>
                    <div className="modal-variant-chips">
                      {modalVariants.map((v, idx) => {
                        const isActive = currentActiveVariant?.label === v.label || currentActiveVariant?.weight === v.weight;
                        return (
                          <button
                            key={v._id || idx}
                            type="button"
                            className={`modal-chip-btn ${isActive ? 'active' : ''}`}
                            onClick={() => setSelectedModalVariant(v)}
                          >
                            <span className="chip-label">{v.label || v.weight}</span>
                            <span className="chip-price">₹{v.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pricing Box (Directly Below Variants) */}
                  <div className="modal-price-box">
                    <div className="modal-price-numbers">
                      <span className="modal-current-price">₹{pricing.price}</span>
                      {pricing.mrp && <span className="modal-mrp-price">₹{pricing.mrp}</span>}
                    </div>
                    {pricing.discountPercent && (
                      <span className="modal-discount-pill">{pricing.discountPercent}% OFF</span>
                    )}
                  </div>

                  {/* Offer Banner if available */}
                  {selectedProduct.offerText && (
                    <div className="modal-offer-banner">
                      <span>🏷️ <strong>Offer:</strong> {selectedProduct.offerText}</span>
                    </div>
                  )}

                  <p className="modal-desc">
                    {selectedProduct.description || 'Authentic traditional recipe prepared using 100% pure desi ghee with no artificial flavours or preservatives.'}
                  </p>

                  {/* Quantity Stepper */}
                  <div className="modal-qty-row">
                    <span className="qty-label">Quantity:</span>
                    <div className="stepper-box">
                      <button type="button" className="stepper-btn" onClick={() => setModalQty((prev) => Math.max(1, prev - 1))} disabled={modalQty <= 1}>−</button>
                      <span className="stepper-val">{modalQty}</span>
                      <button type="button" className="stepper-btn" onClick={() => setModalQty((prev) => prev + 1)}>+</button>
                    </div>
                  </div>
                </div>

                {/* Modal Buttons */}
                <div className="modal-actions-row">
                  <button
                    className="btn-modal-add"
                    onClick={() => {
                      const added = handleProductAddToCart(selectedProduct, modalQty, currentActiveVariant);
                      if (added) setSelectedProduct(null);
                    }}
                    disabled={selectedProduct.inStock === false}
                  >
                    {selectedProduct.inStock === false ? 'Out of Stock' : `Add ${modalQty} to Cart • ₹${pricing.price}`}
                  </button>

                  <button
                    className="btn-modal-wishlist"
                    onClick={(e) => toggleWishlist(e, selectedProduct._id)}
                    title="Wishlist"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill={isWishlisted(selectedProduct._id) ? '#ef4444' : 'none'} stroke={isWishlisted(selectedProduct._id) ? '#ef4444' : '#64748b'} strokeWidth="2.2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* HERO SLIDER SECTION */}
      <section className="hero-slider-section">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-slide ${index === currentSlide ? 'active-slide' : ''}`}
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(7, 35, 27, 0.82) 0%, rgba(13, 59, 46, 0.65) 100%), url(${slide.image})`
            }}
          />
        ))}

        <div className="slider-dots">
          {heroSlides.map((_, idx) => (
            <span
              key={idx}
              className={`dot ${idx === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(idx)}
            />
          ))}
        </div>
      </section>

      {/* MAIN PRODUCTS SECTION */}
      <section id="products" className="products-section container reveal">
        <div className="section-heading-wrap">
          <div>
            <span className="sub-heading">Fresh & Authentic</span>
            <h2 className="main-heading">Village Special Sweets</h2>
          </div>

          {/* FILTER TABS */}
          <div className="tab-filters">
            <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
              🍬 All Sweets ({products.length})
            </button>
            <button className={`tab-btn ${activeTab === 'ladoo' ? 'active' : ''}`} onClick={() => setActiveTab('ladoo')}>
              🟡 Laddu
            </button>
            <button className={`tab-btn ${activeTab === 'peda' ? 'active' : ''}`} onClick={() => setActiveTab('peda')}>
              🟤 Peda
            </button>
            <button className={`tab-btn ${activeTab === 'petha' ? 'active' : ''}`} onClick={() => setActiveTab('petha')}>
              ⚪ Petha
            </button>
            <button className={`tab-btn ${activeTab === 'halwa' ? 'active' : ''}`} onClick={() => setActiveTab('halwa')}>
              🥣 Halwa
            </button>
            <button className={`tab-btn ${activeTab === 'barfi' ? 'active' : ''}`} onClick={() => setActiveTab('barfi')}>
              🔶 Barfi & Katli
            </button>
            <button className={`tab-btn ${activeTab === 'special' ? 'active' : ''}`} onClick={() => setActiveTab('special')}>
              ⭐ Specials
            </button>
            <button className={`tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`} onClick={() => setActiveTab('wishlist')}>
              ❤️ Wishlist ({wishlist.length})
            </button>
          </div>
        </div>

        {/* PRODUCTS GRID */}
        {loading && products.length === 0 ? (
          <div className="empty-loading-state">
            <div className="spinner"></div>
            <h3>🍬 Loading authentic village sweets...</h3>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-category-card">
            <h3>{activeTab === 'wishlist' ? 'Your Wishlist is Empty!' : 'No sweets found in this category!'}</h3>
            <button className="primary-btn" onClick={() => setActiveTab('all')} style={{ marginTop: '12px' }}>
              Explore All Sweets
            </button>
          </div>
        ) : (
          <div className="modern-product-grid">
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
        <section className="gallery-slider-section reveal">
          <div className="section-heading-wrap text-center container" style={{ marginBottom: '18px' }}>
            <span className="sub-heading">Handpicked For You</span>
            <h2 className="main-heading">A Glimpse Of Our Sweets</h2>
          </div>

          <div className="gallery-slider-viewport">
            <div className="gallery-slider-track">
              {[...products, ...products].map((p, idx) => (
                <div className="gallery-slide-item" key={`gallery-${p._id}-${idx}`}>
                  <img
                    src={getImageUrl(p.image)}
                    alt={p.name}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop';
                    }}
                  />
                  <span className="gallery-slide-caption">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ SECTION */}
      <section className="faq-section container reveal">
        <div className="section-heading-wrap text-center">
          <span className="sub-heading">Got Questions?</span>
          <h2 className="main-heading">Frequently Asked Questions</h2>
        </div>

        <div className="faq-accordion">
          {faqList.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  className="faq-question"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                >
                  <h4>{faq.q}</h4>
                  <span className="faq-toggle-icon">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="faq-answer-content">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Homepage;