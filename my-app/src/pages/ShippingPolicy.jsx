import React, { useEffect, useState, useRef } from 'react';
import './ShippingPolicy.css';

const ShippingPolicy = () => {
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

    // Scroll to top button visibility
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
    <div className="policy-page" ref={containerRef}>
      <main className="policy-container">
        <h1 className="page-title reveal">Shipping Policy</h1>

        <div className="policy-card">
          {/* Section 1 */}
          <div className="policy-section reveal">
            <p>
              At <strong>Seedhe Gaon Se</strong>, every order is freshly procured from our trusted village Halwai's. Since our products are perishable and prepared in small batches, we strive to dispatch all confirmed orders at the earliest to preserve their authentic taste and freshness.
            </p>
          </div>

          {/* Section 2 */}
          <div className="policy-section reveal">
            <h2>Delivery coverage &amp; timelines</h2>
            <p>
              We currently offer delivery across <strong>Delhi NCR</strong> through our trusted delivery partners. Delivery timelines are indicative and may vary due to weather conditions, traffic, public holidays, operational constraints, or circumstances beyond our reasonable control. While we make every effort to ensure timely delivery, exact delivery times cannot be guaranteed.
            </p>
          </div>

          {/* Section 3 */}
          <div className="policy-section reveal">
            <h2>Address accuracy &amp; customer responsibility</h2>
            <p>
              Customers are requested to provide a complete and accurate delivery address, landmark, and contact number while placing the order. <strong>Seedhe Gaon Se</strong> shall not be responsible for delays, failed deliveries, or additional delivery charges arising from incorrect or incomplete address details, customer unavailability, or unreachable contact numbers.
            </p>
          </div>

          {/* Section 4 */}
          <div className="policy-section reveal">
            <h2>Ownership and risk</h2>
            <p>
              Ownership and risk of the products pass to the customer upon successful delivery at the provided address. Customers are requested to inspect the outer packaging immediately upon delivery and report any visible damage or tampering without delay.
            </p>
          </div>

          {/* Section 5 */}
          <div className="policy-section reveal">
            <h2>Unsuccessful delivery attempts</h2>
            <p>
              In case a delivery is unsuccessful due to customer absence, refusal to accept the parcel, incorrect address, or repeated unsuccessful delivery attempts, the order shall be treated as cancelled from the customer's end. As the products are freshly procured and highly perishable, shipping charges and other applicable costs shall not be refundable.
            </p>
          </div>

          {/* Section 6 */}
          <div className="policy-section reveal">
            <h2>Bulk &amp; special event orders</h2>
            <p>
              For bulk, corporate, festive, and wedding orders, delivery schedules are planned in advance. Customers are requested to ensure the availability of an authorised recipient at the delivery location. Any delay caused by the customer may affect product freshness, for which <strong>Seedhe Gaon Se</strong> shall not be held liable.
            </p>
          </div>

          {/* Section 7 */}
          <div className="policy-section reveal">
            <p className="policy-footer-note">
              We continuously work towards delivering authentic village sweets in the freshest possible condition and appreciate your understanding and cooperation in helping us maintain the highest quality standards.
            </p>
          </div>
        </div>
      </main>

     

       
    
    </div>
  );
};

export default ShippingPolicy;