// src/pages/ChocolateTrufflePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CakePage.css';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const ChocolateTrufflePage = ({ addToCart }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="ck-homepage-container">
      {/* Category Hero Banner */}
      <div style={{ background: '#2b1410', color: '#fff', padding: '35px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', margin: '0 0 8px', color: '#f59e0b' }}>🍫 Chocolate Truffle Cakes</h1>
        <p style={{ margin: 0, color: '#fed7aa', fontSize: '14px' }}>Rich Belgian Ganache, Moist Dark Sponge & Chocolate Fudge</p>
      </div>

      <div className="ck-container">
        {/* Navigation Tabs */}
        

        {/* Products Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>🍫 Loading Chocolate Cakes from Bakery...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', background: '#fff', borderRadius: '12px' }}>
            <h3>No Chocolate Cakes Available Right Now</h3>
          </div>
        ) : (
          <div className="ck-modern-product-grid">
            {products.map((cake) => (
              <div key={cake._id} className="ck-product-card">
                <div className="ck-card-media-box">
                  <img src={cake.image} alt={cake.name} className="ck-card-product-img" />
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

export default ChocolateTrufflePage;