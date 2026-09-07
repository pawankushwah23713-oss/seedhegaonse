import React, { useEffect, useState } from "react";
import "./AboutUs.css";

const API_BASE = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  ? process.env.REACT_APP_API_URL.replace('/auth', '')
  : (import.meta.env?.VITE_API_URL?.replace('/auth', '') || 'https://orange-ape-497824.hostingersite.com/api');

// Fallback content — used only if the backend has no About Us content saved yet,
// so the public page never looks broken/empty for visitors.
const defaultContent = {
  heroTitle: "Our Story",
  heroSubtitle:
    "Bringing India's forgotten village sweets back to your table while preserving generations of authentic Halwai traditions.",
  journeyTitle: "Our Journey",
  journeyParagraphs: [
    "Every village in India has a sweet that tells a story, yet many of these traditional delicacies and the skilled Halwai's behind them are slowly disappearing.",
    "Seedhe Gaon Se was born with a simple mission—to preserve India's authentic sweet heritage by bringing forgotten village delicacies directly to your home while supporting traditional Halwai's who have protected these recipes for generations.",
    "Every order you place is more than just a box of sweets. It is a step toward preserving traditions, empowering local artisans, and ensuring the authentic taste of rural India continues to thrive."
  ],
  whyWeExistTitle: "Why We Exist",
  whyWeExistText:
    "We believe every traditional sweet carries a story, every village has a legacy, and every Halwai deserves recognition for keeping India's rich culinary heritage alive.",
  promiseTitle: "Our Promise",
  promiseParagraphs: [
    "At Seedhe Gaon Se, we promise to deliver much more than sweets—we deliver authenticity, freshness, quality, and trust.",
    "Every sweet is sourced directly from its place of origin and prepared by experienced village Halwai's using traditional recipes and premium ingredients.",
    "Our commitment is to preserve India's rich sweet heritage while supporting village artisans and bringing the genuine taste of tradition to every home."
  ],
  quoteText:
    "No Shortcuts. No False Promises. Just Authentic Village Sweets, Delivered with Honesty & Care.",
  whatsappNumber: "919876543210"
};

const AboutUs = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [content, setContent] = useState(defaultContent);

  // Fetch dynamic About Us content from the backend (admin-managed).
  // Falls back to defaultContent above if nothing is saved yet or the request fails.
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch(`${API_BASE}/aboutus`);
        if (!res.ok) return; // keep defaultContent (e.g. 404 = not set up yet)
        const data = await res.json();
        setContent({
          heroTitle: data.heroTitle || defaultContent.heroTitle,
          heroSubtitle: data.heroSubtitle || defaultContent.heroSubtitle,
          journeyTitle: data.journeyTitle || defaultContent.journeyTitle,
          journeyParagraphs:
            Array.isArray(data.journeyParagraphs) && data.journeyParagraphs.length > 0
              ? data.journeyParagraphs
              : defaultContent.journeyParagraphs,
          whyWeExistTitle: data.whyWeExistTitle || defaultContent.whyWeExistTitle,
          whyWeExistText: data.whyWeExistText || defaultContent.whyWeExistText,
          promiseTitle: data.promiseTitle || defaultContent.promiseTitle,
          promiseParagraphs:
            Array.isArray(data.promiseParagraphs) && data.promiseParagraphs.length > 0
              ? data.promiseParagraphs
              : defaultContent.promiseParagraphs,
          quoteText: data.quoteText || defaultContent.quoteText,
          whatsappNumber: data.whatsappNumber || defaultContent.whatsappNumber
        });
      } catch (err) {
        console.error('Failed to load About Us content, showing defaults:', err);
      }
    };

    fetchContent();
  }, []);

  // Scroll to Top visibility logic
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for on-scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show-animate");
          }
        });
      },
      { threshold: 0.15 }
    );

    const animatedElements = document.querySelectorAll(".scroll-anim");
    animatedElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [content]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="about-wrapper">
      {/* 1. Header Banner: Our Story */}
      <header className="hero-banner scroll-anim fade-up">
        <h1 className="main-title">{content.heroTitle}</h1>
        <p className="hero-subtitle">{content.heroSubtitle}</p>
      </header>

      {/* 2. Main Content Container */}
      <main className="content-container">
        {/* Our Journey Section */}
        <section className="section-card scroll-anim fade-up">
          <div className="heart-badge" title="With Love">
            ❤️
          </div>
          <h2 className="section-title">{content.journeyTitle}</h2>
          <div className="underline"></div>

          <div className="journey-text">
            {content.journeyParagraphs.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>
        </section>

        {/* Why We Exist Box */}
        <div className="why-we-exist-box scroll-anim fade-left">
          <h3 className="why-title">{content.whyWeExistTitle}</h3>
          <p>{content.whyWeExistText}</p>
        </div>

        {/* Our Promise Section */}
        <section className="promise-section">
          <h2 className="section-title scroll-anim fade-up">{content.promiseTitle}</h2>
          <div className="underline scroll-anim fade-up"></div>

          {/* Promise Card */}
          <div className="promise-card scroll-anim fade-up">
            {content.promiseParagraphs.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>

          {/* Golden Quote Card */}
          <div className="quote-banner scroll-anim zoom-in">
            <blockquote className="kquote-text">
              {content.quoteText}
            </blockquote>
          </div>
        </section>
      </main>

      {/* 3. Floating Action Buttons */}
      <div className="floating-buttons">
        {/* WhatsApp Button */}
        <a
          href={`https://wa.me/${content.whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fab whatsapp-btn"
          title="Chat on WhatsApp"
        >
          <svg viewBox="0 0 24 24" width="28" height="28" fill="#ffffff">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.15 8.15 0 0 1-1.25-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.12.17 1.77 2.7 4.29 3.79.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.31z" />
          </svg>
        </a>

        {/* Scroll To Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fab scroll-top-btn"
            title="Scroll to top"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#ffffff">
              <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default AboutUs;