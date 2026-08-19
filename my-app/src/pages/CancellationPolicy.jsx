import React from 'react';
import './CancellationPolicy.css';

const CancellationPolicy = () => {
  return (
    <div className="policy-page-wrapper">
      <div className="policy-container">
        <h1 className="policy-title">Cancellation Policy</h1>

        <div className="policy-card">
          {/* Introduction */}
          <section className="policy-intro">
            <p>
              At <strong>Seedhe Gaon Se</strong>, our products are highly perishable, prepared in small batches, and freshly procured from our trusted village Halwai's based on your order confirmation. Because procurement and preparation begin almost immediately, cancellations are subject to strict terms.
            </p>
          </section>

          {/* Section 1 */}
          <section className="policy-section">
            <h2 className="section-heading">1. Cancellation timeframe</h2>
            <p className="section-content">
              Customers can request an order cancellation <strong>within 30 minutes</strong> of placing the order or before the order status moves to "Processing" / "Dispatched" (whichever is earlier). Once procurement begins or the batch is packed, we cannot accept any cancellation requests.
            </p>
          </section>

          {/* Section 2 */}
          <section className="policy-section">
            <h2 className="section-heading">2. How to request cancellation</h2>
            <p className="section-content">
              To request a cancellation within the permitted window, please contact our customer support team immediately via our designated helpline or support email with your active Order ID. Requests made outside business hours or through social media comments may not be processed in time.
            </p>
          </section>

          {/* Section 3 */}
          <section className="policy-section">
            <h2 className="section-heading">3. Cancellations by seedhe gaon se</h2>
            <p className="section-content">
              We reserve the right to cancel any order due to unforeseen circumstances, including but not limited to: non-availability of fresh stock from the Halwai, operational delivery constraints within your region in Delhi NCR, extreme weather conditions, or incorrect pricing/product details on the website. In such cases, a 100% refund will be initiated to your original payment mode.
            </p>
          </section>

          {/* Section 4 */}
          <section className="policy-section">
            <h2 className="section-heading">4. Failed deliveries as cancellations</h2>
            <p className="section-content">
              If an order cannot be delivered due to customer absence, a wrong phone number, an incorrect address, or refusal to accept the package, the order will be marked as cancelled from the customer's end. Due to the perishable nature of our products, <strong>no refunds</strong> will be issued for such cases.
            </p>
          </section>

          {/* Section 5 */}
          <section className="policy-section">
            <h2 className="section-heading">5. Refund processing for cancelled orders</h2>
            <p className="section-content">
              For valid cancellations approved by our support desk, the payment will be refunded to your original source account within <strong>7–10 business days</strong>, subject to standard bank processing guidelines.
            </p>
          </section>

          {/* Footer Agreement Note */}
          <div className="policy-agreement-footer">
            <p>
              By confirming your order with Seedhe Gaon Se, you explicitly agree to follow this Cancellation Policy.
            </p>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      
    </div>
  );
};

export default CancellationPolicy;