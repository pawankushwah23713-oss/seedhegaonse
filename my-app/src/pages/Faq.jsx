import React, { useState } from "react";
import "./Faq.css";

// FAQ List with Top Bestseller & High Rating info
const faqList = [
  {
    q: "How do you guarantee Same Day Delivery in Delhi NCR?",
    a: "All orders placed before 4 PM in Delhi NCR are freshly prepared in the morning and dispatched via our express delivery partners.",
  },
  {
    q: "Which are your Top Best Seller and Highest Rated sweets?",
    a: "Our top bestsellers and highest 5-star rated sweets include Pure Desi Ghee Motichoor Ladoo, Traditional Mathura Peda, Royal Agra Kesar Angoori Petha, and Diamond Silver Foil Kaju Katli.",
  },
  {
    q: "Are preservatives or artificial flavours added?",
    a: "No! Absolutely 0 preservatives and 0 artificial flavours. We prepare sweets daily using 100% pure Desi Ghee.",
  },
  {
    q: "What is the shelf life of these traditional sweets?",
    a: "Our sweets remain perfectly fresh for 7 to 10 days at room temperature, and up to 15 days if refrigerated.",
  },
];

const Faq = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="faq-page-wrapper">
      <header className="faq-hero-banner">
        <h1 className="main-title">Frequently Asked Questions</h1>
        <p className="hero-subtitle">
          Everything you need to know about our sweets, delivery, and quality.
        </p>
      </header>

      <main className="faq-content-container">
        <section className="faq-section">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <div className="underline"></div>

          <div className="faq-accordion">
            {faqList.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className={`faq-item ${isOpen ? "faq-open" : ""}`}
                >
                  <button
                    type="button"
                    className="faq-question"
                    onClick={() => toggleFaq(index)}
                  >
                    <h4>{item.q}</h4>
                    <span className="faq-toggle-icon">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="faq-answer-content">
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Faq;