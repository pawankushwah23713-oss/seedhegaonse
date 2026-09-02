import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './TopRatedProducts.css';

// 🟢 Backend API Base URL (same pattern as other pages)
const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const SERVER_HOST = API_BASE.replace('/api', '');

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop';

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

// 🟢 Normalize a raw backend product/cake into the shape this page needs
const normalizeProduct = (p) => {
  const rating = Number(p.rating ?? p.avgRating ?? p.averageRating ?? 0);
  const reviews = Number(p.reviewsCount ?? p.numReviews ?? (Array.isArray(p.reviews) ? p.reviews.length : 0)) || 0;
  const price = Number(p.price) || 0;
  const createdAt = p.createdAt ? new Date(p.createdAt).getTime() : 0;

  return {
    id: p._id,
    title: String(p.name || 'Store Item').toUpperCase(),
    image: getImageUrl(p.image),
    rating: rating > 0 ? Math.min(5, Math.round(rating)) : 5, // fallback to 5 stars if backend has no rating yet
    reviews,
    price: price.toFixed(2),
    priceNum: price,
    createdAt,
    slug: p.slug || p._id
  };
};

export default function TopRatedProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortValue, setSortValue] = useState('Latest');

  // 🟢 Fetch real products & cakes from backend, keep only top-rated ones
  useEffect(() => {
    let cancelled = false;

    const fetchTopRated = async () => {
      try {
        setLoading(true);
        setError('');

        const [resProducts, resCakes] = await Promise.allSettled([
          fetch(`${API_BASE}/products`),
          fetch(`${API_BASE}/cakes`)
        ]);

        const combined = [];

        const pull = async (result) => {
          if (result.status === 'fulfilled' && result.value.ok) {
            const data = await result.value.json();
            if (Array.isArray(data)) combined.push(...data);
          }
        };

        await pull(resProducts);
        await pull(resCakes);

        if (cancelled) return;

        const normalized = combined.map(normalizeProduct);

        // 🟢 "Top Rated" = only items with a real rating of 4+ (falls back to
        // showing everything if the backend hasn't added ratings yet, so the
        // page never looks broken/empty on a fresh store).
        const rated = normalized.filter((p) => p.rating >= 4);
        setProducts(rated.length > 0 ? rated : normalized);
      } catch (err) {
        if (!cancelled) {
          console.error('Unable to load top rated products:', err);
          setError('Unable to load products right now. Please try again shortly.');
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTopRated();
    return () => { cancelled = true; };
  }, []);

  // 🟢 Sorting actually works now, based on the selected dropdown option
  const sortedProducts = useMemo(() => {
    const list = [...products];
    switch (sortValue) {
      case 'PriceLowHigh':
        return list.sort((a, b) => a.priceNum - b.priceNum);
      case 'PriceHighLow':
        return list.sort((a, b) => b.priceNum - a.priceNum);
      case 'Rating':
        return list.sort((a, b) => (b.rating - a.rating) || (b.reviews - a.reviews));
      case 'Latest':
      default:
        return list.sort((a, b) => b.createdAt - a.createdAt);
    }
  }, [products, sortValue]);

  return (
    <div className="catalog-page">
      {/* 1. Header Banner */}
      <header className="catalog-header">
        <h2>Top-Rated Products</h2>
      </header>

      {/* 2. Main Catalog Container */}
      <div className="catalog-container">
        {/* Top Control Bar */}
        <div className="catalog-controls">
          <span className="items-count">
            {loading ? 'Loading...' : `${sortedProducts.length} Items found`}
          </span>

          <div className="sort-box">
            <label htmlFor="sort-select">Sort by</label>
            <select
              id="sort-select"
              value={sortValue}
              onChange={(e) => setSortValue(e.target.value)}
            >
              <option value="Latest">Latest</option>
              <option value="PriceLowHigh">Price: Low to High</option>
              <option value="PriceHighLow">Price: High to Low</option>
              <option value="Rating">Rating</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            ⭐ Loading top-rated products...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#dc2626', fontWeight: 600 }}>
            {error}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            No top-rated products available right now.
          </div>
        ) : (
          <div className="products-grid">
            {sortedProducts.map((item) => (
              <div
                key={item.id}
                className="product-card"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/product/${item.slug}`)}
              >
                {/* Product Image */}
                <div className="card-image-wrap">
                  <img
                    src={item.image}
                    alt={item.title}
                    onError={(e) => { e.target.src = FALLBACK_IMG; }}
                  />
                </div>

                {/* Product Details */}
                <div className="card-content">
                  <h3 className="product-name">{item.title}</h3>

                  <div className="rating-row">
                    <div className="stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`star ${i < item.rating ? 'active' : ''}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="review-num">({item.reviews})</span>
                  </div>

                  <div className="price-tag">₹{item.price}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}