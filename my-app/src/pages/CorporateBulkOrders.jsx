import React from 'react';
import './CorporateBulkOrders.css';

const CorporateBulkOrders = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="corporate-page-wrapper">
      <div className="corporate-container">
        <h1 className="corporate-title">Corporate &amp; Bulk Orders</h1>

        <div className="corporate-card">
          {/* Introduction */}
          <section className="corporate-intro">
            <p>
              At <strong>Seedhe Gaon Se</strong>, we proudly cater to corporate gifting, weddings, festivals, family functions, and bulk celebrations with authentic traditional sweets sourced directly from renowned village Halwai's.
            </p>
          </section>

          {/* Advance booking & availability */}
          <section className="corporate-section">
            <h2 className="section-heading">Advance booking &amp; availability</h2>
            <p className="section-content">
              To ensure freshness and timely procurement, <strong>bulk orders should preferably be placed at least 4–5 days in advance</strong>. While we strive to accommodate urgent requests, acceptance of last-minute orders depends entirely on product availability and production capacity.
            </p>
          </section>

          {/* Minimum order quantity & pricing */}
          <section className="corporate-section">
            <h2 className="section-heading">Minimum order quantity &amp; pricing</h2>
            <p className="section-content">
              A <strong>minimum order quantity (MOQ)</strong> may apply to avail bulk pricing and special discounts. Discounts are offered based on the order quantity, product selection, delivery location, and seasonal demand.
            </p>
          </section>

          {/* Payment & cancellation terms */}
          <section className="corporate-section">
            <h2 className="section-heading">Payment &amp; cancellation terms</h2>
            <p className="section-content">
              For all corporate and bulk orders, <strong>complete 100% advance payment is mandatory</strong> to confirm the booking. Production and procurement commence only after the advance amount is received. Once the order enters the production or procurement stage, it cannot be cancelled, modified, or refunded.
            </p>
          </section>

          {/* Product characteristics */}
          <section className="corporate-section">
            <h2 className="section-heading">Product characteristics</h2>
            <p className="section-content">
              As our sweets are handcrafted using traditional methods and fresh ingredients, <strong>minor variations in colour, texture, size, or weight are natural</strong> and do not constitute a manufacturing defect.
            </p>
          </section>

          {/* Delivery responsibilities */}
          <section className="corporate-section">
            <h2 className="section-heading">Delivery responsibilities</h2>
            <p className="section-content">
              The customer is responsible for providing accurate delivery details and ensuring the availability of the recipient at the time of delivery. Additional delivery attempts, address changes after dispatch, or special delivery requests may attract extra logistics charges.
            </p>
          </section>

          {/* Branding & customization */}
          <section className="corporate-section">
            <h2 className="section-heading">Branding &amp; customization</h2>
            <p className="section-content">
              For personalised branding, customised gift boxes, printed sleeves, greeting cards, or corporate packaging, separate charges may apply and such customised orders are non-returnable and non-refundable.
            </p>
          </section>

          {/* Footer Note */}
          <div className="corporate-footer">
            <p>
              <em>Our commitment is to make your special occasion memorable by delivering authentic, fresh, and premium-quality sweets crafted with care and tradition.</em>
            </p>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
     
    </div>
  );
};

export default CorporateBulkOrders;