import React, { useState } from 'react';
import './ProductList.css';

const productsData = [
  {
    id: 1,
    title: 'HISAR KA MALAI PEDA',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
    rating: 5,
    reviews: 2,
    price: 320.00,
  },
  {
    id: 2,
    title: 'JIND KI DOODH BARFI',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80',
    rating: 5,
    reviews: 1,
    price: 360.00,
  },
];

export default function ProductList() {
  const [sortBy, setSortBy] = useState('Latest');

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`star ${index < rating ? 'filled' : 'empty'}`}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="catalog-wrapper">
      {/* Top Banner Header */}
      <header className="catalog-header">
        <div className="header-container">
          <h1 className="header-title">Top-Rated Products</h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="catalog-container">
        {/* Filter / Sort Controls Bar */}
        <div className="controls-bar">
          <span className="items-count">{productsData.length} Items found</span>

          <div className="sort-wrapper">
            <label htmlFor="sort-select" className="sort-label">Sort by</label>
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

        {/* Product Cards Grid */}
        <div className="product-grid">
          {productsData.map((product) => (
            <article key={product.id} className="product-card">
              <div className="product-image-container">
                <img
                  src={product.image}
                  alt={product.title}
                  className="product-image"
                  loading="lazy"
                />
              </div>

              <div className="product-info">
                <h2 className="product-title">{product.title}</h2>

                <div className="product-rating">
                  <div className="stars-group">{renderStars(product.rating)}</div>
                  <span className="review-count">({product.reviews})</span>
                </div>

                <div className="product-price">
                  ₹{product.price.toFixed(2)}
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

     
    </div>
  );
}