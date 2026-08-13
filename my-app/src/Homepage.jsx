import React, { useState, useEffect } from 'react';
import './Homepage.css';

// Logo Image Import Path
import logoImg from './assets/logo.png';

const Homepage = () => {
  const [activeTab, setActiveTab] = useState('featured');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // 1. SCROLL DETECTOR FOR NAVBAR
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. INTERSECTION OBSERVER FOR SCROLL ANIMATION
  useEffect(() => {
    const revealElements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.12 }
    );

    revealElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [activeTab]);

  // 3. HERO SLIDER DATA
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
    }, 4500);
    return () => clearInterval(slideInterval);
  }, [heroSlides.length]);

  const nextSlide = () => {
    setCurrentSlide(currentSlide === heroSlides.length - 1 ? 0 : currentSlide + 1);
  };

  const prevSlide = () => {
    setCurrentSlide(currentSlide === 0 ? heroSlides.length - 1 : currentSlide - 1);
  };

  // 4. PRODUCTS DATA
  const latestProducts = [
    { id: 1, name: 'HISAR KA MALAI PEDA', rating: 5, reviews: 12, price: '₹320.00', tag: 'Bestseller', img: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?q=80&w=400&auto=format&fit=crop' },
    { id: 2, name: 'BAGHPAT SHAHI BALUSHAHI', rating: 5, reviews: 8, price: '₹400.00', tag: 'Desi Ghee', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=400&auto=format&fit=crop' },
    { id: 3, name: 'ALWAR KA FAMOUS MILK CAKE', rating: 4, reviews: 15, price: '₹340.00', tag: 'Popular', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=400&auto=format&fit=crop' },
    { id: 4, name: 'ROHTAK PALANGTOD KALAKAND', rating: 5, reviews: 9, price: '₹430.00', tag: 'Special', img: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=400&auto=format&fit=crop' },
    { id: 5, name: 'JIND KI SPECIAL DOODH BARFI', rating: 4, reviews: 6, price: '₹360.00', tag: 'Authentic', img: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?q=80&w=400&auto=format&fit=crop' },
    { id: 6, name: 'MATHURA KA SPECIAL DESI PEDA', rating: 5, reviews: 20, price: '₹350.00', tag: 'Famous', img: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?q=80&w=400&auto=format&fit=crop' },
    { id: 7, name: 'MEERUT SHAHI KAJU KATLI', rating: 5, reviews: 25, price: '₹550.00', tag: 'Premium', img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=400&auto=format&fit=crop' },
    { id: 8, name: 'PURE DESI GHEE MOTICHUR LADDU', rating: 5, reviews: 18, price: '₹310.00', tag: 'Fresh', img: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=80&w=400&auto=format&fit=crop' }
  ];

  const featuredProducts = [latestProducts[1], latestProducts[0], latestProducts[2], latestProducts[6]];
  const topRatedProducts = [latestProducts[4], latestProducts[0], latestProducts[7]];

  // 5. FAQ DATA
  const faqList = [
    { q: 'How do you guarantee Same Day Delivery in Delhi NCR?', a: 'All orders placed before 4 PM in Delhi NCR are freshly prepared in the morning and dispatched via our express delivery partners.' },
    { q: 'Are preservatives or artificial flavours added?', a: 'No! Absolutely 0 preservatives and 0 artificial flavours. We prepare sweets daily using 100% pure Desi Ghee.' },
    { q: 'How do I claim my FLAT ₹50 OFF discount?', a: 'Simply apply coupon code "SGS50" at the checkout page on your first order.' },
    { q: 'Can I place Corporate or Bulk Gifting orders?', a: 'Yes, we specialize in bulk and corporate gifting boxes. Please contact us via phone or WhatsApp at +91 9315911105.' }
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const toggleMobileSubmenu = (menuName) => {
    setMobileDropdown(mobileDropdown === menuName ? null : menuName);
  };

  return (
    <div className="homepage-container">
      {/* Floating WhatsApp Button */}
      <a href="https://wa.me/919315911105" className="whatsapp-button pulse-anim" target="_blank" rel="noreferrer" title="WhatsApp">
        <i className="fa-brands fa-whatsapp"></i>
      </a>

      {/* TOP ANNOUNCEMENT BAR */}
      <div className="announcement-bar">
        <div className="announcement-content">
          <span>🚚 <strong>SAME DAY DELIVERY IN DELHI NCR</strong></span>
          <span className="divider">|</span>
          <span>Use Code <span className="coupon-code shimmer-effect">SGS50</span> for <strong>FLAT ₹50 OFF</strong></span>
        </div>
      </div>

      {/* HEADER NAVBAR */}
      <header className={`main-header ${isScrolled ? 'scrolled-header' : ''}`}>
        <div className="header-container">
          <a href="#home" className="header-logo logo-hover-anim">
            <img src={logoImg} alt="Brand Logo" className="logo-image" />
            <div className="logo-info">
              <span className="logo-brand-title">Seedhe Gaon Se</span>
              <span className="logo-brand-tagline">Your Gateway to Pure Taste</span>
            </div>
          </a>

          <nav className="desktop-navbar">
            <ul className="nav-menu">
              <li className="nav-item"><a href="#home" className="nav-link active">Home</a></li>
              
              <li className="nav-item has-dropdown">
                <a href="#about-us" className="nav-link">
                  About Us <i className="fa-solid fa-chevron-down dropdown-arrow"></i>
                </a>
                <ul className="dropdown-menu fade-slide-down">
                  <li><a href="#our-story">Our Story</a></li>
                  <li><a href="#why-choose-us">Why Choose Us</a></li>
                  <li><a href="#artisans">Village Artisans</a></li>
                </ul>
              </li>

              <li className="nav-item has-dropdown">
                <a href="#sweets" className="nav-link">
                  Sweets <i className="fa-solid fa-chevron-down dropdown-arrow"></i>
                </a>
                <ul className="dropdown-menu fade-slide-down">
                  <li><a href="#pedas">Hisar Malai Peda</a></li>
                  <li><a href="#milkcake">Alwar Milk Cake</a></li>
                  <li><a href="#balushahi">Baghpat Balushahi</a></li>
                  <li><a href="#laddoo">Desi Ghee Laddoo</a></li>
                </ul>
              </li>

              <li className="nav-item has-dropdown">
                <a href="#destinations" className="nav-link">
                  Specialties <i className="fa-solid fa-chevron-down dropdown-arrow"></i>
                </a>
                <ul className="dropdown-menu fade-slide-down">
                  <li><a href="#haryana">Haryana Special</a></li>
                  <li><a href="#rajasthan">Rajasthan Special</a></li>
                  <li><a href="#up">UP Special</a></li>
                </ul>
              </li>

              <li className="nav-item"><a href="#scholarships" className="nav-link">Offers</a></li>

              <li className="nav-item has-dropdown">
                <a href="#branches" className="nav-link">
                  Branches <i className="fa-solid fa-chevron-down dropdown-arrow"></i>
                </a>
                <ul className="dropdown-menu fade-slide-down">
                  <li><a href="#delhi">Delhi NCR</a></li>
                  <li><a href="#janakpuri">Janakpuri Branch</a></li>
                </ul>
              </li>

              <li className="nav-item"><a href="#gallery" className="nav-link">Gallery</a></li>

              <li className="nav-item has-dropdown">
                <a href="#events" className="nav-link">
                  Gifting <i className="fa-solid fa-chevron-down dropdown-arrow"></i>
                </a>
                <ul className="dropdown-menu fade-slide-down">
                  <li><a href="#festive">Festive Sweets Box</a></li>
                  <li><a href="#corporate">Corporate Orders</a></li>
                </ul>
              </li>

              <li className="nav-item"><a href="#find-a-course" className="nav-link">Find Sweet</a></li>
              <li className="nav-item"><a href="#careers" className="nav-link">Careers</a></li>
              <li className="nav-item"><a href="#contact-us" className="nav-link">Contact Us</a></li>
            </ul>
          </nav>

          <div className="header-actions">
            <div className="cart-trigger cart-bounce" title="View Cart">
              <i className="fa-solid fa-cart-shopping"></i>
              <span className="cart-count">0</span>
            </div>

            <button 
              className="mobile-hamburger-btn" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Mobile Menu"
            >
              <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
              <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
              <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
            </button>
          </div>
        </div>

        <div className={`mobile-nav-menu ${mobileMenuOpen ? 'show' : ''}`}>
          <div className="mobile-search-bar">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input type="text" placeholder="Search sweets, peda, milkcake..." />
          </div>

          <ul className="mobile-menu-list">
            <li><a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a></li>
            
            <li className="mobile-dropdown-item">
              <div className="mobile-dropdown-header" onClick={() => toggleMobileSubmenu('about')}>
                <span>About Us</span>
                <i className={`fa-solid fa-chevron-down ${mobileDropdown === 'about' ? 'rotate' : ''}`}></i>
              </div>
              {mobileDropdown === 'about' && (
                <ul className="mobile-submenu animate-accordion">
                  <li><a href="#our-story" onClick={() => setMobileMenuOpen(false)}>Our Story</a></li>
                  <li><a href="#why-choose-us" onClick={() => setMobileMenuOpen(false)}>Why Choose Us</a></li>
                  <li><a href="#artisans" onClick={() => setMobileMenuOpen(false)}>Village Artisans</a></li>
                </ul>
              )}
            </li>

            <li className="mobile-dropdown-item">
              <div className="mobile-dropdown-header" onClick={() => toggleMobileSubmenu('sweets')}>
                <span>Sweets Categories</span>
                <i className={`fa-solid fa-chevron-down ${mobileDropdown === 'sweets' ? 'rotate' : ''}`}></i>
              </div>
              {mobileDropdown === 'sweets' && (
                <ul className="mobile-submenu animate-accordion">
                  <li><a href="#pedas" onClick={() => setMobileMenuOpen(false)}>Hisar Malai Peda</a></li>
                  <li><a href="#milkcake" onClick={() => setMobileMenuOpen(false)}>Alwar Milk Cake</a></li>
                  <li><a href="#balushahi" onClick={() => setMobileMenuOpen(false)}>Baghpat Balushahi</a></li>
                  <li><a href="#laddoo" onClick={() => setMobileMenuOpen(false)}>Desi Ghee Laddoo</a></li>
                </ul>
              )}
            </li>

            <li><a href="#scholarships" onClick={() => setMobileMenuOpen(false)}>Offers</a></li>
            <li><a href="#branches" onClick={() => setMobileMenuOpen(false)}>Branches</a></li>
            <li><a href="#gallery" onClick={() => setMobileMenuOpen(false)}>Gallery</a></li>
            <li><a href="#events" onClick={() => setMobileMenuOpen(false)}>Gifting</a></li>
            <li><a href="#contact-us" onClick={() => setMobileMenuOpen(false)}>Contact Us</a></li>
          </ul>
        </div>
      </header>

      {/* HERO SLIDER SECTION */}
      <section className="hero-slider-section">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-slide ${index === currentSlide ? 'active-slide' : ''}`}
            style={{ backgroundImage: `linear-gradient(135deg, rgba(7, 35, 27, 0.85) 0%, rgba(13, 59, 46, 0.65) 100%), url(${slide.image})` }}
          >
            <div className="hero-box">
              <span className="hero-subtitle slide-up-anim">{slide.subtitle}</span>
              <h1 className="slide-up-anim delay-1">{slide.title}</h1>
              <p className="slide-up-anim delay-2">{slide.description}</p>
              <div className="hero-action-btns slide-up-anim delay-3">
                <button className="primary-btn btn-hover-grow">Explore Sweets</button>
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

      {/* =========================================================
          UPDATED HIGHLIGHTS SECTION (EXACT AS YOUR SCREENSHOT)
         ========================================================= */}
      <section className="highlights-section">
        <div className="highlights-grid">
          
          <div className="highlight-card reveal delay-1">
            <div className="hl-img-box">
              <img src="https://cdn-icons-png.flaticon.com/512/2830/2830305.png" alt="Same Day Delivery" className="hl-img" />
            </div>
            <div className="hl-text">
              <h3>Same Day Delivery</h3>
              <p>In Delhi NCR</p>
            </div>
          </div>

          <div className="highlight-card reveal delay-2">
            <div className="hl-img-box">
              <img src="https://cdn-icons-png.flaticon.com/512/2913/2913520.png" alt="No Preservatives" className="hl-img" />
            </div>
            <div className="hl-text">
              <h3>No Preservatives</h3>
              <p>0% Artificial Flavours</p>
            </div>
          </div>

          <div className="highlight-card reveal delay-3">
            <div className="hl-img-box">
              <img src="https://cdn-icons-png.flaticon.com/512/3081/3081986.png" alt="Fresh Made Daily" className="hl-img" />
            </div>
            <div className="hl-text">
              <h3>Fresh Made Daily</h3>
              <p>100% Pure Desi Ghee</p>
            </div>
          </div>

          <div className="highlight-card reveal delay-4">
            <div className="hl-img-box">
              <img src="https://cdn-icons-png.flaticon.com/512/1067/1067357.png" alt="100% Authentic" className="hl-img" />
            </div>
            <div className="hl-text">
              <h3>100% Authentic</h3>
              <p>Village Artisans Recipe</p>
            </div>
          </div>

        </div>
      </section>

      {/* LATEST PRODUCTS SECTION */}
      <section className="products-section container">
        <div className="section-heading-wrap reveal">
          <div>
            <span className="sub-heading">Fresh Arrivals</span>
            <h2 className="main-heading">Latest Sweets</h2>
          </div>
          <a href="#view-all" className="view-all-link">View all <i className="fa-solid fa-arrow-right-long"></i></a>
        </div>

        <div className="modern-product-grid">
          {latestProducts.map((p, idx) => (
            <div key={p.id} className={`modern-product-card reveal delay-${(idx % 4) + 1}`}>
              <div className="product-image-box">
                <span className="product-tag">{p.tag}</span>
                <img src={p.img} alt={p.name} loading="lazy" className="zoom-on-hover" />
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
                  <button className="cart-btn btn-click-effect"><i className="fa-solid fa-plus"></i> Add</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED & TABBED PRODUCTS */}
      <section className="products-section container tabbed-section">
        <div className="custom-tabs reveal">
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
          {(activeTab === 'featured' ? featuredProducts : topRatedProducts).map((p, idx) => (
            <div key={p.id} className={`modern-product-card reveal delay-${idx + 1}`}>
              <div className="product-image-box">
                <span className="product-tag">{p.tag}</span>
                <img src={p.img} alt={p.name} loading="lazy" className="zoom-on-hover" />
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
                  <button className="cart-btn btn-click-effect"><i className="fa-solid fa-plus"></i> Add</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="faq-section container">
        <div className="section-heading-wrap text-center reveal">
          <span className="sub-heading">Got Questions?</span>
          <h2 className="main-heading">Frequently Asked Questions</h2>
        </div>

        <div className="faq-accordion">
          {faqList.map((faq, idx) => (
            <div key={idx} className={`faq-item reveal delay-${idx + 1} ${openFaq === idx ? 'open' : ''}`}>
              <div className="faq-question" onClick={() => toggleFaq(idx)}>
                <h4>{faq.q}</h4>
                <i className={`fa-solid ${openFaq === idx ? 'fa-minus' : 'fa-plus'}`}></i>
              </div>
              {openFaq === idx && (
                <div className="faq-answer accordion-open">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER SECTION */}
      <footer className="modern-footer">
        <div className="footer-top-grid">
          <div className="footer-column reveal delay-1">
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

          <div className="footer-column reveal delay-2">
            <h4 className="footer-head">Policies</h4>
            <ul className="footer-links">
              <li><a href="#shipping">Shipping policy</a></li>
              <li><a href="#return">Return & refund policy</a></li>
              <li><a href="#cancellation">Cancellation policy</a></li>
              <li><a href="#bulk">Bulk & Corporate Order Policy</a></li>
            </ul>
          </div>

          <div className="footer-column newsletter-column reveal delay-3">
            <h4 className="footer-head">NEWSLETTER</h4>
            <div className="newsletter-form">
              <input type="email" placeholder="Your Email Address" />
              <button className="btn-hover-grow">Subscribe</button>
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