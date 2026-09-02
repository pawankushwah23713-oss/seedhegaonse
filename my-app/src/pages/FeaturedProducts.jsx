import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './FeaturedProducts.css';

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
  const reviewsCount = Number(p.reviewsCount ?? p.numReviews ?? (Array.isArray(p.reviews) ? p.reviews.length : 0)) || 0;
  const price = Number(p.price) || 0;
  const createdAt = p.createdAt ? new Date(p.createdAt).getTime() : 0;

  return {
    id: p._id,
    name: String(p.name || 'Store Item').toUpperCase(),
    image: getImageUrl(p.image),
    rating: rating > 0 ? Math.min(5, Math.round(rating)) : 5, // fallback to 5 stars if backend has no rating yet
    reviewsCount,
    price,
    createdAt,
    isFeatured: Boolean(p.isFeatured || p.featured),
    slug: p.slug || p._id
  };
};

const FeaturedProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('Latest');

  // 🟢 Fetch real products & cakes from backend, keep only featured ones
  useEffect(() => {
    let cancelled = false;

    const fetchFeatured = async () => {
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

        // 🟢 "Featured" = items explicitly flagged by backend (isFeatured/featured).
        // Falls back to showing everything if nothing is flagged yet, so the
        // page never looks broken/empty on a fresh store.
        const featured = normalized.filter((p) => p.isFeatured);
        setProducts(featured.length > 0 ? featured : normalized);
      } catch (err) {
        if (!cancelled) {
          console.error('Unable to load featured products:', err);
          setError('Unable to load products right now. Please try again shortly.');
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFeatured();
    return () => { cancelled = true; };
  }, []);

  // 🟢 Sorting actually works now, based on the selected dropdown option
  const sortedProducts = useMemo(() => {
    const list = [...products];
    switch (sortBy) {
      case 'PriceLowHigh':
        return list.sort((a, b) => a.price - b.price);
      case 'PriceHighLow':
        return list.sort((a, b) => b.price - a.price);
      case 'Popularity':
        return list.sort((a, b) => (b.reviewsCount - a.reviewsCount) || (b.rating - a.rating));
      case 'Latest':
      default:
        return list.sort((a, b) => b.createdAt - a.createdAt);
    }
  }, [products, sortBy]);

  return (
    <div className="products-page">
      {/* Header Banner */}
      <header className="page-header-banner">
        <div className="banner-inner">
          <h1>Featured Products</h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="catalog-container">
        {/* Filter / Sort Top Bar */}
        <div className="catalog-toolbar">
          <span className="items-count">
            {loading ? 'Loading...' : `${sortedProducts.length} Items found`}
          </span>
          <div className="sort-wrapper">
            <label htmlFor="sort-select" className="sort-label">
              Sort by
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-dropdown"
            >
              <option value="Latest">Latest</option>
              <option value="PriceLowHigh">Price: Low to High</option>
              <option value="PriceHighLow">Price: High to Low</option>
              <option value="Popularity">Popularity</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            ⭐ Loading featured products...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#dc2626', fontWeight: 600 }}>
            {error}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            No featured products available right now.
          </div>
        ) : (
          <div className="product-grid">
            {sortedProducts.map((product) => (
              <div
                key={product.id}
                className="product-card"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/product/${product.slug}`)}
              >
                {/* Product Image */}
                <div className="product-image-box">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="product-img"
                    loading="lazy"
                    onError={(e) => { e.target.src = FALLBACK_IMG; }}
                  />
                </div>

                {/* Product Info */}
                <div className="product-details">
                  <h3 className="product-title" title={product.name}>
                    {product.name}
                  </h3>

                  {/* Rating */}
                  <div className="product-rating">
                    <span className="stars">
                      {'★'.repeat(product.rating)}{'☆'.repeat(5 - product.rating)}
                    </span>
                    <span className="reviews-count">({product.reviewsCount})</span>
                  </div>

                  {/* Price */}
                  <div className="product-price">
                    ₹{product.price.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FeaturedProducts;