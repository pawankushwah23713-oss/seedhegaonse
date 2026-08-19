import React from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="policy-page-wrapper">
      <div className="policy-container">
        {/* Main Title */}
        <header className="policy-header">
          <h1 className="policy-main-title">Policies &amp; Guidelines</h1>
          <p className="policy-subtitle">
            Please review our company policies regarding privacy, shipping, returns, bulk orders, and rewards.
          </p>
          
          {/* Quick Jump Navigation */}
          <nav className="policy-nav-pills">
            <button onClick={() => scrollToSection('privacy')}>Privacy</button>
            <button onClick={() => scrollToSection('shipping')}>Shipping</button>
            <button onClick={() => scrollToSection('refunds')}>Returns &amp; Refunds</button>
            <button onClick={() => scrollToSection('bulk-orders')}>Corporate &amp; Bulk</button>
            <button onClick={() => scrollToSection('rewards')}>Coupons &amp; Rewards</button>
          </nav>
        </header>

        {/* Content Container */}
        <div className="policy-card">
          
          {/* 1. Privacy Policy */}
          <section id="privacy" className="policy-section">
            <h2 className="policy-section-title">Privacy Policy</h2>
            <p>
              At <strong>Seedhe Gaon Se</strong>, your privacy is important to us. We collect only the information necessary to process your orders, provide customer support and improve your shopping experience. This may include your name, mobile number, email address, delivery address and payment details.
            </p>
            <p>
              Your payment information is processed through secure payment gateways, and we do not store your debit/credit card details on our servers. We do not sell, rent or share your personal information with any third party for marketing purposes. Your information may only be shared with trusted logistics, payment and technology partners strictly for order fulfilment and service-related purposes.
            </p>
            <p>
              By using our website, you consent to the collection and use of your information in accordance with this Privacy Policy. We reserve the right to update this policy from time to time, and the revised version will be effective upon publication on our website.
            </p>
          </section>

          <hr className="policy-divider" />

          {/* 2. Shipping Policy */}
          <section id="shipping" className="policy-section">
            <h2 className="policy-section-title">Shipping Policy</h2>
            <p>
              At <strong>Seedhe Gaon Se</strong>, every order is freshly procured from our trusted village Halwai’s. Since our products are perishable and prepared in small batches, we strive to dispatch all confirmed orders at the earliest to preserve their authentic taste and freshness.
            </p>
            <p>
              We currently offer delivery across Delhi NCR through our trusted delivery partners. Delivery timelines are indicative and may vary due to weather conditions, traffic, public holidays, operational constraints, or circumstances beyond our reasonable control. While we make every effort to ensure timely delivery, exact delivery times cannot be guaranteed.
            </p>
            <p>
              Customers are requested to provide a complete and accurate delivery address, landmark, and contact number while placing the order. Seedhe Gaon Se shall not be responsible for delays, failed deliveries, or additional delivery charges arising from incorrect or incomplete address details, customer unavailability, or unreachable contact numbers.
            </p>
            <p>
              Ownership and risk of the products pass to the customer upon successful delivery at the provided address. Customers are requested to inspect the outer packaging immediately upon delivery and report any visible damage or tampering without delay.
            </p>
            <p>
              In case a delivery is unsuccessful due to customer absence, refusal to accept the parcel, incorrect address, or repeated unsuccessful delivery attempts, the order shall be treated as cancelled from the customer’s end. As the products are freshly procured and highly perishable, shipping charges and other applicable costs shall not be refundable.
            </p>
            <p>
              For bulk, corporate, festive, and wedding orders, delivery schedules are planned in advance. Customers are requested to ensure the availability of an authorised recipient at the delivery location. Any delay caused by the customer may affect product freshness, for which Seedhe Gaon Se shall not be held liable.
            </p>
            <p>
              We continuously work towards delivering authentic village sweets in the freshest possible condition and appreciate your understanding and cooperation in helping us maintain the highest quality standards.
            </p>
          </section>

          <hr className="policy-divider" />

          {/* 3. Return & Refund Policy */}
          <section id="refunds" className="policy-section">
            <h2 className="policy-section-title">Return &amp; Refund Policy</h2>
            <p>
              At <strong>Seedhe Gaon Se</strong>, every sweet is freshly sourced from renowned village Halwai’s and prepared in limited batches. As our products are perishable food items, returns and refunds are accepted only under the conditions mentioned below:
            </p>
            <ul className="policy-bullet-list">
              <li>
                <strong>Damaged / Tampered Items:</strong> If you receive a damaged, spoiled, incorrect or tampered product, you must inform us within 60 minutes of delivery by sharing a continuous, unedited unboxing video clearly showing the sealed package being opened. Claims without a complete unboxing video may not be accepted.
              </li>
              <li>
                <strong>Resolution:</strong> Once your claim is verified by our quality team, we may, at our sole discretion, offer only a replacement depending upon the nature of the issue but no refund shall be paid.
              </li>
              <li>
                <strong>Non-Eligible Returns:</strong> Returns requested for reasons such as change of mind, personal taste or preference, delayed consumption, improper storage, incorrect shipping address provided by the customer, refusal to accept delivery, or natural changes in texture due to shelf life shall not be eligible for a refund or replacement.
              </li>
              <li>
                <strong>Voluntary Returns:</strong> If a customer voluntarily wishes to return an undamaged order after delivery, the product must be shipped back at the customer’s own expense in its original sealed condition. After successful inspection and subject to approval by our quality team, up to 50% of the product value may be refunded. Shipping, packaging, payment gateway charges and other operational costs are non-refundable.
              </li>
              <li>
                <strong>Refund Processing:</strong> Refunds, wherever approved, shall be processed through the original mode of payment within 7–10 business days after successful verification and, where applicable, receipt and inspection of the returned product.
              </li>
            </ul>
            <p className="policy-note">
              By placing an order with Seedhe Gaon Se, the customer acknowledges and agrees to this Return &amp; Refund Policy.
            </p>
          </section>

          <hr className="policy-divider" />

          {/* 4. Corporate, Wedding & Bulk Order Policy */}
          <section id="bulk-orders" className="policy-section">
            <h2 className="policy-section-title">Corporate, Wedding &amp; Bulk Order Policy</h2>
            <p>
              At <strong>Seedhe Gaon Se</strong>, we proudly cater to corporate gifting, weddings, festivals, family functions, and bulk celebrations with authentic traditional sweets sourced directly from renowned village Halwai’s.
            </p>
            <p>
              To ensure freshness and timely procurement, bulk orders should preferably be placed at least 4–5 days in advance. While we strive to accommodate urgent requests, acceptance of last-minute orders depends entirely on product availability and production capacity.
            </p>
            <p>
              A minimum order quantity (MOQ) may apply to avail bulk pricing and special discounts. Discounts are offered based on the order quantity, product selection, delivery location, and seasonal demand.
            </p>
            <p>
              For all corporate and bulk orders, complete 100% advance payment is mandatory to confirm the booking. Production and procurement commence only after the advance amount is received. Once the order enters the production or procurement stage, it cannot be cancelled, modified, or refunded.
            </p>
            <p>
              As our sweets are handcrafted using traditional methods and fresh ingredients, minor variations in colour, texture, size, or weight are natural and do not constitute a manufacturing defect.
            </p>
            <p>
              The customer is responsible for providing accurate delivery details and ensuring the availability of the recipient at the time of delivery. Additional delivery attempts, address changes after dispatch, or special delivery requests may attract extra logistics charges.
            </p>
            <p>
              For personalised branding, customised gift boxes, printed sleeves, greeting cards, or corporate packaging, separate charges may apply and such customised orders are non-returnable and non-refundable.
            </p>
            <p className="policy-note">
              Our commitment is to make your special occasion memorable by delivering authentic, fresh, and premium-quality sweets crafted with care and tradition.
            </p>
          </section>

          <hr className="policy-divider" />

          {/* 5. Coupon, Loyalty Points & Rewards Policy */}
          <section id="rewards" className="policy-section">
            <h2 className="policy-section-title">Coupon, Loyalty Points &amp; Rewards Policy</h2>
            <p>
              At <strong>Seedhe Gaon Se</strong>, we value every customer and may, at our sole discretion, offer promotional coupons, loyalty points, cash back offers, referral rewards, festive benefits or other promotional incentives from time to time. Such offers are intended solely to reward genuine customers and enhance their shopping experience.
            </p>
            <p>
              Coupons, loyalty points and rewards are promotional benefits with no cash value, are non-transferable, and cannot be exchanged for cash, refunded or combined with any other offer unless expressly stated. Unless otherwise specified, only one coupon or promotional offer may be redeemed per order.
            </p>
            <p>
              Each coupon, reward or loyalty benefit is subject to its own validity period, minimum order value, eligible products and other applicable terms. Expired, altered, duplicated or misused coupons shall be deemed invalid and will not be accepted under any circumstances.
            </p>
            <p>
              Seedhe Gaon Se reserves the right to modify, suspend, reject or cancel any coupon, loyalty points or reward in cases of suspected fraud, misuse, duplicate accounts, technical errors or violation of these Terms &amp; Conditions, without prior notice or liability.
            </p>
            <p>
              The Company further reserves the absolute right to introduce, modify or discontinue any loyalty programme, reward scheme or promotional campaign at any time without assigning any reason. Participation in such programmes shall constitute acceptance of this Policy and the Company’s decision regarding all promotional benefits shall be final and binding.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;