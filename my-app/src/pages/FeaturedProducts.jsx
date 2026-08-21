import React, { useState } from 'react';
import './FeaturedProducts.css';
import image1 from '../assets/dumy7.png';
import image2 from '../assets/dumy2.png';
import image3 from '../assets/dumy3.png';
import image4 from '../assets/dumy4.png';
import image5 from '../assets/dumy5.png';

const productsData = [
  {
    id: 1,
    name: 'HISAR KA MALAI PEDA',
    image: image1,
    rating: 5,
    reviewsCount: 2,
    price: 320.00,
  },
  {
    id: 2,
    name: 'BAGHPAT (TATIRI) KI DES...',
    image: image2,
    rating: 5,
    reviewsCount: 3,
    price: 400.00,
  },
  {
    id: 3,
    name: 'ALWAR KA MILK CAKE',
    image: image3,
    rating: 5,
    reviewsCount: 5,
    price: 340.00,
  },
  {
    id: 4,
    name: 'ROHTAK KA PALANGTOD KAL...',
    image: image4,
    rating: 5,
    reviewsCount: 6,
    price: 430.00,
  },
  {
    id: 5,
    name: 'JIND KI DOODH BARFI',
    image: image5,
    rating: 5,
    reviewsCount: 1,
    price: 360.00,
  },
];

const FeaturedProducts = () => {
  const [sortBy, setSortBy] = useState('Latest');

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
          <span className="items-count">{productsData.length} Items found</span>
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
        <div className="product-grid">
          {productsData.map((product) => (
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
                  <span className="stars">★★★★★</span>
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

      
    </div>
  );
};

export default FeaturedProducts;