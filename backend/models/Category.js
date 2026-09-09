// models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // display label, e.g. "Ladoo"
    value: { type: String, required: true, trim: true, lowercase: true, unique: true }, // stored on products, e.g. "ladoo"
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },

    // 🟢 NEW: which navbar dropdown this category shows up in.
    // 'sweets' | 'cakes' | 'about' = existing dropdowns.
    // any other value (e.g. 'namkeen') = navbar auto-creates a brand new
    // top-level dropdown with that name.
    menuGroup: { type: String, trim: true, default: 'sweets' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);