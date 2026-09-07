// models/AboutUs.js
const mongoose = require('mongoose');

// One repeatable content block. Admin can add as many of these as needed.
// style: 'card' = normal white section card, 'highlight' = special callout box.
const sectionSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    paragraphs: { type: [String], default: [] },
    style: { type: String, enum: ['card', 'highlight'], default: 'card' },
    badge: { type: String, default: '' } // optional emoji shown on the card, e.g. '❤️'
  },
  { _id: false }
);

// ⚠️ No hardcoded marketing copy anywhere in this schema — every field starts
// empty. All real content is entered by the admin through the admin page.
const aboutUsSchema = new mongoose.Schema(
  {
    heroTitle: { type: String, default: '' },
    heroSubtitle: { type: String, default: '' },
    sections: { type: [sectionSchema], default: [] },
    quoteText: { type: String, default: '' },
    whatsappNumber: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AboutUs', aboutUsSchema);