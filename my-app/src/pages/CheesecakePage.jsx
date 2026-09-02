// src/pages/CheesecakePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CakePage.css';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const SERVER_HOST = API_BASE.replace('/api', '');

// 🟢 ADDED: Baaki pages jaisa hi image URL resolver — agar backend sirf
// relative path bheje (jaise "/uploads/x.png") toh usse pura server URL
// bana deta hai. Full http(s) URL ho toh waisa hi rehne deta hai.
const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=600&auto=format&fit=crop';
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

// 🟢 ADDED: image load fail hone par (broken URL / server down) dikhne
// wala fallback — taaki blank/broken icon kabhi na dikhe
const FALLBACK_CHEESECAKE_IMG = 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=600&auto=format&fit=crop';

const CheesecakePage = ({ addToCart }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 DIRECT BACKEND FETCH: Sirf 'cheesecake' category fetch hogi —
  // koi dummy/fallback product list nahi hai, sirf REAL API data.
  useEffect(() => {
    const fetchCheesecakes = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/cakes?category=cheesecake`);
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setProducts(data.filter(item => item.category?.toLowerCase().includes('cheesecake')));
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Cheesecakes fetch error:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCheesecakes();
  }, []);

  return (
    <div className="ck-homepage-container">
      <div style={{ background: '#78350f', color: '#fff', padding: '35px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', margin: '0 0 8px', color: '#fde047' }}>🧀 Gourmet Cheesecakes</h1>
        <p style={{ margin: 0, color: '#fef08a', fontSize: '14px' }}>New York Baked & Chilled Blueberry Compote Cheesecakes</p>
      </div>

      <div className="ck-container">
       

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>🧀 Loading Cheesecakes...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', background: '#fff', borderRadius: '12px' }}>
            <h3>No Cheesecakes Available Right Now</h3>
          </div>
        ) : (
          <div className="ck-modern-product-grid">
            {products.map((cake) => (
              <div key={cake._id} className="ck-product-card">
                <div className="ck-card-media-box">
                  <img
                    src={getImageUrl(cake.image)}
                    alt={cake.name}
                    className="ck-card-product-img"
                    onError={(e) => { e.target.src = FALLBACK_CHEESECAKE_IMG; }}
                  />
                </div>
                <div className="ck-card-body">
                  <h3 className="ck-card-title">{cake.name}</h3>
                  <div className="ck-card-footer">
                    <span className="ck-current-price">₹{cake.price}</span>
                    <button 
                      className="ck-btn-add-cart" 
                      onClick={() => addToCart && addToCart({ ...cake, unitPrice: cake.price, quantity: 1 })}
                    >
                      + ADD
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheesecakePage;