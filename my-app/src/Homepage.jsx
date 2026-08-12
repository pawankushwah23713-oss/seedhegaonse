import React, { useState, useEffect } from 'react';
import './Homepage.css';

const Homepage = () => {
  const [activeTab, setActiveTab] = useState('featured');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile Menu State

  // 1. HERO SLIDER IMAGES & CONTENT (3 Images)
  const heroSlides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=1200&auto=format&fit=crop',
      subtitle: 'Pure Desi Ghee Goodness',
      title: 'Straight From Village Artisans',
      description: 'Handcrafted Traditional Taste Delivered Fresh To Your Doorstep'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=1200&auto=format&fit=crop',
      subtitle: 'Authentic Regional Delicacies',
      title: 'Hisar Peda & Alwar Milk Cake',
      description: '100% Pure Milk & Desi Khoya Prepared Daily'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=1200&auto=format&fit=crop',
      subtitle: 'Bulk & Corporate Festive Gifting',
      title: 'Fresh Made Daily For Celebrations',
      description: 'Use Coupon Code SGS50 to get FLAT ₹50 OFF'
    }
  ];

  // Auto-slide effect
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(slideInterval);
  }, [heroSlides.length]);

  const nextSlide = () => {
    setCurrentSlide(currentSlide === heroSlides.length - 1 ? 0 : currentSlide + 1);
  };

  const prevSlide = () => {
    setCurrentSlide(currentSlide === 0 ? heroSlides.length - 1 : currentSlide - 1);
  };

  // 2. PRODUCTS DATA
  const latestProducts = [
    { id: 1, name: 'test', rating: 0, reviews: 0, price: '₹11.00', tag: 'Fresh', img: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=400&auto=format&fit=crop' },
    { id: 2, name: 'HISAR KA MALAI PEDA', rating: 5, reviews: 2, price: '₹320.00', tag: 'Bestseller', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop' },
    { id: 3, name: 'BAGHPAT (TATIRI) KI DESI GHEE KI SHAHI BALUSHAHI', rating: 0, reviews: 0, price: '₹400.00', tag: 'Desi Ghee', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=400&auto=format&fit=crop' },
    { id: 4, name: 'ALWAR KA MILK CAKE', rating: 0, reviews: 0, price: '₹340.00', tag: 'Popular', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=400&auto=format&fit=crop' },
    { id: 5, name: 'ROHTAK KA PALANGTOD KALAKAND', rating: 0, reviews: 0, price: '₹430.00', tag: 'Special', img: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=400&auto=format&fit=crop' },
    { id: 6, name: 'JIND KI DOODH BARFI', rating: 4, reviews: 1, price: '₹360.00', tag: 'Authentic', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop' },
    { id: 7, name: 'MATHURA KA DESI GHEE SPECIAL PEDA', rating: 5, reviews: 4, price: '₹350.00', tag: 'Famous', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop' },
    { id: 8, name: 'MEERUT KI SHAHI KAJU KATLI', rating: 5, reviews: 8, price: '₹550.00', tag: 'Premium', img: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=400&auto=format&fit=crop' }
  ];

  const featuredProducts = [
    { id: 3, name: 'BAGHPAT (TATIRI) KI DESI GHEE KI SHAHI BALUSHAHI', rating: 0, reviews: 0, price: '₹400.00', tag: 'Desi Ghee', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=400&auto=format&fit=crop' },
    { id: 2, name: 'HISAR KA MALAI PEDA', rating: 5, reviews: 2, price: '₹320.00', tag: 'Top Rated', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop' },
    { id: 4, name: 'ALWAR KA MILK CAKE', rating: 0, reviews: 0, price: '₹340.00', tag: 'Popular', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=400&auto=format&fit=crop' },
    { id: 8, name: 'MEERUT KI SHAHI KAJU KATLI', rating: 5, reviews: 8, price: '₹550.00', tag: 'Premium', img: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=400&auto=format&fit=crop' }
  ];

  const topRatedProducts = [
    { id: 6, name: 'JIND KI DOODH BARFI', rating: 5, reviews: 1, price: '₹360.00', tag: 'Top Rated', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop' },
    { id: 2, name: 'HISAR KA MALAI PEDA', rating: 5, reviews: 2, price: '₹320.00', tag: '5 Stars', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop' }
  ];

  // 3. FAQ DATA
  const faqList = [
    {
      q: 'How do you guarantee Same Day Delivery in Delhi NCR?',
      a: 'All orders placed before 4 PM in Delhi NCR are freshly prepared in the morning and dispatched via our dedicated express delivery partners.'
    },
    {
      q: 'Are preservatives or artificial flavours added?',
      a: 'No! Absolutely 0 preservatives and 0 artificial flavours. We prepare sweets daily using 100% pure Desi Ghee.'
    },
    {
      q: 'How do I claim my FLAT ₹50 OFF discount?',
      a: 'Simply apply coupon code "SGS50" at the checkout page on your first order.'
    },
    {
      q: 'Can I place Corporate or Bulk Gifting orders?',
      a: 'Yes, we specialize in bulk and corporate gifting boxes. Please contact us via phone or WhatsApp at +91 9315911105.'
    }
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="homepage-container">
      {/* Floating WhatsApp */}
      <a href="https://wa.me/919315911105" className="whatsapp-button" target="_blank" rel="noreferrer" title="WhatsApp">
        <i className="fa-brands fa-whatsapp"></i>
      </a>

      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="announcement-bar">
        <div className="announcement-content">
          <span>🚚 <strong>SAME DAY DELIVERY IN DELHI NCR</strong></span>
          <span className="divider">|</span>
          <span>Use Code <span className="coupon-code">SGS50</span> for <strong>FLAT ₹50 OFF</strong></span>
        </div>
      </div>

      {/* 2. HEADER */}
      <header className="site-header">
        <div className="header-inner">
          {/* Mobile Hamburger Button */}
          <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(true)}>
            <i className="fa-solid fa-bars"></i>
          </button>

          <a href="#home" className="brand-logo">
            <div className="logo-icon"><i className="fa-solid fa-leaf"></i></div>
            <div className="logo-text">
              <span className="brand-name">Seedhe Gaon Se</span>
              <span className="brand-tagline">100% Authentic Village Sweets</span>
            </div>
          </a>

          {/* Cart Section */}
          <div className="cart-container">
            <div className="cart-badge-wrap">
              <i className="fa-solid fa-cart-shopping"></i>
              <span className="cart-badge">0</span>
            </div>
            <div className="cart-text desktop-only">
              <span className="cart-title">My cart</span>
              <span className="cart-price">₹0.00</span>
            </div>
          </div>
        </div>

        {/* Mobile & Desktop Search Bar */}
        <div className="header-search-wrap">
          <div className="search-container">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input type="text" placeholder="Search here ..." />
          </div>
        </div>
      </header>

      {/* 3. DESKTOP NAVIGATION BAR */}
      <nav className="main-nav desktop-only">
        <div className="nav-container">
          <ul>
            <li><a href="#home" className="active-link">Home</a></li>
            <li><a href="#sweets">Sweets</a></li>
            <li><a href="#our-story">Our Story</a></li>
            <li><a href="#why-choose-us">Why Choose Us</a></li>
            <li><a href="#bulking-gifting">Bulking/Gifting</a></li>
            <li><a href="#about-us">About Us</a></li>
            <li><a href="#contact-us">Contact Us</a></li>
          </ul>
        </div>
      </nav>

      {/* MOBILE SLIDE-OUT MENU DRAWER */}
      <div className={`mobile-backdrop ${mobileMenuOpen ? 'show' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>
      <aside className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>Menu</h3>
          <button className="close-drawer-btn" onClick={() => setMobileMenuOpen(false)}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <ul className="drawer-links">
          <li><a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a></li>
          <li><a href="#sweets" onClick={() => setMobileMenuOpen(false)}>Sweets</a></li>
          <li><a href="#our-story" onClick={() => setMobileMenuOpen(false)}>Our Story</a></li>
          <li><a href="#why-choose-us" onClick={() => setMobileMenuOpen(false)}>Why Choose Us</a></li>
          <li><a href="#bulking-gifting" onClick={() => setMobileMenuOpen(false)}>Bulking/Gifting</a></li>
          <li><a href="#about-us" onClick={() => setMobileMenuOpen(false)}>About Us</a></li>
          <li><a href="#contact-us" onClick={() => setMobileMenuOpen(false)}>Contact Us</a></li>
        </ul>
      </aside>

      {/* 4. HERO SLIDER SECTION */}
      <section className="hero-slider-section">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-slide ${index === currentSlide ? 'active-slide' : ''}`}
            style={{ backgroundImage: `linear-gradient(135deg, rgba(7, 35, 27, 0.82) 0%, rgba(13, 59, 46, 0.65) 100%), url(${slide.image})` }}
          >
            <div className="hero-box">
              <span className="hero-subtitle">{slide.subtitle}</span>
              <h1>{slide.title}</h1>
              <p>{slide.description}</p>
              <div className="hero-action-btns">
                <button className="primary-btn">Explore Sweets</button>
              </div>
            </div>
          </div>
        ))}

        <button className="banner-nav prev-banner" onClick={prevSlide} aria-label="Previous">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <button className="banner-nav next-banner" onClick={nextSlide} aria-label="Next">
          <i className="fa-solid fa-arrow-right"></i>
        </button>

        <div className="slide-dots">
          {heroSlides.map((_, idx) => (
            <span
              key={idx}
              className={`dot ${idx === currentSlide ? 'active-dot' : ''}`}
              onClick={() => setCurrentSlide(idx)}
            ></span>
          ))}
        </div>
      </section>

      {/* 5. USPs HIGHLIGHTS */}
      <section className="highlights-section">
        <div className="highlights-grid">
          <div className="highlight-card">
            <div className="hl-icon"><i className="fa-solid fa-truck-ramp-box"></i></div>
            <div className="hl-text">
              <h3>Same Day Delivery</h3>
              <p>In Delhi NCR</p>
            </div>
          </div>
          <div className="highlight-card">
            <div className="hl-icon"><i className="fa-solid fa-shield-halved"></i></div>
            <div className="hl-text">
              <h3>No Preservatives</h3>
              <p>No Artificial Flavours</p>
            </div>
          </div>
          <div className="highlight-card">
            <div className="hl-icon"><i className="fa-solid fa-bowl-food"></i></div>
            <div className="hl-text">
              <h3>Fresh Made Daily</h3>
              <p>Hygienically Prepared</p>
            </div>
          </div>
          <div className="highlight-card">
            <div className="hl-icon"><i className="fa-solid fa-certificate"></i></div>
            <div className="hl-text">
              <h3>100% Authentic</h3>
              <p>Pure Ingredients</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. LATEST PRODUCTS */}
      <section className="products-section container">
        <div className="section-heading-wrap">
          <div>
            <span className="sub-heading">Fresh Arrivals</span>
            <h2 className="main-heading">Latest products</h2>
          </div>
          <a href="#view-all" className="view-all-link">View all <i className="fa-solid fa-arrow-right-long"></i></a>
        </div>

        <div className="modern-product-grid">
          {latestProducts.map((p) => (
            <div key={p.id} className="modern-product-card">
              <div className="product-image-box">
                <span className="product-tag">{p.tag}</span>
                <img src={p.img} alt={p.name} />
              </div>
              <div className="product-info-box">
                <h3 className="product-name">{p.name}</h3>
                <div className="product-rating">
                  <div className="stars">
                    {p.rating > 0 ? (
                      [...Array(p.rating)].map((_, i) => <i key={i} className="fa-solid fa-star"></i>)
                    ) : (
                      <i className="fa-regular fa-star"></i>
                    )}
                  </div>
                  <span className="reviews-count">( {p.reviews} )</span>
                </div>
                <div className="product-footer">
                  <span className="price">{p.price}</span>
                  <button className="cart-btn"><i className="fa-solid fa-plus"></i> Add</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. FEATURED & TABBED PRODUCTS */}
      <section className="products-section container tabbed-section">
        <div className="custom-tabs">
          <button 
            className={`tab-item ${activeTab === 'featured' ? 'active' : ''}`}
            onClick={() => setActiveTab('featured')}
          >
            Featured & Best Sellings
          </button>
          <button 
            className={`tab-item ${activeTab === 'topRated' ? 'active' : ''}`}
            onClick={() => setActiveTab('topRated')}
          >
            Top Rated
          </button>
        </div>

        <div className="modern-product-grid">
          {(activeTab === 'featured' ? featuredProducts : topRatedProducts).map((p) => (
            <div key={p.id} className="modern-product-card">
              <div className="product-image-box">
                <span className="product-tag">{p.tag}</span>
                <img src={p.img} alt={p.name} />
              </div>
              <div className="product-info-box">
                <h3 className="product-name">{p.name}</h3>
                <div className="product-rating">
                  <div className="stars">
                    {p.rating > 0 ? (
                      [...Array(p.rating)].map((_, i) => <i key={i} className="fa-solid fa-star"></i>)
                    ) : (
                      <i className="fa-regular fa-star"></i>
                    )}
                  </div>
                  <span className="reviews-count">( {p.reviews} )</span>
                </div>
                <div className="product-footer">
                  <span className="price">{p.price}</span>
                  <button className="cart-btn"><i className="fa-solid fa-plus"></i> Add</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. FAQ ACCORDION */}
      <section className="faq-section container">
        <div className="section-heading-wrap text-center">
          <span className="sub-heading">Got Questions?</span>
          <h2 className="main-heading">Frequently Asked Questions</h2>
        </div>

        <div className="faq-accordion">
          {faqList.map((faq, idx) => (
            <div key={idx} className={`faq-item ${openFaq === idx ? 'open' : ''}`}>
              <div className="faq-question" onClick={() => toggleFaq(idx)}>
                <h4>{faq.q}</h4>
                <i className={`fa-solid ${openFaq === idx ? 'fa-minus' : 'fa-plus'}`}></i>
              </div>
              {openFaq === idx && (
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="modern-footer">
        <div className="footer-top-grid">
          <div className="footer-column">
            <h4 className="footer-head">About Company</h4>
            <ul className="footer-links">
              <li><a href="#about-us">About Us</a></li>
              <li><a href="#contact-us">Contact Us</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#support-ticket">Support Ticket</a></li>
            </ul>
            <div className="app-partners">
              <p className="partner-title">Order On App:</p>
              <div className="partner-badges">
                <span className="badge-swiggy">Swiggy</span>
                <span className="badge-zomato">Zomato</span>
              </div>
            </div>
          </div>

          <div className="footer-column">
            <h4 className="footer-head">Policies</h4>
            <ul className="footer-links">
              <li><a href="#shipping">Shipping policy</a></li>
              <li><a href="#return">Return & refund policy</a></li>
              <li><a href="#cancellation">Cancellation policy</a></li>
              <li><a href="#quality">Quality policy</a></li>
              <li><a href="#loyalty">Coupon Loyalty Points & Rewards Policy</a></li>
              <li><a href="#bulk">Corporate Wedding & Bulk Order Policy</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-head">Special</h4>
            <ul className="footer-links">
              <li><a href="#featured">Featured products</a></li>
              <li><a href="#latest">Latest products</a></li>
              <li><a href="#best-selling">Best selling product</a></li>
              <li><a href="#top-rated">Top rated product</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-head">Account & shipping info</h4>
            <ul className="footer-links">
              <li><a href="#profile">Profile info</a></li>
              <li><a href="#wishlist">Wish list</a></li>
              <li><a href="#track">Track order</a></li>
              <li><a href="#address">Address</a></li>
            </ul>
          </div>

          <div className="footer-column newsletter-column">
            <h4 className="footer-head">NEWS LETTER</h4>
            <p className="nl-desc">Subscribe to our new channel to get latest updates</p>
            <div className="newsletter-form">
              <input type="email" placeholder="Your Email Address" />
              <button>Subscribe</button>
            </div>

            <h4 className="footer-head contact-head">Start a conversation</h4>
            <div className="footer-contact-details">
              <p><i className="fa-solid fa-phone"></i> +91 9315911105</p>
              <p><i className="fa-solid fa-envelope"></i> info@seedhegaonse.in</p>
              <p><i className="fa-solid fa-headset"></i> Support Ticket</p>
              <p><i className="fa-solid fa-location-dot"></i> A2/3, Janakpuri, New Delhi-110058</p>
            </div>
          </div>
        </div>

        <div className="footer-bottom-row">
          <p className="copyright-text">
            Saaryva Kart | CopyRight@2026 <strong>Seedhe Gaon Se</strong>. All Rights Reserved.
          </p>
          <div className="legal-links">
            <a href="#terms">Terms & conditions</a>
            <a href="#privacy">Privacy policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;