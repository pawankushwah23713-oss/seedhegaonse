import React, { useEffect, useRef } from 'react';
import './WhyChooseUs.css';

const WhyChooseUs = () => {
  const scrollRef = useRef([]);

  // 🟢 Scroll Reveal Animation (Zero dependency IntersectionObserver)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.15 }
    );

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="why-choose-wrapper">
      
      {/* ── 1. HERO SECTION (With High-Res Images & Floating Badges) ── */}
      <section className="hero-banner-section animate-on-scroll">
        <div className="hero-inner-container">
          <div className="hero-text-content">
            <span className="royal-tag">✦ 100% PURE & AUTHENTIC ✦</span>
            <h1 className="hero-title">Why Choose Seedhe Gaon Se?</h1>
            <p className="hero-subtitle">
              Every sweet has a story, every village has a legacy, and every Halwai carries 
              generations of craftsmanship. We bring India's most authentic village sweets 
              directly from their place of origin to your doorstep.
            </p>

            <div className="hero-quick-stats">
              <div className="stat-pill">
                <span className="stat-num">50+</span>
                <span className="stat-lbl">Heritage Villages</span>
              </div>
              <div className="stat-pill">
                <span className="stat-num">100%</span>
                <span className="stat-lbl">Pure Desi Ghee</span>
              </div>
              <div className="stat-pill">
                <span className="stat-num">0%</span>
                <span className="stat-lbl">Factory Made</span>
              </div>
            </div>
          </div>

          {/* Hero Image Showcase */}
          <div className="hero-image-showcase">
            <div className="image-frame main-img">
              <img 
                src="https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=700&auto=format&fit=crop" 
                alt="Traditional Indian Sweets" 
              />
              <div className="img-overlay-badge">
                <span className="badge-icon">🪔</span>
                <div>
                  <strong>Artisan Crafted</strong>
                  <small>Fresh from Halwai's Kadhai</small>
                </div>
              </div>
            </div>

            <div className="floating-sweet-card float-anim-1">
              <img 
                src="https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=300&auto=format&fit=crop" 
                alt="Desi Ghee Delicacies" 
              />
              <div className="card-mini-info">
                <span>Direct Sourcing</span>
                <span className="star-rating">⭐⭐⭐⭐⭐</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── 2. WHAT MAKES US DIFFERENT (Feature Grid) ── */}
      <section className="features-section">
        <div className="section-title-wrap animate-on-scroll">
          <h2 className="section-main-heading">What Makes Us Different</h2>
          <div className="golden-divider"></div>
        </div>

        <div className="features-grid">
          {/* Card 1 */}
          <div className="feature-luxury-card animate-on-scroll">
            <div className="card-icon-bubble honey-glow">
              <span className="emoji-icon">🍯</span>
            </div>
            <h3 className="card-heading">Authentic Regional Flavours</h3>
            <p className="card-text">
              Every sweet is sourced directly from the village or city that made it famous, 
              preserving its authentic taste, texture, and traditional recipe.
            </p>
          </div>

          {/* Card 2 */}
          <div className="feature-luxury-card animate-on-scroll">
            <div className="card-icon-bubble truck-glow">
              <span className="emoji-icon">🚚</span>
            </div>
            <h3 className="card-heading">Freshness Guaranteed</h3>
            <p className="card-text">
              Freshly prepared by experienced Halwai's and shipped quickly to ensure every 
              bite reaches you with its original freshness and quality.
            </p>
          </div>

          {/* Card 3 */}
          <div className="feature-luxury-card animate-on-scroll">
            <div className="card-icon-bubble chef-glow">
              <span className="emoji-icon">👨‍🍳</span>
            </div>
            <h3 className="card-heading">Supporting Local Halwai's</h3>
            <p className="card-text">
              Every purchase supports skilled village sweet makers and helps preserve family 
              traditions that have been passed down for generations.
            </p>
          </div>

          {/* Card 4 */}
          <div className="feature-luxury-card animate-on-scroll">
            <div className="card-icon-bubble heritage-glow">
              <span className="emoji-icon">🏛️</span>
            </div>
            <h3 className="card-heading">Preserving India's Sweet Heritage</h3>
            <p className="card-text">
              Our mission is to protect India's disappearing sweet traditions and bring 
              forgotten regional delicacies back into every Indian home.
            </p>
          </div>
        </div>
      </section>


      {/* ── 3. MORE THAN JUST SWEETS BANNER ── */}
      <section className="more-than-sweets-banner animate-on-scroll">
        <div className="banner-content">
          <div className="banner-left">
            <h2 className="banner-title">More Than Just Sweets</h2>
            <p className="banner-desc">
              We don't manufacture sweets in factories. We connect you directly with India's finest 
              traditional Halwai's who continue to prepare authentic sweets using age-old recipes 
              and premium ingredients.
            </p>
          </div>

          <div className="banner-right">
            <div className="animated-heart-wrapper">
              <div className="heart-halo"></div>
              <span className="heart-3d">💖</span>
            </div>
          </div>
        </div>
      </section>


      {/* ── 4. INSPIRATIONAL QUOTE ── */}
      <section className="heritage-quote-section animate-on-scroll">
        <div className="quote-container">
          <span className="quote-mark">“</span>
          <p className="quote-text">
            When you choose Seedhe Gaon Se, you don't just enjoy sweets — you become part of preserving India's rich culinary heritage.
          </p>
          <span className="quote-mark closing">”</span>
        </div>
      </section>

    </div>
  );
};

export default WhyChooseUs;