import React, { useState } from 'react';
import './TopRatedProducts.css';

const products = [
  {
    id: 1,
    title: 'HISAR KA MALAI PEDA',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
    rating: 5,
    reviews: 2,
    price: '320.00',
    link: 'https://seedhegaonse.in/product/hisar-ka-malai-peda-by0TnK'
  },
  {
    id: 2,
    title: 'JIND KI DOODH BARFI',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80',
    rating: 5,
    reviews: 1,
    price: '360.00',
    link: '#'
  }
];

export default function TopRatedProducts() {
  const [sortValue, setSortValue] = useState('Latest');

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
          <span className="items-count">{products.length} Items found</span>

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
        <div className="products-grid">
          {products.map((item) => (
            <div key={item.id} className="product-card">
              {/* Product Image */}
              <div className="card-image-wrap">
                <img src={item.image} alt={item.title} />
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
      </div>

     
    </div>
  );
}