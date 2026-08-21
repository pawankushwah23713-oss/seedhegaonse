import React, { useState } from 'react';
import './LatestProducts.css';
import image1 from '../assets/dumy7.png';
import image2 from '../assets/dumy2.png';
import image3 from '../assets/dumy3.png';
import image4 from '../assets/dumy4.png';
import image5 from '../assets/dumy5.png';
import image6 from '../assets/dumy8.png';

const latestProductsData = [
  {
    id: 1,
    name: 'test',
    image: image1,
    rating: 0,
    reviewsCount: 0,
    price: 11.00,
  },
  {
    id: 2,
    name: 'ROHTAK KA PALANGTOD KAL...',
    image: image2,
    rating: 0,
    reviewsCount: 0,
    price: 430.00,
  },
  {
    id: 3,
    name: 'JIND KI DOODH BARFI',
    image: image3,
    rating: 5,
    reviewsCount: 1,
    price: 360.00,
  },
  {
    id: 4,
    name: 'HISAR KA MALAI PEDA',
    image: image4,
    rating: 5,
    reviewsCount: 2,
    price: 320.00,
  },
  {
    id: 5,
    name: 'BAGHPAT (TATIRI) KI DES...',
    image: image5,
    rating: 0,
    reviewsCount: 0,
    price: 400.00,
  },
  {
    id: 6,
    name: 'ALWAR KA MILK CAKE',
    image: image6,
    rating: 0,
    reviewsCount: 0,
    price: 340.00,
  },
];

const LatestProducts = () => {
  const [sortBy, setSortBy] = useState('Z to A Order');

  // Helper to render 5 stars (filled or outline based on rating)
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={index < rating ? 'star filled' : 'star outlined'}
      >
        {index < rating ? '★' : '☆'}
      </span>
    ));
  };

  return (
    <div className="latest-products-page">
      {/* Header Banner */}
      <header className="page-header-banner">
        <div className="banner-inner">
          <h1>Latest Products</h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="catalog-container">
        {/* Filter / Sort Top Bar */}
        <div className="catalog-toolbar">
          <span className="items-count">{latestProductsData.length} Items found</span>
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
              <option value="Z to A Order">Z to A Order</option>
              <option value="A to Z Order">A to Z Order</option>
              <option value="PriceLowHigh">Price: Low to High</option>
              <option value="PriceHighLow">Price: High to Low</option>
              <option value="Latest">Latest</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="product-grid">
          {latestProductsData.map((product) => (
            <div key={product.id} className="product-card">
              {/* Product Image */}
              <div className="product-image-box">
                <img
                  src={product.image}
                  alt={product.name}
                  className="product-img"
                  loading="lazy"
                />
              </div>

              {/* Product Info */}
              <div className="product-details">
                <h3 className="product-title" title={product.name}>
                  {product.name}
                </h3>

                {/* Rating */}
                <div className="product-rating">
                  <span className="stars-wrapper">{renderStars(product.rating)}</span>
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
      </main>

      {/* Floating WhatsApp Button */}
     
    </div>
  );
};

export default LatestProducts;