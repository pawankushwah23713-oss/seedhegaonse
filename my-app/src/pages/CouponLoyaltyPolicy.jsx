import React from 'react';
import './CouponLoyaltyPolicy.css';

const CouponLoyaltyPolicy = () => {
  return (
    <div className="loyalty-page-wrapper">
      <div className="loyalty-container">
        <h1 className="loyalty-title">Coupon &amp; Loyalty Policy</h1>

        <div className="loyalty-card">
          {/* Introduction */}
          <section className="loyalty-intro">
            <p>
              At <strong>Seedhe Gaon Se</strong>, we value every customer and may, at our sole discretion, offer promotional coupons, loyalty points, cash back offers, referral rewards, festive benefits or other promotional incentives from time to time. Such offers are intended solely to reward genuine customers and enhance their shopping experience.
            </p>
          </section>

          {/* Section 1 */}
          <section className="loyalty-section">
            <h2 className="section-heading">1. Nature of promotional benefits</h2>
            <p className="section-content">
              Coupons, loyalty points and rewards are promotional benefits with <strong>no cash value</strong>, <strong>are non-transferable</strong>, and cannot be exchanged for cash, refunded or combined with any other offer unless expressly stated. Unless otherwise specified, only <strong>one coupon or promotional offer</strong> may be redeemed per order.
            </p>
          </section>

          {/* Section 2 */}
          <section className="loyalty-section">
            <h2 className="section-heading">2. Validity &amp; usage conditions</h2>
            <p className="section-content">
              Each coupon, reward or loyalty benefit is subject to its own validity period, minimum order value, eligible products and other applicable terms. Expired, altered, duplicated or misused coupons shall be deemed invalid and will not be accepted under any circumstances.
            </p>
          </section>

          {/* Section 3 */}
          <section className="loyalty-section">
            <h2 className="section-heading">3. Fraud prevention &amp; account fairness</h2>
            <p className="section-content">
              <strong>Seedhe Gaon Se</strong> reserves the right to modify, suspend, reject or cancel any coupon, loyalty points or reward in cases of suspected fraud, misuse, duplicate accounts, technical errors or violation of these Terms &amp; Conditions, without prior notice or liability.
            </p>
          </section>

          {/* Section 4 */}
          <section className="loyalty-section last-section">
            <h2 className="section-heading">4. Right of discontinuation</h2>
            <p className="section-content">
              The Company further reserves the absolute right to introduce, modify or discontinue any loyalty programme, reward scheme or promotional campaign at any time without assigning any reason. Participation in such programmes shall constitute acceptance of this Policy and the Company’s decision regarding all promotional benefits shall be final and binding.
            </p>
          </section>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
    
    </div>
  );
};

export default CouponLoyaltyPolicy;