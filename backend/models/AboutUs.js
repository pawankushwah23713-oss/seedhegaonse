// models/AboutUs.js
const mongoose = require('mongoose');

const aboutUsSchema = new mongoose.Schema(
  {
    heroTitle: {
      type: String,
      default: 'Our Story'
    },
    heroSubtitle: {
      type: String,
      default:
        "Bringing India's forgotten village sweets back to your table while preserving generations of authentic Halwai traditions."
    },

    journeyTitle: {
      type: String,
      default: 'Our Journey'
    },
    // Each array item renders as one <p> paragraph on the public page
    journeyParagraphs: {
      type: [String],
      default: [
        "Every village in India has a sweet that tells a story, yet many of these traditional delicacies and the skilled Halwai's behind them are slowly disappearing.",
        'Seedhe Gaon Se was born with a simple mission—to preserve India\'s authentic sweet heritage by bringing forgotten village delicacies directly to your home while supporting traditional Halwai\'s who have protected these recipes for generations.',
        'Every order you place is more than just a box of sweets. It is a step toward preserving traditions, empowering local artisans, and ensuring the authentic taste of rural India continues to thrive.'
      ]
    },

    whyWeExistTitle: {
      type: String,
      default: 'Why We Exist'
    },
    whyWeExistText: {
      type: String,
      default:
        "We believe every traditional sweet carries a story, every village has a legacy, and every Halwai deserves recognition for keeping India's rich culinary heritage alive."
    },

    promiseTitle: {
      type: String,
      default: 'Our Promise'
    },
    promiseParagraphs: {
      type: [String],
      default: [
        'At Seedhe Gaon Se, we promise to deliver much more than sweets—we deliver authenticity, freshness, quality, and trust.',
        "Every sweet is sourced directly from its place of origin and prepared by experienced village Halwai's using traditional recipes and premium ingredients.",
        "Our commitment is to preserve India's rich sweet heritage while supporting village artisans and bringing the genuine taste of tradition to every home."
      ]
    },

    quoteText: {
      type: String,
      default:
        'No Shortcuts. No False Promises. Just Authentic Village Sweets, Delivered with Honesty & Care.'
    },

    whatsappNumber: {
      type: String,
      default: '919876543210'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AboutUs', aboutUsSchema);