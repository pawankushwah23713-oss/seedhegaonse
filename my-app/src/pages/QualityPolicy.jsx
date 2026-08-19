import React from 'react';
import './QualityPolicy.css';

const QualityPolicy = () => {
  return (
    <div className="quality-page-wrapper">
      <div className="quality-container">
        <h1 className="quality-title">Quality Policy</h1>

        <div className="quality-card">
          {/* Introduction */}
          <section className="quality-intro">
            <p>
              At <strong>Seedhe Gaon Se</strong>, quality is not just a standard—it is our core promise. We are dedicated to bridging the gap between traditional village heritage and your doorstep by delivering authentic, unadulterated, and fresh regional sweets.
            </p>
          </section>

          {/* Section 1 */}
          <section className="quality-section">
            <h2 className="section-heading">1. Authentic sourcing</h2>
            <p className="section-content">
              Every product we offer is exclusively procured from renowned and trusted village Halwai’s who have preserved traditional recipes for generations. We do not mass-produce; we source in small, monitored batches to maintain the authentic taste, aroma, and integrity of heritage sweets.
            </p>
          </section>

          {/* Section 2 */}
          <section className="quality-section">
            <h2 className="section-heading">2. Freshness &amp; batch control</h2>
            <p className="section-content">
              Because our products are highly perishable and free from industrial bulk preservatives, we follow a strict procurement-against-order model. This ensures that items spent minimal time in transit and storage, reaching you at peak freshness.
            </p>
          </section>

          {/* Section 3 */}
          <section className="quality-section">
            <h2 className="section-heading">3. Hygiene &amp; handling standards</h2>
            <p className="section-content">
              We work closely with our village partners to emphasize hygiene and safe handling practices during preparation and collection. Once procured, our team carefully inspects and handles each batch under sanitary conditions before sealing it for distribution.
            </p>
          </section>

          {/* Section 4 */}
          <section className="quality-section">
            <h2 className="section-heading">4. Protective packaging</h2>
            <p className="section-content">
              To preserve the delicate texture and moisture balance of traditional sweets during transit across Delhi NCR, we use premium, food-grade packaging materials. Our outer shipping packages are designed to safeguard items from environmental exposure and tampering.
            </p>
          </section>

          {/* Section 5 */}
          <section className="quality-section">
            <h2 className="section-heading">5. Continuous improvement</h2>
            <p className="section-content">
              We actively listen to customer feedback regarding taste, texture, and delivery condition. Our quality control team regularly audits our partner Halwai workshops to ensure consistency in ingredients and preparation techniques, ensuring you always get the true taste of the village.
            </p>
          </section>

          {/* Footer Note */}
          <div className="quality-footer">
            <p>
              <em>We stand firmly behind the rich culinary arts of rural India and thank you for supporting traditional artisans through your trust in Seedhe Gaon Se.</em>
            </p>
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default QualityPolicy;