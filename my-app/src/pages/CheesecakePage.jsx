// src/pages/CheesecakePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CakePage.css';

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://seedhegaonse-1.onrender.com/api');

const CheesecakePage = ({ addToCart }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 DIRECT BACKEND FETCH: Sirf 'cheesecake' category fetch hogi
  useEffect(() => {
    const fetchCheesecakes = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/cakes?category=cheesecake`);
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setProducts(data.filter(item => item.category?.toLowerCase().includes('cheesecake')));
        }
      } catch (err) {
        console.error("Cheesecakes fetch error:", err);
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

export default CheesecakePage;