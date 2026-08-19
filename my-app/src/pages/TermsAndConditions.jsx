import React from 'react';
import './TermsAndConditions.css';

const termsData = [
  {
    title: 'Authentic Products',
    content:
      'All our sweets are sourced from their origin places and prepared using traditional methods. As handcrafted products, slight variations in colour, texture, shape and weight are natural but do not indicate a quality defect.',
  },
  {
    title: 'Product Availability',
    content:
      'Our sweets are prepared and procured in limited batches. Availability is subject to stock, seasonality and procurement schedules. We reserve the right to refuse or cancel any order due to unavailability.',
  },
  {
    title: 'Pricing',
    content:
      'All prices are displayed in Indian Rupees (INR) and are subject to change without prior notice. Applicable taxes and delivery charges, if any, will be displayed at checkout.',
  },
  {
    title: 'Order Confirmation',
    content:
      'An order shall be considered confirmed only after successful payment and receipt of an order confirmation from Seedhe Gaon Se.',
  },
  {
    title: 'Delivery',
    content:
      'Estimated delivery times are indicative and may vary due to weather, traffic, festivals, public holidays or unforeseen circumstances. While we strive for timely delivery, delays caused by third-party logistics partners are beyond our reasonable control.',
  },
  {
    title: 'Customer Responsibility',
    content:
      'Customers are responsible for providing accurate delivery details such as Address, Mobile no., location etc., and ensuring someone is available to receive the order and storing the sweets according to the storage instructions provided on the product page.',
  },
  {
    title: 'Cancellation',
    content:
      'As our products are freshly procured and perishable, orders may only be cancelled before packaging begins. Once product is packed or dispatched, cancellation requests may not be accepted.',
  },
  {
    title: 'Returns & Refunds',
    content:
      'Returns, replacements and refunds shall be governed exclusively by our Return & Refund Policy. Customers are advised to read the policy carefully before placing an order.',
  },
  {
    title: 'Intellectual Property',
    content:
      'All content, including our brand name, logo, product descriptions, photographs, graphics and website content, is the exclusive property of Seedhe Gaon Se and may not be copied, reproduced or used without prior written permission.',
  },
  {
    title: 'Limitation of Liability',
    content:
      'To the maximum extent permitted by applicable law, Seedhe Gaon Se’s liability shall be limited to the value of the product(s) purchased. We shall not be liable for indirect, incidental or consequential losses arising from delays, misuse, improper storage or circumstances beyond our reasonable control.',
  },
  {
    title: 'Right to Refuse Service',
    content:
      'We reserve the right to refuse, cancel or restrict any order in cases of suspected fraud, misuse of promotional offers, abusive conduct, repeated false claims or any activity that may adversely affect our business operations.',
  },
  {
    title: 'Governing Law & Jurisdiction',
    content:
      'These Terms & Conditions shall be governed by the laws of India. Any dispute arising from the use of this website or purchase of products shall be subject to the exclusive jurisdiction of the competent courts at New Delhi, India.',
  },
];

const TermsAndConditions = () => {
  return (
    <div className="terms-page-wrapper">
      <main className="terms-container">
        <h1 className="terms-main-title">Terms And Condition</h1>

        <div className="terms-card">
          <h2 className="terms-section-title">Terms &amp; Conditions</h2>
          
          <p className="terms-intro">
            Welcome to <strong>Seedhe Gaon Se</strong>. By accessing our website or placing an order, you agree to the following Terms &amp; Conditions.
          </p>

          <ul className="terms-list">
            {termsData.map((item, index) => (
              <li key={index} className="terms-list-item">
                <span className="terms-item-title">• {item.title}: </span>
                <span className="terms-item-desc">{item.content}</span>
              </li>
            ))}
          </ul>

          <p className="terms-footer">
            By using our website and placing an order, you acknowledge that you have read, understood and agreed to these Terms &amp; Conditions.
          </p>
        </div>
      </main>
    </div>
  );
};

export default TermsAndConditions;