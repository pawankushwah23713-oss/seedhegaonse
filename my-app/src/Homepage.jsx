import React, { useState, useEffect } from 'react';
import './Homepage.css';

// ---------------------------------------------------------------
// IMPORTANT: Put your logo image file (e.g., logo.png or logo.svg)
// in the same folder as Homepage.jsx, or adjust this path:
// ---------------------------------------------------------------
import logoImg from './assets/logo.png';

const Homepage = () => {
  const [activeTab, setActiveTab] = useState('featured');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. HERO SLIDER DATA
  const heroSlides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=1200&auto=format&fit=crop',
      subtitle: 'Pure Desi Ghee Goodness',
      title: 'Straight From Village Artisans',
      description: 'Handcrafted Traditional Sweets Delivered Fresh To Your Doorstep'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=1200&auto=format&fit=crop',
      subtitle: 'Authentic Regional Delicacies',
      title: 'Hisar Peda & Alwar Milk Cake',
      description: '100% Pure Milk & Pure Khoya Prepared Daily'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=1200&auto=format&fit=crop',
      subtitle: 'Festive & Corporate Gifting',
      title: 'Fresh Made Daily For Celebrations',
      description: 'Use Coupon Code SGS50 to get FLAT ₹50 OFF'
    }
  ];

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
    { 
      id: 1, 
      name: 'HISAR KA MALAI PEDA', 
      rating: 5, 
      reviews: 12, 
      price: '₹320.00', 
      tag: 'Bestseller', 
      img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop' 
    },
    { 
      id: 2, 
      name: 'BAGHPAT SHAHI BALUSHAHI', 
      rating: 5, 
      reviews: 8, 
      price: '₹400.00', 
      tag: 'Desi Ghee', 
      img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=400&auto=format&fit=crop' 
    },
    { 
      id: 3, 
      name: 'ALWAR KA FAMOUS MILK CAKE', 
      rating: 4, 
      reviews: 15, 
      price: '₹340.00', 
      tag: 'Popular', 
      img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=400&auto=format&fit=crop' 
    },
    { 
      id: 4, 
      name: 'ROHTAK PALANGTOD KALAKAND', 
      rating: 5, 
      reviews: 9, 
      price: '₹430.00', 
      tag: 'Special', 
      img: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=400&auto=format&fit=crop' 
    },
    { 
      id: 5, 
      name: 'JIND KI SPECIAL DOODH BARFI', 
      rating: 4, 
      reviews: 6, 
      price: '₹360.00', 
      tag: 'Authentic', 
      img: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?q=80&w=400&auto=format&fit=crop' 
    },
    { 
      id: 6, 
      name: 'MATHURA KA SPECIAL DESI PEDA', 
      rating: 5, 
      reviews: 20, 
      price: '₹350.00', 
      tag: 'Famous', 
      img: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?q=80&w=400&auto=format&fit=crop' 
    },
    { 
      id: 7, 
      name: 'MEERUT SHAHI KAJU KATLI', 
      rating: 5, 
      reviews: 25, 
      price: '₹550.00', 
      tag: 'Premium', 
      img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=400&auto=format&fit=crop' 
    },
    { 
      id: 8, 
      name: 'PURE DESI GHEE MOTICHUR LADDU', 
      rating: 5, 
      reviews: 18, 
      price: '₹310.00', 
      tag: 'Fresh', 
      img: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=80&w=400&auto=format&fit=crop' 
    }
  ];

  const featuredProducts = [
    latestProducts[1],
    latestProducts[0],
    latestProducts[2],
    latestProducts[6]
  ];

  const topRatedProducts = [
    latestProducts[4],
    latestProducts[0],
    latestProducts[7]
  ];

  // 3. FAQ DATA
  const faqList = [
    {
      q: 'How do you guarantee Same Day Delivery in Delhi NCR?',
      a: 'All orders placed before 4 PM in Delhi NCR are freshly prepared in the morning and dispatched via our express delivery partners.'
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
      {/* Floating WhatsApp Button */}
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

      {/* 2. HEADER WITH LOGO IMAGE */}
      <header className="site-header">
        <div className="header-inner">
          {/* Mobile Hamburger Button */}
          <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(true)} aria-label="Open Menu">
            <i className="fa-solid fa-bars"></i>
          </button>

          {/* Company Brand Logo */}
          <a href="#home" className="brand-logo">
            <img src={logoImg} alt="Seedhe Gaon Se Logo" className="brand-logo-img" />
            <div className="logo-text">
              <span className="brand-name">Seedhe Gaon Se</span>
              <span className="brand-tagline">100% Authentic Sweets</span>
            </div>
          </a>

          {/* Cart Section */}
          <div className="cart-container">
            <div className="cart-badge-wrap">
              <i className="fa-solid fa-cart-shopping"></i>
              <span className="cart-badge">0</span>
            </div>
            <div className="cart-text desktop-only">
              <span className="cart-title">My Cart</span>
              <span className="cart-price">₹0.00</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="header-search-wrap">
          <div className="search-container">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input type="text" placeholder="Search sweets, peda, milkcake..." />
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

      {/* MOBILE SLIDE-OUT DRAWER MENU */}
      <div className={`mobile-backdrop ${mobileMenuOpen ? 'show' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>
      <aside className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-brand">
            <img src={logoImg} alt="Seedhe Gaon Se Logo" className="drawer-logo-img" />
            <span>Seedhe Gaon Se</span>
          </div>
          <button className="close-drawer-btn" onClick={() => setMobileMenuOpen(false)} aria-label="Close Menu">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <ul className="drawer-links">
          <li><a href="#home" onClick={() => setMobileMenuOpen(false)}><i className="fa-solid fa-house"></i> Home</a></li>
          <li><a href="#sweets" onClick={() => setMobileMenuOpen(false)}><i className="fa-solid fa-cookie-bite"></i> Sweets</a></li>
          <li><a href="#our-story" onClick={() => setMobileMenuOpen(false)}><i className="fa-solid fa-book-open"></i> Our Story</a></li>
          <li><a href="#why-choose-us" onClick={() => setMobileMenuOpen(false)}><i className="fa-solid fa-award"></i> Why Choose Us</a></li>
          <li><a href="#bulking-gifting" onClick={() => setMobileMenuOpen(false)}><i className="fa-solid fa-gift"></i> Bulking/Gifting</a></li>
          <li><a href="#about-us" onClick={() => setMobileMenuOpen(false)}><i className="fa-solid fa-circle-info"></i> About Us</a></li>
          <li><a href="#contact-us" onClick={() => setMobileMenuOpen(false)}><i className="fa-solid fa-envelope"></i> Contact Us</a></li>
        </ul>

        <div className="drawer-footer">
          <p><i className="fa-solid fa-phone"></i> +91 9315911105</p>
          <p><i className="fa-solid fa-truck-fast"></i> Delivery in Delhi NCR</p>
        </div>
      </aside>

      {/* 4. HERO SLIDER SECTION */}
      <section className="hero-slider-section">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-slide ${index === currentSlide ? 'active-slide' : ''}`}
            style={{ backgroundImage: `linear-gradient(135deg, rgba(7, 35, 27, 0.85) 0%, rgba(13, 59, 46, 0.65) 100%), url(${slide.image})` }}
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
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <button className="banner-nav next-banner" onClick={nextSlide} aria-label="Next">
          <i className="fa-solid fa-chevron-right"></i>
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
              <p>0% Artificial Flavours</p>
            </div>
          </div>
          <div className="highlight-card">
            <div className="hl-icon"><i className="fa-solid fa-bowl-food"></i></div>
            <div className="hl-text">
              <h3>Fresh Made Daily</h3>
              <p>100% Pure Desi Ghee</p>
            </div>
          </div>
          <div className="highlight-card">
            <div className="hl-icon"><i className="fa-solid fa-certificate"></i></div>
            <div className="hl-text">
              <h3>100% Authentic</h3>
              <p>Village Artisans Recipe</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. LATEST PRODUCTS */}
      <section className="products-section container">
        <div className="section-heading-wrap">
          <div>
            <span className="sub-heading">Fresh Arrivals</span>
            <h2 className="main-heading">Latest Sweets</h2>
          </div>
          <a href="#view-all" className="view-all-link">View all <i className="fa-solid fa-arrow-right-long"></i></a>
        </div>

        <div className="modern-product-grid">
          {latestProducts.map((p) => (
            <div key={p.id} className="modern-product-card">
              <div className="product-image-box">
                <span className="product-tag">{p.tag}</span>
                <img src={p.img} alt={p.name} loading="lazy" />
              </div>
              <div className="product-info-box">
                <h3 className="product-name">{p.name}</h3>
                <div className="product-rating">
                  <div className="stars">
                    {[...Array(p.rating)].map((_, i) => <i key={i} className="fa-solid fa-star"></i>)}
                  </div>
                  <span className="reviews-count">({p.reviews})</span>
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
            Featured & Bestsellers
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
                <img src={p.img} alt={p.name} loading="lazy" />
              </div>
              <div className="product-info-box">
                <h3 className="product-name">{p.name}</h3>
                <div className="product-rating">
                  <div className="stars">
                    {[...Array(p.rating)].map((_, i) => <i key={i} className="fa-solid fa-star"></i>)}
                  </div>
                  <span className="reviews-count">({p.reviews})</span>
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
              <li><a href="#bulk">Bulk & Corporate Order Policy</a></li>
            </ul>
          </div>

          <div className="footer-column newsletter-column">
            <h4 className="footer-head">NEWSLETTER</h4>
            <div className="newsletter-form">
              <input type="email" placeholder="Your Email Address" />
              <button>Subscribe</button>
            </div>

            <h4 className="footer-head contact-head">Contact Us</h4>
            <div className="footer-contact-details">
              <p><i className="fa-solid fa-phone"></i> +91 9315911105</p>
              <p><i className="fa-solid fa-envelope"></i> info@seedhegaonse.in</p>
              <p><i className="fa-solid fa-location-dot"></i> Janakpuri, New Delhi-110058</p>
            </div>
          </div>
        </div>

        <div className="footer-bottom-row">
          <p className="copyright-text">
            © 2026 <strong>Seedhe Gaon Se</strong>. All Rights Reserved.
          </p>
          <div className="legal-links">
            <a href="#terms">Terms</a> | <a href="#privacy">Privacy Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;