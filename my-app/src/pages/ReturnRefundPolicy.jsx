import React, { useEffect, useState, useRef } from 'react';
import './ReturnRefundPolicy.css';

const ReturnRefundPolicy = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Scroll reveal animation observer
    const reveals = containerRef.current.querySelectorAll('.reveal');

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    reveals.forEach((el) => observer.observe(el));

    // Scroll to top visibility
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="kpolicy-page" ref={containerRef}>
      <main className="kpolicy-container">
        <h1 className="kpage-title reveal">Return &amp; Refund Policy</h1>

        <div className="kpolicy-card">
          {/* Top Intro Section */}
          <div className="kpolicy-intro reveal">
            <p>
              At <strong>Seedhe Gaon Se</strong>, every sweet is freshly sourced from renowned village Halwai's and prepared in limited batches. As our products are perishable food items, returns and refunds are accepted only under the conditions mentioned below.
            </p>
          </div>

          <hr className="kpolicy-divider reveal" />

          {/* Bullet Points Section */}
          <ul className="kpolicy-list">
            <li className="kreveal">
              If you receive a damaged, spoiled, incorrect or tampered product, you must inform us <strong>within 60 minutes of delivery</strong> by sharing a <strong>continuous, unedited unboxing video</strong> clearly showing the sealed package being opened. Claims without a complete unboxing video may not be accepted.
            </li>

            <li className="kreveal">
              Once your claim is verified by our quality team, we may, at our sole discretion, offer <strong>only a replacement depending upon the nature of the issue</strong> but no refund shall be paid.
            </li>

            <li className="kreveal">
              Returns requested for reasons such as <strong>change of mind, personal taste or preference, delayed consumption, improper storage, incorrect shipping address provided by the customer, refusal to accept delivery, or natural changes in texture due to shelf life</strong> shall not be eligible for a refund or replacement.
            </li>

            <li className="kreveal">
              If a customer voluntarily wishes to return an undamaged order after delivery, the product must be shipped back at the <strong>customer’s own expense</strong> in its original sealed condition. After successful inspection and subject to approval by our quality team, <strong>up to 50% of the product value</strong> may be refunded. Shipping, packaging, payment gateway charges and other operational costs are non-refundable.
            </li>
          </ul>

          <hr className="kpolicy-divider reveal" />

          {/* Bottom Agreement Statement */}
          <div className="kpolicy-footer reveal">
            <p>
              By placing an order with Seedhe Gaon Se, the customer acknowledges and agrees to this Return &amp; Refund Policy.
            </p>
          </div>
        </div>
      </main>

    
       
    </div>
  );
};

export default ReturnRefundPolicy;